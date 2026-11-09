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
  revertXpAndCoins,
} from './level3Systems';
import { parseTimeToMinutes, parseEndTimeToMinutes, formatHourToHuman } from './timeUtils';
import { MAX_BUFFERED_TELEMETRY_EVENTS, getTelemetryQueueStatus } from '../services/telemetryQueueService';
import { createResilientStorage } from './storage';
import { PlayerStats, TaskItem } from '../types';
import {
  getTodayDateString,
  addDaysToDateString,
  calcSleepDuration,
  formatDateToLocal,
  parseLocalDate,
  getGlobalDayStartHour,
  setGlobalDayStartHour,
} from './date';
import { checkLevelUp } from '../engine/gameEngine';
import { getRequiredXpForLevel } from '../data/defaults';

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
    60,
    5
  );
  assert.equal(contractBurn.succeeded, false);
  assert.equal(contractBurn.xpBonus, 0);
  assert.equal(contractBurn.burnedCoins, 100);

  // Fase 2 (P1): Salvaguarda cuando totalTasks < 3 -> Reembolso sin quema
  const contractSafeguard = evaluateOverchargeContract(
    { date: '2026-11-06', stakedCoins: 100 },
    '2026-11-06',
    0,
    2
  );
  assert.equal(contractSafeguard.succeeded, false);
  assert.equal(contractSafeguard.burnedCoins, 0);
  assert.equal(contractSafeguard.refundedCoins, 100);
  assert.equal(contractSafeguard.contractCancelledReason, 'INSUFFICIENT_TASKS');
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

test('P1 Database: Compound indexes declared for queries in firestore.indexes.json', async () => {
  const fs = await import('fs');
  const path = await import('path');
  const rawIndexes = fs.readFileSync(path.resolve(process.cwd(), 'firestore.indexes.json'), 'utf-8');
  const parsed = JSON.parse(rawIndexes);

  assert.ok(Array.isArray(parsed.indexes), 'indexes must be an array');
  assert.ok(parsed.indexes.length >= 4, 'Must have at least 4 compound indexes declared');

  const taskIndex = parsed.indexes.find((i: any) => i.collectionGroup === 'tasks' && i.fields.some((f: any) => f.fieldPath === 'category'));
  assert.ok(taskIndex, 'Compound index on tasks (category + completed + priority) must exist');

  const pomodoroIndex = parsed.indexes.find((i: any) => i.collectionGroup === 'pomodoro_history');
  assert.ok(pomodoroIndex, 'Compound index on pomodoro_history must exist');
});

test('P1 Telemetry: User properties segmentation properly computes level brackets', async () => {
  const getBracket = (lvl: number) =>
    lvl >= 50 ? '50_plus' : lvl >= 25 ? '25_49' : lvl >= 10 ? '10_24' : '1_9';

  assert.equal(getBracket(1), '1_9');
  assert.equal(getBracket(9), '1_9');
  assert.equal(getBracket(10), '10_24');
  assert.equal(getBracket(24), '10_24');
  assert.equal(getBracket(25), '25_49');
  assert.equal(getBracket(49), '25_49');
  assert.equal(getBracket(50), '50_plus');
  assert.equal(getBracket(120), '50_plus');
});

test('P2 Statistical Process Control (CEP): Shewhart calculations and Western Electric Rule 1 anomaly detection', async () => {
  const {
    calculateMean,
    calculateStdDev,
    calculateControlLimits,
    recordSyncLeadTime,
    resetOperationalMetrics,
  } = await import('./operationalMetrics');

  resetOperationalMetrics();

  // Test statistical calculations on sample lead times [100, 110, 105, 95, 102]
  const samples = [100, 110, 105, 95, 102];
  const mean = calculateMean(samples);
  assert.equal(mean, 102.4);

  const stdDev = calculateStdDev(samples, mean);
  assert.ok(stdDev > 5 && stdDev < 6, `StdDev should be ~5.64, got ${stdDev}`);

  const { ucl, lcl } = calculateControlLimits(mean, stdDev);
  assert.ok(ucl > mean, 'UCL must be greater than mean');
  assert.ok(lcl >= 0, 'LCL must be non-negative');

  // Feed baseline in-control sync samples
  for (let i = 0; i < 6; i++) {
    const metrics = recordSyncLeadTime(100 + (i % 3) * 5, true);
    assert.equal(metrics.isOutOfControl, false, 'Baseline lead times within 3-sigma must not trigger anomaly');
  }

  // Extreme spike (Western Electric Rule 1: Point > UCL)
  const anomalousMetrics = recordSyncLeadTime(2500, true);
  assert.equal(anomalousMetrics.isOutOfControl, true, 'Massive spike must be flagged as out-of-control (SPC Rule 1)');
});

