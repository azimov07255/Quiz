/* IELTS · BY AZIMOV — Tahlil markazi (Reading): toza urinishdan KEYIN chuqur o‘rganish.
   So‘zlar (Cambridge ro‘yxati + 8+ lug‘at + mening so‘zlarim, matnda topilgani), har savol uchun “nega to‘g‘ri / nega xato” (AI + dalil),
   xato turlari, qayta yechish, so‘zlar testi, matnda so‘z va dalillarni ko‘rish, flesh-kartalar va reja bilan bog‘lanish. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet } = IE, S = () => IE.S(), D = IE.D, R = IE.routes, A = IE.act, V = IE.V;
const PK = ts => 'ielts:ana:' + ts, QK = (ts, n) => 'ielts:anaq:' + ts + ':' + n, DK = 'ielts:anad';
const pg = ts => Object.assign({ w: {}, op: {}, fx: {}, gv: {}, bs: 0 }, lsGet(PK(ts), {}));
const pput = (ts, o) => lsSet(PK(ts), o);
const bump = () => { const d = lsGet(DK, {}) || {}, k = IE.dayKey(); d[k] = (d[k] || 0) + 1; Object.keys(d).sort().slice(0, -20).forEach(x => delete d[x]); lsSet(DK, d); IE.touchDay(); };
IE.anaToday = () => (lsGet(DK, {}) || {})[IE.dayKey()] || 0;
const wrap = (r, L) => L ? Object.assign({}, r, { ts: 'l' + r.ts, rts: r.ts, L: 1 }) : Object.assign({}, r, { rts: r.ts });
const recOf = key => { const k = String(key); if (k[0] === 'l') { const r = S().listens.find(x => x.ts === +k.slice(1)); return r && wrap(r, true); } const r = S().reads.find(x => x.ts === +k); return r && wrap(r, false); };
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const LC = new Map();
const adaptL = t => { const k = t.id + ':' + (t.mt || 0) + ':' + (t.tr || []).length; if (!LC.has(k)) LC.set(k, Object.assign({}, t, { paras: (t.tr || []).map((x, i) => ({ k: x.t != null ? mmss(x.t) : String(i + 1), t: String(x.x || '') })).filter(p => p.t), L: true })); return LC.get(k); };
const unitOf = rec => { if (!rec) return null; if (rec.p != null) return D.reading.passages.find(p => p.id === rec.p) || null; const t = D.listening.tests.find(x => x.id === rec.id); return t ? adaptL(t) : null; };
const evOf = (u, q) => { if (u.L) { const f = IE.evFindL ? IE.evFindL(u, q) : null; return f && u.paras[f.i] ? { pa: u.paras[f.i], frag: Array.isArray(q.a) ? String(q.a[0] || '') : '' } : null; } return IE.evFind ? IE.evFind(u, q) : null; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const fdate = ts => { const d = new Date(ts); return d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0'); };

/* ---------- so‘zlarni matndan topish ---------- */
const nrm = s => String(s || '').toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();
const STOP = new Set(['the', 'and', 'for', 'from', 'with', 'that', 'this', 'are', 'was', 'its', 'has', 'have']);
const wset = s => new Set(nrm(s).split(' ').filter(w => w.length > 2 && !STOP.has(w)));
const sim = (a, b) => { const x = wset(a), y = wset(b); if (!x.size || !y.size) return 0; let n = 0; x.forEach(w => { if (y.has(w)) n++; }); return n / Math.min(x.size, y.size); };
const bookNo = u => { const m = /Cambridge\s*(?:IELTS\s*)?(?:Academic\s*)?(\d{1,2})\b/i.exec(u.cam || ''); return m ? m[1] : ''; };
function lists(u) {
  const ex = [], bk = []; if (!IE.cam) return { ex, bk };
  const bn = bookNo(u), un = nrm(u.title);
  IE.cam.p.forEach(p => {
    const pn = nrm(p.t), same = bn && new RegExp('(^|\\D)' + bn + '(\\D|$)').test(p.s || ''), tm = sim(u.title, p.t) >= .6 || (pn.length >= 8 && (un.includes(pn) || pn.includes(un)));
    if (tm && (!bn || same || !/\d/.test(p.s || ''))) ex.push(p); else if (same) bk.push(p);
  });
  return { ex, bk };
}
const cleanW = w => String(w || '').replace(/\([^)]*\)/g, ' ').replace(/\s*:\s*$/, '').replace(/\s+/g, ' ').trim();
const alts = w => cleanW(w).split(/[/,;]| or /i).map(x => x.trim()).filter(Boolean);
const SKIP = new Set(['sth', 'sb', 'someone', 'something', 'somebody']);
const rxOf = alt => {
  const tk = (alt.match(/[A-Za-z]+/g) || []).filter(t => !SKIP.has(t.toLowerCase())); if (!tk.length || tk.join('').length < 4) return null;
  const st = t => { const l = t.toLowerCase(); return l.length > 4 ? l.slice(0, -2) + '[a-z]*' : l + '(?:s|es|ed|d|ing)?'; };
  try { return new RegExp('(^|[^A-Za-z])(' + tk.map(st).join('[^A-Za-z]+') + ')(?![A-Za-z])', 'gi'); } catch (e) { return null; }
};
const sentOf = (t, i) => { let a = i, b = i; while (a > 0 && !/[.!?]/.test(t[a - 1])) a--; while (b < t.length && !/[.!?]/.test(t[b])) b++; return { a: (/^\s/.test(t.slice(a)) ? a + (t.slice(a).length - t.slice(a).trimStart().length) : a), b: Math.min(t.length, b + 1) }; };
const CACHE = new Map();
IE.anaWords = u => {
  const key = u.id + ':' + (u.mt || 0) + ':' + (IE.cam ? IE.cam.n : 0) + ':' + S().my.length;
  if (CACHE.has(key)) return CACHE.get(key);
  const L = lists(u), cand = [], seen = new Set(), add = (w, src, exact) => { const k = cleanW(w.w).toLowerCase(); if (!k || seen.has(k)) return; seen.add(k); cand.push({ w, src, exact }); };
  L.ex.forEach(p => p.words.forEach(w => add(w, 'cam', true)));
  L.bk.forEach(p => p.words.forEach(w => add(w, 'cam', false)));
  D.vocab.topics.forEach(t => t.words.forEach(w => add(w, 'bi', false)));
  S().my.forEach(w => add(w, 'my', false));
  const out = [];
  cand.forEach(({ w, src, exact }) => {
    const rs = alts(w.w).map(rxOf).filter(Boolean); let hits = [];
    u.paras.forEach((pa, pi) => rs.forEach(rx => { rx.lastIndex = 0; let m, c = 0; while ((m = rx.exec(pa.t)) && c++ < 8) hits.push({ pi, i: m.index + m[1].length, len: m[2].length }); }));
    hits.sort((a, b) => a.pi - b.pi || a.i - b.i); const dd = []; hits.forEach(h => { const l = dd[dd.length - 1]; if (!l || l.pi !== h.pi || h.i >= l.i + l.len) dd.push(h); }); hits = dd;
    if (!hits.length && !(exact && src === 'cam')) return;
    let sent = null; if (hits.length) { const h = hits[0], t = u.paras[h.pi].t, s = sentOf(t, h.i); sent = { t: t.slice(s.a, s.b), rel: h.i - s.a, len: h.len, k: u.paras[h.pi].k }; }
    out.push({ id: w.id, w: cleanW(w.w), pos: w.pos || '', uz: w.uz || '', def: w.def || '', ex: w.ex || '', src, exact, hits, sent, found: hits.length > 0 });
  });
  out.sort((a, b) => (b.found - a.found) || (b.exact - a.exact) || ((a.hits[0] ? a.hits[0].pi * 1e5 + a.hits[0].i : 9e9) - (b.hits[0] ? b.hits[0].pi * 1e5 + b.hits[0].i : 9e9)));
  const res = out.slice(0, 90); CACHE.set(key, res); return res;
};
IE.anaTopic = ts => { const rec = recOf(ts), u = unitOf(rec); if (!u) return null; return { name: 'Tahlil: ' + u.title, words: IE.anaWords(u).filter(w => w.uz || w.def) }; };
const SRC = { cam: 'Cambridge', bi: '8+ lug‘at', my: 'Mening so‘zlarim' };

