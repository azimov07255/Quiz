/* IELTS · Cambridge Reading va Listening: shaxsiy import. Kitob (PDF) sahifalaridan AI yordamida test tuziladi;
   natija FAQAT shu qurilmada (IndexedDB) saqlanadi — repoga ham, bulutga ham chiqmaydi (mualliflik huquqi). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet } = IE, R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const sub = (title, back, inner) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1></header><div class="scr sub">' + inner + '</div>', sub: true });
const KEY = 'camt', TYPES = ['heads', 'tfng', 'fill', 'mcq'];
let store = { reading: [], listening: [], writing: [], speaking: [], del: {} };
const cloudOn = () => lsGet('ielts:camcloud', 1) !== 0;
let syncT = 0;
/** Mahalliy saqlash + (yoqilgan bo‘lsa) bulutga sinxronlashni rejalashtirish. */
const persist = async () => { await IE.idbSet(KEY, store); clearTimeout(syncT); syncT = setTimeout(() => camSync().catch(() => {}), 1500); };

/* ---------- bulut: shaxsiy Storage (<uid>/cam/...) ---------- */
const uidP = p => { const s = window.SB && SB.session(); return s && s.user ? '/storage/v1/object/ielts-books/' + s.user.id + '/cam/' + p : null; };
async function cPut(p, body, type) {
  const u = uidP(p); if (!u) throw new Error('Kirmagansiz');
  const r = await SB.raw(u, { method: 'POST', headers: { 'content-type': type, 'x-upsert': 'true' }, body });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || j.error || ('HTTP ' + r.status)); }
}
async function cGet(p) { const u = uidP(p); if (!u) return null; const r = await SB.raw(u.replace('/object/', '/object/authenticated/')); return r.ok ? r : null; }
async function cDel(p) { const u = uidP(p); if (u) { try { await SB.raw(u, { method: 'DELETE' }); } catch (e) { /* */ } } }
function mergeStore(a, b) {
  const del = {}; [a.del, b.del].forEach(d => Object.keys(d || {}).forEach(k => { del[k] = Math.max(del[k] || 0, d[k] || 0); }));
  const out = { reading: [], listening: [], writing: [], speaking: [], del };
  ['reading', 'listening', 'writing', 'speaking'].forEach(k => { const m = new Map(); [...(a[k] || []), ...(b[k] || [])].forEach(u => { if (!u || !u.id) return; const o = m.get(u.id); if (!o || (u.mt || 0) > (o.mt || 0) || ((u.mt || 0) === (o.mt || 0) && u.cau && !o.cau)) m.set(u.id, u); }); out[k] = [...m.values()].filter(u => !(del[u.id] && del[u.id] >= (u.mt || 0))); });
  return out;
}
let syncing = null;
/** Bulutdagi indeks bilan qo‘shadi (id bo‘yicha, oxirgi o‘zgargani yutadi), kerak bo‘lsa audioni yuklaydi. true — mahalliy o‘zgardi. */
function camSync(manual) {
  if (syncing) return syncing;
  return syncing = (async () => {
    if (!cloudOn() || !window.SB || !SB.session()) return false;
    let remote = { reading: [], listening: [], writing: [], speaking: [], del: {} };
    try { const r = await cGet('index.json'); if (r) { const j = await r.json(); if (j && Array.isArray(j.reading)) remote = { reading: j.reading, listening: j.listening || [], writing: j.writing || [], speaking: j.speaking || [], del: j.del || {} }; } } catch (e) { if (manual) IE.toast(navigator.onLine ? 'Bulutga ulanib bo‘lmadi' : 'Internet yo‘q'); return false; }
    const before = JSON.stringify(store), merged = mergeStore(store, remote);
    let dirty = JSON.stringify(merged) !== JSON.stringify(remote);
    // audio: mahalliy bor, bulutda yo‘q → yuklash
    for (const u of merged.listening) {
      if (u.cau) continue;
      let a = null; try { a = await IE.idbGet('camaud:' + u.id); } catch (e) { /* */ }
      if (!a || !a.buf) continue;
      if (a.buf.byteLength > 50 * 1048576) { if (manual) IE.toast('Audio 50 MB dan katta — bulutga sig‘maydi'); continue; }
      try { await cPut('aud-' + u.id, new Blob([a.buf], { type: a.type || 'audio/mpeg' }), a.type || 'audio/mpeg'); u.cau = 1; u.mt = Date.now(); dirty = true; } catch (e) { /* keyingi safar */ }
    }
    if (dirty) { try { await cPut('index.json', JSON.stringify(merged), 'application/json'); } catch (e) { if (manual) IE.toast('Bulutga yozilmadi: ' + e.message); } }
    const changed = JSON.stringify(merged) !== before;
    if (changed) { store = merged; await IE.idbSet(KEY, store); inject(); if ((IE.curRoute || '') === 'cambridge' && !$('#sheet')) IE.draw(false); }
    if (manual) IE.toast(changed || dirty ? 'Sinxronlandi' : 'Hammasi yangi');
    return changed;
  })().finally(() => { syncing = null; });
}
IE.camSync = camSync; IE.camStore = () => store; IE.camSave = async () => { inject(); await persist(); };
function inject() {
  if (D.prompts) {
    D.prompts.sp1 = (D.prompts.sp1 || []).filter(x => !x.priv).concat((store.speaking || []).filter(u => u.p1 && u.p1.length).map(u => ({ t: u.cam + ' · Part 1', q: u.p1, priv: u.id })));
    D.prompts.sp2 = (D.prompts.sp2 || []).filter(x => !x.priv).concat((store.speaking || []).filter(u => u.p2 && u.p2.t).map(u => ({ t: u.p2.t, b: u.p2.b || [], f: u.p3 || [], priv: u.id, cam: u.cam })));
  }
  if (D.reading && D.reading.passages) D.reading.passages = D.reading.passages.filter(p => !p.priv).concat(store.reading.map(p => Object.assign({}, p, { priv: 1 })));
  if (D.listening && D.listening.tests) {
    const old = new Map((D.listening.tests || []).filter(t => t.priv).map(t => [t.id, t]));
    D.listening.tests = D.listening.tests.filter(t => !t.priv).concat(store.listening.map(t => { const o = old.get(t.id), keep = o ? { audio: o.audio, noaudio: o.noaudio } : {}; return Object.assign(o || {}, t, { priv: 1 }, keep); }));
  }
}
IE.camLoad = async () => { try { const s = await IE.idbGet(KEY); if (s && Array.isArray(s.reading) && Array.isArray(s.listening)) store = Object.assign({ del: {} }, s); } catch (e) { /* */ } store.writing = store.writing || []; store.speaking = store.speaking || []; inject(); setTimeout(() => camSync().catch(() => {}), 800); };

/* ---------- tekshirish va tozalash ---------- */
function normGroups(rg, warn) {
  const out = [];
  (Array.isArray(rg) ? rg : []).forEach(g => {
    const type = TYPES.includes(g && g.type) ? g.type : null; if (!type) { warn.push('Noma’lum savol turi o‘tkazib yuborildi'); return; }
    const ng = { type, title: String(g.title || 'Questions').slice(0, 80), note: String(g.note || '').slice(0, 500), qs: [] };
    if (type === 'heads') { ng.headings = (Array.isArray(g.headings) ? g.headings : []).map(h => ({ id: String(h.id || '').toLowerCase().trim(), t: String(h.t || '').trim() })).filter(h => h.id && h.t); if (!ng.headings.length) { warn.push(ng.title + ': sarlavhalar ro‘yxati topilmadi'); return; } }
    (Array.isArray(g.qs) ? g.qs : []).forEach(q => {
      const n = parseInt(q && q.n, 10); if (!n) return; const nq = { n, why: String(q.why || '').slice(0, 300) };
      if (type === 'heads') { const a = String(q.a || '').toLowerCase().trim(); if (!ng.headings.some(h => h.id === a)) { warn.push(n + '-savol: javob kaliti aniq emas'); return; } nq.para = String(q.para || '').trim(); nq.a = a; }
      else if (type === 'tfng') { const m = { TRUE: 'TRUE', YES: 'TRUE', FALSE: 'FALSE', NO: 'FALSE', 'NOT GIVEN': 'NOT GIVEN', NG: 'NOT GIVEN' }, a = m[String(q.a || '').toUpperCase().trim()]; if (!a) { warn.push(n + '-savol: javob kaliti aniq emas'); return; } nq.q = String(q.q || ''); nq.a = a; }
      else if (type === 'mcq') { const o = (Array.isArray(q.o) ? q.o : []).map(x => String(x)); let a = q.a; if (typeof a === 'string' && /^[A-J]$/i.test(a.trim())) a = 'ABCDEFGHIJ'.indexOf(a.trim().toUpperCase()); a = parseInt(a, 10); if (o.length < 2 || !(a >= 0 && a < o.length)) { warn.push(n + '-savol: variantlar yoki javob noto‘g‘ri'); return; } nq.q = String(q.q || ''); nq.o = o; nq.a = a; }
      else { const a = (Array.isArray(q.a) ? q.a : [q.a]).map(x => String(x == null ? '' : x).trim()).filter(Boolean); if (!a.length) { warn.push(n + '-savol: javob topilmadi'); return; } nq.q = String(q.q || ''); nq.a = a; }
      if (q.p != null && isFinite(+q.p)) nq.p = +q.p; if (q.t != null && isFinite(+q.t)) nq.t = +q.t;
      ng.qs.push(nq);
    });
    ng.qs.sort((a, b) => a.n - b.n); if (ng.qs.length) out.push(ng);
  });
  const seen = new Set(); out.forEach(g => { g.qs = g.qs.filter(q => !seen.has(q.n) && seen.add(q.n)); });
  return out.filter(g => g.qs.length);
}
const nqs = gs => gs.reduce((s, g) => s + g.qs.length, 0);
/** raw (AI yoki JSON) → ilova formati. kind: 'r' | 'l'. */
function normUnit(kind, raw, label, which) {
  if (!raw || typeof raw !== 'object') throw new Error('Natija tushunarsiz');
  const warn = [], groups = normGroups(raw.groups, warn);
  if (nqs(groups) < 4) throw new Error('Yetarli savol topilmadi (' + nqs(groups) + ' ta). Sahifa oralig‘ini tekshiring.');
  const id = 'c' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5), title = String(raw.title || label || 'Cambridge').slice(0, 120), topic = String(raw.topic || 'Cambridge').slice(0, 40);
  if (kind === 'r') {
    let paras = (Array.isArray(raw.paras) ? raw.paras : []).map((p, i) => ({ k: String(p.k || i + 1).slice(0, 3), t: String(p.t || '').trim() })).filter(p => p.t);
    if (paras.length < 2 || paras.reduce((s, p) => s + p.t.length, 0) < 300) throw new Error('Matn (passage) to‘liq chiqmadi. Sahifalarni tekshiring.');
    if (new Set(paras.map(p => p.k)).size !== paras.length) paras = paras.map((p, i) => Object.assign(p, { k: String(i + 1) }));
    return { unit: { id, mt: Date.now(), title, topic, level: 'Cambridge IELTS', cam: label || title, paras, groups }, warn };
  }
  const tr = (Array.isArray(raw.tr) ? raw.tr : []).map(x => ({ t: null, x: String(x.x || x.t || '').trim() })).filter(x => x.x);
  return { unit: { id, mt: Date.now(), title, topic: 'Cambridge · ' + title, sec: 'Section ' + (which || ''), level: 'Cambridge IELTS', cam: label || title, audio: '', dur: 0, credit: { name: 'Cambridge IELTS (shaxsiy nusxa)', url: '' }, tr, groups }, warn };
}
const answerTxt = (g, q) => g.type === 'mcq' ? 'ABCDEFGHIJ'[q.a] + ' — ' + (q.o[q.a] || '') : Array.isArray(q.a) ? q.a.join(' / ') : q.a;

