import test from 'node:test';
import assert from 'node:assert/strict';
import {
  canPlayerAscend,
  calculateAscensionState,
  getAscensionBonusMultiplier,
  evaluateTimezoneDrift,
  reconcileClosedDaysLog,
  calculatePriorityMultiplier,
  calculateDailyBossImpactPoints,
  calculateDynamicShopCost,
  evaluateOverchargeContract,
  countCompletedTimeBlocks,
  compactHistoricalTasksByDate,
} from './level3Systems';
import { PlayerStats, TaskItem } from '../types';

const createMockStats = (overrides: Partial<PlayerStats> = {}): PlayerStats => ({
  level: 1,
  currentXp: 50,
  requiredXp: 100,
  totalXpEarned: 500,
  coins: 200,
  hp: 100,
  maxHp: 100,
  streakDays: 5,
  lastActiveDate: '2026-11-06',
  lastDailyRewardClaimedDate: '2026-11-05',
  rankTitle: 'Chispazo de Voluntad',
  avatarIcon: 'shield',
  attributes: { disciplina: 10, fuerza: 10, mente: 10, energia: 10, estudio: 10 },
  ...overrides,
});

test('1. CPO Ascension Protocol: requires level >= 50 and increments ascensionTier with +5% bonus', () => {
  const level49 = createMockStats({ level: 49, totalXpEarned: 12000 });
  assert.equal(canPlayerAscend(level49), false);
  assert.equal(calculateAscensionState(level49).level, 49);

  const level50 = createMockStats({ level: 50, totalXpEarned: 15000 });
  assert.equal(canPlayerAscend(level50), true);
  const ascended = calculateAscensionState(level50);
  assert.equal(ascended.level, 1);
  assert.equal(ascended.ascensionTier, 1);
  assert.equal(ascended.legacyTotalXp, 15000);
  assert.equal(getAscensionBonusMultiplier(ascended.ascensionTier), 1.05);
});

test('2. PM Timezone Drift & Offline Reconciler: activates 24h shield on >=60m shift and merges logs deterministically', () => {
  const noDrift = evaluateTimezoneDrift(300, 300, 1000);
  assert.equal(noDrift.drifted, false);

  const drifted = evaluateTimezoneDrift(-60, 300, 1000);
  assert.equal(drifted.drifted, true);
  assert.equal(drifted.shieldExpiresAt, 1000 + 24 * 60 * 60 * 1000);

  const merged = reconcileClosedDaysLog(
    { '2026-11-05': { timestamp: 200, tasksCompleted: 6, xpEarned: 140 } },
    {
      '2026-11-04': { timestamp: 100, tasksCompleted: 4, xpEarned: 90 },
      '2026-11-05': { timestamp: 150, tasksCompleted: 3, xpEarned: 60 },
    }
  );
  assert.equal(Object.keys(merged).length, 2);
  assert.equal(merged['2026-11-05'].xpEarned, 140);
});

test('3. Game Designer Anti-Exploit: caps high priority multiplier after 3 daily charges and weights boss impact points', () => {
  const firstCharge = calculatePriorityMultiplier('alta', 0);
  assert.equal(firstCharge.multiplier, 2.0);
  assert.equal(firstCharge.isCapped, false);

  const fourthCharge = calculatePriorityMultiplier('alta', 3);
  assert.equal(fourthCharge.multiplier, 1.15);
  assert.equal(fourthCharge.isCapped, true);

  const mockTasks: TaskItem[] = [
    { id: '1', title: 'Low 1', category: 'rutina', priority: 'baja', xpReward: 10, coinReward: 4, completed: true },
    { id: '2', title: 'Low 2', category: 'rutina', priority: 'baja', xpReward: 10, coinReward: 4, completed: true },
    { id: '3', title: 'Low 3', category: 'rutina', priority: 'baja', xpReward: 10, coinReward: 4, completed: true },
  ];
  // 3 low-priority tasks only yield 1.5 impact points (< 3.0 required for Boss Bounty)
  assert.equal(calculateDailyBossImpactPoints(mockTasks), 1.5);

  // Adding a high-priority task (+1.5 pts) reaches 3.0 impact points
  mockTasks.push({
    id: '4',
    title: 'High 1',
    category: 'trabajo',
    priority: 'alta',
    xpReward: 20,
    coinReward: 8,
    completed: true,
  });
  assert.equal(calculateDailyBossImpactPoints(mockTasks), 3.0);
});