/* ---------- savollar va xato turlari ---------- */
const corrTxt = (g, q) => g.type === 'heads' ? q.a + '. ' + ((g.headings.find(h => h.id === q.a) || {}).t || '') : g.type === 'mcq' ? 'ABCDEFGHIJ'[q.a] + '. ' + q.o[q.a] : Array.isArray(q.a) ? q.a.join(' / ') : String(q.a);
const mineTxt = (g, q, a) => a == null || a === '' ? '—' : g.type === 'heads' ? a + '. ' + ((g.headings.find(h => h.id === a) || {}).t || '') : g.type === 'mcq' ? ('ABCDEFGHIJ'[a] || '?') + '. ' + (q.o[a] || '') : String(a);
const qtext = (g, q) => g.type === 'heads' ? 'Paragraph ' + q.para + ' uchun sarlavha' : (q.q || 'Gap ' + q.n);
const lev = (a, b) => { a = a.toLowerCase(); b = b.toLowerCase(); const d = Array.from({ length: a.length + 1 }, (_, i) => [i]); for (let j = 1; j <= b.length; j++) d[0][j] = j; for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[a.length][b.length]; };
function errType(g, q, a, em, L) {
  if (em) return { k: 'skip', t: 'Javob berilmagan', tip: L ? 'Audio ketib qolgan bo‘lishi mumkin. Savollarni oldindan o‘qib, kalit so‘zlarni belgilang — eshitganda tayyor bo‘lasiz; o‘tkazib yuborgan bo‘lsangiz ham taxmin yozing.' : 'Vaqt yetmagan yoki qiyin ko‘ringan. Qiyin savolni oxiriga qoldiring, lekin hech qachon bo‘sh tashlamang — taxmin qiling.' };
  if (g.type === 'tfng') {
    if (q.a === 'NOT GIVEN') return { k: 'ng', t: 'NOT GIVEN’ni topa olmadingiz', tip: 'Matnda bu ma’lumot umuman yo‘q. Taxmin qilmang — faqat yozilganiga tayaning. “Ehtimol, mantiqan to‘g‘ri” bo‘lsa ham matnda aytilmagan bo‘lsa — NOT GIVEN.' };
    if (a === 'NOT GIVEN') return { k: 'miss', t: 'Dalilni ko‘rmadingiz', tip: 'Ma’lumot matnda bor, lekin boshqa so‘zlar bilan (paraphrase) yozilgan. Savoldagi kalit so‘zning sinonimini qidiring.' };
    return { k: 'tf', t: 'TRUE ↔ FALSE chalkashligi', tip: 'Matn savolga aynan mos kelsa TRUE, qarama-qarshi bo‘lsa FALSE. Inkor (not, rarely, only, never) va miqdor so‘zlariga e’tibor bering.' };
  }
  if (g.type === 'fill') { const c = (Array.isArray(q.a) ? q.a : [q.a]).map(String), m = Math.min(...c.map(x => lev(x, String(a)))); return m <= 2 || c.some(x => String(a).toLowerCase().includes(x.toLowerCase()) || x.toLowerCase().includes(String(a).toLowerCase())) ? { k: 'spell', t: 'Imlo / shakl xatosi', tip: L ? 'Eshitgan so‘zingiz to‘g‘ri, lekin imlosi/shakli (ko‘plik -s, -ing) xato. Listening’da imlo ham baholanadi — shubhali so‘zlarni daftarda mashq qiling.' : 'So‘zni topdingiz, lekin yozilishi yoki shakli (ko‘plik, -ing, so‘z limiti) mos emas. Javobni matndan aynan ko‘chiring.' } : { k: 'word', t: L ? 'Noto‘g‘ri eshitilgan so‘z' : 'Noto‘g‘ri so‘z topilgan', tip: L ? 'Speaker avval bir variantni aytib, keyin tuzatishi mumkin — OXIRGI aytilganini yozing. Raqamlar va ismlar uchun talaffuzni (13/30, -teen/-ty) ajrating.' : 'Savoldagi so‘zning sinonimini matndan toping va uning atrofidagi aynan javobni yozing.' }; }
  if (g.type === 'heads') return { k: 'head', t: 'Sarlavha mos kelmadi', tip: 'Sarlavha paragrafning BOSH fikrini aks ettiradi, bitta gapni emas. Kalit so‘z takrorlansa ham ma’no mosligini tekshiring.' };
  return { k: 'mcq', t: 'Chalg‘ituvchi variant', tip: L ? 'Audioda hamma variantlar tilga olinadi, speaker fikrini o‘zgartirishi mumkin. Yakuniy qaror aytilgan variantni tanlang, birinchi eshitganingizni emas.' : 'Variantlar matndagi so‘zlar bilan chalg‘itadi. To‘g‘ri variant odatda paraphrase qilingan bo‘ladi — so‘zma-so‘z moslikka ishonmang.' };
}
const qrows = (u, rec) => IE.allQ(u).map(({ g, q }) => { const a = (rec.a || {})[q.n], em = a == null || a === '', ok = IE.isOk(g, q, a); return { g, q, n: q.n, a, em, ok, ty: ok ? null : errType(g, q, a, em, u.L) }; });

