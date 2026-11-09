import { PlayerStats, PriorityLevel, TaskItem } from '../types';
import { addDaysToDateString } from './date';
import { getRequiredXpForLevel, getRankForLevel, RANKS } from '../data/defaults';

/**
 * P0 Anti-Exploit: Reverts XP and Coins symmetrically and bidirectionally.
 * If a task is uncompleted after leveling up, or a day is reopened, this decrements
 * level and recalibrates requiredXp and currentXp down to the exact pre-level-up state,
 * preventing infinite XP/coin farming loops and de-leveling desync.
 */
export const revertXpAndCoins = (
  prevStats: PlayerStats,
  xpToDeduct: number,
  coinsToDeduct: number
): PlayerStats => {
  const safeXpDeduct = Math.max(0, xpToDeduct || 0);
  const safeCoinsDeduct = Math.max(0, coinsToDeduct || 0);

  let nextXp = (prevStats.currentXp || 0) - safeXpDeduct;
  let nextLevel = typeof prevStats.level === 'number' && prevStats.level > 0 ? prevStats.level : 1;
  let requiredXp = getRequiredXpForLevel(nextLevel);

  while (nextXp < 0 && nextLevel > 1) {
    nextLevel -= 1;
    const prevLevelRequiredXp = getRequiredXpForLevel(nextLevel);
    nextXp += prevLevelRequiredXp;
    requiredXp = prevLevelRequiredXp;
  }

  if (nextLevel <= 1 && nextXp < 0) {
    nextXp = 0;
  }

  const matchedRank = getRankForLevel(nextLevel);
  const currentRankTitle = matchedRank?.title || 'Chispazo de Voluntad';

  return {
    ...prevStats,
    currentXp: Math.max(0, nextXp),
    level: nextLevel,
    requiredXp: requiredXp,
    rankTitle: currentRankTitle,
    totalXpEarned: Math.max(0, (prevStats.totalXpEarned || 0) - safeXpDeduct),
    coins: Math.max(0, (prevStats.coins || 0) - safeCoinsDeduct),
    coinsLastUpdated: safeCoinsDeduct > 0 ? Date.now() : prevStats.coinsLastUpdated,
  };
};

/**
 * 1. CPO — Protocolo de Ascensión (Prestigio Cíclico Nivel 50+)
 * Permite reiniciar voluntariamente al Nivel 1 al alcanzar Nivel >= 50
 * otorgando +1 Estrella de Ascensión (ascensionTier) y +5% eficiencia global permanente por estrella.
 */
export const canPlayerAscend = (stats: Pick<PlayerStats, 'level'>): boolean => {
  return (stats.level || 1) >= 50;
};

export const getAscensionBonusMultiplier = (ascensionTier = 0): number => {
  const safeTier = Math.max(0, ascensionTier || 0);
  return 1 + safeTier * 0.05;
};

export const calculateAscensionState = (prevStats: PlayerStats): PlayerStats => {
  if (!canPlayerAscend(prevStats)) {
    return prevStats;
  }
  const nextTier = (prevStats.ascensionTier || 0) + 1;
  const accumulatedLegacyXp = (prevStats.legacyTotalXp || 0) + (prevStats.totalXpEarned || 0);

  return {
    ...prevStats,
    level: 1,
    currentXp: 0,
    requiredXp: getRequiredXpForLevel(1),
    rankTitle: RANKS[0]?.title || 'Chispazo de Voluntad',
    ascensionTier: nextTier,
    legacyTotalXp: accumulatedLegacyXp,
    ascensionCrystals: (prevStats.ascensionCrystals || 0) + 1,
  };
};

/**
 * 2. PM — Escudo de Tránsito Horario (Timezone Drift) & Reconciliador Determinista Offline
 */
export interface TimezoneDriftResult {
  drifted: boolean;
  nextOffset: number;
  shieldExpiresAt?: number;
  crossedDateLine?: boolean;
  offsetShiftHours?: number;
}