test('4. Token Economy Sinks: scales evolution core cost exponentially and settles Overcharge Contract at 85%', () => {
  const cost0 = calculateDynamicShopCost('perk-archetype-evolution-core', 1500, {
    level: 5,
    archetypeEvolutionCores: 0,
    attributes: { disciplina: 10, fuerza: 10, mente: 10, energia: 10, estudio: 10 },
  });
  const cost2 = calculateDynamicShopCost('perk-archetype-evolution-core', 1500, {
    level: 5,
    archetypeEvolutionCores: 2,
    attributes: { disciplina: 10, fuerza: 10, mente: 10, energia: 10, estudio: 10 },
  });
  assert.equal(cost0, 1500);
  assert.equal(cost2, Math.round(1500 * Math.pow(1.35, 2)));

  const contractWin = evaluateOverchargeContract(
    { date: '2026-11-06', stakedCoins: 100 },
    '2026-11-06',
    90
  );
  assert.equal(contractWin.succeeded, true);
  assert.equal(contractWin.xpBonus, 250);
  assert.equal(contractWin.refundedCoins, 100);

  const contractBurn = evaluateOverchargeContract(
    { date: '2026-11-06', stakedCoins: 100 },
    '2026-11-06',
    60
  );
  assert.equal(contractBurn.succeeded, false);
  assert.equal(contractBurn.xpBonus, 0);
  assert.equal(contractBurn.burnedCoins, 100);
});

test('5 & 7. Time Blocks & Hot/Cold 14-Day Compactor: counts conquered blocks and prunes tasks older than 14 days', () => {
  const todayTasks: TaskItem[] = [
    { id: 't1', title: 'Deep Work', category: 'trabajo', timeBlock: '09:00 - 11:00', xpReward: 20, coinReward: 5, completed: true },
    { id: 't2', title: 'Gym', category: 'entrenamiento', timeBlock: '18:00 - 19:00', xpReward: 20, coinReward: 5, completed: false },
  ];
  const blocks = countCompletedTimeBlocks(todayTasks);
  assert.equal(blocks.completedBlocks, 1);
  assert.equal(blocks.totalBlocks, 2);

  const tasksByDate: Record<string, TaskItem[]> = {
    '2026-10-01': [
      { id: 'old-1', title: 'Old Task', category: 'estudio', xpReward: 15, coinReward: 5, completed: true },
    ],
    '2026-11-06': todayTasks,
  };

  const compacted = compactHistoricalTasksByDate(tasksByDate, '2026-11-06');
  assert.equal(compacted.prunedTasksCount, 1);
  assert.equal(compacted.hotTasksByDate['2026-10-01'], undefined);
  assert.equal(compacted.hotTasksByDate['2026-11-06'].length, 2);
  assert.equal(compacted.updatedSummary.totalCompletedCount, 1);
  assert.equal(compacted.updatedSummary.byCategory.estudio, 1);
});

test('P0 Cloud Sync: Coin reconciliation respects spending without infinite gold glitch', async () => {
  const { mergePlayerStats } = await import('../hooks/useCloudSync');
  
  // Case A: Local spent coins (100 -> 50) at T=2000, remote snapshot still has 100 at T=1000
  const localStats = createMockStats({ coins: 50, coinsLastUpdated: 2000 });
  const remoteStats = createMockStats({ coins: 100, coinsLastUpdated: 1000 });

  const merged = mergePlayerStats(localStats, remoteStats);
  assert.equal(merged.coins, 50, 'Local coin spending must NOT be reverted to 100 by stale remote snapshot');
  assert.equal(merged.coinsLastUpdated, 2000);

  // Case B: Remote gained coins legitimately at T=3000
  const newerRemoteStats = createMockStats({ coins: 150, coinsLastUpdated: 3000 });
  const mergedWithRemote = mergePlayerStats(localStats, newerRemoteStats);
  assert.equal(mergedWithRemote.coins, 150, 'Newer remote coin state must be accepted');
});

test('P0 Cloud Sync: Deleted tasks with tombstones are NEVER resurrected by remote snapshots', async () => {
  const { mergeTasksByDate } = await import('../hooks/useCloudSync');

  const localTasks = {
    '2026-11-06': [
      { id: 'task-active', title: 'Active Task', category: 'trabajo', xpReward: 10, coinReward: 2, completed: false } as TaskItem,
    ]
  };

  const remoteTasks = {
    '2026-11-06': [
      { id: 'task-active', title: 'Active Task', category: 'trabajo', xpReward: 10, coinReward: 2, completed: false } as TaskItem,
      { id: 'task-deleted', title: 'Deleted Task', category: 'personal', xpReward: 10, coinReward: 2, completed: false } as TaskItem,
    ]
  };

  const tombstones = {
    'task-deleted': '2026-11-06T12:00:00Z',
  };

  const merged = mergeTasksByDate(localTasks, remoteTasks, tombstones);
  assert.equal(merged['2026-11-06'].length, 1);
  assert.equal(merged['2026-11-06'][0].id, 'task-active');
  assert.equal(merged['2026-11-06'].some(t => t.id === 'task-deleted'), false, 'Tombstoned task must not be resurrected');
});
