import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isGuest: boolean;
  error: string | null;
  accessToken: string | null;
  getAccessToken: () => Promise<string | null>;
  signInWithGoogle: () => Promise<{ user: User; accessToken: string | null } | null>;
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
    (window.navigator as any).standalone === true;
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
      if (isMobileOrPWA()) {
        // Mobile / PWA: popups are blocked — use redirect flow instead
        await signInWithRedirect(auth, googleProvider);
        // Page will reload; result is handled above in getRedirectResult
        return null;
      }

      // Desktop: popup works fine
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const token = credential?.accessToken || null;
      cachedAccessToken = token;
      setAccessToken(token);
      setUser(result.user);
      return { user: result.user, accessToken: token };

    } catch (err: any) {
      console.error('Error signing in with Google:', err);

      if (err?.code === 'auth/popup-blocked') {
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
        signOut,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
