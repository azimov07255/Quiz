// Jonli sinov: owner “Tayyor banklar” orqali IELTS fanlarini katalogga qo‘shadi. Hisob OWNER_FLAG fayli paydo bo‘lgach owner qilinishi kerak
// (update profiles set role = 'owner' where email like 'zzpre-%'). Sinovdan keyin zzpre* hisobni o‘chiring.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
const RUN = Date.now().toString(36), PW = 'Sinov-' + RUN, CODE = process.env.SIGNUP_CODE || 'kurs2026';
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(), errs = [], ctx = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }), pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(e.message));
  await pg.goto(url); await pg.waitForSelector('[data-a="authMode"][data-m="up"]', { timeout: 15000 }); await pg.click('[data-a="authMode"][data-m="up"]');
  await pg.fill('input[name="code"]', CODE); await pg.fill('input[name="name"]', 'Preset Sinov'); await pg.fill('input[name="email"]', 'zzpre-' + RUN); await pg.fill('input[name="password"]', PW); await pg.click('#af button[type="submit"]');
  await pg.waitForSelector('[data-a="subj"]', { timeout: 20000 });
  const FLAG = process.env.OWNER_FLAG; for (let i = 0; i < 240 && !fs.existsSync(FLAG); i++) await new Promise(r => setTimeout(r, 500));
  await pg.goto(url); await pg.waitForSelector('[data-a="subj"]', { timeout: 20000 }); await pg.click('[data-a="nav"][data-v="set"]'); await pg.click('[data-a="cat"]'); await pg.waitForSelector('[data-a="catPre"]');
  for (const f of ['ielts/strategiya', 'ielts/sozlar8']) {
    await pg.click(`[data-a="catPre"][data-f="${f}"]`); await pg.waitForSelector('#sf input[name="category"]', { timeout: 10000 });
    ok((await pg.inputValue('#sf input[name="category"]')) === 'IELTS' && (await pg.inputValue('#sf input[name="groups"]')) === 'ielts', f + ': kategoriya IELTS, guruh ielts oldindan yozilgan');
    await pg.click('#sf button[type="submit"]'); await pg.waitForSelector('.note.okn', { timeout: 20000 }); ok(/Katalogga yuklandi/.test(await pg.locator('.note.okn').innerText()), f + ' katalogga yuklandi');
  }
  ok(errs.length === 0, 'konsol xatosi yo‘q' + (errs.length ? ': ' + errs.join('; ') : ''));
  await br.close(); srv.close(); console.log(fails ? '\n' + fails + ' xato' : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
