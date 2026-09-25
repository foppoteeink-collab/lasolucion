/**
 * Time and Schedule Utilities
 * Standardizes time parsing, normalization, and chronological sorting
 * for operational routines, timeBlocks, and agenda tasks.
 */

/**
 * Normalizes any freeform time string (e.g. "8am", "8", "08:00", "8:30pm", "17h", "17:00", "13h30", "12:00 md", "mediodía")
 * into canonical "HH:mm" (24-hour format).
 */
export const normalizeTimeString = (raw: string): string | null => {
  if (!raw) return null;
  let s = raw.trim().toLowerCase();

  // Colloquial Spanish word substitutions
  if (s.includes('mediodía') || s.includes('mediodia')) return '12:00';
  if (s.includes('medianoche')) return '00:00';

  const hasPm = /\b(pm|p\.m\.|tarde|noche)\b/i.test(s);
  const hasAm = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(s);

  // Clean out meridiem words for regex matching
  s = s.replace(/\b(de la tarde|de la noche|de la mañana|de la madrugada|pm|p\.m\.|am|a\.m\.|hrs?|h)\b/gi, '').trim();

  // Pattern: "13:30", "1:30", "13h30", "8:30"
  const matchColon = s.match(/^(\d{1,2})[:h](\d{2})$/i);
  if (matchColon) {
    let hour = parseInt(matchColon[1], 10);
    const minute = parseInt(matchColon[2], 10);

    if (hasPm && hour < 12) hour += 12;
    if (hasAm && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59) {
      return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
    }
  }

  // Pattern: "8", "13", "17"
  const matchHourOnly = s.match(/^(\d{1,2})$/i);
  if (matchHourOnly) {
    let hour = parseInt(matchHourOnly[1], 10);

    if (hasPm && hour < 12) hour += 12;
    if (hasAm && hour === 12) hour = 0;

    if (hour >= 0 && hour <= 23) {
      return `${String(hour).padStart(2, '0')}:00`;
    }
  }

  return null;
};

/**
 * Normalizes a range or block string into canonical "HH:mm - HH:mm"
 * Accepts e.g. "8:00 a 17:00", "8am - 12pm", "08:00-17:00", "de 9 a 10", "1:30 a 2:30 pm"
 * Employs smart PM propagation so afternoon ranges like "1:30 a 2:30 pm" resolve to "13:30 - 14:30" (not "01:30 - 14:30").
 */
export const normalizeTimeBlock = (timeBlock?: string): string | undefined => {
  if (!timeBlock) return undefined;
  const cleaned = timeBlock.trim();
  if (!cleaned) return undefined;

  // Split by range separators: "-", "a", "hasta", "to"
  const rangeMatch = cleaned.match(/(?:de\s+)?(.+?)\s*(?:-|–|—|\ba\b|\bhasta\b|\bto\b)\s*(.+)/i);
  if (rangeMatch) {
    const rawStart = rangeMatch[1].trim();
    const rawEnd = rangeMatch[2].trim();

    const hasAmStart = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(rawStart);
    const hasPmStart = /\b(pm|p\.m\.|tarde|noche)\b/i.test(rawStart);
    const hasAmEnd = /\b(am|a\.m\.|mañana|madrugada)\b/i.test(rawEnd);
    const hasPmEnd = /\b(pm|p\.m\.|tarde|noche)\b/i.test(rawEnd);

    const normEnd = normalizeTimeString(rawEnd);
    const normStart = normalizeTimeString(rawStart);

    if (normStart && normEnd) {
      let [startH, startM] = normStart.split(':').map(Number);
      let [endH, endM] = normEnd.split(':').map(Number);

      // Smart PM propagation: if end is PM/afternoon (endH >= 12) and start has no explicit AM/PM:
      if (!hasAmStart && !hasPmStart && endH >= 12 && startH < 12) {
        if ((startH + 12 < endH || (startH + 12 === endH && startM <= endM)) && (endH - startH) > 5) {
          startH += 12;
        }
      }

      const formattedStart = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
      return `${formattedStart} - ${normEnd}`;
    }
    if (normStart) return `${normStart} - ...`;
  }

  // Single time (e.g. "08:00")
  const single = normalizeTimeString(cleaned);
  if (single) {
    return single;
  }

  return cleaned;
};

/**
 * Parses start time of timeBlock into total minutes from midnight (0..1439).
 * Returns 9999 if invalid or missing, placing it at the bottom.
 */
