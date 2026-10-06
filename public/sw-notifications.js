/**
 * sw-notifications.js
 * Service Worker personalizado para La Solución PWA.
 *
 * Maneja el evento `notificationclick`:
 *   → Al tocar una notificación del OS, enfoca la ventana de la app o la abre si está cerrada.
 *
 * Este archivo es importado por el SW generado por VitePWA.
 * VitePWA lo incluye en el bundle final del service worker.
 */

// ─── notificationclick: abrir/enfocar la app ─────────────────────────────────
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Si ya hay una ventana abierta con la app, enfocarla
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            tag: event.notification.tag,
            url,
          });
          return client.focus();
        }
      }
      // Si no hay ventana abierta, abrirla
      if (clients.openWindow) {
        return clients.openWindow(url);
      }
    })
  );
});

// ─── notificationclose: telemetría opcional ───────────────────────────────────
self.addEventListener('notificationclose', (_event) => {
  // Opcional: registrar que el usuario dismisseó la notificación
});