export const evaluateTimezoneDrift = (
  lastOffset: number | undefined,
  currentOffset: number,
  nowMs: number = Date.now()
): TimezoneDriftResult => {
  if (lastOffset === undefined || lastOffset === null) {
    return { drifted: false, nextOffset: currentOffset, offsetShiftHours: 0 };
  }
  const diffMinutes = Math.abs(currentOffset - lastOffset);
  const offsetShiftHours = Math.round((diffMinutes / 60) * 10) / 10;

  if (diffMinutes >= 60) {
    // International Date Line or extreme transcontinental jump (>= 12 hours / 720 min)
    const crossedDateLine = diffMinutes >= 720;
    // Grants 48 hours protection for Date Line crossings, 24 hours for standard timezone shifts
    const protectionDurationMs = crossedDateLine ? 48 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000;

    return {
      drifted: true,
      nextOffset: currentOffset,
      shieldExpiresAt: nowMs + protectionDurationMs,
      crossedDateLine,
      offsetShiftHours,
    };
  }
  return { drifted: false, nextOffset: currentOffset, offsetShiftHours };
};

export const isTimezoneShieldActive = (
  stats: Pick<PlayerStats, 'timezoneShieldExpiresAt'>,
  nowMs: number = Date.now()
): boolean => {
  return Boolean(stats.timezoneShieldExpiresAt && stats.timezoneShieldExpiresAt > nowMs);
};

export const reconcileClosedDaysLog = (
  localLog: Record<string, { timestamp: number; tasksCompleted: number; xpEarned: number }> = {},
  remoteLog: Record<string, { timestamp: number; tasksCompleted: number; xpEarned: number }> = {}
): Record<string, { timestamp: number; tasksCompleted: number; xpEarned: number }> => {
  const merged = { ...remoteLog };
  for (const [dateKey, localEntry] of Object.entries(localLog)) {
    const existing = merged[dateKey];
    if (!existing || localEntry.xpEarned >= existing.xpEarned) {
      merged[dateKey] = localEntry;
    }
  }
  return merged;
};

/**
 * 3. Game Designer — Cap de Cargas de Enfoque Crítico (3/día a 2.0x) y Puntos Ponderados de Jefe Diario
 */
export const MAX_CRITICAL_PRIORITY_CHARGES_PER_DAY = 3;

export const countHighPriorityCompletedToday = (tasks: TaskItem[], excludeTaskId?: string): number => {
  return (tasks || []).filter(
    (t) =>
      t.id !== excludeTaskId &&
      t.completed &&
      (t.priority === 'alta' || t.priority === 'epica' || t.isLegendaryBounty)
  ).length;
};

export const calculatePriorityMultiplier = (
  priority: PriorityLevel | undefined,
  highPriorityClaimedToday: number,
  isLegendaryBounty = false
): { multiplier: number; isCapped: boolean } => {
  if (priority === 'alta' || priority === 'epica' || isLegendaryBounty) {
    if (highPriorityClaimedToday < MAX_CRITICAL_PRIORITY_CHARGES_PER_DAY) {
      return { multiplier: 2.0, isCapped: false };
    }
    return { multiplier: 1.15, isCapped: true };
  }
  if (priority === 'baja') {
    return { multiplier: 0.5, isCapped: false };
  }
  return { multiplier: 1.0, isCapped: false };
};

export const calculateTaskBossImpact = (task: TaskItem): number => {
  if (task.priority === 'alta' || task.priority === 'epica' || task.isLegendaryBounty) {
    return 1.5;
  }
  if (task.isHabit || task.isQuickHabit || task.category === 'habito' || task.priority === 'baja') {
    return 0.5;
  }
  return 1.0;
};

export const calculateDailyBossImpactPoints = (tasks: TaskItem[], justCompletedTaskId?: string): number => {
  let totalPoints = 0;
  for (const t of tasks || []) {
    const isDone =
      t.id === justCompletedTaskId
        ? true
        : Boolean(t.completed || (t.targetCount && (t.currentCount || 0) >= t.targetCount));
    if (isDone) {
      totalPoints += calculateTaskBossImpact(t);
    }
  }
  return Math.round(totalPoints * 100) / 100;
};