/* ---------- umumiy hisoblar ---------- */
function stats(rec) {
  const u = unitOf(rec), p = pg(rec.ts), rows = qrows(u, rec), ws = IE.anaWords(u), wrong = rows.filter(r => !r.ok), fixed = wrong.filter(r => p.fx[r.n]).length;
  const marked = ws.filter(w => p.w[w.id]).length, opened = rows.filter(r => p.op[r.n]).length;
  return { u, p, rows, ws, wrong, fixed, marked, opened, touched: !!(Object.keys(p.w).length || Object.keys(p.op).length || Object.keys(p.fx).length || p.bs) };
}
IE.anaPending = () => { const r = S().reads.map(x => wrap(x, false)).concat(S().listens.map(x => wrap(x, true))).filter(x => unitOf(x) && Date.now() - x.rts < 4 * 864e5).sort((a, b) => a.rts - b.rts).slice(-1)[0]; if (!r || pg(r.ts).bs || Object.keys(pg(r.ts).w).length || Object.keys(pg(r.ts).op).length || Object.keys(pg(r.ts).fx).length) return []; const u = unitOf(r); return [{ t: u.title, s: 'Tahlil qilinmagan · ' + r.raw + '/' + r.tot, go: 'ana/' + r.ts, k: r.L ? 'L' : 'R', ts: r.rts }]; };
IE.anaSummary = rec0 => { const rec = rec0.p != null ? wrap(rec0, false) : wrap(rec0, true), u = unitOf(rec); if (!u) return null; const ws = IE.anaWords(u), rows = qrows(u, rec); return { words: ws.length, wrong: rows.filter(r => !r.ok).length }; };

/* ---------- SRS ---------- */
const LAD = [0, 1, 3, 7, 16, 35];
function srsSet(w, mode) { const s = S().srs, cur = s[w.id] || { b: 0 }, td = IE.dayNum(); if (mode === 'learn') s[w.id] = { b: Math.min(cur.b || 1, 1) || 1, d: td, t: Date.now() }; else { const b = Math.min(5, Math.max(cur.b || 0, 3)); s[w.id] = { b, d: td + LAD[b], t: Date.now() }; } }
const wsy = (p, id) => p.w[id] === 'know' ? 'know' : p.w[id] === 'learn' ? 'learn' : '';

/* ---------- holat ---------- */
const st = ts => { if (!V.ana || V.ana.ts !== String(ts)) V.ana = { ts: String(ts), tab: 's', qf: 'no', wf: 'all', tm: 'w', open: new Set(), tries: {}, busy: {}, z: null }; return V.ana; };

/* ---------- Hub ---------- */
function hub() {
  const recs = S().reads.map(x => wrap(x, false)).concat(S().listens.map(x => wrap(x, true))).filter(r => unitOf(r)).sort((a, b) => b.rts - a.rts).slice(0, 40), V0 = V.anah || (V.anah = { f: 'all' });
  let all = { wrong: 0, kinds: {}, words: 0 }, list = [];
  recs.forEach(r => { const x = stats(r); x.wrong.forEach(w => { all.kinds[w.ty.k] = (all.kinds[w.ty.k] || { n: 0, t: w.ty.t, tip: w.ty.tip }); all.kinds[w.ty.k].n++; }); all.wrong += x.wrong.length; list.push({ r, x }); });
  const done = list.filter(o => o.x.touched).length, tops = Object.values(all.kinds).sort((a, b) => b.n - a.n).slice(0, 3);
  const shown = list.filter(o => V0.f === 'all' || (V0.f === 'cam' && /Cambridge/i.test(o.x.u.cam || '')) || (V0.f === 'new' && !o.x.touched));
  const head = '<div class="pad"><div class="anah rise"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;opacity:.85">Tahlil markazi</div><h2>Avval toza ishlang, keyin tahlil qiling</h2><p>Natijadan keyin: matndagi so‘zlar → har savol “nega?” → qayta yechish → so‘zlar testi.</p><div class="anas"><div><b>' + list.length + '</b><span>urinish</span></div><div><b>' + done + '</b><span>tahlil qilingan</span></div><div><b>' + all.wrong + '</b><span>xato</span></div></div></div>' +
    (!IE.cam ? '<div class="card rise" style="margin-top:12px"><div class="row">' + bd('down', 'R') + '<div style="flex:1"><b>Cambridge lug‘atini ulang</b><div class="sm mu">So‘zlar tahlili uchun <code>cambridge-sozlar.json</code> ni Tools → So‘zlar orqali yuklang. Hozircha 8+ lug‘at va sizning so‘zlaringiz ishlatiladi.</div></div></div><button class="btn block ghost" style="margin-top:10px" data-go="vocab">Lug‘at bo‘limi</button></div>' : '') +
    (tops.length ? '<div class="sec"><h2>Eng ko‘p xato turlari</h2></div>' + tops.map(k => '<div class="card rise" style="margin-bottom:8px"><div class="row" style="justify-content:space-between"><b>' + esc(k.t) + '</b><span class="chip">' + k.n + ' ta</span></div><div class="sm mu" style="margin-top:6px">' + esc(k.tip) + '</div></div>').join('') : '') +
    '<div class="sec"><h2>Urinishlar</h2></div><div class="seg" style="margin-bottom:6px">' + [['all', 'Hammasi'], ['cam', 'Cambridge'], ['new', 'Tahlil qilinmagan']].map(f => '<button class="' + (V0.f === f[0] ? 'on' : '') + '" data-a="anahf" data-v="' + f[0] + '">' + f[1] + '</button>').join('') + '</div>';
  const items = shown.length ? '<div class="lst">' + shown.map(({ r, x }) => '<button class="item rise" data-go="ana/' + r.ts + '">' + bd(r.L ? 'head' : 'book', r.L ? 'L' : 'R', 'sm') + '<div class="tx"><b>' + esc(x.u.cam || x.u.title) + '</b><span>' + (r.L ? 'Listening · ' : 'Reading · ') + esc(x.u.cam ? x.u.title + ' · ' : '') + IE.bandTxt(r.band) + ' · ' + r.raw + '/' + r.tot + ' · ' + fdate(r.rts) + ' · ' + x.wrong.length + ' xato · ' + x.ws.length + ' so‘z</span></div><span class="band' + (x.touched ? ' sk-R' : '') + '" style="font-size:12px">' + (x.touched ? '✓' : 'Yangi') + '</span></button>').join('') + '</div>'
    : '<div class="card empty rise">' + bd('bulb', 'R') + 'Hali Reading/Listening urinishi yo‘q.<br>Avval bitta mashq ishlang — keyin shu yerda tahlil qilasiz.<br><div class="two" style="margin-top:12px"><button class="btn sm" data-go="reading">Reading</button><button class="btn sm ghost" data-go="listening">Listening</button></div></div>';
  return IE.sub('Tahlil markazi', 'tools', head + items + '</div>');
}
A.anahf = el => { (V.anah = V.anah || {}).f = el.dataset.v; IE.draw(false); };