/* ---------- audio (qurilmada) ---------- */
IE.camAudio = async (id, file, quiet) => {
  const t = store.listening.find(x => x.id === id); if (!t) return;
  const dur = await new Promise(res => { const a = new Audio(), u = URL.createObjectURL(file); a.preload = 'metadata'; a.onloadedmetadata = () => { res(isFinite(a.duration) ? Math.round(a.duration) : 0); URL.revokeObjectURL(u); }; a.onerror = () => { res(-1); URL.revokeObjectURL(u); }; a.src = u; });
  if (dur < 0) return IE.toast('Bu audio fayl ochilmadi (mp3/m4a/wav bo‘lsin)');
  await IE.idbSet('camaud:' + id, { buf: await file.arrayBuffer(), type: file.type || 'audio/mpeg' });
  t.dur = dur; t.mt = Date.now(); t.cau = 0; await persist(); const live = D.listening.tests.find(x => x.id === id); if (live) { if (live.audio) { try { URL.revokeObjectURL(live.audio); } catch (e) { /* */ } } live.dur = dur; live.audio = ''; live.noaudio = false; }
  if (!quiet) { IE.toast('Audio saqlandi (' + Math.floor(dur / 60) + ':' + String(dur % 60).padStart(2, '0') + ')'); IE.draw(false); }
};
/** Listening ochilganda: IDB dagi audioni blob-URL ga aylantiradi. */
IE.camEnsure = async t => {
  if (t.audio || t.noaudio) return;
  try { const r = await IE.idbGet('camaud:' + t.id); if (r && r.buf) { t.audio = URL.createObjectURL(new Blob([r.buf], { type: r.type })); return; } } catch (e) { /* */ }
  if (t.cau && cloudOn()) { try { const r = await cGet('aud-' + t.id); if (r) { const buf = await r.arrayBuffer(), type = (r.headers.get('content-type') || 'audio/mpeg').split(';')[0]; await IE.idbSet('camaud:' + t.id, { buf, type }); t.audio = URL.createObjectURL(new Blob([buf], { type })); return; } } catch (e) { /* */ } }
  t.noaudio = true;
};
IE.camAttach = t => '<div class="card c" style="margin-top:12px">' + bd('head', 'L', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<b>Audio fayl kerak</b><p class="mu sm" style="margin:6px 0 12px">Cambridge CD/yuklab olingan yozuvdan shu bo‘limga mos mp3 faylni tanlang (faqat shu qurilmada saqlanadi).</p><label class="btn block">' + ic('down') + ' Audio tanlash<input type="file" accept="audio/*,.mp3,.m4a,.wav" id="camaf" data-id="' + esc(t.id) + '" hidden></label></div>';

/* ---------- markaz ---------- */
const kindOf = k => k === 'l' ? 'listening' : k === 'w' ? 'writing' : k === 's' ? 'speaking' : 'reading';
const rowH = (k, x) => {
  const nq = nqs(x.groups), noAud = k === 'l' && !(x.dur > 0);
  return '<div class="item" style="padding:8px 8px 8px 12px"><button class="row" style="flex:1;min-width:0;text-align:left" data-go="' + (k === 'r' ? 'reading/' + x.id + '/run' : 'listening/' + x.id) + '">' + bd(k === 'r' ? 'book' : 'head', k === 'r' ? 'R' : 'L', 'sm') + '<div class="tx"><b>' + esc(x.cam || x.title) + '</b><span>' + esc(x.title) + ' · ' + nq + ' savol' + (noAud ? ' · <b style="color:var(--warn)">audio yo‘q</b>' : '') + '</span></div></button><button class="ib" data-a="camdel" data-k="' + k + '" data-id="' + x.id + '" aria-label="O‘chirish">' + ic('trash') + '</button></div>';
};
R.cambridge = a => a[0] === 'new' ? form(a[1] === 'l' ? 'l' : 'r') : a[0] === 'book' ? bookAuto() : a[0] === 't' ? testPage(decodeURIComponent(a[1] || ''), +a[2]) : a[0] === 's' && IE.camScores ? IE.camScores(decodeURIComponent(a[1] || ''), +a[2]) : hub();
/* ---------- tartib: Kitob → Test → Listening / Reading / Writing / Speaking ---------- */
const parseCam = u => { const m = /^(.*?)\s*·\s*Test\s*(\d+)\s*·\s*(?:Passage|Section)\s*(\d)\s*$/i.exec(u.cam || ''); return m ? { book: m[1].trim(), n: +m[2], i: +m[3] } : null; };
const lastRec = (k, id) => { const L = k === 'r' ? IE.S().reads.filter(r => r.p === id) : IE.S().listens.filter(r => r.id === id); return L.length ? L[L.length - 1] : null; };
/** Kitoblar bo‘yicha guruhlaydi: Map(kitob → Map(n → {R:{i:unit}, L:{i:unit}})); guruhga tushmaganlar alohida. */
function groups() {
  const books = new Map(), loose = { r: [], l: [] };
  [['r', store.reading], ['l', store.listening]].forEach(([k, list]) => list.forEach(u => { const p = parseCam(u); if (!p) return void loose[k].push(u); const bk = books.get(p.book) || books.set(p.book, new Map()).get(p.book), t = bk.get(p.n) || bk.set(p.n, { R: {}, L: {} }).get(p.n); t[k.toUpperCase()][p.i] = u; }));
  const tst = (book, n) => { const bk = books.get(book) || books.set(book, new Map()).get(book); return bk.get(n) || bk.set(n, { R: {}, L: {} }).get(n); };
  (store.writing || []).forEach(u => { if (u.book && u.n) (tst(u.book, u.n).W = tst(u.book, u.n).W || {})[u.task] = u; });
  (store.speaking || []).forEach(u => { if (u.book && u.n) tst(u.book, u.n).S = u; });
  return { books: [...books.entries()].sort((a, b) => natCmp(b[0], a[0])), loose };
}
/** Bitta ko‘nikma bo‘yicha: { done, need, band } — band faqat hamma qism topshirilganda. */
function skill(t, k) {
  const need = k === 'L' ? 4 : 3, us = Object.values(t[k]), rs = us.map(u => lastRec(k === 'L' ? 'l' : 'r', u.id)).filter(Boolean), done = rs.length;
  const band = done === need && us.length === need ? (k === 'L' ? IE.bandL : IE.band)(rs.reduce((s, r) => s + r.raw, 0), rs.reduce((s, r) => s + r.tot, 0)) : null;
  return { done, need, have: us.length, band };
}
const overall = t => { const b = [skill(t, 'L').band, skill(t, 'R').band, IE.camWskill ? IE.camWskill(t).band : null, IE.camSskill ? IE.camSskill(t).band : null].filter(x => x != null); return b.length ? Math.round(b.reduce((s, x) => s + x, 0) / b.length * 2) / 2 : null; };
const chipS = sk => sk.band != null ? '<span class="v">' + IE.bandTxt(sk.band) + '</span>' : sk.have ? '<span class="v mu">' + sk.done + '/' + sk.need + '</span>' : '<span class="v mu">—</span>';
function testCardH(book, n, t) {
  const ov = overall(t);
  return '<button class="camt rise" data-go="cambridge/t/' + encodeURIComponent(book) + '/' + n + '"><div class="hd"><b>Test ' + n + '</b>' + (ov != null ? '<span class="bdg">' + IE.bandTxt(ov) + '</span>' : '') + '</div>' +
    '<div class="rw"><span>Listening</span>' + chipS(skill(t, 'L')) + '</div><div class="rw"><span>Reading</span>' + chipS(skill(t, 'R')) + '</div><div class="rw"><span>Writing</span>' + chipS(IE.camWskill ? IE.camWskill(t) : { done: 0, need: 2, have: 0, band: null }) + '</div><div class="rw"><span>Speaking</span>' + chipS(IE.camSskill ? IE.camSskill(t) : { done: 0, need: 2, have: 0, band: null }) + '</div></button>';
}
function addBlock() {
  return '<div class="sec"><h2>Qo‘shish</h2></div><button class="aibn rise" data-go="cambridge/book">' + bd('spark', 'A', 'lg') + '<div style="flex:1"><h3>Kitobdan hammasini avtomatik</h3><p>Test 1, 2, 3, 4 — Reading va Listening bir bosishda.</p></div><span class="go">' + ic('next') + '</span></button>' +
    '<div class="sm mu" style="margin:14px 2px 6px">Yoki bittalab qo‘shish:</div><div class="two"><button class="btn ghost" data-go="cambridge/new/r">' + ic('plus') + ' Reading</button><button class="btn ghost" data-go="cambridge/new/l">' + ic('plus') + ' Listening</button></div>' +
    '<div class="card" style="margin-top:12px"><div class="row">' + bd('doc', 'T') + '<div style="flex:1"><b>JSON fayldan yuklash</b><div class="sm mu">Tayyor test faylingiz bo‘lsa — to‘g‘ridan-to‘g‘ri yuklang. Nomi “Cambridge 16 · Test 1 · Passage 1” ko‘rinishida bo‘lsa, kitob/Test bo‘yicha o‘zi guruhlanadi.</div></div></div><div class="two" style="margin-top:10px"><label class="btn sm" style="text-align:center">' + ic('down') + ' JSON tanlash<input type="file" accept=".json,application/json,text/plain" id="camj" hidden></label><button class="btn sm ghost" data-a="camtpl">Namuna formati</button></div></div>' +
    '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><button class="chip' + (cloudOn() ? ' on' : '') + '" data-a="camcl">' + ic('cloud') + ' Bulut: ' + (cloudOn() ? 'yoqilgan' : 'o‘chiq') + '</button>' + (cloudOn() ? '<button class="chip" data-a="camsyn">' + ic('refresh') + ' Sinxronlash</button>' : '') + '</div>' +
    '<p class="hint" style="margin-top:14px">' + ic('lock') + ' ' + (cloudOn() ? 'Testlar va audio shaxsiy bulut omboringizda ham saqlanadi (faqat siz ko‘rasiz) — boshqa qurilmangizda ham chiqadi.' : 'Bulut o‘chiq: testlar faqat shu qurilmada.') + ' Tayyorlash vaqtida tanlangan sahifalar matni AI’ga yuboriladi. Materialni faqat o‘zingiz uchun ishlating.</p>';
}
IE.camGroups = groups; IE.camLast = lastRec; IE.camParse = parseCam;
/** Test ichida qismlar orasida o‘tish: Scores · L 1–4 · R 1–3 (Jumpinto uslubi). */
IE.partNav = (u, kind) => {
  const p = parseCam(u); if (!p) return ''; const bk = groups().books.find(b => b[0] === p.book), t = bk && bk[1].get(p.n); if (!t) return '';
  const btn = (k, i, x) => {
    if (!x) return '<span class="pn dis">' + i + '</span>';
    const rec = lastRec(k === 'L' ? 'l' : 'r', x.id), cur = x.id === u.id, go = k === 'R' ? 'data-go="reading/' + x.id + '/run"' : (x.dur > 0 ? 'data-a="lstart" data-id="' + x.id + '"' : 'data-go="listening/' + x.id + '"');
    return '<button class="pn sk-' + k + (cur ? ' on' : '') + (rec ? ' dn' : '') + '" ' + go + ' aria-label="' + (k === 'L' ? 'Listening ' : 'Reading ') + i + '">' + i + '</button>';
  };
  return '<div class="pnav"><button class="pn wide" data-go="cambridge/s/' + encodeURIComponent(p.book) + '/' + p.n + '">Scores</button><span class="pn-l">L</span>' + [1, 2, 3, 4].map(i => btn('L', i, t.L[i])).join('') + '<span class="pn-l">R</span>' + [1, 2, 3].map(i => btn('R', i, t.R[i])).join('') + '</div>';
};
function hub() {
  const g = groups(), none = !store.reading.length && !store.listening.length;
  const body = g.books.map(([book, tests]) => '<div class="sec"><h2>' + esc(book) + '</h2></div><div class="camgrid">' + [...tests.entries()].sort((a, b) => a[0] - b[0]).map(([n, t]) => testCardH(book, n, t)).join('') + '</div>').join('') +
    (g.loose.r.length || g.loose.l.length ? '<div class="sec"><h2>Boshqa testlar</h2></div><div class="lst">' + g.loose.r.map(x => rowH('r', x)).join('') + g.loose.l.map(x => rowH('l', x)).join('') + '</div>' : '');
  const intro = none ? '<div class="card rise"><div class="row">' + bd('book', 'R', 'lg') + '<div style="flex:1"><b style="font-size:16px">Shaxsiy Cambridge testlari</b><div class="sm mu">Kitobingiz (PDF) dan Reading va Listening tuzing — kitob va Test bo‘yicha tartiblanadi, keyin oddiy testdek yechasiz.</div></div></div></div>' +
    '<div class="card rise" style="margin-top:14px"><b style="font-size:16px">Testlar hozircha yo‘q — o‘zingiz qo‘shasiz</b><div class="sm mu" style="margin:6px 0 10px">Cambridge matnlari ilovada tayyor emas (mualliflik huquqi). Kitoblarga PDF yuklang, keyin pastdagi “Kitobdan hammasini avtomatik” tugmasini bosing.</div><div class="lst"><button class="item" data-go="books"><span class="qn">1</span><div class="tx"><b>Kitob PDF’ini yuklang</b><span>Kitoblar → PDF tanlash (telefondagi fayl)</span></div><span class="go">' + ic('next') + '</span></button></div></div>' : '';
  const noAud = store.listening.filter(u => !(u.dur > 0)).length, zipB = store.listening.length ? '<div class="sec"><h2>Audio</h2></div>' + (noAud ? '<div class="tip8" style="margin-bottom:6px"><b>' + noAud + ' ta Listening qismida audio yo‘q.</b> Kitobning audio ZIP faylini shu yerga yuklang — o‘zi joylab chiqadi.</div>' : '') + zipHTML() : '';
  return sub('Cambridge IELTS', 'practice', '<div class="pad">' + intro + body + zipB + addBlock() + '</div>');
}
function testPage(book, n) {
  const bk = groups().books.find(x => x[0] === book), t = bk && bk[1].get(n); if (!t) return hub();
  const ov = overall(t), L = skill(t, 'L'), Rr = skill(t, 'R'), lack = Object.values(t.L).filter(u => !(u.dur > 0)).length;
  const row = (k, i, u) => {
    const nm = (k === 'L' ? 'Section ' : 'Passage ') + i;
    if (!u) return IE.uc({ empty: true, k, num: i, lab: k === 'L' ? 'SEC' : 'PAS', title: nm });
    const recs = (k === 'L' ? IE.S().listens.filter(r => r.id === u.id) : IE.S().reads.filter(r => r.p === u.id)), rec = recs.slice(-1)[0] || null, noAud = k === 'L' && !(u.dur > 0);
    return IE.uc({ go: k === 'R' ? 'reading/' + u.id + '/run' : 'listening/' + u.id, k, num: i, lab: k === 'L' ? 'SEC' : 'PAS', title: u.title, meta: nm,
      chips: [IE.ucChip(nqs(u.groups) + ' savol'), k === 'L' ? (noAud ? IE.ucChip('audio yo‘q', 'warn') : IE.ucChip(ic('head') + ' audio')) : '', k === 'L' && u.ttr ? IE.ucChip('transkript') : ''].filter(Boolean), rec, att: recs.length, ana: rec ? (k === 'L' ? 'l' : '') + rec.ts : '', del: { k: k.toLowerCase(), id: u.id } });
  };
  const soon = nm => '<div class="item" style="opacity:.45">' + bd(nm === 'Writing' ? 'pen' : 'mic', nm === 'Writing' ? 'W' : 'S', 'sm') + '<div class="tx"><b>' + nm + '</b><span>Tez orada</span></div></div>';
  const inner = '<div class="pad"><div class="card rise"><div class="row" style="justify-content:space-between"><div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">' + esc(book) + '</div><div style="font-size:26px;font-weight:900">Test ' + n + '</div></div>' + (ov != null ? '<div class="c"><div class="mu xs">Taxminiy band</div><div style="font-size:30px;font-weight:900;color:var(--pl)">' + IE.bandTxt(ov) + '</div></div>' : '') + '</div>' +
    '<div class="stats4"><div class="stat"><b>' + (L.band != null ? IE.bandTxt(L.band) : L.done + '/' + L.need) + '</b><span>Listening</span></div><div class="stat"><b>' + (Rr.band != null ? IE.bandTxt(Rr.band) : Rr.done + '/' + Rr.need) + '</b><span>Reading</span></div>' + (IE.camWskill ? (() => { const w = IE.camWskill(t), s2 = IE.camSskill(t); return '<div class="stat"><b>' + (w.band != null ? IE.bandTxt(w.band) : w.done + '/' + w.need) + '</b><span>Writing</span></div><div class="stat"><b>' + (s2.band != null ? IE.bandTxt(s2.band) : s2.done + '/' + s2.need) + '</b><span>Speaking</span></div>'; })() : '') + '</div></div>' +
    '<button class="item" style="margin-top:12px" data-go="cambridge/s/' + encodeURIComponent(book) + '/' + n + '">' + bd('target', 'M', 'sm') + '<div class="tx"><b>Scores</b><span>Javoblar jadvali, dalillar, urinishlar tarixi</span></div><span class="go">' + ic('next') + '</span></button>' + (IE.ftCard ? IE.ftCard(book, n, t) : '') +
    '<div class="sec"><h2>Listening</h2><span class="chip">' + L.done + '/' + L.need + '</span></div>' + (lack ? '<button class="item" style="margin-bottom:8px" data-go="cambridge">' + bd('down', 'L', 'sm') + '<div class="tx"><b>Audio ZIP yuklash</b><span>' + lack + ' ta Section’da audio yo‘q — Cambridge sahifasidagi “Audio” bo‘limidan zip tanlang</span></div><span class="go">' + ic('next') + '</span></button>' : '') + '<div class="ucl">' + [1, 2, 3, 4].map(i => row('L', i, t.L[i])).join('') + '</div>' +
    '<div class="sec"><h2>Reading</h2><span class="chip">' + Rr.done + '/' + Rr.need + '</span></div><div class="ucl">' + [1, 2, 3].map(i => row('R', i, t.R[i])).join('') + '</div>' +
    (IE.camWS ? IE.camWS(book, n, t) : '<div class="sec"><h2>Writing va Speaking</h2></div><div class="lst">' + soon('Writing') + soon('Speaking') + '</div>') +
    '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Band — hamma Section/Passage topshirilgach hisoblanadi (har birining oxirgi natijasi bo‘yicha).</p></div>';
  return sub('Test ' + n, 'cambridge', inner);
}
A.camdel = el => { const k = el.dataset.k, id = el.dataset.id; IE.ask('Test o‘chirilsinmi?', 'Qurilma va bulutdan butunlay o‘chadi (natijalar tarixi qoladi).', 'O‘chirish', async () => { store[kindOf(k)] = store[kindOf(k)].filter(x => x.id !== id); store.del = store.del || {}; store.del[id] = Date.now(); try { await IE.idbDel('camaud:' + id); } catch (e) { /* */ } if (cloudOn()) cDel('aud-' + id); await persist(); inject(); IE.draw(false); }); };

A.camcl = () => { lsSet('ielts:camcloud', cloudOn() ? 0 : 1); if (cloudOn()) { IE.toast('Bulut yoqildi'); camSync(true); } else IE.toast('Bulut o‘chirildi (mavjud nusxalar bulutda qoladi)'); IE.draw(false); };
A.camsyn = () => { camSync(true); };

/* ---------- JSON yuklash ---------- */
IE.camJson = async file => {
  try {
    const j = JSON.parse(await file.text()); let n = 0;
    let bad = '', nb = 0;
    const add = (k, list) => (Array.isArray(list) ? list : []).forEach(raw => { try { const { unit } = normUnit(k, raw, raw.cam || raw.title, raw.sec); store[kindOf(k)].push(unit); n++; } catch (e) { nb++; bad = bad || e.message; } });
    if (Array.isArray(j.reading) || Array.isArray(j.listening)) { add('r', j.reading); add('l', j.listening); } else if (j && j.groups) add(j.paras ? 'r' : 'l', [j]);
    if (!n) return IE.toast(bad ? 'Test qo‘shilmadi: ' + bad : 'JSON ichida test topilmadi (Namuna formatiga qarang)');
    await persist(); inject(); IE.toast(n + ' ta test qo‘shildi' + (nb ? ', ' + nb + ' ta o‘tkazib yuborildi' : '')); IE.draw(false);
  } catch (e) { IE.toast('JSON o‘qilmadi'); }
};
A.camtpl = () => {
  const P = 'Write the full passage paragraph here, exactly as printed in the book. Each paragraph needs a letter (A, B, C...) if the test uses matching headings or paragraph questions; otherwise use the numbers 1, 2, 3. Replace this sample text with the real paragraph.';
  const tpl = { _izoh: 'Bu namuna. "reading" va "listening" ro‘yxatlarida istalgancha test bo‘lishi mumkin. Savol turlari: heads, tfng, fill, mcq. Javoblar: heads → "iv", tfng → "TRUE"/"FALSE"/"NOT GIVEN" (YES/NO ham bo‘ladi), mcq → 0-dan boshlanadigan indeks yoki harf ("B"), fill → mumkin bo‘lgan javoblar ro‘yxati. Audio JSON’ga kirmaydi — keyin ilovada biriktiriladi.',
    reading: [{ cam: 'Cambridge 16 · Test 1 · Passage 1', title: 'Passage title', topic: 'Topic', paras: [{ k: 'A', t: P }, { k: 'B', t: P }, { k: 'C', t: P }],
      groups: [{ type: 'heads', title: 'Questions 1-2', note: 'Choose the correct heading for paragraphs B and C.', headings: [{ id: 'i', t: 'First heading' }, { id: 'ii', t: 'Second heading' }, { id: 'iii', t: 'Third heading' }], qs: [{ n: 1, para: 'B', a: 'ii', why: 'Izoh (ixtiyoriy)' }, { n: 2, para: 'C', a: 'i' }] },
        { type: 'tfng', title: 'Questions 3-4', note: 'Write TRUE, FALSE or NOT GIVEN.', qs: [{ n: 3, q: 'Statement one.', a: 'TRUE' }, { n: 4, q: 'Statement two.', a: 'NOT GIVEN' }] },
        { type: 'fill', title: 'Questions 5-6', note: 'Write ONE WORD ONLY.', qs: [{ n: 5, q: 'The ______ was built in 1990.', a: ['bridge'] }, { n: 6, q: 'It is made of ______.', a: ['steel', 'iron'] }] },
        { type: 'mcq', title: 'Questions 7-8', note: 'Choose the correct letter A, B or C.', qs: [{ n: 7, q: 'What is the main idea?', o: ['Option A', 'Option B', 'Option C'], a: 1 }, { n: 8, q: 'Where did it happen?', o: ['Here', 'There', 'Nowhere'], a: 'A' }] }] }],
    listening: [{ cam: 'Cambridge 16 · Test 1 · Section 1', title: 'Section title', tr: [{ x: 'Audioscript paragraph one (ixtiyoriy).' }, { x: 'Audioscript paragraph two.' }],
      groups: [{ type: 'fill', title: 'Questions 1-3', note: 'Write NO MORE THAN TWO WORDS AND/OR A NUMBER.', qs: [{ n: 1, q: 'Name: ______', a: ['Smith'], p: 0 }, { n: 2, q: 'Phone: ______', a: ['0123456'] }, { n: 3, q: 'Date: ______', a: ['5 May', '5th May'] }] },
        { type: 'mcq', title: 'Questions 4-5', note: 'Choose the correct letter A, B or C.', qs: [{ n: 4, q: 'Which room?', o: ['Hall', 'Lab', 'Cafe'], a: 2 }, { n: 5, q: 'When?', o: ['Morning', 'Evening', 'Noon'], a: 0 }] }] }] };
  const url = URL.createObjectURL(new Blob([JSON.stringify(tpl, null, 2)], { type: 'application/json' })), a = document.createElement('a');
  a.href = url; a.download = 'cambridge-namuna.json'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000); IE.toast('Namuna yuklab olindi');
};
IE.camChange = el => {
  const f = el.files && el.files[0]; if (!f) return false;
  if (el.id === 'camj') { el.value = ''; IE.camJson(f); return true; }
  if (el.id === 'camaf4') { attachMany(el); return true; }
  if (el.id === 'camzip') { el.value = ''; readZip(f); return true; }
  if (el.id === 'camaf') { const id = el.dataset.id; el.value = ''; IE.camAudio(id, f); return true; }
  if (el.id === 'camaf0') { readForm(); V.cam.audio = f; IE.draw(false); return true; }
  if (el.dataset && el.dataset.ft) { const fs = [...el.files], id = el.dataset.ft; el.value = ''; readForm(); fileSlot(id, fs); return true; }
  return false;
};


