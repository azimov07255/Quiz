// Kirish animatsiyasi va “yangi versiya” oqimi sinovi (Supabase kerak emas).  node tests/update.cjs   (rasmlar: SHOTS=papka)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
let swVersion = null; // null: haqiqiy sw.js; aks holda shu versiya bilan beriladi (yangi versiya chiqqanini taqlid qiladi)
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  if (p === '/config.js') { r.writeHead(200, { 'content-type': 'text/javascript' }); return r.end('window.TESTLAR_CONFIG = {};'); }
  const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  let body = fs.readFileSync(f);
  if (p === '/sw.js' && swVersion) body = Buffer.from(body.toString().replace(/const VERSION = '[^']+'/, `const VERSION = '${swVersion}'`));
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' }); r.end(body);
});
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(); const errs = [];
  const SHOTS = process.env.SHOTS; const shot = async (p, n, wait) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); if (wait) await p.waitForTimeout(wait); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };

  console.log('0. Versiyalar mos');
  const appV = /APP_VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(root, 'app.js'), 'utf8'))[1], swV = /const VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(root, 'sw.js'), 'utf8'))[1];
  ok(appV === swV, `app.js (${appV}) va sw.js (${swV}) versiyasi bir xil`);

  console.log('1. Kirish animatsiyasi');
  const c1 = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }); const p1 = await c1.newPage(); p1.on('pageerror', e => errs.push(e.message)); p1.on('console', m => m.type() === 'error' && errs.push(m.text()));
  await p1.goto(url + '?splash=1'); await p1.waitForSelector('#splash');
  ok(await p1.evaluate(() => document.body.classList.contains('splashing')), 'animatsiya vaqtida ilova ortda yashirin');
  await shot(p1, 's1-erta', 120); await shot(p1, 's2-o‘rta', 350); await shot(p1, 's3-kech', 300);
  await p1.waitForSelector('#splash', { state: 'detached', timeout: 4000 }); ok(true, 'animatsiya tugagach olib tashlandi');
  ok(!(await p1.evaluate(() => document.body.classList.contains('splashing'))) && await p1.locator('#app').isVisible(), 'ilova ko‘rinadi'); await shot(p1, 's5-ilova', 900);
  await p1.goto(url); await p1.waitForTimeout(400); ok(await p1.locator('#splash').count() === 0, 'bir sessiyada ikkinchi marta ko‘rsatilmaydi (webdriver/sessiya)');
  await p1.goto(url + '?splash=1'); ok(await p1.locator('#splash').count() === 1, '?splash=1 majburan ko‘rsatadi'); await c1.close();
  const c1b = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', reducedMotion: 'reduce' }); const p1b = await c1b.newPage(); await p1b.goto(url + '?splash=1'); await p1b.waitForSelector('#splash', { state: 'detached', timeout: 4000 }); ok(true, '“harakatni kamaytirish” yoqilganda tez o‘tadi'); await c1b.close();

  console.log('2. Yangi versiya xabari');
  const c2 = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'allow' }); const p2 = await c2.newPage(); p2.on('pageerror', e => errs.push(e.message));
  await p2.goto(url); await p2.evaluate(() => navigator.serviceWorker.ready); await p2.reload(); await p2.waitForFunction(() => navigator.serviceWorker.controller);
  const ver = () => p2.evaluate(() => new Promise(res => { navigator.serviceWorker.addEventListener('message', function f(e) { if (e.data && e.data.type === 'VERSION') { navigator.serviceWorker.removeEventListener('message', f); res(e.data.version); } }); navigator.serviceWorker.controller.postMessage({ type: 'GET_VERSION' }); }));
  ok((await ver()) === appV, `qurilmadagi versiya: v${appV}`); ok(await p2.locator('#upd.on').count() === 0, 'yangilanish yo‘q — xabar ko‘rinmaydi');
  swVersion = '9.9.9'; await p2.click('nav >> text=Sozlamalar'); await p2.click('[data-a="checkUpdate"]');
  await p2.waitForSelector('#upd.on', { timeout: 8000 }); await p2.waitForFunction(() => document.querySelector('#upd').innerText.includes('9.9.9'), null, { timeout: 5000 });
  ok(true, 'yangi versiya xabari chiqdi (v9.9.9)'); await shot(p2, 'u1-xabar', 600);
  await p2.click('#upd [data-a="updLater"]'); ok(await p2.locator('#upd.on').count() === 0, '“Keyinroq” xabarni yashiradi');
  ok((await ver()) === appV, 'Keyinroq bosilganda eski versiya ishlashda davom etadi (majburan yangilanmaydi)');
  await p2.evaluate(() => { /* xabarni qayta ko‘rsatish uchun sahifani yangilaymiz */ }); await p2.reload(); await p2.waitForSelector('#upd.on', { timeout: 8000 }); ok(true, 'keyingi ochilishda xabar yana chiqadi');
  await Promise.all([p2.waitForEvent('load'), p2.click('#upd [data-a="applyUpdate"]')]);
  await p2.waitForFunction(() => navigator.serviceWorker.controller, null, { timeout: 8000 }); await p2.waitForTimeout(500);
  ok((await ver()) === '9.9.9', 'Yangilash bosilgach yangi versiya (v9.9.9) ishga tushdi');
  const keys = await p2.evaluate(() => caches.keys()); ok(keys.includes('testlar-9.9.9') && !keys.includes('testlar-' + appV), 'eski kesh o‘chdi, yangisi qoldi');
  ok(await p2.locator('#upd.on').count() === 0 && await p2.locator('#app').isVisible(), 'yangilangach xabar yo‘qoldi, ilova ishlaydi');
  swVersion = null; await c2.close();
  ok(!errs.length, 'konsol xatosi yo‘q' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await br.close(); srv.close(); console.log(fails ? `\n${fails} ta xato` : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('❌ Sinov yiqildi:', e.message); process.exit(1); });
