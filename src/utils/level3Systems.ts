import { PlayerStats, PriorityLevel, TaskItem } from '../types';
import { addDaysToDateString } from './date';
import { getRequiredXpForLevel, RANKS } from '../data/defaults';

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
export const evaluateTimezoneDrift = (
  lastOffset: number | undefined,
  currentOffset: number,
  nowMs: number = Date.now()
): { drifted: boolean; nextOffset: number; shieldExpiresAt?: number } => {
  if (lastOffset === undefined || lastOffset === null) {
    return { drifted: false, nextOffset: currentOffset };
  }
  const diffMinutes = Math.abs(currentOffset - lastOffset);
  if (diffMinutes >= 60) {
    return {
      drifted: true,
      nextOffset: currentOffset,
      shieldExpiresAt: nowMs + 24 * 60 * 60 * 1000, // 24h protection
    };
  }
  return { drifted: false, nextOffset: currentOffset };
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
  completionRate: number
): {
  hasActiveContract: boolean;
  succeeded: boolean;
  xpBonus: number;
  refundedCoins: number;
  burnedCoins: number;
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
      const isRecurringHabit = Boolean(task.isHabit || task.isQuickHabit || task.isTracked2166);
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

export const persistColdArchiveToIndexedDB = async (
  coldArchivedByDate: Record<string, TaskItem[]>
): Promise<void> => {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;
  const dates = Object.keys(coldArchivedByDate);
  if (dates.length === 0) return;

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
            resolve();
          };
          tx.onerror = () => {
            db.close();
            resolve();
          };
        } catch {
          resolve();
        }
      };
      request.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
};
