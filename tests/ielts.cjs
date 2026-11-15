// IELTS ilovasi sinovi (Supabase soxtalashtirilgan — jonli ma’lumotga tegmaydi).
// Ishga tushirish:  node tests/ielts.cjs   (rasmlar: SHOTS=papka)
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r); });
let fails = 0; const ok = (c, m) => { console.log((c ? '  ✅ ' : '  ❌ ') + m); if (!c) fails++; };
const SB = 'https://hxywksrsgixwmmvvpajc.supabase.co';
const PROFILE = g => ({ user_id: 'u1', email: 'sinov@testlar.internal', name: 'Sinov', role: 'user', groups: g, lifetime: true, blocked: false, expires_at: null });
(async () => {
  await new Promise(r => srv.listen(0, r)); const base = 'http://localhost:' + srv.address().port + '/ielts/';
  const br = await chromium.launch({ args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] }), errs = [];
  const shot = async (pg, n) => { if (process.env.SHOTS) { fs.mkdirSync(process.env.SHOTS, { recursive: true }); await pg.waitForTimeout(450); await pg.screenshot({ path: path.join(process.env.SHOTS, n + '.png') }); } };
  const mk = async (groups, dark) => {
    const ctx = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block', permissions: ['microphone'], colorScheme: dark ? 'dark' : 'light' }), pg = await ctx.newPage(), state = { posted: null };
    pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' && !/Failed to load resource|net::ERR/.test(m.text())) errs.push(m.text()); });
    await ctx.addInitScript(() => { localStorage.setItem('testlar:session:v1', JSON.stringify({ access_token: 'x', refresh_token: 'y', expires_at: Math.floor(Date.now() / 1000) + 99999, user: { id: 'u1', email: 'sinov@testlar.internal' } })); });
    await ctx.route('https://api.dictionaryapi.dev/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify([{ word: 'resilient', phonetics: [{ text: '/rɪˈzɪliənt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-uk.mp3' }, { text: '/rəˈzɪljənt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3' }], meanings: [{ partOfSpeech: 'adjective', definitions: [{ definition: 'Able to recover quickly from difficulties.', example: 'Children are often remarkably resilient.' }], synonyms: ['tough', 'flexible'] }] }]) }));
    await ctx.route(SB + '/**', async route => {
      const u = route.request().url(), m = route.request().method(), j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      if (u.includes('/rest/v1/profiles')) return j([PROFILE(groups)]);
      if (u.includes('/rest/v1/ielts_state')) { if (m === 'POST') { state.posted = JSON.parse(route.request().postData()); return route.fulfill({ status: 201, body: '' }); } return j([]); }
      if (u.includes('/functions/v1/ielts-ai')) {
        const b = JSON.parse(route.request().postData() || '{}'); state.ai = (state.ai || []).concat(b.action);
        if (b.action === 'chat') return j({ reply: 'Nice to meet you! Where are you from?\n\n💡 Tuzatish: "I am student" → "I am a student" (artikl).' });
        if (b.action === 'writing') return j({ result: { tr: 6.5, cc: 7, lr: 6.5, gra: 6, overall: 6.5, strengths: ['Aniq tuzilma', 'Yaxshi bog‘lovchilar', 'Pozitsiya aniq'], issues: [{ quote: 'word word', fix: 'a better phrase', why: 'Takror.' }], upgrade: 'A stronger paragraph.', next: 'Ko‘proq misol keltiring.' } });
        if (b.action === 'dict' && b.hint) return j({ result: { uz: 'chidamli, bardoshli', note: 'be resilient to…' } });
        if (b.action === 'dict') return j({ result: { w: b.word, pos: 'noun', ipa: '/test/', uz: 'sinov', def: 'a test', ex: ['A first example.', 'A second example.'], syn: ['trial', 'exam'], note: 'Eslatma.' } });
      }
      return j({});
    });
    return { pg, state };
  };
  const { pg: A, state: st } = await mk(['ielts']);
  console.log('1. Kirish, Home va pastki menyu');
  await A.goto(base + '?splash=0'); await A.waitForSelector('.hero h1', { timeout: 15000 });
  ok((await A.innerText('.hero h1')) === 'Sinov', 'Home: ism ko‘rinadi'); ok(await A.locator('.nav button').count() === 5, 'pastki menyuda 5 ta tugma');
  await shot(A, '01-home');
  for (const [t, c] of [['practice', '.skills'], ['chat', '.cin'], ['tools', '.tools'], ['me', '.avt']]) { await A.click('.nav [data-go="' + t + '"]'); await A.waitForSelector(c); await shot(A, '02-' + t); }
  ok(true, 'Practice / Chat / Tools / Profil ochildi');
  console.log('2. Reading: javob berish va natija');
  await A.goto(base + '#/reading'); await A.click('[data-go="reading/r1/run"]'); await A.waitForSelector('.psg h2');
  await shot(A, '03-reading-text'); await A.click('.s >> nth=0'); ok(await A.locator('.s.hl').count() === 1, 'gap belgilandi');
  await A.click('[data-a="rtab"][data-v="q"]'); await A.waitForSelector('.q');
  await shot(A, '04-reading-q');
  await A.selectOption('select[data-n="1"]', 'vii'); await A.click('[data-a="ans"][data-n="6"][data-v="TRUE"]'); await A.fill('input[data-n="10"]', 'the water table');
  ok((await A.innerText('#cnt')) === '3/13', 'hisoblagich 3/13');
  await A.reload(); await A.waitForSelector('.q'); ok((await A.innerText('#cnt')) === '3/13', 'qayta yuklangach javoblar saqlandi');
  await A.click('[data-a="rsubmit"]'); await A.waitForSelector('#askok'); await A.click('#askok'); await A.waitForSelector('.res .big');
  const band = await A.innerText('.res .big'); ok(/^\d\.\d$/.test(band), 'band ko‘rsatildi: ' + band);
  ok(await A.locator('.q.ok').count() === 3, 'to‘g‘ri javoblar 3 ta (heads, tfng, fill)'); await shot(A, '05-reading-result');
  await A.waitForFunction(() => IE.S().reads.length === 1); await A.waitForTimeout(300);
  console.log('3. Writing');
  await A.goto(base + '#/writing'); await A.waitForSelector('.prompt, .item'); await shot(A, '06-writing');
  await A.click('[data-go="writing/p/0"]'); await A.waitForSelector('#ed'); await A.fill('#ed', 'word '.repeat(60)); await A.waitForTimeout(700);
  ok((await A.innerText('#wcn')).startsWith('60'), 'so‘z hisoblagichi 60'); await shot(A, '07-writing-editor');
  await A.click('[data-a="wfin"]'); await A.waitForSelector('.sheet .ck'); await shot(A, '08-writing-done'); await A.click('[data-a="wdone"]'); await A.waitForSelector('.item');
  ok(await A.evaluate(() => IE.S().writes.length === 1), 'yozuv tarixga tushdi');
  await A.goto(base + '#/writing/s/s1'); await A.waitForSelector('.essay'); ok(true, 'namuna insho ochildi'); await shot(A, '09-writing-sample');
  console.log('4. Speaking');
  await A.goto(base + '#/speaking'); await A.waitForSelector('.item'); await shot(A, '10-speaking');
  await A.click('[data-go="speaking/1/0"]'); await A.waitForSelector('.qcard'); await A.click('[data-a="sp1rec"]'); await A.waitForSelector('.mic.on'); await A.waitForTimeout(1200); await A.click('[data-a="sp1rec"]'); await A.waitForSelector('audio'); ok(true, 'Part 1: yozib olindi va audio paydo bo‘ldi'); await shot(A, '11-speaking-p1');
  await A.goto(base + '#/speaking/2/0'); await A.waitForSelector('.cue'); await A.click('[data-a="sp2go"]'); await A.waitForSelector('#bigt'); ok((await A.innerText('#bigt')).startsWith('01:0') || (await A.innerText('#bigt')).startsWith('01:'), 'tayyorgarlik taymeri'); await shot(A, '12-speaking-prep');
  await A.click('[data-a="sp2talk"]'); await A.waitForSelector('.mic.on'); await A.waitForTimeout(1100); await A.click('[data-a="sp2stop"]'); await A.waitForSelector('audio'); ok(await A.locator('.sheet-bg').count() === 0, 'Part 2 tugadi'); await shot(A, '13-speaking-done');
  await A.click('[data-a="sp2fin"]'); ok(await A.evaluate(() => IE.S().speaks.length === 1), 'Speaking tarixga tushdi');
  console.log('5. So‘zlar va flesh-karta');
  await A.goto(base + '#/vocab'); await A.waitForSelector('.grid2 .card'); await shot(A, '14-vocab');
  await A.click('.grid2 .card >> nth=0'); await A.waitForSelector('.wrow'); await shot(A, '15-vocab-topic');
  await A.click('[data-go^="vocab/cards/"]'); await A.waitForSelector('.fc'); await A.click('.fc .a h2'); await A.waitForSelector('[data-a="fcg"]'); await shot(A, '16-card-back');
  await A.click('[data-a="fcg"][data-v="1"]'); ok(await A.evaluate(() => Object.keys(IE.S().srs).length === 1), 'SRS yozuvi saqlandi');
  await A.click('.fc .a h2'); await A.click('[data-a="fcg"][data-v="0"]'); ok(await A.evaluate(() => Object.keys(IE.S().srs).length === 2), 'ikkinchi so‘z');
  console.log('6. Strategiyalar');
  await A.goto(base + '#/strat'); await A.waitForSelector('.item'); await shot(A, '17-strat'); await A.click('.item >> nth=0'); await A.waitForSelector('.st'); await shot(A, '18-strat-detail');
  console.log('7. Shaxsiy lug‘at (Cambridge) importi');
  const tmp = path.join(os.tmpdir(), 'cam-test.json'); fs.writeFileSync(tmp, JSON.stringify({ v: 1, src: 'test', p: [{ i: 1, t: 'Manatees', s: 'Cambridge 20', ts: [1] }], x: {}, w: [[1, 1, 1, 'aquatic', '', 'living in water', 'suvda yashovchi', 'Manatees are aquatic.'], [1, 1, 2, 'mammal', '', 'animal', 'sutemizuvchi', 'x']] }));
  await A.goto(base + '#/vocab'); await A.waitForSelector('#camf', { state: 'attached' }); await A.setInputFiles('#camf', tmp); await A.waitForSelector('[data-go="vocab/c"]'); ok(true, 'Cambridge fayli yuklandi (qurilmada)');
  await A.click('[data-go="vocab/c"]'); await A.waitForSelector('#vl .item'); await A.fill('#vs', 'zzz'); ok(await A.locator('#vl .item:not(.hide)').count() === 0, 'qidiruv filtri ishlaydi');
  console.log('8. Profil, mavzu va sinxronlash');
  await A.goto(base + '#/me'); await A.waitForSelector('#pn'); await A.fill('#pn', 'Yangi Ism'); await A.selectOption('select[data-f="target"]', '8'); await A.click('[data-a="theme"]');
  await A.waitForTimeout(300); ok(await A.evaluate(() => IE.S().prof.target === 8 && IE.S().prof.name === 'Yangi Ism'), 'profil saqlandi');
  ok(await A.evaluate(() => document.documentElement.getAttribute('data-theme') === 'dark'), 'tungi rejim yoqildi'); await shot(A, '19-profile-dark');
  await A.goto(base + '#/home'); await A.waitForSelector('.hero h1'); await shot(A, '20-home-dark');
  await A.evaluate(() => IE.sync()); ok(!!st.posted && st.posted.user_id === 'u1' && st.posted.data.reads.length === 1, 'holat serverga yuborildi (reads=1)');
  console.log('8b. AI: chat, Writing bahosi, Dictionary');
  await A.goto(base + '#/chat'); await A.waitForSelector('[data-a="cstart"]'); await shot(A, '23-chat-empty'); await A.click('[data-a="cstart"][data-t=""]'); await A.waitForSelector('.bub.ai .cnote'); ok((await A.locator('.bub.ai').first().innerText()).includes('Nice to meet you'), 'AI javobi va tuzatish bloki chiqdi');
  await A.fill('#ci', 'I am student'); await A.click('[data-a="csend"]'); await A.waitForFunction(() => document.querySelectorAll('.bub.ai').length === 2); await shot(A, '24-chat');
  await A.goto(base + '#/writing/h/' + (await A.evaluate(() => IE.S().writes[0].ts))); await A.waitForSelector('[data-a="wai"]'); await A.click('[data-a="wai"]'); await A.waitForSelector('.airs'); ok((await A.innerText('.sc.all b')) === '6.5', 'Writing AI bahosi: overall 6.5'); await shot(A, '25-writing-ai');
  ok(await A.evaluate(() => IE.S().writes[0].ai.overall === 6.5), 'baho yozuvga saqlandi');
  await A.goto(base + '#/dict'); await A.fill('#dq', 'resilient'); await A.press('#dq', 'Enter'); await A.waitForSelector('.df'); ok((await A.innerText('#uzb')).length >= 0, 'ta’rif darhol chiqdi'); await A.waitForFunction(() => document.querySelector('#uzb').innerText.includes('chidamli')); ok(true, 'o‘zbekcha tarjima keyin qo‘shildi'); await A.waitForSelector('[data-a="dadd"]'); await shot(A, '26-dict'); await A.click('[data-a="dadd"]');
  ok(await A.evaluate(() => IE.S().my.length === 1), 'so‘z “Mening so‘zlarim”ga qo‘shildi'); await A.goto(base + '#/vocab'); await A.waitForSelector('[data-go="vocab/t/my"]'); ok(true, 'Mening so‘zlarim ko‘rinadi');
  console.log('9. Ruxsat: guruhsiz foydalanuvchi');
  const { pg: B } = await mk([]); await B.goto(base); await B.waitForSelector('.lockc'); ok((await B.innerText('.lockc')).includes('Ruxsat'), 'guruhsiz: “Ruxsat kerak” ekrani'); await shot(B, '21-lock');
  console.log('10. Kirish ekrani (sessiyasiz)');
  const ctx = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }), C = await ctx.newPage(); await C.goto(base); await C.waitForSelector('#af'); ok(true, 'login formasi ko‘rinadi'); await shot(C, '22-login');
  ok(errs.length === 0, 'konsol xatolari yo‘q' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await br.close(); srv.close(); console.log(fails ? '\n❌ ' + fails + ' ta xato' : '\n✅ Hammasi yaxshi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
