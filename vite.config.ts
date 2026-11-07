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

function generateSelfHealingServiceWorker(buildRev: string): string {
  return `/**
 * La Solución - Self-Healing Network-First PWA Service Worker
 * Build Revision: ${buildRev}
 */
const SW_VERSION = '${buildRev}';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      let hadLegacyCaches = false;
      try {
        const keys = await caches.keys();
        if (keys.length > 0) {
          hadLegacyCaches = true;
          await Promise.all(keys.map((key) => caches.delete(key)));
        }
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
          if (hadLegacyCaches && 'navigate' in client) {
            try {
              await client.navigate(client.url);
            } catch (e) {}
          }
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

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Navigation requests: always fetch fresh index.html from network
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req, { cache: 'no-store' }).catch(() => caches.match('/index.html') || fetch(req))
    );
    return;
  }

  // JS/CSS chunks under /assets/: detect if Firebase rewrite returned HTML for a deleted old chunk hash
  if (url.pathname.startsWith('/assets/') && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css'))) {
    event.respondWith(
      fetch(req).then(async (res) => {
        const contentType = res.headers.get('content-type') || '';
        if (res.status === 404 || contentType.includes('text/html')) {
          if (event.clientId) {
            try {
              const client = await self.clients.get(event.clientId);
              if (client && 'navigate' in client) {
                client.navigate('/?_v=' + SW_VERSION);
              }
            } catch (e) {}
          }
          return new Response('', { status: 404, statusText: 'Chunk Outdated' });
        }
        return res;
      })
    );
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
            fs.writeFileSync(
              path.join(distDir, 'sw.js'),
              generateSelfHealingServiceWorker(dynamicRev),
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
