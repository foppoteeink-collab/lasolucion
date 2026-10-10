import React, { useEffect, useRef, useState, useCallback } from 'react';
import { deduplicateTasksForDay, deduplicateHabits, isDuplicateActivity } from '../utils/taskDeduplication';
import { doc, onSnapshot, setDoc, getDoc, getDocs, getDocFromServer, getDocsFromServer, collection, writeBatch } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { useAuth } from '../context/AuthContext';
import { usePlayerStore } from '../store/usePlayerStore';
import { useTaskStore } from '../store/useTaskStore';
import {
  PlayerStats,
  TaskItem,
  ShopReward,
  PomodoroSession,
  AppNotification,
  HabitMasteryRecord,
  Companion,
  SkillNode,
  GameSettings,
  CustomHabit,
} from '../types';
import {
  saveHabitMastery,
  saveDailyReflections,
  saveShopRewards,
  savePomodoroHistory,
  saveNotifications,
  saveGameSettings,
  saveSkillTree,
  saveCompanion,
  safeSetItem,
} from '../utils/storage';
import { getRankForLevel, generateDailyTasks } from '../data/defaults';
import { getTodayDateString } from '../utils/date';

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error' | 'local';

export interface CloudSyncResult {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  forceSyncNow: () => Promise<boolean>;
  pullFromCloudNow?: () => Promise<boolean>;
  isOnline: boolean;
}

const sanitizeForFirestore = (obj: any) => {
  return JSON.parse(JSON.stringify(obj));
};

/* ============================================================================
 * CONFLICT RESOLUTION & RESILIENT DATA MERGING HELPERS
 * ============================================================================
 * These functions guarantee that when remote cloud data arrives (or when connection
 * recovers after offline periods), local offline progress (streaks, completed tasks,
 * XP, Pomodoro sessions) is NEVER overwritten or wiped out by stale snapshots.
 */

/**
 * Merges local and remote PlayerStats, protecting streakDays, XP, level, and RPG stats.
 */
export function mergePlayerStats(local: PlayerStats, remote: PlayerStats): PlayerStats {
  if (!local) return remote;
  if (!remote) return local;

  // CRITICAL: Protect streaks, level, total XP, and coins from regressing
  const streakDays = Math.max(local.streakDays || 0, remote.streakDays || 0);
  const level = Math.max(local.level || 1, remote.level || 1);
  const totalXpEarned = Math.max(local.totalXpEarned || 0, remote.totalXpEarned || 0);
  const coins = Math.max(local.coins || 0, remote.coins || 0);

  // Preserve local XP if local level is higher or equal; otherwise use remote XP
  const currentXp = (local.level || 1) > (remote.level || 1)
    ? local.currentXp
    : (remote.level || 1) > (local.level || 1)
    ? remote.currentXp
    : Math.max(local.currentXp || 0, remote.currentXp || 0);
  const requiredXp = (local.level || 1) >= (remote.level || 1) ? local.requiredXp : remote.requiredXp;

  // Most recent dates for daily rewards and activity
  const lastActiveDate = (local.lastActiveDate || '') > (remote.lastActiveDate || '')
    ? local.lastActiveDate
    : (remote.lastActiveDate || local.lastActiveDate);

  const lastDailyRewardClaimedDate = (local.lastDailyRewardClaimedDate || '') > (remote.lastDailyRewardClaimedDate || '')
    ? local.lastDailyRewardClaimedDate
    : (remote.lastDailyRewardClaimedDate || local.lastDailyRewardClaimedDate);

  const lastBossDefeatedDate = (local.lastBossDefeatedDate || '') > (remote.lastBossDefeatedDate || '')
    ? local.lastBossDefeatedDate
    : (remote.lastBossDefeatedDate || local.lastBossDefeatedDate);

  // Union of finalized daily summaries and sleep logs across devices/offline sessions
  const finalizedDays = {
    ...(remote.finalizedDays || {}),
    ...(local.finalizedDays || {}),
  };

  const sleepLogs = {
    ...(remote.sleepLogs || {}),
    ...(local.sleepLogs || {}),
  };

  const phaseHistory = {
    ...(remote.phaseHistory || {}),
    ...(local.phaseHistory || {}),
  };

  // RPG Attributes: take maximum of each attribute to preserve offline stat gains
  const attributes = {
    disciplina: Math.max(local.attributes?.disciplina || 0, remote.attributes?.disciplina || 0),
    fuerza: Math.max(local.attributes?.fuerza || 0, remote.attributes?.fuerza || 0),
    mente: Math.max(local.attributes?.mente || 0, remote.attributes?.mente || 0),
    energia: Math.max(local.attributes?.energia || 0, remote.attributes?.energia || 0),
    estudio: Math.max(local.attributes?.estudio || 0, remote.attributes?.estudio || 0),
  };

  // Prefer remote profile identity fields if local has empty/default values
  const pickStr = (remVal?: string, locVal?: string, defaultIgnore?: string) => {
    const r = (remVal || '').trim();
    const l = (locVal || '').trim();
    if (r && (!l || l === defaultIgnore)) return r;
    return r || l;
  };

  return {
    ...local,
    ...remote,
    fullName: pickStr(remote.fullName, local.fullName),
    profession: pickStr(remote.profession, local.profession),
    bio: pickStr(remote.bio, local.bio),
    mantra: pickStr(remote.mantra, local.mantra),
    mainGoal: pickStr(remote.mainGoal, local.mainGoal),
    characterClass: pickStr(remote.characterClass, local.characterClass, 'Aventurero'),
    level,
    currentXp,
    requiredXp,
    totalXpEarned,
    coins,
    streakDays,
    lastActiveDate,
    lastDailyRewardClaimedDate,
    lastBossDefeatedDate,
    finalizedDays,
    sleepLogs,
    phaseHistory,
    attributes,
    rankTitle: (() => {
      const finalLevel = Math.max(local.level || 1, remote.level || 1);
      return getRankForLevel(finalLevel).title;
    })(),
  };
}

