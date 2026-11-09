import { AppNotification, PlayerStats, PomodoroSession, ShopReward, TaskItem, HabitMasteryRecord, Companion, SkillNode, GameSettings, CustomHabit, NotificationSettings } from '../types';
import { INITIAL_PLAYER_STATS, INITIAL_SHOP_REWARDS, DEFAULT_TASKS, getRequiredXpForLevel, getRankForLevel, generateDailyTasks, MIGRATION_HABITS, INITIAL_CUSTOM_HABITS, RANKS } from '../data/defaults';
import { getTodayDateString } from './date';

export interface AppBackupData {
  version: string;
  exportedAt: string;
  stats: PlayerStats;
  tasks: TaskItem[];
  shopRewards: ShopReward[];
  pomodoroSessions: PomodoroSession[];
  notifications: AppNotification[];
  customHabits?: CustomHabit[];
  habitMastery?: Record<string, HabitMasteryRecord>;
  reflections?: Record<string, string>;
  allTasksByDate?: Record<string, TaskItem[]>;
}

const STORAGE_KEYS = {
  STATS: 'taskquest_player_stats',
  TASKS: 'taskquest_tasks',
  SHOP: 'taskquest_shop_rewards',
  POMODORO: 'taskquest_pomodoro_history',
  NOTIFICATIONS: 'taskquest_notifications',
  THEME: 'taskquest_theme_preference',
  DRIVE_SYNC_DATE: 'taskquest_drive_last_sync',
  DRIVE_CONNECTED_ACCOUNT: 'taskquest_drive_account',
  CUSTOM_HABITS: 'taskquest_custom_habits',
};

// Safe LocalStorage helpers resilient to sandboxed iframe SecurityError / DOMException
export const safeGetItem = (key: string): string | null => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch (e) {
    console.warn('localStorage getItem blocked/unavailable:', key, e);
  }
  return null;
};

export const safeSetItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined' && (window as any).__isResettingAccount) return;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch (e) {
    console.warn('localStorage setItem blocked/unavailable:', key, e);
  }
};

const debounceTimers: Record<string, any> = {};

/**
 * Pipelined debounced localStorage writer to prevent synchronous main-thread chokes during rapid bursts of updates
 */
export const debouncedSetItem = (key: string, value: string, delayMs = 300): void => {
  if (typeof window === 'undefined' || (window as any).__isResettingAccount) return;
  if (debounceTimers[key]) {
    clearTimeout(debounceTimers[key]);
  }
  debounceTimers[key] = setTimeout(() => {
    delete debounceTimers[key];
    safeSetItem(key, value);
  }, delayMs);
};

export const safeRemoveItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('localStorage removeItem blocked/unavailable:', key, e);
  }
};

export const isQuotaError = (err: unknown): boolean => {
  if (!err || typeof err !== 'object') return false;
  const anyErr = err as any;
  return (
    anyErr.name === 'QuotaExceededError' ||
    anyErr.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
    anyErr.code === 22 ||
    anyErr.code === 1014 ||
    (typeof anyErr.message === 'string' && anyErr.message.toLowerCase().includes('quota'))
  );
};

export interface ResilientStorageOptions {
  onCorrupted?: (key: string, rawValue: string, error: unknown) => void;
  onQuotaExceeded?: (key: string, value: string, error: unknown) => void;
}

/**
 * P0 Resilient Storage Wrapper for Zustand & Client State.
 * Prevents White Screen of Death (WSOD) caused by corrupted JSON in LocalStorage.
 * If JSON parsing fails during rehydration:
 * 1. Safely archives the corrupt string to a quarantine key for forensic recovery.
 * 2. Purges the broken key.
 * 3. Returns null so Zustand smoothly rehydrates to valid initial state.
 * Also catches QuotaExceededError and sandboxed SecurityError gracefully.
 */
