import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getAI, GoogleAIBackend, AI } from 'firebase/ai';
import { getAnalytics, isSupported, Analytics, logEvent } from 'firebase/analytics';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  setLogLevel,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

let app: FirebaseApp | undefined;
try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} catch (e) {
  console.warn('Firebase initializeApp failed:', e);
}

export { app, firebaseConfig };

import {
  enqueueTelemetryEvent,
  flushTelemetryQueue,
  setCohortUserProperties,
} from './services/telemetryQueueService';

let analyticsInstance: Analytics | null = null;
const configuredMeasurementId = (firebaseConfig as { measurementId?: string })?.measurementId;
const hasValidMeasurementId =
  typeof configuredMeasurementId === 'string' &&
  configuredMeasurementId.trim().length > 0 &&
  configuredMeasurementId !== 'undefined';

if (typeof window !== 'undefined' && app && hasValidMeasurementId) {
  isSupported()
    .then((supported) => {
      if (supported) {
        try {
          analyticsInstance = getAnalytics(app);
          // Auto-flush pending events on initialization
          if (navigator.onLine) {
            flushTelemetryQueue(analyticsInstance).catch(() => {});
          }
        } catch {}
      }
    })
    .catch(() => {});

  window.addEventListener('online', () => {
    if (analyticsInstance) {
      flushTelemetryQueue(analyticsInstance).catch(() => {});
    }
  });
}

export const analytics = analyticsInstance as Analytics;

export const safeLogEvent = (eventName: string, params?: Record<string, any>) => {
  if (typeof window === 'undefined') return;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (isOnline && analyticsInstance) {
    try {
      logEvent(analyticsInstance, eventName, params);
      return;
    } catch {
      // Fallback to buffer on unexpected dispatch error
    }
  }

  // Buffer in IndexedDB when offline or analytics not yet initialized
  void enqueueTelemetryEvent(eventName, params);
};

export const safeSetUserProperties = (props: {
  characterClass?: string;
  level?: number;
  streakDays?: number;
  ascensionTier?: number;
  isPwaStandalone?: boolean;
}) => {
  if (analyticsInstance) {
    setCohortUserProperties(analyticsInstance, props);
  }
};

let aiInstance: AI | null = null;
try {
  if (app) {
    aiInstance = getAI(app, { backend: new GoogleAIBackend() });
  }
} catch (e) {
  console.warn('Firebase getAI failed:', e);
}

export const firebaseAI = aiInstance;

let authInstance: Auth | null = null;
try {
  if (app) {
    authInstance = getAuth(app);
  }
} catch (e) {
  console.warn('Firebase getAuth failed:', e);
}

export const auth = authInstance as Auth;
export const googleProvider = new GoogleAuthProvider();
// Flujo estándar: No solicita scopes sensibles innecesarios para autenticación básica
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

/**
 * Proveedor bajo demanda para autorización incremental de Google Drive.
 * Se invoca exclusivamente cuando el usuario solicita respaldar o sincronizar su partida.
 */
export const createGoogleDriveProvider = (): GoogleAuthProvider => {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.file');
  provider.setCustomParameters({
    prompt: 'consent'
  });
  return provider;
};

let dbInstance: Firestore | null = null;
try {
  if (app) {
    // Attempt to initialize Firestore with persistent offline cache (IndexedDB) and multi-tab support
    try {
      dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      }, (firebaseConfig as any).firestoreDatabaseId || undefined);
    } catch {
      // If already initialized or persistent cache is unsupported in the current context, fallback to standard getFirestore
      dbInstance = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || undefined);
    }
  }
} catch (e) {
  console.warn('Firebase getFirestore failed:', e);
}

export const db = dbInstance as Firestore;

try {
  setLogLevel('silent');
} catch (e) {
  // ignore
}

export async function testConnection(): Promise<boolean> {
  if (!db) return false;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn("Firebase client is operating offline.");
    }
    return false;
  }
}