const isDefaultDayOnePlaceholder = (t: TaskItem): boolean => {
  if (!t || t.completed) return false;
  const idStr = String(t.id || '');
  const titleLower = (t.title || '').toLowerCase();
  if (idStr.startsWith('default-') || idStr.startsWith('day1-') || idStr.startsWith('task-calib-')) return true;
  if (
    titleLower.includes('calibrar hábitos en el oráculo') ||
    titleLower.includes('calibrar habitos en el oraculo') ||
    titleLower.includes('calibrar interfaz') ||
    titleLower.includes('sintonizar puente neural') ||
    titleLower.includes('forjar tu primer escudo') ||
    titleLower.includes('iniciar calibración de enfoque') ||
    titleLower.includes('ejecución de misión principal') ||
    titleLower.includes('revisión nocturna de bitácora')
  ) {
    return true;
  }
  return false;
};

/**
 * Merges local and remote tasks per date, keeping union of tasks and keeping completion statuses intact.
 */
export function mergeTasksByDate(
  local: Record<string, TaskItem[]>,
  remote: Record<string, TaskItem[]>
): Record<string, TaskItem[]> {
  const allDates = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);
  const result: Record<string, TaskItem[]> = {};
  const anyRemoteHasCustomSchedule = Object.values(remote || {}).some(list =>
    Array.isArray(list) && list.some(t => t && !isDefaultDayOnePlaceholder(t) && !t.isQuickHabit && !t.isTracked2166)
  );

  for (const dateKey of allDates) {
    const localList = local[dateKey] || [];
    const remoteList = remote[dateKey] || [];
    const remoteHasCustomSchedule =
      anyRemoteHasCustomSchedule ||
      remoteList.some(t => t && !isDefaultDayOnePlaceholder(t) && !t.isQuickHabit && !t.isTracked2166);

    const mergedList: TaskItem[] = [];

    // 1. Add remote tasks first, preserving completion status and habit progress
    for (const task of remoteList) {
      if (task && (task.id || task.title)) {
        if (anyRemoteHasCustomSchedule && isDefaultDayOnePlaceholder(task)) continue;
        const isCompleted = Boolean(
          task.completed ||
          (task.targetCount !== undefined && task.currentCount !== undefined && task.currentCount >= task.targetCount)
        );
        mergedList.push({
          ...task,
          completed: isCompleted,
          completedAt: isCompleted ? (task.completedAt || new Date().toISOString()) : undefined,
        });
      }
    }

    // 2. Process local tasks: keep local completion status while allowing deduplicateTasksForDay to merge by ID or activity
    for (const localTask of localList) {
      if (!localTask || (!localTask.id && !localTask.title)) continue;
      if (remoteHasCustomSchedule && isDefaultDayOnePlaceholder(localTask)) continue;

      const isLocalCompleted = Boolean(
        localTask.completed ||
        (localTask.targetCount !== undefined && localTask.currentCount !== undefined && localTask.currentCount >= localTask.targetCount)
      );
      mergedList.push({
        ...localTask,
        completed: isLocalCompleted,
        completedAt: isLocalCompleted ? (localTask.completedAt || new Date().toISOString()) : undefined,
      });
    }

    result[dateKey] = deduplicateTasksForDay(mergedList, dateKey);
  }

  return result;
}

/**
 * Ensures that if any task was completed today on the source device (either under todayKey,
 * under the source device's activeViewDate, or with a completedAt timestamp matching todayKey),
 * the corresponding task in todayKey on the target device inherits its completed status and progress.
 */
