import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
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
        setError('El navegador bloqueó la ventana emergente. Por favor, habilita las ventanas emergentes o abre la app en una nueva pestaña.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setError('Dominio no autorizado en Firebase Console. Puedes seguir jugando en Modo Local sin problemas.');
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

