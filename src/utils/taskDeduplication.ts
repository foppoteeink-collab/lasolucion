import { TaskItem, CustomHabit } from '../types';

/**
 * Normalizes a string and extracts a set of meaningful lowercase word tokens.
 * Strips punctuation, accents, filler words, and category prefixes.
 */
export const extractMeaningfulTokens = (text: string = ''): Set<string> => {
  if (!text) return new Set();

  let norm = text.toLowerCase().trim();

  // Normalize accents
  norm = norm.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Strip category/type prefixes (e.g. "limpieza:", "entreno:", "bloque creativo:", "creativo:")
  norm = norm.replace(/^(limpieza|entreno|entrenamiento|bloque creativo|creativo|rutina|habito|hábito|tarea|comida|nutricion|estudio):\s*/gi, '');

  // Replace punctuation, slashes, and parentheses with spaces
  norm = norm.replace(/[^a-z0-9\s]/gi, ' ');

  // Split into tokens
  const words = norm.split(/\s+/).filter(Boolean);

  // Common stop words to exclude from keyword comparison
  const stopWords = new Set([
    'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
    'y', 'e', 'o', 'u', 'en', 'para', 'por', 'con', 'sin', 'sobre', 'tras',
    'bloque', 'rutina', 'habito', 'hábito', 'tarea', 'diaria', 'diario',
    'profunda', 'profundo', 'profundos', 'profundas'
  ]);

  const tokens = new Set<string>();
  for (const word of words) {
    if (word.length >= 2 && !stopWords.has(word)) {
      tokens.add(word);
    }
  }

  return tokens;
};

/**
 * Checks if two time blocks match.
 */
export const timeBlocksMatch = (blockA?: string, blockB?: string): boolean => {
  if (!blockA && !blockB) return true;
  if (!blockA || !blockB) return false; // If one specifies time block and other does not, treat as non-matching
  const cleanA = blockA.trim().replace(/\s+/g, '');
  const cleanB = blockB.trim().replace(/\s+/g, '');
  return cleanA === cleanB;
};

/**
 * Checks if two tasks/habits represent the exact same or duplicate activity.
 */
export const isDuplicateActivity = (
  a: { id?: string; title?: string; category?: string; timeBlock?: string; frequencyType?: string; specificDays?: number[] },
  b: { id?: string; title?: string; category?: string; timeBlock?: string; frequencyType?: string; specificDays?: number[] }
): boolean => {
  // 1. Same ID
  if (a.id && b.id && a.id === b.id) return true;

  const titleA = (a.title || '').trim().toLowerCase();
  const titleB = (b.title || '').trim().toLowerCase();
  if (!titleA || !titleB) return false;

  // 2. CRITICAL: If both specify time blocks and they are DIFFERENT, they are NOT duplicate activities!
  if (a.timeBlock && b.timeBlock) {
    const cleanA = a.timeBlock.trim().replace(/\s+/g, '');
    const cleanB = b.timeBlock.trim().replace(/\s+/g, '');
    if (cleanA !== cleanB) {
      return false; // Distinct time slots (e.g. 05:00-12:00 vs 15:00-19:30) => distinct tasks!
    }
  }

  // 3. CRITICAL: If both items specify days and DO NOT share any days of the week, they are NOT duplicates!
  const hasSpecificDaysA = (a.specificDays && a.specificDays.length > 0 && a.specificDays.length < 7) || a.frequencyType === 'specific_days';
  const hasSpecificDaysB = (b.specificDays && b.specificDays.length > 0 && b.specificDays.length < 7) || b.frequencyType === 'specific_days';
  if (hasSpecificDaysA && hasSpecificDaysB && a.specificDays && b.specificDays) {
    const setB = new Set(b.specificDays);
    const sharesAnyDay = a.specificDays.some(d => setB.has(d));
    if (!sharesAnyDay) {
      return false; // Scheduled on completely different days of the week (e.g. Mon vs Tue)!
    }
  }

  // 4. Distinguishing modifiers (e.g. "mañana" vs "tarde", muscle groups, chores, creative tracks)
  const modifiers = [
    'manana', 'mañana', 'tarde', 'noche', 'matutina', 'vespertina', 'profunda', 'profundo',
    'banos', 'baños', 'cocina', 'sabado', 'sábado', 'domingo', 'patio', 'vidrio', 'vidrios', 'despensa',
    'pierna', 'gluteo', 'glúteo', 'espalda', 'pecho', 'brazo', 'brazos', 'hombro', 'funcional',
    'reels', 'canva', 'web', 'animacion', 'animación', 'eventos', 'rrss', 'logistica', 'logística', 'ventas'
  ];
  for (const mod of modifiers) {
    const inA = titleA.includes(mod);
    const inB = titleB.includes(mod);
    if (inA !== inB) {
      return false; // Conflicting modifier => separate tasks!
    }
  }

  // 5. Exact string match (when time blocks match or are absent and no modifier conflicts)
  if (titleA === titleB) return true;

  // 6. Exact token-set match
  const tokensA = extractMeaningfulTokens(a.title);
  const tokensB = extractMeaningfulTokens(b.title);

  if (tokensA.size > 0 && tokensB.size > 0 && tokensA.size === tokensB.size) {
    let matchCount = 0;
    for (const t of tokensA) {
      if (tokensB.has(t)) matchCount++;
    }
    if (matchCount === tokensA.size) {
      return true;
    }
  }

  return false;
};

