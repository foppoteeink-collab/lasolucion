import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, Auth } from 'firebase/auth';
import { getAI, GoogleAIBackend, AI } from 'firebase/ai';
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
// Request Google Drive app data access scope for user backup & sync
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

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