export const parseTimeToMinutes = (timeBlock?: string): number => {
  if (!timeBlock) return 9999;
  const trimmed = timeBlock.trim();
  if (!trimmed) return 9999;

  // Extract the first time portion
  const firstPart = trimmed.split(/[-–—]/)[0]?.trim() || trimmed;

  // Standardize through normalizeTimeString first to ensure 24h conversion
  const normalized = normalizeTimeString(firstPart);
  if (normalized) {
    const [h, m] = normalized.split(':').map(Number);
    return h * 60 + m;
  }

  // Fallback HH:mm parsing
  const match = firstPart.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  if (!match) return 9999;

  let hour = parseInt(match[1], 10);
  const min = match[2] ? parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (meridiem === 'pm' && hour < 12) hour += 12;
  if (meridiem === 'am' && hour === 12) hour = 0;

  if (hour < 0 || hour > 23 || min < 0 || min > 59) return 9999;
  return hour * 60 + min;
};

/**
 * Parses end time of timeBlock into total minutes from midnight.
 */
export const parseEndTimeToMinutes = (timeBlock?: string): number => {
  if (!timeBlock) return 9999;
  const parts = timeBlock.split(/[-–—]/);
  if (parts.length < 2) return parseTimeToMinutes(timeBlock);
  const secondPart = (parts[1] || '').trim();
  const normalized = normalizeTimeString(secondPart);
  if (normalized) {
    const [h, m] = normalized.split(':').map(Number);
    return h * 60 + m;
  }
  return parseTimeToMinutes(secondPart);
};

/**
 * Checks if two items share any days of the week.
 */
export const shareDays = (
  freqA: string = 'daily',
  daysA?: number[],
  freqB: string = 'daily',
  daysB?: number[]
): boolean => {
  const isDailyA = freqA === 'daily' || !daysA || daysA.length === 0 || daysA.length === 7;
  const isDailyB = freqB === 'daily' || !daysB || daysB.length === 0 || daysB.length === 7;

  if (isDailyA || isDailyB) return true;

  const setB = new Set(daysB);
  return daysA.some(d => setB.has(d));
};

/**
 * Checks if a task/habit is a genuine quick micro-habit (e.g. Water tracking, teeth brushing, steps)
 * which belongs exclusively in the top Quick Habits widget.
 * CRITICAL: Never flags long normal tasks (shifts, study) as micro-habits based on duration alone.
 */
export const isQuickMicroHabit = (it: { title?: string; category?: string; isQuickHabit?: boolean; isTracked2166?: boolean; timeBlock?: string }): boolean => {
  if (!it) return false;
  if (it.isQuickHabit || it.isTracked2166) return true;
  const title = (it.title || '').toLowerCase();
  return (
    title.includes('agua') || 
    title.includes('vaso') || 
    title.includes('paso') || 
    title.includes('diente') || 
    title.includes('cepillad') || 
    title.includes('cremina') || 
    title.includes('hidratac')
  );
};

/**
 * Checks if a task/habit is an all-day passive background tracker or micro-habit,
 * solely used for conflict overlap avoidance so background tasks don't collide with active agenda blocks.
 */
export const isAllDayOrPassiveHabit = (it: { title?: string; category?: string; isQuickHabit?: boolean; isTracked2166?: boolean; timeBlock?: string }): boolean => {
  if (!it) return false;
  if (isQuickMicroHabit(it)) return true;
  if (it.timeBlock) {
    const start = parseTimeToMinutes(it.timeBlock);
    const end = parseEndTimeToMinutes(it.timeBlock);
    if (start !== 9999 && end !== 9999 && (end - start) >= 600) {
      return true; // Spans 10+ hours (all day passive background)
    }
  }
  return false;
};

/**
 * Detects if two routines overlap in time and day.
 */
export const detectTimeOverlap = (
  a: { timeBlock?: string; frequencyType?: string; specificDays?: number[]; isQuickHabit?: boolean; category?: string; title?: string },
  b: { timeBlock?: string; frequencyType?: string; specificDays?: number[]; isQuickHabit?: boolean; category?: string; title?: string }
): boolean => {
  if (!a.timeBlock || !b.timeBlock) return false;
  if (isAllDayOrPassiveHabit(a) || isAllDayOrPassiveHabit(b)) return false;
  if (!shareDays(a.frequencyType, a.specificDays, b.frequencyType, b.specificDays)) return false;

  const startA = parseTimeToMinutes(a.timeBlock);
  let endA = parseEndTimeToMinutes(a.timeBlock);
  if (endA === 9999 || endA <= startA) endA = startA + 60;

  const startB = parseTimeToMinutes(b.timeBlock);
  let endB = parseEndTimeToMinutes(b.timeBlock);
  if (endB === 9999 || endB <= startB) endB = startB + 60;

  if (startA === 9999 || startB === 9999) return false;

  // Overlap condition: startA < endB && startB < endA
  return startA < endB && startB < endA;
};