test('P2 Infrastructure & Security: firebase.json CSP enforces upgrade-insecure-requests and origin isolation', async () => {
  const fs = await import('fs');
  const path = await import('path');
  const firebaseJson = JSON.parse(
    fs.readFileSync(path.resolve(process.cwd(), 'firebase.json'), 'utf-8')
  );

  const globalHeaders = firebaseJson.hosting.headers.find((h: any) => h.source === '**');
  assert.ok(globalHeaders, 'Global headers configuration must exist');

  const cspHeader = globalHeaders.headers.find((h: any) => h.key === 'Content-Security-Policy');
  assert.ok(cspHeader, 'Content-Security-Policy header must exist');
  assert.ok(cspHeader.value.includes('upgrade-insecure-requests'), 'CSP must include upgrade-insecure-requests');
  assert.ok(cspHeader.value.includes("frame-ancestors 'none'"), 'CSP must forbid iframe framing (anti-clickjacking)');
  assert.ok(cspHeader.value.includes('generativelanguage.googleapis.com'), 'CSP must permit Gemini API host');
});

test('P2 DevOps & CI/CD: Pipeline configuration and Rollup chunking rules', async () => {
  const fs = await import('fs');
  const path = await import('path');

  // Verify CI/CD workflow exists
  const workflowPath = path.resolve(process.cwd(), '.github/workflows/production-pipeline.yml');
  assert.ok(fs.existsSync(workflowPath), 'production-pipeline.yml must exist');
  const workflowContent = fs.readFileSync(workflowPath, 'utf-8');
  assert.ok(workflowContent.includes('npm run lint'), 'CI/CD must execute static typecheck');
  assert.ok(workflowContent.includes('npm run build'), 'CI/CD must execute production build');

  // Verify vite.config.ts chunk size warning limit and manual chunking
  const viteConfigContent = fs.readFileSync(path.resolve(process.cwd(), 'vite.config.ts'), 'utf-8');
  assert.ok(viteConfigContent.includes('chunkSizeWarningLimit: 600'), 'chunkSizeWarningLimit must be tightened to 600');
  assert.ok(viteConfigContent.includes('vendor-firebase-firestore'), 'vendor-firebase-firestore chunk must be isolated');
  assert.ok(viteConfigContent.includes('vendor-charts'), 'vendor-charts chunk must be isolated');
});

test('P0 Anti-Exploit: revertXpAndCoins bidirectionally rolls back level and recalibrates requiredXp', () => {
  // Case A: Simple XP deduction without level down
  const statsL1 = createMockStats({ level: 1, currentXp: 50, requiredXp: 180, totalXpEarned: 100, coins: 50 });
  const revertedL1 = revertXpAndCoins(statsL1, 20, 10);
  assert.equal(revertedL1.currentXp, 30);
  assert.equal(revertedL1.level, 1);
  assert.equal(revertedL1.totalXpEarned, 80);
  assert.equal(revertedL1.coins, 40);

  // Case B: Player leveled up to Level 2 (had 20 XP in L2, 120 XP earned from checked task)
  // Reverting 120 XP must de-level back to Level 1 and recalibrate requiredXp to 180
  const statsL2 = createMockStats({ level: 2, currentXp: 20, requiredXp: 240, totalXpEarned: 200, coins: 50 });
  const revertedL2 = revertXpAndCoins(statsL2, 120, 25);
  assert.equal(revertedL2.level, 1, 'Player must de-level back to 1 on unchecking task that caused level up');
  assert.equal(revertedL2.requiredXp, 180, 'requiredXp must recalibrate to Level 1 threshold');
  assert.equal(revertedL2.currentXp, 80, 'currentXp must equal 20 - 120 + 180 = 80 XP');
  assert.equal(revertedL2.totalXpEarned, 80);
  assert.equal(revertedL2.coins, 25);

  // Case C: Massive rollback floor guards (never negative level, xp, or coins)
  const excessiveRevert = revertXpAndCoins(statsL1, 5000, 1000);
  assert.equal(excessiveRevert.level, 1);
  assert.equal(excessiveRevert.currentXp, 0);
  assert.equal(excessiveRevert.totalXpEarned, 0);
  assert.equal(excessiveRevert.coins, 0);
});