/**
 * 4. Especialista en Economía de Tokens — Pricing Dinámico Exponencial y Contrato de Sobrecarga Neural
 */
export const calculateDynamicShopCost = (
  rewardId: string,
  baseCost: number,
  stats: Pick<PlayerStats, 'level' | 'archetypeEvolutionCores' | 'attributes'> & { category?: string }
): number => {
  if (rewardId === 'perk-archetype-evolution-core') {
    const ownedCores = Math.max(0, stats.archetypeEvolutionCores || 0);
    return Math.round(baseCost * Math.pow(1.35, ownedCores));
  }
  if (rewardId === 'perk-tactical-energy-vial') {
    const lvl = Math.max(1, stats.level || 1);
    return Math.round(baseCost * (1 + (lvl - 1) * 0.05));
  }
  if (rewardId === 'perk-streak-shield') {
    const lvl = Math.max(1, stats.level || 1);
    return Math.round(baseCost * (1 + Math.floor(lvl / 10) * 0.1));
  }
  return baseCost;
};

export const evaluateOverchargeContract = (
  contract: PlayerStats['activeOverchargeContract'],
  logicalToday: string,
  completionRate: number,
  totalTasksCount?: number
): {
  hasActiveContract: boolean;
  succeeded: boolean;
  xpBonus: number;
  refundedCoins: number;
  burnedCoins: number;
  contractCancelledReason?: 'INSUFFICIENT_TASKS';
} => {
  if (!contract || contract.settled || contract.date !== logicalToday) {
    return {
      hasActiveContract: false,
      succeeded: false,
      xpBonus: 0,
      refundedCoins: 0,
      burnedCoins: 0,
    };
  }
  // Salvaguarda psicológica y económica: si el usuario registró menos de 3 tareas en total,
  // no penalizar quemando monedas; anular el contrato y reembolsar íntegramente las 100 monedas apostadas.
  if (totalTasksCount !== undefined && totalTasksCount < 3) {
    return {
      hasActiveContract: true,
      succeeded: false,
      xpBonus: 0,
      refundedCoins: contract.stakedCoins,
      burnedCoins: 0,
      contractCancelledReason: 'INSUFFICIENT_TASKS',
    };
  }
  if (completionRate >= 85) {
    return {
      hasActiveContract: true,
      succeeded: true,
      xpBonus: 250,
      refundedCoins: contract.stakedCoins,
      burnedCoins: 0,
    };
  }
  return {
    hasActiveContract: true,
    succeeded: false,
    xpBonus: 0,
    refundedCoins: 0,
    burnedCoins: contract.stakedCoins,
  };
};

/**
 * 5. Psicólogo del Comportamiento — Eco de Identidad y Contador de Bloques de Tiempo Conquistados
 */
export const formatIdentityEchoText = (
  xpReward: number,
  coinReward: number,
  isAffin: boolean,
  hasTimeBlock: boolean,
  archetypeName: string
): string => {
  if (hasTimeBlock && isAffin) {
    return `🏛️ Bloque ${archetypeName} Cumplido · +${xpReward} XP`;
  }
  if (hasTimeBlock) {
    return `⏱️ +1 Bloque Conquistado · +${xpReward} XP · +${coinReward}🪙`;
  }
  return `+${xpReward} XP · +${coinReward}🪙`;
};

export const countCompletedTimeBlocks = (tasks: TaskItem[]): { completedBlocks: number; totalBlocks: number } => {
  const withTime = (tasks || []).filter((t) => Boolean(t && t.timeBlock && t.timeBlock.trim()));
  const completed = withTime.filter((t) => t.completed);
  return {
    completedBlocks: completed.length,
    totalBlocks: withTime.length,
  };
};

/**
 * 7. Analista de Datos & Ing. Industrial — Compactación Hot/Cold de Historial (>14 Días)
 */
