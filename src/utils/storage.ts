import { AppNotification, PlayerStats, PomodoroSession, ShopReward, TaskItem, HabitMasteryRecord, Companion, SkillNode, GameSettings, CustomHabit } from '../types';
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

export const safeRemoveItem = (key: string): void => {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch (e) {
    console.warn('localStorage removeItem blocked/unavailable:', key, e);
  }
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

    // If rankTitle was missing, or if it was stuck on the level 1 title while level > 1, update to correct rank
    const rankTitle = parsed.rankTitle && (lvl === 1 || parsed.rankTitle !== 'Chispazo de Voluntad')
      ? (parsed.rankTitle === 'Aventurero' ? correctRankTitle : parsed.rankTitle)
      : correctRankTitle;

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
  safeSetItem('taskquest_tasks_by_date', JSON.stringify(tasksByDate));
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
    const existingIds = new Set(parsed.map((r) => r.id));
    const missingDefaults = INITIAL_SHOP_REWARDS.filter((r) => !existingIds.has(r.id));
    return [...parsed, ...missingDefaults];
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
          title: '⚔️ ¡Bienvenido a La Solución!',
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
  safeSetItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
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
    return data ? JSON.parse(data) : { enableDynamicQuests: true, enableCompanion: true, strictMode: false };
  } catch (error) {
    return { enableDynamicQuests: true, enableCompanion: true, strictMode: false };
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
      if (stats.rankTitle !== correctRank && (stats.rankTitle === 'Chispazo de Voluntad' || stats.rankTitle === 'Aventurero' || !stats.rankTitle)) {
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
