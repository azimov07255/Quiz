// IELTS ilovasi sinovi (Supabase soxtalashtirilgan — jonli ma’lumotga tegmaydi).
// Ishga tushirish:  node tests/ielts.cjs   (rasmlar: SHOTS=papka)
const http = require('http'), fs = require('fs'), path = require('path'), os = require('os');
const { chromium, devices } = require('playwright');
const root = path.join(__dirname, '..');
const MIME = { '.mjs': 'text/javascript', '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.mp3': 'audio/mpeg' };
const srv = http.createServer((q, r) => {
  let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(root, p);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  const size = fs.statSync(f).size, type = MIME[path.extname(f)] || 'application/octet-stream', m = /bytes=(\d*)-(\d*)/.exec(q.headers.range || '');
  if (m) { const a = m[1] ? +m[1] : 0, b = m[2] ? Math.min(+m[2], size - 1) : size - 1; r.writeHead(206, { 'content-type': type, 'accept-ranges': 'bytes', 'content-range': 'bytes ' + a + '-' + b + '/' + size, 'content-length': b - a + 1 }); return fs.createReadStream(f, { start: a, end: b }).pipe(r); }
  r.writeHead(200, { 'content-type': type, 'accept-ranges': 'bytes', 'content-length': size }); fs.createReadStream(f).pipe(r);
});
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
    await ctx.route('https://cdn.example.com/**', route => route.fulfill({ status: 200, contentType: 'audio/mpeg', body: fs.readFileSync(path.join(root, 'ielts/audio/wright.mp3')) }));
    await ctx.route('https://api.dictionaryapi.dev/**', route => route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify([{ word: 'resilient', phonetics: [{ text: '/rɪˈzɪliənt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-uk.mp3' }, { text: '/rəˈzɪljənt/', audio: 'https://api.dictionaryapi.dev/media/pronunciations/en/resilient-us.mp3' }], meanings: [{ partOfSpeech: 'adjective', definitions: [{ definition: 'Able to recover quickly from difficulties.', example: 'Children are often remarkably resilient.' }], synonyms: ['tough', 'flexible'] }] }]) }));
    await ctx.route(SB + '/**', async route => {
      const u = route.request().url(), m = route.request().method(), j = b => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(b) });
      if (u.includes('/storage/v1/object/')) { state.cloud = state.cloud || {}; const k = u.split('ielts-books/')[1];
        if (m === 'POST') { state.cloud[k] = route.request().postDataBuffer(); return j({ Key: k }); }
        if (m === 'DELETE') { delete state.cloud[k]; return j({}); }
        return state.cloud[k] ? route.fulfill({ status: 200, contentType: 'application/pdf', body: state.cloud[k] }) : route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"not found"}' }); }
      if (u.includes('/rest/v1/profiles')) return j([PROFILE(groups)]);
      if (u.includes('/rest/v1/ielts_state')) { if (m === 'POST') { state.posted = JSON.parse(route.request().postData()); return route.fulfill({ status: 201, body: '' }); } return j([]); }
      if (u.includes('/functions/v1/ielts-ai')) {
        const b = JSON.parse(route.request().postData() || '{}'); state.ai = (state.ai || []).concat(b.action);
        if (b.action === 'chat') return j({ reply: 'Nice to meet you! Where are you from?\n\n💡 Tuzatish: "I am student" → "I am a student" (artikl).' });
        if (b.action === 'writing') return j({ result: { tr: 6.5, cc: 7, lr: 6.5, gra: 6, overall: 6.5, strengths: ['Aniq tuzilma', 'Yaxshi bog‘lovchilar', 'Pozitsiya aniq'], issues: [{ quote: 'word word', fix: 'a better phrase', why: 'Takror.' }], upgrade: 'A stronger paragraph.', next: 'Ko‘proq misol keltiring.' } });
        if (b.action === 'feed') return j({ title: '6 Minute English', image: 'https://cdn.example.com/c.jpg', items: [{ t: 'Is it ok to be late?', d: 'Mon, 01 Jan 2026', desc: 'x', link: 'https://e.com/1', au: 'https://cdn.example.com/p.mp3', dur: '06:12', img: '' }] });
        if (b.action === 'article') return j({ title: 'Test Article', text: 'Paragraph one is here and it has many words so that it is long enough to be a real paragraph for the parser. It has two sentences.\n\nParagraph two continues with more text, and again it needs to be fairly long to pass the filter. Here is a final sentence.\n\nParagraph three adds some more words to make the whole text exceed three hundred characters in total length for the test.', image: '', host: 'e.com' });
        if (b.action === 'transcript') return j({ dur: 20, cues: [{ s: 0.5, e: 4, t: 'Hello and welcome to the show.', w: [['Hello', 0.5, 0.9], ['and', 0.9, 1.1], ['welcome', 1.1, 1.6], ['to', 1.6, 1.8], ['the', 1.8, 1.9], ['show.', 1.9, 4]] }, { s: 4.2, e: 9, t: 'Today we talk about resilient people.', w: [] }, { s: 9.5, e: 15, t: 'They never give up when life is hard.', w: [] }] });
        if (b.action === 'analyze') return j({ result: { level: 'Band 6', vocab: [{ w: 'resilient', pos: 'adj', uz: 'chidamli', ex: 'resilient people' }], grammar: [{ t: 'Present Simple', r: 'Umumiy haqiqat.', ex: ['They never give up'] }], qs: [{ type: 'tf', q: 'The show is about resilient people.', a: 'TRUE', why: 'Matnda aytilgan.' }, { type: 'fl', q: 'They never ______ up.', a: ['give'], why: 'give up.' }] } });
        if (b.action === 'dict' && b.ctx) return j({ result: { w: 'automaker toyota', type: 'collocation', uz: 'avtomobil ishlab chiqaruvchi', def: 'a company that makes cars', ex: 'The automaker sells cars.', note: 'Eslatma' } });
        if (b.action === 'camimport') { state.cam = (state.cam || []).concat([b]); const P = 'Scientists have long studied how bees communicate with one another inside the hive and across great distances in open fields. '.repeat(3);
          if (b.kind === 'reading') return j({ result: { title: 'Bee Talk', topic: 'Biology', paras: [{ k: 'A', t: P }, { k: 'B', t: P + 'Second paragraph.' }, { k: 'C', t: P + 'Third paragraph.' }], groups: [
            { type: 'heads', title: 'Questions 1-2', note: 'Choose the correct heading.', headings: [{ id: 'i', t: 'Dance language' }, { id: 'ii', t: 'Hive design' }, { id: 'iii', t: 'Seasonal change' }], qs: [{ n: 1, para: 'B', a: 'i', why: 'x' }, { n: 2, para: 'C', a: 'iii', why: 'y' }] },
            { type: 'tfng', title: 'Questions 3-4', note: 'TRUE/FALSE/NOT GIVEN', qs: [{ n: 3, q: 'Bees dance.', a: 'YES' }, { n: 4, q: 'Bees sing.', a: 'NO' }] },
            { type: 'fill', title: 'Questions 5-6', note: 'ONE WORD', qs: [{ n: 5, q: 'Bees live in a ______', a: ['hive'] }, { n: 6, q: 'They make ______', a: ['honey', 'Honey'] }] },
            { type: 'mcq', title: 'Questions 7-8', note: 'Choose A, B or C', qs: [{ n: 7, q: 'Why dance?', o: ['Fun', 'Signal', 'Cold'], a: 'B' }, { n: 8, q: 'Where?', o: ['Hive', 'Sea', 'Moon'], a: 0 }] }] } });
          return j({ result: { title: 'Campus Tour', topic: 'Education', tr: [{ x: 'Welcome to the campus tour.' }, { x: 'The library opens at nine.' }], groups: [
            { type: 'fill', title: 'Questions 1-4', note: 'NO MORE THAN TWO WORDS', qs: [{ n: 1, q: 'Library opens at ______', a: ['nine', '9'], p: 1 }, { n: 2, q: 'Tour guide: ______', a: ['Sam'] }, { n: 3, q: 'Fee: ______', a: ['5'] }, { n: 4, q: 'Meet at ______', a: ['gate'] }] },
            { type: 'mcq', title: 'Questions 5-6', note: 'Choose A, B or C', qs: [{ n: 5, q: 'Where?', o: ['Hall', 'Lab', 'Cafe'], a: 1 }, { n: 6, q: 'When?', o: ['AM', 'PM', 'Noon'], a: 0 }] }] } }); }
        if (b.action === 'speaking') return j({ result: { fc: 6.5, lr: 6, gra: 6, pr: 6, overall: 6, strengths: ['Aniq javob', 'Ravon'], issues: [{ quote: 'I am student', fix: 'I am a student', why: 'Artikl.' }], better: 'A better answer is here.', next: 'Ko‘proq misol keltiring.' }, transcript: 'hello this is a test answer for the speaking part', words: 10, wpm: 90 });
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
  await A.fill('#ci', 'I am student'); ok(await A.evaluate(() => document.body.classList.contains('kb') && window.scrollY === 0 && getComputedStyle(document.querySelector('.nav')).display === 'none'), 'chat: klaviatura rejimida sahifa sakramaydi, menyu yashirinadi'); await A.click('[data-a="csend"]'); ok(await A.evaluate(() => document.activeElement && document.activeElement.id === 'ci' && document.getElementById('ci').value === ''), 'yuborilgach fokus saqlanadi (klaviatura yopilmaydi), maydon tozalandi'); await A.waitForFunction(() => document.querySelectorAll('.bub.ai').length === 2); await shot(A, '24-chat');
  await A.goto(base + '#/writing/h/' + (await A.evaluate(() => IE.S().writes[0].ts))); await A.waitForSelector('[data-a="wai"]'); await A.click('[data-a="wai"]'); await A.waitForSelector('.airs'); ok((await A.innerText('.sc.all b')) === '6.5', 'Writing AI bahosi: overall 6.5'); await shot(A, '25-writing-ai');
  ok(await A.evaluate(() => IE.S().writes[0].ai.overall === 6.5), 'baho yozuvga saqlandi');
  await A.goto(base + '#/dict'); await A.fill('#dq', 'resilient'); await A.press('#dq', 'Enter'); await A.waitForSelector('.df'); ok((await A.innerText('#uzb')).length >= 0, 'ta’rif darhol chiqdi'); await A.waitForFunction(() => document.querySelector('#uzb').innerText.includes('chidamli')); ok(true, 'o‘zbekcha tarjima keyin qo‘shildi'); await A.waitForSelector('[data-a="dadd"]'); await shot(A, '26-dict'); await A.click('[data-a="dadd"]');
  ok(await A.evaluate(() => IE.S().my.length === 1), 'so‘z “Mening so‘zlarim”ga qo‘shildi'); await A.goto(base + '#/vocab'); await A.waitForSelector('[data-go="vocab/t/my"]'); ok(true, 'Mening so‘zlarim ko‘rinadi');
  await A.goto(base + '#/tools'); await A.click('[data-go="strat"]'); await A.waitForSelector('.item'); const hl = await A.evaluate(() => history.length); await A.click('[data-a="back"]'); await A.waitForSelector('.tools'); ok(await A.evaluate(h => history.length <= h, hl), 'orqaga tugmasi tarixga yangi yozuv qo‘shmaydi');
  console.log('8c. Listening: haqiqiy audio');
  await A.goto(base + '#/listening'); await A.waitForSelector('.item'); ok(await A.locator('.item[data-go^="listening/"]').count() === 8, 'ro‘yxatda 8 ta audio'); await shot(A, '27-listening-list');
  await A.click('[data-go="listening/lincoln"]'); await A.waitForSelector('[data-a="lstart"]'); await shot(A, '28-listening-intro');
  await A.click('[data-a="lmode"][data-v="exam"]'); await A.click('[data-a="lstart"]'); await A.waitForSelector('#au', { state: 'attached' }); ok(await A.locator('.q').count() === 10, '10 ta savol'); ok(await A.locator('#lseek').count() === 0, 'imtihon rejimida surish (seek) yo‘q');
  await A.click('#lp'); await A.waitForFunction(() => { const a = document.getElementById('au'); return a && !a.paused && a.currentTime > 0.5; }, null, { timeout: 15000 }); ok(true, 'haqiqiy mp3 ijro etildi (currentTime ' + (await A.evaluate(() => document.getElementById('au').currentTime.toFixed(1))) + ' s)');
  await A.click('#lp'); ok(await A.evaluate(() => !document.getElementById('au').paused), 'imtihon rejimida to‘xtatib bo‘lmaydi'); await shot(A, '29-listening-run');
  await A.fill('input[data-n="1"]', 'five'); await A.fill('input[data-n="4"]', '30'); await A.fill('input[data-n="5"]', 'The Emancipation Proclamation'); await A.click('[data-a="ans"][data-n="8"][data-v="0"]'); await A.click('[data-a="ans"][data-n="10"][data-v="1"]');
  ok((await A.innerText('#cnt')) === '5/10', 'javoblar hisoblagichi 5/10');
  await A.click('[data-a="lsubmit"]'); await A.waitForSelector('#askok'); await A.click('#askok'); await A.waitForSelector('.res .big');
  ok(/^\d\.\d$/.test(await A.innerText('.res .big')), 'Listening bandi chiqdi'); ok(await A.locator('.q.ok').count() === 5, 'to‘g‘ri javoblar 5 ta'); ok(await A.locator('.lseekb').count() === 10, 'har savolda “tinglash” tugmasi'); await shot(A, '30-listening-result');
  await A.click('.tr summary'); await A.click('.trp >> nth=3'); await A.waitForFunction(() => { const a = document.getElementById('au'); return a && a.currentTime > 10; }, null, { timeout: 10000 }); ok(true, 'transkript abzatsi bosilganda audio shu joyga o‘tadi'); await shot(A, '31-listening-transcript');
  ok(await A.evaluate(() => IE.S().listens.length === 1), 'natija holatga yozildi');
  console.log('8d. Maqolalar va podkastlar');
  await A.goto(base + '#/articles'); await A.waitForSelector('.acard'); ok(await A.locator('.acard').count() === 8, 'markazda 8 ta maqola (rasm bilan)'); await shot(A, '32-articles');
  await A.click('[data-go="article/toyota"]'); await A.waitForSelector('.snt'); ok(await A.locator('.snt').count() > 25, 'matn gaplarga bo‘lingan'); ok(await A.evaluate(() => getComputedStyle(document.querySelector('.aimg.big')).backgroundImage.includes('toyota.jpg')), 'maqola rasmi ko‘rinadi'); await shot(A, '33-article-text');
  await A.click('#lp'); await A.waitForFunction(() => { const a = document.getElementById('au'); return a && !a.paused && a.currentTime > 1.5; }, null, { timeout: 15000 });
  await A.waitForSelector('.snt.on'); ok(true, 'ijro vaqtida joriy gap belgilanadi (audio bilan sinxron)'); await shot(A, '34-article-sync');
  const tt = +(await A.getAttribute('.sp >> nth=20', 'data-t')); await A.click('.sp >> nth=20'); await A.waitForTimeout(900);
  ok(await A.evaluate(x => Math.abs(document.getElementById('au').currentTime - x) < 3.5, tt), 'gap yonidagi ▶ audioni shu joyga o‘tkazadi (' + tt + ' s)');
  await A.click('.w.vw >> nth=0'); await A.waitForSelector('#wsh h2'); await A.waitForFunction(() => document.querySelector('#wsh').innerText.includes('mustaqil') || document.querySelector('#wsh').innerText.length > 30); ok(true, 'so‘z bosilganda varaq ochildi (maqola lug‘ati bilan)'); await shot(A, '35-article-word'); await A.click('[data-a="wadd"]'); await A.evaluate(() => IE.closeSheet());
  await A.click('[data-a="atab"][data-v="vocab"]'); ok(await A.locator('.vcard').count() === 10, 'lug‘at: 10 ta so‘z'); await shot(A, '36-article-vocab'); await A.click('[data-a="vall"]'); ok(await A.evaluate(() => IE.S().my.length >= 10), 'hamma so‘zlar “Mening so‘zlarim”ga qo‘shildi');
  await A.click('[data-a="atab"][data-v="grammar"]'); ok(await A.locator('.apanel[data-p="grammar"] .card').count() === 3, 'grammatika: 3 ta qoida'); await shot(A, '37-article-grammar');
  await A.click('[data-a="atab"][data-v="qs"]'); ok(await A.locator('.apanel[data-p="qs"] .q').count() === 8, 'savollar: 8 ta'); await A.click('.apanel[data-p="qs"] [data-a="ans"][data-n="1"][data-v="TRUE"]'); await A.click('[data-a="achk"]'); await A.waitForSelector('.apanel[data-p="qs"] .res'); ok(await A.evaluate(() => IE.S().arts.length === 1), 'maqola natijasi saqlandi'); await shot(A, '38-article-qs');
  ok(await A.evaluate(() => !document.getElementById('au').paused), 'tablarni almashtirganda audio to‘xtamaydi');
  console.log('8e. Podkast: ro‘yxat → transkript → tahlil');
  await A.goto(base + '#/articles/tab/p'); await A.waitForSelector('[data-a="nopen"]'); ok(await A.evaluate(() => IE.S().lib.filter(x => x.k === 'p').length === IE.D.podcasts.items.length && IE.D.podcasts.items.length >= 8), 'Tayyor podkastlar avtomatik qo‘shildi (' + await A.evaluate(() => IE.D.podcasts.items.length) + ' ta)'); await shot(A, '58-podcasts');
  await A.click('[data-a="atabs"][data-v="a"]'); await A.waitForSelector('.acard'); ok(await A.evaluate(() => location.hash === '#/articles/tab/a'), 'podkastdan kirib “Maqolalar” tabi ishlaydi'); await A.click('[data-a="atabs"][data-v="p"]'); await A.waitForSelector('[data-a="nopen"]');
  await A.click('[data-a="nopen"]'); await A.waitForSelector('[data-a="npre"]'); await A.click('[data-a="npre"]'); await A.waitForSelector('[data-a="nadd"]'); await shot(A, '39-podcast-feed'); const n0 = await A.evaluate(() => IE.S().lib.length); await A.click('[data-a="nadd"]'); await A.waitForFunction(n => IE.S().lib.length === n + 1, n0); ok(await A.evaluate(() => location.hash === '#/articles/tab/p' && !!document.querySelector('.item.fresh')), 'qo‘shilgach sahifada qoladi, yangi podkast ro‘yxat tepasida'); await A.click('[data-go^="article/"] >> nth=0');
  await A.waitForSelector('[data-a="atr"]'); await shot(A, '40-podcast-empty'); await A.click('[data-a="atr"]'); await A.waitForSelector('.snt'); ok(await A.locator('.snt').count() === 3, 'transkript tuzildi: 3 ta gap'); ok(await A.locator('.w[data-ws]').count() >= 6, 'so‘z-so‘z vaqtlar mavjud (karaoke)');
  await A.click('#lp'); await A.waitForFunction(() => document.querySelector('.w.cur'), null, { timeout: 10000 }); ok(true, 'ijro vaqtida joriy SO‘Z belgilanadi'); await shot(A, '41-podcast-karaoke');
  await A.click('[data-a="atab"][data-v="vocab"]'); await A.click('[data-a="aan"]'); await A.waitForSelector('.vcard'); ok(true, 'AI tahlili: lug‘at paydo bo‘ldi'); await A.click('[data-a="atab"][data-v="qs"]'); ok(await A.locator('.apanel[data-p="qs"] .q').count() === 2, 'AI tahlili: savollar tuzildi');
  ok(await A.evaluate(() => IE.S().lib.filter(x => x.an === 1).length === 1), 'material kutubxonaga saqlandi va tahlil belgilandi');
  await A.goto(base + '#/articles/tab/a'); await A.click('[data-a="naopen"]'); await A.fill('#nau', 'https://e.com/x'); await A.click('[data-a="nart"]'); await A.waitForSelector('.snt'); ok(await A.locator('.snt').count() >= 5, 'havoladan maqola qo‘shildi va matn ko‘rsatildi');
  console.log('8f. Ibora rejimi, Speaking AI, Shadowing, Dictation');
  await A.goto(base + '#/article/toyota'); await A.waitForSelector('.snt'); await A.click('#phtg'); ok(await A.evaluate(() => document.querySelector('.apanel.phr') !== null), 'ibora rejimi yoqildi');
  await A.click('.w[data-w="japanese"]'); await A.click('.w[data-w="automaker"]'); ok(await A.evaluate(() => !document.getElementById('phbar').classList.contains('hide') && document.getElementById('phtx').textContent === 'Japanese automaker'), 'tanlangan so‘zlar ibora sifatida pastki panelda'); await shot(A, '42-phrase-bar');
  await A.click('[data-a="phgo"]'); await A.waitForSelector('#wsh .chip'); await A.waitForFunction(() => document.querySelector('#wsh').innerText.includes('avtomobil')); ok(true, 'ibora ma’nosi (kontekst bilan) chiqdi'); await shot(A, '43-phrase-sheet'); await A.click('[data-a="padd"]'); ok(await A.evaluate(() => IE.S().my.some(x => x.pos === 'collocation')), 'ibora “Mening so‘zlarim”ga qo‘shildi'); await A.evaluate(() => IE.closeSheet());
  await A.goto(base + '#/speaking/1/0'); await A.waitForSelector('.qcard'); await A.click('[data-a="sp1rec"]'); await A.waitForSelector('.mic.on'); await A.waitForTimeout(1500); await A.click('[data-a="sp1rec"]'); await A.waitForSelector('[data-a="sp1ai"]'); await A.click('[data-a="sp1ai"]'); await A.waitForSelector('#sai .airs'); ok((await A.innerText('#sai .sc.all b')) === '6.0', 'Speaking AI bahosi: overall 6.0'); await shot(A, '44-speaking-ai'); ok(await A.evaluate(() => IE.S().speaks.some(x => x.ai && x.ai.overall === 6)), 'Speaking bahosi holatga yozildi');
  await A.goto(base + '#/shadow'); await A.waitForSelector('.item'); ok(await A.locator('.item').count() === 8, 'Shadowing: 8 ta maqola'); await A.click('[data-go="shadow/toyota"]'); await A.waitForSelector('#sau', { state: 'attached' }); await shot(A, '45-shadowing');
  await A.click('[data-a="shplay"]'); await A.waitForFunction(() => { const a = document.getElementById('sau'); return a && a.currentTime > 0.2; }, null, { timeout: 15000 }); ok(true, 'gap bo‘lagi ijro etildi'); await A.waitForTimeout(500); await A.click('[data-a="shrec"]'); await A.waitForSelector('.mic.on'); await A.waitForTimeout(800); await A.click('[data-a="shrec"]'); await A.waitForSelector('#uau'); ok(true, 'takrorlash yozib olindi, solishtirish tugmasi paydo bo‘ldi');
  await A.goto(base + '#/dictation/toyota'); await A.waitForSelector('#dct'); const first = await A.evaluate(() => IE.D.articles.items.find(x => x.id === 'toyota').blocks.find(b => b.s).s[0][1]); await A.fill('#dct', first); await A.click('[data-a="dccheck"]'); await A.waitForSelector('.dres'); ok((await A.innerText('.dres .lbl')).includes('100%'), 'Dictation: to‘g‘ri yozilsa 100%'); await shot(A, '46-dictation-ok');
  await A.click('[data-a="dcagain"]'); await A.fill('#dct', 'Japanese automaker says banana'); await A.click('[data-a="dccheck"]'); await A.waitForSelector('.dno'); ok(await A.locator('.dno').count() > 3 && (await A.innerText('.dres .lbl')).match(/\d+%/) !== null, 'Dictation: xatolar qizil bilan ko‘rsatiladi'); await shot(A, '47-dictation-diff');
  console.log('8g. Yangilash tugmasi va Mock Test');
  await A.goto(base + '#/home'); await A.waitForSelector('[data-a="upd"]'); ok(await A.locator('.hero [data-a="upd"]').count() === 1, 'Home’da dumaloq yangilash tugmasi bor'); await shot(A, '48-home-update');
  await A.goto(base + '#/mock'); await A.waitForSelector('[data-a="mstart"]'); await shot(A, '49-mock-start'); await A.click('[data-a="mstart"][data-m="mini"]'); await A.waitForSelector('[data-go^="listening/"]'); ok(await A.evaluate(() => IE.S().mock && IE.S().mock.L.length === 2 && IE.S().mock.R.length === 1), 'Tezkor mock rejasi tuzildi: 2 Listening + 1 Reading'); await shot(A, '50-mock-running');
  ok((await A.innerText('.card .chip')).includes('0%'), 'jarayon 0% dan boshlanadi');
  await A.evaluate(() => { const m = IE.S().mock, s = IE.S(), t0 = m.ts + 1000; m.L.forEach((id, i) => s.listens.push({ ts: t0 + i, id, raw: 7, tot: 10, band: 6.5, secs: 300, a: {} })); m.R.forEach((id, i) => s.reads.push({ ts: t0 + 10 + i, p: id, raw: 9, tot: 13, band: 6, secs: 900, a: {} })); s.writes.push({ ts: t0 + 20, p: m.W, words: 260, secs: 2400, x: 'x', ai: { overall: 6.5 } }); s.speaks.push({ ts: t0 + 30, k: '1', t: IE.D.prompts.sp1[m.S.p1].t, ai: { overall: 6 } }); s.speaks.push({ ts: t0 + 31, k: '2', t: IE.D.prompts.sp2[m.S.p2].t.replace('Describe ', ''), ai: { overall: 6.5 } }); });
  await A.goto(base + '#/practice'); await A.goto(base + '#/mock'); await A.waitForSelector('[data-a="mfin"]'); ok(true, 'hamma bo‘lim bajarilgach “Natijani ko‘rish” paydo bo‘ldi'); await A.click('[data-a="mfin"]'); await A.waitForSelector('.res .big');
  ok(/^\d\.\d$/.test(await A.innerText('.res .big')), 'Mock umumiy bandi hisoblandi: ' + (await A.innerText('.res .big'))); ok(await A.evaluate(() => IE.S().mocks.length === 1 && !IE.S().mock), 'natija tarixga yozildi, mock yopildi'); await shot(A, '51-mock-report');
  console.log('8h. Kitoblar (PDF): yuklash, o‘qish, reja, bulut');
  const PDF = process.env.TESTPDF; if (PDF && fs.existsSync(PDF)) {
    await A.goto(base + '#/books'); await A.waitForSelector('#bkf', { state: 'attached' }); await A.setInputFiles('#bkf', PDF);
    await A.waitForSelector('[data-a="bksave"][data-c="1"]'); await shot(A, '52-book-save'); await A.click('[data-a="bksave"][data-c="1"]');
    await A.waitForSelector('[data-a="bkps"]', { timeout: 15000 }); ok(await A.evaluate(() => IE.S().books.length === 1 && IE.S().books[0].pg === 12 && IE.S().books[0].cloud === true), 'Kitob qo‘shildi (12 bet), bulutga belgilandi');
    ok(Object.keys(st.cloud || {}).length === 1, 'PDF Storage’ga yuborildi'); ok(await A.evaluate(async () => !!(await IE.idbGet('book:' + IE.S().books[0].id))), 'PDF qurilmada (IndexedDB) ham saqlandi');
    await A.click('[data-a="bkpm"][data-m="per"]'); await A.fill('#bkpp', '4'); await A.click('[data-a="bkps"]'); await A.waitForSelector('text=Bugungi reja'); ok(await A.evaluate(() => IE.S().books[0].plan.per === 4), 'Reja: kuniga 4 bet'); await shot(A, '53-book-plan');
    await A.click('[data-a="bkv"][data-v="text"]'); await A.waitForSelector('.bktx .w', { timeout: 15000 }); ok((await A.locator('.bktx .w').count()) > 20, 'Matn rejimida so‘zlar chiqdi'); await shot(A, '54-book-text');
    await A.locator('.bktx .w >> nth=3').click(); await A.waitForSelector('#wsh h2'); ok(true, 'So‘z bosilganda lug‘at oynasi ochildi'); await A.evaluate(() => IE.closeSheet());
    await A.click('[data-a="bkgo"][data-d="1"]'); await A.waitForFunction(() => /^2 \//.test(document.querySelector('.bkp').innerText)); ok(await A.evaluate(() => IE.S().books[0].max === 2), 'Keyingi betga o‘tdi, o‘qilgan 2 bet');
    await A.click('[data-a="bkv"][data-v="page"]'); await A.waitForSelector('#bkcv'); await A.waitForFunction(() => { const c = document.querySelector('#bkcv'); return c && c.width > 100 && !document.querySelector('#bksp'); }, null, { timeout: 15000 }); ok(true, 'Sahifa rejimi (canvas) chizildi'); await shot(A, '55-book-page');
    await A.click('[data-a="bkv"][data-v="plan"]'); await A.waitForSelector('text=Bugungi reja'); ok((await A.innerText('#bkbody')).includes('bet qoldi'), 'Reja: bugun qancha qolgani ko‘rinadi'); await shot(A, '56-book-plan2');
    await A.goto(base + '#/home'); await A.waitForSelector('text=Bugungi reja:'); ok(true, 'Home’da “Bugungi reja” kartasi bor');
    await A.goto(base + '#/books'); await A.waitForSelector('.bki'); await shot(A, '57-books');
    // boshqa qurilma: lokal nusxa yo‘q — bulutdan avtomatik yuklanadi
    await A.evaluate(async () => { const id = IE.S().books[0].id; await IE.idbDel('book:' + id); localStorage.removeItem('ielts:bkloc'); });
    const bid = await A.evaluate(() => IE.S().books[0].id); await A.goto(base + '#/book/' + bid); await A.reload(); await A.waitForSelector('.bktx .w', { timeout: 20000 }); ok(await A.evaluate(async () => !!(await IE.idbGet('book:' + IE.S().books[0].id))), 'Qurilmada yo‘q kitob bulutdan yuklab olindi va keshlandi');
    await A.goto(base + '#/books'); await A.click('[data-a="bkmenu"]'); await A.click('[data-a="bkdel"]'); await A.click('#askok'); await A.waitForFunction(() => !IE.S().books.filter(b => !b.del).length); ok(Object.keys(st.cloud || {}).length === 0, 'O‘chirilganda bulutdagi fayl ham o‘chdi');
  } else console.log('  (TESTPDF berilmagan — o‘tkazib yuborildi)');
  console.log('8i. Kitoblar: qidiruv va OCR');
  if (PDF && fs.existsSync(PDF)) {
    await A.goto(base + '#/books'); await A.waitForSelector('#bkf', { state: 'attached' }); await A.setInputFiles('#bkf', PDF); await A.waitForSelector('[data-a="bksave"][data-c="0"]'); await A.click('[data-a="bksave"][data-c="0"]'); await A.waitForSelector('[data-a="bkps"]', { timeout: 15000 });
    await A.click('[data-a="bkv"][data-v="find"]'); await A.waitForSelector('#bks'); await A.waitForFunction(() => /tayyor/.test(document.querySelector('#bkfs').innerText), null, { timeout: 20000 }); ok(true, 'Kitob indekslandi');
    await A.fill('#bks', 'carbon'); await A.waitForSelector('.bkr mark'); ok((await A.locator('.bkr').count()) === 12, 'Qidiruv: “carbon” 12 betda topildi'); await shot(A, '59-book-search');
    await A.locator('.bkr >> nth=4').click(); await A.waitForSelector('.bktx .w.hl'); ok((await A.innerText('.bkp')).startsWith('5'), 'Natijani bosish — 5-bet ochildi va so‘z belgilandi'); await shot(A, '60-book-hl');
    await A.goto(base + '#/books'); await A.click('[data-a="bkmenu"]'); await A.click('[data-a="bkdel"]'); await A.click('#askok'); await A.waitForFunction(() => !IE.S().books.filter(b => !b.del).length);
  }
  const SCAN = process.env.TESTSCAN; if (SCAN && fs.existsSync(SCAN)) {
    await A.goto(base + '#/books'); await A.setInputFiles('#bkf', SCAN); await A.waitForSelector('[data-a="bksave"][data-c="0"]'); await A.click('[data-a="bksave"][data-c="0"]'); await A.waitForSelector('[data-a="bkps"]', { timeout: 15000 });
    await A.click('[data-a="bkv"][data-v="text"]'); await A.waitForSelector('[data-a="bkocr"]'); ok(true, 'Skaner PDF: “OCR” taklifi chiqdi'); await shot(A, '61-book-ocr-offer'); await A.click('[data-a="bkocr"]');
    await A.waitForSelector('.bktx .w', { timeout: 120000 }); const tx = (await A.innerText('.bktx')).toLowerCase(); ok(/library|street|students|examinations/.test(tx), 'OCR matnni tanidi: «' + tx.replace(/\s+/g, ' ').slice(0, 60) + '…»'); await shot(A, '62-book-ocr');
    await A.click('[data-a="bkv"][data-v="find"]'); await A.waitForFunction(() => /tayyor/.test(document.querySelector('#bkfs').innerText), null, { timeout: 20000 }); ok(await A.locator('[data-a="bkocrall"]').count() === 1, 'Qidiruvda “Hammasini OCR qilish” (qolgan matnsiz bet) bor'); await A.click('[data-a="bkocrall"]');
    await A.waitForFunction(() => !document.querySelector('[data-a="bkocrall"]') && !document.querySelector('[data-a="bkocrstop"]'), null, { timeout: 120000 }); await A.fill('#bks', 'garden'); await A.waitForSelector('.bkr mark', { timeout: 10000 }); ok(true, 'OCR qilingan bet ham qidiruvda topiladi');
    await A.goto(base + '#/books'); await A.click('[data-a="bkmenu"]'); await A.click('[data-a="bkdel"]'); await A.click('#askok'); await A.waitForFunction(() => !IE.S().books.filter(b => !b.del).length);
  } else console.log('  (TESTSCAN berilmagan — OCR sinovi o‘tkazib yuborildi)');
  console.log('8j. Cambridge Reading/Listening (shaxsiy import)');
  if (PDF && fs.existsSync(PDF)) {
    await A.goto(base + '#/books'); await A.waitForSelector('#bkf', { state: 'attached' }); await A.setInputFiles('#bkf', PDF); await A.waitForSelector('[data-a="bksave"][data-c="0"]'); await A.click('[data-a="bksave"][data-c="0"]'); await A.waitForSelector('[data-a="bkps"]', { timeout: 15000 });
    await A.goto(base + '#/cambridge'); await A.waitForSelector('[data-go="cambridge/new/r"]'); await shot(A, '63-cambridge-hub');
    await A.click('[data-go="cambridge/new/r"]'); await A.waitForSelector('#cqa'); await A.fill('#clb', 'Cambridge 99 · Test 1 · Passage 1'); await A.fill('#cqa', '1'); await A.fill('#cqb', '2'); await A.fill('#cka', '3'); await A.fill('#ckb', '3'); await shot(A, '64-cambridge-form');
    await A.click('[data-a="camgo"]'); await A.waitForSelector('[data-a="camsave"]', { timeout: 30000 }); ok(await A.evaluate(() => /8 ta savol/.test(document.body.innerText)), 'AI natijasi tekshirildi: 8 ta savol (YES/NO → TRUE/FALSE, harf javob → indeks)'); ok(st.cam.length === 1 && /page 1 ---/.test(st.cam[0].text) && /page 3 ---/.test(st.cam[0].key) && st.cam[0].text.includes('Climate change'), 'Kitob sahifalari matni AI’ga yuborildi (savollar + kalit)'); await shot(A, '65-cambridge-preview');
    await A.click('[data-a="camsave"]'); await A.waitForSelector('.item [data-a="camdel"]'); ok(await A.evaluate(() => IE.D.reading.passages.some(p => p.priv && p.cam.includes('Cambridge 99'))), 'Reading qo‘shildi va Reading ro‘yxatiga kirdi');
    const rid = await A.evaluate(() => IE.D.reading.passages.find(p => p.priv).id); await A.goto(base + '#/reading/' + rid + '/run'); await A.waitForSelector('.para'); await A.click('[data-a="rtab"][data-v="q"]'); await A.waitForSelector('.q'); ok((await A.locator('.q').count()) === 8, 'Cambridge Reading oddiy testdek ochildi (8 savol)'); await shot(A, '66-cambridge-reading');
    await A.evaluate(async () => { IE.D.__ids = IE.D.reading.passages.filter(p => !p.priv).length; });
    // Listening + audio
    await A.goto(base + '#/cambridge/new/l'); await A.waitForSelector('#cqa'); await A.fill('#clb', 'Cambridge 99 · Test 1 · Section 1'); await A.fill('#cqa', '1'); await A.fill('#cqb', '2'); await A.fill('#cka', '3'); await A.fill('#ckb', '3'); await A.setInputFiles('#camaf0', path.join(root, 'ielts/audio/wright.mp3')); await A.waitForSelector('text=wright.mp3');
    await A.click('[data-a="camgo"]'); await A.waitForSelector('[data-a="camsave"]', { timeout: 30000 }); await A.click('[data-a="camsave"]'); await A.waitForSelector('.item [data-a="camdel"]');
    const lid = await A.evaluate(() => IE.D.listening.tests.find(p => p.priv).id); await A.waitForFunction(i => { const x = IE.D.listening.tests.find(p => p.id === i); return x && x.dur > 10; }, lid, { timeout: 15000 }); ok(true, 'Listening qo‘shildi, audio qurilmada saqlandi (davomiyligi aniqlandi)');
    await A.goto(base + '#/listening/' + lid); await A.waitForSelector('[data-a="lstart"]'); await shot(A, '67-cambridge-listen-intro'); await A.click('[data-a="lstart"]'); await A.waitForSelector('#au', { state: 'attached' }); ok((await A.getAttribute('#au', 'src')).startsWith('blob:'), 'Audio IndexedDB’dan blob sifatida o‘ynaydi');
    await A.fill('.fill >> nth=0', 'nine'); await A.click('[data-a="lsubmit"]'); await A.click('#askok'); await A.waitForSelector('.res .big'); ok((await A.locator('details.tr').count()) === 1 && (await A.locator('.lseekb').count()) === 0, 'Natija: vaqtsiz transkript ko‘rinadi, “tinglash” tugmalari yo‘q'); await shot(A, '68-cambridge-listen-result');
    await A.waitForFunction(() => true); await new Promise(r => setTimeout(r, 4500)); ok(!!(st.cloud && st.cloud['u1/cam/index.json']) && Object.keys(st.cloud).some(k => k.startsWith('u1/cam/aud-')), 'Cambridge indeksi va audio shaxsiy bulutga yuklandi');
    // boshqa qurilma: mahalliy ma’lumot yo‘q, bulutdan qaytadi
    await A.evaluate(async () => { await IE.idbDel('camt'); const id = IE.D.listening.tests.find(p => p.priv).id; await IE.idbDel('camaud:' + id); });
    await A.goto(base + '#/cambridge'); await A.reload(); await A.waitForFunction(() => IE.D.reading.passages.some(p => p.priv) && IE.D.listening.tests.some(p => p.priv), null, { timeout: 15000 }); ok(true, 'Boshqa qurilmada: testlar bulutdan tiklandi');
    const lid2 = await A.evaluate(() => IE.D.listening.tests.find(p => p.priv).id); await A.goto(base + '#/listening/' + lid2); await A.waitForSelector('[data-a="lstart"]', { timeout: 15000 }); ok(await A.evaluate(async i => !!(await IE.idbGet('camaud:' + i)), lid2), 'Audio ham bulutdan yuklab olindi va qurilmada keshlandi');
    await A.goto(base + '#/listening/' + lid2 + '/result');
    await A.reload(); await A.waitForSelector('.res .big'); ok(await A.evaluate(() => IE.D.reading.passages.some(p => p.priv) && IE.D.listening.tests.some(p => p.priv)), 'Qayta yuklagach ham testlar saqlanib qoladi (IndexedDB)');
    ok(await A.evaluate(() => !IE.mockActive() && true), 'ok'); await A.goto(base + '#/mock'); await A.click('[data-a="mstart"][data-m="mini"]'); ok(await A.evaluate(() => IE.S().mock.R.every(id => !String(id).startsWith('c')) && IE.S().mock.L.every(id => !String(id).startsWith('c'))), 'Mock Cambridge testlarini qo‘shmaydi'); await A.evaluate(() => { IE.S().mock = null; IE.save(); });
    await A.goto(base + '#/cambridge'); await A.waitForSelector('[data-a="camdel"]'); while (await A.locator('[data-a="camdel"]').count()) { await A.locator('[data-a="camdel"]').first().click(); await A.click('#askok'); await A.waitForTimeout(250); } ok(await A.evaluate(() => !IE.D.reading.passages.some(p => p.priv)), 'O‘chirish ishlaydi'); await new Promise(r => setTimeout(r, 3500)); ok(!Object.keys(st.cloud || {}).some(k => k.startsWith('u1/cam/aud-')) && !(JSON.parse(st.cloud['u1/cam/index.json'].toString()).reading.length), 'O‘chirilganda bulutdagi nusxa ham o‘chdi');
    await A.goto(base + '#/books'); await A.click('[data-a="bkmenu"]'); await A.click('[data-a="bkdel"]'); await A.click('#askok');
  }
  console.log('9. Ruxsat: guruhsiz foydalanuvchi');
  const { pg: B } = await mk([]); await B.goto(base); await B.waitForSelector('.lockc'); ok((await B.innerText('.lockc')).includes('Ruxsat'), 'guruhsiz: “Ruxsat kerak” ekrani'); await shot(B, '21-lock');
  console.log('10. Kirish ekrani (sessiyasiz)');
  const ctx = await br.newContext({ ...devices['iPhone 13'], serviceWorkers: 'block' }), C = await ctx.newPage(); await C.goto(base); await C.waitForSelector('#af'); ok(true, 'login formasi ko‘rinadi'); await shot(C, '22-login');
  ok(errs.length === 0, 'konsol xatolari yo‘q' + (errs.length ? ': ' + errs.slice(0, 3).join(' | ') : ''));
  await br.close(); srv.close(); console.log(fails ? '\n❌ ' + fails + ' ta xato' : '\n✅ Hammasi yaxshi'); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
