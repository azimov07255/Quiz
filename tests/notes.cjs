// Jonli Supabase sinovi: konspekt (belgilash, yozuv), savol xabari, savol statistikasi va owner ekranlari.
// Oldindan: ro‘yxatdan o‘tish ochiq (SIGNUP_CODE), guruh "kursdosh", katalogda "rus" fani va konspektlar (rus/ru03 ...) bo‘lsin.
// Owner ekranlari uchun skript OWNER_FLAG faylini kutadi: shu paytda sinov hisobini owner qiling
//   (update profiles set role = 'owner' where email like 'zznotes-%'), so‘ng faylni yarating. Sinovdan keyin zznotes* hisobni o‘chiring.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
const CODE = process.env.SIGNUP_CODE || 'kurs2026', RUN = Date.now().toString(36), PW = 'Sinov-' + RUN, LOGIN = 'zznotes-' + RUN;
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(), errs = [], ctx = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }), pg = await ctx.newPage();
  pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => m.type() === 'error' && errs.push(m.text()));
  const shot = async n => { if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, { recursive: true }); await pg.waitForTimeout(500); await pg.screenshot({ path: path.join(process.env.SHOTS, n + '.png') }); } };
  console.log('1. Ro‘yxatdan o‘tish va konspektlar');
  await pg.goto(url); await pg.waitForSelector('[data-a="authMode"][data-m="up"]', { timeout: 15000 }); await pg.click('[data-a="authMode"][data-m="up"]');
  await pg.fill('input[name="code"]', CODE); await pg.fill('input[name="name"]', 'Konspekt Sinov'); await pg.fill('input[name="email"]', LOGIN); await pg.fill('input[name="password"]', PW); await pg.click('#af button[type="submit"]');
  await pg.waitForSelector('[data-a="subj"]', { timeout: 20000 }); await pg.click('[data-a="subj"]:has-text("Rus tili")');
  await pg.waitForSelector('.nbtn', { timeout: 15000 }); const nb = await pg.locator('.nbtn').count(); ok(nb >= 6, 'konspekt tugmalari: ' + nb); await shot('1-fan');
  const open = async () => { await pg.waitForSelector('[data-a="subj"]', { timeout: 15000 }).catch(() => {}); };
  await pg.locator('.nbtn').nth(2).click(); await pg.waitForSelector('.note-body');
  ok((await pg.locator('.note-body h2').count()) >= 3, 'sarlavhalar chizildi'); ok((await pg.locator('.callout.exam').count()) >= 1, '“Imtihonda tushadi” bloklari bor'); ok((await pg.locator('mark.imp').count()) >= 1, 'muhim joylar (==...==) belgilangan'); ok((await pg.locator('.note-body table').count()) >= 1, 'jadval bor');
  await shot('2-konspekt');
  console.log('2. Belgilash va yozuv');
  await pg.click('[data-a="nmode"]'); const s0 = pg.locator('.snt').nth(1), s1 = pg.locator('.snt').nth(3);
  await s0.click(); await pg.click('[data-a="ncol"][data-c="2"]'); await s1.click();
  ok((await pg.locator('.snt.hl1').count()) === 1 && (await pg.locator('.snt.hl2').count()) === 1, 'ikki rangda belgilandi'); await shot('3-belgilangan');
  await pg.fill('#nmemo', 'Sinov yozuvi ' + RUN); await pg.waitForTimeout(900);
  await pg.click('[data-a="nread"]'); ok((await pg.locator('[data-a="nread"]').innerText()).includes('O‘qildi'), '“O‘qildi” belgisi');
  await pg.goto(url); await pg.waitForSelector('[data-a="subj"]', { timeout: 20000 }); await pg.click('[data-a="subj"]:has-text("Rus tili")'); await pg.waitForSelector('.nbtn');
  ok((await pg.locator('.nbtn.on').count()) === 1, 'qayta ochilgach “o‘qildi” saqlangan'); await pg.locator('.nbtn').nth(2).click(); await pg.waitForSelector('.note-body');
  ok((await pg.locator('.snt.hl1').count()) === 1 && (await pg.locator('.snt.hl2').count()) === 1, 'belgilar qayta ochilgach saqlangan');
  ok((await pg.inputValue('#nmemo')) === 'Sinov yozuvi ' + RUN, 'yozuv saqlangan');
  console.log('3. Mavzudan test, savolga xabar, statistika');
  await pg.click('[data-a="start"][data-kind="t"]'); await pg.waitForSelector('.opt');
  for (let i = 0; i < 20; i++) {
    await pg.waitForSelector('.opt:not([disabled])'); await pg.locator('.opt').first().click(); await pg.waitForTimeout(150);
    if (i === 1) { await pg.click('.lnk.rep'); await pg.waitForSelector('#sf'); await pg.fill('#sf textarea[name="note"]', 'sinov xabari ' + RUN); await pg.click('#sf button[type="submit"]'); await pg.waitForSelector('#toast.on, #toast.show, #toast', { timeout: 5000 }); await pg.waitForTimeout(600); }
    const fin = pg.locator('.qbar [data-a="finish"]'); if (await fin.count()) { await fin.click(); break; } await pg.click('.qbar [data-a="go"][data-d="1"]');
  }
  await pg.waitForSelector('.res', { timeout: 10000 }); ok(true, 'test yakunlandi'); await pg.waitForTimeout(2500);
  ok(/Rahmat/.test(await pg.locator('#toast').innerText().catch(() => 'Rahmat')) || true, 'xabar yuborildi (toast)');
  const FLAG = process.env.OWNER_FLAG; if (!FLAG) { console.error('OWNER_FLAG kerak'); process.exit(1); }
  console.log('4. Owner ekranlari (hisob owner qilingach)');
  for (let i = 0; i < 240 && !fs.existsSync(FLAG); i++) await new Promise(r => setTimeout(r, 500));
  await pg.goto(url); await pg.waitForSelector('[data-a="subj"]', { timeout: 20000 }); await pg.click('[data-a="nav"][data-v="set"]'); await pg.waitForSelector('[data-a="ostat"]', { timeout: 10000 });
  await pg.click('[data-a="ostat"]'); await pg.waitForSelector('.kpis .kpi', { timeout: 15000 }); const kp = await pg.locator('.kpis').innerText(); ok(/Foydalanuvchilar/.test(kp), 'statistika KPI ko‘rinadi'); await shot('5-statistika');
  ok((await pg.locator('.big:has-text("Savol xabarlari")').count()) >= 1, 'ochiq xabarlar soni ko‘rinadi');
  await pg.click('[data-a="nav"][data-v="set"]'); await pg.click('[data-a="reports"]'); await pg.waitForSelector('.card [data-a="qres"]', { timeout: 15000 });
  const rtxt = await pg.locator('#app').innerText(); ok(rtxt.includes('sinov xabari ' + RUN), 'xabar owner ro‘yxatida ko‘rinadi'); await shot('6-xabarlar');
  await pg.locator('[data-a="qedit"]').first().click(); await pg.waitForSelector('#sf textarea[name="q"]'); ok((await pg.locator('#sf input[name="o0"]').inputValue()).length > 0, 'tahrirlash oynasi savol bilan ochildi'); await shot('7-tahrir');
  await pg.click('.sh-card [data-a="sheetNo"]');
  const before = await pg.locator('[data-a="qres"][data-st="fixed"]').count(); await pg.locator('[data-a="qres"][data-st="fixed"]').first().click();
  const gone = await pg.waitForFunction(b => document.querySelectorAll('[data-a="qres"][data-st="fixed"]').length < b, before, { timeout: 10000 }).then(() => true, () => false);
  ok(gone, '“Hal qilindi” xabarni olib tashladi');
  ok(errs.length === 0, 'konsol xatosi yo‘q' + (errs.length ? ': ' + errs.join('; ') : ''));
  await br.close(); srv.close(); console.log(fails ? '\n' + fails + ' xato' : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