/* ---------- Tahlil ekrani ---------- */
const TABS = [['s', 'Sharh'], ['w', 'So‘zlar'], ['q', 'Savollar'], ['r', 'Qayta'], ['t', 'Matn'], ['z', 'Test']];
const tabName = (t, L) => t[0] === 't' && L ? 'Skript' : t[1];
R.ana = a => {
  if (!a[0]) return hub();
  const rec = recOf(a[0]), u = unitOf(rec); if (!rec || !u) return hub();
  const c = st(a[0]), x = stats(rec), body = c.tab === 's' ? summary(x, rec) : c.tab === 'w' ? wordsTab(x, c) : c.tab === 'q' ? qTab(x, c, rec) : c.tab === 'r' ? retryTab(x, c, rec) : c.tab === 't' ? textTab(x, c) : quizTab(x, c);
  const tabs = '<div class="seg anatabs">' + TABS.map(t => '<button class="' + (c.tab === t[0] ? 'on' : '') + '" data-a="anatab" data-v="' + t[0] + '">' + tabName(t, u.L) + (t[0] === 'r' && x.wrong.length ? ' <i>' + x.fixed + '/' + x.wrong.length + '</i>' : t[0] === 'w' && x.ws.length ? ' <i>' + x.ws.length + '</i>' : '') + '</button>').join('') + '</div>';
  return IE.sub('Tahlil', 'ana', '<div class="pad">' + tabs + '<div id="anab">' + body + '</div></div>');
};
A.anatab = el => { const c = V.ana; if (!c) return; c.tab = el.dataset.v; IE.draw(false); window.scrollTo(0, 0); };

function summary(x, rec) {
  const p = x.p, after = rec.raw + x.fixed, ab = IE.band(after, rec.tot), kinds = {}; x.wrong.forEach(w => { (kinds[w.ty.k] = kinds[w.ty.k] || { n: 0, t: w.ty.t, tip: w.ty.tip }).n++; });
  const top = Object.values(kinds).sort((a, b) => b.n - a.n), bar = (l, a, b, tab, note) => '<button class="anast" data-a="anatab" data-v="' + tab + '"><div class="row" style="justify-content:space-between"><b>' + l + '</b><span class="sm mu">' + a + ' / ' + b + (note ? ' · ' + note : '') + '</span></div><div class="prog" style="margin-top:7px"><i style="width:' + (b ? Math.min(100, a / b * 100) : 0) + '%"></i></div></button>';
  const zs = x.ws.filter(w => w.uz).length;
  return '<div class="anahero rise"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;opacity:.85">1-urinish · toza' + (rec.L ? ' · Listening' : '') + '</div><div class="abig">' + IE.bandTxt(rec.band) + '</div><div class="sm" style="opacity:.9">' + rec.raw + ' / ' + rec.tot + ' to‘g‘ri · ' + Math.floor(rec.secs / 60) + ' daq</div></div>' +
    (x.fixed ? '<div class="aafter"><div class="mu xs b" style="opacity:.85">Tahlildan keyin</div><b>' + IE.bandTxt(ab) + '</b><span>' + after + ' / ' + rec.tot + (ab > rec.band ? ' · +' + (Math.round((ab - rec.band) * 2) / 2).toFixed(1) : '') + '</span></div>' : '') + '</div><div class="ahtitle">' + esc(x.u.cam ? x.u.cam + ' · ' : '') + esc(x.u.title) + '</div></div>' +
    '<div class="sec"><h2>Bosqichlar</h2></div><div class="card rise anastages">' + bar('1 · So‘zlarni o‘rganish', x.marked, x.ws.length, 'w', x.ws.length ? '' : 'so‘z topilmadi') + bar('2 · Savollar sharhi (nega?)', x.opened, x.rows.length, 'q') + bar('3 · Xatolarni qayta yechish', x.fixed, x.wrong.length, 'r', x.wrong.length ? '' : 'xato yo‘q 🎉') + bar('4 · So‘zlar testi', Math.round(p.bs || 0), 100, 'z', p.bs ? 'eng yaxshi ' + Math.round(p.bs) + '%' : zs >= 4 ? '' : 'so‘z yetarli emas') + '</div>' +
    (top.length ? '<div class="sec"><h2>Xatolaringiz sababi</h2></div>' + top.slice(0, 3).map(k => '<div class="card rise" style="margin-bottom:8px"><div class="row" style="justify-content:space-between"><b>' + esc(k.t) + '</b><span class="chip">' + k.n + ' ta</span></div><div class="sm mu" style="margin-top:6px">' + esc(k.tip) + '</div></div>').join('') : '<div class="card c rise" style="margin-top:12px"><b>Hamma javob to‘g‘ri! 🎉</b><div class="sm mu">Shunda ham “Savollar” bo‘limida har javobning sababini o‘qing va so‘zlarni yodlang.</div></div>') +
    '<div class="two" style="margin-top:12px"><button class="btn" data-a="anatab" data-v="w">' + ic('cards') + ' So‘zlardan boshlash</button><button class="btn ghost" data-go="' + (x.u.L ? 'listening/' : 'reading/') + x.u.id + '/result">Natija sahifasi</button></div>';
}