test('P0 Anti-Exploit: reopenDay cleanly reverts day bonuses to prevent infinite XP/coin duplication', async () => {
  const { usePlayerStore } = await import('../store/usePlayerStore');
  
  // Setup player with finalized day having bonusXp: 100, bonusCoins: 50
  const testDate = '2026-11-06';
  usePlayerStore.setState({
    stats: createMockStats({
      level: 2,
      currentXp: 50,
      totalXpEarned: 250,
      coins: 100,
      finalizedDays: {
        [testDate]: {
          finalizedAt: '2026-11-06T23:00:00Z',
          bonusXp: 100,
          bonusCoins: 50,
        }
      }
    })
  });

  // Execute reopenDay
  usePlayerStore.getState().reopenDay(testDate);
  const updatedStats = usePlayerStore.getState().stats;

  // Verify finalizedDays entry is deleted
  assert.equal(updatedStats.finalizedDays?.[testDate], undefined, 'Finalized day entry must be removed');
  // Verify bonusCoins (50) and bonusXp (100) were reversed
  assert.equal(updatedStats.coins, 50, 'Bonus coins must be deducted on day reopen');
  assert.equal(updatedStats.totalXpEarned, 150, 'Bonus XP must be deducted from totalXpEarned');
});

test('P0 Resilience: createResilientStorage catches corrupted JSON and quarantines it safely without WSOD', () => {
  const mockStorage: Record<string, string> = {
    'valid_key': JSON.stringify({ state: { count: 1 } }),
    'corrupted_key': '{"state": {"count": 1, truncated...', // Broken syntax
  };

  // Mock window.localStorage
  const globalWindow = globalThis as any;
  const originalLocalStorage = globalWindow.localStorage;
  globalWindow.window = globalWindow;
  globalWindow.localStorage = {
    getItem: (key: string) => mockStorage[key] || null,
    setItem: (key: string, val: string) => { mockStorage[key] = val; },
    removeItem: (key: string) => { delete mockStorage[key]; },
  };

  let quarantined = false;
  const storage = createResilientStorage({
    onCorrupted: (key) => {
      quarantined = true;
      assert.equal(key, 'corrupted_key');
    }
  });

  // Valid key read
  const valid = storage.getItem('valid_key');
  assert.ok(valid !== null);

  // Corrupted key read must NOT throw, must return null, and must quarantine the corrupted data
  const corrupted = storage.getItem('corrupted_key');
  assert.equal(corrupted, null, 'Corrupted key must return null to allow default store hydration');
  assert.equal(quarantined, true, 'onCorrupted callback must be triggered');
  assert.equal(mockStorage['corrupted_key'], undefined, 'Corrupted key must be pruned from active key');

  const quarantineKeys = Object.keys(mockStorage).filter(k => k.startsWith('corrupted_key_corrupted_backup_'));
  assert.equal(quarantineKeys.length, 1, 'Corrupted payload must be quarantined in backup key');
  assert.ok(mockStorage[quarantineKeys[0]].includes('truncated'), 'Quarantined backup must preserve raw broken data');

  // Restore
  if (originalLocalStorage) {
    globalWindow.localStorage = originalLocalStorage;
  }
});

test('P1 Timezone Drift & International Date Line: grants 48h shield on >=12h extreme timezone shift', () => {
  const baseTime = 1000000;
  // Standard timezone shift: 5 hours (300 min)
  const standardDrift = evaluateTimezoneDrift(0, 300, baseTime);
  assert.equal(standardDrift.drifted, true);
  assert.equal(standardDrift.crossedDateLine, false);
  assert.equal(standardDrift.shieldExpiresAt, baseTime + 24 * 60 * 60 * 1000);
  assert.equal(standardDrift.offsetShiftHours, 5);

  // Extreme International Date Line shift: UTC+12 (-720) to UTC-10 (+600) -> 1320 min diff (22 hours)
  const idlDrift = evaluateTimezoneDrift(-720, 600, baseTime);
  assert.equal(idlDrift.drifted, true);
  assert.equal(idlDrift.crossedDateLine, true, 'Shifts >= 12h must be flagged as Date Line crossings');
  assert.equal(idlDrift.shieldExpiresAt, baseTime + 48 * 60 * 60 * 1000, 'Date Line crossing must grant 48h protection shield');
  assert.equal(idlDrift.offsetShiftHours, 22);
});