/**
 * Deduplicates custom habits array to ensure no duplicate habits exist in state.
 */
export const deduplicateHabits = (habits: CustomHabit[]): CustomHabit[] => {
  if (!Array.isArray(habits)) return [];

  const result: CustomHabit[] = [];

  for (const habit of habits) {
    if (!habit || !habit.title) continue;

    const existingIdx = result.findIndex(existing => (existing.id && habit.id && existing.id === habit.id) || isDuplicateActivity(existing, habit));

    if (existingIdx === -1) {
      result.push(habit);
    } else {
      // Merge: prefer habit with longer title or higher XP reward
      const existing = result[existingIdx];
      const betterTitle = habit.title.length >= existing.title.length ? habit.title : existing.title;

      const mergedDays = (existing.specificDays && habit.specificDays)
        ? Array.from(new Set([...existing.specificDays, ...habit.specificDays])).sort((x, y) => x - y)
        : (habit.specificDays ?? existing.specificDays);

      const merged: CustomHabit = {
        ...existing,
        ...habit,
        id: existing.id || habit.id,
        title: betterTitle,
        specificDays: mergedDays,
        timeBlock: habit.timeBlock || existing.timeBlock,
        xpReward: Math.max(existing.xpReward || 0, habit.xpReward || 0),
        coinReward: Math.max(existing.coinReward || 0, habit.coinReward || 0),
      };
      result[existingIdx] = merged;
    }
  }

  // Final pass: Guarantee 100% unique IDs across all items in result
  const seenIds = new Set<string>();
  return result.map((h, idx) => {
    let uId = h.id;
    if (!uId || seenIds.has(uId)) {
      uId = `${uId || 'habit'}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    }
    seenIds.add(uId);
    return { ...h, id: uId };
  });
};

/**
 * Deduplicates tasks for a specific date.
 * Enforces that tasks are only considered completed if they have a valid completion timestamp.
 */
export const deduplicateTasksForDay = (tasks: TaskItem[], targetDateKey?: string): TaskItem[] => {
  if (!Array.isArray(tasks)) return [];

  const result: TaskItem[] = [];

  for (const rawTask of tasks) {
    if (!rawTask || !rawTask.title) continue;

    // A task is legitimately completed if completed === true AND completedAt timestamp is present
    const isLegitimatelyCompleted = Boolean(rawTask.completed && rawTask.completedAt);

    const task: TaskItem = {
      ...rawTask,
      completed: isLegitimatelyCompleted,
      completedAt: isLegitimatelyCompleted ? rawTask.completedAt : undefined,
    };

    const existingIdx = result.findIndex(existing => (existing.id && task.id && existing.id === task.id) || isDuplicateActivity(existing, task));

    if (existingIdx === -1) {
      result.push(task);
    } else {
      const existing = result[existingIdx];

      // A completed task or progress must NEVER be wiped out by an uncompleted or default duplicate
      const isExistingCompleted = Boolean(existing.completed && existing.completedAt);
      const isTaskCompleted = Boolean(task.completed && task.completedAt);
      const isCompleted = isExistingCompleted || isTaskCompleted;
      const completedAt = isCompleted ? (isTaskCompleted ? task.completedAt : existing.completedAt) : undefined;

      const betterTitle = task.title.length >= existing.title.length ? task.title : existing.title;

      // Preserve highest currentCount (never allow 0 or undefined to overwrite logged progress)
      const mergedCurrentCount = (existing.currentCount !== undefined || task.currentCount !== undefined)
        ? Math.max(existing.currentCount || 0, task.currentCount || 0)
        : undefined;

      const targetCount = task.targetCount || existing.targetCount;
      const finalCompleted = isCompleted || (targetCount !== undefined && mergedCurrentCount !== undefined && mergedCurrentCount >= targetCount);

      const merged: TaskItem = {
        ...existing,
        ...task,
        id: existing.id || task.id,
        title: betterTitle,
        completed: finalCompleted,
        completedAt: finalCompleted ? (completedAt || new Date().toISOString()) : undefined,
        rewardClaimed: finalCompleted ? Boolean(existing.rewardClaimed || task.rewardClaimed) : false,
        currentCount: mergedCurrentCount,
        notes: task.notes || existing.notes,
        timeBlock: task.timeBlock || existing.timeBlock,
        category: task.category || existing.category,
        xpReward: Math.max(existing.xpReward || 0, task.xpReward || 0),
        coinReward: Math.max(existing.coinReward || 0, task.coinReward || 0),
      };

      result[existingIdx] = merged;
    }
  }

  // Final pass: Guarantee 100% unique IDs across all tasks for the day
  const seenIds = new Set<string>();
  return result.map((t, idx) => {
    let uId = t.id;
    if (!uId || seenIds.has(uId)) {
      uId = `${uId || 'task'}-${targetDateKey || 'day'}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
    }
    seenIds.add(uId);
    return { ...t, id: uId };
  });
};