/**
 * Sorts any list of items with timeBlock chronologically.
 */
export const sortByChronologicalTime = <T extends { timeBlock?: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const timeA = parseTimeToMinutes(a.timeBlock);
    const timeB = parseTimeToMinutes(b.timeBlock);
    return timeA - timeB;
  });
};

/**
 * Synthesizes a list of fragmented habits into clean, high-level master blocks.
 */
export const synthesizeHabitBlocks = <T extends {
  id: string;
  title: string;
  category: string;
  timeBlock?: string;
  frequencyType?: string;
  specificDays?: number[];
  quickIcon?: string;
  xpReward?: number;
  coinReward?: number;
}>(items: T[]): T[] => {
  if (items.length <= 4) return items;

  // Filter out noise, fragments without actionable titles
  const valid = items.filter(it => {
    const t = (it.title || '').trim().toLowerCase();
    if (t.length < 3) return false;
    if (t.includes('descansar para rendir') || t.includes('recordar') || t.includes('nota:')) return false;
    return true;
  });

  const sorted = sortByChronologicalTime(valid);
  const result: T[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const curr = sorted[i];
    const prev = result[result.length - 1];

    if (!prev) {
      result.push({ ...curr });
      continue;
    }

    // Check if contiguous or overlapping with similar intent
    const isOverlap = detectTimeOverlap(curr, prev);
    const sameCat = curr.category === prev.category;

    if (isOverlap && sameCat) {
      // Merge into master block
      const startMin = Math.min(parseTimeToMinutes(prev.timeBlock), parseTimeToMinutes(curr.timeBlock));
      const endPrev = parseEndTimeToMinutes(prev.timeBlock);
      const endCurr = parseEndTimeToMinutes(curr.timeBlock);
      const endMin = Math.max(endPrev === 9999 ? startMin + 60 : endPrev, endCurr === 9999 ? startMin + 60 : endCurr);

      const formatMin = (m: number) => {
        const h = Math.floor(m / 60);
        const min = m % 60;
        return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
      };

      prev.timeBlock = `${formatMin(startMin)} - ${formatMin(endMin)}`;
      if (!prev.title.includes(curr.title.slice(0, 15))) {
        prev.title = `${prev.title} & ${curr.title}`;
        if (prev.title.length > 50) {
          prev.title = prev.title.split('&')[0].trim() + ' (Consolidado)';
        }
      }
    } else {
      result.push({ ...curr });
    }
  }

  return result;
};

/**
 * Shifts a timeBlock by deltaMinutes or changes its duration.
 * e.g. "13:30 - 15:00", +15m -> "13:45 - 15:15"
 */
export const nudgeTimeBlock = (
  timeBlock: string | undefined,
  shiftMinutes: number = 0,
  durationDeltaMinutes: number = 0
): string => {
  if (!timeBlock) return '09:00 - 10:00';

  const startMin = parseTimeToMinutes(timeBlock);
  if (startMin === 9999) return timeBlock;

  let endMin = parseEndTimeToMinutes(timeBlock);
  if (endMin === 9999 || endMin <= startMin) {
    endMin = startMin + 60;
  }

  let newStart = Math.max(0, Math.min(1439, startMin + shiftMinutes));
  let currentDuration = endMin - startMin;
  let newDuration = Math.max(15, currentDuration + durationDeltaMinutes);
  let newEnd = Math.min(1439, newStart + newDuration);

  const formatMin = (m: number) => {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
  };

  return `${formatMin(newStart)} - ${formatMin(newEnd)}`;
};

export interface ScheduleConflict {
  idA: string;
  idB: string;
  titleA: string;
  titleB: string;
  timeA: string;
  timeB: string;
  suggestedAction: 'shift_second' | 'separate_days';
  suggestedNewTimeForB?: string;
}

