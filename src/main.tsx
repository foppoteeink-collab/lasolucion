import { initializeStore } from './utils/storage';
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { helix } from 'ldrs';
import { ErrorBoundary } from './components/ErrorBoundary';

helix.register();

initializeStore();

// Force immediate page reload when a new PWA Service Worker takes control
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });

  const checkSWUpdate = () => {
    navigator.serviceWorker.ready.then((reg) => {
      if (reg.waiting) {
        reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      }
      reg.update().catch(() => {});
    }).catch(() => {});
  };

  // Check immediately upon script execution, and also on load, focus, and visibility change
  checkSWUpdate();
  window.addEventListener('load', checkSWUpdate);
  window.addEventListener('focus', checkSWUpdate);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      checkSWUpdate();
    }
  });

  // Global utility for hard clearing app cache and service workers
  (window as any).purgeAppCacheAndReload = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
      if ('caches' in window) {
        const keys = await caches.keys();
        for (const key of keys) {
          await caches.delete(key);
        }
      }
      window.location.href = window.location.pathname + '?v=' + Date.now();
    } catch {
      window.location.reload();
    }
  };
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <ErrorBoundary>
        <AuthProvider>
          <App />
        </AuthProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}


