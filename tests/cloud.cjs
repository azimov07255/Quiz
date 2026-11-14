// Jonli Supabase sinovi (login, sinxron, bloklash, owner paneli, RLS). Avval tests/cloud-users.sql dagi sinov hisoblarini yarating, so‘ng:  node tests/cloud.cjs
// Sinovdan keyin hisoblarni o‘chiring (aks holda ular owner bo‘lib qolib, haqiqiy owner avtomatik tayinlanmaydi).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
const PW = 'Sinov-12345';
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch();
  const mk = async () => { const c = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }); const p = await c.newPage(); p.errs = []; p.on('pageerror', e => p.errs.push(e.message)); p.on('console', m => m.type() === 'error' && !m.text().includes('Failed to load resource') && p.errs.push(m.text())); return { c, p }; };
  const login = async (p, email, pw) => { await p.fill('input[name=email]', email); await p.fill('input[name=password]', pw); await p.click('button[type=submit]'); };
  const SHOTS = process.env.SHOTS; const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.waitForTimeout(600); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };

  console.log('1. Kirish ekrani, xato parol, validatsiya');
  const A = await mk(); const a = A.p; await a.goto(url); await a.waitForSelector('#af');
  ok(await a.locator('text=Ro‘yxatdan o‘tish').count() > 0, 'kirish ekrani chiqdi (login talab qilinadi)'); await shot(a, 'c1-kirish');
  await login(a, 'zz.user@quiz.test', 'notogri-parol'); await a.waitForSelector('.note[role=alert]');
  ok((await a.locator('.note[role=alert]').innerText()).includes('noto‘g‘ri'), 'xato parol: “Email yoki parol noto‘g‘ri”');
  await a.click('[data-a="authMode"][data-m="up"]'); await a.fill('input[name=email]', 'x@y.uz'); await a.fill('input[name=password]', '123'); await a.click('button[type=submit]');
  ok((await a.locator('.note[role=alert]').innerText()).includes('6 ta'), 'qisqa parol rad etildi (6 ta belgi)'); await shot(a, 'c2-royxat');
  await a.click('[data-a="authMode"][data-m="in"]');

  console.log('2. To‘g‘ri login → bo‘sh bank → namuna yuklash → bulutga sinxron');
  await login(a, 'zz.user@quiz.test', PW); await a.waitForSelector('text=Qanday ishlaydi');
  ok(true, 'kirdi, ilova ochildi (bank hali yo‘q)');
  await a.click('text=Namuna bankni yuklash'); await a.waitForSelector('[data-a="subj"]');
  await a.click('[data-a="subj"]:has-text("Tilshunoslikka kirish")'); await a.click('button.chip[data-n="10"]');
  await a.click('[data-a="start"][data-kind="t"]:has-text("Fonetika")'); await a.waitForSelector('.q');
  for (let i = 0; i < 10; i++) { await a.locator('.opt').first().click(); await a.click(i < 9 ? '.qbar >> text=Keyingisi' : '.qbar >> text=Yakunlash'); }
  await a.waitForSelector('.res'); await a.click('text=Orqaga'); await a.click('nav >> text=Sozlamalar');
  await a.waitForSelector('text=Bulutga saqlandi', { timeout: 20000 }); ok(true, 'sinxron: “Bulutga saqlandi”'); await shot(a, 'c3-hisob');
  ok(await a.locator('.acct:has-text("Sinov User")').count() === 1, 'hisob kartasi: ism va email');

  console.log('3. Ikkinchi “telefon”: o‘sha login → bank va natijalar o‘zi tushadi');
  const B = await mk(); const b = B.p; await b.goto(url); await b.waitForSelector('#af'); await login(b, 'zz.user@quiz.test', PW);
  await b.waitForSelector('[data-a="subj"]', { timeout: 25000 }); ok(await b.locator('text=239').count() > 0 || await b.locator('[data-a="subj"]').count() >= 2, 'savol banki ikkinchi qurilmada paydo bo‘ldi');
  await b.click('nav >> text=Statistika'); await b.waitForSelector('.stbar', { timeout: 15000 }); ok(await b.locator('.stbar:has-text("Fonetika")').count() === 1, 'natijalar (Fonetika) ikkinchi qurilmada ham bor');
  const rls = await b.evaluate(async () => { const out = {}; out.profiles = (await SB.rest('profiles?select=email')).length; try { await SB.rpc('owner_set_user', { p_user: SB.session().user.id, p_blocked: true, p_lifetime: false, p_expires: null }); out.rpc = 'ALLOWED'; } catch (e) { out.rpc = 'denied'; } try { await SB.rest('profiles?user_id=eq.' + SB.session().user.id, { method: 'PATCH', body: { role: 'owner' } }); out.patch = 'ALLOWED'; } catch (e) { out.patch = 'denied'; } const p = (await SB.rest('profiles?select=role'))[0]; out.role = p.role; return out; });
  ok(rls.profiles === 1, 'RLS: oddiy foydalanuvchi faqat o‘z profilini ko‘radi'); ok(rls.rpc === 'denied', 'RLS: oddiy foydalanuvchi owner funksiyasini chaqira olmaydi'); ok(rls.patch === 'denied' && rls.role === 'user', 'RLS: o‘zini owner qila olmaydi');
  await B.c.close();

  console.log('4. Chiqish → mahalliy ma’lumot tozalanadi');
  await a.click('nav >> text=Sozlamalar'); await a.click('button[data-a="logout"]'); await a.click('#sheet.on [data-a="sheetOk"]'); await a.waitForSelector('#af', { timeout: 20000 });
  const left = await a.evaluate(async () => ({ ls: Object.keys(localStorage).filter(k => k.startsWith('testlar:') && k !== 'testlar:state:v1').length, st: JSON.parse(localStorage.getItem('testlar:state:v1')).h.length, db: await new Promise(r => { const q = indexedDB.open('testlar-app', 1); q.onsuccess = () => { const g = q.result.transaction('d').objectStore('d').get('bank'); g.onsuccess = () => r(!!g.result); } }) }));
  ok(left.ls === 0 && left.st === 0 && left.db === false, 'chiqqach sessiya, tarix va bank qurilmadan o‘chdi');

  console.log('5. Bloklangan hisob → “Hisob faol emas”, ma’lumot yozolmaydi');
  await login(a, 'zz.blocked@quiz.test', PW); await a.waitForSelector('text=Hisob faol emas', { timeout: 15000 }); ok(true, 'bloklangan hisob ilovaga kira olmadi'); await shot(a, 'c4-blok');
  const w = await a.evaluate(async () => { try { await SB.rest('app_state?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: SB.session().user.id, data: { x: 1 } } }); return 'ALLOWED'; } catch (e) { return 'denied'; } });
  ok(w === 'denied', 'RLS: bloklangan hisob bulutga yozolmaydi');
  await a.click('button[data-a="logout"]'); await a.click('#sheet.on [data-a="sheetOk"]'); await a.waitForSelector('#af');

  console.log('6. Owner paneli');
  await login(a, 'zz.owner@quiz.test', PW); await a.waitForSelector('text=Qanday ishlaydi', { timeout: 15000 });
  await a.click('nav >> text=Sozlamalar'); ok(await a.locator('.acct .chip:has-text("Owner")').count() === 1, 'Owner belgisi ko‘rindi');
  await a.click('[data-a="users"]'); await a.waitForSelector('.card:has-text("zz.user@quiz.test")', { timeout: 15000 }); ok(await a.locator('.card:has-text("@quiz.test")').count() === 3, 'owner barcha 3 foydalanuvchini ko‘radi'); await shot(a, 'c5-owner');
  await a.click('.card:has-text("zz.user@quiz.test") >> text=Bloklash'); await a.waitForSelector('.card:has-text("zz.user@quiz.test") >> text=Bloklangan'); ok(true, 'owner foydalanuvchini blokladi');
  await a.click('.card:has-text("zz.user@quiz.test") >> text=Ochish'); await a.waitForSelector('.card:has-text("zz.user@quiz.test") >> text=Cheksiz'); ok(true, 'owner blokni ochdi');
  await a.click('.card:has-text("zz.user@quiz.test") >> text=+30 kun'); await a.waitForSelector('.card:has-text("zz.user@quiz.test") >> text=Muddat:'); ok(true, '+30 kun muddat berildi');
  await a.click('.card:has-text("zz.user@quiz.test") >> text=Umrbod'); await a.waitForSelector('.card:has-text("zz.user@quiz.test") >> text=Umrbodni olish'); ok(true, 'umrbod belgilandi');

  console.log('7. Parolni o‘zgartirish (owner, keyin qaytarish)');
  await a.click('nav >> text=Sozlamalar'); await a.click('[data-a="pw"]'); await a.fill('input[name=pw]', 'Yangi-Parol-777'); await a.click('#pf button[type=submit]'); await a.waitForSelector('text=Parol o‘zgartirildi'); ok(true, 'parol o‘zgartirildi');
  await a.click('button[data-a="logout"]'); await a.click('#sheet.on [data-a="sheetOk"]'); await a.waitForSelector('#af'); await login(a, 'zz.owner@quiz.test', 'Yangi-Parol-777'); await a.waitForSelector('text=Qanday ishlaydi', { timeout: 15000 }); ok(true, 'yangi parol bilan kirildi');
  ok(![...A.p.errs].length, 'konsol xatosi yo‘q' + (A.p.errs.length ? ': ' + A.p.errs.join(' | ') : ''));
  await br.close(); srv.close(); console.log(fails ? `\n${fails} ta xato` : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('❌ Sinov yiqildi:', e.message); process.exit(1); });
