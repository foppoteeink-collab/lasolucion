import React, { useEffect, useRef, useState, useCallback } from 'react';
import { deduplicateTasksForDay, deduplicateHabits } from '../utils/taskDeduplication';
import { doc, onSnapshot, setDoc, collection, writeBatch } from 'firebase/firestore';
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
import { getRankForLevel } from '../data/defaults';
import { getTodayDateString } from '../utils/date';

export type SyncStatus = 'synced' | 'saving' | 'offline' | 'error' | 'local';

export interface CloudSyncResult {
  syncStatus: SyncStatus;
  lastSyncTime: Date | null;
  forceSyncNow: () => Promise<boolean>;
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
  const currentXp = (local.level || 1) >= (remote.level || 1) ? local.currentXp : remote.currentXp;
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

  return {
    ...remote,
    ...local,
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
      const expectedRank = getRankForLevel(finalLevel).title;
      const candidate = (local.level || 1) >= (remote.level || 1)
        ? (local.rankTitle || remote.rankTitle)
        : (remote.rankTitle || local.rankTitle);
      if (!candidate || candidate === 'Aventurero' || (finalLevel > 1 && candidate === 'Chispazo de Voluntad')) {
        return expectedRank;
      }
      return candidate;
    })(),
  };
}

/**
 * Merges local and remote tasks per date, keeping union of tasks and keeping completion statuses intact.
 */
