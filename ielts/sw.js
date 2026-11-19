// IELTS eski manzili (…/Quiz/ielts/): ilova ko‘chdi → https://azimov07255.github.io/IELTS/
// Bu service worker eski keshni tozalaydi, eski eslatma obunasini bekor qiladi (yangi ilova o‘zi qayta obuna bo‘ladi) va ochiq oynalarni yangi manzilga yo‘naltiradi.
const NEW = 'https://azimov07255.github.io/IELTS/';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil((async () => {
  try { const s = await self.registration.pushManager.getSubscription(); if (s) await s.unsubscribe(); } catch (err) { /* */ }
  try { for (const k of await caches.keys()) if (k.startsWith('ielts-')) await caches.delete(k); } catch (err) { /* */ }
  await self.clients.claim();
  const cs = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const c of cs) { try { await c.navigate(NEW + new URL(c.url).hash); } catch (err) { /* */ } }
})()));
self.addEventListener('push', e => e.waitUntil(self.registration.showNotification('IELTS · Bugungi 15 daqiqa', { body: 'Seriyani saqlang — bugungi mashqni boshlang 🔥', icon: 'icons/icon-192.png', tag: 'ielts-daily', data: { url: NEW } })));
self.addEventListener('notificationclick', e => { e.notification.close(); e.waitUntil(self.clients.openWindow(NEW)); });
