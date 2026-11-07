import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { defineConfig } from 'vite';

function getLatestMtimeMs(dirOrFile: string): number {
  try {
    const stat = fs.statSync(dirOrFile);
    if (!stat.isDirectory()) {
      return stat.mtimeMs;
    }
    let latest = stat.mtimeMs;
    const entries = fs.readdirSync(dirOrFile, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name.startsWith('.')) {
        continue;
      }
      const fullPath = path.join(dirOrFile, entry.name);
      const mtime = entry.isDirectory() ? getLatestMtimeMs(fullPath) : fs.statSync(fullPath).mtimeMs;
      if (mtime > latest) latest = mtime;
    }
    return latest;
  } catch {
    return Date.now();
  }
}

function computeSourceBuildRev(): string {
  const srcMtime = getLatestMtimeMs(path.resolve(__dirname, 'src'));
  const htmlMtime = getLatestMtimeMs(path.resolve(__dirname, 'index.html'));
  const maxMtime = Math.max(srcMtime, htmlMtime);
  return `rev-${Math.floor(maxMtime)}`;
}

function generateSelfHealingServiceWorker(buildRev: string, additionalAssets: string[] = []): string {
  const allCoreAssets = [
    '/',
    '/index.html',
    '/manifest.webmanifest',
    '/manifest.json',
    '/icon.svg',
    '/apple-touch-icon.png',
    '/pwa-192x192.png',
    '/pwa-512x512.png',
    '/pwa-maskable-512x512.png',
    ...additionalAssets
  ];

  return `/**
 * La Solución - Self-Healing Network-First PWA Service Worker with Resilient Offline Support
 * Build Revision: ${buildRev}
 */
const SW_VERSION = '${buildRev}';
const CACHE_NAME = 'la-solucion-cache-' + SW_VERSION;
const FONTS_CACHE_NAME = 'la-solucion-fonts-v1';
const CORE_ASSETS = ${JSON.stringify(allCoreAssets, null, 2)};

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await Promise.allSettled(
        CORE_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[SW] Core precache fail:', asset, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      try {
        const keys = await caches.keys();
        await Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME && key !== FONTS_CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      } catch (e) {}

      try {
        await self.clients.claim();
      } catch (e) {}

      try {
        const windowClients = await self.clients.matchAll({
          type: 'window',
          includeUncontrolled: true,
        });
        for (const client of windowClients) {
          client.postMessage({ type: 'SW_ACTIVATED', version: SW_VERSION });
        }
      } catch (e) {}
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Background Sync: Triggers offline write queue flush when network reconnects
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-cloud-mutations') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGER' });
        }
      })
    );
  }
});

// Periodic Background Sync for installed PWAs
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-tasks-periodic' || event.tag === 'sync-cloud-mutations') {
    event.waitUntil(
      self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
        for (const client of clients) {
          client.postMessage({ type: 'BACKGROUND_SYNC_TRIGGER' });
        }
      })
    );
  }
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // 0. External Fonts (Google Fonts & WebFonts): Stale-While-Revalidate with Dedicated Cache
  if (url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com') {
    event.respondWith(
      caches.open(FONTS_CACHE_NAME).then(async (cache) => {
        const cachedRes = await cache.match(req);
        const fetchPromise = fetch(req).then((networkRes) => {
          if (networkRes.ok) {
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        }).catch(() => cachedRes);
        return cachedRes || fetchPromise;
      })
    );
    return;
  }

  if (url.origin !== self.location.origin) return;

  // 1. Navigation requests: Network-First with Offline Cache Fallback
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(async (networkRes) => {
          if (networkRes.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put('/index.html', networkRes.clone());
          }
          return networkRes;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const cached = await cache.match(req, { ignoreSearch: true }) ||
                         await cache.match('/index.html') ||
                         await cache.match('/') ||
                         await caches.match('/index.html') ||
                         await caches.match('/');
          if (cached) return cached;
          return new Response('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>La Solución - Offline</title></head><body><h1>Modo sin conexión</h1><p>Conéctate a internet para inicializar la aplicación.</p></body></html>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        })
    );
    return;
  }

  // 2. Chunks and Static Assets under /assets/: Cache-First with Dynamic Fallback & Stale Guard
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(req).then(async (cachedRes) => {
        if (cachedRes) {
          return cachedRes;
        }
        try {
          const networkRes = await fetch(req);
          const contentType = networkRes.headers.get('content-type') || '';
          if (networkRes.status === 404 || contentType.includes('text/html')) {
            if (event.clientId) {
              try {
                const client = await self.clients.get(event.clientId);
                if (client) {
                  client.postMessage({ type: 'CHUNK_MISSING', url: req.url });
                }
              } catch (e) {}
            }
            return new Response('', { status: 404, statusText: 'Chunk Outdated' });
          }
          if (networkRes.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch (fetchErr) {
          return cachedRes || new Response('', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }

  // 3. Static root assets (icons, manifest, etc.)
  if (url.pathname.match(/\\.(png|svg|ico|webmanifest|json)$/i)) {
    event.respondWith(
      caches.match(req).then(async (cachedRes) => {
        if (cachedRes) return cachedRes;
        try {
          const networkRes = await fetch(req);
          if (networkRes.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(req, networkRes.clone());
          }
          return networkRes;
        } catch (e) {
          return cachedRes || new Response('', { status: 503, statusText: 'Offline' });
        }
      })
    );
    return;
  }
});

// Notification click handler (from sw-notifications.js)
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            tag: event.notification.tag,
            url: targetUrl,
          });
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});

self.addEventListener('notificationclose', () => {});
`;
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'dev-and-prod-sw-plugin',
        transformIndexHtml(html) {
          const dynamicRev = computeSourceBuildRev();
          return html.replace(
            /var\s+BUILD_REV\s*=\s*'[^']*';/,
            `var BUILD_REV = '${dynamicRev}';`
          );
        },
        closeBundle() {
          try {
            const dynamicRev = computeSourceBuildRev();
            const distDir = path.resolve(__dirname, 'dist');
            const apiDir = path.resolve(distDir, 'api');
            fs.mkdirSync(apiDir, { recursive: true });
            fs.writeFileSync(
              path.join(apiDir, 'build-rev'),
              JSON.stringify({ rev: dynamicRev }),
              'utf-8'
            );
            let additionalAssets: string[] = [];
            try {
              const assetsDir = path.resolve(distDir, 'assets');
              if (fs.existsSync(assetsDir)) {
                additionalAssets = fs.readdirSync(assetsDir)
                  .filter((f) => f.endsWith('.css') || f.startsWith('index-') || f.startsWith('vendor-'))
                  .map((f) => `/assets/${f}`);
              }
            } catch {}

            fs.writeFileSync(
              path.join(distDir, 'sw.js'),
              generateSelfHealingServiceWorker(dynamicRev, additionalAssets),
              'utf-8'
            );
            fs.writeFileSync(
              path.join(distDir, 'registerSW.js'),
              "if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }); }); }",
              'utf-8'
            );
          } catch {}
        },
        configureServer(server) {
          server.middlewares.use((req, res, next) => {
            if (req.url === '/api/build-rev' || req.url?.startsWith('/api/build-rev?')) {
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(JSON.stringify({ rev: computeSourceBuildRev() }));
              return;
            }
            if (req.url === '/sw.js' || req.url?.startsWith('/sw.js?')) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(generateSelfHealingServiceWorker(computeSourceBuildRev()));
              return;
            }
            if (req.url === '/registerSW.js' || req.url?.startsWith('/registerSW.js?')) {
              res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
              res.end(
                "if ('serviceWorker' in navigator) { window.addEventListener('load', () => { navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' }); }); }"
              );
              return;
            }
            next();
          });
        },
      },
    ],
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      chunkSizeWarningLimit: 1500,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('@firebase/firestore') || id.includes('firebase/firestore')) {
                return 'vendor-firebase-firestore';
              }
              if (id.includes('@firebase/auth') || id.includes('firebase/auth')) {
                return 'vendor-firebase-auth';
              }
              if (id.includes('firebase')) {
                return 'vendor-firebase';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-lucide';
              }
              if (id.includes('canvas-confetti') || id.includes('ldrs')) {
                return 'vendor-visuals';
              }
              return 'vendor';
            }
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: 'all',
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: {
        ignored: ['**/node_modules/**', '**/dist/**', '**/.git/**'],
      },
    },
  };
});
