import { initializeStore } from './utils/storage';
import { requestPersistentStorage } from './utils/level3Systems';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { AuthProvider } from './context/AuthContext';
import { helix } from 'ldrs';
import { ErrorBoundary } from './components/ErrorBoundary';

helix.register();

initializeStore();

const isDevEnvironment = import.meta.env.DEV || (
  typeof window !== 'undefined' && (
    window.location.port !== '' ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '0.0.0.0' ||
    window.location.hostname.endsWith('.local') ||
    /^192\.168\./.test(window.location.hostname) ||
    /^10\./.test(window.location.hostname)
  )
);

if (typeof window !== 'undefined') {
  void requestPersistentStorage().catch(() => {});
  if (!isDevEnvironment) {
    window.addEventListener('vite:preloadError', (event) => {
      event.preventDefault();
      window.location.reload();
    });
  }
}

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  if (isDevEnvironment) {
    // In local development, proactively unregister any service worker left over from production
    // and clear caches so Vite HMR and development modules load cleanly without reload loops.
    navigator.serviceWorker.getRegistrations().then((regs) => {
      for (const reg of regs) {
        reg.unregister().catch(() => {});
      }
    }).catch(() => {});
    if ('caches' in window) {
      caches.keys().then((keys) => {
        for (const k of keys) {
          caches.delete(k).catch(() => {});
        }
      }).catch(() => {});
    }
  } else {
    navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }).catch(() => {});
    let refreshing = false;

    // Global utility for hard clearing app cache and service workers
    (window as any).purgeAppCacheAndReload = async (newRev?: string) => {
      if (refreshing) return;
      refreshing = true;
      try {
        if (newRev) {
          localStorage.setItem('app_build_rev', newRev);
          sessionStorage.setItem('app_reloaded_rev', newRev);
        }
        if ('caches' in window) {
          const keys = await caches.keys();
          for (const key of keys) {
            await caches.delete(key);
          }
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update().catch(() => {});
          }
        }
        window.location.replace(window.location.pathname + '?_v=' + (newRev || Date.now()));
      } catch {
        window.location.reload();
      }
    };

    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'SW_ACTIVATED' && event.data.version) {
        const localRev = (window as any).__APP_BUILD_REV__;
        const swRev = event.data.version;
        if (localRev && swRev && swRev !== localRev) {
          if (sessionStorage.getItem('app_reloaded_rev') !== swRev) {
            (window as any).purgeAppCacheAndReload(swRev);
          }
        }
      }
    });

    let lastSWCheckAt = 0;
    let isCheckingSW = false;
    const checkSWUpdate = async () => {
      if (typeof navigator !== 'undefined' && !navigator.onLine) return;
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
      const now = Date.now();
      if (isCheckingSW || (lastSWCheckAt > 0 && now - lastSWCheckAt < 15000)) return;
      isCheckingSW = true;
      lastSWCheckAt = now;
      try {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            if (reg.waiting) {
              reg.waiting.postMessage({ type: 'SKIP_WAITING' });
            }
            await reg.update().catch(() => {});
          }
        } catch {}

        const localRev = (window as any).__APP_BUILD_REV__ || localStorage.getItem('app_build_rev');

        // 1. Fast check via /api/build-rev endpoint
        try {
          const apiRes = await fetch('/api/build-rev?_cb=' + Date.now(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
          });
          if (apiRes.ok) {
            const data = await apiRes.json();
            const serverRev = data?.rev;
            if (serverRev && localRev && serverRev !== localRev) {
              if (sessionStorage.getItem('app_reloaded_rev') !== serverRev) {
                await (window as any).purgeAppCacheAndReload(serverRev);
                return;
              }
            }
          }
        } catch {}

        // 2. Fallback check via /index.html
        try {
          const res = await fetch('/index.html?_cb=' + Date.now(), {
            cache: 'no-store',
            headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' },
          });
          if (res.ok) {
            const html = await res.text();
            const match = html.match(/var\s+BUILD_REV\s*=\s*'([^']+)'/);
            const serverRev = match?.[1];
            if (serverRev && localRev && serverRev !== localRev) {
              if (sessionStorage.getItem('app_reloaded_rev') !== serverRev) {
                await (window as any).purgeAppCacheAndReload(serverRev);
              }
            }
          }
        } catch {}
      } finally {
        isCheckingSW = false;
      }
    };

    window.addEventListener('load', checkSWUpdate);
    window.addEventListener('focus', checkSWUpdate);
    window.addEventListener('online', checkSWUpdate);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        checkSWUpdate();
      }
    });
    setInterval(() => {
      if (document.visibilityState === 'visible') {
        checkSWUpdate();
      }
    }, 15000);
  }
}

const rootElement = document.getElementById('root');
if (rootElement) {
  (window as any).__LA_SOLUCION_MOUNTED__ = true;
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
