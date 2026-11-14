// Offline + versiyali yangilanish. Ilova fayllari bitta “versiya”ga bog‘langan: yangi versiya fonda yuklanadi,
// foydalanuvchi “Yangilash”ni bossa almashadi (fayllar aralashib qolmaydi). Savol banki IndexedDB’da — keshga tegmaydi.
// MUHIM: ilova o‘zgargach VERSION ni oshiring (app.js dagi APP_VERSION bilan bir xil bo‘lsin).
const VERSION = '1.5.1';
const CACHE = 'testlar-' + VERSION;
const SHELL = ['./', 'index.html', 'style.css', 'app.js', 'config.js', 'auth.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'data/testlar-banki.json'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('testlar-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'GET_VERSION' && e.source) e.source.postMessage({ type: 'VERSION', version: VERSION });
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = await c.match(r, { ignoreSearch: true });
    if (hit) return hit;
    try { const res = await fetch(r); if (res.ok && !u.pathname.endsWith('sw.js')) c.put(r, res.clone()); return res; }
    catch (err) { return r.mode === 'navigate' ? ((await c.match('index.html')) || Response.error()) : Response.error(); }
  })());
});