export const compactHistoricalTasksByDate = (
  tasksByDate: Record<string, TaskItem[]>,
  logicalToday: string,
  prevSummary?: PlayerStats['historicalArchiveSummary'],
  retentionDays = 14
): {
  hotTasksByDate: Record<string, TaskItem[]>;
  coldArchivedByDate: Record<string, TaskItem[]>;
  updatedSummary: NonNullable<PlayerStats['historicalArchiveSummary']>;
  prunedTasksCount: number;
} => {
  const cutoffDate = addDaysToDateString(logicalToday, -retentionDays);
  const hotTasksByDate: Record<string, TaskItem[]> = {};
  const coldArchivedByDate: Record<string, TaskItem[]> = {};

  const byCategory: Record<string, number> = { ...(prevSummary?.byCategory || {}) };
  let totalCompletedCount = prevSummary?.totalCompletedCount || 0;
  let prunedTasksCount = 0;

  for (const [dateStr, dayTasks] of Object.entries(tasksByDate || {})) {
    if (dateStr >= cutoffDate) {
      hotTasksByDate[dateStr] = dayTasks;
      continue;
    }

    const activeOrPending: TaskItem[] = [];
    const archivableCompleted: TaskItem[] = [];

    for (const task of dayTasks || []) {
      const isRecurringHabit = Boolean(
        task.isHabit || 
        task.isQuickHabit || 
        task.isTracked2166 || 
        task.category === 'habito' || 
        (typeof task.id === 'string' && (task.id.includes('habit-') || task.id.includes('custom-habit-')))
      );
      if (task.completed && !isRecurringHabit) {
        archivableCompleted.push(task);
        totalCompletedCount += 1;
        prunedTasksCount += 1;
        const cat = task.category || 'rutina';
        byCategory[cat] = (byCategory[cat] || 0) + 1;
      } else if (!task.completed && !isRecurringHabit) {
        // Uncompleted non-habit tasks older than 14 days are also archived to prevent RAM bloat
        archivableCompleted.push(task);
        prunedTasksCount += 1;
      } else {
        activeOrPending.push(task);
      }
    }

    if (archivableCompleted.length > 0) {
      coldArchivedByDate[dateStr] = archivableCompleted;
    }
    if (activeOrPending.length > 0) {
      hotTasksByDate[dateStr] = activeOrPending;
    }
  }

  return {
    hotTasksByDate,
    coldArchivedByDate,
    updatedSummary: {
      totalCompletedCount,
      byCategory,
      lastCompactedAt: new Date().toISOString(),
    },
    prunedTasksCount,
  };
};

/**
 * Detects if an error is a Storage QuotaExceededError in WebKit, Blink, or Gecko
 */
export const isQuotaExceededError = (err: unknown): boolean => {
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

/**
 * Checks current storage quota and usage via StorageManager API
 */
export const checkStorageQuota = async (): Promise<{
  quotaMb: number;
  usageMb: number;
  percentUsed: number;
} | null> => {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.estimate) {
    return null;
  }
  try {
    const estimate = await navigator.storage.estimate();
    const quotaMb = Math.round((estimate.quota || 0) / (1024 * 1024));
    const usageMb = Math.round((estimate.usage || 0) / (1024 * 1024));
    const percentUsed = quotaMb > 0 ? Math.round((usageMb / quotaMb) * 100) : 0;
    return { quotaMb, usageMb, percentUsed };
  } catch {
    return null;
  }
};

/**
 * Requests persistent storage to prevent Safari WebKit 7-day eviction
 */