/* ---------- Kitobdan hammasini avtomatik: struktura xaritasi + Test bo‘yicha batch ---------- */
const cb = () => V.cb || (V.cb = { step: 'pick', busy: '', err: '', map: null, run: null });
const rng = t => { const m = String(t || '').match(/(\d+)\s*[-–—]\s*(\d+)/) || String(t || '').match(/^\s*(\d+)\s*$/); if (!m) return null; const a = +m[1], b = +(m[2] || m[1]); return b >= a ? [a, b] : null; };
const R2 = (x, tot) => Array.isArray(x) && x.length === 2 && +x[0] >= 1 && +x[1] >= +x[0] && +x[1] <= tot ? (+x[0]) + '-' + (+x[1]) : '';
function mapFrom(res, tot) {
  return (Array.isArray(res && res.tests) ? res.tests : []).map(t => ({
    n: +t.n,
    L: [1, 2, 3, 4].map(p => { const f = (t.listening || []).find(x => +x.part === p) || {}; return { part: p, q: R2(f.q, tot), s: R2(f.s, tot) }; }),
    R: [1, 2, 3].map(i => { const f = (t.reading || []).find(x => +x.passage === i) || {}; return { passage: i, q: R2(f.q, tot) }; }),
    kl: R2(t.key && t.key.listening, tot), kr: R2(t.key && t.key.reading, tot), W1: '', W2: '', SP: '' })).filter(t => t.n >= 1 && t.n <= 12).sort((a, b) => a.n - b.n);
}
function readMap() {
  const c = cb(); if (!c.map) return; const v = id => { const e = $('#' + id); return e ? e.value : null; };
  const nm = v('cbnm'); if (nm != null) c.nm = nm; const bk = v('cbk2'); if (bk) c.book = bk;
  c.map.forEach(t => { t.L.forEach(l => { const q = v('cbL' + t.n + '_' + l.part + 'q'), sc = v('cbL' + t.n + '_' + l.part + 's'); if (q != null) l.q = q; if (sc != null) l.s = sc; }); t.R.forEach(r => { const q = v('cbR' + t.n + '_' + r.passage + 'q'); if (q != null) r.q = q; }); const kl = v('cbKL' + t.n), kr = v('cbKR' + t.n); if (kl != null) t.kl = kl; if (kr != null) t.kr = kr; ['W1', 'W2', 'SP'].forEach(f => { const x = v('cb' + f + t.n); if (x != null) t[f] = x; }); });
}
const shortName = b => { const m = b && /cambridge[^\d]{0,30}(\d{1,2})/i.exec(b.t); return m ? 'Cambridge ' + m[1] : (b ? b.t.slice(0, 28) : 'Cambridge'); };
const stI = { wait: '<span class="mu">·</span>', run: '<div class="spin sm" style="margin:0"></div>', ok: '<span class="chip ok">' + '✓' + '</span>', skip: '<span class="chip">allaqachon bor</span>', err: '<span class="chip" style="color:var(--bad)">xato</span>' };
/** Writing Task 1/2 va Speaking sahifalarini matn bo‘yicha topadi (Test: Listening → Reading → Writing → Speaking → keyingi test / kalitlar). */
function findWS(pg, map) {
  const T = p => String(pg.t[p] || '').toLowerCase(), n = pg.n;
  const isW1 = p => /writing\s+task\s+1/.test(T(p)) && /20\s+minutes/.test(T(p)), isW2 = p => /writing\s+task\s+2/.test(T(p)) && /40\s+minutes/.test(T(p));
  const isSp = p => /speaking/.test(T(p)) && /part\s+1/.test(T(p)) && /interview|introduc|examiner|\?/.test(T(p)), isSp2 = p => /part\s+[23]/.test(T(p)) && /speaking|cue|should say|discuss|\?/.test(T(p));
  map.forEach((t, k) => {
    const rs = t.R.map(r => rng(r.q)).filter(Boolean), rEnd = rs.length ? Math.max(...rs.map(x => x[1])) : 0; if (!rEnd) return;
    const nx = map[k + 1], nxs = nx ? [].concat(nx.L.map(l => rng(l.q)), nx.R.map(r => rng(r.q))).filter(Boolean).map(x => x[0]) : [];
    const lim = [n + 1].concat(nxs, [rng(t.kr), rng(t.kl)].concat(t.L.map(l => rng(l.s))).filter(Boolean).map(x => x[0])).filter(x => x > rEnd);
    const end = Math.min(...lim) - 1; let w1 = 0, w2 = 0, sp = 0;
    for (let p = rEnd + 1; p <= end; p++) { if (!w1 && isW1(p)) w1 = p; if (!w2 && isW2(p)) w2 = p; if (!sp && isSp(p)) sp = p; }
    t.W1 = w1 ? w1 + '-' + w1 : ''; t.W2 = w2 ? w2 + '-' + w2 : '';
    if (sp) { let e = sp; while (e < end && e < sp + 2 && isSp2(e + 1)) e++; t.SP = sp + '-' + e; }
  });
}
function bookAuto() {
  const c = cb(), books = IE.bookList ? IE.bookList() : [];
  if (!c.book || !books.some(b => b.id === c.book)) c.book = books[0] && books[0].id;
  const bk = books.find(b => b.id === c.book), anyRun = c.run && c.run.active;
  const top = !books.length ? '<div class="card c">' + bd('book', 'R', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<b>Avval kitob qo‘shing</b><p class="mu sm" style="margin:6px 0 12px">Cambridge IELTS kitobingiz PDF’ini “Kitoblar” bo‘limiga yuklang.</p><button class="btn" data-go="books">Kitoblarga o‘tish</button></div>' :
    '<div class="card"><div class="fld"><label>Kitob</label><select id="cbk2">' + books.map(b => '<option value="' + b.id + '"' + (b.id === c.book ? ' selected' : '') + '>' + esc(b.t) + ' (' + b.pg + ' bet)</option>').join('') + '</select></div>' +
    '<div class="fld"><label>Qisqa nomi (testlar nomida)</label><input id="cbnm" value="' + esc(c.nm != null ? c.nm : shortName(bk)) + '" maxlength="30"></div>' +
    (c.busy ? '<div class="mu sm row" style="gap:8px"><div class="spin sm"></div> <span id="cbbusy">' + esc(c.busy) + '</span></div>' : '<button class="btn block" data-a="cbmap">' + ic('spark') + ' ' + (c.map ? 'Strukturani qayta aniqlash' : 'Kitob strukturasini aniqlash') + '</button>') +
    (c.err ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(c.err) + '</p>' : '') + '</div>';
  const zipC = books.length ? zipHTML() : '';
  const info = !c.map ? '<div class="card" style="margin-top:12px"><b>Bu qanday ishlaydi</b><ol class="sm mu" style="margin:8px 0 0 18px;line-height:1.7"><li>Kitobni tanlang — ilova barcha betlarni o‘qib, qaysi bet qaysi Test/Passage/Part ekanini AI bilan aniqlaydi.</li><li>Natijani tekshiring (kerak bo‘lsa bet raqamlarini tuzating).</li><li>“Test 1 ni qo‘shish” — 3 ta Reading + 4 ta Listening + Writing (Task 1, 2) + Speaking ketma-ket tayyorlanadi.</li><li>Listening audiolarini (4 ta mp3) birdan tanlab biriktirasiz.</li></ol></div>' : '';
  const tests = c.map ? (c.map.length ? c.map.map(t => testCard(t, anyRun)).join('') : '<div class="card empty" style="margin-top:12px">Testlar topilmadi. Kitob skaner qilingan bo‘lsa, avval Kitoblar → Qidirish → “Hammasini OCR qilish”ni bajaring.</div>') : '';
  return sub('Kitobdan avtomatik', 'cambridge', '<div class="pad">' + top + info + tests + zipC + '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Reading, Listening, Writing (Task 1 + 2) va Speaking (Part 1–3) birga qo‘shiladi. Bet oralig‘i noto‘g‘ri topilsa — “Sahifalarni tekshirish”da tuzating.</p></div>');
}
function testCard(t, busy) {
  const c = cb(), run = c.run && c.run.n === t.n ? c.run : null, have = [...store.reading, ...store.listening].filter(u => u.grp === c.book + ':' + t.n), nUnits = t.R.filter(r => rng(r.q)).length + t.L.filter(l => rng(l.q)).length + ['W1', 'W2', 'SP'].filter(f => rng(t[f])).length, haveWS = [...store.writing, ...store.speaking].filter(u => String(u.cam || '').startsWith((c.nm || shortName(IE.bookList().find(b => b.id === c.book))).trim() + ' · Test ' + t.n + ' · '));
  const inp = (id, v, ph) => '<input id="' + id + '" class="fill" style="margin:0;padding:8px 10px" placeholder="' + ph + '" value="' + esc(v || '') + '" inputmode="text" autocapitalize="off">';
  const fields = '<details style="margin-top:10px"><summary class="b" style="cursor:pointer">Sahifalarni tekshirish / tuzatish</summary><div class="sm mu" style="margin:6px 0">Format: 12-15 (PDF bet raqami). Listening’da ikkinchi maydon — audioscript.</div><div class="lst">' +
    t.R.map(r => '<div class="item" style="padding:8px 12px"><span class="qn">R' + r.passage + '</span>' + inp('cbR' + t.n + '_' + r.passage + 'q', r.q, 'savollar') + '</div>').join('') +
    '<div class="item" style="padding:8px 12px"><span class="qn">W</span>' + inp('cbW1' + t.n, t.W1, 'Task 1') + inp('cbW2' + t.n, t.W2, 'Task 2') + '</div><div class="item" style="padding:8px 12px"><span class="qn">S</span>' + inp('cbSP' + t.n, t.SP, 'Speaking (1–3-qism)') + '</div>' +
    t.L.map(l => '<div class="item" style="padding:8px 12px"><span class="qn">L' + l.part + '</span>' + inp('cbL' + t.n + '_' + l.part + 'q', l.q, 'savollar') + inp('cbL' + t.n + '_' + l.part + 's', l.s, 'audioscript') + '</div>').join('') +
    '<div class="item" style="padding:8px 12px"><span class="qn">K</span>' + inp('cbKR' + t.n, t.kr, 'Reading kaliti') + inp('cbKL' + t.n, t.kl, 'Listening kaliti') + '</div></div></details>';
  const runH = run ? '<div class="lst" style="margin-top:10px">' + run.items.map(it => '<div class="item" style="padding:8px 12px"><span class="qn">' + (it.k === 'r' ? 'R' : it.k === 'l' ? 'L' : it.k === 'w' ? 'W' : 'S') + it.i + '</span><div class="tx"><b style="font-size:14px">' + (it.k === 'r' ? 'Passage ' : it.k === 'l' ? 'Section ' : it.k === 'w' ? 'Writing Task ' : 'Speaking ') + (it.k === 's' ? '' : it.i) + '</b><span style="white-space:normal">' + (it.st === 'err' ? esc(it.err || '') : it.st === 'run' ? esc(it.msg || 'Tayyorlanmoqda…') : '') + '</span></div>' + stI[it.st] + '</div>').join('') + '</div>' : '';
  const ls = store.listening.filter(u => u.grp === c.book + ':' + t.n).sort((a, b) => a.sn - b.sn);
  const needAud = ls.filter(u => !(u.dur > 0)).length;
  const aud = ls.length ? '<label class="btn ghost block" style="margin-top:10px">' + ic('head') + ' ' + (needAud ? 'Audiolarni birdan tanlash (' + ls.length + ' ta mp3)' : 'Audiolarni almashtirish') + '<input type="file" accept="audio/*,.mp3,.m4a,.wav" multiple id="camaf4" data-n="' + t.n + '" hidden></label><div class="sm mu" style="margin-top:4px">Fayllar nomi bo‘yicha tartiblanadi: 1-fayl → Section 1 … ' + (needAud ? '<b>' + needAud + ' ta audio yetishmaydi.</b>' : 'Hammasi biriktirilgan.') + '</div>' : '';
  const toTr = ls.filter(u => u.dur > 0 && !u.ttr).length, trAll = ls.length && ls.every(u => u.dur > 0) ? '<button class="btn ghost block" style="margin-top:8px"' + (toTr ? ' data-a="camtrall" data-n="' + t.n + '"' : ' disabled') + '>' + ic('wave') + ' ' + (toTr ? 'Vaqtli transkript (AI): ' + toTr + ' ta' : 'Transkriptlar tayyor ✓') + '</button>' : '';
  return '<div class="card" style="margin-top:12px"><div class="row" style="justify-content:space-between"><b style="font-size:17px">Test ' + t.n + '</b><span class="chip">' + nUnits + '/10 qism topildi' + ((have.length + haveWS.length) ? ' · ' + (have.length + haveWS.length) + ' qo‘shilgan' : '') + '</span></div>' + fields + runH +
    (run && run.active ? '' : '<button class="btn block" style="margin-top:12px"' + (busy || !nUnits ? ' disabled' : ' data-a="cbrun" data-n="' + t.n + '"') + '>' + ic('spark') + ' ' + (run && run.items.some(i => i.st === 'err') ? 'Xatolarni qayta urinish' : have.length ? 'Yetishmaganlarini qo‘shish' : 'Test ' + t.n + ' ni qo‘shish') + '</button>') + aud + trAll + '</div>';
}
A.cbmap = async () => {
  readMap(); const c = cb(), books = IE.bookList(), book = c.book || (books[0] || {}).id; if (!book) return; c.err = ''; c.map = null; c.run = null;
  try {
    c.busy = 'Kitob o‘qilmoqda…'; IE.draw(false);
    const { n, snips, empty } = await IE.bookSnips(book, (p, tot) => { c.busy = 'Kitob o‘qilmoqda: ' + p + '/' + tot + ' bet'; const e = $('#cbbusy'); if (e) e.textContent = c.busy; });
    if (empty > n * 0.5) throw new Error('Kitobning ko‘p betida matn qatlami yo‘q (skaner). Avval Kitoblar → shu kitob → Qidirish → “Hammasini OCR qilish”ni bajaring.');
    c.busy = 'AI struktura xaritasini tuzmoqda… (20–60 soniya)'; IE.draw(false);
    const out = await IE.ai({ action: 'cammap', pages: snips, total: n });
    c.map = mapFrom(out.result, n);
    try { c.busy = 'Writing / Speaking sahifalari qidirilmoqda…'; IE.draw(false); findWS(await IE.bookPages(book), c.map); } catch (e) { /* qo‘lda kiritiladi */ }
    if (!c.map.length) c.err = 'AI testlarni topa olmadi. Bu Cambridge IELTS test kitobimi? Bo‘lmasa, bittalab qo‘shing.';
  } catch (e) { c.err = e.message || 'Xatolik'; }
  c.busy = ''; IE.draw(false);
};
A.cbrun = async el => {
  readMap(); const c = cb(), n = +el.dataset.n, t = c.map && c.map.find(x => x.n === n); if (!t || (c.run && c.run.active)) return;
  const bk = IE.bookList().find(b => b.id === c.book), bn = (c.nm || shortName(bk)).trim() || 'Cambridge', items = [];
  t.R.forEach(r => items.push({ k: 'r', i: r.passage, q: rng(r.q), key: rng(t.kr), st: 'wait' })); t.L.forEach(l => items.push({ k: 'l', i: l.part, q: rng(l.q), s: rng(l.s), key: rng(t.kl), st: 'wait' }));
  items.push({ k: 'w', i: 1, q: rng(t.W1), st: 'wait' }, { k: 'w', i: 2, q: rng(t.W2), st: 'wait' }, { k: 's', i: 1, q: rng(t.SP), st: 'wait' });
  items.forEach(it => { it.label = bn + ' · Test ' + n + ' · ' + (it.k === 'r' ? 'Passage ' : it.k === 'l' ? 'Section ' : it.k === 'w' ? 'Writing Task ' : 'Speaking') + (it.k === 's' ? '' : it.i); });
  const run = c.run = { n, items, active: true }, cache = {}, redraw = () => { if ((IE.curRoute || '') === 'cambridge/book' && !$('#sheet')) IE.draw(false); };
  const txt = async (r, msg, it) => { const k = r[0] + '-' + r[1]; if (!cache[k]) cache[k] = await IE.bookText(c.book, r[0], r[1], (i, tot, o) => { it.msg = msg + (o ? ' (OCR) ' : ' ') + i + '/' + tot; redraw(); }); return cache[k]; };
  redraw();
  for (const it of items) {
    if (!it.q) { it.st = 'skip'; it.err = ''; continue; }
    if ([...store.reading, ...store.listening, ...store.writing, ...store.speaking].some(u => u.cam === it.label)) { it.st = 'skip'; continue; }
    if (it.k === 'w' || it.k === 's') {
      it.st = 'run'; redraw();
      try {
        const rs = [];
        for (let p = it.q[0]; p <= Math.min(it.q[1], it.q[0] + 2); p++) { it.msg = 'Bet ' + p + ' rasmga olinmoqda…'; redraw(); const img = await IE.bookPageImg(c.book, p); it.msg = 'AI bet ' + p + ' ni o‘qimoqda…'; redraw(); const out = await SB.fn('ielts-wr', { mode: 'extract', kind: it.k === 's' ? 'sp' : 'w', img: img.split(',')[1] }); rs.push({ img, r: out.result || {} }); }
        await IE.camWSAdd(bn, n, it.k, it.i, rs); inject(); it.st = 'ok';
      } catch (e) { it.st = 'err'; it.err = e.net ? 'Internetga ulanib bo‘lmadi' : (e.message || 'Xatolik'); if (/limit/i.test(it.err)) { redraw(); break; } }
      redraw(); continue;
    }
    it.st = 'run'; it.msg = 'Matn olinmoqda…'; redraw();
    try {
      if (!it.key) throw new Error('Javoblar kaliti sahifalari kiritilmagan');
      const text = await txt(it.q, 'Savollar', it), key = await txt(it.key, 'Kalit', it), script = it.k === 'l' && it.s ? await txt(it.s, 'Audioscript', it) : '';
      it.msg = 'AI tayyorlamoqda… (30–90 soniya)'; redraw();
      const out = await IE.ai({ action: 'camimport', kind: it.k === 'r' ? 'reading' : 'listening', which: it.i, text, key, script });
      const { unit } = normUnit(it.k, out.result, it.label, it.i); unit.grp = c.book + ':' + n; unit.sn = it.i;
      store[it.k === 'r' ? 'reading' : 'listening'].push(unit); await persist(); inject(); it.st = 'ok'; if (it.k === 'l') await applyStage(unit, true);
    } catch (e) { it.st = 'err'; it.err = e.message || 'Xatolik'; if (/limit/i.test(it.err)) { redraw(); break; } }
    redraw();
  }
  run.active = false; const ok = items.filter(i => i.st === 'ok').length, bad = items.filter(i => i.st === 'err').length;
  IE.toast(bad ? ok + ' ta tayyor, ' + bad + ' tasida xato' : (ok ? 'Test ' + n + ' tayyor — ' + ok + ' qism qo‘shildi' : 'Yangi qism qo‘shilmadi')); redraw();
};
/** 4 ta audio faylni nomi bo‘yicha tartiblab Section 1..4 ga biriktiradi. */
async function attachMany(el) {
  const c = cb(), n = +el.dataset.n, files = [...el.files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true })); el.value = '';
  const ls = store.listening.filter(u => u.grp === c.book + ':' + n).sort((a, b) => a.sn - b.sn);
  if (files.length !== ls.length) return IE.toast(ls.length + ' ta audio tanlang (hozir ' + files.length + ' ta tanlandi)');
  IE.toast('Audiolar saqlanmoqda…'); for (let i = 0; i < ls.length; i++) await IE.camAudio(ls[i].id, files[i]);
  IE.toast('Audiolar biriktirildi: ' + files.map((f, i) => 'S' + (i + 1) + ' ← ' + f.name.slice(0, 18)).join(', ').slice(0, 120));
}