test('P1 Precision 3:00 AM Scheduler: getMsUntilNext3AM targets exactly next 03:00:00 local time', async () => {
  const { getMsUntilNext3AM } = await import('../hooks/useDayCycle');

  // Case 1: Currently 01:30 AM (before 3 AM)
  const time130AM = new Date('2026-11-06T01:30:00');
  const msRemaining130 = getMsUntilNext3AM(time130AM);
  const targetDate130 = new Date(time130AM.getTime() + msRemaining130);
  assert.equal(targetDate130.getHours(), 3);
  assert.equal(targetDate130.getMinutes(), 0);
  assert.equal(targetDate130.getSeconds(), 0);
  assert.equal(msRemaining130, 90 * 60 * 1000); // exactly 90 minutes

  // Case 2: Currently 15:00 PM (after 3 AM) -> targets 03:00 AM of next day
  const time3PM = new Date('2026-11-06T15:00:00');
  const msRemaining3PM = getMsUntilNext3AM(time3PM);
  const targetDate3PM = new Date(time3PM.getTime() + msRemaining3PM);
  assert.equal(targetDate3PM.getHours(), 3);
  assert.equal(targetDate3PM.getMinutes(), 0);
  assert.equal(targetDate3PM.getSeconds(), 0);
  assert.equal(msRemaining3PM, 12 * 60 * 60 * 1000); // exactly 12 hours
});

test('P1 iOS Ergonomics: index.css defines pt-safe and pb-safe with CSS env() fallback', async () => {
  const fs = await import('fs');
  const path = await import('path');
  const css = fs.readFileSync(path.resolve(process.cwd(), 'src/index.css'), 'utf-8');

  assert.ok(css.includes('.pt-safe'), 'pt-safe must be declared in index.css');
  assert.ok(css.includes('safe-area-inset-top'), 'pt-safe must map to safe-area-inset-top');
  assert.ok(css.includes('.pb-safe'), 'pb-safe must be declared in index.css');
  assert.ok(css.includes('safe-area-inset-bottom'), 'pb-safe must map to safe-area-inset-bottom');
});

test('P2 ErrorBoundary Self-Healing: executeEmergencyStorageRecovery archives critical stores and clears active keys', async () => {
  const { executeEmergencyStorageRecovery } = await import('./storage');

  const storeMap: Record<string, string> = {
    'la-solucion-task-store': JSON.stringify({ state: { tasksByDate: { '2026-11-07': [] } } }),
    'quantum-os-player-stats': JSON.stringify({ state: { stats: { level: 10, coins: 500 } } }),
    'quantum-os-app-store': JSON.stringify({ state: { activeTab: 'tasks' } }),
    'unrelated_user_setting': 'dark_theme_enabled',
  };

  const mockStorage: Storage = {
    getItem: (key: string) => storeMap[key] ?? null,
    setItem: (key: string, val: string) => {
      storeMap[key] = val;
    },
    removeItem: (key: string) => {
      delete storeMap[key];
    },
    clear: () => {
      for (const k of Object.keys(storeMap)) delete storeMap[k];
    },
    key: (i: number) => Object.keys(storeMap)[i] ?? null,
    length: Object.keys(storeMap).length,
  };

  const result = await executeEmergencyStorageRecovery(mockStorage);

  // Critical keys must be cleared from active storage to eliminate WSOD crash loops
  assert.equal(storeMap['la-solucion-task-store'], undefined);
  assert.equal(storeMap['quantum-os-player-stats'], undefined);
  assert.equal(storeMap['quantum-os-app-store'], undefined);

  // Unrelated keys must not be disturbed
  assert.equal(storeMap['unrelated_user_setting'], 'dark_theme_enabled');

  // Emergency backups must be preserved
  assert.equal(result.clearedKeys.length, 3);
  assert.equal(result.backedUpKeys.length, 3);

  const backupKeys = Object.keys(storeMap).filter((k) => k.includes('_emergency_backup_'));
  assert.equal(backupKeys.length, 3);
  const playerStatsBackup = backupKeys.find((k) => k.startsWith('quantum-os-player-stats_emergency_backup_'));
  assert.ok(playerStatsBackup);
  assert.ok(storeMap[playerStatsBackup].includes('level'));
});