export const createResilientStorage = (options?: ResilientStorageOptions) => {
  return {
    getItem: (key: string): string | null => {
      try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(key);
        if (!raw) return null;

        // Verify JSON integrity before returning to prevent Zustand boot crash
        try {
          JSON.parse(raw);
          return raw;
        } catch (jsonErr) {
          console.error(`[ResilientStorage] Corrupted JSON detected for key "${key}". Quarantining and resetting:`, jsonErr);
          try {
            const quarantineKey = `${key}_corrupted_backup_${Date.now()}`;
            window.localStorage.setItem(quarantineKey, raw);
            window.localStorage.removeItem(key);
          } catch {}
          if (options?.onCorrupted) {
            options.onCorrupted(key, raw, jsonErr);
          }
          return null; // Signals Zustand to fallback cleanly to initial state
        }
      } catch (err) {
        console.warn(`[ResilientStorage] Error reading key "${key}":`, err);
        return null;
      }
    },
    setItem: (key: string, value: string): void => {
      if (typeof window === 'undefined' || !window.localStorage) return;
      if ((window as any).__isResettingAccount) return;
      try {
        window.localStorage.setItem(key, value);
      } catch (err) {
        if (isQuotaError(err)) {
          console.error(`[ResilientStorage] QuotaExceededError writing "${key}":`, err);
          if (options?.onQuotaExceeded) {
            options.onQuotaExceeded(key, value, err);
          }
        } else {
          console.warn(`[ResilientStorage] Error setting item for key "${key}":`, err);
        }
      }
    },
    removeItem: (key: string): void => {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          window.localStorage.removeItem(key);
        }
      } catch (err) {
        console.warn(`[ResilientStorage] Error removing item for key "${key}":`, err);
      }
    },
  };
};

export interface EmergencyRecoveryResult {
  backedUpKeys: string[];
  clearedKeys: string[];
  cachesCleared: boolean;
  serviceWorkersUnregistered: number;
}

/**
 * P2 Cascading Self-Healing Emergency Storage Recovery Protocol.
 * Used by ErrorBoundary and recovery dialogs to break infinite WSOD crash loops.
 * 1. Quarantines critical client stores to timestamped backup keys before deletion.
 * 2. Purges the corrupted active keys from LocalStorage.
 * 3. Clears browser HTTP caches.
 * 4. Unregisters Service Workers to discard stale broken chunks.
 */
export const executeEmergencyStorageRecovery = async (
  targetStorage?: Storage
): Promise<EmergencyRecoveryResult> => {
  const criticalKeys = [
    'la-solucion-task-store',
    'quantum-os-player-stats',
    'quantum-os-app-store',
    'quantum-os-ui-store',
    'taskquest_tasks',
    'taskquest_player_stats',
  ];
  const backedUpKeys: string[] = [];
  const clearedKeys: string[] = [];
  const timestamp = Date.now();

  const storage = targetStorage || (typeof window !== 'undefined' && 'localStorage' in window ? window.localStorage : null);

  if (storage && typeof storage.getItem === 'function') {
    for (const key of criticalKeys) {
      try {
        const val = storage.getItem(key);
        if (val !== null && val !== undefined) {
          const backupKey = `${key}_emergency_backup_${timestamp}`;
          try {
            storage.setItem(backupKey, val);
            backedUpKeys.push(backupKey);
          } catch (writeErr) {
            console.warn(`[EmergencyRecovery] Failed to create emergency backup for ${key}:`, writeErr);
          }
          storage.removeItem(key);
          clearedKeys.push(key);
        }
      } catch (err) {
        console.warn(`[EmergencyRecovery] Error handling key ${key}:`, err);
      }
    }
  }

  let cachesCleared = false;
  if (typeof window !== 'undefined' && 'caches' in window) {
    try {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
      cachesCleared = true;
    } catch (cacheErr) {
      console.warn('[EmergencyRecovery] Cache clear failed:', cacheErr);
    }
  }

  let serviceWorkersUnregistered = 0;
  if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const reg of registrations) {
        const success = await reg.unregister();
        if (success) serviceWorkersUnregistered++;
      }
    } catch (swErr) {
      console.warn('[EmergencyRecovery] ServiceWorker unregister failed:', swErr);
    }
  }

  return {
    backedUpKeys,
    clearedKeys,
    cachesCleared,
    serviceWorkersUnregistered,
  };
};

