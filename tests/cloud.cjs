// Jonli Supabase sinovi: login, parolni tiklash oqimi, owner hisob ochishi, obuna, to‘lovlar, RLS, sinxron.
// Avval tests/cloud-users.sql dagi sinov hisoblarini yarating, so‘ng:  node tests/cloud.cjs
// Sinovdan keyin hisoblarni o‘chiring (aks holda ular owner bo‘lib qoladi).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
const PW = 'Sinov-12345', CFG = fs.readFileSync(path.join(root, 'config.js'), 'utf8'), SBU = /url: '([^']+)'/.exec(CFG)[1], SBK = /key: '([^']+)'/.exec(CFG)[1];
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(); const errs = [];
  const mk = async () => { const c = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !m.text().includes('Failed to load resource') && errs.push(m.text())); return { c, p }; };
  const login = async (p, email, pw) => { await p.fill('input[name=email]', email); await p.fill('input[name=password]', pw); await p.click('button[type=submit]'); };
  const SHOTS = process.env.SHOTS; const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.waitForTimeout(700); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const sheetOk = p => p.click('#sheet.on [data-a="sheetOk"]');
  let HP = null; // yordamchi sahifa: token so‘rovlari brauzer ichidan (proksi orqali) ketadi
  const tokenOf = async (email, pw) => { if (!HP) { const c = await br.newContext(); HP = await c.newPage(); await HP.goto(url + 'icons/icon.svg'); } return HP.evaluate(async ([u, k, e, w]) => (await fetch(u + '/auth/v1/token?grant_type=password', { method: 'POST', headers: { apikey: k, 'content-type': 'application/json' }, body: JSON.stringify({ email: e, password: w }) })).json(), [SBU, SBK, email, pw]); };

  console.log('1. Kirish ekrani: ro‘yxatdan o‘tish yo‘q, “Parolni unutdingmi?” bor');
  const A = await mk(), a = A.p; await a.goto(url); await a.waitForSelector('#af');
  ok(await a.locator('[data-a="authMode"][data-m="up"]').count() === 0, 'mijoz o‘zi ro‘yxatdan o‘ta olmaydi (tugma yo‘q)');
  ok(await a.locator('text=Parolni unutdingmi?').count() === 1, '“Parolni unutdingmi?” bor'); await shot(a, 'd1-kirish');
  await login(a, 'zz.user@quiz.test', 'notogri'); await a.waitForSelector('.note[role=alert]'); ok((await a.locator('.note[role=alert]').innerText()).includes('noto‘g‘ri'), 'xato parol rad etildi');

  console.log('2. Parolni unutdim oynasi');
  await a.click('text=Parolni unutdingmi?'); await a.waitForSelector('#ff'); await a.fill('input[name=email]', 'noto-gri'); await a.click('button[type=submit]');
  ok((await a.locator('.note[role=alert]').innerText()).includes('email'), 'noto‘g‘ri email formati rad etildi'); await shot(a, 'd2-unutdim');
  await a.click('text=Kirishga qaytish'); await a.waitForSelector('#af'); ok(true, 'kirishga qaytish ishlaydi');

  console.log('3. Tiklash havolasi (token bilan) → yangi parol o‘rnatish');
  const t = await tokenOf('zz.user@quiz.test', PW); ok(!!t.access_token, 'sinov tokeni olindi');
  const R = await mk(), r = R.p; await r.goto(url + '#access_token=' + t.access_token + '&refresh_token=' + t.refresh_token + '&expires_in=3600&token_type=bearer&type=recovery');
  await r.waitForSelector('#rf'); ok((await r.evaluate(() => location.hash)) === '', 'havola manzildan tozalandi'); await shot(r, 'd3-yangi-parol');
  await r.fill('input[name=pw]', 'Yangi-Parol-1'); await r.fill('input[name=pw2]', 'boshqa'); await r.click('button[type=submit]'); ok((await r.locator('.note[role=alert]').innerText()).includes('bir xil emas'), 'har xil parollar rad etildi');
  await r.fill('input[name=pw]', 'Yangi-Parol-1'); await r.fill('input[name=pw2]', 'Yangi-Parol-1'); await r.click('button[type=submit]');
  await r.waitForSelector('text=Parol yangilandi', { timeout: 20000 }); ok(true, 'parol yangilandi va ilovaga kirildi');
  ok((await tokenOf('zz.user@quiz.test', 'Yangi-Parol-1')).access_token ? true : false, 'yangi parol bilan kirish ishlaydi'); await R.c.close();
  const E = await mk(); await E.p.goto(url + '#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired'); await E.p.waitForSelector('#ff'); ok((await E.p.locator('.note[role=alert]').innerText()).includes('eskirgan'), 'eskirgan havola: tushunarli xabar'); await E.c.close();

  console.log('4. Faollashtirilmagan (o‘zi ochilgan) hisob kira olmaydi');
  await login(a, 'zz.pending@quiz.test', PW); await a.waitForSelector('text=Hisob faol emas', { timeout: 15000 }); ok((await a.locator('.authw').innerText()).includes('faollashtirilmagan'), '“faollashtirilmagan” xabari');
  const w = await a.evaluate(async () => { try { await SB.rest('app_state?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: SB.session().user.id, data: { x: 1 } } }); return 'ALLOWED'; } catch (e) { return 'denied'; } });
  ok(w === 'denied', 'RLS: faollashtirilmagan hisob bulutga yozolmaydi'); await shot(a, 'd4-pending');
  await a.click('button[data-a="logout"]'); await a.click('#sheet.on [data-a="sheetOk"]'); await a.waitForSelector('#af');

  console.log('5. Oddiy foydalanuvchi owner funksiyalarini ishlata olmaydi');
  await login(a, 'zz.user@quiz.test', 'Yangi-Parol-1'); await a.waitForSelector('text=Qanday ishlaydi', { timeout: 15000 });
  const x = await a.evaluate(async () => { const o = {}; try { await SB.fn('admin-users', { action: 'create', email: 'h@h.uz', password: '123456', days: 30 }); o.fn = 'ALLOWED'; } catch (e) { o.fn = e.status; } try { await SB.rpc('owner_grant', { p_user: SB.session().user.id, p_days: 30, p_lifetime: false, p_amount: 0 }); o.rpc = 'ALLOWED'; } catch (e) { o.rpc = 'denied'; } o.pay = (await SB.rest('payments?select=id')).length; return o; });
  ok(x.fn === 403, 'edge funksiya oddiy foydalanuvchiga 403 beradi'); ok(x.rpc === 'denied', 'owner_grant oddiy foydalanuvchiga yopiq'); ok(x.pay === 0, 'to‘lovlar jadvali oddiy foydalanuvchiga ko‘rinmaydi');
  await a.click('nav >> text=Sozlamalar'); await a.click('button[data-a="logout"]'); await a.click('#sheet.on [data-a="sheetOk"]'); await a.waitForSelector('#af');

  console.log('6. Owner: yangi foydalanuvchi ochib berish');
  await login(a, 'zz.owner@quiz.test', PW); await a.waitForSelector('text=Qanday ishlaydi', { timeout: 15000 });
  await a.click('nav >> text=Sozlamalar'); await a.click('[data-a="users"]'); await a.waitForSelector('[data-a="newUser"]'); await shot(a, 'd5-panel');
  await a.click('[data-a="newUser"]'); await a.waitForSelector('#sf'); await a.fill('#sf input[name=name]', 'Sinov Mijoz'); await a.fill('#sf input[name=email]', 'zz.mijoz@quiz.test');
  const gen = await a.inputValue('#sf input[name=password]'); ok(gen.length === 9, 'parol avtomatik yaratildi (9 belgi)');
  await a.click('#sf [data-a="gen"]'); const gen2 = await a.inputValue('#sf input[name=password]'); ok(gen2 !== gen && gen2.length === 9, '🎲 yangi parol yaratadi');
  await a.fill('#sf input[name=email]', 'xato'); await a.click('#sf button[type=submit]'); ok((await a.locator('#sferr').innerText()).includes('email'), 'forma ichida email xatosi ko‘rinadi (oyna yopilmaydi)');
  await a.fill('#sf input[name=email]', 'zz.mijoz@quiz.test'); await a.click('#sf [data-val="90"]'); await a.fill('#sf input[name=amount]', '150000'); await shot(a, 'd6-forma');
  await a.click('#sf button[type=submit]'); await a.waitForSelector('#credtxt', { timeout: 20000 });
  const cred = await a.locator('#credtxt').innerText(); ok(cred.includes('zz.mijoz@quiz.test') && cred.includes(gen2), 'login va parol ko‘rsatildi (mijozga yuborish uchun)'); await shot(a, 'd7-hisob-tayyor');
  await a.click('[data-a="copyCred"]'); ok(true, 'nusxalash tugmasi bosildi'); await a.click('#sheet [data-a="sheetOk"]');
  await a.waitForSelector('.card:has-text("zz.mijoz@quiz.test") >> text=Muddat:'); ok(true, 'ro‘yxatda: “Muddat: …” (90 kun)');
  await a.waitForFunction(() => document.querySelector('.kpis').innerText.includes('150 000'), null, { timeout: 8000 }); ok(true, 'to‘lov (150 000) daromadga qo‘shildi'); await shot(a, 'd8-panel2');

  console.log('7. Mijoz o‘z login-paroli bilan kiradi');
  const M = await mk(), m = M.p; await m.goto(url); await m.waitForSelector('#af'); await login(m, 'zz.mijoz@quiz.test', gen2); await m.waitForSelector('text=Qanday ishlaydi', { timeout: 20000 }); ok(true, 'mijoz kirdi (obuna faol)');
  await m.click('nav >> text=Sozlamalar'); ok(await m.locator('[data-a="users"]').count() === 0 && await m.locator('.acct .chip:has-text("Owner")').count() === 0, 'mijozda owner paneli yo‘q');

  console.log('8. Owner: obuna uzaytirish va parolni almashtirish');
  await a.click('.card:has-text("zz.mijoz@quiz.test") >> text=Obuna'); await a.waitForSelector('#sf'); await a.fill('#sf input[name=amount]', '50000'); await a.click('#sf button[type=submit]');
  await a.waitForFunction(() => document.querySelector('.kpis').innerText.includes('200 000'), null, { timeout: 15000 }); ok(true, 'obuna uzaytirildi, daromad 200 000');
  await a.click('.card:has-text("zz.mijoz@quiz.test") >> text=Parol'); await a.waitForSelector('#sf'); const np = await a.inputValue('#sf input[name=password]'); await a.click('#sf button[type=submit]'); await a.waitForSelector('#credtxt', { timeout: 15000 }); await a.click('#sheet [data-a="sheetOk"]');
  ok(!(await tokenOf('zz.mijoz@quiz.test', gen2)).access_token, 'eski parol endi ishlamaydi'); ok(!!(await tokenOf('zz.mijoz@quiz.test', np)).access_token, 'yangi parol ishlaydi');
  console.log('9. Bloklash → mijoz yopiladi; o‘chirish');
  await a.click('.card:has-text("zz.mijoz@quiz.test") >> text=Bloklash'); await a.waitForSelector('.card:has-text("zz.mijoz@quiz.test") >> text=Bloklangan'); ok(true, 'owner mijozni blokladi');
  await m.click('nav >> text=Sozlamalar'); await m.click('[data-a="syncNow"]'); await m.waitForSelector('text=Hisob faol emas', { timeout: 20000 }); ok(true, 'bloklangan mijoz ilovada yopildi (onlayn tekshiruvdan keyin)'); await shot(m, 'd9-bloklandi'); await M.c.close();
  await a.click('.card:has-text("zz.mijoz@quiz.test") >> [data-a="uDel"]'); await a.click('#sheet.on [data-a="sheetOk"]'); await a.waitForFunction(() => !document.body.innerText.includes('zz.mijoz@quiz.test'), null, { timeout: 15000 }); ok(true, 'owner hisobni o‘chirdi (to‘lov yozuvi qoladi)');
  ok(!errs.length, 'konsol xatosi yo‘q' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await br.close(); srv.close(); console.log(fails ? `\n${fails} ta xato` : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('❌ Sinov yiqildi:', e.message); process.exit(1); });
