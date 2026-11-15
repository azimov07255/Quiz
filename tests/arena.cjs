// Jonli Supabase sinovi: taklif kodi bilan ro‘yxatdan o‘tish, guruh bo‘yicha katalog va 2 o‘yinchili musobaqa.
// Oldindan: app_settings da ro‘yxatdan o‘tish ochiq (kod SIGNUP_CODE), guruh "kursdosh" va shu guruhga ochiq "zzarena" fani (mavzu zzt1) bo‘lsin.
// Ishga tushirish:  SIGNUP_CODE=kurs2026 node tests/arena.cjs   (rasmlar: SHOTS=papka). Sinovdan keyin zzarena* hisoblarni o‘chiring.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(fs.readFileSync(f)); });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
const CODE = process.env.SIGNUP_CODE || 'kurs2026', PW = 'Sinov-' + Date.now(), RUN = Date.now().toString(36);
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(), errs = [];
  const mk = async name => { const ctx = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }), pg = await ctx.newPage(); pg.on('pageerror', e => errs.push(name + ': ' + e.message)); return pg; };
  const shot = async (pg, n) => { if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, { recursive: true }); await pg.waitForTimeout(500); await pg.screenshot({ path: path.join(process.env.SHOTS, n + '.png') }); } };
  const A = await mk('A'), B = await mk('B');
  const signup = async (pg, login, name, code) => {
    await pg.goto(url); await pg.waitForSelector('[data-a="authMode"][data-m="up"]', { timeout: 15000 });
    await pg.click('[data-a="authMode"][data-m="up"]');
    await pg.fill('input[name="code"]', code); await pg.fill('input[name="name"]', name); await pg.fill('input[name="email"]', login); await pg.fill('input[name="password"]', PW);
    await pg.click('#af button[type="submit"]');
  };
  console.log('1. Noto‘g‘ri kod rad etiladi');
  await signup(A, 'zzarena-x' + RUN, 'Xato', 'notogri'); await A.waitForSelector('.note[role="alert"]');
  ok((await A.locator('.note[role="alert"]').innerText()).includes('noto‘g‘ri'), 'xato kod: ro‘yxatdan o‘tmadi');
  console.log('2. To‘g‘ri kod bilan ikkita hisob ochiladi va guruh fani ko‘rinadi');
  await signup(A, 'zzarena-a' + RUN, 'Alisher', CODE); await signup(B, 'zzarena-b' + RUN, 'Bobur', CODE);
  for (const pg of [A, B]) await pg.waitForSelector('[data-a="subj"]:has-text("ZZ Sinov fani")', { timeout: 20000 });
  ok(true, 'ikkala hisobda ZZ Sinov fani paydo bo‘ldi');
  await shot(A, '1-bosh');
  console.log('3. Xona ochish va qo‘shilish');
  await A.click('[data-a="nav"][data-v="arena"]'); await A.click('[data-a="aNew"]'); await A.waitForSelector('#sf select[name="src"]');
  await A.selectOption('#sf select[name="src"]', 't:c:zzt1'); await A.click('#sf [data-val="12"]'); await A.click('#sf button[type="submit"]');
  await A.waitForSelector('.arena-code .code span'); const code = (await A.locator('.arena-code .code').innerText()).replace(/\s/g, '');
  ok(code.length === 5, 'xona kodi: ' + code); await shot(A, '2-lobi');
  await B.click('[data-a="nav"][data-v="arena"]'); await B.fill('#jf input[name="code"]', code); await B.click('#jf button[type="submit"]');
  await B.waitForSelector('.arena-code');
  await A.waitForFunction(() => document.querySelectorAll('#lb .lbr').length === 2, null, { timeout: 8000 });
  ok(true, 'lobida 2 o‘yinchi ko‘rindi');
  console.log('4. Poyga');
  await A.click('[data-a="aStart"]');
  const bank = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'data/testlar-banki.json'), 'utf8')), byText = {};
  bank.subjects.forEach(s => s.topics.forEach(t => t.q.forEach(q => { byText[q.q.replace(/\s+/g, ' ')] = q; })));
  const play = async (pg, good, n) => {
    for (let i = 0; i < n; i++) {
      await pg.waitForSelector('.opt:not([disabled])', { timeout: 15000 });
      const t = (await pg.locator('.q').innerText()).replace(/\s+/g, ' ').trim(); const q = byText[t];
      let idx; if (q) { const opt = good ? q.o[q.a] : q.o.find((_, k) => k !== q.a); idx = await pg.locator('.opt').evaluateAll((els, v) => els.findIndex(e => e.querySelector('.tx').textContent === v), opt); } else idx = 0;
      if (i === 1) await shot(pg, 'savol-' + (good ? 'A' : 'B'));
      await pg.locator('.opt').nth(idx).click(); await pg.waitForTimeout(1300);
    }
  };
  await Promise.all([play(A, true, 8), play(B, false, 8)]);
  await A.waitForSelector('.arena-pod', { timeout: 20000 }); await B.waitForSelector('.arena-pod', { timeout: 20000 });
  const ta = await A.locator('.arena-pod .k').innerText(), tb = await B.locator('.arena-pod .k').innerText();
  ok(ta.includes('g‘olib'), 'A g‘olib: ' + ta.replace(/\n/g, ' ')); ok(tb.includes('2-o‘rin'), 'B 2-o‘rinda: ' + tb);
  const rows = await A.locator('#lb .lbr').allInnerTexts(); ok(rows[0].includes('Alisher') && /\b\d{3,4}\b/.test(rows[0]), 'reyting: ' + rows.map(r => r.replace(/\s+/g, ' ')).join(' | '));
  await shot(A, '3-natija'); await shot(B, '4-natija-B');
  ok(errs.length === 0, 'konsol xatosi yo‘q' + (errs.length ? ': ' + errs.join('; ') : ''));
  await br.close(); srv.close(); console.log(fails ? '\n' + fails + ' xato' : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
