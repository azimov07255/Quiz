// Jonli sinov: umumiy katalog (owner yuklaydi → obunachida o‘zi paydo bo‘ladi). tests/cloud-users.sql hisoblari kerak.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
const PW = process.env.TEST_PW; if (!PW) { console.error('TEST_PW muhit o‘zgaruvchisi kerak (sinov hisoblari paroli)'); process.exit(1); };
const book = (tid, name, n) => ({ id: tid, name, src: name, q: Array.from({ length: n }, (_, i) => ({ id: `${tid}.${i + 1}`, q: `${name}: ${i + 1}-savol?`, o: ['A javob', 'B javob', 'C javob', 'D javob'], a: i % 4, e: 'Izoh', r: `${i + 1}-bet` })) });
const file = (subs) => ({ name: 'bank.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ v: 1, subjects: subs })) });
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const br = await chromium.launch(); const errs = [];
  const mk = async () => { const c = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }); const p = await c.newPage(); p.on('pageerror', e => errs.push(e.message)); p.on('console', m => m.type() === 'error' && !m.text().includes('Failed to load resource') && errs.push(m.text())); return { c, p }; };
  const login = async (p, email) => { await p.fill('input[name=email]', email); await p.fill('input[name=password]', PW); await p.click('button[type=submit]'); };
  const SHOTS = process.env.SHOTS; const shot = async (p, n) => { if (SHOTS) { fs.mkdirSync(SHOTS, { recursive: true }); await p.waitForTimeout(700); await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } };
  const O = await mk(), o = O.p; await o.goto(url); await o.waitForSelector('#af'); await login(o, 'zz.owner@quiz.test'); await o.waitForSelector('text=Qanday ishlaydi', { timeout: 20000 });
  await o.click('nav >> text=Sozlamalar'); await o.click('[data-a="cat"]'); await o.waitForSelector('[data-a="catPick"]');

  console.log('1. Owner kitoblarni birma-bir qo‘shadi (bir fan, ikki kitob)');
  await o.setInputFiles('#fcat', file([{ id: 'tarix', name: 'Tarix', topics: [book('tx1', '1-kitob: Qadimgi davr', 5)] }])); await o.waitForSelector('#sf'); await o.fill('#sf input[name=category]', 'Madrasa'); await o.click('#sf button[type=submit]');
  await o.waitForSelector('.card:has-text("Tarix") >> text=1 mavzu', { timeout: 20000 }); ok(true, '1-kitob yuklandi (1 mavzu)');
  await o.setInputFiles('#fcat', file([{ id: 'tarix', name: 'Tarix', topics: [book('tx2', '2-kitob: O‘rta asrlar', 5)] }])); await o.waitForSelector('#sf'); await o.click('#sf button[type=submit]');
  await o.waitForSelector('.card:has-text("Tarix") >> text=2 mavzu', { timeout: 20000 }); ok(await o.locator('.card:has-text("Tarix") >> text=10 savol').count() === 1, '2-kitob shu fanga qo‘shildi (2 mavzu, 10 savol)'); await shot(o, 'k1-owner-katalog');
  await o.setInputFiles('#fcat', file([{ id: 'xato', name: 'Xato', topics: [{ id: 'x', name: 'x', q: [{ id: 'q', q: 'a', o: ['1', '2'], a: 0 }] }] }])); await o.waitForSelector('.note'); ok((await o.locator('.note').innerText()).includes('format xato'), 'buzuq fayl katalogga o‘tmadi');

  console.log('2. Obunachi kirsa, katalog o‘zi tushadi');
  const U = await mk(), u = U.p; await u.goto(url); await u.waitForSelector('#af'); await login(u, 'zz.user@quiz.test');
  await u.waitForSelector('[data-a="subj"]:has-text("Tarix")', { timeout: 30000 }); ok((await u.locator('.sec h2').first().innerText()) === 'Madrasa', 'kategoriya sarlavhasi: “Madrasa”'); await shot(u, 'k2-obunachi');
  ok(await u.locator('[data-a="subj"]:has-text("Tarix") >> text=2 mavzu').count() === 1, 'obunachida 2 mavzu, 10 savol');
  await u.click('[data-a="subj"]:has-text("Tarix")'); await u.click('button.chip[data-n="10"]'); await u.click('[data-a="start"][data-kind="s"]'); await u.waitForSelector('.q');
  for (let i = 0; i < 10; i++) { await u.locator('.opt').first().click(); await u.click(i < 9 ? '.qbar >> text=Keyingisi' : '.qbar >> text=Yakunlash'); }
  await u.waitForSelector('.res'); ok(true, 'katalog fanidan test yechildi'); await u.click('text=Orqaga');
  await u.click('nav >> text=Sozlamalar'); ok(await u.locator('.row:has-text("Tarix") >> text=Katalog').count() === 1 && await u.locator('[data-a="delSubj"]').count() === 0, 'obunachi katalog fanini o‘chira olmaydi (“Katalog” belgisi)');
  const rls = await u.evaluate(async () => { const o = {}; try { await SB.rest('catalog_subjects', { method: 'POST', body: { subject_id: 'hack', name: 'x', data: {} } }); o.write = 'ALLOWED'; } catch (e) { o.write = 'denied'; } try { await SB.rest('catalog_subjects?subject_id=eq.tarix', { method: 'DELETE' }); } catch (e) { /* */ } o.rows = (await SB.rest('catalog_subjects?select=subject_id')).length; return o; });
  ok(rls.write === 'denied' && rls.rows === 1, 'RLS: obunachi katalogga yozolmaydi va o‘chira olmaydi');

  console.log('3. Qoralama yashiriladi, qayta chop etilsa paydo bo‘ladi');
  await o.click('.card:has-text("Tarix") >> text=Tahrirlash'); await o.waitForSelector('#sf'); await o.click('#sf [data-val="0"]'); await o.click('#sf button[type=submit]'); await o.waitForSelector('.card:has-text("Tarix") >> text=Qoralama');
  await u.click('[data-a="syncNow"]'); await u.click('nav >> text=Fanlar'); await u.waitForFunction(() => !document.querySelector('[data-a="subj"]'), null, { timeout: 20000 }).catch(() => {}); ok(await u.locator('[data-a="subj"]:has-text("Tarix")').count() === 0, 'qoralama obunachidan yashirildi');
  await o.click('.card:has-text("Tarix") >> text=Tahrirlash'); await o.waitForSelector('#sf'); await o.click('#sf [data-val="1"]'); await o.click('#sf button[type=submit]'); await o.waitForFunction(() => !document.body.innerText.includes('Qoralama'));
  await u.click('nav >> text=Sozlamalar'); await u.click('[data-a="syncNow"]'); await u.click('nav >> text=Fanlar'); await u.waitForSelector('[data-a="subj"]:has-text("Tarix")', { timeout: 20000 }); ok(true, 'qayta chop etildi — paydo bo‘ldi');

  console.log('4. Bitta kitobni (mavzuni) o‘chirish');
  await o.click('.card:has-text("Tarix") >> text=Mavzular (kitoblar)'); await o.click('[data-a="catTopicDel"][data-tid="tx2"]'); await o.click('#sheet.on [data-a="sheetOk"]'); await o.waitForSelector('.card:has-text("Tarix") >> text=1 mavzu', { timeout: 15000 });
  await u.click('nav >> text=Sozlamalar'); await u.click('[data-a="syncNow"]'); await u.click('nav >> text=Fanlar'); await u.waitForSelector('[data-a="subj"]:has-text("Tarix") >> text=1 mavzu', { timeout: 20000 }); ok(true, '2-kitob o‘chirildi — obunachida 1 mavzu qoldi');
  await u.click('nav >> text=Statistika'); ok(await u.locator('.stbar').count() >= 1, 'natijalar (progress) saqlanib qoldi');

  console.log('5. Internetsiz (bulut so‘rovlari bloklangan) katalog keshdan ochiladi');
  await U.c.route('**/*.supabase.co/**', r => r.abort()); await u.reload(); await u.waitForSelector('[data-a="subj"]:has-text("Tarix")', { timeout: 15000 }); ok(true, 'oflayn: katalog qurilmadagi keshdan ko‘rinadi'); await U.c.unroute('**/*.supabase.co/**');

  console.log('6. Obuna muddati tugasa — katalog yopiladi');
  const exp = await o.evaluate(async () => { const r = await SB.rest('profiles?select=user_id&email=eq.zz.user@quiz.test'); await SB.rpc('owner_set_user', { p_user: r[0].user_id, p_blocked: false, p_lifetime: false, p_expires: new Date(Date.now() - 864e5).toISOString() }); return 'ok'; });
  await u.reload(); await u.waitForSelector('text=Hisob faol emas', { timeout: 25000 }); ok(true, 'muddati tugagan obunachi yopildi');
  const gone = await u.evaluate(() => new Promise(r => { const q = indexedDB.open('testlar-app', 1); q.onsuccess = () => { const g = q.result.transaction('d').objectStore('d').get('catalog'); g.onsuccess = () => r(g.result === undefined); }; }));
  ok(gone, 'qurilmadagi katalog keshi o‘chirildi');

  console.log('7. Owner katalogni o‘chiradi');
  await o.click('.card:has-text("Tarix") >> text=O‘chirish'); await o.click('#sheet.on [data-a="sheetOk"]'); await o.waitForSelector('text=Katalog hali bo‘sh', { timeout: 15000 }); ok(true, 'fan kataloqdan o‘chirildi');
  ok(!errs.length, 'konsol xatosi yo‘q' + (errs.length ? ': ' + errs.join(' | ') : ''));
  await br.close(); srv.close(); console.log(fails ? `\n${fails} ta xato` : '\nHammasi o‘tdi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('❌ Sinov yiqildi:', e.message); process.exit(1); });