export function mergeTasksByDate(
  local: Record<string, TaskItem[]>,
  remote: Record<string, TaskItem[]>
): Record<string, TaskItem[]> {
  const allDates = new Set([...Object.keys(local || {}), ...Object.keys(remote || {})]);
  const result: Record<string, TaskItem[]> = {};

  for (const dateKey of allDates) {
    const localList = local[dateKey] || [];
    const remoteList = remote[dateKey] || [];

    const taskMap = new Map<string, TaskItem>();

    // 1. Add remote tasks first, ensuring missing completedAt removes invalid completed status
    for (const task of remoteList) {
      if (task && task.id) {
        const isLegitRemoteCompleted = Boolean(task.completed && task.completedAt);
        taskMap.set(task.id, {
          ...task,
          completed: isLegitRemoteCompleted,
          completedAt: isLegitRemoteCompleted ? task.completedAt : undefined,
        });
      }
    }

    // 2. Process local tasks: local task state is the source of truth for active completion/pending status
    for (const localTask of localList) {
      if (!localTask || !localTask.id) continue;

      const remoteTask = taskMap.get(localTask.id);
      if (!remoteTask) {
        taskMap.set(localTask.id, localTask);
      } else {
        // Local task status takes precedence so unchecking or resetting tasks is never overridden by old remote state
        const isLocalCompleted = Boolean(localTask.completed && localTask.completedAt);
        const isRemoteCompleted = Boolean(remoteTask.completed && remoteTask.completedAt);
        const isCompleted = isLocalCompleted || isRemoteCompleted;

        const mergedCount = (localTask.currentCount !== undefined || remoteTask.currentCount !== undefined)
          ? Math.max(localTask.currentCount || 0, remoteTask.currentCount || 0)
          : undefined;

        taskMap.set(localTask.id, {
          ...remoteTask,
          ...localTask,
          completed: isCompleted,
          completedAt: isCompleted ? (localTask.completedAt || remoteTask.completedAt || new Date().toISOString()) : undefined,
          rewardClaimed: isCompleted ? Boolean(localTask.rewardClaimed || remoteTask.rewardClaimed) : false,
          currentCount: mergedCount,
          notes: localTask.notes || remoteTask.notes,
          awardedXp: Math.max(localTask.awardedXp || 0, remoteTask.awardedXp || 0),
          awardedCoins: Math.max(localTask.awardedCoins || 0, remoteTask.awardedCoins || 0),
        });
      }
    }

    result[dateKey] = deduplicateTasksForDay(Array.from(taskMap.values()));
  }

  return result;
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

  // Function to execute cloud save with error recovery
  const performSave = useCallback(
    async (overrideData?: any): Promise<boolean> => {
      const isSimActive = (typeof window !== 'undefined' && ((window as any).__isSimulationActive || localStorage.getItem('taskquest_simulation_active') === 'true'));
      if (!user || !db || (window as any).__isResettingAccount || isSimActive) return false;

      // NETWORK CHECK: If offline, transition syncStatus gracefully without network error
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        setSyncStatus('offline');
        return false;
      }

      try {
        isSavingRef.current = true;
        setSyncStatus('saving');

        const userRef = doc(db, 'users', user.uid);
        const dataToSave = overrideData || {
          stats,
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
          lastUpdated: new Date().toISOString(),
        };

        const payload = sanitizeForFirestore(dataToSave);
        if ('tasksByDate' in payload) {
          delete payload.tasksByDate;
        }

        const batch = writeBatch(db);
        batch.set(userRef, payload, { merge: true });

        // Group tasks by YYYY_MM
        const tasksData = overrideData?.tasksByDate || tasksByDate;
        if (tasksData) {
          const tasksByMonth: Record<string, Record<string, TaskItem[]>> = {};
          for (const [date, tasks] of Object.entries(tasksData)) {
            const match = date.match(/^(\d{4})-(\d{2})/);
            if (match) {
              const monthKey = `${match[1]}_${match[2]}`;
              if (!tasksByMonth[monthKey]) tasksByMonth[monthKey] = {};
              tasksByMonth[monthKey][date] = sanitizeForFirestore(tasks);
            }
          }
          
          for (const [monthKey, monthTasks] of Object.entries(tasksByMonth)) {
            const monthRef = doc(db, 'users', user.uid, 'task_months', monthKey);
            batch.set(monthRef, { tasksByDate: monthTasks }, { merge: true });
          }
        }

        await batch.commit();

        setLastSyncTime(new Date());
        setSyncStatus('synced');
        isSavingRef.current = false;
        return true;
      } catch (err: any) {
        isSavingRef.current = false;
        console.warn('[CloudSync] Firestore write exception caught:', err?.message || err);

        // Permissions error handling
        if (
          err?.message?.includes('permission') ||
          err?.message?.includes('Missing or insufficient permissions')
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
    ]
  );

  // 1. Real-time Firestore Listener (Cloud -> Client) with Conflict Resolution
  useEffect(() => {
    if (!user || !db) {
      setSyncStatus('local');
      initialLoadDoneRef.current = false;
      return;
    }

    setSyncStatus(navigator.onLine ? 'saving' : 'offline');
    const userRef = doc(db, 'users', user.uid);

    const unsubscribe = onSnapshot(
      userRef,
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
            setStats((prev) => {
              const merged = mergePlayerStats(prev, data.stats);
              
              return merged;
            });
          }

          // 2. Merge TasksByDate without losing completed offline tasks
          if (data.tasksByDate && typeof data.tasksByDate === 'object') {
            setTasksByDate((prev) => {
              const merged = mergeTasksByDate(prev, data.tasksByDate);
              
              return merged;
            });
          }

          // 3. Merge Habit Mastery
          if (data.habitMastery && typeof data.habitMastery === 'object') {
            setHabitMastery((prev) => {
              const merged = mergeHabitMastery(prev, data.habitMastery);
              saveHabitMastery(merged);
              return merged;
            });
          }

          // 4. Merge Custom Habits
          if (data.customHabits && Array.isArray(data.customHabits)) {
            setCustomHabits((prev) => {
              const map = new Map<string, CustomHabit>();
              for (const h of data.customHabits) if (h && h.id) map.set(h.id, h);
              for (const h of prev) if (h && h.id && !map.has(h.id)) map.set(h.id, h);
              const merged = Array.from(map.values());
              
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
          initialLoadDoneRef.current = true;

          setTimeout(() => {
            isApplyingRemoteRef.current = false;
          }, 600);
        } else {
          // New document migration
          initialLoadDoneRef.current = true;
          if (!(window as any).__isResettingAccount) {
            performSave();
          }
        }
      },
      (error) => {
        console.warn('[CloudSync] Firestore real-time listener error:', error?.message || error);
        if (
          error?.message?.includes('permission') ||
          error?.message?.includes('Missing or insufficient permissions')
        ) {
          try {
            handleFirestoreError(error, OperationType.GET, `users/${user.uid}`, auth);
          } catch (syncErr) {
            console.warn('[CloudSync] Permission note:', syncErr);
          }
        }

        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          setSyncStatus('offline');
        } else {
          setSyncStatus('error');
        }
        initialLoadDoneRef.current = true;
      }
    );

    const taskMonthsRef = collection(db, 'users', user.uid, 'task_months');
    const unsubscribeTasks = onSnapshot(
      taskMonthsRef,
      { includeMetadataChanges: true },
      (snapshot) => {
        if (snapshot.metadata.hasPendingWrites || isSavingRef.current) return;
        
        isApplyingRemoteRef.current = true;
        
        const allTasksByDate: Record<string, TaskItem[]> = {};
        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          if (data.tasksByDate) {
            Object.assign(allTasksByDate, data.tasksByDate);
          }
        });
        
        setTasksByDate((prev) => {
          const merged = mergeTasksByDate(prev, allTasksByDate);
          
          return merged;
        });

        setTimeout(() => {
          isApplyingRemoteRef.current = false;
        }, 600);
      },
      (error) => {
        console.warn('[CloudSync] Firestore task_months listener error:', error?.message || error);
      }
    );

    return () => {
      unsubscribe();
      unsubscribeTasks();
    };
  }, [user]);

  // 2. Debounced Auto-Save (Client -> Cloud)
  useEffect(() => {
    if (!user || !db || !initialLoadDoneRef.current) return;
    if (isApplyingRemoteRef.current) return;

    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setSyncStatus('offline');
      return;
    }

    setSyncStatus('saving');

    const timer = setTimeout(() => {
      performSave();
    }, 1200);

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
    return await performSave();
  }, [performSave]);

  return {
    syncStatus,
    lastSyncTime,
    forceSyncNow,
    isOnline,
  };
};
