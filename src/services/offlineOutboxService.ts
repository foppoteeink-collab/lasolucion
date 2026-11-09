/**
 * offlineOutboxService.ts
 * 
 * Production-grade IndexedDB Outbox Queue and Background Sync Manager for PWA / Offline-First.
 * Guarantees that any offline mutation (tasks, habits, pomodoros, shop rewards, stats)
 * is recorded in a persistent IndexedDB queue, triggers Background Sync API, and
 * is reliably replayed and reconciled with Cloud Firestore once connectivity is restored.
 */

export type OutboxMutationType =
  | 'TASK_TOGGLE'
  | 'HABIT_INCREMENT'
  | 'HABIT_RESET'
  | 'DAY_FINALIZE'
  | 'DAY_REOPEN'
  | 'POMODORO_COMPLETE'
  | 'SHOP_REDEEM'
  | 'JOURNAL_SAVE'
  | 'FULL_SYNC_SNAPSHOT';

export interface OutboxOperation {
  id: string;
  type: OutboxMutationType;
  timestamp: number;
  userId: string;
  payload?: any;
  status: 'pending' | 'in_flight' | 'completed' | 'dead_letter';
  attempts: number;
  errorMessage?: string;
  failureReason?: string;
  quarantinedAt?: number;
}

const DB_NAME = 'la-solucion-sync-outbox';
const DB_VERSION = 1;
const STORE_NAME = 'outbox_operations';
const SYNC_TAG = 'sync-cloud-mutations';

let dbPromise: Promise<IDBDatabase> | null = null;
const listeners = new Set<(count: number) => void>();
let cachedPendingCount = 0;

/**
 * Opens or retrieves the singleton IndexedDB connection.
 */
function getDB(): Promise<IDBDatabase> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) {
    return Promise.reject(new Error('IndexedDB is not supported in this environment'));
  }

  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = window.indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
          store.createIndex('status', 'status', { unique: false });
          store.createIndex('timestamp', 'timestamp', { unique: false });
          store.createIndex('userId', 'userId', { unique: false });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => {
          db.close();
          dbPromise = null;
        };
        resolve(db);
      };

      request.onerror = () => {
        dbPromise = null;
        reject(request.error || new Error('Failed to open IndexedDB outbox'));
      };
    });
  }

  return dbPromise;
}

/**
 * Notifies all active subscribers with the current pending outbox operations count.
 */
function notifySubscribers(count: number) {
  cachedPendingCount = count;
  for (const listener of listeners) {
    try {
      listener(count);
    } catch (e) {
      console.warn('[OfflineOutbox] Error in subscriber callback:', e);
    }
  }
}

/**
 * Requests the browser to register a Background Sync event with the active Service Worker.
 */
export async function requestBackgroundSync(): Promise<boolean> {
  if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.ready;
    if ('sync' in registration && typeof (registration as any).sync?.register === 'function') {
      await (registration as any).sync.register(SYNC_TAG);
      return true;
    }
  } catch (err) {
    console.debug('[OfflineOutbox] Background Sync registration not permitted or failed:', err);
  }

  return false;
}

/**
 * Enqueues a new mutation into the IndexedDB Outbox.
 */