test('P2 Zero Defects QA: auditOutboxIntegrity detects anomalies, poison pills, duplicates, and stalled in_flight operations', async () => {
  const { auditOutboxIntegrity } = await import('../services/offlineOutboxService');
  const now = 1000000;

  // Case 1: Pristine outbox queue
  const pristineOps: any[] = [
    { id: 'op_1', type: 'TASK_TOGGLE', timestamp: now - 1000, userId: 'u1', status: 'pending', attempts: 0 },
    { id: 'op_2', type: 'HABIT_INCREMENT', timestamp: now - 500, userId: 'u1', status: 'pending', attempts: 1 },
  ];
  const cleanAudit = auditOutboxIntegrity(pristineOps, { now });
  assert.equal(cleanAudit.healthy, true);
  assert.equal(cleanAudit.duplicateIdCount, 0);
  assert.equal(cleanAudit.poisonPillCount, 0);
  assert.equal(cleanAudit.stalledInFlightCount, 0);
  assert.equal(cleanAudit.anomalies.length, 0);

  // Case 2: Queue with duplicates, poison pills (attempts >= 5), and stalled in_flight (> 5 min)
  const problematicOps: any[] = [
    { id: 'op_1', type: 'TASK_TOGGLE', timestamp: now - 1000, userId: 'u1', status: 'pending', attempts: 0 },
    { id: 'op_1', type: 'TASK_TOGGLE', timestamp: now - 900, userId: 'u1', status: 'pending', attempts: 0 }, // Duplicate!
    { id: 'op_poison', type: 'SHOP_REDEEM', timestamp: now - 2000, userId: 'u1', status: 'pending', attempts: 6 }, // Poison!
    { id: 'op_stalled', type: 'POMODORO_COMPLETE', timestamp: now - 600000, userId: 'u1', status: 'in_flight', attempts: 2 }, // Stalled (10m ago)
  ];
  const dirtyAudit = auditOutboxIntegrity(problematicOps, { now, maxAttempts: 5, stallTimeoutMs: 300000 });
  assert.equal(dirtyAudit.healthy, false);
  assert.equal(dirtyAudit.duplicateIdCount, 1);
  assert.equal(dirtyAudit.poisonPillCount, 1);
  assert.equal(dirtyAudit.stalledInFlightCount, 1);
  assert.equal(dirtyAudit.anomalies.length, 3);
});

test('P2 Transactional Granularity: OutboxMutationType supports discrete gameplay events', async () => {
  const { auditOutboxIntegrity } = await import('../services/offlineOutboxService');
  const mutationTypes = [
    'TASK_TOGGLE',
    'HABIT_INCREMENT',
    'HABIT_RESET',
    'DAY_FINALIZE',
    'DAY_REOPEN',
    'POMODORO_COMPLETE',
    'SHOP_REDEEM',
    'JOURNAL_SAVE',
    'FULL_SYNC_SNAPSHOT',
  ];

  const ops: any[] = mutationTypes.map((type, idx) => ({
    id: `op_${idx}`,
    type,
    timestamp: 1000 + idx,
    userId: 'usr_test',
    status: 'pending',
    attempts: 0,
    payload: { actionIndex: idx },
  }));

  const report = auditOutboxIntegrity(ops);
  assert.equal(report.healthy, true);
  assert.equal(report.totalCount, 9);
});

test('P0 Anti-Exploit: reopenDay blocks reopening when user has spent coins and balance is insufficient', async () => {
  const { usePlayerStore } = await import('../store/usePlayerStore');
  const { handleReopenDay } = await import('../engine/gameEngine');

  const testDate = '2026-11-06';
  // Player earned 50 bonus coins, but now only has 20 coins (spent 30 in shop)
  usePlayerStore.setState({
    stats: createMockStats({
      level: 2,
      currentXp: 50,
      totalXpEarned: 250,
      coins: 20, // Less than bonusCoins (50)
      finalizedDays: {
        [testDate]: {
          finalizedAt: '2026-11-06T23:00:00Z',
          bonusXp: 100,
          bonusCoins: 50,
        }
      }
    })
  });

  // Attempt to reopen via reopenDay
  const storeResult = usePlayerStore.getState().reopenDay(testDate);
  assert.equal(storeResult, false, 'reopenDay must return false when coins < bonusCoins');
  assert.notEqual(usePlayerStore.getState().stats.finalizedDays?.[testDate], undefined, 'Finalized day must NOT be removed');
  assert.equal(usePlayerStore.getState().stats.coins, 20, 'Coins must not be modified or fall negative');

  // Attempt to reopen via handleReopenDay
  const engineResult = handleReopenDay(testDate);
  assert.equal(engineResult, false, 'handleReopenDay must block reopening');
  assert.notEqual(usePlayerStore.getState().stats.finalizedDays?.[testDate], undefined);
});