/* ---------- Audio ZIP: fayl nomidan Test/Section aniqlanadi ---------- */
const loadFflate = () => window.fflate ? Promise.resolve(window.fflate) : (V.ffP || (V.ffP = new Promise((res, rej) => { const sc = document.createElement('script'); sc.src = 'vendor/fflate/fflate.js'; sc.onload = () => res(window.fflate); sc.onerror = () => { V.ffP = null; rej(new Error('ZIP kutubxonasi yuklanmadi')); }; document.head.appendChild(sc); })));
const concat = ch => { let n = 0; ch.forEach(c => { n += c.length; }); const o = new Uint8Array(n); let k = 0; ch.forEach(c => { o.set(c, k); k += c.length; }); return o; };
const AUD = /\.(mp3|m4a|wav|aac|ogg)$/i, mimeOf = n => /\.m4a$|\.aac$/i.test(n) ? 'audio/mp4' : /\.wav$/i.test(n) ? 'audio/wav' : /\.ogg$/i.test(n) ? 'audio/ogg' : 'audio/mpeg';
const natCmp = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
/** Fayl yo‘lidan Test va Part ni topadi (0 — topilmadi). */
function parseTrack(path) {
  const low = String(path).replace(/\\/g, '/'), base = low.split('/').pop();
  const tn = /test[\s_.\-]*0*(\d{1,2})/i.exec(low), pn = /(?:part|section|sec)[\s_.\-]*0*([1-4])(?!\d)/i.exec(base) || /(?:part|section)[\s_.\-]*0*([1-4])(?!\d)/i.exec(low);
  return { n: tn ? +tn[1] : 0, part: pn ? +pn[1] : 0 };
}
const stageKey = (book, n, part) => 'camstage:' + book + ':' + n + ':' + part;
/** Tayyor bo‘lgan (yoki keyin tuziladigan) Section uchun saqlab qo‘yilgan audioni biriktiradi. */
async function applyStage(unit, quiet) {
  const pc = unit && parseCam(unit); if (!pc) return false; const key = stageKey(pc.book, pc.n, pc.i);
  let r = null; try { r = await IE.idbGet(key); } catch (e) { /* */ } if (!r || !r.buf) return false;
  await IE.camAudio(unit.id, new Blob([r.buf], { type: r.type || 'audio/mpeg' }), quiet); try { await IE.idbDel(key); } catch (e) { /* */ } return true;
}
async function readZip(file) {
  const c = cb(); c.err = ''; const sel = $('#czb'), bname = ((sel && sel.value) || c.zb || '').trim(); if (!bname) return IE.toast('Avval kamida bitta test qo‘shing');
  c.zb = bname; c.zip = { busy: 'ZIP ochilmoqda…', rows: [], book: bname }; IE.draw(false);
  const book = 'z' + Date.now().toString(36), seq = []; let ff;
  try {
    ff = await loadFflate();
    const pend = []; const uz = new ff.Unzip(); uz.register(ff.UnzipInflate); uz.register(ff.UnzipPassThrough);
    uz.onfile = ent => {
      const name = ent.name; if (!AUD.test(name) || /(^|\/)(__MACOSX|\.)/.test(name) || /\/\._/.test('/' + name)) return;
      const ch = []; ent.ondata = (err, data, final) => { if (err) return; ch.push(data); if (final) pend.push({ name, data: concat(ch) }); }; ent.start();
    };
    const CH = 4 * 1048576;
    for (let o = 0; o < file.size; o += CH) {
      uz.push(new Uint8Array(await file.slice(o, o + CH).arrayBuffer()), o + CH >= file.size);
      while (pend.length) { const f = pend.shift(), i = seq.length; seq.push({ name: f.name, size: f.data.length }); await IE.idbSet('camzip:' + book + ':' + i, { buf: f.data.buffer.slice(f.data.byteOffset, f.data.byteOffset + f.data.byteLength), type: mimeOf(f.name) }); c.zip.busy = 'O‘qilmoqda: ' + seq.length + ' ta audio topildi…'; const e = $('#czbusy'); if (e) e.textContent = c.zip.busy; }
      const e = $('#czbusy'); if (e) e.textContent = 'ZIP o‘qilmoqda: ' + Math.min(100, Math.round((o + CH) / file.size * 100)) + '% · ' + seq.length + ' ta audio';
    }
  } catch (e) { c.zip = null; c.err = 'ZIP o‘qilmadi: ' + (e.message || 'xato'); return IE.draw(false); }
  if (!seq.length) { c.zip = null; c.err = 'ZIP ichida audio fayl (mp3/m4a/wav) topilmadi.'; return IE.draw(false); }
  // nomdan aniqlash, bo‘lmasa tartib raqami bo‘yicha (16 ta = 4 test × 4 part)
  const sorted = seq.map((f, i) => Object.assign({ i }, f, parseTrack(f.name))).sort((a, b) => natCmp(a.name, b.name));
  if (sorted.some(f => !f.n || !f.part) && sorted.length % 4 === 0) sorted.forEach((f, k) => { if (!f.n || !f.part) { f.n = Math.floor(k / 4) + 1; f.part = k % 4 + 1; f.guess = true; } });
  const seen = new Set(); sorted.forEach(f => { if (f.n && f.part) { const k = f.n + ':' + f.part; if (seen.has(k)) f.dup = true; seen.add(k); } });
  c.zip.rows = sorted; c.zip.tmp = book; c.zip.busy = 'Biriktirilmoqda…'; IE.draw(false);
  for (const f of sorted) { if (f.n && f.part && !f.dup) await place(f, true); }
  c.zip.busy = ''; const ok = sorted.filter(f => f.done).length; IE.toast(ok + ' ta audio joylashtirildi' + (sorted.length - ok ? ', ' + (sorted.length - ok) + ' tasi qo‘lda' : '')); IE.draw(false);
}
/** zip yozuvini (camzip:) Section audiosi sifatida joylashtiradi: unit bor bo‘lsa biriktiradi, yo‘q bo‘lsa kutish omboriga qo‘yadi. */
async function place(f, quiet) {
  const c = cb(), z = c.zip, r = await IE.idbGet('camzip:' + z.tmp + ':' + f.i); if (!r) return;
  const unit = store.listening.find(u => { const p = parseCam(u); return p && p.book === z.book && p.n === f.n && p.i === f.part; });
  if (unit) await IE.camAudio(unit.id, new Blob([r.buf], { type: r.type }), true); else await IE.idbSet(stageKey(z.book, f.n, f.part), r);
  await IE.idbDel('camzip:' + z.tmp + ':' + f.i); f.done = unit ? 'att' : 'stage'; if (!quiet) IE.draw(false);
}
A.czset = async el => { const c = cb(), f = c.zip && c.zip.rows.find(x => x.i === +el.dataset.i); if (!f) return; const v = el.value.split(':'); if (v.length !== 2) return; f.n = +v[0]; f.part = +v[1]; f.dup = false; await place(f); IE.toast('Joylashtirildi'); };
function zipBookNames() { const names = groups().books.map(b => b[0]); const c = cb(), bk = IE.bookList ? IE.bookList().find(b => b.id === c.book) : null, nm = ((c.nm != null ? c.nm : (bk ? shortName(bk) : '')) || '').trim(); if (nm && !names.includes(nm) && (IE.curRoute || '') === 'cambridge/book') names.push(nm); return names; }
const zipHTML = () => {
  const c = cb(), z = c.zip, names = zipBookNames(), cur = c.zb && names.includes(c.zb) ? c.zb : names[0] || '', opts = (sel) => '<option value="">Tanlang…</option>' + [1, 2, 3, 4].flatMap(n => [1, 2, 3, 4].map(p => '<option value="' + n + ':' + p + '"' + (sel === n + ':' + p ? ' selected' : '') + '>Test ' + n + ' · Section ' + p + '</option>')).join('');
  return '<div class="card" style="margin-top:12px"><div class="row">' + bd('head', 'L') + '<div style="flex:1"><b>Audio ZIP</b><div class="sm mu">Kitobning audio arxivi (zip). Fayl nomlaridan Test va Section o‘zi aniqlanadi va tayyor testlarga biriktiriladi.</div></div></div>' +
    (names.length > 1 ? '<div class="fld" style="margin:10px 0 0"><label>Qaysi kitob</label><select id="czb">' + names.map(n => '<option' + (n === cur ? ' selected' : '') + '>' + esc(n) + '</option>').join('') + '</select></div>' : '<input type="hidden" id="czb" value="' + esc(cur) + '">') +
    (z && z.busy ? '<div class="mu sm row" style="gap:8px;margin-top:10px"><div class="spin sm"></div> <span id="czbusy">' + esc(z.busy) + '</span></div>' : '<label class="btn block" style="margin-top:10px">' + ic('down') + ' ZIP tanlash<input type="file" accept=".zip,application/zip,application/x-zip-compressed" id="camzip" hidden></label>') +
    (z && z.rows.length ? '<div class="lst" style="margin-top:10px">' + z.rows.map(f => '<div class="item" style="padding:8px 12px"><div class="tx" style="min-width:0"><b style="font-size:13px;white-space:normal;word-break:break-all">' + esc(f.name.split('/').pop()) + '</b><span>' + (f.done ? 'Test ' + f.n + ' · Section ' + f.part + (f.guess ? ' (tartib bo‘yicha taxmin)' : '') + (f.done === 'stage' ? ' · kutilmoqda: shu Test tuzilgach avtomatik biriktiriladi' : ' · biriktirildi') : (f.dup ? 'Takror (shu Section allaqachon bor)' : 'Aniqlanmadi — tanlang')) + '</span></div>' + (f.done ? '<span class="chip ok">✓</span>' : '<select class="sel" style="width:auto;max-width:150px" data-a="czset" data-i="' + f.i + '" onchange="IE.act.czset(this)">' + opts('') + '</select>') + '</div>').join('') + '</div>' : '') + '</div>';
};


