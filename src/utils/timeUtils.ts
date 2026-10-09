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

const formatMinutesToHHMM = (totalMins: number): string => {
  const clamped = Math.max(0, Math.min(1439, Math.round(totalMins)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

/**
 * Cleans corrupted or repeatedly consolidated task titles.
 */
export const cleanScheduleTitle = (rawTitle?: string): string => {
  if (!rawTitle) return '';
  let t = rawTitle
    .replace(/\s*\(Consolidado\)/gi, '')
    .replace(/^tarea\s+extra:\s*/i, '')
    .replace(/horario\s+semanal\s+completo\s*&\s*bloque\s+operativo/gi, '')
    .replace(/&\s*bloque\s+operativo/gi, '')
    .replace(/^bloque\s+operativo\s*&\s*/gi, '')
    .replace(/\s+/g, ' ')
    .replace(/[\s,&;:-]+$/g, '')
    .trim();

  if (t.length > 58) {
    t = t.slice(0, 55).replace(/[\s,&;:-]+$/g, '').trim();
  }
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : '';
};

/**
 * Preferred time-of-day anchor (in minutes from midnight) and default duration by category/title.
 */
const getLogicalAnchorAndDuration = (title: string, category: string, index: number): { anchor: number; dur: number } => {
  const lower = (title || '').toLowerCase();
  if (lower.includes('despertar') || lower.includes('mañana') || lower.includes('matutin') || lower.includes('desayun') || lower.includes('calibrar')) {
    return { anchor: 7 * 60 + 30, dur: 45 };
  }
  if (lower.includes('almuerzo') || lower.includes('almorzar') || (category === 'comida' && !lower.includes('cena'))) {
    return { anchor: 13 * 60, dur: 60 };
  }
  if (lower.includes('cena') || lower.includes('cenar')) {
    return { anchor: 20 * 60 + 30, dur: 45 };
  }
  if (lower.includes('dormir') || lower.includes('desconexi') || lower.includes('acostar')) {
    return { anchor: 22 * 60 + 30, dur: 30 };
  }
  if (category === 'entrenamiento' || lower.includes('gym') || lower.includes('gimnasio') || lower.includes('entren') || lower.includes('ejercicio') || lower.includes('deporte')) {
    return { anchor: 18 * 60, dur: 60 };
  }
  if (category === 'limpieza' || lower.includes('limp') || lower.includes('orden') || lower.includes('hogar')) {
    return { anchor: 19 * 60 + 15, dur: 45 };
  }
  if (category === 'creativo' || lower.includes('creativ') || lower.includes('canva') || lower.includes('web') || lower.includes('redes') || lower.includes('anunciar') || lower.includes('contenido') || lower.includes('lectura') || lower.includes('leer')) {
    return { anchor: 16 * 60 + 30, dur: 60 };
  }
  if (category === 'intelecto' || category === 'estudio' || lower.includes('estud') || lower.includes('clase') || lower.includes('curso')) {
    return { anchor: 11 * 60, dur: 90 };
  }
  // Default work / routine
  return { anchor: 9 * 60 + (index % 4) * 90, dur: 90 };
};

/**
 * Automatically sanitizes, deduplicates, consolidates (if over capacity), and arranges
 * schedule items so there are ZERO time overlaps on shared days and total daily hours stay balanced.
 */
export const autoArrangeSchedule = <T extends {
  id: string;
  title: string;
  category: string;
  timeBlock?: string;
  frequencyType?: string;
  specificDays?: number[];
  quickIcon?: string;
  xpReward?: number;
  coinReward?: number;
  isQuickHabit?: boolean;
  isTracked2166?: boolean;
}>(items: T[], mode: 'master_blocks' | 'detailed' = 'master_blocks', maxBlocksPerDay: number = 8): T[] => {
  if (!Array.isArray(items) || items.length === 0) return [];

  // 1. Clean titles and filter out junk / micro-habits
  const cleanedList: T[] = [];
  const seenKeys = new Set<string>();

  for (const rawItem of items) {
    if (!rawItem || isQuickMicroHabit(rawItem)) continue;
    const cleanedTitle = cleanScheduleTitle(rawItem.title);
    if (!cleanedTitle || cleanedTitle.length < 3) continue;

    const lower = cleanedTitle.toLowerCase();
    if (
      lower === 'bloque operativo' ||
      lower === 'horario semanal completo' ||
      lower.startsWith('descansar para rendir') ||
      lower.startsWith('recordar') ||
      lower.startsWith('nota:')
    ) {
      continue;
    }

    // Deduplicate by normalized prefix + days
    const normPrefix = lower.replace(/[^a-záéíóúñ0-9]/gi, '').slice(0, 22);
    const daysKey =
      rawItem.frequencyType === 'specific_days' && Array.isArray(rawItem.specificDays) && rawItem.specificDays.length > 0 && rawItem.specificDays.length < 7
        ? rawItem.specificDays.slice().sort().join(',')
        : 'daily';
    const dedupKey = `${normPrefix}__${daysKey}`;
    if (seenKeys.has(dedupKey)) continue;
    seenKeys.add(dedupKey);

    cleanedList.push({
      ...rawItem,
      title: cleanedTitle,
      timeBlock: normalizeTimeBlock(rawItem.timeBlock) || rawItem.timeBlock,
    });
  }

  if (cleanedList.length === 0) return [];

  // 2. If there are too many items (e.g. > maxBlocksPerDay on daily/overlapping schedule), consolidate excess items by category
  const targetMax = mode === 'master_blocks' ? Math.min(maxBlocksPerDay, 7) : Math.min(maxBlocksPerDay, 10);
  let workingList: T[] = cleanedList;

  if (workingList.length > targetMax) {
    // Keep specific single-day variations (e.g. Monday Gym vs Wednesday Gym) separate,
    // and consolidate general/daily items that share categories
    const bucketMap = new Map<string, T>();
    const condensed: T[] = [];

    for (const item of workingList) {
      const daysKey =
        item.frequencyType === 'specific_days' && Array.isArray(item.specificDays) && item.specificDays.length < 5
          ? item.specificDays.slice().sort().join(',')
          : 'common';
      const lower = item.title.toLowerCase();
      const slotType =
        lower.includes('despertar') || lower.includes('mañana') || lower.includes('desayun')
          ? 'morning'
          : lower.includes('almuerzo') || lower.includes('cena') || item.category === 'comida'
          ? `meal-${lower.includes('cena') ? 'dinner' : 'lunch'}`
          : lower.includes('dormir') || lower.includes('desconexi')
          ? 'sleep'
          : `${item.category || 'rutina'}-${daysKey}`;

      const existing = bucketMap.get(slotType);
      if (!existing) {
        const clone = { ...item };
        bucketMap.set(slotType, clone);
        condensed.push(clone);
      } else {
        // Combine titles cleanly without appending "(Consolidado)"
        if (!existing.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 12))) {
          const combined = `${existing.title} & ${item.title}`;
          if (combined.length <= 54) {
            existing.title = combined;
          }
        }
        existing.xpReward = Math.min(60, Math.max(existing.xpReward || 25, item.xpReward || 25) + 5);
      }
    }
    workingList = condensed.slice(0, targetMax);
  }

  // 3. Parse desired start & duration for each item, clamping unrealistic durations (e.g. "20:30 - 23:59")
  const metaList = workingList.map((item, idx) => {
    const { anchor, dur: defaultDur } = getLogicalAnchorAndDuration(item.title, item.category || 'rutina', idx);
    let startMin = parseTimeToMinutes(item.timeBlock);
    let endMin = parseEndTimeToMinutes(item.timeBlock);

    let dur = defaultDur;
    if (startMin !== 9999 && endMin !== 9999 && endMin > startMin) {
      const rawDur = endMin - startMin;
      // If a block was corrupted to 20:30 - 23:59 or > 4 hours, reset to a clean logical duration
      if (endMin >= 1438 || rawDur > 240) {
        dur = defaultDur;
        if (startMin >= 20 * 60 && endMin >= 1438) {
          startMin = anchor;
        }
      } else {
        dur = Math.max(30, Math.min(180, rawDur));
      }
    } else {
      startMin = anchor;
      dur = defaultDur;
    }

    return {
      item,
      prefStart: Math.max(6 * 60, Math.min(22 * 60 + 30, startMin)),
      dur,
    };
  });

  // Sort by preferred start time
  metaList.sort((a, b) => a.prefStart - b.prefStart);

  // 4. Check if total duration on any day exceeds 13.5 hours (810 mins); if so, cap durations to 45-75 mins so everything fits!
  for (let d = 0; d <= 6; d++) {
    const dayItems = metaList.filter(m =>
      shareDays(m.item.frequencyType, m.item.specificDays, 'specific_days', [d])
    );
    const dayTotal = dayItems.reduce((acc, m) => acc + m.dur, 0);
    if (dayTotal > 780 && dayItems.length > 0) {
      const scale = 720 / dayTotal;
      dayItems.forEach(m => {
        m.dur = Math.max(30, Math.round((m.dur * scale) / 15) * 15);
      });
    }
  }

  // 5. Place items chronologically with ZERO overlaps on shared days
  const placed: Array<{
    item: T;
    start: number;
    end: number;
  }> = [];

  for (const m of metaList) {
    const dur = m.dur;
    const conflictingPlaced = placed.filter(p =>
      shareDays(m.item.frequencyType, m.item.specificDays, p.item.frequencyType, p.item.specificDays)
    );

    const isSlotFree = (s: number, e: number) =>
      !conflictingPlaced.some(p => s < p.end && p.start < e);

    let chosenStart = Math.round(m.prefStart / 15) * 15;
    let found = false;

    // Try forward from preferred start (06:00 to 23:15)
    for (let s = chosenStart; s + dur <= 23 * 60 + 15; s += 15) {
      if (isSlotFree(s, s + dur)) {
        chosenStart = s;
        found = true;
        break;
      }
    }

    // Try backward from preferred start down to 06:00
    if (!found) {
      for (let s = chosenStart - 15; s >= 6 * 60; s -= 15) {
        if (isSlotFree(s, s + dur)) {
          chosenStart = s;
          found = true;
          break;
        }
      }
    }

    // If still not found with full duration, try with compact 30m duration in any open gap between 06:00 and 23:30
    let finalDur = dur;
    if (!found) {
      finalDur = 30;
      for (let s = 6 * 60; s + finalDur <= 23 * 60 + 30; s += 15) {
        if (isSlotFree(s, s + finalDur)) {
          chosenStart = s;
          found = true;
          break;
        }
      }
    }

    const chosenEnd = Math.min(23 * 60 + 30, chosenStart + finalDur);
    placed.push({
      item: {
        ...m.item,
        timeBlock: `${formatMinutesToHHMM(chosenStart)} - ${formatMinutesToHHMM(chosenEnd)}`,
      },
      start: chosenStart,
      end: chosenEnd,
    });
  }

  return sortByChronologicalTime(placed.map(p => p.item));
};

/**
 * Synthesizes a list of fragmented habits into clean, high-level master blocks with ZERO collisions.
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
  return autoArrangeSchedule(items, 'master_blocks', 6);
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

  return `${formatMinutesToHHMM(newStart)} - ${formatMinutesToHHMM(newEnd)}`;
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
        const newStartB = endA !== 9999 && endA + durB <= 1410 ? endA : 8 * 60;
        const newEndB = Math.min(1425, newStartB + durB);

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
          suggestedNewTimeForB: `${formatMinutesToHHMM(newStartB)} - ${formatMinutesToHHMM(newEndB)}`
        });
      }
    }
  }

  // 2. Detect Gaps (sorted chronologically)
  const sorted = sortByChronologicalTime(scheduled);
  const gaps: ScheduleGap[] = [];

  for (let i = 0; i < sorted.length - 1; i++) {
    const curr = sorted[i];
    const next = sorted[i + 1];

    let currEnd = parseEndTimeToMinutes(curr.timeBlock);
    if (currEnd === 9999) currEnd = parseTimeToMinutes(curr.timeBlock) + 60;

    const nextStart = parseTimeToMinutes(next.timeBlock);
    if (currEnd !== 9999 && nextStart !== 9999 && nextStart > currEnd) {
      const gapMins = nextStart - currEnd;
      if (gapMins >= 45 && gapMins <= 240) {
        gaps.push({
          id: `gap-${curr.id}-${next.id}`,
          afterId: curr.id,
          beforeId: next.id,
          afterTitle: curr.title,
          beforeTitle: next.title,
          startTime: formatMinutesToHHMM(currEnd),
          endTime: formatMinutesToHHMM(nextStart),
          durationMinutes: gapMins
        });
      }
    }
  }

  // Calculate average daily scheduled hours across active days (instead of summing all 7 days together!)
  let activeDaysCount = 0;
  let sumDailyMins = 0;
  for (let d = 0; d <= 6; d++) {
    const dayItems = sorted.filter(it =>
      shareDays(it.frequencyType, it.specificDays, 'specific_days', [d])
    );
    if (dayItems.length > 0) {
      activeDaysCount++;
      const dayMins = dayItems.reduce((acc, it) => {
        const s = parseTimeToMinutes(it.timeBlock);
        let e = parseEndTimeToMinutes(it.timeBlock);
        if (e === 9999 || e <= s) e = s + 60;
        return s !== 9999 ? acc + Math.max(0, e - s) : acc;
      }, 0);
      sumDailyMins += dayMins;
    }
  }
  const avgDailyMins = activeDaysCount > 0 ? sumDailyMins / activeDaysCount : 0;

  // Calculate harmony score
  let score = 100;
  score -= conflicts.length * 35;
  score -= Math.min(15, gaps.length * 3);
  score = Math.max(10, Math.min(100, score));

  return {
    conflicts,
    gaps,
    harmonyScore: score,
    totalScheduledHours: Math.round((avgDailyMins / 60) * 10) / 10
  };
};

/**
 * Resolves a conflict automatically by re-running autoArrangeSchedule so all conflicts disappear at once.
 */
export const resolveConflictQuickFix = <T extends {
  id: string;
  title: string;
  category: string;
  timeBlock?: string;
  frequencyType?: string;
  specificDays?: number[];
}>(
  items: T[],
  _conflict: ScheduleConflict
): T[] => {
  return autoArrangeSchedule(items, 'detailed', 12);
};