/**
 * Deduplicates all dates in tasksByDate map and ensures task IDs are unique per date.
 * Also purges phantom completions lacking explicit timestamps.
 */
export const sanitizeTasksByDate = (
  tasksByDate: Record<string, TaskItem[]>
): Record<string, TaskItem[]> => {
  if (!tasksByDate || typeof tasksByDate !== 'object') return {};

  const sanitized: Record<string, TaskItem[]> = {};

  for (const [dateKey, list] of Object.entries(tasksByDate)) {
    if (!Array.isArray(list)) continue;

    const validList = list.filter((task): task is TaskItem => Boolean(task && typeof task === 'object' && task.title));
    const seenTaskIds = new Set<string>();

    const isolatedList: TaskItem[] = validList.map((task, idx) => {
      if (!task.id) {
        task = { ...task, id: `task-${dateKey}-${idx}-${Math.random().toString(36).substring(2, 6)}` };
      }

      const isLegitimatelyCompleted = Boolean(task.completed && task.completedAt);

      // If this exact ID was already assigned to a task on this date, generate a unique ID
      if (seenTaskIds.has(task.id)) {
        return {
          ...task,
          id: `${task.id}-${dateKey}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
          completed: false,
          completedAt: undefined
        };
      } else {
        seenTaskIds.add(task.id);
        return {
          ...task,
          completed: isLegitimatelyCompleted,
          completedAt: isLegitimatelyCompleted ? task.completedAt : undefined
        };
      }
    });

    sanitized[dateKey] = deduplicateTasksForDay(isolatedList, dateKey);
  }

  return sanitized;
};