/* ---------- Vaqtli transkript: AI audioni eshitadi (chunk), audioscript bilan moslanadi ---------- */
const b64Of = blob => new Promise((res, rej) => { const fr = new FileReader(); fr.onload = () => res(String(fr.result).split(',')[1]); fr.onerror = rej; fr.readAsDataURL(blob); });
function splitMp3(u8, max) {
  if (u8.length <= max) return [[0, u8.length]];
  const out = []; let st = 0;
  while (st < u8.length) { let e = Math.min(u8.length, st + max); if (e < u8.length) { for (let k = e; k < Math.min(u8.length - 1, e + 8192); k++) { if (u8[k] === 0xFF && (u8[k + 1] & 0xE0) === 0xE0 && ((u8[k + 1] >> 1) & 3) !== 0) { e = k; break; } } } out.push([st, e]); st = e; }
  return out;
}
const cw = x => String(x || '').toLowerCase().replace(/[’‘]/g, '\'').replace(/[^a-z0-9']/g, '');
/** Audioscript abzatslariga vaqt qo‘yadi: Whisper so‘zlari bilan eng uzun umumiy ketma-ketlik (LCS). */
function alignScript(trs, words) {
  const S = []; trs.forEach((p, j) => String(p.x).split(/\s+/).map(cw).filter(Boolean).forEach(w => S.push({ w, p: j })));
  const W = words.filter(x => x.w), n = W.length, m = S.length; if (!n || !m || n > 4200 || m > 4200) return null;
  const w1 = m + 1, L = new Uint16Array((n + 1) * w1);
  for (let i = 1; i <= n; i++) for (let j = 1; j <= m; j++) L[i * w1 + j] = W[i - 1].w === S[j - 1].w ? L[(i - 1) * w1 + j - 1] + 1 : Math.max(L[(i - 1) * w1 + j], L[i * w1 + j - 1]);
  const tm = new Array(m).fill(null); let i = n, j = m, hit = 0;
  while (i > 0 && j > 0) { if (W[i - 1].w === S[j - 1].w && L[i * w1 + j] === L[(i - 1) * w1 + j - 1] + 1) { tm[j - 1] = W[i - 1].t; hit++; i--; j--; } else if (L[(i - 1) * w1 + j] >= L[i * w1 + j - 1]) i--; else j--; }
  if (hit / m < 0.35) return null;
  const t = trs.map(() => null); S.forEach((x, k) => { if (t[x.p] == null && tm[k] != null) t[x.p] = tm[k]; });
  let last = -1; for (let k = 0; k < t.length; k++) { if (t[k] != null) { last = k; continue; } let nx = k; while (nx < t.length && t[nx] == null) nx++; const a = last >= 0 ? t[last] : 0, b = nx < t.length ? t[nx] : a + 6 * (nx - last); for (let q = k; q < nx; q++) t[q] = a + (b - a) * (q - last) / (nx - last); k = nx - 1; last = nx - 1; }
  for (let k = 1; k < t.length; k++) if (t[k] < t[k - 1]) t[k] = t[k - 1];
  return trs.map((p, k) => ({ t: Math.round(t[k] * 10) / 10, x: p.x }));
}
async function transcribeUnit(u, prog) {
  const rec = await IE.idbGet('camaud:' + u.id); if (!rec || !rec.buf) throw new Error('Audio fayl yo‘q');
  const u8 = new Uint8Array(rec.buf), isMp3 = /mpeg|mp3/.test(rec.type || '');
  if (!isMp3 && u8.length > 6.2e6) throw new Error('Katta audio uchun mp3 kerak (m4a/wav bo‘laklab bo‘lmaydi)');
  const parts = isMp3 ? splitMp3(u8, 6 * 1048576) : [[0, u8.length]]; let off = 0; const words = [], cues = [];
  for (let i = 0; i < parts.length; i++) {
    prog('AI audioni eshitmoqda: ' + (i + 1) + '/' + parts.length + '…');
    const out = await IE.ai({ action: 'audiotr', audio: await b64Of(new Blob([u8.subarray(parts[i][0], parts[i][1])], { type: rec.type || 'audio/mpeg' })), mime: rec.type || 'audio/mpeg' });
    let mx = 0; (out.cues || []).forEach(c => {
      mx = Math.max(mx, c.e || 0); cues.push({ t: c.s + off, x: c.t });
      if (c.w && c.w.length) c.w.forEach(w => words.push({ w: cw(w[0]), t: w[1] + off })); else { const ws = String(c.t).split(/\s+/).map(cw).filter(Boolean); ws.forEach((w, k) => words.push({ w, t: c.s + off + (c.e - c.s) * k / ws.length })); }
    });
    off += out.dur || mx;
  }
  if (!cues.length) throw new Error('Audiodan matn chiqmadi');
  const al = u.tr && u.tr.length ? alignScript(u.tr, words) : null;
  u.tr = al || cues.map(c => ({ t: Math.round(c.t * 10) / 10, x: c.x })); u.ttr = al ? 2 : 1;       // 2 — audioscript vaqtga moslangan, 1 — AI matni
  u.groups.forEach(g => g.qs.forEach(q => { if (q.p != null && u.tr[q.p]) q.t = Math.max(0, u.tr[q.p].t - 0.5); }));
  u.mt = Date.now(); return u.ttr;
}
V.camtr = V.camtr || {};
IE.camTrBtn = t => {
  const b = V.camtr[t.id];
  return '<div class="card" style="margin-top:12px"><div class="row">' + bd('wave', 'L') + '<div style="flex:1"><b>Vaqtli transkript</b><div class="sm mu">' + (t.ttr ? 'Tayyor: natijada har abzatsdan tinglash mumkin.' + (t.ttr === 1 ? ' (AI matni — audioscript yo‘q)' : '') : 'AI audioni eshitib, transkriptni vaqtlari bilan tuzadi (1–2 daqiqa).') + '</div></div></div>' +
    (b && b.busy ? '<div class="mu sm row" style="gap:8px;margin-top:10px"><div class="spin sm"></div> ' + esc(b.msg || '') + '</div>' : (b && b.err ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:8px">' + esc(b.err) + '</p>' : '') + '<button class="btn sm' + (t.ttr ? ' ghost' : '') + ' block" style="margin-top:10px" data-a="camtr" data-id="' + esc(t.id) + '">' + ic('spark') + ' ' + (t.ttr ? 'Qayta tuzish' : 'Vaqtli transkript tuzish') + '</button>') + '</div>';
};
async function runTr(id) {
  const u = store.listening.find(x => x.id === id); if (!u) return; const b = V.camtr[id] = { busy: true, msg: 'Boshlanmoqda…' }; const redraw = () => { if (/^(listening|cambridge)/.test(IE.curRoute || '') && !$('#sheet')) IE.draw(false); }; redraw();
  try { await transcribeUnit(u, m => { b.msg = m; redraw(); }); await persist(); inject(); b.busy = false; b.err = ''; IE.toast('Transkript tayyor'); }
  catch (e) { b.busy = false; b.err = e.message || 'Xato'; }
  redraw();
}
A.camtr = el => runTr(el.dataset.id);
A.camtrall = async el => {
  const c = cb(), n = +el.dataset.n, ls = store.listening.filter(u => u.grp === c.book + ':' + n).sort((a, b) => a.sn - b.sn);
  for (const u of ls) { if (u.dur > 0 && !u.ttr) { await runTr(u.id); if ((V.camtr[u.id] || {}).err) break; } }
  IE.toast('Test ' + n + ': transkriptlar ' + (ls.every(u => u.ttr) ? 'tayyor' : 'to‘liq emas'));
};

/* ---------- import formasi ---------- */
const st = () => V.cam || (V.cam = {});
function readForm() {
  const s = st(), g = id => { const e = $('#' + id); return e ? e.value : undefined; };
  ['cbk', 'clb', 'cwh', 'cqa', 'cqb', 'cka', 'ckb', 'csa', 'csb', 'cfl', 'cfw'].forEach(id => { const v = g(id); if (v !== undefined) s[id] = v; });
}
function form(k) {
  const s = st(); if (s.k !== k) { for (const x in s) delete s[x]; s.k = k; }
  const books = IE.bookList ? IE.bookList() : [], r = k === 'r';
  const num = (id, ph) => '<input id="' + id + '" type="number" inputmode="numeric" min="1" class="fill" style="margin:0" placeholder="' + ph + '" value="' + esc(s[id] || '') + '">';
  const rng = (lab, a, b, hint) => '<div class="fld"><label>' + lab + '</label><div class="two">' + num(a, 'dan') + num(b, 'gacha') + '</div>' + (hint ? '<div class="sm mu" style="margin-top:4px">' + hint + '</div>' : '') + '</div>';
  const sel = s.cbk || (books[0] && books[0].id), prev = s.prev;
  const formH = !books.length ? '<div class="card c">' + bd('book', 'R', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<b>Avval kitob qo‘shing</b><p class="mu sm" style="margin:6px 0 12px">Cambridge IELTS kitobingizning PDF’ini “Kitoblar” bo‘limiga yuklang.</p><button class="btn" data-go="books">Kitoblarga o‘tish</button></div>' :
    '<div class="card"><div class="fld"><label>Kitob</label><select id="cbk">' + books.map(b => '<option value="' + b.id + '"' + (b.id === sel ? ' selected' : '') + '>' + esc(b.t) + ' (' + b.pg + ' bet)</option>').join('') + '</select></div>' +
    '<div class="fld"><label>Nomi (ro‘yxatda ko‘rinadi)</label><input id="clb" value="' + esc(s.clb || '') + '" placeholder="Masalan: Cambridge 16 · Test 2 · ' + (r ? 'Passage 1' : 'Section 1') + '" maxlength="60"></div>' +
    '<div class="fld"><label>' + (r ? 'Qaysi passage' : 'Qaysi section') + '</label><select id="cwh">' + (r ? [1, 2, 3] : [1, 2, 3, 4]).map(n => '<option value="' + n + '"' + (+s.cwh === n ? ' selected' : '') + '>' + (r ? 'Passage ' : 'Section ') + n + (r ? '' : ' (savol ' + ((n - 1) * 10 + 1) + '–' + n * 10 + ')') + '</option>').join('') + '</select></div>' +
    rng('Savol sahifalari (PDF bet raqami)', 'cqa', 'cqb', 'Kitobni “Kitoblar”da ochganda yuqoridagi bet raqami. Passage matni + savollar shu oraliqda bo‘lsin.') +
    rng('Javoblar kaliti sahifalari', 'cka', 'ckb', 'Kitob oxiridagi “Answer keys” (shu test uchun).') +
    (r ? '' : rng('Audioscript sahifalari (ixtiyoriy)', 'csa', 'csb', 'Transkript uchun. Bo‘lmasa bo‘sh qoldiring.') +
      '<div class="fld"><label>Audio fayl (ixtiyoriy, keyin ham qo‘shsa bo‘ladi)</label><label class="btn ghost block" style="margin:0">' + ic('down') + ' ' + (s.audio ? esc(s.audio.name.slice(0, 32)) : 'Audio tanlash') + '<input type="file" accept="audio/*,.mp3,.m4a,.wav" id="camaf0" hidden></label></div>') +
    (s.busy ? '<div class="mu sm row" style="gap:8px;margin-top:6px"><div class="spin sm"></div> ' + esc(s.busy) + '</div>' : '<button class="btn block" data-a="camgo">' + ic('spark') + ' AI bilan tayyorlash</button>') +
    (s.err ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(s.err) + '</p>' : '') + '</div>';
  const ft = s.ft || {}, fb = (id, lab, hint) => '<div class="fld"><label>' + lab + '</label><label class="btn ghost block" style="margin:0">' + ic('down') + ' ' + (ft[id] ? esc(ft[id].n.slice(0, 34)) + ' ✓ · ' + Math.round(ft[id].t.length / 1000) + ' ming belgi' : 'Fayl tanlash (HTML / PDF / TXT)') + '<input type="file" accept=".html,.htm,.pdf,.txt,.md,text/html,application/pdf,text/plain" multiple data-ft="' + id + '" hidden></label>' + (hint ? '<div class="sm mu" style="margin-top:4px">' + hint + '</div>' : '') + '</div>';
  const fileH = '<div class="card" style="margin-top:12px"><b>Fayldan olish (HTML / PDF / TXT)</b><p class="sm mu" style="margin:4px 0 10px;line-height:1.5">Cambridge CD dagi HTML test, PDF yoki matn fayli. Bir nechta fayl tanlasangiz, ular birlashtiriladi. Javoblar test faylida bo‘lsa — alohida kalit shart emas.</p>' +
    '<div class="fld"><label>Nomi</label><input id="cfl" value="' + esc(s.cfl || '') + '" placeholder="Masalan: Cambridge 17 · Test 1 · ' + (r ? 'Passage 1' : 'Section 1') + '" maxlength="60"></div>' +
    '<div class="fld"><label>' + (r ? 'Qaysi passage' : 'Qaysi section') + '</label><select id="cfw">' + (r ? [1, 2, 3] : [1, 2, 3, 4]).map(n => '<option value="' + n + '"' + (+s.cfw === n ? ' selected' : '') + '>' + (r ? 'Passage ' : 'Section ') + n + '</option>').join('') + '</select></div>' +
    fb('q', 'Test fayli (savollar' + (r ? ' + matn' : '') + ')') + fb('k', 'Javoblar kaliti (ixtiyoriy)', 'Alohida fayl bo‘lsa.') + (r ? '' : fb('sc', 'Audioscript (ixtiyoriy)')) +
    (s.busy ? '<div class="mu sm row" style="gap:8px"><div class="spin sm"></div> ' + esc(s.busy) + '</div>' : '<button class="btn block" data-a="camfgo"' + (ft.q ? '' : ' disabled') + '>' + ic('spark') + ' Fayldan AI bilan tayyorlash</button>') + (s.ferr ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(s.ferr) + '</p>' : '') + '</div>';
  const pv = prev ? '<div class="card" style="margin-top:12px"><b>' + esc(prev.unit.title) + '</b><div class="sm mu">' + nqs(prev.unit.groups) + ' ta savol' + (r ? ' · ' + prev.unit.paras.length + ' abzats' : ' · ' + prev.unit.tr.length + ' transkript bo‘lagi') + '</div>' +
    (prev.warn.length ? '<div class="tip8" style="margin-top:8px">' + prev.warn.slice(0, 5).map(esc).join('<br>') + (prev.warn.length > 5 ? '<br>…' : '') + '</div>' : '') +
    '<details style="margin-top:10px"><summary class="b" style="cursor:pointer">Javoblar kaliti — kitob bilan solishtiring</summary><div class="sm" style="margin-top:8px;line-height:1.7">' + prev.unit.groups.map(g => g.qs.map(q => '<b>' + q.n + '</b> ' + esc(answerTxt(g, q))).join(' · ')).join('<br>') + '</div></details>' +
    '<div class="two" style="margin-top:12px"><button class="btn ghost" data-a="camredo">Qayta</button><button class="btn" data-a="camsave">Saqlash</button></div></div>' : '';
  return sub(r ? 'Reading qo‘shish' : 'Listening qo‘shish', 'cambridge', '<div class="pad">' + formH + fileH + pv + '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Tayyor bo‘lgach javoblar kalitini kitob bilan tezda solishtirib chiqing — AI ba’zan xato qilishi mumkin.</p></div>');
}
/** Fayldan (HTML / PDF / TXT) import: fayl(lar) matni olinib, “Kitobdan” bilan bir xil AI (camimport) ga beriladi. */
async function fileSlot(id, files) {
  const s = st(); s.ft = s.ft || {}; s.ferr = '';
  try {
    const parts = []; for (const f of files) { s.busy = 'Fayl o‘qilmoqda: ' + f.name.slice(0, 30); IE.draw(false); parts.push(await IE.fileText(f, (i, t) => { s.busy = 'Fayl o‘qilmoqda: ' + f.name.slice(0, 24) + ' ' + i + '/' + t; paintBusy(); })); }
    const t = parts.join('\n\n').trim(); if (t.length < 20) throw new Error('Fayldan matn chiqmadi (rasm/skaner bo‘lishi mumkin — PDF bo‘lsa OCR urinildi).');
    s.ft[id] = { n: files.map(f => f.name).join(', '), t: t.slice(0, 60000) };
  } catch (e) { s.ferr = e.message || 'Faylni o‘qib bo‘lmadi'; }
  s.busy = ''; IE.draw(false);
}
A.camfgo = async () => {
  readForm(); const s = st(), r = s.k === 'r', ft = s.ft || {}; s.ferr = '';
  if (!ft.q) { s.ferr = 'Avval test faylini tanlang.'; return IE.draw(false); }
  const w = parseInt(s.cfw, 10) || 1, key = (ft.k && ft.k.t) || ft.q.t.slice(-12000);
  try {
    s.busy = 'AI testni tuzmoqda… (30–90 soniya)'; s.prev = null; IE.draw(false);
    const out = await IE.ai({ action: 'camimport', kind: r ? 'reading' : 'listening', which: w, text: ft.q.t, key, script: !r && ft.sc ? ft.sc.t : '' });
    s.prev = normUnit(s.k, out.result, (s.cfl || '').trim() || ('Cambridge · ' + (r ? 'Passage ' : 'Section ') + w), w);
  } catch (e) { s.ferr = e.message || 'Xatolik'; }
  s.busy = ''; IE.draw(false);
};
A.camredo = () => { const s = st(); s.prev = null; s.err = ''; IE.draw(false); };
A.camgo = async () => {
  readForm(); const s = st(), r = s.k === 'r', n = x => parseInt(x, 10);
  const book = s.cbk || (IE.bookList()[0] || {}).id, qa = n(s.cqa), qb = n(s.cqb), ka = n(s.cka), kb = n(s.ckb), sa = n(s.csa), sb = n(s.csb);
  s.err = '';
  if (!book) { s.err = 'Kitobni tanlang.'; return IE.draw(false); }
  if (!(qa > 0 && qb >= qa)) { s.err = 'Savol sahifalarini kiriting (masalan: 24 dan 27 gacha).'; return IE.draw(false); }
  if (!(ka > 0 && kb >= ka)) { s.err = 'Javoblar kaliti sahifalarini kiriting.'; return IE.draw(false); }
  const prog = (i, tot, ocr) => { s.busy = (ocr ? 'OCR: ' : 'Matn olinmoqda: ') + i + '/' + tot + ' bet…'; IE.draw(false); };
  try {
    s.busy = 'Matn olinmoqda…'; s.prev = null; IE.draw(false);
    const text = await IE.bookText(book, qa, qb, (i, t, o) => { s.busy = (o ? 'OCR (birinchi marta sekin): ' : 'Matn olinmoqda: ') + 'savollar ' + i + '/' + t; paintBusy(); });
    const key = await IE.bookText(book, ka, kb, (i, t, o) => { s.busy = (o ? 'OCR: ' : 'Matn olinmoqda: ') + 'javoblar kaliti ' + i + '/' + t; paintBusy(); });
    const script = !r && sa > 0 && sb >= sa ? await IE.bookText(book, sa, sb, (i, t) => { s.busy = 'Matn olinmoqda: audioscript ' + i + '/' + t; paintBusy(); }) : '';
    s.busy = 'AI testni tuzmoqda… (30–90 soniya)'; IE.draw(false);
    const out = await IE.ai({ action: 'camimport', kind: r ? 'reading' : 'listening', which: n(s.cwh) || 1, text, key, script });
    const bk = IE.bookList().find(b => b.id === book);
    s.prev = normUnit(s.k, out.result, (s.clb || '').trim() || ((bk ? bk.t : 'Cambridge') + ' · ' + (r ? 'Passage ' : 'Section ') + (s.cwh || 1)), n(s.cwh) || 1);
  } catch (e) { s.err = e.message || 'Xatolik'; }
  s.busy = ''; IE.draw(false);
};
function paintBusy() { const s = st(), b = $('.spin.sm'); if (b && b.parentElement) b.parentElement.lastChild.textContent = ' ' + s.busy; }
A.camsave = async () => {
  const s = st(), p = s.prev; if (!p) return;
  store[kindOf(s.k)].push(p.unit); await persist(); inject();
  if (s.k === 'l' && s.audio) { const f = s.audio; s.audio = null; await IE.camAudio(p.unit.id, f); }
  const keep = { k: s.k, cbk: s.cbk }; for (const x in s) delete s[x]; Object.assign(s, keep);
  IE.toast('Saqlandi — qurilmada'); IE.go('cambridge');
};
})();