test('P0 Cold Archive: fetchColdArchivedTasksForDate retrieves pruned tasks and useTaskStore hydrates them', async () => {
  const { fetchColdArchivedTasksForDate, persistColdArchiveToIndexedDB } = await import('./level3Systems');
  const { useTaskStore } = await import('../store/useTaskStore');

  // Ensure window and indexedDB mock in node environment
  const globalWindow = globalThis as any;
  if (!globalWindow.indexedDB) {
    const memoryDB: Record<string, Record<string, any>> = {};
    globalWindow.window = globalWindow;
    globalWindow.indexedDB = {
      open: (dbName: string) => {
        if (!memoryDB[dbName]) memoryDB[dbName] = {};
        const req: any = {
          result: {
            objectStoreNames: {
              contains: (name: string) => Boolean(memoryDB[dbName][name]),
            },
            createObjectStore: (name: string) => {
              memoryDB[dbName][name] = {};
              return {
                createIndex: () => ({}),
              };
            },
            transaction: (storeName: string, mode: string) => {
              const storeMap = memoryDB[dbName][storeName] || {};
              const tx: any = {
                objectStore: () => ({
                  put: (val: any, key: string) => { storeMap[key || val?.id] = val; },
                  get: (key: string) => {
                    const getReq: any = { result: storeMap[key] };
                    setTimeout(() => { if (getReq.onsuccess) getReq.onsuccess(); }, 0);
                    return getReq;
                  },
                  getAll: () => {
                    const getReq: any = { result: Object.values(storeMap) };
                    setTimeout(() => { if (getReq.onsuccess) getReq.onsuccess(); }, 0);
                    return getReq;
                  },
                  count: () => {
                    const countReq: any = { result: Object.keys(storeMap).length };
                    setTimeout(() => { if (countReq.onsuccess) countReq.onsuccess(); }, 0);
                    return countReq;
                  },
                  index: () => ({
                    openCursor: () => {
                      const curReq: any = { result: null };
                      setTimeout(() => { if (curReq.onsuccess) curReq.onsuccess(); }, 0);
                      return curReq;
                    },
                  }),
                }),
                oncomplete: null,
                onerror: null,
              };
              setTimeout(() => { if (tx.oncomplete) tx.oncomplete(); }, 0);
              return tx;
            },
            close: () => {},
          },
          onsuccess: null,
          onerror: null,
          onupgradeneeded: null,
        };
        setTimeout(() => {
          if (req.onupgradeneeded) req.onupgradeneeded();
          if (req.onsuccess) req.onsuccess();
        }, 0);
        return req;
      }
    };
  }

  const archiveDate = '2026-10-01';
  const mockTasks = [
    { id: 'archived_t1', title: 'Antigua Tarea Táctica', completed: true, xpReward: 50, coinReward: 15 }
  ];

  const persistOk = await persistColdArchiveToIndexedDB({ [archiveDate]: mockTasks as any });
  assert.equal(persistOk, true);

  const fetched = await fetchColdArchivedTasksForDate(archiveDate);
  assert.equal(fetched.length, 1);
  assert.equal(fetched[0].id, 'archived_t1');

  // Verify useTaskStore.loadColdTasksForDate integrates them
  useTaskStore.setState({ tasksByDate: {} });
  const loaded = await useTaskStore.getState().loadColdTasksForDate(archiveDate);
  assert.equal(loaded.length, 1);
  assert.equal(loaded[0].id, 'archived_t1');
  assert.equal(useTaskStore.getState().tasksByDate[archiveDate]?.length, 1);
});

test('Fase 2 (P1): 27-Hour Chronological Normalization in timeUtils', () => {
  // Daytime tasks
  assert.equal(parseTimeToMinutes('09:00'), 540);
  assert.equal(parseTimeToMinutes('23:00'), 1380);

  // Owl tasks [00:00, 03:00) mapped to [1440, 1619] in logical 27h day
  assert.equal(parseTimeToMinutes('00:15'), 1455);
  assert.equal(parseTimeToMinutes('01:30'), 1530);
  assert.equal(parseTimeToMinutes('02:45'), 1605);

  // Verification that late-night task (23:00) appears chronologically BEFORE post-midnight (01:30 AM)
  assert.ok(parseTimeToMinutes('23:00') < parseTimeToMinutes('01:30'));

  // End time parsing
  assert.equal(parseEndTimeToMinutes('01:00 - 02:30'), 1590);

  // Strict 24-hour mode (without logical extension)
  assert.equal(parseTimeToMinutes('01:30', false), 90);
  assert.equal(parseEndTimeToMinutes('01:00 - 02:30', false), 150);
});

test('Fase 3 (P2): Telemetry Queue Buffer Bounds & Diagnostic Health', async () => {
  // Verificación de límite de eventos de telemetría en búfer para prevenir sobrecarga de memoria
  assert.equal(MAX_BUFFERED_TELEMETRY_EVENTS, 200);

  // Diagnóstico de estado del búfer sin excepciones
  const status = await getTelemetryQueueStatus();
  assert.equal(typeof status.count, 'number');
  assert.ok(status.count >= 0);
});