export const loadCustomHabits = (): CustomHabit[] => {
  try {
    const raw = safeGetItem(STORAGE_KEYS.CUSTOM_HABITS);
    if (!raw) {
      return INITIAL_CUSTOM_HABITS.filter(h => h.id === 'habit-water');
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch {
    return [];
  }
};

export const saveCustomHabits = (habits: CustomHabit[]) => {
  safeSetItem(STORAGE_KEYS.CUSTOM_HABITS, JSON.stringify(habits));
};

export const loadSavedStats = (): PlayerStats => {
  try {
    const raw = safeGetItem(STORAGE_KEYS.STATS + '_v2') || safeGetItem(STORAGE_KEYS.STATS);
    if (!raw) return INITIAL_PLAYER_STATS;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return INITIAL_PLAYER_STATS;
    const lvl = typeof parsed.level === 'number' && parsed.level > 0 ? parsed.level : 1;
    const rank = getRankForLevel(lvl);
    const correctRankTitle = rank?.title || 'Chispazo de Voluntad';

    // Ensure rankTitle always strictly reflects the player's canonical level
    const rankTitle = correctRankTitle;

    return {
      ...INITIAL_PLAYER_STATS,
      ...parsed,
      level: lvl,
      rankTitle,
      requiredXp: getRequiredXpForLevel(lvl),
      attributes: {
        ...INITIAL_PLAYER_STATS.attributes,
        ...(parsed.attributes || {}),
      },
      streakDays: typeof parsed.streakDays === 'number' ? parsed.streakDays : INITIAL_PLAYER_STATS.streakDays,
    };
  } catch {
    return INITIAL_PLAYER_STATS;
  }
};

export const savePlayerStats = (stats: PlayerStats) => {
  safeSetItem(STORAGE_KEYS.STATS + '_v2', JSON.stringify(stats));
  safeSetItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
};

const isArchetypeMissionTask = (t: TaskItem): boolean => {
  return Boolean(
    (t as any).isArchetypeMission ||
    (typeof t.id === 'string' && t.id.startsWith('archetype-mission')) ||
    (typeof t.title === 'string' && t.title.includes('[Misión del Arquetipo]'))
  );
};

export const loadSavedTasksByDate = (): Record<string, TaskItem[]> => {
  const todayStr = getTodayDateString();
  try {
    const rawByDate = safeGetItem('taskquest_tasks_by_date_v2') || safeGetItem('taskquest_tasks_by_date');
    if (rawByDate) {
      const parsed = JSON.parse(rawByDate);
      if (typeof parsed === 'object' && parsed !== null) {
        const cleaned: Record<string, TaskItem[]> = {};
        for (const [dateKey, list] of Object.entries(parsed)) {
          if (Array.isArray(list)) {
            cleaned[dateKey] = list.filter(t => !isArchetypeMissionTask(t));
          }
        }
        // Guarantee that today always has tasks generated if it was missing
        if (cleaned[todayStr] === undefined) {
          cleaned[todayStr] = generateDailyTasks(todayStr, loadCustomHabits());
        }
        return cleaned;
      }
    }
    
    // Migration from old array format
    const oldRaw = safeGetItem(STORAGE_KEYS.TASKS + '_v2') || safeGetItem(STORAGE_KEYS.TASKS);
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw);
      if (Array.isArray(oldParsed) && oldParsed.length > 0) {
        return { [todayStr]: oldParsed.filter(t => !isArchetypeMissionTask(t)) };
      }
    }
    
    return { [todayStr]: generateDailyTasks(todayStr, loadCustomHabits()) };
  } catch {
    return { [todayStr]: generateDailyTasks(todayStr, loadCustomHabits()) };
  }
};

