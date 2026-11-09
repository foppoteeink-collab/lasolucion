import test from 'node:test';
import assert from 'node:assert/strict';
import {
  deduplicateHabits,
  deduplicateTasksForDay,
  reconcileHabitCounterTask,
} from './taskDeduplication';
import { generateDailyTasks } from '../data/defaults';
import { CustomHabit, TaskItem } from '../types';

test('deduplicateTasksForDay preserves counter targetCount, unit, and progress when merging duplicates', () => {
  const configuredWater: TaskItem = {
    id: 'task-habit-water-2026-11-08',
    title: 'Tomar 8 Vasos de Agua',
    category: 'habito',
    xpReward: 10,
    coinReward: 5,
    completed: false,
    isHabit: true,
    isQuickHabit: true,
    isTracked2166: true,
    quickIcon: 'Droplets',
    targetCount: 8,
    currentCount: 3,
    unit: 'vasos',
  };

  const staleDuplicateWithoutCounter: TaskItem = {
    id: 'task-habit-water-2026-11-08-sync',
    title: 'Tomar 8 Vasos de Agua',
    category: 'habito',
    xpReward: 10,
    coinReward: 5,
    completed: false,
  };

  const mergedA = deduplicateTasksForDay([configuredWater, staleDuplicateWithoutCounter], '2026-11-08');
  assert.equal(mergedA.length, 1);
  assert.equal(mergedA[0].targetCount, 8);
  assert.equal(mergedA[0].currentCount, 3);
  assert.equal(mergedA[0].unit, 'vasos');
  assert.equal(mergedA[0].isHabit, true);
  assert.equal(mergedA[0].isQuickHabit, true);
  assert.equal(mergedA[0].isTracked2166, true);
  assert.equal(mergedA[0].quickIcon, 'Droplets');

  // Reverse order: unconfigured comes first, configured comes second
  const mergedB = deduplicateTasksForDay([staleDuplicateWithoutCounter, configuredWater], '2026-11-08');
  assert.equal(mergedB.length, 1);
  assert.equal(mergedB[0].targetCount, 8);
  assert.equal(mergedB[0].currentCount, 3);
  assert.equal(mergedB[0].unit, 'vasos');
});

test('deduplicateTasksForDay prevents corrupted 1/1 completed duplicate from locking partial 2/8 counter', () => {
  const partialWater: TaskItem = {
    id: 'task-habit-water-2026-11-08',
    title: 'Tomar Agua',
    category: 'habito',
    xpReward: 10,
    coinReward: 5,
    completed: false,
    isHabit: true,
    targetCount: 8,
    currentCount: 2,
    unit: 'vasos',
  };

  const corruptedDuplicate: TaskItem = {
    id: 'task-habit-water-2026-11-08-old',
    title: 'Tomar Agua',
    category: 'habito',
    xpReward: 10,
    coinReward: 5,
    completed: true,
    currentCount: 2,
  };

  const merged = deduplicateTasksForDay([partialWater, corruptedDuplicate], '2026-11-08');
  assert.equal(merged.length, 1);
  assert.equal(merged[0].targetCount, 8);
  assert.equal(merged[0].currentCount, 2);
  assert.equal(merged[0].completed, false);
  assert.equal(merged[0].completedAt, undefined);
});

test('deduplicateHabits preserves targetCount, unit, and quickIcon across duplicate habit entries', () => {
  const habits: CustomHabit[] = [
    {
      id: 'habit-water',
      title: 'Hidratación 2L',
      category: 'habito',
      xpReward: 10,
      coinReward: 5,
      frequencyType: 'daily',
      targetCount: 8,
      unit: 'vasos',
      isQuickHabit: true,
      quickIcon: 'Droplets',
    },
    {
      id: 'habit-water',
      title: 'Hidratación 2L',
      category: 'habito',
      xpReward: 10,
      coinReward: 5,
      frequencyType: 'daily',
      targetCount: 1,
    },
  ];

  const deduped = deduplicateHabits(habits);
  assert.equal(deduped.length, 1);
  assert.equal(deduped[0].targetCount, 8);
  assert.equal(deduped[0].unit, 'vasos');
  assert.equal(deduped[0].quickIcon, 'Droplets');
  assert.equal(deduped[0].isQuickHabit, true);
});

test('reconcileHabitCounterTask restores stripped counter targetCount and heals premature completion', () => {
  const customHabits: CustomHabit[] = [
    {
      id: 'habit-water',
      title: 'Tomar Agua',
      category: 'habito',
      xpReward: 8,
      coinReward: 3,
      frequencyType: 'daily',
      targetCount: 8,
      unit: 'vasos',
      isQuickHabit: true,
      isTracked2166: true,
      quickIcon: '💧',
    },
  ];

  const corruptedTask: TaskItem = {
    id: 'task-habit-water-2026-11-08',
    title: 'Tomar Agua',
    category: 'habito',
    xpReward: 8,
    coinReward: 3,
    completed: true,
    completedAt: '2026-11-08T14:00:00.000Z',
    currentCount: 1,
    isQuickHabit: true,
  };

  const healed = reconcileHabitCounterTask(corruptedTask, customHabits);
  assert.equal(healed.targetCount, 8);
  assert.equal(healed.unit, 'vasos');
  assert.equal(healed.currentCount, 1);
  assert.equal(healed.completed, false);
  assert.equal(healed.completedAt, undefined);

  // Synced carry-over ID format also matches and keeps completed=true when currentCount >= targetCount
  const syncedCompleted: TaskItem = {
    id: 'task-habit-water-2026-11-07-sync-2026-11-08-0',
    title: 'Tomar Agua',
    category: 'habito',
    xpReward: 8,
    coinReward: 3,
    completed: true,
    completedAt: '2026-11-08T18:00:00.000Z',
    currentCount: 8,
    targetCount: 8,
    unit: 'vasos',
    isHabit: true,
  };
  const untouched = reconcileHabitCounterTask(syncedCompleted, customHabits);
  assert.equal(untouched, syncedCompleted);
});

test('generateDailyTasks preserves targetCount and unit for any counter habit even without isTracked2166', () => {
  const habits: CustomHabit[] = [
    {
      id: 'custom-counter-1',
      title: 'Vasos de Agua',
      category: 'salud',
      xpReward: 5,
      coinReward: 2,
      frequencyType: 'daily',
      targetCount: 8,
      unit: 'vasos',
      isTracked2166: false,
      isQuickHabit: false,
    },
  ];

  const generated = generateDailyTasks('2026-11-08', habits);
  const waterTask = generated.find((t) => t.id === 'task-custom-counter-1-2026-11-08');
  assert.ok(waterTask);
  assert.equal(waterTask.isHabit, true);
  assert.equal(waterTask.targetCount, 8);
  assert.equal(waterTask.currentCount, 0);
  assert.equal(waterTask.unit, 'vasos');
});