export async function enqueueOutboxOperation(
  type: OutboxMutationType,
  payload: any,
  userId: string
): Promise<string | null> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return null;

  try {
    const db = await getDB();
    const id = `op_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    const operation: OutboxOperation = {
      id,
      type,
      timestamp: Date.now(),
      userId,
      payload,
      status: 'pending',
      attempts: 0,
    };

    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(operation);

      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });

    // Refresh pending count
    const count = await getPendingOutboxCount();
    notifySubscribers(count);

    // Attempt to register Background Sync with Service Worker
    requestBackgroundSync().catch(() => {});

    return id;
  } catch (err) {
    console.warn('[OfflineOutbox] Failed to enqueue operation:', err);
    return null;
  }
}

/**
 * Retrieves all pending outbox operations ordered by timestamp.
 */
export async function getPendingOutboxOperations(userId?: string): Promise<OutboxOperation[]> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return [];

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const index = store.index('timestamp');
      const req = index.getAll();

      req.onsuccess = () => {
        const all: OutboxOperation[] = req.result || [];
        const filtered = all
          .filter((op) => op.status === 'pending' || op.status === 'in_flight')
          .filter((op) => !userId || op.userId === userId)
          .sort((a, b) => a.timestamp - b.timestamp);
        resolve(filtered);
      };

      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Marks specified operations as in_flight to prevent concurrent execution.
 */
export async function markOperationsInFlight(ids: string[]): Promise<void> {
  if (ids.length === 0 || typeof window === 'undefined') return;

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const id of ids) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const updated: OutboxOperation = {
              ...getReq.result,
              status: 'in_flight',
              attempts: (getReq.result.attempts || 0) + 1,
            };
            store.put(updated);
          }
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (err) {
    console.warn('[OfflineOutbox] Error marking operations in_flight:', err);
  }
}

/**
 * Removes completed operations from the Outbox after successful sync.
 */
export async function removeOutboxOperations(ids: string[]): Promise<void> {
  if (ids.length === 0 || typeof window === 'undefined') return;

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const id of ids) {
        store.delete(id);
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    const count = await getPendingOutboxCount();
    notifySubscribers(count);
  } catch (err) {
    console.warn('[OfflineOutbox] Error removing completed operations:', err);
  }
}

/**
 * Resets failed operations back to pending or quarantines them into Dead Letter Queue (DLQ)
 * if max retry attempts (>= 5) are reached or the error is unrecoverable (fatal).
 */
export async function markOperationsFailed(
  ids: string[],
  errorMessage: string,
  isFatal = false
): Promise<void> {
  if (ids.length === 0 || typeof window === 'undefined') return;

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);

      for (const id of ids) {
        const getReq = store.get(id);
        getReq.onsuccess = () => {
          if (getReq.result) {
            const currentAttempts = getReq.result.attempts || 0;
            const shouldQuarantine = isFatal || currentAttempts >= 5;

            const updated: OutboxOperation = {
              ...getReq.result,
              status: shouldQuarantine ? 'dead_letter' : 'pending',
              errorMessage,
              failureReason: errorMessage,
              quarantinedAt: shouldQuarantine ? Date.now() : getReq.result.quarantinedAt,
            };

            if (shouldQuarantine) {
              console.error(
                `[OfflineOutbox DLQ] Operation "${id}" (${getReq.result.type}) quarantined to Dead Letter Queue (attempts: ${currentAttempts}, fatal: ${isFatal}): ${errorMessage}`
              );
            }

            store.put(updated);
          }
        };
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    const count = await getPendingOutboxCount();
    notifySubscribers(count);
  } catch (err) {
    console.warn('[OfflineOutbox] Error marking operations failed:', err);
  }
}

/**
 * P1 Dead Letter Queue: Retrieves all operations quarantined due to fatal errors or excessive retries.
 */
export async function getDeadLetterOperations(userId?: string): Promise<OutboxOperation[]> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return [];

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();

      req.onsuccess = () => {
        const all: OutboxOperation[] = req.result || [];
        const dlq = all
          .filter((op) => op.status === 'dead_letter')
          .filter((op) => !userId || op.userId === userId)
          .sort((a, b) => (b.quarantinedAt || b.timestamp) - (a.quarantinedAt || a.timestamp));
        resolve(dlq);
      };

      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * P1 Dead Letter Queue: Restores a dead letter operation back to pending state for a manual retry.
 */
export async function retryDeadLetterOperation(id: string): Promise<boolean> {
  if (!id || typeof window === 'undefined') return false;

  try {
    const db = await getDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const getReq = store.get(id);

      getReq.onsuccess = () => {
        if (getReq.result && getReq.result.status === 'dead_letter') {
          const resetOp: OutboxOperation = {
            ...getReq.result,
            status: 'pending',
            attempts: 0,
            errorMessage: undefined,
            failureReason: undefined,
            quarantinedAt: undefined,
          };
          store.put(resetOp);
          tx.oncomplete = async () => {
            const count = await getPendingOutboxCount();
            notifySubscribers(count);
            resolve(true);
          };
        } else {
          resolve(false);
        }
      };

      getReq.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * P1 Dead Letter Queue: Purges quarantined operations.
 */
export async function purgeDeadLetterOperations(userId?: string): Promise<number> {
  if (typeof window === 'undefined') return 0;

  try {
    const db = await getDB();
    const dlqOps = await getDeadLetterOperations(userId);
    if (dlqOps.length === 0) return 0;

    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      for (const op of dlqOps) {
        store.delete(op.id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });

    return dlqOps.length;
  } catch {
    return 0;
  }
}

/**
 * Returns current count of pending outbox operations.
 */
export async function getPendingOutboxCount(userId?: string): Promise<number> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return 0;

  try {
    const ops = await getPendingOutboxOperations(userId);
    cachedPendingCount = ops.length;
    return ops.length;
  } catch {
    return 0;
  }
}

/**
 * Subscribes a listener to outbox count updates. Returns an unsubscribe function.
 */
export function subscribeToOutboxCount(listener: (count: number) => void): () => void {
  listeners.add(listener);
  listener(cachedPendingCount);
  return () => {
    listeners.delete(listener);
  };
}

/**
 * Clears all operations from outbox (useful on account reset or sign out).
 */
export async function clearOutboxQueue(): Promise<void> {
  if (typeof window === 'undefined' || !('indexedDB' in window)) return;

  try {
    const db = await getDB();
    await new Promise<void>((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
    notifySubscribers(0);
  } catch (err) {
    console.warn('[OfflineOutbox] Error clearing outbox queue:', err);
  }
}

export interface OutboxAuditReport {
  healthy: boolean;
  totalCount: number;
  duplicateIdCount: number;
  stalledInFlightCount: number;
  poisonPillCount: number;
  deadLetterCount: number;
  anomalies: string[];
}

/**
 * P2 Zero Defects QA / SPC Audit Utility for Offline Outbox.
 * Scans queued operations for duplicate IDs, stalled in_flight states, and poisoned retries.
 */
export function auditOutboxIntegrity(
  operations: OutboxOperation[],
  options: { maxAttempts?: number; stallTimeoutMs?: number; now?: number } = {}
): OutboxAuditReport {
  const maxAttempts = options.maxAttempts ?? 5;
  const stallTimeoutMs = options.stallTimeoutMs ?? 5 * 60 * 1000; // 5 minutes
  const now = options.now ?? Date.now();

  const seenIds = new Set<string>();
  const anomalies: string[] = [];
  let duplicateIdCount = 0;
  let stalledInFlightCount = 0;
  let poisonPillCount = 0;
  let deadLetterCount = 0;

  for (const op of operations) {
    if (!op.id || typeof op.id !== 'string') {
      anomalies.push(`Operation missing valid string ID: ${JSON.stringify(op)}`);
      continue;
    }

    if (seenIds.has(op.id)) {
      duplicateIdCount++;
      anomalies.push(`Duplicate outbox operation ID detected: "${op.id}"`);
    } else {
      seenIds.add(op.id);
    }

    if (op.status === 'dead_letter') {
      deadLetterCount++;
    } else if (op.attempts >= maxAttempts) {
      poisonPillCount++;
      anomalies.push(`Poison pill operation "${op.id}" (${op.type}) exceeded max attempts (${op.attempts}/${maxAttempts})`);
    }

    if (op.status === 'in_flight' && now - op.timestamp > stallTimeoutMs) {
      stalledInFlightCount++;
      anomalies.push(`Operation "${op.id}" stalled in_flight for ${Math.round((now - op.timestamp) / 1000)}s`);
    }
  }

  const healthy = duplicateIdCount === 0 && stalledInFlightCount === 0 && poisonPillCount === 0 && anomalies.length === 0;

  return {
    healthy,
    totalCount: operations.length,
    duplicateIdCount,
    stalledInFlightCount,
    poisonPillCount,
    deadLetterCount,
    anomalies,
  };
}
