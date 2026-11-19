import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  error: string | null;
  accessToken: string | null;
  getAccessToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<{ user: User; accessToken: string | null } | null>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<{ user: User | null; error?: string }>;
  signInWithEmail: (email: string, pass: string) => Promise<{ user: User | null; error?: string }>;
  sendPasswordReset: (email: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

let cachedAccessToken: string | null = null;

// Detect mobile / PWA environments where popups are typically blocked
const isMobileOrPWA = (): boolean => {
  if (typeof window === 'undefined') return false;
  const ua = navigator.userAgent || '';
  const isMobile = /Android|iPhone|iPad|iPod|Opera Mini|IEMobile|WPDesktop/i.test(ua);
  const isPWA =
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true;
  return isMobile || isPWA;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Safety timeout: Ensure the app loads in max 800ms even if Firebase Auth is delayed or offline
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);

    let unsubscribe = () => {};

    try {
      if (auth) {
        // Handle redirect result (user returning from Google sign-in redirect on mobile/PWA)
        getRedirectResult(auth)
          .then((result) => {
            if (result?.user) {
              const credential = GoogleAuthProvider.credentialFromResult(result);
              const token = credential?.accessToken || null;
              cachedAccessToken = token;
              setAccessToken(token);
              setUser(result.user);
            }
          })
          .catch((err) => {
            // Non-fatal: happens when there is no pending redirect
            console.warn('[Auth] getRedirectResult:', err?.code);
          });

        unsubscribe = auth.onAuthStateChanged(
          (u) => {
            clearTimeout(timer);
            setUser(u);
            if (!u) {
              cachedAccessToken = null;
              setAccessToken(null);
            }
            setLoading(false);
          },
          (err) => {
            console.warn('Firebase Auth state listener warning (running in local mode):', err);
            clearTimeout(timer);
            setLoading(false);
          }
        );
      } else {
        setLoading(false);
      }
    } catch (err) {
      console.warn('Firebase Auth initialization warning:', err);
      clearTimeout(timer);
      setLoading(false);
    }

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    try {
      // Always try signInWithPopup first (modern iOS Safari & Android Chrome block cross-domain signInWithRedirect cookies)
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      cachedAccessToken = token;
      setAccessToken(token);
      setUser(result.user);
      return { user: result.user, accessToken: token };

    } catch (err: any) {
      console.error('Error signing in with Google:', err);

      if (err?.code === 'auth/popup-blocked' || err?.code === 'auth/operation-not-supported-in-this-environment') {
        // Desktop popup was blocked — fallback to redirect
        try {
          await signInWithRedirect(auth, googleProvider);
          return null;
        } catch {
          setError('No se pudo abrir el inicio de sesión. Intenta en una pestaña nueva.');
        }
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado en Firebase Console. Puedes seguir en Modo Local sin problemas.');
      } else if (
        err?.code === 'auth/cancelled-popup-request' ||
        err?.code === 'auth/popup-closed-by-user'
      ) {
        // User closed the popup — not an error, just ignore
        return null;
      } else {
        setError(err?.message || 'No se pudo iniciar sesión con Google.');
      }
      return null;
    }
  };

  const signUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    setError(null);
    try {
      if (!auth) throw new Error('Firebase Auth no inicializado');
      const res = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (displayName && res.user) {
        try {
          await updateProfile(res.user, { displayName: displayName.trim() });
        } catch (_) {}
      }
      setUser(res.user);
      return { user: res.user };
    } catch (err: any) {
      let msg = 'No se pudo crear la cuenta.';
      if (err?.code === 'auth/email-already-in-use') {
        msg = 'Este correo ya está registrado. Prueba iniciando sesión.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'El formato de correo no es válido.';
      } else if (err?.code === 'auth/weak-password') {
        msg = 'La contraseña debe tener al menos 6 caracteres.';
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
      return { user: null, error: msg };
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setError(null);
    try {
      if (!auth) throw new Error('Firebase Auth no inicializado');
      const res = await signInWithEmailAndPassword(auth, email.trim(), pass);
      setUser(res.user);
      return { user: res.user };
    } catch (err: any) {
      let msg = 'No se pudo iniciar sesión.';
      if (
        err?.code === 'auth/user-not-found' ||
        err?.code === 'auth/wrong-password' ||
        err?.code === 'auth/invalid-credential'
      ) {
        msg = 'Correo o contraseña incorrectos.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'El formato de correo no es válido.';
      } else if (err?.code === 'auth/too-many-requests') {
        msg = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
      return { user: null, error: msg };
    }
  };

  const sendPasswordReset = async (email: string) => {
    setError(null);
    try {
      if (!auth) throw new Error('Firebase Auth no inicializado');
      if (!email.trim()) return { success: false, error: 'Ingresa tu correo para restablecer la contraseña.' };
      await sendPasswordResetEmail(auth, email.trim());
      return { success: true };
    } catch (err: any) {
      let msg = 'No se pudo enviar el correo de restablecimiento.';
      if (err?.code === 'auth/user-not-found') {
        msg = 'No encontramos una cuenta con ese correo.';
      } else if (err?.code === 'auth/invalid-email') {
        msg = 'El formato de correo no es válido.';
      } else if (err?.message) {
        msg = err.message;
      }
      setError(msg);
      return { success: false, error: msg };
    }
  };

  const signOut = async () => {
    try {
      await auth.signOut();
      cachedAccessToken = null;
      setAccessToken(null);
      setUser(null);
    } catch (err: any) {
      console.error('Error signing out:', err);
    }
  };

  const getAccessToken = async () => cachedAccessToken;
  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isGuest: !user,
        error,
        accessToken,
        getAccessToken,
        signInWithGoogle,
        signUpWithEmail,
        signInWithEmail,
        sendPasswordReset,
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