/* ----- So‘zlar ----- */
function wordHTML(w, p, open) {
  const s = wsy(p, w.id), sent = w.sent ? esc(w.sent.t.slice(0, w.sent.rel)) + '<mark class="ev">' + esc(w.sent.t.slice(w.sent.rel, w.sent.rel + w.sent.len)) + '</mark>' + esc(w.sent.t.slice(w.sent.rel + w.sent.len)) : '';
  return '<div class="aw' + (s ? ' ' + s : '') + (open ? ' open' : '') + '" id="aw-' + esc(w.id) + '"><button class="aw-h" data-a="awtog" data-id="' + esc(w.id) + '"><div style="flex:1;min-width:0"><b>' + esc(w.w) + '</b>' + (w.pos ? ' <span class="chip">' + esc(w.pos) + '</span>' : '') + '<div class="uz">' + esc(w.uz || w.def.slice(0, 60)) + '</div></div>' + (s === 'know' ? '<span class="aws ok">✓</span>' : s === 'learn' ? '<span class="aws">🧠</span>' : '') + (w.found ? '' : '<span class="chip" style="opacity:.6">ro‘yxatda</span>') + '</button>' +
    '<div class="aw-b"><div class="mu xs b" style="letter-spacing:.06em;text-transform:uppercase">' + SRC[w.src] + (w.exact && w.src === 'cam' ? ' · shu matn ro‘yxatidan' : '') + '</div>' + (w.def ? '<p class="df" style="margin-top:6px">' + esc(w.def) + '</p>' : '') +
    (sent ? '<div class="evt" style="margin-top:8px"><b>Matnda' + (w.sent.k ? ' · ' + esc(w.sent.k) : '') + '</b><p>' + sent + '</p></div>' : '') + (w.ex ? '<p class="df"><em>“' + esc(w.ex) + '”</em></p>' : '') +
    '<div class="awa"><button class="btn sm" data-a="awlearn" data-id="' + esc(w.id) + '">🧠 Yodlayman</button><button class="btn sm ghost" data-a="awknow" data-id="' + esc(w.id) + '">✓ Bilaman</button><button class="ib sm2" data-a="say" data-t="' + esc(w.w) + '" aria-label="Eshitish">' + ic('spk') + '</button><button class="ib sm2" data-go="dict/' + encodeURIComponent(w.w.split(' ')[0]) + '" aria-label="Dictionary">' + ic('search') + '</button></div></div></div>';
}
function wordsList(x, c) {
  const p = pg(c.ts), ws = x.ws.filter(w => c.wf === 'all' || (c.wf === 'left' && !p.w[w.id]) || (c.wf === 'found' && w.found));
  return ws.length ? ws.map(w => wordHTML(w, p, c.open.has(w.id))).join('') : '<div class="card empty">' + bd('cards', 'R') + 'Bu bo‘limda so‘z yo‘q.</div>';
}
function wordsTab(x, c) {
  const p = x.p, learn = Object.values(p.w).filter(v => v === 'learn').length, know = Object.values(p.w).filter(v => v === 'know').length, cnt = x.ws.filter(w => w.found).length;
  const cam = x.ws.filter(w => w.src === 'cam').length;
  return '<div class="card rise"><div class="row" style="justify-content:space-between"><div><b style="font-size:16px">Matndagi so‘zlar: ' + x.ws.length + '</b><div class="sm mu">Cambridge: ' + cam + ' · matnda topilgan: ' + cnt + ' · 🧠 ' + learn + ' · ✓ ' + know + '</div></div></div>' +
    (!x.ws.length ? '<div class="sm mu" style="margin-top:8px">' + (x.u.L && !x.u.paras.length ? 'Bu audio uchun skript (transkript) yo‘q — so‘zlarni topib bo‘lmaydi. Cambridge audiosini ZIP bilan yuklaganda transkript ham qo‘shiladi.' : 'Bu matn uchun so‘z topilmadi. ' + (IE.cam ? '' : 'Cambridge lug‘atini Tools → So‘zlar orqali yuklang.')) + '</div>' : '<div class="two" style="margin-top:12px"><button class="btn" data-a="awall">🧠 Hammasini yodlashga</button><button class="btn ghost" data-go="vocab/cards/ana:' + c.ts + '">' + ic('cards') + ' Flesh-kartalar</button></div>') + '</div>' +
    (x.ws.length ? '<div class="seg" style="margin-top:12px">' + [['all', 'Hammasi'], ['left', 'Belgilanmagan'], ['found', 'Matnda topilgan']].map(f => '<button class="' + (c.wf === f[0] ? 'on' : '') + '" data-a="awf" data-v="' + f[0] + '">' + f[1] + '</button>').join('') + '</div><div id="awl">' + wordsList(x, c) + '</div>' : '');
}
const findWord = id => { const c = V.ana, rec = c && recOf(c.ts), u = unitOf(rec); return u ? IE.anaWords(u).find(w => w.id === id) : null; };
const repaintW = () => { const c = V.ana, rec = c && recOf(c.ts); if (!rec) return; const x = stats(rec), l = $('#awl'); if (l) l.innerHTML = wordsList(x, c); };
A.awf = el => { V.ana.wf = el.dataset.v; IE.draw(false); };
A.awtog = el => { const c = V.ana, id = el.dataset.id, d = $('#aw-' + CSS.escape(id)); if (!d) return; const o = d.classList.toggle('open'); o ? c.open.add(id) : c.open.delete(id); };
function mark(id, mode) { const c = V.ana, w = findWord(id); if (!w) return; const p = pg(c.ts); p.w[id] = mode; pput(c.ts, p); srsSet(w, mode); IE.save(); bump(); IE.vib(12); }
A.awlearn = el => { mark(el.dataset.id, 'learn'); repaintW(); IE.toast('Yodlash ro‘yxatiga qo‘shildi'); };
A.awknow = el => { mark(el.dataset.id, 'know'); repaintW(); };
A.awall = () => { const c = V.ana, rec = recOf(c.ts), x = stats(rec), p = pg(c.ts); let n = 0; x.ws.forEach(w => { if (!p.w[w.id]) { p.w[w.id] = 'learn'; srsSet(w, 'learn'); n++; } }); pput(c.ts, p); IE.save(); bump(); IE.toast(n ? n + ' ta so‘z yodlash ro‘yxatiga qo‘shildi' : 'Hammasi belgilangan'); IE.draw(false); };
A.awsheet = el => { const w = findWord(el.dataset.id); if (!w) return; const p = pg(V.ana.ts); IE.sheet('<h2>' + esc(w.w) + '</h2><div class="sm mu">' + esc(w.pos) + ' · ' + SRC[w.src] + '</div><div class="duz" style="font-size:20px;font-weight:800;color:var(--pl);margin:8px 0">' + esc(w.uz) + '</div>' + (w.def ? '<p class="df">' + esc(w.def) + '</p>' : '') + (w.ex ? '<p class="df"><em>“' + esc(w.ex) + '”</em></p>' : '') + '<div class="two" style="margin-top:14px"><button class="btn" data-a="awlearn2" data-id="' + esc(w.id) + '">🧠 Yodlayman</button><button class="btn ghost" data-a="awknow2" data-id="' + esc(w.id) + '">✓ Bilaman</button></div>'); };
A.awlearn2 = el => { mark(el.dataset.id, 'learn'); IE.closeSheet(); IE.toast('Qo‘shildi'); if (V.ana.tab === 't') IE.draw(false); };
A.awknow2 = el => { mark(el.dataset.id, 'know'); IE.closeSheet(); if (V.ana.tab === 't') IE.draw(false); };