export function propagateTodayCompletions(
  tasksMap: Record<string, TaskItem[]>,
  todayKey: string,
  sourceActiveDate?: string
): Record<string, TaskItem[]> {
  if (!tasksMap || typeof tasksMap !== 'object') return {};
  const todayList = tasksMap[todayKey];
  if (!Array.isArray(todayList) || todayList.length === 0) return tasksMap;

  const completedOrProgressedToday: TaskItem[] = [];
  for (const [dKey, list] of Object.entries(tasksMap)) {
    if (!Array.isArray(list)) continue;
    for (const t of list) {
      if (!t || !t.title) continue;
      const completedTodayByTimestamp = Boolean(
        t.completed && t.completedAt && getTodayDateString(new Date(t.completedAt)) === todayKey
      );
      const isFromActiveSession = dKey === todayKey || (Boolean(sourceActiveDate) && dKey === sourceActiveDate);
      const isCompleted = Boolean(
        t.completed || (t.targetCount !== undefined && t.currentCount !== undefined && t.currentCount >= t.targetCount)
      );
      const hasProgress = (t.currentCount || 0) > 0;

      if (completedTodayByTimestamp || (isFromActiveSession && (isCompleted || hasProgress))) {
        completedOrProgressedToday.push({
          ...t,
          completed: isCompleted,
          completedAt: isCompleted ? (t.completedAt || new Date().toISOString()) : undefined,
        });
      }
    }
  }

  if (completedOrProgressedToday.length === 0) return tasksMap;

  const updatedTodayList = todayList.map((task) => {
    const match = completedOrProgressedToday.find(
      (c) => (c.id && task.id && c.id === task.id) || isDuplicateActivity(task, c)
    );
    if (!match) return task;

    const mergedCount =
      task.currentCount !== undefined || match.currentCount !== undefined
        ? Math.max(task.currentCount || 0, match.currentCount || 0)
        : undefined;
    const targetCount = task.targetCount || match.targetCount;
    const isCompleted = Boolean(
      task.completed ||
        match.completed ||
        (targetCount !== undefined && mergedCount !== undefined && mergedCount >= targetCount)
    );

    return {
      ...task,
      completed: isCompleted,
      completedAt: isCompleted ? (task.completedAt || match.completedAt || new Date().toISOString()) : undefined,
      rewardClaimed: isCompleted ? Boolean(task.rewardClaimed || match.rewardClaimed) : false,
      currentCount: mergedCount,
      awardedXp: Math.max(task.awardedXp || 0, match.awardedXp || 0),
      awardedCoins: Math.max(task.awardedCoins || 0, match.awardedCoins || 0),
      chestAwarded: Boolean(task.chestAwarded || match.chestAwarded),
      notes: task.notes || match.notes,
    };
  });

  return {
    ...tasksMap,
    [todayKey]: deduplicateTasksForDay(updatedTodayList, todayKey),
  };
}

/**
 * Merges Habit Mastery records keeping maximum streaks and mastery flags.
 */
export function mergeHabitMastery(
  local: Record<string, HabitMasteryRecord>,
  remote: Record<string, HabitMasteryRecord>
): Record<string, HabitMasteryRecord> {
  const result: Record<string, HabitMasteryRecord> = { ...(remote || {}) };

  for (const [id, localRecord] of Object.entries(local || {})) {
    if (!result[id]) {
      result[id] = localRecord;
    } else {
      const remoteRecord = result[id];
      result[id] = {
        ...remoteRecord,
        ...localRecord,
        currentStreak: Math.max(localRecord.currentStreak || 0, remoteRecord.currentStreak || 0),
        highestStreak: Math.max(localRecord.highestStreak || 0, remoteRecord.highestStreak || 0),
        isMaltzReached: localRecord.isMaltzReached || remoteRecord.isMaltzReached,
        isMastered: localRecord.isMastered || remoteRecord.isMastered,
        shieldActive: localRecord.shieldActive || remoteRecord.shieldActive,
        multiplier: Math.max(localRecord.multiplier || 1, remoteRecord.multiplier || 1),
      };
    }
  }

  return result;
}

/**
 * Merges Pomodoro history sessions without losing offline completed sessions.
 */
export function mergePomodoroSessions(
  local: PomodoroSession[],
  remote: PomodoroSession[]
): PomodoroSession[] {
  const map = new Map<string, PomodoroSession>();
  for (const s of remote || []) {
    if (s && s.id) map.set(s.id, s);
  }
  for (const s of local || []) {
    if (s && s.id) map.set(s.id, s);
  }
  return Array.from(map.values()).sort((a, b) =>
    (b.completedAt || '').localeCompare(a.completedAt || '')
  );
}

/**
 * Merges Shop Rewards keeping unlocked counts.
 */
export function mergeShopRewards(local: ShopReward[], remote: ShopReward[]): ShopReward[] {
  const map = new Map<string, ShopReward>();
  for (const r of remote || []) {
    if (r && r.id) map.set(r.id, r);
  }
  for (const r of local || []) {
    if (!r || !r.id) continue;
    const existing = map.get(r.id);
    if (!existing) {
      map.set(r.id, r);
    } else {
      map.set(r.id, {
        ...existing,
        ...r,
        unlockedCount: Math.max(existing.unlockedCount || 0, r.unlockedCount || 0),
      });
    }
  }
  return Array.from(map.values());
}

/**
 * Merges Skill Tree nodes preserving unlocks.
 */
export function mergeSkillTree(local: SkillNode[], remote: SkillNode[]): SkillNode[] {
  const map = new Map<string, SkillNode>();
  for (const s of remote || []) {
    if (s && s.id) map.set(s.id, s);
  }
  for (const s of local || []) {
    if (!s || !s.id) continue;
    const existing = map.get(s.id);
    if (!existing) {
      map.set(s.id, s);
    } else {
      map.set(s.id, {
        ...existing,
        ...s,
        isUnlocked: existing.isUnlocked || s.isUnlocked,
      });
    }
  }
  return Array.from(map.values());
}

