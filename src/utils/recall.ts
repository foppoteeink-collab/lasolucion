import { RecallItem, TaskCategory, TaskItem } from '../types';
import { safeGetItem, safeSetItem } from './storage';
import { addDaysToDateString, getTodayDateString } from './date';

const STORAGE_KEY_RECALL = 'taskquest_recall_items_v1';

export const RECALL_INTERVALS_DAYS = [1, 3, 7, 14, 30, 60];

export const RECALL_LEVEL_LABELS = [
  'Aprendiz (1d)',
  'Familiar (3d)',
  'Afianzado (7d)',
  'Sólido (14d)',
  'Avanzado (30d)',
  'Dominado (60d)',
];

export { addDaysToDateString };

export const loadRecallItems = (): RecallItem[] => {
  try {
    const raw = safeGetItem(STORAGE_KEY_RECALL);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading recall items:', e);
    return [];
  }
};

export const saveRecallItems = (items: RecallItem[]) => {
  try {
    safeSetItem(STORAGE_KEY_RECALL, JSON.stringify(items));
  } catch (e) {
    console.error('Error saving recall items:', e);
  }
};

/**
 * Synchronizes recall memory bank with all task notes across all dates
 */
export const syncRecallWithTaskNotes = (
  tasksByDate: Record<string, TaskItem[]>,
  existingRecall: RecallItem[]
): RecallItem[] => {
  const existingByTaskId = new Map<string, RecallItem>();
  const existingByTitleAndCategory = new Map<string, RecallItem>();

  existingRecall.forEach((item) => {
    if (item.sourceTaskId) {
      existingByTaskId.set(item.sourceTaskId, item);
    }
    const key = `${(item.title || "").trim().toLowerCase()}__${item.category}`;
    existingByTitleAndCategory.set(key, item);
  });

  const updatedList = [...existingRecall];
  let hasChanges = false;

  Object.entries(tasksByDate).forEach(([dateStr, tasks]) => {
    tasks.forEach((task) => {
      const noteContent = task.notes?.trim();
      if (!noteContent) return;

      const matchedByTask = existingByTaskId.get(task.id);
      const key = `${(task.title || "").trim().toLowerCase()}__${task.category}`;
      const matchedByKey = existingByTitleAndCategory.get(key);

      if (matchedByTask) {
        // Update notes if changed
        if (matchedByTask.notes !== noteContent) {
          matchedByTask.notes = noteContent;
          matchedByTask.title = task.title;
          hasChanges = true;
        }
      } else if (matchedByKey) {
        if (matchedByKey.notes !== noteContent) {
          matchedByKey.notes = noteContent;
          hasChanges = true;
        }
        if (!matchedByKey.sourceTaskId) {
          matchedByKey.sourceTaskId = task.id;
          hasChanges = true;
        }
      } else {
        // Create new recall item
        const newItem: RecallItem = {
          id: `recall-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          sourceTaskId: task.id,
          sourceDate: dateStr,
          title: task.title,
          category: task.category,
          notes: noteContent,
          createdAt: dateStr || getTodayDateString(),
          nextReviewDate: addDaysToDateString(dateStr || getTodayDateString(), 1),
          level: 0,
          reviewsCount: 0,
          streak: 0,
        };
        updatedList.push(newItem);
        existingByTaskId.set(task.id, newItem);
        existingByTitleAndCategory.set(key, newItem);
        hasChanges = true;
      }
    });
  });

  if (hasChanges) {
    saveRecallItems(updatedList);
  }

  return updatedList;
};

export type RecallRating = 'again' | 'good' | 'easy';

export interface RecallResult {
  updatedItem: RecallItem;
  xpEarned: number;
  coinsEarned: number;
  nextDate: string;
}

export const processRecallReview = (
  item: RecallItem,
  rating: RecallRating,
  todayStr: string
): RecallResult => {
  let newLevel = item.level;
  let xp = 20;
  let coins = 10;
  let newStreak = item.streak;

  if (rating === 'again') {
    newLevel = 0;
    newStreak = 0;
    xp = 15;
    coins = 5;
  } else if (rating === 'good') {
    newLevel = Math.min(item.level + 1, RECALL_INTERVALS_DAYS.length - 1);
    newStreak = item.streak + 1;
    xp = 35 + newLevel * 5;
    coins = 15 + newLevel * 3;
  } else if (rating === 'easy') {
    newLevel = Math.min(item.level + 2, RECALL_INTERVALS_DAYS.length - 1);
    newStreak = item.streak + 2;
    xp = 50 + newLevel * 8;
    coins = 25 + newLevel * 4;
  }

  const daysToAdd = RECALL_INTERVALS_DAYS[newLevel] || 1;
  const nextDate = addDaysToDateString(todayStr, daysToAdd);

  const updatedItem: RecallItem = {
    ...item,
    level: newLevel,
    lastReviewedAt: todayStr,
    nextReviewDate: nextDate,
    reviewsCount: item.reviewsCount + 1,
    streak: newStreak,
  };

  return {
    updatedItem,
    xpEarned: xp,
    coinsEarned: coins,
    nextDate,
  };
};