/* ----- Savollar ----- */
const STI = { ok: '✓', no: '✗', em: '–' };
function exHTML(r) {
  if (!r) return '';
  return '<div class="aex"><div class="aex-h">' + ic('spark') + ' AI sharh</div>' + (r.trap ? '<span class="chip">' + esc(r.trap) + '</span>' : '') + '<p>' + esc(r.why || '') + '</p>' +
    (r.evidence ? '<div class="evt"><b>Matndan dalil</b><p><mark class="ev">' + esc(r.evidence) + '</mark></p></div>' : '') +
    ((r.para || []).length ? '<div class="apar">' + r.para.slice(0, 3).map(x => '<div><span>' + esc(x.q) + '</span><i>→</i><span>' + esc(x.p) + '</span></div>').join('') + '</div>' : '') +
    (r.mine ? '<div class="cnote" style="margin-top:8px"><b>Sizning javobingiz</b>' + esc(r.mine) + '</div>' : '') + (r.tip ? '<div class="tip8" style="margin-top:8px"><b>Maslahat:</b> ' + esc(r.tip) + '</div>' : '') +
    ((r.words || []).length ? '<div class="dchips" style="margin-top:8px">' + r.words.slice(0, 4).map(w => '<button class="chip dc" data-go="dict/' + encodeURIComponent(String(w.w).split(' ')[0].replace(/[^A-Za-z-]/g, '')) + '">' + esc(w.w) + ' · ' + esc(w.uz) + '</button>').join('') + '</div>' : '') + '</div>';
}
function qcard(r, c, rec, u) {
  const cached = lsGet(QK(c.ts, r.n), null), busy = c.busy[r.n];
  return '<div class="aq ' + (r.ok ? 'ok' : r.em ? 'em' : 'no') + '" id="aq' + r.n + '"><div class="row" style="align-items:flex-start;gap:10px"><span class="aqn">' + r.n + '</span><div style="flex:1;min-width:0"><div class="aqt">' + esc(qtext(r.g, r.q)) + '</div><div class="aqa"><span class="' + (r.ok ? 'g' : 'b') + '">' + STI[r.ok ? 'ok' : r.em ? 'em' : 'no'] + ' ' + esc(mineTxt(r.g, r.q, r.a)) + '</span>' + (r.ok ? '' : '<span class="g">✓ ' + esc(corrTxt(r.g, r.q)) + '</span>') + '</div>' +
    (r.ty ? '<div class="aty"><b>' + esc(r.ty.t) + '</b><span>' + esc(r.ty.tip) + '</span></div>' : '') + '</div></div>' +
    '<div class="aqb"><button class="chip" data-a="ev" data-k="' + (u.L ? 'L' : 'R') + '" data-u="' + esc(u.id) + '" data-n="' + r.n + '">' + ic('eye') + ' Dalil (matn)</button><button class="chip hot" data-a="aqai" data-n="' + r.n + '"' + (busy ? ' disabled' : '') + '>' + ic('spark') + ' ' + (cached ? 'AI sharhni ko‘rsatish' : r.ok ? 'Nega to‘g‘ri?' : 'Nega xato?') + '</button></div><div id="aexp' + r.n + '">' + (busy ? '<div class="mu sm row" style="gap:8px;padding:8px 0"><span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> AI tahlil qilmoqda…</div>' : (cached && c.open.has('q' + r.n) ? exHTML(cached) : '')) + '</div></div>';
}
function qTab(x, c, rec) {
  const f = c.qf, rows = x.rows.filter(r => f === 'all' || (f === 'no' && !r.ok) || (f === 'ok' && r.ok));
  return '<div class="seg">' + [['no', 'Xatolar ' + x.wrong.length], ['ok', 'To‘g‘ri ' + (x.rows.length - x.wrong.length)], ['all', 'Hammasi']].map(t => '<button class="' + (f === t[0] ? 'on' : '') + '" data-a="aqf" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>' +
    (rows.length ? rows.map(r => qcard(r, c, rec, x.u)).join('') : '<div class="card empty">' + bd('check', 'R') + 'Bu bo‘limda savol yo‘q.</div>');
}
A.aqf = el => { V.ana.qf = el.dataset.v; IE.draw(false); };
function ctxOf(u, g, q) {
  const f = evOf(u, q);
  if (u.L) { const i = f ? u.paras.indexOf(f.pa) : -1, seg = i >= 0 ? u.paras.slice(Math.max(0, i - 3), i + 4) : u.paras; return 'LISTENING TRANSCRIPT (this is an audio script; the question is from the IELTS Listening test):\n' + seg.map(p => '[' + p.k + '] ' + p.t).join('\n'); }
  if (f && f.pa) return 'Paragraph ' + f.pa.k + ':\n' + f.pa.t + (f.frag ? '\n(Evidence fragment: ' + f.frag + ')' : '');
  return u.paras.map(p => p.k + '. ' + p.t).join('\n\n');
}
A.aqai = async el => {
  const c = V.ana, n = +el.dataset.n, rec = recOf(c.ts), u = unitOf(rec), r = qrows(u, rec).find(x => x.n === n), slot = () => $('#aexp' + n); if (!r) return;
  const cached = lsGet(QK(c.ts, n), null);
  if (cached) { const s = slot(); if (!s) return; const show = !s.innerHTML; s.innerHTML = show ? exHTML(cached) : ''; show ? c.open.add('q' + n) : c.open.delete('q' + n); el.innerHTML = ic('spark') + ' ' + (show ? 'AI sharhni yashirish' : 'AI sharhni ko‘rsatish'); return; }
  c.busy[n] = 1; const s0 = slot(); if (s0) s0.innerHTML = '<div class="mu sm row" style="gap:8px;padding:8px 0"><span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> AI tahlil qilmoqda…</div>'; el.disabled = true;
  try {
    const out = await SB.fn('ielts-dict', { mode: 'qa', qa: { type: (u.L ? 'L-' : '') + r.g.type, q: qtext(r.g, r.q), opts: r.g.type === 'mcq' ? r.q.o.map((o, i) => 'ABCDEFGHIJ'[i] + '. ' + o).join('\n') : r.g.type === 'heads' ? r.g.headings.map(h => h.id + '. ' + h.t).join('\n') : '', correct: corrTxt(r.g, r.q), mine: r.em ? '' : mineTxt(r.g, r.q, r.a), ctx: ctxOf(u, r.g, r.q) } });
    const res = out.result || {}; if (res.error || !res.why) throw new Error(res.error || 'AI javobi bo‘sh');
    lsSet(QK(c.ts, n), res); const p = pg(c.ts); p.op[n] = 1; pput(c.ts, p); bump(); c.open.add('q' + n);
    delete c.busy[n]; if (slot()) slot().innerHTML = exHTML(res); el.disabled = false; el.innerHTML = ic('spark') + ' AI sharhni yashirish';
  } catch (e) { delete c.busy[n]; if (slot()) slot().innerHTML = '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:8px">' + esc(e.net ? 'Internetga ulanib bo‘lmadi.' : (e.message || 'AI xatosi')) + '</p>'; el.disabled = false; }
};

/* ----- Qayta yechish ----- */
function ctrl(r, c) {
  const n = r.n, g = r.g, q = r.q;
  if (g.type === 'tfng') return '<div class="tf">' + ['TRUE', 'FALSE', 'NOT GIVEN'].map(v => '<button class="opt" data-a="artry" data-n="' + n + '" data-v="' + v + '">' + v + '</button>').join('') + '</div>';
  if (g.type === 'mcq') return '<div class="opts">' + q.o.map((o, i) => '<button class="opt" data-a="artry" data-n="' + n + '" data-v="' + i + '"><i>' + 'ABCDEFGHIJ'[i] + '</i><span>' + esc(o) + '</span></button>').join('') + '</div>';
  if (g.type === 'heads') return '<div class="opts">' + g.headings.map(h => '<button class="opt" data-a="artry" data-n="' + n + '" data-v="' + esc(h.id) + '"><i>' + esc(h.id) + '</i><span>' + esc(h.t) + '</span></button>').join('') + '</div>';
  return '<div class="row" style="gap:8px"><input class="fill" id="arf' + n + '" placeholder="Javobingiz" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1"><button class="btn" data-a="artry" data-n="' + n + '" data-f="1">Tekshirish</button></div>';
}
function rcard(r, c, p, u) {
  const n = r.n, fx = p.fx[n], gv = p.gv[n], tr = c.tries[n] || 0;
  return '<div class="aq ' + (fx ? 'ok' : 'no') + '" id="ar' + n + '"><div class="row" style="align-items:flex-start;gap:10px"><span class="aqn">' + n + '</span><div style="flex:1;min-width:0"><div class="aqt">' + esc(qtext(r.g, r.q)) + '</div>' +
    (fx ? '<div class="aqa"><span class="g">✓ Tuzatildi: ' + esc(corrTxt(r.g, r.q)) + '</span></div>' : gv ? '<div class="aqa"><span class="g">✓ ' + esc(corrTxt(r.g, r.q)) + '</span></div><div class="sm mu">Javob ko‘rsatildi — tuzatilgan hisoblanmaydi.</div>' : '<div class="aqa"><span class="b">Avvalgi javob: ' + esc(mineTxt(r.g, r.q, r.a)) + '</span></div><div class="mu sm" style="margin:6px 0 8px">' + (tr ? 'Yana urinib ko‘ring (' + tr + '-xato). Matn dalilidan foydalaning.' : 'Dalilni matndan topib, qayta yeching:') + '</div>' + ctrl(r, c)) + '</div></div>' +
    (fx || gv ? '' : '<div class="aqb"><button class="chip" data-a="ev" data-k="' + (u.L ? 'L' : 'R') + '" data-u="' + esc(u.id) + '" data-n="' + n + '">' + ic('eye') + ' Dalil (matn)</button><button class="chip" data-a="argive" data-n="' + n + '">Javobni ko‘rsat</button></div>') + '</div>';
}
function retryTab(x, c, rec) {
  const p = x.p; if (!x.wrong.length) return '<div class="card c rise"><div style="font-size:44px">🎉</div><b style="font-size:18px">Xato yo‘q!</b><div class="sm mu" style="margin-top:6px">Hamma javob to‘g‘ri edi. “Savollar” bo‘limida sabablarni o‘qing, “So‘zlar”ni yodlang.</div></div>';
  const todo = x.wrong.filter(r => !p.fx[r.n]), done = x.wrong.filter(r => p.fx[r.n]);
  return '<div class="card rise"><div class="row" style="justify-content:space-between"><b>Qayta yechish</b><span class="chip">' + x.fixed + ' / ' + x.wrong.length + '</span></div><div class="sm mu" style="margin-top:4px">Xato qilgan savollaringizni matnga qarab qayta yeching. To‘g‘ri javob avtomatik yashirilgan.</div><div class="prog" style="margin-top:8px"><i style="width:' + (x.fixed / x.wrong.length * 100) + '%"></i></div></div>' +
    todo.map(r => rcard(r, c, p, x.u)).join('') + (done.length ? '<div class="sec"><h2>Tuzatilganlar</h2></div>' + done.map(r => rcard(r, c, p, x.u)).join('') : '');
}
A.artry = el => {
  const c = V.ana, n = +el.dataset.n, rec = recOf(c.ts), u = unitOf(rec), r = qrows(u, rec).find(x => x.n === n); if (!r) return;
  let v = el.dataset.f ? ($('#arf' + n) || {}).value : el.dataset.v; if (v == null || String(v).trim() === '') return IE.toast('Javob yozing');
  if (r.g.type === 'mcq') v = +v;
  if (IE.isOk(r.g, r.q, v)) {
    const p = pg(c.ts); p.fx[n] = 1; pput(c.ts, p); bump(); IE.vib([15, 30, 15]); const all = qrows(u, rec).filter(z => !z.ok).every(z => p.fx[z.n]);
    IE.draw(false); if (all) { IE.confetti(); IE.toast('Hamma xato tuzatildi! 🎉'); } else IE.toast('To‘g‘ri! ✓');
  } else { c.tries[n] = (c.tries[n] || 0) + 1; IE.vib([30, 40, 30]); const card = $('#ar' + n); if (card) { card.classList.remove('shake'); void card.offsetWidth; card.classList.add('shake'); } IE.toast(c.tries[n] >= 2 ? 'Yana xato — “Dalil (matn)”ni oching' : 'Noto‘g‘ri, yana urinib ko‘ring'); const t = card && card.querySelector('.mu.sm'); if (t) t.textContent = 'Yana urinib ko‘ring (' + c.tries[n] + '-xato). Matn dalilidan foydalaning.'; }
};
A.argive = el => { const c = V.ana, p = pg(c.ts); p.gv[+el.dataset.n] = 1; pput(c.ts, p); IE.draw(false); };

/* ----- Matn ----- */
function textTab(x, c) {
  const u = x.u, p = x.p, tm = c.tm; if (!u.paras.length) return '<div class="card empty rise">' + bd('doc', 'L') + 'Bu audio uchun skript (transkript) yo‘q.</div>'; const marks = u.paras.map(() => []);
  if (tm === 'w') x.ws.forEach(w => w.hits.forEach(h => marks[h.pi].push({ a: h.i, b: h.i + h.len, o: '<span class="vw ' + wsy(p, w.id) + '" data-a="awsheet" data-id="' + esc(w.id) + '">', c: '</span>' })));
  else x.rows.forEach(r => { const f = evOf(u, r.q); if (!f || !f.pa) return; const pi = u.paras.indexOf(f.pa), rx = f.frag && IE.fragRx ? IE.fragRx(f.frag) : null, m = rx && rx.exec(f.pa.t); const cls = r.ok ? 'ok' : 'no'; if (m) marks[pi].push({ a: m.index, b: m.index + m[0].length, o: '<mark class="ev ' + cls + '" data-a="ev" data-k="' + (u.L ? 'L' : 'R') + '" data-u="' + esc(u.id) + '" data-n="' + r.n + '">', c: '<sup>' + r.n + '</sup></mark>' }); else marks[pi].push({ a: -1, b: -1, badge: '<span class="pbd ' + cls + '" data-a="ev" data-k="' + (u.L ? 'L' : 'R') + '" data-u="' + esc(u.id) + '" data-n="' + r.n + '">' + r.n + '</span>' }); });
  const paras = u.paras.map((pa, i) => {
    const ms = marks[i].filter(m => m.a >= 0).sort((a, b) => a.a - b.a), bd2 = marks[i].filter(m => m.a < 0).map(m => m.badge).join(''); let out = '', pos = 0;
    ms.forEach(m => { if (m.a < pos) return; out += esc(pa.t.slice(pos, m.a)) + m.o + esc(pa.t.slice(m.a, m.b)) + m.c; pos = m.b; });
    out += esc(pa.t.slice(pos)); return '<p class="atp"><b class="apk">' + esc(pa.k) + '</b>' + out + (bd2 ? '<span class="pbds">' + bd2 + '</span>' : '') + '</p>';
  }).join('');
  return '<div class="seg">' + [['w', 'So‘zlar (' + x.ws.filter(w => w.found).length + ')'], ['e', 'Dalillar']].map(t => '<button class="' + (tm === t[0] ? 'on' : '') + '" data-a="atm" data-v="' + t[0] + '">' + t[1] + '</button>').join('') + '</div><div class="mu xs" style="margin:2px 2px 10px">' + (tm === 'w' ? 'Bo‘yalgan so‘zni bossangiz — ma’nosi va yodlash tugmasi.' : 'Yashil — to‘g‘ri, qizil — xato savolning dalil joyi. Raqamni bossangiz tafsilot.') + '</div><div class="card atext">' + paras + '</div>';
}
A.atm = el => { V.ana.tm = el.dataset.v; IE.draw(false); };

/* ----- So‘zlar testi ----- */
function quizTab(x, c) {
  const pool = x.ws.filter(w => w.uz); if (pool.length < 4) return '<div class="card empty rise">' + bd('target', 'R') + 'Test uchun kamida 4 ta ma’noli so‘z kerak.<br>Bu matnda ' + pool.length + ' ta.</div>';
  if (!c.z) return '<div class="card c rise" style="padding:22px 16px"><div style="font-size:44px">🎯</div><b style="font-size:18px">So‘zlar testi</b><div class="sm mu" style="margin:6px 0 14px">Shu matndagi ' + Math.min(10, pool.length) + ' ta so‘z bo‘yicha qisqa test. To‘g‘ri javob so‘zni xotirada mustahkamlaydi, xato esa takrorga qaytaradi.</div><button class="btn block" data-a="azgo">' + ic('play') + ' Boshlash</button>' + (x.p.bs ? '<div class="sm mu" style="margin-top:10px">Eng yaxshi natija: <b>' + Math.round(x.p.bs) + '%</b></div>' : '') + '</div>';
  const z = c.z;
  if (z.i >= z.qs.length) { const pc = Math.round(z.ok / z.qs.length * 100); return '<div class="res anim"><div class="lbl">Natija</div><div class="big">' + z.ok + '<span style="font-size:32px">/' + z.qs.length + '</span></div><div class="mu" style="margin:8px 0 18px">' + (pc >= 80 ? 'Ajoyib! So‘zlar yaxshi o‘zlashtirildi 🎉' : pc >= 50 ? 'Yomon emas — xato so‘zlar takrorlashga qo‘shildi.' : 'Xato so‘zlar takrorlashga qo‘shildi — ularni yana ko‘rib chiqing.') + '</div><div class="two"><button class="btn ghost" data-a="anatab" data-v="w">So‘zlarga</button><button class="btn" data-a="azgo">Qayta</button></div></div>'; }
  const q = z.qs[z.i];
  return '<div class="prog" style="margin:4px 0 6px"><i style="width:' + (z.i / z.qs.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:10px">' + (z.i + 1) + ' / ' + z.qs.length + '</div><div class="card c rise" style="padding:20px 16px"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">' + (q.k === 'def' ? 'Ta’rif qaysi so‘zga tegishli?' : 'Ma’nosini toping') + '</div><div style="font-size:' + (q.k === 'def' ? 16 : 28) + 'px;font-weight:900;margin:10px 0">' + esc(q.k === 'def' ? q.w.def : q.w.w) + '</div></div>' +
    '<div class="opts" style="margin-top:12px">' + q.o.map((o, i) => '<button class="opt' + (z.pick != null ? (i === q.ci ? ' on ok' : i === z.pick ? ' on no' : '') : '') + '" data-a="aza" data-i="' + i + '"' + (z.pick != null ? ' disabled' : '') + '><i>' + 'ABCD'[i] + '</i><span>' + esc(o) + '</span></button>').join('') + '</div>' + (z.pick != null ? '<button class="btn block" style="margin-top:12px" data-a="azn">' + (z.i + 1 >= z.qs.length ? 'Natija' : 'Keyingisi') + '</button>' : '');
}
A.azgo = () => {
  const c = V.ana, rec = recOf(c.ts), x = stats(rec), pool = x.ws.filter(w => w.uz), pick = shuffle(pool).slice(0, 10);
  c.z = { i: 0, ok: 0, pick: null, qs: pick.map(w => { const k = w.def && !new RegExp(w.w.split(/[ /]/)[0].slice(0, 4), 'i').test(w.def) && Math.random() < .35 ? 'def' : 'uz', others = shuffle(pool.filter(o => o !== w && (k === 'def' ? o.w : o.uz) !== (k === 'def' ? w.w : w.uz))).slice(0, 3), o = shuffle([w, ...others]); return { w, k, o: o.map(y => k === 'def' ? y.w : y.uz), ci: o.indexOf(w) }; }) };
  IE.draw(false);
};
A.aza = el => { const z = V.ana.z; if (!z || z.pick != null) return; const q = z.qs[z.i], i = +el.dataset.i; z.pick = i; const ok = i === q.ci; if (ok) { z.ok++; srsSet(q.w, 'know'); IE.vib(12); } else { srsSet(q.w, 'learn'); IE.vib([20, 40]); } IE.save(); IE.draw(false); };
A.azn = () => { const c = V.ana, z = c.z; z.i++; z.pick = null; if (z.i >= z.qs.length) { const pc = z.ok / z.qs.length * 100, p = pg(c.ts); p.bs = Math.max(p.bs || 0, pc); pput(c.ts, p); bump(); if (pc >= 80) IE.confetti(); } IE.draw(false); };

/* ---------- boshqa joylarga ulash ---------- */
IE.anaCta = (rec, kind) => {
  const s = IE.anaSummary(rec); if (!s) return '';
  return '<div class="pad" style="padding-bottom:0"><button class="aibn rise" data-go="ana/' + (kind === 'L' ? 'l' : '') + rec.ts + '">' + bd('bulb', 'W', 'lg') + '<div style="flex:1"><h3>Tahlil qilish</h3><p>' + s.words + ' ta so‘z · ' + s.wrong + ' ta xato — nega xato, nega to‘g‘ri, qayta yechish</p></div><span class="go">' + ic('next') + '</span></button></div>';
};
})();
