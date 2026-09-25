import { HabitMasteryRecord, TaskItem, PlayerStats, AppNotification } from '../types';
import { getTodayDateString } from '../utils/date';

export const getAdjacentDateStr = (dateStr: string, dayOffset: number): string => {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + dayOffset);
  const nextY = date.getFullYear();
  const nextM = String(date.getMonth() + 1).padStart(2, '0');
  const nextD = String(date.getDate()).padStart(2, '0');
  return `${nextY}-${nextM}-${nextD}`;
};

export const getHabitBaseId = (task: TaskItem | { id: string; title?: string; category?: string }): string => {
  // Extract base ID from generated daily task ID (e.g. task-habit-water-2026-09-06 -> habit-water)
  const match = task.id.match(/^task-(.+)-\d{4}-\d{2}-\d{2}$/);
  if (match) {
    return match[1];
  }

  // Fallback if not a generated daily task
  const matchCustom = task.id.match(/^(custom-habit-\d+)/);
  if (matchCustom) {
    return matchCustom[1];
  }

  // Legacy fallback
  const titleLower = (task.title || '').trim().toLowerCase();
  if (task.category === 'entrenamiento' || titleLower.includes('ejercicio') || titleLower.includes('entrenamiento')) {
    return 'habito-ejercicio-diario';
  }
  return titleLower.replace(/[^a-z0-9]/g, '-');
};

export const matchHabitTask = (
  candidate: TaskItem,
  baseId: string,
  normalizedTitle: string
): boolean => {
  if (!candidate) return false;
  if (candidate.id === baseId) return true;
  const candidateBaseId = getHabitBaseId(candidate);
  if (candidateBaseId && candidateBaseId === baseId) return true;

  const candidateTitle = (candidate.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalizedTitle && candidateTitle === normalizedTitle) return true;

  if (baseId.includes('water') && (candidateTitle.includes('agua') || candidate.id.includes('water'))) return true;
  if (baseId.includes('teeth') && (candidateTitle.includes('dientes') || candidateTitle.includes('cepillado') || candidate.id.includes('teeth'))) return true;
  if (baseId.includes('ejercicio') && (candidateTitle.includes('ejercicio') || candidateTitle.includes('entrenamiento'))) return true;

  return false;
};

export const isHabitCompletedInDay = (
  dayTasks: TaskItem[] | undefined,
  baseId: string,
  normalizedTitle: string
): boolean => {
  if (!dayTasks || !Array.isArray(dayTasks)) return false;
  const found = dayTasks.find(t => matchHabitTask(t, baseId, normalizedTitle));
  if (!found) return false;
  if (found.completed) return true;
  if (found.targetCount !== undefined && found.currentCount !== undefined && found.currentCount >= found.targetCount) {
    return true;
  }
  if (found.isHabit && (found.currentCount || 0) >= (found.targetCount || 1)) {
    return true;
  }
  return false;
};

export const computeHabitStreak = (
  task: TaskItem,
  tasksByDate: Record<string, TaskItem[]>,
  currentDate?: string,
  storedMastery?: HabitMasteryRecord
): { currentStreak: number; highestStreak: number } => {
  const baseId = getHabitBaseId(task);
  const normalizedTitle = (task.title || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
  const refDate = currentDate || getTodayDateString();

  // 1. Is it completed on reference date?
  const isDoneRefDate = isHabitCompletedInDay(tasksByDate[refDate], baseId, normalizedTitle);

  // 2. Count consecutive completed days backward from yesterday
  let backwardStreak = 0;
  let checkDate = getAdjacentDateStr(refDate, -1);

  while (backwardStreak < 365 && isHabitCompletedInDay(tasksByDate[checkDate], baseId, normalizedTitle)) {
    backwardStreak++;
    checkDate = getAdjacentDateStr(checkDate, -1);
  }

  // If done on reference date, streak includes reference date (backwardStreak + 1)
  // If not done on reference date, user still has the ongoing streak from yesterday (backwardStreak)
  const currentStreak = isDoneRefDate ? backwardStreak + 1 : backwardStreak;

  // 3. Calculate all-time highest streak across all dates in history
  let maxConsecutive = currentStreak;
  const sortedDates = Object.keys(tasksByDate).filter(d => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
  let tempStreak = 0;
  let prevDateStr: string | null = null;

  for (const dateKey of sortedDates) {
    if (isHabitCompletedInDay(tasksByDate[dateKey], baseId, normalizedTitle)) {
      if (prevDateStr && getAdjacentDateStr(prevDateStr, 1) === dateKey) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
      prevDateStr = dateKey;
      if (tempStreak > maxConsecutive) {
        maxConsecutive = tempStreak;
      }
    } else {
      tempStreak = 0;
      prevDateStr = null;
    }
  }

  const highestStreak = Math.max(
    maxConsecutive,
    storedMastery?.highestStreak || 0,
    currentStreak
  );

  return { currentStreak, highestStreak };
};

export const evaluateMasteryChange = (
  task: TaskItem, 
  allTasksByDate: Record<string, TaskItem[]>, 
  currentMastery: Record<string, HabitMasteryRecord>,
  currentDate?: string
): { 
  newMastery: Record<string, HabitMasteryRecord>, 
  bonusXp: number, 
  notifications: AppNotification[] 
} => {
  // Strictly evaluate dedicated 21 & 66 day habits or custom habits
  const is2166Habit = Boolean(
    task.isTracked2166 || 
    task.isQuickHabit || 
    task.isHabit ||
    task.id.includes('habit-water') || 
    task.id.includes('habit-teeth')
  );
  if (!is2166Habit) return { newMastery: currentMastery, bonusXp: 0, notifications: [] };
  
  const baseId = getHabitBaseId(task);
  const record = currentMastery[baseId] || {
    taskId: baseId,
    currentStreak: 0,
    highestStreak: 0,
    isMaltzReached: false,
    isMastered: false,
    shieldActive: false,
    multiplier: 1.0
  };

  const { currentStreak, highestStreak } = computeHabitStreak(
    task,
    allTasksByDate,
    currentDate || getTodayDateString(),
    record
  );

  const newRecord: HabitMasteryRecord = {
    ...record,
    currentStreak,
    highestStreak
  };

  let bonusXp = 0;
  const notifications: AppNotification[] = [];

  // Maltz Check (21 Days)
  if (currentStreak >= 21 && !record.isMaltzReached) {
    newRecord.isMaltzReached = true;
    bonusXp += 500;
    notifications.push({
      id: `maltz-${Date.now()}`,
      title: '¡La Barrera de Maltz Superada!',
      message: `Tu mente ha asimilado el patrón de "${task.title}". Has alcanzado 21 días de disciplina (+500 XP).`,
      timestamp: new Date().toISOString(),
      type: 'streak',
      read: false
    });
  }

  // Mastered Check (66 Days)
  if (currentStreak >= 66 && !record.isMastered) {
    newRecord.isMastered = true;
    newRecord.multiplier = 1.5;
    notifications.push({
      id: `mastery-${Date.now()}`,
      title: '¡Maestría Conductual Alcanzada!',
      message: `Has forjado un Hábito Legendario: "${task.title}". 66 días consecutivos (+50% XP permanente).`,
      timestamp: new Date().toISOString(),
      type: 'level_up',
      read: false
    });
  }

  return {
    newMastery: { ...currentMastery, [baseId]: newRecord },
    bonusXp,
    notifications
  };
};