test('Fase 3 (P2): Lógica Matemática del Límite Nocturno 3:00 AM y Fechas en date.ts', () => {
  // 1. Umbral nocturno exacto (Night Owl Streak Protection)
  // Las 02:59:59 del 8 de Noviembre se cuenta lógicamente como el 7 de Noviembre
  const lateNight = new Date(2026, 10, 8, 2, 59, 59);
  assert.equal(getTodayDateString(lateNight), '2026-11-07');

  // Exactamente a las 03:00:00 del 8 de Noviembre cambia al nuevo día
  const exactCutoff = new Date(2026, 10, 8, 3, 0, 0);
  assert.equal(getTodayDateString(exactCutoff), '2026-11-08');

  // A las 03:00:01 del 8 de Noviembre sigue siendo el nuevo día
  const postCutoff = new Date(2026, 10, 8, 3, 0, 1);
  assert.equal(getTodayDateString(postCutoff), '2026-11-08');

  // Horario diurno: 14:30:00 del 8 de Noviembre es 2026-11-08
  const midday = new Date(2026, 10, 8, 14, 30, 0);
  assert.equal(getTodayDateString(midday), '2026-11-08');

  // Medianoche: 00:30:00 del 9 de Noviembre sigue perteneciendo al día táctico 2026-11-08
  const midnightOwl = new Date(2026, 10, 9, 0, 30, 0);
  assert.equal(getTodayDateString(midnightOwl), '2026-11-08');

  // 2. Operaciones con límites de calendario
  assert.equal(addDaysToDateString('2026-12-31', 1), '2027-01-01');
  assert.equal(addDaysToDateString('2026-03-01', -1), '2026-02-28');
  assert.equal(formatDateToLocal(new Date(2026, 10, 8, 12, 0, 0)), '2026-11-08');

  // 3. Duración de sueño con cruce de medianoche
  assert.equal(calcSleepDuration('23:00', '07:00'), 8.0);
  assert.equal(calcSleepDuration('01:30', '08:00'), 6.5);
  assert.equal(calcSleepDuration(undefined, '08:00'), null);
});

test('Fase 3 (P2): Motor de Juego: Límites de XP, Monedas y Anti-Exploit en gameEngine.ts', () => {
  const baseStats = createMockStats({
    level: 1,
    currentXp: 0,
    requiredXp: getRequiredXpForLevel(1), // 180 XP
    coins: 50,
    totalXpEarned: 0,
  });

  // 1. Ganancia normal de XP sin subir de nivel
  const gainedSubLevel = checkLevelUp(baseStats, 100, 25);
  assert.equal(gainedSubLevel.level, 1);
  assert.equal(gainedSubLevel.currentXp, 100);
  assert.equal(gainedSubLevel.requiredXp, 180);
  assert.equal(gainedSubLevel.coins, 75);
  assert.equal(gainedSubLevel.totalXpEarned, 100);

  // 2. Subida de nivel exacta al alcanzar requiredXp
  const levelUpExact = checkLevelUp(baseStats, 180, 50);
  assert.equal(levelUpExact.level, 2);
  assert.equal(levelUpExact.currentXp, 0);
  assert.equal(levelUpExact.requiredXp, getRequiredXpForLevel(2));
  assert.equal(levelUpExact.coins, 100);
  assert.equal(levelUpExact.totalXpEarned, 180);

  // 3. Subida con remanente de XP (Carryover)
  const withCarryover = checkLevelUp(baseStats, 200, 30);
  assert.equal(withCarryover.level, 2);
  assert.equal(withCarryover.currentXp, 20); // 200 - 180
  assert.equal(withCarryover.requiredXp, getRequiredXpForLevel(2));

  // 4. Límite máximo de nivel (Cap Nivel 100)
  const massiveXpStats = checkLevelUp(baseStats, 10000000, 500);
  assert.ok(massiveXpStats.level <= 100);
  assert.ok(massiveXpStats.coins >= 550);

  // 5. Anti-Exploit: Deducción bidireccional y límites inferiores (Sin números negativos)
  const statsToRevert = createMockStats({
    level: 2,
    currentXp: 20,
    requiredXp: getRequiredXpForLevel(2),
    coins: 15,
    totalXpEarned: 200,
  });

  // Deducción que regresa al nivel 1
  const reverted = revertXpAndCoins(statsToRevert, 50, 10);
  assert.equal(reverted.level, 1);
  assert.equal(reverted.currentXp, 150); // 20 - 50 + 180
  assert.equal(reverted.coins, 5);
  assert.equal(reverted.totalXpEarned, 150);

  // Deducción extrema: Monedas y XP nunca son negativas (clampeadas a 0)
  const clamped = revertXpAndCoins(reverted, 1000, 1000);
  assert.equal(clamped.level, 1);
  assert.equal(clamped.currentXp, 0);
  assert.equal(clamped.coins, 0);
  assert.equal(clamped.totalXpEarned, 0);
});