export const requestPersistentStorage = async (): Promise<boolean> => {
  if (typeof navigator === 'undefined' || !navigator.storage || !navigator.storage.persist) {
    return false;
  }
  try {
    const isPersisted = await navigator.storage.persisted();
    if (isPersisted) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
};

export const persistColdArchiveToIndexedDB = async (
  coldArchivedByDate: Record<string, TaskItem[]>
): Promise<boolean> => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return false;
  const dates = Object.keys(coldArchivedByDate);
  if (dates.length === 0) return true;

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open('la-solucion-cold-archive', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('archived_days')) {
          db.createObjectStore('archived_days');
        }
      };
      request.onsuccess = () => {
        try {
          const db = request.result;
          const tx = db.transaction('archived_days', 'readwrite');
          const store = tx.objectStore('archived_days');
          for (const dateStr of dates) {
            store.put(coldArchivedByDate[dateStr], dateStr);
          }
          tx.oncomplete = () => {
            db.close();
            resolve(true);
          };
          tx.onerror = (e) => {
            if (isQuotaExceededError(tx.error || e)) {
              console.error('[ColdArchive] QuotaExceededError in IndexedDB write. Storage quota exhausted.');
            } else {
              console.warn('[ColdArchive] Transaction error in IndexedDB:', e);
            }
            db.close();
            resolve(false);
          };
        } catch (err) {
          if (isQuotaExceededError(err)) {
            console.error('[ColdArchive] QuotaExceededError caught during write execution:', err);
          } else {
            console.warn('[ColdArchive] Write execution failed:', err);
          }
          resolve(false);
        }
      };
      request.onerror = (e) => {
        console.warn('[ColdArchive] Open failed in IndexedDB:', e);
        resolve(false);
      };
    } catch (err) {
      console.warn('[ColdArchive] Unexpected error persisting to IndexedDB:', err);
      resolve(false);
    }
  });
};

/**
 * P0 Archivo Frío: Recupera las tareas archivadas de una fecha específica desde IndexedDB.
 * Permite a vistas históricas y calendario consultar tareas descompactadas (>14 días).
 */
export const fetchColdArchivedTasksForDate = async (
  dateStr: string
): Promise<TaskItem[]> => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return [];
  if (!dateStr) return [];

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open('la-solucion-cold-archive', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('archived_days')) {
          db.createObjectStore('archived_days');
        }
      };
      request.onsuccess = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains('archived_days')) {
            db.close();
            return resolve([]);
          }
          const tx = db.transaction('archived_days', 'readonly');
          const store = tx.objectStore('archived_days');
          const getReq = store.get(dateStr);
          getReq.onsuccess = () => {
            const result = getReq.result;
            db.close();
            resolve(Array.isArray(result) ? result : []);
          };
          getReq.onerror = () => {
            db.close();
            resolve([]);
          };
        } catch {
          resolve([]);
        }
      };
      request.onerror = () => resolve([]);
    } catch {
      resolve([]);
    }
  });
};

/**
 * P0 Archivo Frío: Recupera el mapa completo de todas las fechas archivadas en IndexedDB.
 */
export const fetchAllColdArchivedTasks = async (): Promise<Record<string, TaskItem[]>> => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return {};

  return new Promise((resolve) => {
    try {
      const request = window.indexedDB.open('la-solucion-cold-archive', 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains('archived_days')) {
          db.createObjectStore('archived_days');
        }
      };
      request.onsuccess = () => {
        try {
          const db = request.result;
          if (!db.objectStoreNames.contains('archived_days')) {
            db.close();
            return resolve({});
          }
          const tx = db.transaction('archived_days', 'readonly');
          const store = tx.objectStore('archived_days');
          const results: Record<string, TaskItem[]> = {};

          if ('openCursor' in store) {
            const cursorReq = store.openCursor();
            cursorReq.onsuccess = (e) => {
              const cursor = (e.target as IDBRequest<IDBCursorWithValue>).result;
              if (cursor) {
                const key = String(cursor.key);
                const val = cursor.value;
                if (Array.isArray(val)) {
                  results[key] = val;
                }
                cursor.continue();
              } else {
                db.close();
                resolve(results);
              }
            };
            cursorReq.onerror = () => {
              db.close();
              resolve({});
            };
          } else {
            db.close();
            resolve({});
          }
        } catch {
          resolve({});
        }
      };
      request.onerror = () => resolve({});
    } catch {
      resolve({});
    }
  });
};
