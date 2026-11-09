/**
 * telemetryQueueService.ts
 *
 * Production-grade Offline-First Telemetry Buffer for Firebase Analytics.
 * Buffers analytics events in IndexedDB when the client is disconnected or
 * analyticsInstance is not yet resolved, and flushes them reliably upon reconnection.
 */

import { Analytics, logEvent, setUserProperties } from 'firebase/analytics';

export interface BufferedAnalyticsEvent {
  id: string;
  eventName: string;
  params?: Record<string, any>;
  timestamp: number;
}

const DB_NAME = 'la-solucion-telemetry-buffer';
const DB_VERSION = 1;
const STORE_NAME = 'pending_telemetry_events';
export const MAX_BUFFERED_TELEMETRY_EVENTS = 200;

let dbPromise: Promise<IDBDatabase> | null = null;
let isFlushing = false;

function getTelemetryDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB not supported'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const req = window.indexedDB.open(DB_NAME, DB_VERSION);

      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('timestamp', 'timestamp', { unique: false });
        }
      };

      req.onsuccess = () => {
        const db = req.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      req.onerror = () => {
        dbPromise = null;
        reject(req.error || new Error('Failed to open telemetry IndexedDB'));
      };
    });
  }

  return dbPromise;
}

/**
 * Enqueues an analytics event into IndexedDB when offline or pending SDK resolution.
 * Automatically enforces MAX_BUFFERED_TELEMETRY_EVENTS buffer cap by pruning oldest events.
 */
export async function enqueueTelemetryEvent(eventName: string, params?: Record<string, any>): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;

  try {
    const db = await getTelemetryDB();
    const event: BufferedAnalyticsEvent = {
      id: `tel_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      eventName,
      params: {
        ...(params || {}),
        offline_buffered: true,
        original_timestamp: Date.now(),
      },
      timestamp: Date.now(),
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      
      // Buffer cap enforcement
      const countReq = store.count();
      countReq.onsuccess = () => {
        if (countReq.result >= MAX_BUFFERED_TELEMETRY_EVENTS) {
          const index = store.index('timestamp');
          const cursorReq = index.openCursor();
          let pruned = 0;
          cursorReq.onsuccess = () => {
            const cursor = cursorReq.result;
            if (cursor && pruned < 40) {
              cursor.delete();
              pruned++;
              cursor.continue();
            }
          };
        }
      };

      const req = store.put(event);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.debug('[TelemetryQueue] Failed to enqueue offline event:', err);
  }
}

/**
 * Prunes expired telemetry events older than maxAgeDays (default: 7 days).
 */
export async function pruneExpiredTelemetryEvents(maxAgeDays: number = 7): Promise<number> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return 0;

  try {
    const db = await getTelemetryDB();
    const cutoffMs = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
    let prunedCount = 0;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const range = IDBKeyRange.upperBound(cutoffMs);
      const req = index.openCursor(range);

      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          cursor.delete();
          prunedCount++;
          cursor.continue();
        } else {
          resolve(prunedCount);
        }
      };

      req.onerror = () => resolve(prunedCount);
    });
  } catch {
    return 0;
  }
}

/**
 * Returns diagnostic health metrics for the telemetry queue buffer.
 */
export async function getTelemetryQueueStatus(): Promise<{
  count: number;
  oldestTimestamp?: number;
  newestTimestamp?: number;
}> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return { count: 0 };
  }

  try {
    const events = await getBufferedEvents();
    if (events.length === 0) return { count: 0 };
    return {
      count: events.length,
      oldestTimestamp: events[0]?.timestamp,
      newestTimestamp: events[events.length - 1]?.timestamp,
    };
  } catch {
    return { count: 0 };
  }
}

/**
 * Retrieves all buffered telemetry events sorted by timestamp.
 */
export async function getBufferedEvents(): Promise<BufferedAnalyticsEvent[]> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return [];

  try {
    const db = await getTelemetryDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Removes successfully flushed events from IndexedDB.
 */
export async function removeBufferedEvents(ids: string[]): Promise<void> {
  if (ids.length === 0 || typeof window === 'undefined') return;

  try {
    const db = await getTelemetryDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const id of ids) {
        store.delete(id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.debug('[TelemetryQueue] Failed to purge flushed events:', err);
  }
}

/**
 * Flushes the entire offline telemetry buffer through the active Analytics instance.
 */
export async function flushTelemetryQueue(analyticsInstance: Analytics | null): Promise<number> {
  if (!analyticsInstance || isFlushing || typeof navigator === 'undefined' || !navigator.onLine) {
    return 0;
  }

  try {
    isFlushing = true;
    const events = await getBufferedEvents();
    if (events.length === 0) {
      isFlushing = false;
      return 0;
    }

    const processedIds: string[] = [];

    for (const evt of events) {
      try {
        logEvent(analyticsInstance, evt.eventName, evt.params);
        processedIds.push(evt.id);
      } catch (logErr) {
        console.debug('[TelemetryQueue] Event replay error, skipping:', logErr);
      }
    }

    if (processedIds.length > 0) {
      await removeBufferedEvents(processedIds);
      console.log(`[TelemetryQueue] Replayed and flushed ${processedIds.length} offline analytics events.`);
    }

    isFlushing = false;
    return processedIds.length;
  } catch (err) {
    isFlushing = false;
    console.debug('[TelemetryQueue] Flush process encountered error:', err);
    return 0;
  }
}

/**
 * Sets comprehensive User Properties for GA4 cohort segmentation.
 */
export function setCohortUserProperties(
  analyticsInstance: Analytics | null,
  props: {
    characterClass?: string;
    level?: number;
    streakDays?: number;
    ascensionTier?: number;
    isPwaStandalone?: boolean;
  }
): void {
  if (!analyticsInstance || typeof window === 'undefined') return;

  try {
    const level = props.level || 1;
    const levelBracket =
      level >= 50 ? '50_plus' : level >= 25 ? '25_49' : level >= 10 ? '10_24' : '1_9';

    const cleanProps: Record<string, string | number> = {
      user_class: props.characterClass || 'Novato',
      level_bracket: levelBracket,
      streak_days: props.streakDays || 0,
      ascension_tier: props.ascensionTier || 0,
      pwa_mode: props.isPwaStandalone ? 'standalone' : 'browser_tab',
    };

    setUserProperties(analyticsInstance, cleanProps);
  } catch (err) {
    console.debug('[TelemetryQueue] Failed to set user properties:', err);
  }
}