export const useCloudSync = (
  shopRewards: ShopReward[],
  setShopRewards: React.Dispatch<React.SetStateAction<ShopReward[]>>,
  pomodoroSessions: PomodoroSession[],
  setPomodoroSessions: React.Dispatch<React.SetStateAction<PomodoroSession[]>>,
  notifications: AppNotification[],
  setNotifications: React.Dispatch<React.SetStateAction<AppNotification[]>>,
  habitMastery: Record<string, HabitMasteryRecord>,
  setHabitMastery: React.Dispatch<React.SetStateAction<Record<string, HabitMasteryRecord>>>,
  reflections: Record<string, string>,
  setReflections: React.Dispatch<React.SetStateAction<Record<string, string>>>,
  gameSettings: GameSettings,
  setGameSettings: React.Dispatch<React.SetStateAction<GameSettings>>,
  skillTree: SkillNode[],
  setSkillTree: React.Dispatch<React.SetStateAction<SkillNode[]>>,
  companion: Companion | null,
  setCompanion: React.Dispatch<React.SetStateAction<Companion | null>>,
  expenses: any[],
  setExpenses: React.Dispatch<React.SetStateAction<any[]>>
): CloudSyncResult => {
  const { user } = useAuth();
  
  // Connect to Zustand stores
  const { stats, setStats } = usePlayerStore();
  const { tasksByDate, setTasksByDate, customHabits, setCustomHabits } = useTaskStore();

  const [syncStatus, setSyncStatus] = useState<SyncStatus>(user ? 'saving' : 'local');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  });

  // Tracking flags to avoid infinite cyclic write/read loops
  const isApplyingRemoteRef = useRef(false);
  const initialLoadDoneRef = useRef(false);
  const isSavingRef = useRef(false);

  // Monitor network status and trigger automatic sync when online status changes
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (user) {
        setSyncStatus('saving');
        // Instantly force a sync write to push buffered offline changes
        performSave();
      }
    };
    const handleOffline = () => {
      setIsOnline(false);
      if (user) {
        setSyncStatus('offline');
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user]);

  const DEFAULT_SYNC_BRIDGE = 'la_solucion_bridge';

  const hasMeaningfulLocalData = useCallback(
    (s?: PlayerStats, tByDate?: Record<string, TaskItem[]>, habits?: CustomHabit[]): boolean => {
      if (Array.isArray(habits) && habits.length > 0) return true;
      if (s && ((s.totalTasksCompleted || 0) > 0 || (s.level || 1) > 1 || (s.totalXp || 0) > 0)) return true;
      if (tByDate && typeof tByDate === 'object') {
        for (const list of Object.values(tByDate)) {
          if (Array.isArray(list) && list.some((t) => t && !isDefaultDayOnePlaceholder(t))) {
            return true;
          }
        }
      }
      return false;
    },
    []
  );

  // Function to execute cloud save with error recovery
  const performSave = useCallback(
    async (overrideData?: any, isManualForce: boolean = false): Promise<boolean> => {
      const isSimActive = (typeof window !== 'undefined' && ((window as any).__isSimulationActive || localStorage.getItem('taskquest_simulation_active') === 'true'));
      if (!db || (window as any).__isResettingAccount || isSimActive) return false;

      // NETWORK CHECK: If offline, transition syncStatus gracefully without network error
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline');
        return false;
      }

      const liveStats = usePlayerStore.getState().stats || stats;
      const liveTaskState = useTaskStore.getState();
      const rawTasksData = overrideData?.tasksByDate || liveTaskState.tasksByDate || tasksByDate;
      const habitsData = overrideData?.customHabits || liveTaskState.customHabits || customHabits;
      const canWriteBridge = isManualForce || hasMeaningfulLocalData(liveStats, rawTasksData, habitsData);

      // Don't let a brand-new uncalibrated device overwrite the shared bridge on background auto-save
      if (!user && !canWriteBridge) {
        return false;
      }

      try {
        isSavingRef.current = true;
        setSyncStatus('saving');

        const todayKey = getTodayDateString();
        const activeViewDate = liveTaskState.currentViewDate || todayKey;
        const tasksData = propagateTodayCompletions(rawTasksData || {}, todayKey, activeViewDate);

        let finalBridgeTasks = tasksData;
        const bridgeRef = doc(db, 'sync_transfers', DEFAULT_SYNC_BRIDGE);

        // On background auto-saves, merge with existing bridge tasks so a secondary device never overwrites completed tasks
        if (canWriteBridge && !isManualForce) {
          try {
            const existingBridgeSnap = await getDoc(bridgeRef);
            if (existingBridgeSnap.exists()) {
              const existingData = existingBridgeSnap.data();
              if (existingData?.tasksByDate) {
                finalBridgeTasks = propagateTodayCompletions(
                  mergeTasksByDate(tasksData, existingData.tasksByDate),
                  todayKey,
                  existingData.activeViewDate || activeViewDate
                );
              }
            }
          } catch {
            // Proceed with local tasksData if bridge read fails
          }
        }

        const dataToSave = overrideData || {
          stats: liveStats,
          tasksByDate: finalBridgeTasks,
          habitMastery,
          customHabits: habitsData,
          reflections,
          shopRewards,
          pomodoroSessions,
          notifications,
          gameSettings,
          skillTree,
          companion,
          expenses,
          activeViewDate,
          lastUpdated: new Date().toISOString(),
        };

        const payload = sanitizeForFirestore({
          ...dataToSave,
          activeViewDate,
          lastUpdated: dataToSave.lastUpdated || new Date().toISOString(),
        });

        // 1. Always write to universal cross-device bridge when this device has real data or user clicked "Subir datos"
        if (canWriteBridge) {
          await setDoc(bridgeRef, payload);
        }

        // 2. If signed in with Google, also save primary user document and monthly shards
        if (user) {
          const userRef = doc(db, 'users', user.uid);
          await setDoc(userRef, payload);

          if (finalBridgeTasks) {
            try {
              const batch = writeBatch(db);
              const tasksByMonth: Record<string, Record<string, TaskItem[]>> = {};
              for (const [date, tasks] of Object.entries(finalBridgeTasks)) {
                const match = date.match(/^(\d{4})-(\d{2})/);
                if (match) {
                  const monthKey = `${match[1]}_${match[2]}`;
                  if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = {};
                  tasksByMonth[monthKey][date] = sanitizeForFirestore(tasks);
                }
              }
              for (const [monthKey, monthTasks] of Object.entries(tasksByMonth)) {
                const monthRef = doc(db, 'users', user.uid, 'task_months', monthKey);
                batch.set(monthRef, { tasksByDate: monthTasks });
              }
              await batch.commit();
            } catch (monthErr) {
              console.warn('[CloudSync] task_months write note:', monthErr);
            }
          }
        }

        setLastSyncTime(new Date());
        setSyncStatus('synced');
        isSavingRef.current = false;
        return true;
      } catch (err: any) {
        isSavingRef.current = false;
        console.warn('[CloudSync] Firestore write exception caught:', err?.message || err);

        // Permissions error handling
        if (
          user &&
          (err?.message?.includes('permission') ||
            err?.message?.includes('Missing or insufficient permissions'))
        ) {
          try {
            handleFirestoreError(err, OperationType.WRITE, `users/${user.uid}`, auth);
          } catch (syncErr) {
            console.warn('[CloudSync] Permission handler note:', syncErr);
          }
        }

        // Network error handling: fallback gracefully to offline mode
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setSyncStatus('offline');
        } else {
          setSyncStatus('error');
        }
        return false;
      }
    },
    [
      user,
      stats,
      tasksByDate,
      habitMastery,
      customHabits,
      reflections,
      shopRewards,
      pomodoroSessions,
      notifications,
      gameSettings,
      skillTree,
      companion,
      expenses,
      hasMeaningfulLocalData,
    ]
  );

  // Expose global immediate cloud sync trigger for task/habit completion actions
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).__triggerCloudSyncNow = () => {
        performSave(undefined, true);
      };
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).__triggerCloudSyncNow;
      }
    };
  }, [performSave]);

  // 1. Real-time Firestore Listener (Cloud -> Client) with Conflict Resolution
  useEffect(() => {
    if (!db) {
      setSyncStatus('local');
      initialLoadDoneRef.current = false;
      return;
    }

    setSyncStatus(navigator.onLine ? 'saving' : 'offline');
    const primaryRef = user ? doc(db, 'users', user.uid) : doc(db, 'sync_transfers', DEFAULT_SYNC_BRIDGE);

    const unsubscribe = onSnapshot(
      primaryRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        // Ignore local echoes
        if (snapshot.metadata.hasPendingWrites) {
          setSyncStatus(navigator.onLine ? 'saving' : 'offline');
          return;
        }

        if (snapshot.exists()) {
          const isSimActive = (typeof window !== 'undefined' && ((window as any).__isSimulationActive || localStorage.getItem('taskquest_simulation_active') === 'true'));
          if (isSavingRef.current || isSimActive) return;

          const data = snapshot.data();
          isApplyingRemoteRef.current = true;

          // 1. Merge PlayerStats with streak/XP protection
          if (data.stats) {
            setStats((prev) => mergePlayerStats(prev, data.stats));
          }

          // 2. Merge Custom Habits first so we know if the user has calibrated routines
          let latestRemoteHabits: CustomHabit[] = [];
          if (data.customHabits && Array.isArray(data.customHabits)) {
            latestRemoteHabits = deduplicateHabits(data.customHabits);
            setCustomHabits((prev) => {
              const map = new Map<string, CustomHabit>();
              for (const h of latestRemoteHabits) if (h && h.id) map.set(h.id, h);
              for (const h of prev) if (h && h.id && !map.has(h.id)) map.set(h.id, h);
              return deduplicateHabits(Array.from(map.values()));
            });
          }

          // 3. Merge TasksByDate without losing completed tasks, and propagate today's completions
          if ((data.tasksByDate && typeof data.tasksByDate === 'object') || latestRemoteHabits.length > 0) {
            setTasksByDate((prev) => {
              const merged = mergeTasksByDate(prev, data.tasksByDate || {});
              const todayKey = getTodayDateString();
              if (latestRemoteHabits.length > 0) {
                const todayList = (merged[todayKey] || []).filter(t => !isDefaultDayOnePlaceholder(t));
                const hasRealAgendaTasks = todayList.some(t => !t.isQuickHabit && !t.isTracked2166);
                if (!hasRealAgendaTasks) {
                  merged[todayKey] = deduplicateTasksForDay([
                    ...todayList,
                    ...generateDailyTasks(todayKey, latestRemoteHabits),
                  ], todayKey);
                } else {
                  merged[todayKey] = todayList;
                }
              }
              return propagateTodayCompletions(merged, todayKey, data.activeViewDate);
            });
          }

          // 4. Merge Habit Mastery
          if (data.habitMastery && typeof data.habitMastery === 'object') {
            setHabitMastery((prev) => {
              const merged = mergeHabitMastery(prev, data.habitMastery);
              saveHabitMastery(merged);
              return merged;
            });
          }

          // 5. Merge Reflections
          if (data.reflections && typeof data.reflections === 'object') {
            setReflections((prev) => {
              const merged = { ...(data.reflections || {}), ...(prev || {}) };
              saveDailyReflections(merged);
              return merged;
            });
          }

          // 6. Merge Shop Rewards
          if (data.shopRewards && Array.isArray(data.shopRewards)) {
            setShopRewards((prev) => {
              const merged = mergeShopRewards(prev, data.shopRewards);
              saveShopRewards(merged);
              return merged;
            });
          }

          // 7. Merge Pomodoro History
          if (data.pomodoroSessions && Array.isArray(data.pomodoroSessions)) {
            setPomodoroSessions((prev) => {
              const merged = mergePomodoroSessions(prev, data.pomodoroSessions);
              savePomodoroHistory(merged);
              return merged;
            });
          }

          // 8. Merge Notifications
          if (data.notifications && Array.isArray(data.notifications)) {
            setNotifications((prev) => {
              const map = new Map<string, AppNotification>();
              for (const n of data.notifications) if (n && n.id) map.set(n.id, n);
              for (const n of prev) if (n && n.id) map.set(n.id, n);
              const merged = Array.from(map.values());
              saveNotifications(merged);
              return merged;
            });
          }

          // 9. Merge Game Settings
          if (data.gameSettings && typeof data.gameSettings === 'object') {
            setGameSettings((prev) => {
              const merged = { ...prev, ...data.gameSettings };
              saveGameSettings(merged);
              return merged;
            });
          }

          // 10. Merge Skill Tree
          if (data.skillTree && Array.isArray(data.skillTree)) {
            setSkillTree((prev) => {
              const merged = mergeSkillTree(prev, data.skillTree);
              saveSkillTree(merged);
              return merged;
            });
          }

          // 11. Merge Companion
          if (data.companion !== undefined) {
            setCompanion((prev) => {
              if (!prev) {
                if (data.companion) saveCompanion(data.companion);
                return data.companion;
              }
              if (!data.companion) return prev;
              const merged = {
                ...data.companion,
                ...prev,
                level: Math.max(prev.level || 1, data.companion.level || 1),
                xp: Math.max((prev as any).xp || 0, (data.companion as any).xp || 0),
              };
              saveCompanion(merged);
              return merged;
            });
          }

          // 12. Merge Expenses
          if (data.expenses && Array.isArray(data.expenses)) {
            setExpenses((prev) => {
              const map = new Map<string, any>();
              for (const e of data.expenses) if (e && e.id) map.set(e.id, e);
              for (const e of prev) if (e && e.id) map.set(e.id, e);
              const merged = Array.from(map.values());
              safeSetItem('taskquest_expenses', JSON.stringify(merged));
              return merged;
            });
          }

          setLastSyncTime(new Date());
          setSyncStatus(navigator.onLine ? 'synced' : 'offline');
          if (!snapshot.metadata.fromCache || !navigator.onLine) {
            initialLoadDoneRef.current = true;
          }

          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 600);
        } else {
          // Document doesn't exist yet: if this device has meaningful data, seed the cloud bridge immediately
          initialLoadDoneRef.current = true;
          if (!(window as any).__isResettingAccount) {
            performSave();
          }
        }
      },
      (error) => {
        console.warn('[CloudSync] Firestore real-time listener error:', error?.message || error);
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setSyncStatus('offline');
        } else {
          setSyncStatus('error');
        }
        initialLoadDoneRef.current = true;
      }
    );

    // If user is signed in, ALSO listen to the universal bridge so devices with/without Google Auth stay in sync
    let unsubscribeBridge = () => {};
    if (user) {
      const bridgeRef = doc(db, 'sync_transfers', DEFAULT_SYNC_BRIDGE);
      unsubscribeBridge = onSnapshot(
        bridgeRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.metadata.hasPendingWrites || isSavingRef.current || !snapshot.exists()) return;
          const bData = snapshot.data();
          if (!bData) return;
          isApplyingRemoteRef.current = true;
          if (bData.stats) {
            setStats((prev) => mergePlayerStats(prev, bData.stats));
          }
          let bridgeHabits: CustomHabit[] = [];
          if (bData.customHabits && Array.isArray(bData.customHabits)) {
            bridgeHabits = deduplicateHabits(bData.customHabits);
            setCustomHabits((prev) => {
              const map = new Map<string, CustomHabit>();
              for (const h of bridgeHabits) if (h && h.id) map.set(h.id, h);
              for (const h of prev) if (h && h.id && !map.has(h.id)) map.set(h.id, h);
              return deduplicateHabits(Array.from(map.values()));
            });
          }
          if ((bData.tasksByDate && typeof bData.tasksByDate === 'object') || bridgeHabits.length > 0) {
            setTasksByDate((prev) => {
              const merged = mergeTasksByDate(prev, bData.tasksByDate || {});
              const todayKey = getTodayDateString();
              if (bridgeHabits.length > 0) {
                const todayList = (merged[todayKey] || []).filter((t) => !isDefaultDayOnePlaceholder(t));
                const hasRealAgenda = todayList.some((t) => !t.isQuickHabit && !t.isTracked2166);
                merged[todayKey] = hasRealAgenda
                  ? todayList
                  : deduplicateTasksForDay([...todayList, ...generateDailyTasks(todayKey, bridgeHabits)], todayKey);
              }
              return propagateTodayCompletions(merged, todayKey, bData.activeViewDate);
            });
          }
          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 600);
        },
        () => {}
      );
    }

    let unsubscribeTasks = () => {};
    if (user) {
      const taskMonthsRef = collection(db, 'users', user.uid, 'task_months');
      unsubscribeTasks = onSnapshot(
        taskMonthsRef,
        { includeMetadataChanges: true },
        (snapshot) => {
          if (snapshot.metadata.hasPendingWrites || isSavingRef.current) return;

          isApplyingRemoteRef.current = true;

          const allTasksByDate: Record<string, TaskItem[]> = {};
          snapshot.docs.forEach((d) => {
            const data = d.data();
            if (data.tasksByDate) {
              Object.assign(allTasksByDate, data.tasksByDate);
            }
          });

          if (Object.keys(allTasksByDate).length > 0) {
            setTasksByDate((prev) => propagateTodayCompletions(mergeTasksByDate(prev, allTasksByDate), getTodayDateString()));
          }

          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 600);
        },
        (error) => {
          console.warn('[CloudSync] Firestore task_months listener error:', error?.message || error);
        }
      );
    }

    return () => {
      unsubscribe();
      unsubscribeBridge();
      unsubscribeTasks();
    };
  }, [user, hasMeaningfulLocalData, performSave]);

  // 2. Debounced Auto-Save (Client -> Cloud)
  useEffect(() => {
    if (!db || !initialLoadDoneRef.current) return;
    if (isApplyingRemoteRef.current) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    const timer = setTimeout(() => {
      performSave();
    }, 450);

    return () => clearTimeout(timer);
  }, [
    user,
    stats,
    tasksByDate,
    habitMastery,
    customHabits,
    reflections,
    shopRewards,
    pomodoroSessions,
    notifications,
    gameSettings,
    skillTree,
    companion,
    expenses,
    performSave,
  ]);

  const forceSyncNow = useCallback(async () => {
    return await performSave(undefined, true);
  }, [performSave]);

  const pullFromCloudNow = useCallback(async (): Promise<boolean> => {
    if (!db) return false;
    try {
      isApplyingRemoteRef.current = true;
      setSyncStatus('saving');

      const remoteTasksByDate: Record<string, TaskItem[]> = {};
      let remoteCustomHabits: CustomHabit[] = [];
      let remoteActiveViewDate: string | undefined;

      const applyDocData = (data: any) => {
        if (!data) return;
        if (data.activeViewDate) {
          remoteActiveViewDate = data.activeViewDate;
        }
        if (data.stats) {
          setStats((prev) => mergePlayerStats(prev, data.stats));
        }
        if (data.customHabits && Array.isArray(data.customHabits) && data.customHabits.length > 0) {
          const map = new Map<string, CustomHabit>();
          for (const h of remoteCustomHabits) if (h && h.id) map.set(h.id, h);
          for (const h of data.customHabits) if (h && h.id) map.set(h.id, h);
          remoteCustomHabits = deduplicateHabits(Array.from(map.values()));
          setCustomHabits(remoteCustomHabits);
        }
        if (data.tasksByDate && typeof data.tasksByDate === 'object') {
          for (const [dKey, list] of Object.entries(data.tasksByDate)) {
            if (Array.isArray(list) && list.length > 0) {
              remoteTasksByDate[dKey] = deduplicateTasksForDay([
                ...(remoteTasksByDate[dKey] || []),
                ...(list as TaskItem[]),
              ], dKey);
            }
          }
        }
        if (data.habitMastery && typeof data.habitMastery === 'object') {
          setHabitMastery((prev) => {
            const merged = mergeHabitMastery(prev, data.habitMastery);
            saveHabitMastery(merged);
            return merged;
          });
        }
        if (data.reflections && typeof data.reflections === 'object') {
          setReflections((prev) => {
            const merged = { ...(data.reflections || {}), ...(prev || {}) };
            saveDailyReflections(merged);
            return merged;
          });
        }
        if (data.shopRewards && Array.isArray(data.shopRewards)) {
          setShopRewards(data.shopRewards);
          saveShopRewards(data.shopRewards);
        }
        if (data.pomodoroSessions && Array.isArray(data.pomodoroSessions)) {
          setPomodoroSessions(data.pomodoroSessions);
          savePomodoroHistory(data.pomodoroSessions);
        }
        if (data.notifications && Array.isArray(data.notifications)) {
          setNotifications(data.notifications);
          saveNotifications(data.notifications);
        }
        if (data.gameSettings && typeof data.gameSettings === 'object') {
          setGameSettings((prev) => {
            const merged = { ...prev, ...data.gameSettings };
            saveGameSettings(merged);
            return merged;
          });
        }
        if (data.skillTree && Array.isArray(data.skillTree)) {
          setSkillTree(data.skillTree);
          saveSkillTree(data.skillTree);
        }
        if (data.companion !== undefined && data.companion) {
          setCompanion(data.companion);
          saveCompanion(data.companion);
        }
        if (data.expenses && Array.isArray(data.expenses)) {
          setExpenses(data.expenses);
          safeSetItem('taskquest_expenses', JSON.stringify(data.expenses));
        }
      };

      // 1. If signed in, read monthly subcollection and user document from server
      if (user) {
        try {
          const taskMonthsRef = collection(db, 'users', user.uid, 'task_months');
          const monthsSnap = await getDocsFromServer(taskMonthsRef).catch(() => getDocs(taskMonthsRef));
          monthsSnap.docs.forEach((d) => {
            const mData = d.data();
            if (mData.tasksByDate && typeof mData.tasksByDate === 'object') {
              for (const [dKey, list] of Object.entries(mData.tasksByDate)) {
                if (Array.isArray(list) && list.length > 0) {
                  remoteTasksByDate[dKey] = deduplicateTasksForDay([
                    ...(remoteTasksByDate[dKey] || []),
                    ...(list as TaskItem[]),
                  ], dKey);
                }
              }
            }
          });
        } catch (subErr) {
          console.warn('[CloudSync] task_months read fallback:', subErr);
        }

        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDocFromServer(userRef).catch(() => getDoc(userRef));
          if (userSnap.exists()) {
            applyDocData(userSnap.data());
          }
        } catch (uErr) {
          console.warn('[CloudSync] user doc read fallback:', uErr);
        }
      }

      // 2. Always also read universal cross-device bridge from server (works even without Google Sign-In on mobile PWAs)
      try {
        const bridgeRef = doc(db, 'sync_transfers', DEFAULT_SYNC_BRIDGE);
        const bridgeSnap = await getDocFromServer(bridgeRef).catch(() => getDoc(bridgeRef));
        if (bridgeSnap.exists()) {
          applyDocData(bridgeSnap.data());
        }
      } catch (bErr) {
        console.warn('[CloudSync] bridge read fallback:', bErr);
      }

      const hasAnyRealRemoteData =
        remoteCustomHabits.length > 0 ||
        Object.values(remoteTasksByDate).some(
          (list) => Array.isArray(list) && list.some((t) => t && !isDefaultDayOnePlaceholder(t))
        );

      const cleanedRemote: Record<string, TaskItem[]> = {};
      for (const [dKey, list] of Object.entries(remoteTasksByDate)) {
        const filtered = (list || []).filter((t) => !(hasAnyRealRemoteData && isDefaultDayOnePlaceholder(t)));
        cleanedRemote[dKey] = deduplicateTasksForDay(filtered, dKey);
      }

      // Ensure today's schedule is hydrated on the target device if today was empty or only had Day-1 calibration tasks
      const todayKey = getTodayDateString();
      const todayTasks = cleanedRemote[todayKey] || [];
      const todayHasAgendaTasks = todayTasks.some((t) => !t.isQuickHabit && !t.isTracked2166 && !isDefaultDayOnePlaceholder(t));

      if (!todayHasAgendaTasks) {
        if (remoteCustomHabits.length > 0) {
          cleanedRemote[todayKey] = deduplicateTasksForDay([
            ...todayTasks.filter((t) => !isDefaultDayOnePlaceholder(t)),
            ...generateDailyTasks(todayKey, remoteCustomHabits),
          ], todayKey);
        }

        // If still no agenda tasks for today, carry over from the most recent or active synced date while preserving today's completions
        const updatedTodayTasks = cleanedRemote[todayKey] || [];
        const stillNoAgendaTasks = !updatedTodayTasks.some((t) => !t.isQuickHabit && !t.isTracked2166);
        if (stillNoAgendaTasks) {
          const sortedDatesDesc = Object.keys(cleanedRemote)
            .filter((d) => d !== todayKey && (cleanedRemote[d] || []).some((t) => !t.isQuickHabit && !t.isTracked2166 && !isDefaultDayOnePlaceholder(t)))
            .sort((a, b) => b.localeCompare(a));

          if (sortedDatesDesc.length > 0) {
            const latestDate = (remoteActiveViewDate && cleanedRemote[remoteActiveViewDate]?.length)
              ? remoteActiveViewDate
              : sortedDatesDesc[0];
            const isSameActiveSession = latestDate === remoteActiveViewDate || latestDate >= todayKey;
            const carriedOver = (cleanedRemote[latestDate] || [])
              .filter((t) => !isDefaultDayOnePlaceholder(t))
              .map((t, idx) => {
                const wasCompletedToday = Boolean(
                  t.completed &&
                  (isSameActiveSession || (t.completedAt && getTodayDateString(new Date(t.completedAt)) === todayKey))
                );
                return {
                  ...t,
                  id: `${t.id}-sync-${todayKey}-${idx}`,
                  completed: wasCompletedToday,
                  completedAt: wasCompletedToday ? (t.completedAt || new Date().toISOString()) : undefined,
                  rewardClaimed: wasCompletedToday ? Boolean(t.rewardClaimed) : false,
                  currentCount: isSameActiveSession ? t.currentCount : (wasCompletedToday ? t.currentCount : 0),
                };
              });
            cleanedRemote[todayKey] = deduplicateTasksForDay([...updatedTodayTasks, ...carriedOver], todayKey);
          }
        }
      }

      if (Object.keys(cleanedRemote).length > 0) {
        setTasksByDate((prev) => {
          const merged = mergeTasksByDate(prev, cleanedRemote);
          return propagateTodayCompletions(merged, todayKey, remoteActiveViewDate);
        });
      } else {
        useTaskStore.getState().ensureTodayTasks();
      }

      setLastSyncTime(new Date());
      setSyncStatus('synced');
      setTimeout(() => {
        isApplyingRemoteRef.current = false;
      }, 1500);
      return true;
    } catch (err) {
      console.warn('[CloudSync] pullFromCloudNow failed:', err);
      isApplyingRemoteRef.current = false;
      setSyncStatus('error');
      return false;
    }
  }, [
    user,
    setStats,
    setCustomHabits,
    setHabitMastery,
    setReflections,
    setShopRewards,
    setPomodoroSessions,
    setNotifications,
    setGameSettings,
    setSkillTree,
    setCompanion,
    setExpenses,
    setTasksByDate,
  ]);

  return {
    syncStatus,
    lastSyncTime,
    forceSyncNow,
    pullFromCloudNow,
    isOnline,
  };
};
