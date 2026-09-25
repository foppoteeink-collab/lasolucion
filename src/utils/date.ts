/**
 * Local Date Utilities
 * Ensures dates are strictly evaluated in the user's local timezone
 * avoiding UTC offset shifts (which caused early day-rollovers).
 */

/**
 * Returns YYYY-MM-DD in user's local time, but with a 3AM offset
 * (e.g. 02:00 AM on Oct 2nd is treated as Oct 1st) to protect night owl streaks.
 */
export const getTodayDateString = (d: Date = new Date()): string => {
  // Create a copy to avoid mutating the passed date
  const offsetDate = new Date(d.getTime());
  // Subtract 3 hours. If it's before 3 AM, it rolls back to the previous day.
  offsetDate.setHours(offsetDate.getHours() - 3);

  const year = offsetDate.getFullYear();
  const month = String(offsetDate.getMonth() + 1).padStart(2, '0');
  const day = String(offsetDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a Date object into YYYY-MM-DD in local time
 */
export const formatDateToLocal = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Parses YYYY-MM-DD into a local Date object (at midday 12:00:00 to prevent DST shifts)
 */
export const parseLocalDate = (dateStr: string): Date => {
  if (!dateStr || !dateStr.includes('-')) return new Date();
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
};

/**
 * Adds or subtracts days to/from a YYYY-MM-DD string safely in local time
 */
export const addDaysToDateString = (dateStr: string, days: number): string => {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + days);
  return formatDateToLocal(date);
};

/**
 * Formats a YYYY-MM-DD string into full Spanish date (e.g. "Lunes, 7 de Septiembre")
 */
export const formatDateFullSpanish = (dateStr: string): string => {
  const date = parseLocalDate(dateStr);
  const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  return `${dayNames[date.getDay()]}, ${date.getDate()} de ${monthNames[date.getMonth()]}`;
};

/**
 * Formats a YYYY-MM-DD date string for friendly display (e.g. "Hoy", "Mañana", "Ayer", or full date)
 */
export const formatDateForDisplay = (dateStr: string): string => {
  if (!dateStr) return '';
  const today = getTodayDateString();
  const tomorrow = addDaysToDateString(today, 1);
  const yesterday = addDaysToDateString(today, -1);

  if (dateStr === today) {
    return 'Hoy';
  } else if (dateStr === tomorrow) {
    return 'Mañana';
  } else if (dateStr === yesterday) {
    return 'Ayer';
  }
  return formatDateFullSpanish(dateStr);
};


/** Returns YYYY-MM-DD for yesterday in user's local time (with 3AM night-owl offset) */
export const getYesterdayDateString = (): string => addDaysToDateString(getTodayDateString(), -1);

/**
 * Calculates sleep duration in hours between bedtime (HH:MM) and wakeTime (HH:MM).
 * Handles midnight crossover automatically.
 * Returns null if either value is missing — duration is UNDEFINED without both timestamps.
 */
export const calcSleepDuration = (bedtime: string | undefined, wakeTime: string | undefined): number | null => {
  if (!bedtime || !wakeTime) return null;
  const [bH, bM] = bedtime.split(':').map(Number);
  const [wH, wM] = wakeTime.split(':').map(Number);
  let diff = (wH * 60 + (wM || 0)) - (bH * 60 + (bM || 0));
  if (diff <= 0) diff += 24 * 60; // midnight crossover
  return Math.round((diff / 60) * 10) / 10;
};

/** Returns sleep quality label. Only valid when duration is a known number (not null). */
export const getSleepQuality = (hours: number): string =>
  hours >= 7.5 ? 'Excelente' : hours >= 6 ? 'Buena' : 'Corta';