export const saveTasksByDate = (tasksByDate: Record<string, TaskItem[]>) => {
  safeSetItem('taskquest_tasks_by_date_v2', JSON.stringify(tasksByDate));
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem('taskquest_tasks_by_date');
    } catch {}
  }
};

export const loadSavedTasks = (): TaskItem[] => {
  try {
    const raw = safeGetItem(STORAGE_KEYS.TASKS);
    if (!raw) return DEFAULT_TASKS;
    const parsed: TaskItem[] = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_TASKS;

    return parsed.map((item) => {
      const defaultMatch = DEFAULT_TASKS.find((d) => d.id === item.id);
      if (defaultMatch && !item.isCustom) {
        return {
          ...item,
          xpReward: defaultMatch.xpReward,
          coinReward: defaultMatch.coinReward,
        };
      }
      return item;
    });
  } catch {
    return DEFAULT_TASKS;
  }
};

export const saveTasks = (tasks: TaskItem[]) => {
  safeSetItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
};

export const loadSavedShopRewards = (): ShopReward[] => {
  try {
    const raw = safeGetItem(STORAGE_KEYS.SHOP);
    if (!raw) return INITIAL_SHOP_REWARDS;
    const parsed = JSON.parse(raw) as ShopReward[];
    const defaultMap = new Map(INITIAL_SHOP_REWARDS.map((r) => [r.id, r]));
    // Sincronizar precios base rebalanceados contra inflación preservando personalizaciones
    const updated = parsed.map((r) => {
      const def = defaultMap.get(r.id);
      if (def) {
        return {
          ...r,
          cost: def.cost,
          title: def.title,
          description: def.description,
          icon: def.icon,
          category: def.category,
        };
      }
      return r;
    });
    const existingIds = new Set(updated.map((r) => r.id));
    const missingDefaults = INITIAL_SHOP_REWARDS.filter((r) => !existingIds.has(r.id));
    return [...updated, ...missingDefaults];
  } catch {
    return INITIAL_SHOP_REWARDS;
  }
};

export const saveShopRewards = (rewards: ShopReward[]) => {
  safeSetItem(STORAGE_KEYS.SHOP, JSON.stringify(rewards));
};

