// IELTS ilovasi: offline + versiyali kesh. Ilova o‘zgargach VERSION ni oshiring (app.js dagi APP_VERSION bilan bir xil).
// Eslatma: ../config.js va ../auth.js Testlar bilan umumiy — ular tarmoqdan olinadi, bo‘lmasa keshdan.
const VERSION = '2.0.1';
const CACHE = 'ielts-' + VERSION;
const SHELL = ['./', 'index.html', 'style.css', 'core.js', 'screens.js', 'task1.js', 'ai.js', 'dict.js', 'listening.js', 'materials.js', 'practice.js', 'mock.js', 'books.js', 'testkit.js', 'fulltest.js', 'lists.js', 'cambridge.js', 'camws.js', 'plan.js', 'stats.js', 'focus.js', 'chat.js', 'me.js', 'analyze.js', 'mb.js', 'agent.js', 'typing.js', 'app.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
  'data/reading.json', 'data/vocab8.json', 'data/strategy.json', 'data/prompts.json', 'data/listening.json', 'data/articles.json', 'data/podcasts.json', '../config.js', '../auth.js'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' }))))); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('ielts-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'GET_VERSION' && e.source) e.source.postMessage({ type: 'VERSION', version: VERSION });
});
self.addEventListener('fetch', e => {
  const r = e.request, u = new URL(r.url);
  if (r.method !== 'GET' || u.origin !== location.origin) return;
  if (/\.mp3$/.test(u.pathname) || r.headers.has('range')) return;   // audio: brauzer o‘zi (Range so‘rovlari bilan) oladi
  e.respondWith((async () => {
    const c = await caches.open(CACHE), hit = await c.match(r, { ignoreSearch: true });
    if (hit) return hit;
    try { const res = await fetch(r); if (res.ok && !u.pathname.endsWith('sw.js') && u.pathname.includes('/ielts/')) c.put(r, res.clone()); return res; }
    catch (err) { return r.mode === 'navigate' ? ((await c.match('index.html')) || Response.error()) : Response.error(); }
  })());
});