export interface ScheduleGap {
  id: string;
  afterId: string;
  beforeId: string;
  afterTitle: string;
  beforeTitle: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface ScheduleDiagnostic {
  conflicts: ScheduleConflict[];
  gaps: ScheduleGap[];
  harmonyScore: number; // 0 - 100
  totalScheduledHours: number;
}

/**
 * Runs immediate heuristic analysis on an array of schedule items.
 */
export const diagnoseSchedule = <T extends {
  id: string;
  title: string;
  category: string;
  timeBlock?: string;
  frequencyType?: string;
  specificDays?: number[];
  isQuickHabit?: boolean;
}>(items: T[]): ScheduleDiagnostic => {
  const scheduled = items.filter(it => Boolean(it.timeBlock) && !isAllDayOrPassiveHabit(it));
  const conflicts: ScheduleConflict[] = [];

  // 1. Detect conflicts
  for (let i = 0; i < scheduled.length; i++) {
    for (let j = i + 1; j < scheduled.length; j++) {
      const a = scheduled[i];
      const b = scheduled[j];

      if (detectTimeOverlap(a, b)) {
        const endA = parseEndTimeToMinutes(a.timeBlock);
        const endB = parseEndTimeToMinutes(b.timeBlock);
        const durB = endB !== 9999 ? Math.max(30, endB - parseTimeToMinutes(b.timeBlock)) : 60;
        const newStartB = endA !== 9999 ? endA : parseTimeToMinutes(a.timeBlock) + 60;
        const newEndB = Math.min(1439, newStartB + durB);

        const formatMin = (m: number) => {
          const h = Math.floor(m / 60);
          const min = m % 60;
          return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        };

        const hasSpecificDaysMismatch = 
          (a.frequencyType === 'specific_days' && a.specificDays?.length === 1) ||
          (b.frequencyType === 'specific_days' && b.specificDays?.length === 1);

        conflicts.push({
          idA: a.id,
          idB: b.id,
          titleA: a.title,
          titleB: b.title,
          timeA: a.timeBlock || '',
          timeB: b.timeBlock || '',
          suggestedAction: hasSpecificDaysMismatch ? 'separate_days' : 'shift_second',
          suggestedNewTimeForB: `${formatMin(newStartB)} - ${formatMin(newEndB)}`
        });
      }
    }
  }

  // 2. Detect Gaps (sorted chronologically)
  const sorted = sortByChronologicalTime(scheduled);
  const gaps: ScheduleGap[] = [];
  let totalMins = 0;

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    let currEnd = parseEndTimeToMinutes(curr.timeBlock);
    if (currEnd === 9999) currEnd = parseTimeToMinutes(curr.timeBlock) + 60;

    const nextStart = parseTimeToMinutes(next.timeBlock);
    if (currEnd !== 9999 && nextStart !== 9999 && nextStart > currEnd) {
      const gapMins = nextStart - currEnd;
      // Significant gap: between 30 mins and 240 mins in active day hours
      if (gapMins >= 30 && gapMins <= 300) {
        const formatMin = (m: number) => {
          const h = Math.floor(m / 60);
          const min = m % 60;
          return `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
        };

        gaps.push({
          id: `gap-${curr.id}-${next.id}`,
          afterId: curr.id,
          beforeId: next.id,
          afterTitle: curr.title,
          beforeTitle: next.title,
          startTime: formatMin(currEnd),
          endTime: formatMin(nextStart),
          durationMinutes: gapMins
        });
      }
    }

    const startM = parseTimeToMinutes(curr.timeBlock);
    if (startM !== 9999 && currEnd !== 9999) {
      totalMins += Math.max(0, currEnd - startM);
    }
  }

  // Calculate harmony score
  let score = 100;
  score -= conflicts.length * 35;
  score -= Math.min(25, gaps.length * 5);
  score = Math.max(10, Math.min(100, score));

  return {
    conflicts,
    gaps,
    harmonyScore: score,
    totalScheduledHours: Math.round((totalMins / 60) * 10) / 10
  };
};

/**
 * Resolves a conflict automatically by either shifting item B or separating specific days.
 */
export const resolveConflictQuickFix = <T extends {
  id: string;
  title: string;
  timeBlock?: string;
  frequencyType?: string;
  specificDays?: number[];
}>(
  items: T[],
  conflict: ScheduleConflict
): T[] => {
  return items.map(item => {
    if (item.id === conflict.idB) {
      if (conflict.suggestedAction === 'separate_days') {
        const itemA = items.find(it => it.id === conflict.idA);
        if (itemA?.specificDays && itemA.specificDays.length > 0) {
          const excluded = new Set(itemA.specificDays);
          const baseDays = item.specificDays || [0, 1, 2, 3, 4, 5, 6];
          const remaining = baseDays.filter(d => !excluded.has(d));
          return {
            ...item,
            frequencyType: 'specific_days',
            specificDays: remaining.length > 0 ? remaining : [1, 2, 4, 5]
          };
        }
      }
      // Default shift:
      if (conflict.suggestedNewTimeForB) {
        return {
          ...item,
          timeBlock: conflict.suggestedNewTimeForB
        };
      }
    }
    return item;
  });
};

