/* Push-only worker. Private admin pages are never cached here. */
const bookingPath = /^\/admin\/bookings\/[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i;
const titles = new Set(['New Borealis booking','Booking modified','Booking cancelled','Borealis test notification']);
function destination(path) {
  return typeof path === 'string' && bookingPath.test(path) ? path : '/admin/notifications';
}
self.addEventListener('install', event => event.waitUntil(self.skipWaiting()));
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('push', event => {
  let payload;
  try { payload = event.data?.json(); } catch { payload = null; }
  const title = titles.has(payload?.title) ? payload.title : 'Borealis booking activity';
  const path = destination(payload?.path);
  event.waitUntil(self.registration.showNotification(title, {
    body: title === 'Borealis test notification' ? 'Push is working on this device.' : 'Open the Borealis admin to see details.',
    tag: /^[0-9a-f-]{36}$/i.test(payload?.tag || '') ? payload.tag : undefined,
    icon: '/admin/push-icon-192.png',
    data: { path },
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const target = new URL(destination(event.notification.data?.path), self.location.origin);
  event.waitUntil((async () => {
    for (const client of await self.clients.matchAll({ type: 'window', includeUncontrolled: true })) {
      const current = new URL(client.url);
      if (current.origin !== target.origin || !/^\/admin(?:\/|$)/.test(current.pathname)) continue;
      try {
        const window = await client.navigate(target.href);
        if (window) { await window.focus(); return; }
      } catch { /* A stale window can be replaced by a new one. */ }
    }
    await self.clients.openWindow(target.href);
  })());
});
