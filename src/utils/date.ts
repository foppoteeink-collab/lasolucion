/**
 * Local Date & Network Clock Synchronization Utilities
 * 
 * Ensures dates are strictly evaluated in the user's local timezone
 * combined with a network-synchronized time offset (Date header inspection)
 * to prevent clock manipulation from bypassing streaks or corrupting the 3:00 AM cutoff.
 */

const SERVER_TIME_OFFSET_KEY = 'lasolucion_server_clock_offset_ms';
export const DAY_START_HOUR_KEY = 'lasolucion_day_start_hour';

// In-memory cache for daily cycle start hour (cutoff). Defaults to 3 (3:00 AM)
let cachedDayStartHour: number = (() => {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(DAY_START_HOUR_KEY);
      if (stored !== null) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 23) return parsed;
      }
    } catch {}
  }
  return 3;
})();

/**
 * Updates the daily cycle start hour (0..23).
 * Example: 21 for 9:00 PM night shift, 15 for 3:00 PM afternoon shift, 3 for standard 3:00 AM cutoff.
 */
export const setGlobalDayStartHour = (hour: number): void => {
  const normalized = Math.max(0, Math.min(23, Math.floor(hour)));
  cachedDayStartHour = normalized;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(DAY_START_HOUR_KEY, String(normalized));
    } catch {}
  }
};

/**
 * Retrieves the currently active daily cycle start hour (0..23).
 */
export const getGlobalDayStartHour = (): number => cachedDayStartHour;

// In-memory cache for network time offset in milliseconds
let cachedServerOffsetMs: number = (() => {
  if (typeof window !== 'undefined') {
    try {
      const stored = window.localStorage.getItem(SERVER_TIME_OFFSET_KEY);
      if (stored) {
        const parsed = parseInt(stored, 10);
        if (!isNaN(parsed)) return parsed;
      }
    } catch {}
  }
  return 0;
})();

/**
 * Updates the trusted server time offset.
 */
export const setNetworkTimeOffset = (offsetMs: number): void => {
  cachedServerOffsetMs = offsetMs;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(SERVER_TIME_OFFSET_KEY, String(offsetMs));
    } catch {}
  }
};

/**
 * Retrieves the current verified network clock offset in milliseconds.
 */
export const getNetworkTimeOffset = (): number => cachedServerOffsetMs;

/**
 * Returns a trusted Date object adjusted with the network-synchronized offset.
 * Protects against deliberate changes to the device's local system time.
 */
export const getTrustedNow = (): Date => {
  return new Date(Date.now() + cachedServerOffsetMs);
};

let activeNetworkSyncPromise: Promise<number> | null = null;
let lastNetworkSyncAt = 0;
const NETWORK_SYNC_COOLDOWN_MS = 30000;

/**
 * Synchronizes client time against the server's HTTP response Date header.
 * Lightweight, deduplicated, non-blocking check.
 */
export const syncNetworkTime = async (): Promise<number> => {
  if (typeof window === 'undefined' || !navigator.onLine) {
    return cachedServerOffsetMs;
  }

  const now = Date.now();
  if (activeNetworkSyncPromise) {
    return activeNetworkSyncPromise;
  }
  if (lastNetworkSyncAt > 0 && now - lastNetworkSyncAt < NETWORK_SYNC_COOLDOWN_MS) {
    return cachedServerOffsetMs;
  }

  activeNetworkSyncPromise = (async () => {
    try {
      const startTime = Date.now();
      // Fast GET request with no-cache to obtain authoritative HTTP Date
      const response = await fetch('/api/build-rev', {
        method: 'GET',
        cache: 'no-store',
      });

      lastNetworkSyncAt = Date.now();
      const dateHeader = response.headers.get('date');
      if (dateHeader) {
        const serverTimestamp = new Date(dateHeader).getTime();
        const endTime = Date.now();
        const latencyRoundTrip = Math.max(0, endTime - startTime);
        // Adjust for half of round-trip network latency
        const estimatedServerNow = serverTimestamp + Math.round(latencyRoundTrip / 2);
        const calculatedOffset = estimatedServerNow - endTime;

        // Only update if difference exceeds 2.5 seconds (filters out normal network jitter)
        if (Math.abs(calculatedOffset) > 2500) {
          setNetworkTimeOffset(calculatedOffset);
          return calculatedOffset;
        } else {
          setNetworkTimeOffset(0);
          return 0;
        }
      }
    } catch (err) {
      lastNetworkSyncAt = Date.now();
      console.warn('[DateSync] Network time sync notice:', err);
    } finally {
      activeNetworkSyncPromise = null;
    }

    return cachedServerOffsetMs;
  })();

  return activeNetworkSyncPromise;
};

/**
 * Returns YYYY-MM-DD in user's local time, adjusted for the active daily cycle start hour
 * (defaults to cachedDayStartHour, e.g. 3AM for night owl streaks, or 21 for 9 PM night shifts).
 * Defaults to trusted network time if no date is explicitly provided.
 */
export const getTodayDateString = (d?: Date, overrideCutoff?: number): string => {
  const baseDate = d || getTrustedNow();
  // Create a copy to avoid mutating the passed date
  const offsetDate = new Date(baseDate.getTime());
  const cutoff = overrideCutoff !== undefined ? overrideCutoff : cachedDayStartHour;
  // Subtract cutoff hours so the entire 24h work cycle maps to its logical start day.
  offsetDate.setHours(offsetDate.getHours() - cutoff);

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
  if (!dateStr || !dateStr.includes('-')) return getTrustedNow();
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

/**
 * Evaluates sleep quality score and label based on duration in hours
 */
export const getSleepQuality = (hours: number): { label: string; color: string; score: number } => {
  if (hours >= 7 && hours <= 9) {
    return { label: 'Óptimo', color: 'text-emerald-400', score: 100 };
  } else if (hours >= 6 && hours < 7) {
    return { label: 'Bueno', color: 'text-cyan-400', score: 80 };
  } else if (hours >= 5 && hours < 6) {
    return { label: 'Regular', color: 'text-yellow-400', score: 60 };
  } else {
    return { label: 'Insuficiente', color: 'text-rose-400', score: 40 };
  }
};
