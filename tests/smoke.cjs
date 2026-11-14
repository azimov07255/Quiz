// Playwright/Chromium sinovi.  Ishga tushirish:  node tests/smoke.cjs   (rasmlar: SHOTS=papka)
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
// Mahalliy rejim: config.js bo‘sh beriladi (Supabase ulanmaydi, login talab qilinmaydi). Bulut sinovi — tests/cloud.cjs
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; if (p === '/config.js') { r.writeHead(200, { 'content-type': 'text/javascript' }); return r.end('window.TESTLAR_CONFIG = {};'); } const f = path.join(root, p); if (!f.startsWith(root) || !fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
const bank = JSON.parse(fs.readFileSync(path.join(root, 'data/testlar-banki.json'), 'utf8'));
const byText = {}; bank.subjects.forEach(s => s.topics.forEach(t => t.q.forEach(q => { byText[q.q] = q; })));
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };

(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(); const ctx = await br.newContext({ ...devices['iPhone 13'], acceptDownloads: true, serviceWorkers: 'allow' });
  const pg = await ctx.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const shot = async n => { if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, { recursive: true }); await pg.waitForTimeout(700); await pg.screenshot({ path: path.join(process.env.SHOTS, n + '.png') }); } };
  const sheetOk = () => pg.click('#sheet.on [data-a="sheetOk"]');
  const topic = n => pg.click(`[data-a="start"][data-kind="t"]:has-text("${n}")`);
  const subj = n => pg.click(`[data-a="subj"]:has-text("${n}")`);
  const resText = t => pg.waitForFunction(x => (document.querySelector('.res')?.innerText || '').includes(x), t, { timeout: 5000 });
  const opt = txt => pg.locator('.opt').filter({ has: pg.locator('.tx', { hasText: new RegExp('^' + txt.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '$') }) }).first();
  const clickCorrect = async () => { const t = (await pg.locator('.q').innerText()).trim(); const q = byText[t]; if (!q) throw new Error('savol topilmadi: ' + t); await opt(q.o[q.a]).click(); };
  const clickWrong = async () => { const t = (await pg.locator('.q').innerText()).trim(); const q = byText[t]; await opt(q.o.find((_, i) => i !== q.a)).click(); };

  console.log('1. Bo‘sh holat va namuna bank');
  await pg.goto(url); await pg.waitForSelector('text=Qanday ishlaydi'); await shot('1-bosh');
  await pg.click('text=Namuna bankni yuklash'); await pg.waitForSelector('[data-a="subj"]');
  ok(await pg.locator('[data-a="subj"]:has-text("Tilshunoslikka kirish")').count() === 1, 'fan kartasi ko‘rindi');
  ok((await pg.locator('.note').innerText()).includes('239'), 'xabar: 239 savol yuklandi'); await shot('2-fanlar');

  console.log('2. Mavzu bo‘yicha mashq (hammasi to‘g‘ri)');
  await subj('Tilshunoslikka kirish'); await shot('3-fan'); await pg.click('button.chip[data-n="10"]');
  await topic('Tilshunoslik fani tarixi'); await pg.waitForSelector('.q');
  for (let i = 0; i < 10; i++) { await clickCorrect(); await pg.waitForSelector('.fb:not(.bad)'); if (i === 3) await shot('4-savol'); await pg.click(i < 9 ? '.qbar >> text=Keyingisi' : '.qbar >> text=Yakunlash'); }
  await resText('100%'); ok(true, '100% natija'); await shot('5-natija');

  console.log('3. Imtihon rejimi: 5 ta to‘g‘ri, 5 ta noto‘g‘ri → xatolar banki');
  await pg.click('text=Orqaga'); await pg.click('button[data-mo="e"]'); await topic('Fonetika'); await pg.waitForSelector('#tmr');
  for (let i = 0; i < 10; i++) { i % 2 ? await clickWrong() : await clickCorrect(); if (i < 9) await pg.click('.qbar >> text=Keyingisi'); }
  await shot('6-imtihon'); await pg.click('button:has-text("Testni yakunlash")'); await resText('50%');
  ok(await pg.locator('details.rev').count() === 5, '50% natija, 5 ta xato ko‘rsatildi'); await shot('7-xatolar');
  await pg.click('text=Orqaga'); await pg.click('nav >> text=Fanlar'); await pg.waitForSelector('[data-a="start"][data-kind="m"]:has-text("Xatolar (5)")'); ok(true, 'xatolar banki: 5');

  console.log('4. Ochiq rejim (xatolar banki)');
  await pg.click('button[data-mo="o"]'); await pg.click('[data-a="start"][data-kind="m"]'); await pg.waitForSelector('text=Javobni ko‘rish');
  await pg.click('text=Javobni ko‘rish'); await shot('8-ochiq'); await pg.click('button.y'); await pg.click('.qbar >> text=Keyingisi'); ok(await pg.locator('text=2 / 5').count() > 0, 'ochiq rejim ishladi');
  await pg.click('button[data-a="quit"]'); await sheetOk(); await pg.waitForSelector('[data-a="subj"]');

  console.log('5. Bir nechta mavzuni tanlab test');
  await subj('Tilshunoslikka kirish'); const cbs = pg.locator('input[data-c="sel"]'); await cbs.nth(0).check(); await cbs.nth(1).check();
  await pg.click('button[data-mo="m"]'); await pg.click('text=Tanlanganlardan test'); await pg.waitForSelector('.q'); ok(await pg.locator('text=Tanlangan mavzular').count() > 0, 'birlashtirilgan test boshlandi');
  await pg.click('button[data-a="quit"]'); await sheetOk(); await pg.waitForSelector('text=Mavzular');

  console.log('6. Imtihon sanasi va kunlik reja');
  await pg.click('nav >> text=Sozlamalar'); const d = new Date(Date.now() + 5 * 864e5); const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  await pg.locator('input[type=date]').first().fill(ds); await pg.click('nav >> text=Fanlar'); await pg.waitForSelector('text=Imtihon rejasi'); ok(await pg.locator('.pcard:has-text("ta yangi savol")').count() === 1, 'bugungi reja kartasi bor'); await shot('9-bosh');

  console.log('7. Import: noto‘g‘ri fayl rad etiladi, yangi fan qo‘shiladi');
  await pg.click('nav >> text=Sozlamalar');
  await pg.setInputFiles('#fbank', { name: 'buzuq.json', mimeType: 'application/json', buffer: Buffer.from('{"v":1,"subjects":[{"id":"x","name":"X","topics":[{"id":"x1","name":"T","q":[{"id":"x1.1","q":"?","o":["a","b","c"],"a":1}]}]}]}') });
  await pg.waitForSelector('.note'); ok((await pg.locator('.note').innerText()).includes('format xato'), 'buzuq bank rad etildi');
  const nb = { v: 1, subjects: [{ id: 'tar', name: 'Tarix', topics: [{ id: 'tar1', name: 'Amir Temur', src: 'test', q: [{ id: 'tar1.1', q: 'Amir Temur qachon tug‘ilgan?', o: ['1336', '1405', '1370', '1220'], a: 0, e: 'Kesh, 1336', r: '12-bet' }] }] }] };
  await pg.setInputFiles('#fbank', { name: 'tarix.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify(nb)) });
  await pg.waitForSelector('text=1 ta savol yuklandi'); ok(await pg.locator('.row:has-text("Tarix")').count() > 0, 'yangi fan qo‘shildi'); ok(await pg.locator('.row:has-text("Tilshunoslikka kirish")').count() > 0, 'eski fan ham bor'); await shot('10-sozlamalar');

  console.log('8. Statistika va tema');
  await pg.click('nav >> text=Statistika'); await pg.waitForSelector('text=Zaifdan kuchliga'); ok(await pg.locator('.stbar').count() >= 2, 'mavzu statistikasi'); await shot('11-stat');
  await pg.click('nav >> text=Sozlamalar'); await pg.click('button[data-key="theme"][data-val="dark"]'); ok(await pg.evaluate(() => document.documentElement.dataset.theme) === 'dark', 'qorong‘i tema yoqildi'); await shot('12-qorongi');
  await pg.click('button[data-key="theme"][data-val="auto"]');

  console.log('9. Zaxira → o‘chirish → tiklash');
  const [dl] = await Promise.all([pg.waitForEvent('download'), pg.click('text=Zaxira olish')]); const bpath = path.join(require('os').tmpdir(), 'zaxira-test.json'); await dl.saveAs(bpath);
  await pg.click('text=Hammasini o‘chirish'); await sheetOk(); await pg.waitForSelector('text=Qanday ishlaydi');
  await pg.click('nav >> text=Sozlamalar'); await pg.setInputFiles('#fback', bpath); await sheetOk(); await pg.waitForSelector('text=Zaxira tiklandi');
  await pg.click('nav >> text=Statistika'); ok(await pg.locator('.stbar').count() >= 2, 'tarix tiklandi'); fs.unlinkSync(bpath);

  console.log('10. Qayta ochilganda saqlanadi + offline');
  await pg.goto(url); await pg.waitForSelector('[data-a="subj"]'); ok(await pg.locator('[data-a="subj"]:has-text("Tarix")').count() > 0, 'bank qayta ochilganda saqlangan');
  await pg.evaluate(() => navigator.serviceWorker.ready); await pg.reload(); await pg.waitForTimeout(500);
  await ctx.setOffline(true); await pg.reload(); await pg.waitForSelector('[data-a="subj"]'); ok(true, 'offline ochildi'); await ctx.setOffline(false);

  ok(!errs.length, 'konsol xatosi yo‘q' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await br.close(); srv.close(); console.log(fails ? `\n${fails} ta xato` : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('❌ Sinov yiqildi:', e.message); process.exit(1); });