export const loadPomodoroHistory = (): PomodoroSession[] => {
  try {
    const raw = safeGetItem(STORAGE_KEYS.POMODORO);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const savePomodoroHistory = (sessions: PomodoroSession[]) => {
  safeSetItem(STORAGE_KEYS.POMODORO, JSON.stringify(sessions));
};

export const loadNotifications = (): AppNotification[] => {
  try {
    const raw = safeGetItem(STORAGE_KEYS.NOTIFICATIONS);
    if (!raw) {
      return [
        {
          id: 'welcome-notif',
          title: '⚔️ ¡Te damos la bienvenida a La Solución!',
          message: 'Tu aventura diaria comienza hoy. Completa tus tareas, reclama recompensas diarias y sube de nivel.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          type: 'info',
          read: false,
        },
      ];
    }
    return JSON.parse(raw);
  } catch {
    return [];
  }
};

export const saveNotifications = (notifs: AppNotification[]) => {
  const capped = Array.isArray(notifs) ? notifs.slice(0, 50) : [];
  safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(capped));
};

export const exportBackupJSON = (
  stats: PlayerStats,
  tasks: TaskItem[],
  shop: ShopReward[],
  sessions: PomodoroSession[],
  notifs: AppNotification[]
): AppBackupData => {
  const backup: AppBackupData = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    stats,
    tasks,
    shopRewards: shop,
    pomodoroSessions: sessions,
    notifications: notifs,
  };

  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backup, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `La_Solucion_Backup_${getTodayDateString()}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();

  safeSetItem(STORAGE_KEYS.DRIVE_SYNC_DATE, new Date().toISOString());

  return backup;
};

export const parseBackupJSON = (jsonString: string): AppBackupData | null => {
  try {
    const parsed = JSON.parse(jsonString);
    if (parsed && parsed.stats && parsed.tasks) {
      return parsed as AppBackupData;
    }
    return null;
  } catch (e) {
    console.error('Failed to parse backup JSON', e);
    return null;
  }
};

export const loadDailyReflections = (): Record<string, string> => {
  try {
    const data = safeGetItem('taskquest_daily_reflections');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
};

export const saveDailyReflections = (reflections: Record<string, string>) => {
  safeSetItem('taskquest_daily_reflections', JSON.stringify(reflections));
};

export const loadHabitMastery = (): Record<string, HabitMasteryRecord> => {
  try {
    const data = safeGetItem('habitMastery');
    return data ? JSON.parse(data) : {};
  } catch (error) {
    return {};
  }
};

export const saveHabitMastery = (mastery: Record<string, HabitMasteryRecord>) => {
  safeSetItem('habitMastery', JSON.stringify(mastery));
};

export const loadGameSettings = (): GameSettings => {
  try {
    const data = safeGetItem('gameSettings');
    return data ? JSON.parse(data) : { enableDynamicQuests: true, enableCompanion: true, strictMode: false, enableFinanceModule: true };
  } catch (error) {
    return { enableDynamicQuests: true, enableCompanion: true, strictMode: false, enableFinanceModule: true };
  }
};

export const saveGameSettings = (settings: GameSettings) => {
  safeSetItem('gameSettings', JSON.stringify(settings));
};

export const loadSkillTree = (): SkillNode[] => {
  try {
    const data = safeGetItem('skillTree');
    if (data) return JSON.parse(data);
  } catch (error) {}
  
  return [
    { id: 's1', title: 'Resistencia Dominical', description: 'Protege tu racha de fallos los fines de semana.', costCoins: 500, isUnlocked: false, effectType: 'rest_day_pass' },
    { id: 's2', title: 'Mente Acelerada', description: '+15% XP pasivo en tareas de Mente.', costCoins: 800, isUnlocked: false, effectType: 'xp_multiplier', targetCategory: 'Mente' },
    { id: 's3', title: 'Escudo de Hábito', description: 'Otorga un escudo protector para mantener tu maestría si fallas un día.', costCoins: 300, isUnlocked: false, effectType: 'streak_shield' },
  ];
};

export const saveSkillTree = (skills: SkillNode[]) => {
  safeSetItem('skillTree', JSON.stringify(skills));
};

export const loadCompanion = (): Companion | null => {
  try {
    const data = safeGetItem('companion');
    return data ? JSON.parse(data) : null;
  } catch (error) {
    return null;
  }
};

export const saveCompanion = (companion: Companion | null) => {
  if (companion) {
    safeSetItem('companion', JSON.stringify(companion));
  }
};

export const initializeStore = () => {
  if (typeof window === 'undefined' || !window.localStorage) return;
  
  let changedTasks = false;
  let changedMastery = false;
  let changedStats = false;
  
  // 1. Purge Archetype Missions
  try {
    const rawTasks = safeGetItem('taskquest_tasks_by_date');
    if (rawTasks) {
      const parsed = JSON.parse(rawTasks);
      Object.keys(parsed).forEach(dateStr => {
        const targetList = parsed[dateStr];
        if (targetList && targetList.some((t: any) => t.isArchetypeMission || t.id?.startsWith('archetype-mission') || t.title?.includes('[Misión del Arquetipo]'))) {
          parsed[dateStr] = targetList.filter((t: any) => !t.isArchetypeMission && !t.id?.startsWith('archetype-mission') && !t.title?.includes('[Misión del Arquetipo]'));
          changedTasks = true;
        }
      });
      if (changedTasks) {
        safeSetItem('taskquest_tasks_by_date', JSON.stringify(parsed));
      }
    }
  } catch(e) { console.warn(e) }

  // 2. Migration: Merge legacy exercise habits
  try {
    const rawMastery = safeGetItem('taskquest_habit_mastery');
    if (rawMastery) {
      const next = JSON.parse(rawMastery);
      const legacyExerciseKeys = Object.keys(next).filter(key => 
         (key.includes('entrenamiento') || key.includes('ejercicio') || key.includes('funcional---caminata')) &&
        key !== 'habito-ejercicio-diario'
      );
      
      if (legacyExerciseKeys.length > 0) {
        let maxCurrent = next['habito-ejercicio-diario']?.currentStreak || 0;
        let maxHighest = next['habito-ejercicio-diario']?.highestStreak || 0;
        let maltz = next['habito-ejercicio-diario']?.isMaltzReached || false;
        let mastered = next['habito-ejercicio-diario']?.isMastered || false;
        let multiplier = next['habito-ejercicio-diario']?.multiplier || 1.0;
        
        legacyExerciseKeys.forEach(k => {
          if (next[k]) {
            if (next[k].currentStreak > maxCurrent) maxCurrent = next[k].currentStreak;
            if (next[k].highestStreak > maxHighest) maxHighest = next[k].highestStreak;
            if (next[k].isMaltzReached) maltz = true;
            if (next[k].isMastered) mastered = true;
            if (next[k].multiplier > multiplier) multiplier = next[k].multiplier;
            delete next[k];
            changedMastery = true;
          }
        });
        
        if (changedMastery) {
          next['habito-ejercicio-diario'] = {
            taskId: 'habito-ejercicio-diario',
            currentStreak: maxCurrent,
            highestStreak: maxHighest,
            isMaltzReached: maltz,
            isMastered: mastered,
            shieldActive: false,
            multiplier: multiplier
          };
          safeSetItem('taskquest_habit_mastery', JSON.stringify(next));
        }
      }
    }
  } catch(e) { console.warn(e) }

  // 3. Retroactively apply new Titles and Phase History
  try {
    const rawStats = safeGetItem('taskquest_player_stats_v2') || safeGetItem('taskquest_player_stats');
    if (rawStats) {
      const stats = JSON.parse(rawStats);
      const lvl = stats.level || 1;
      const matchedRank = getRankForLevel(lvl);
      const correctRank = matchedRank?.title || 'Chispazo de Voluntad';
      const currentPhase = matchedRank?.phase || 1;
      
      let nextStats = { ...stats };
      if (stats.rankTitle !== correctRank) {
        nextStats.rankTitle = correctRank;
        changedStats = true;
      }
      if (!stats.phaseHistory) {
        nextStats.phaseHistory = { [currentPhase]: new Date().toISOString() };
        changedStats = true;
      } else if (!stats.phaseHistory[currentPhase]) {
        nextStats.phaseHistory = { ...stats.phaseHistory, [currentPhase]: new Date().toISOString() };
        changedStats = true;
      }
      
      if (changedStats) {
        safeSetItem('taskquest_player_stats_v2', JSON.stringify(nextStats));
        safeSetItem('taskquest_player_stats', JSON.stringify(nextStats));
      }
    }
  } catch(e) { console.warn(e) }
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  enabled: true,
  morningReminderEnabled: true,
  morningReminderTime: '08:00',
  afternoonReminderEnabled: true,
  afternoonReminderTime: '14:00',
  streakSafeguardEnabled: true,
  streakSafeguardTime: '20:00',
  nightlyReflectionEnabled: true,
  nightlyReflectionTime: '21:30',
  taskAlarmsEnabled: true,
  soundEnabled: true,
};

export const loadNotificationSettings = (): NotificationSettings => {
  try {
    const raw = safeGetItem('taskquest_notification_settings');
    if (raw) {
      return { ...DEFAULT_NOTIFICATION_SETTINGS, ...JSON.parse(raw) };
    }
  } catch (e) {
    console.warn('Failed to load notification settings:', e);
  }
  return DEFAULT_NOTIFICATION_SETTINGS;
};

export const saveNotificationSettings = (settings: NotificationSettings): void => {
  safeSetItem('taskquest_notification_settings', JSON.stringify(settings));
};

export {
  fetchColdArchivedTasksForDate,
  fetchAllColdArchivedTasks,
  persistColdArchiveToIndexedDB,
} from './level3Systems';