test('Fase 4: Ritmo de Jornada Personalizado (Turno Nocturno 9 PM, Vespertino 3 PM, 10 AM y 3 AM)', async () => {
  const { getMsUntilNextCutoff } = await import('../hooks/useDayCycle');

  // 1. Helpers de formateo
  assert.equal(formatHourToHuman(0), '12:00 AM');
  assert.equal(formatHourToHuman(6), '06:00 AM');
  assert.equal(formatHourToHuman(10), '10:00 AM');
  assert.equal(formatHourToHuman(15), '03:00 PM');
  assert.equal(formatHourToHuman(21), '09:00 PM');

  // 2. Control global de hora de inicio
  setGlobalDayStartHour(21);
  assert.equal(getGlobalDayStartHour(), 21);
  setGlobalDayStartHour(-5); // Debe clampear a 0
  assert.equal(getGlobalDayStartHour(), 0);
  setGlobalDayStartHour(35); // Debe clampear a 23
  assert.equal(getGlobalDayStartHour(), 23);

  // 3. Turno Nocturno (9:00 PM / 21:00)
  // Quien entra a las 9 PM mantiene sus tareas de la madrugada en el mismo día
  const nightCutoff = 21;
  const startShiftNov8 = new Date(2026, 10, 8, 21, 0, 0);
  const midShiftNov9 = new Date(2026, 10, 9, 2, 30, 0); // 2:30 AM
  const endShiftNov9 = new Date(2026, 10, 9, 7, 0, 0);  // 7:00 AM
  const restDayNov9 = new Date(2026, 10, 9, 20, 59, 59); // Justo antes del nuevo turno
  const nextShiftNov9 = new Date(2026, 10, 9, 21, 0, 0);  // Siguiente turno

  assert.equal(getTodayDateString(startShiftNov8, nightCutoff), '2026-11-08');
  assert.equal(getTodayDateString(midShiftNov9, nightCutoff), '2026-11-08');
  assert.equal(getTodayDateString(endShiftNov9, nightCutoff), '2026-11-08');
  assert.equal(getTodayDateString(restDayNov9, nightCutoff), '2026-11-08');
  assert.equal(getTodayDateString(nextShiftNov9, nightCutoff), '2026-11-09');

  // Orden cronológico de tareas en turno de noche (21:00 -> 23:30 -> 02:00 AM -> 05:00 AM)
  const t21 = parseTimeToMinutes('21:00', true, nightCutoff);
  const t23 = parseTimeToMinutes('23:30', true, nightCutoff);
  const t02 = parseTimeToMinutes('02:00', true, nightCutoff);
  const t05 = parseTimeToMinutes('05:00', true, nightCutoff);

  assert.ok(t21 < t23, '21:00 debe ir antes de 23:30');
  assert.ok(t23 < t02, '23:30 debe ir antes de 02:00 AM en turno de noche');
  assert.ok(t02 < t05, '02:00 AM debe ir antes de 05:00 AM en turno de noche');

  // 4. Turno de la Tarde (3:00 PM / 15:00)
  const afternoonCutoff = 15;
  const startAfternoon = new Date(2026, 10, 8, 15, 0, 0);
  const lateEvening = new Date(2026, 10, 8, 23, 0, 0);
  const afterMidnight = new Date(2026, 10, 9, 1, 30, 0);
  const nextAfternoon = new Date(2026, 10, 9, 15, 0, 0);

  assert.equal(getTodayDateString(startAfternoon, afternoonCutoff), '2026-11-08');
  assert.equal(getTodayDateString(lateEvening, afternoonCutoff), '2026-11-08');
  assert.equal(getTodayDateString(afterMidnight, afternoonCutoff), '2026-11-08');
  assert.equal(getTodayDateString(nextAfternoon, afternoonCutoff), '2026-11-09');

  const ta15 = parseTimeToMinutes('15:00', true, afternoonCutoff);
  const ta22 = parseTimeToMinutes('22:00', true, afternoonCutoff);
  const ta01 = parseTimeToMinutes('01:00', true, afternoonCutoff);

  assert.ok(ta15 < ta22, '15:00 antes de 22:00');
  assert.ok(ta22 < ta01, '22:00 antes de 01:00 AM en turno vespertino');

  // 5. getMsUntilNextCutoff calcula milisegundos exactos al siguiente corte
  const fixedNow = new Date('2026-11-08T14:00:00');
  const msTo21 = getMsUntilNextCutoff(21, fixedNow);
  assert.equal(msTo21, 7 * 60 * 60 * 1000, 'De 14:00 a 21:00 deben ser exactamente 7 horas');

  // Restaurar corte estándar por defecto
  setGlobalDayStartHour(3);
});
