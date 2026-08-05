/**
 * CAM travel — Service Worker
 * Gère les notifications push / locales sur mobile et desktop.
 */
const CACHE = 'camtravel-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Notification reçue (push serveur ou message local via postMessage)
self.addEventListener('push', (event) => {
  let data = { title: 'CAM travel', body: 'Nouvelle notification', url: '/notifications.html' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    try { data.body = event.data.text(); } catch (_) {}
  }
  event.waitUntil(
    self.registration.showNotification(data.title || 'CAM travel', {
      body: data.body || '',
      icon: data.icon || '/assets/logo.svg',
      badge: data.badge || '/assets/logo.svg',
      tag: data.tag || 'camtravel-notif',
      renotify: true,
      vibrate: [120, 60, 120],
      data: { url: data.url || '/notifications.html' },
      actions: [
        { action: 'open', title: 'Ouvrir' },
        { action: 'dismiss', title: 'Ignorer' }
      ]
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  if (event.action === 'dismiss') return;
  const url = (event.notification.data && event.notification.data.url) || '/notifications.html';
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const c of clients) {
        if ('focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    })
  );
});

// Messages depuis les pages (notification locale sans serveur push)
self.addEventListener('message', (event) => {
  const msg = event.data || {};
  if (msg.type === 'SHOW_NOTIFICATION') {
    event.waitUntil(
      self.registration.showNotification(msg.title || 'CAM travel', {
        body: msg.body || '',
        icon: msg.icon || '/assets/logo.svg',
        badge: msg.badge || '/assets/logo.svg',
        tag: msg.tag || 'camtravel-local',
        renotify: true,
        vibrate: [120, 60, 120],
        data: { url: msg.url || '/notifications.html' }
      })
    );
  }
});
