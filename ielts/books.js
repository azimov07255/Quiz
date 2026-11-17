/* IELTS · Kitoblar (PDF): yuklash, o‘qish (Matn / Sahifa), kunlik reja; qurilmada (IndexedDB) va ixtiyoriy bulutda (Supabase Storage) saqlash. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V;
const sub = (title, back, inner, right) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + '</header><div class="scr sub">' + inner + '</div>', sub: true });
const MAXCLOUD = 50 * 1024 * 1024, LOC = 'ielts:bkloc';
const dk = t => IE.dayKey(t);
const addDays = (k, n) => { const d = new Date(k + 'T00:00:00'); d.setDate(d.getDate() + n); return dk(d.getTime()); };
const diffDays = (a, b) => Math.round((new Date(b + 'T00:00:00') - new Date(a + 'T00:00:00')) / 864e5);
const fmtDay = k => { const d = new Date(k + 'T00:00:00'); return d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };
const mb = n => (n / 1048576).toFixed(n > 10485760 ? 0 : 1) + ' MB';
const books = () => (S().books || []).filter(b => !b.del).sort((a, b) => (b.mt || 0) - (a.mt || 0));
const bookOf = id => (S().books || []).find(b => b.id === id && !b.del);
const touch = b => { b.mt = Date.now(); };
const locSet = () => new Set(lsGet(LOC, []));
const locAdd = id => { const s = locSet(); s.add(id); lsSet(LOC, [...s]); };
const locDel = id => { const s = locSet(); s.delete(id); lsSet(LOC, [...s]); };
const hasLocal = id => locSet().has(id);
const uidPath = id => { const s = window.SB && SB.session(); return s && s.user ? s.user.id + '/' + id + '.pdf' : null; };

/* ---------- pdf.js (kerak bo‘lganda yuklanadi) ---------- */
const lib = () => V.pdfjs || (V.pdfjs = import('./vendor/pdfjs/pdf.min.mjs').then(m => { m.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdfjs/pdf.worker.min.mjs', document.baseURI).href; return m; }));

/* ---------- reja hisobi ---------- */
const fromOf = b => (b.day && b.day.d === dk() ? b.day.from : (b.max || 0));
const info = b => {
  if (!b.plan) return null;
  const t = dk(), from = fromOf(b), left = Math.max(0, b.pg - from), done = Math.max(0, (b.max || 0) - from), fin = (b.max || 0) >= b.pg;
  let target, end;
  if (b.plan.mode === 'per') { target = Math.max(1, b.plan.per | 0); end = addDays(t, Math.max(0, Math.ceil(left / target) - 1)); }
  else { end = b.plan.end; const dl = Math.max(1, diffDays(t, end) + 1); target = Math.ceil(left / dl); }
  target = Math.min(target, left);
  return { target, done, need: Math.max(0, target - done), end, fin, from, to: Math.min(b.pg, from + target), late: b.plan.mode === 'end' && diffDays(t, b.plan.end) < 0 };
};
IE.bookPlans = () => books().map(b => ({ b, i: info(b) })).filter(x => x.i && !x.i.fin);

/* ---------- saqlash: qurilma + bulut ---------- */
async function cloudPut(id, buf) {
  const p = uidPath(id); if (!p) throw new Error('Kirmagansiz');
  const r = await SB.raw('/storage/v1/object/ielts-books/' + p, { method: 'POST', headers: { 'content-type': 'application/pdf', 'x-upsert': 'true' }, body: buf });
  if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.message || j.error || ('HTTP ' + r.status)); }
}
async function cloudGet(id) {
  const p = uidPath(id); if (!p) throw new Error('Kirmagansiz');
  const r = await SB.raw('/storage/v1/object/authenticated/ielts-books/' + p);
  if (!r.ok) throw new Error(r.status === 400 || r.status === 404 ? 'Bulutda fayl topilmadi' : 'HTTP ' + r.status);
  return r.arrayBuffer();
}
async function cloudDel(id) { const p = uidPath(id); if (!p) return; try { await SB.raw('/storage/v1/object/ielts-books/' + p, { method: 'DELETE' }); } catch (e) { /* */ } }

/* ---------- ro‘yxat ---------- */
const cover = b => '<span class="bkc">' + (b.t || '?').trim().charAt(0).toUpperCase() + '</span>';
R.books = () => {
  const L = books(), bn = V.bkNew, busy = V.bkBusy;
  const up = '<div class="card"><div class="row">' + bd('down', 'R') + '<div style="flex:1"><b>PDF kitob qo‘shish</b><div class="sm mu">Kitobni telefonda yoki bulutda saqlang, o‘qing va kunlik reja tuzing.</div></div></div>' +
    (busy ? '<div class="mu sm row" style="gap:8px;margin-top:12px"><div class="spin sm"></div> ' + esc(busy) + '</div>' : '<label class="btn block" style="margin-top:12px">' + ic('plus') + ' PDF tanlash<input type="file" accept="application/pdf,.pdf" id="bkf" hidden></label>') + '</div>';
  const list = L.length ? '<div class="lst rise">' + L.map(b => {
    const pct = b.pg ? Math.round((b.max || 0) / b.pg * 100) : 0, i = info(b), loc = hasLocal(b.id);
    return '<div class="item bki"><button class="bkm" data-go="book/' + b.id + '">' + cover(b) + '<div class="tx"><b>' + esc(b.t) + '</b><span>' + (b.max || 0) + ' / ' + b.pg + ' bet · ' + pct + '%' + (i && !i.fin ? ' · bugun ' + (i.need ? i.need + ' bet' : 'bajarildi ✓') : '') + '</span>' +
      '<div class="prog" style="margin-top:6px"><i style="width:' + pct + '%"></i></div><div class="bkt">' + (loc ? '<em>' + ic('lock') + ' qurilmada</em>' : '') + (b.cloud ? '<em>' + ic('cloud') + ' bulutda</em>' : '') + '</div></div></button>' +
      '<button class="ib sm2" data-a="bkmenu" data-id="' + b.id + '" aria-label="Amallar">' + ic('list') + '</button></div>';
  }).join('') + '</div>' : '<div class="card empty rise">' + bd('book', 'R') + 'Hali kitob yo‘q.<br>IELTS kitobi, Cambridge yoki istalgan PDF’ni qo‘shing.</div>';
  const o = sub('Kitoblar', 'tools', '<div class="pad">' + up + '<div class="sec"><h2>Mening kitoblarim</h2></div>' + list + '<p class="mu sm" style="margin:14px 2px">PDF fayllar faqat sizga ko‘rinadi. Bulutga yuklash ixtiyoriy (fayl 50 MB gacha) — yuklangan kitobni boshqa qurilmangizdan ham ochasiz.</p></div>');
  if (bn) setTimeout(() => { if (!$('#sheet')) newSheet(); }, 0);
  return o;
};

/* ---------- yangi kitob ---------- */
IE.bookAdd = async file => {
  if (!file) return;
  if (!/pdf$/i.test(file.type) && !/\.pdf$/i.test(file.name)) return IE.toast('Faqat PDF fayl');
  V.bkBusy = 'PDF o‘qilmoqda…'; IE.draw(false);
  try {
    const buf = await file.arrayBuffer(), pdf = await lib(), doc = await pdf.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
    let t = ''; try { const m = await doc.getMetadata(); t = (m.info && m.info.Title || '').trim(); } catch (e) { /* */ }
    const pg = doc.numPages; doc.destroy();
    if (!t || t.length < 3 || t.length > 120) t = file.name.replace(/\.pdf$/i, '').replace(/[_]+/g, ' ');
    V.bkNew = { buf, t: t.slice(0, 120), pg, sz: file.size };
  } catch (e) { IE.toast('PDF ochilmadi' + (e && e.name === 'PasswordException' ? ' (parol bilan himoyalangan)' : '')); }
  V.bkBusy = ''; IE.draw(false);
};
function newSheet() {
  const n = V.bkNew; if (!n) return;
  const big = n.sz > MAXCLOUD;
  IE.sheet('<h2>Kitobni saqlash</h2><p class="mu" style="margin:4px 0 12px"><b>' + esc(n.t) + '</b> · ' + n.pg + ' bet · ' + mb(n.sz) + '</p>' +
    '<button class="btn block" data-a="bksave" data-c="0">' + ic('lock') + ' Faqat shu qurilmada</button>' +
    '<button class="btn block ghost" style="margin-top:10px"' + (big ? ' disabled' : ' data-a="bksave" data-c="1"') + '>' + ic('cloud') + ' Bulutda ham (boshqa qurilmada ochiladi)</button>' +
    (big ? '<p class="mu sm" style="margin-top:8px">Bulutga 50 MB gacha fayl yuklanadi; bu kitob katta — faqat qurilmada saqlanadi.</p>' : '') +
    '<button class="btn block ghost" style="margin-top:10px" data-a="bkcancel">Bekor</button>');
}
A.bkcancel = () => { V.bkNew = null; IE.closeSheet(); };
A.bksave = async el => {
  const n = V.bkNew; if (!n) return; const cloud = el.dataset.c === '1'; IE.closeSheet(); V.bkNew = null;
  const id = 'b' + Date.now(); V.bkBusy = 'Saqlanmoqda…'; IE.draw(false);
  try {
    await IE.idbSet('book:' + id, n.buf); locAdd(id);
    const b = { id, t: n.t, pg: n.pg, sz: n.sz, ts: Date.now(), mt: Date.now(), cloud: false, cur: 1, max: 0, day: null, log: {}, plan: null };
    if (cloud) { V.bkBusy = 'Bulutga yuklanmoqda…'; IE.draw(false); try { await cloudPut(id, n.buf); b.cloud = true; } catch (e) { IE.toast('Bulutga yuklanmadi: ' + e.message); } }
    S().books.push(b); IE.touchDay(); IE.save(true); IE.toast(b.cloud ? 'Qurilma va bulutda saqlandi' : 'Qurilmada saqlandi');
    V.bkBusy = ''; IE.go('book/' + id + '/plan');
  } catch (e) { V.bkBusy = ''; IE.toast('Saqlab bo‘lmadi (xotira to‘lgan bo‘lishi mumkin)'); IE.draw(false); }
};

/* ---------- kitob amallari menyusi ---------- */
A.bkmenu = el => {
  const b = bookOf(el.dataset.id); if (!b) return; const loc = hasLocal(b.id);
  IE.sheet('<h2 style="font-size:19px">' + esc(b.t) + '</h2><div class="lst" style="margin-top:12px">' +
    '<button class="item" data-a="bkplango" data-id="' + b.id + '">' + bd('cal', 'T', 'sm') + '<div class="tx"><b>Reja</b><span>Kunlik bet yoki tugatish sanasi</span></div></button>' +
    (!b.cloud ? '<button class="item" data-a="bkcloud" data-id="' + b.id + '">' + bd('cloud', 'R', 'sm') + '<div class="tx"><b>Buluta yuklash</b><span>' + (loc ? 'Boshqa qurilmalarda ham ochiladi' : 'Avval qurilmaga yuklab oling') + '</span></div></button>'
      : '<button class="item" data-a="bkuncloud" data-id="' + b.id + '">' + bd('cloud', 'R', 'sm') + '<div class="tx"><b>Bulutdan olib tashlash</b><span>Faqat shu qurilmada qoladi</span></div></button>') +
    (b.cloud && loc ? '<button class="item" data-a="bkunlocal" data-id="' + b.id + '">' + bd('lock', 'R', 'sm') + '<div class="tx"><b>Qurilmadan olib tashlash</b><span>Joy bo‘shaydi; bulutdan qayta ochiladi</span></div></button>' : '') +
    '<button class="item" data-a="bkdel" data-id="' + b.id + '">' + bd('trash', 'W', 'sm') + '<div class="tx"><b>O‘chirish</b><span>Qurilma va bulutdan butunlay</span></div></button></div>');
};
A.bkplango = el => { IE.closeSheet(); IE.go('book/' + el.dataset.id + '/plan'); };
A.bkcloud = async el => {
  const b = bookOf(el.dataset.id); if (!b) return; IE.closeSheet();
  const buf = await IE.idbGet('book:' + b.id); if (!buf) return IE.toast('Fayl bu qurilmada yo‘q');
  if (buf.byteLength > MAXCLOUD) return IE.toast('Fayl 50 MB dan katta — bulutga sig‘maydi');
  V.bkBusy = 'Bulutga yuklanmoqda…'; IE.draw(false);
  try { await cloudPut(b.id, buf); b.cloud = true; touch(b); IE.save(true); IE.toast('Bulutga yuklandi'); } catch (e) { IE.toast('Yuklanmadi: ' + e.message); }
  V.bkBusy = ''; IE.draw(false);
};
A.bkuncloud = async el => { const b = bookOf(el.dataset.id); if (!b) return; IE.closeSheet(); if (!hasLocal(b.id)) return IE.toast('Fayl bu qurilmada yo‘q — avval ochib yuklab oling'); await cloudDel(b.id); b.cloud = false; touch(b); IE.save(true); IE.draw(false); IE.toast('Bulutdan olib tashlandi'); };
A.bkunlocal = async el => { const b = bookOf(el.dataset.id); if (!b || !b.cloud) return; IE.closeSheet(); await IE.idbDel('book:' + b.id); locDel(b.id); if (V.bk && V.bk.id === b.id) V.bk = null; IE.draw(false); IE.toast('Qurilmadan olib tashlandi'); };
A.bkdel = el => { const b = bookOf(el.dataset.id); if (!b) return; IE.ask('Kitob o‘chirilsinmi?', '«' + b.t + '» qurilma va bulutdan o‘chadi.', 'O‘chirish', async () => { await cloudDel(b.id); try { await IE.idbDel('book:' + b.id); await IE.idbDel('bkocr:' + b.id); await IE.idbDel('bkidx:' + b.id); } catch (e) { /* */ } locDel(b.id); b.del = 1; touch(b); if (V.bk && V.bk.id === b.id) V.bk = null; IE.save(true); IE.go('books'); }); };

/* ---------- o‘qish ---------- */
async function openDoc(st) {
  try {
    let buf = await IE.idbGet('book:' + st.id);
    if (!buf) { st.msg = 'Bulutdan yuklanmoqda…'; paint(); const b = bookOf(st.id); if (!b || !b.cloud) throw new Error('Fayl bu qurilmada yo‘q'); buf = await cloudGet(st.id); await IE.idbSet('book:' + st.id, buf); locAdd(st.id); }
    const pdf = await lib(); st.doc = await pdf.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise; try { st.ocr = (await IE.idbGet('bkocr:' + st.id)) || {}; } catch (e) { st.ocr = {}; } st.status = 'ready';
  } catch (e) { st.status = 'err'; st.msg = e.message || 'Ochilmadi'; }
  if (V.bk === st) paint();
}
const curSt = () => V.bk && V.bk.status === 'ready' ? V.bk : null;
function paint() { if ((IE.curRoute || '').startsWith('book/')) IE.draw(false); }

R.book = a => {
  const id = a[0], b = bookOf(id); if (!b) return R.books([]);
  V.art = null;
  if (!V.bk || V.bk.id !== id) { if (V.bk && V.bk.doc) try { V.bk.doc.destroy(); } catch (e) { /* */ } V.bk = { id, status: 'load', msg: '', view: 'text', p: Math.min(b.pg, Math.max(1, b.cur || 1)), txt: {}, ocr: {}, z: 1, tok: 0 }; openDoc(V.bk); }
  const st = V.bk; if (a[1] === 'plan') { st.view = 'plan'; }
  if (st.status !== 'ready') return sub(b.t, 'books', st.status === 'err' ? '<div class="pad"><div class="card c">' + bd('book', 'W', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<b>Ochilmadi</b><p class="mu sm" style="margin:6px 0 12px">' + esc(st.msg) + '</p><button class="btn" data-go="books">Kitoblarga qaytish</button></div></div>' : '<div style="padding-top:34vh"><div class="spin"></div><p class="mu sm c" style="margin-top:10px">' + esc(st.msg || 'Ochilmoqda…') + '</p></div>');
  const pct = Math.round((b.max || 0) / b.pg * 100), views = [['text', 'Matn'], ['page', 'Sahifa'], ['find', 'Qidirish'], ['plan', 'Reja']];
  const inner = '<div class="pad bkpad"><div class="card" style="padding:12px 14px"><div class="row" style="justify-content:space-between"><b style="font-size:14px">' + (b.max || 0) + ' / ' + b.pg + ' bet</b><span class="chip">' + pct + '%</span></div><div class="prog" style="margin-top:8px"><i style="width:' + pct + '%"></i></div></div>' +
    '<div class="seg" style="margin-top:12px">' + views.map(v => '<button class="' + (st.view === v[0] ? 'on' : '') + '" data-a="bkv" data-v="' + v[0] + '">' + v[1] + '</button>').join('') + '</div><div id="bkbody"></div></div>' +
    (st.view === 'plan' || st.view === 'find' ? '' : '<div class="bar bkbar" id="bkbar"></div>');
  const o = sub(b.t, 'books', inner);
  o.mount = () => { paintBody(); };
  return o;
};
const setView = v => { const st = V.bk; if (!st) return; st.view = v; if (/\/plan$/.test(location.hash)) { history.replaceState(null, '', '#/book/' + st.id); IE.curRoute = 'book/' + st.id; } IE.draw(false); };
A.bkv = el => setView(el.dataset.v);

function barHTML() {
  const st = V.bk, b = bookOf(st.id);
  return '<div class="bkn"><button class="ib" data-a="bkgo" data-d="-1"' + (st.p <= 1 ? ' disabled' : '') + ' aria-label="Oldingi">' + ic('back') + '</button>' +
    '<button class="bkp" data-a="bkjump"><b>' + st.p + '</b> / ' + b.pg + '</button>' +
    (st.view === 'page' ? '<button class="ib" data-a="bkz" data-d="-0.5" aria-label="Kichraytirish">−</button><button class="ib" data-a="bkz" data-d="0.5" aria-label="Kattalashtirish">+</button>' : '<button class="ib" data-a="bkex" aria-label="Mashqqa aylantirish">' + ic('spark') + '</button>') +
    '<button class="ib pri" data-a="bkgo" data-d="1"' + (st.p >= b.pg ? ' disabled' : '') + ' aria-label="Keyingi">' + ic('next') + '</button></div>';
}
function paintBar() { const x = $('#bkbar'); if (x && V.bk) x.innerHTML = barHTML(); }
function paintBody() {
  const st = curSt(), box = $('#bkbody'); if (!st || !box) return;
  if (st.view === 'plan') return void (box.innerHTML = planHTML());
  if (st.view === 'find') return void findView(box);
  paintBar();
  if (st.view === 'page') return void pageView(box);
  textView(box);
}
const hlTerms = () => (V.bk && V.bk.hl ? V.bk.hl.toLowerCase().split(/\s+/).filter(t => t.length > 1) : []);
const tokens = s => { const ht = hlTerms(); return String(s).split(/([A-Za-z][A-Za-z’'-]*)/).map((x, i) => i % 2 ? '<span class="w' + (ht.length && ht.some(t => x.toLowerCase().includes(t)) ? ' hl' : '') + '" data-a="aword" data-w="' + esc(x.toLowerCase().replace(/’/g, '\'').replace(/^['-]+|['-]+$/g, '')) + '">' + esc(x) + '</span>' : esc(x)).join(''); };

async function pageText(p) { const st = V.bk; if (st.txt[p]) return st.txt[p]; return st.txt[p] = await extractParas(st.doc, p); }
async function extractParas(doc, p) {
  const pg = await doc.getPage(p), tc = await pg.getTextContent(), lines = []; let cur = null;
  for (const it of tc.items) {
    if (!('str' in it)) continue; const y = it.transform[5], h = it.height || Math.abs(it.transform[3]) || 10;
    if (!cur || Math.abs(y - cur.y) > h * 0.5) { cur = { y, s: '' }; lines.push(cur); }
    cur.s += it.str; if (it.hasEOL) cur = null;
  }
  const ls = lines.filter(l => l.s.trim()), gaps = ls.slice(1).map((l, i) => ls[i].y - l.y).filter(g => g > 0).sort((a, b) => a - b), typ = gaps.length ? gaps[Math.floor(gaps.length / 2)] : 12, maxLen = Math.max(1, ...ls.map(l => l.s.trim().length));
  const paras = []; let buf = '';
  const flush = () => { if (buf.trim()) paras.push(buf.trim()); buf = ''; };
  ls.forEach((l, i) => {
    const t = l.s.trim().replace(/\s+/g, ' '), pr = ls[i - 1], gap = pr ? pr.y - l.y : 0, pt = pr ? pr.s.trim() : '';
    if (pr && (gap > typ * 1.5 || (/[.!?:”"')]$/.test(pt) && pt.length < maxLen * 0.6))) flush();
    buf = buf ? (/[a-z]-$/.test(buf) && /^[a-z]/.test(t) ? buf.slice(0, -1) + t : buf + ' ' + t) : t;
  });
  flush(); return paras;
}
/** Betning abzaslari: PDF matn qatlami, bo‘lmasa (OCR qilingan bo‘lsa) OCR matni; auto=true bo‘lsa kerak bo‘lganda OCR ishga tushadi. */
async function pageParas(p, auto) {
  let ps = []; try { ps = await pageText(p); } catch (e) { /* */ }
  if (ps.join('').length >= 15) return ps;
  const st = V.bk, o = st.ocr[p]; if (o != null) return ocrParas(o);
  if (auto) return ocrParas(await ocrPage(p));
  return [];
}
async function textView(box) {
  const st = V.bk, p = st.p, b = bookOf(st.id); box.innerHTML = '<div style="padding:40px 0"><div class="spin"></div><p class="mu sm c" id="ocrp" style="margin-top:10px"></p></div>';
  let paras = [], err = '';
  try { paras = await pageParas(p, !!(b && b.ocr)); } catch (e) { err = e.message || 'OCR ishlamadi'; }
  if (V.bk !== st || st.p !== p || st.view !== 'text' || !$('#bkbody')) return;
  $('#bkbody').innerHTML = paras.length ? '<div class="bktx">' + paras.map(x => x.length < 70 && !/[.!?,;:]$/.test(x) ? '<h4>' + tokens(x) + '</h4>' : '<p>' + tokens(x) + '</p>').join('') + '</div><p class="hint" style="margin-top:14px">' + ic('eye') + ' So‘zni bossangiz — ma’nosi chiqadi va lug‘atingizga qo‘shiladi.' + (st.ocr[p] != null && (st.txt[p] || []).join('').length < 15 ? ' Matn OCR orqali tanildi — xatolar bo‘lishi mumkin.' : '') + '</p>'
    : '<div class="card c">' + bd('doc', 'R', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<b>Bu betda matn qatlami yo‘q</b><p class="mu sm" style="margin:6px 0 12px">' + (err ? esc(err) + '. ' : 'Skaner qilingan bet bo‘lishi mumkin. ') + 'OCR bilan matnni tanib olish mumkin (bir marta ~3 MB yuklanadi, keyin offline ishlaydi).</p><button class="btn block" data-a="bkocr">' + ic('spark') + ' Matnni tanib olish (OCR)</button><button class="btn block ghost" style="margin-top:8px" data-a="bkv" data-v="page">Sahifa rejimi</button></div>';
  mark(p);
  if (p < st.doc.numPages) pageText(p + 1).catch(() => {});
}
A.bkocr = () => { const b = V.bk && bookOf(V.bk.id); if (!b) return; b.ocr = 1; touch(b); IE.save(); paintBody(); };

/* ---------- OCR (tesseract.js, vendor/ — offline) ---------- */
const absU = p => new URL(p, document.baseURI).href;
const OCRT = { loading: 'Model yuklanmoqda', 'loading tesseract core': 'Dvigatel yuklanmoqda', 'initializing tesseract': 'Ishga tushmoqda', 'loading language traineddata': 'Til modeli yuklanmoqda', 'initializing api': 'Tayyorlanmoqda', 'recognizing text': 'Matn tanilmoqda' };
const tess = () => V.tess || (V.tess = new Promise((res, rej) => {
  const go = async () => { try { res(await window.Tesseract.createWorker('eng', 1, { workerPath: absU('vendor/tesseract/worker.min.js'), corePath: absU('vendor/tesseract/core'), langPath: absU('vendor/tesseract/lang'), logger: m => { const e = $('#ocrp'); if (e && m && m.status) e.textContent = (OCRT[m.status] || m.status) + (m.progress != null ? ' ' + Math.round(m.progress * 100) + '%' : ''); } })); } catch (e) { rej(e); } };
  if (window.Tesseract) return go();
  const sc = document.createElement('script'); sc.src = 'vendor/tesseract/tesseract.min.js'; sc.onload = go; sc.onerror = () => rej(new Error('OCR yuklanmadi (internet kerak)')); document.head.appendChild(sc);
}).catch(e => { V.tess = null; throw e; }));
const ocrParas = t => String(t || '').split(/\n{2,}/).map(x => x.replace(/([a-z])-\n(?=[a-z])/g, '$1').replace(/\s*\n\s*/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
let ocrSaveT = 0;
const saveOcr = st => { clearTimeout(ocrSaveT); ocrSaveT = setTimeout(() => { IE.idbSet('bkocr:' + st.id, st.ocr).catch(() => {}); if (st.idx) IE.idbSet('bkidx:' + st.id, { n: st.doc.numPages, t: st.idx }).catch(() => {}); }, 1500); };
async function ocrRaw(doc, p) {
  const w = await tess(), pg = await doc.getPage(p), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(3, 2000 / v0.width) });
  const cv = document.createElement('canvas'); cv.width = vp.width | 0; cv.height = vp.height | 0; await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
  const r = await w.recognize(cv); cv.width = cv.height = 0; return (r.data.text || '').trim();
}
function ocrPage(p) {
  const st = V.bk; st.jobs = st.jobs || {};
  if (st.ocr[p] != null) return Promise.resolve(st.ocr[p]);
  return st.jobs[p] || (st.jobs[p] = (async () => {
    try {
      const t = await ocrRaw(st.doc, p); st.ocr[p] = t; if (st.idx) st.idx[p] = t.replace(/\s+/g, ' '); saveOcr(st); return t;
    } finally { delete st.jobs[p]; }
  })());
}

/* ---------- qidiruv ---------- */
function buildIdx(st) {
  if (st.idx) return Promise.resolve(st.idx);
  return st.idxP || (st.idxP = (async () => {
    const n = st.doc.numPages; let c = null; try { c = await IE.idbGet('bkidx:' + st.id); } catch (e) { /* */ }
    const idx = c && c.n === n && Array.isArray(c.t) ? c.t.slice() : new Array(n + 1).fill(null);
    for (let p = 1; p <= n; p++) {
      if (V.bk !== st) throw new Error('stop');
      if (idx[p] == null) { try { const pg = await st.doc.getPage(p), tc = await pg.getTextContent(); idx[p] = tc.items.map(i => i.str || '').join(' ').replace(/\s+/g, ' ').trim(); } catch (e) { idx[p] = ''; } }
      if (!idx[p] && st.ocr[p]) idx[p] = st.ocr[p].replace(/\s+/g, ' ');
      if (p % 6 === 0 || p === n) { st.idxN = p; paintFind(); await new Promise(r => setTimeout(r, 0)); }
    }
    st.idx = idx; try { await IE.idbSet('bkidx:' + st.id, { n, t: idx }); } catch (e) { /* */ } paintFind(); return idx;
  })().catch(e => { st.idxP = null; throw e; }));
}
function findView(box) {
  const st = V.bk; box.innerHTML = '<div class="card"><input class="search" id="bks" data-in="bks" placeholder="Kitobdan so‘z yoki ibora qidiring…" value="' + esc(st.q || '') + '" autocapitalize="off" autocomplete="off" spellcheck="false"><div id="bkfs" class="sm mu" style="margin-top:10px"></div></div><div id="bkres" style="margin-top:12px"></div>';
  paintFind(); if (!st.idx) buildIdx(st).catch(() => {});
}
const empties = st => { const r = []; if (st.idx) for (let p = 1; p < st.idx.length; p++) if (!st.idx[p] && st.ocr[p] == null) r.push(p); return r; };
function paintFind() {
  const st = V.bk, fs = $('#bkfs'), rs = $('#bkres'); if (!st || st.view !== 'find' || !fs || !rs) return;
  const n = st.doc.numPages, em = empties(st), bt = st.batch;
  fs.innerHTML = !st.idx ? '<div class="prog"><i style="width:' + Math.round((st.idxN || 0) / n * 100) + '%"></i></div><div style="margin-top:6px">Indekslanmoqda… ' + (st.idxN || 0) + ' / ' + n + '</div>'
    : (n - em.length) + ' bet qidiruvga tayyor' + (bt ? '<div class="prog" style="margin-top:8px"><i style="width:' + Math.round(bt.i / bt.n * 100) + '%"></i></div><div style="margin-top:6px">OCR: ' + bt.i + ' / ' + bt.n + ' <button class="chip" data-a="bkocrstop">To‘xtatish</button></div>'
      : (em.length ? '<div style="margin-top:8px"><b>' + em.length + ' bet matnsiz</b> (skaner). OCR bilan qidiruvga qo‘shish mumkin.</div><button class="btn sm" style="margin-top:8px" data-a="bkocrall">' + ic('spark') + ' Hammasini OCR qilish</button>' : ''));
  if (!st.idx) { rs.innerHTML = ''; return; }
  const q = (st.q || '').trim().toLowerCase();
  if (q.length < 2) { rs.innerHTML = '<p class="hint">' + ic('eye') + ' Kamida 2 ta belgi yozing. Natijani bossangiz — o‘sha bet ochiladi va so‘z belgilanadi.</p>'; return; }
  const out = []; for (let p = 1; p < st.idx.length && out.length < 80; p++) { const t = st.idx[p] || '', k = t.toLowerCase().indexOf(q); if (k < 0) continue; const a = Math.max(0, k - 55), z = Math.min(t.length, k + q.length + 70); out.push('<button class="item bkr" data-a="bkfp" data-p="' + p + '"><span class="chip">' + p + '-bet</span><span class="tx" style="white-space:normal">' + (a ? '…' : '') + esc(t.slice(a, k)) + '<mark>' + esc(t.slice(k, k + q.length)) + '</mark>' + esc(t.slice(k + q.length, z)) + (z < t.length ? '…' : '') + '</span></button>'); }
  rs.innerHTML = out.length ? '<div class="lst">' + out.join('') + '</div>' + (out.length >= 80 ? '<p class="hint">Dastlabki 80 natija ko‘rsatildi.</p>' : '') : '<div class="card empty">“' + esc(st.q) + '” topilmadi.</div>';
}
IE.bks = el => { const st = V.bk; if (!st) return; st.q = el.value; clearTimeout(V.bksT); V.bksT = setTimeout(paintFind, 140); };
A.bkfp = el => { const st = curSt(); if (!st) return; st.p = +el.dataset.p; st.hl = (st.q || '').trim(); setView('text'); };
A.bkocrall = async () => {
  const st = curSt(); if (!st || st.batch || !st.idx) return; const todo = empties(st); if (!todo.length) return;
  const b = bookOf(st.id); if (b) { b.ocr = 1; touch(b); IE.save(); }
  st.batch = { i: 0, n: todo.length, stop: false }; paintFind();
  try { for (const p of todo) { if (st.batch.stop || V.bk !== st) break; await ocrPage(p); st.batch.i++; paintFind(); } } catch (e) { IE.toast('OCR to‘xtadi: ' + (e.message || '')); }
  const done = st.batch ? st.batch.i : 0; st.batch = null; saveOcr(st); paintFind(); if (V.bk === st) IE.toast(done + ' bet OCR qilindi');
};
A.bkocrstop = () => { if (V.bk && V.bk.batch) V.bk.batch.stop = true; };

async function pageView(box) {
  const st = V.bk, p = st.p, tok = ++st.tok;
  box.innerHTML = '<div class="bkpg" id="bkpg"><canvas id="bkcv"></canvas></div><div class="spin" id="bksp" style="margin-top:20px"></div>';
  try {
    const pg = await st.doc.getPage(p), wrap = $('#bkpg'), cv = $('#bkcv'); if (!wrap || !cv || tok !== st.tok) return;
    const vp0 = pg.getViewport({ scale: 1 }), cssW = wrap.clientWidth * st.z, dpr = Math.min(2.5, window.devicePixelRatio || 1), sc = Math.min(3600 / vp0.width, cssW * dpr / vp0.width), vp = pg.getViewport({ scale: sc });
    cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height); cv.style.width = (st.z * 100) + '%';
    await pg.render({ canvasContext: cv.getContext('2d'), viewport: vp }).promise;
    if (tok !== st.tok) return; const sp = $('#bksp'); if (sp) sp.remove(); mark(p);
  } catch (e) { if (tok === st.tok && $('#bkbody')) $('#bkbody').innerHTML = '<div class="card c">Betni chizib bo‘lmadi.</div>'; }
}
/** Yo‘nalishda oldinga siljish o‘qilgan deb hisoblanadi (reja uchun). */
function mark(p) {
  const st = V.bk, b = bookOf(st.id); if (!b) return;
  if (b.cur !== p) { b.cur = p; }
  if (p > (b.max || 0)) {
    const t = dk(); if (!b.day || b.day.d !== t) b.day = { d: t, from: b.max || 0 };
    b.max = p; b.log = b.log || {}; b.log[t] = b.max - b.day.from; const ks = Object.keys(b.log).sort(); while (ks.length > 30) delete b.log[ks.shift()];
    IE.touchDay();
  }
  touch(b); IE.saveLocal(); clearTimeout(V.bkT); V.bkT = setTimeout(() => IE.save(), 2500);
  const pr = $('.bkpad .prog i'), ch = $('.bkpad .chip'), bb = $('.bkpad .card b'); if (pr) pr.style.width = Math.round((b.max || 0) / b.pg * 100) + '%'; if (ch) ch.textContent = Math.round((b.max || 0) / b.pg * 100) + '%'; if (bb) bb.textContent = (b.max || 0) + ' / ' + b.pg + ' bet';
}
function setPage(p) { const st = curSt(), b = st && bookOf(st.id); if (!b) return; if (p !== st.p) st.hl = ''; p = Math.max(1, Math.min(b.pg, p | 0)); if (p === st.p) return; st.p = p; st.tok++; window.scrollTo(0, 0); const sc = $('.scr'); if (sc) sc.scrollTop = 0; paintBody(); }
A.bkgo = el => { const st = curSt(); if (st) setPage(st.p + (+el.dataset.d)); };
A.bkz = el => { const st = curSt(); if (!st) return; st.z = Math.max(1, Math.min(3, st.z + (+el.dataset.d))); paintBody(); };
A.bkjump = () => { const st = curSt(), b = st && bookOf(st.id); if (!b) return; IE.sheet('<h2>Betga o‘tish</h2><p class="mu sm" style="margin:4px 0 12px">1 – ' + b.pg + '</p><input id="bkjn" type="number" inputmode="numeric" min="1" max="' + b.pg + '" value="' + st.p + '" class="fill" style="font-size:20px;text-align:center;width:100%"><button class="btn block" style="margin-top:12px" data-a="bkjgo">O‘tish</button>'); setTimeout(() => { const i = $('#bkjn'); if (i) { i.focus(); i.select(); } }, 60); };
A.bkjgo = () => { const i = $('#bkjn'), v = i ? parseInt(i.value, 10) : 0; IE.closeSheet(); if (v) setPage(v); };
/** Joriy bet (+ keyingi ikkitasi) matnini maqola/mashqqa aylantiradi: AI lug‘at, grammatika, savollar. */
A.bkex = async () => {
  const st = curSt(), b = st && bookOf(st.id); if (!st) return; IE.toast('Matn tayyorlanmoqda…');
  let text = ''; for (let p = st.p; p <= Math.min(b.pg, st.p + 2) && text.length < 6000; p++) { try { text += (await pageParas(p, !!b.ocr)).join('\n\n') + '\n\n'; } catch (e) { /* */ } }
  text = text.trim(); if (text.length < 300) return IE.toast('Bu betlarda yetarli matn yo‘q');
  if (IE.addArticle) IE.addArticle(b.t + ' — ' + st.p + '-bet', text.slice(0, 6500), '', '');
};

/* ---------- reja ---------- */
function planHTML() {
  const st = V.bk, b = bookOf(st.id), i = info(b), m = (V.bkPlan && V.bkPlan.id === b.id) ? V.bkPlan.mode : (b.plan ? b.plan.mode : 'end');
  const days = []; for (let k = 6; k >= 0; k--) { const d = addDays(dk(), -k); days.push([d, (b.log && b.log[d]) || 0]); }
  const mx = Math.max(5, ...days.map(x => x[1])), wk = days.reduce((s, x) => s + x[1], 0);
  const dn = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
  const hero = i ? (i.fin ? '<div class="card c">' + bd('trophy', 'M', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<h3>Kitob tugadi! 🎉</h3><p class="mu sm">Barakalla — ' + b.pg + ' bet o‘qildi.</p></div>'
    : '<div class="card"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">Bugungi reja</div><div style="font-size:30px;font-weight:900;margin:2px 0">' + (i.need ? i.need + ' bet qoldi' : 'Bajarildi ✓') + '</div>' +
      '<div class="sm mu">Maqsad: <b>' + i.target + ' bet</b> (' + (i.from + 1) + '–' + i.to + '-betlar) · bugun o‘qildi: <b>' + i.done + '</b></div><div class="prog" style="margin-top:10px"><i style="width:' + (i.target ? Math.min(100, Math.round(i.done / i.target * 100)) : 100) + '%"></i></div>' +
      '<div class="sm mu" style="margin-top:10px">' + (i.late ? '<b style="color:#f43f5e">Muddat o‘tib ketgan</b> — yangi sana tanlang.' : 'Tugatish: <b>' + fmtDay(i.end) + '</b> (' + Math.max(0, diffDays(dk(), i.end)) + ' kun)') + '</div></div>'
    + '<button class="btn block" style="margin:12px 0" data-a="bkread">' + ic('book') + ' O‘qishni davom ettirish</button>')
    : '<div class="card"><b>Reja hali yo‘q</b><p class="mu sm" style="margin:4px 0 0">Tugatish sanasini yoki kunlik bet sonini kiriting — har kuni qancha o‘qish kerakligi hisoblanadi.</p></div>';
  const form = '<div class="card" style="margin-top:12px"><b>Reja tuzish</b><div class="seg" style="margin:10px 0 4px"><button class="' + (m === 'end' ? 'on' : '') + '" data-a="bkpm" data-m="end">Tugatish sanasi</button><button class="' + (m === 'per' ? 'on' : '') + '" data-a="bkpm" data-m="per">Kunlik bet</button></div>' +
    (m === 'end' ? '<input id="bkpe" type="date" class="fill" style="width:100%" min="' + dk() + '" value="' + esc(b.plan && b.plan.mode === 'end' ? b.plan.end : addDays(dk(), 30)) + '">' : '<input id="bkpp" type="number" inputmode="numeric" min="1" max="' + b.pg + '" class="fill" style="width:100%" value="' + (b.plan && b.plan.mode === 'per' ? b.plan.per : 10) + '" placeholder="Kuniga necha bet?">') +
    '<div class="two" style="margin-top:12px"><button class="btn" data-a="bkps">Saqlash</button>' + (b.plan ? '<button class="btn ghost" data-a="bkpx">Rejani o‘chirish</button>' : '') + '</div></div>';
  const chart = '<div class="card" style="margin-top:12px"><div class="row" style="justify-content:space-between"><b>So‘nggi 7 kun</b><span class="chip">' + wk + ' bet</span></div><div class="bkch">' + days.map(([d, n]) => '<div><i style="height:' + Math.round(n / mx * 100) + '%"></i><small>' + dn[new Date(d + 'T00:00:00').getDay()] + '</small></div>').join('') + '</div></div>';
  return hero + form + chart;
}
A.bkpm = el => { const st = V.bk; if (!st) return; V.bkPlan = { id: st.id, mode: el.dataset.m }; paintBody(); };
A.bkps = () => {
  const st = V.bk, b = st && bookOf(st.id); if (!b) return; const m = (V.bkPlan && V.bkPlan.id === b.id) ? V.bkPlan.mode : (b.plan ? b.plan.mode : 'end');
  if (m === 'end') { const e = $('#bkpe') && $('#bkpe').value; if (!e || e < dk()) return IE.toast('Kelajakdagi sanani tanlang'); b.plan = { mode: 'end', end: e, start: dk() }; }
  else { const n = parseInt($('#bkpp') && $('#bkpp').value, 10); if (!n || n < 1) return IE.toast('Kuniga necha bet?'); b.plan = { mode: 'per', per: Math.min(n, b.pg), start: dk() }; }
  if (!b.day || b.day.d !== dk()) b.day = { d: dk(), from: b.max || 0 };
  touch(b); IE.save(true); IE.toast('Reja saqlandi'); paintBody();
};
A.bkpx = () => { const st = V.bk, b = st && bookOf(st.id); if (!b) return; b.plan = null; touch(b); IE.save(true); paintBody(); };
A.bkread = () => { const st = V.bk, b = st && bookOf(st.id); if (!b) return; st.p = Math.min(b.pg, Math.max(1, b.cur || 1)); setView('text'); };

/* ---------- Home uchun: bugungi reja ---------- */
IE.bookHome = () => {
  const pl = IE.bookPlans().slice(0, 2); if (!pl.length) return '';
  return pl.map(({ b, i }) => '<div class="rise" style="margin-top:14px"><button class="item" data-go="book/' + b.id + '">' + cover(b) + '<div class="tx"><b>Bugungi reja: ' + esc(b.t) + '</b><span>' + (i.need ? i.need + ' bet qoldi (' + (i.from + 1) + '–' + i.to + ')' : 'Bugungi reja bajarildi ✓') + '</span></div><span class="go">' + ic('next') + '</span></button></div>').join('');
};

/* ---------- boshqa modullar uchun: kitob ro‘yxati va sahifa matni (Cambridge import) ---------- */
IE.bookList = () => books();
async function openRaw(id) {
  const bk = bookOf(id); if (!bk) throw new Error('Kitob topilmadi');
  let buf = await IE.idbGet('book:' + id);
  if (!buf) { if (!bk.cloud) throw new Error('Fayl bu qurilmada yo‘q'); buf = await cloudGet(id); await IE.idbSet('book:' + id, buf); locAdd(id); }
  const pdf = await lib(); return pdf.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
}
/** Fayldan matn: PDF (matn qatlami, bo‘lmasa OCR), HTML (Cambridge CD sahifalari), TXT/MD. */
IE.fileText = async (f, prog) => {
  const nm = String(f.name || '').toLowerCase();
  if (/\.pdf$/.test(nm) || f.type === 'application/pdf') {
    const pdf = await lib(), doc = await pdf.getDocument({ data: new Uint8Array(await f.arrayBuffer()) }).promise;
    try {
      const n = Math.min(doc.numPages, 60), out = [];
      for (let p = 1; p <= n; p++) { if (prog) prog(p, n); let t = (await extractParas(doc, p)).join('\n\n'); if (t.length < 15) { try { t = await ocrRaw(doc, p); } catch (e) { t = ''; } } out.push('--- page ' + p + ' ---\n' + t); }
      return out.join('\n\n');
    } finally { try { doc.destroy(); } catch (e) { /* */ } }
  }
  const raw = await f.text();
  if (/\.html?$/.test(nm) || /^\s*<(!doctype|html|body|div|p)\b/i.test(raw)) {
    const d = new DOMParser().parseFromString(raw, 'text/html');
    d.querySelectorAll('script,style,noscript,svg,head,nav,footer,iframe').forEach(e => e.remove());
    d.querySelectorAll('br').forEach(e => e.replaceWith('\n'));
    d.querySelectorAll('p,div,li,tr,h1,h2,h3,h4,h5,h6,section,article,table,ul,ol,dt,dd,label,legend,fieldset').forEach(e => e.append('\n'));
    d.querySelectorAll('td,th').forEach(e => e.append(' \t '));
    d.querySelectorAll('input[type=text],input:not([type])').forEach(e => e.replaceWith(' ______ '));
    d.querySelectorAll('select').forEach(e => e.replaceWith(' [' + [...e.options].map(o => o.textContent.trim()).filter(Boolean).join(' / ') + '] '));
    return String(d.body ? d.body.textContent : d.documentElement.textContent).replace(/[ \t\u00a0]+/g, ' ').replace(/ *\n */g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  }
  return raw.replace(/\r/g, '').trim();
};
/** Butun kitob betlari matni (to‘liq, keshlanadi; matn qatlami bo‘lmasa OCR keshidan). */
async function loadIdx(doc, id, prog) {
  const n = doc.numPages; let c = null; try { c = await IE.idbGet('bkidx:' + id); } catch (e) { /* */ }
  const idx = c && c.n === n && Array.isArray(c.t) ? c.t.slice() : new Array(n + 1).fill(null); let ocr = {}; try { ocr = (await IE.idbGet('bkocr:' + id)) || {}; } catch (e) { /* */ }
  let dirty = false;
  for (let p = 1; p <= n; p++) {
    if (idx[p] == null) { try { const pg = await doc.getPage(p), tc = await pg.getTextContent(); idx[p] = tc.items.map(i => i.str || '').join(' ').replace(/\s+/g, ' ').trim(); } catch (e) { idx[p] = ''; } dirty = true; }
    if (!idx[p] && ocr[p]) idx[p] = String(ocr[p]).replace(/\s+/g, ' ');
    if (prog && (p % 10 === 0 || p === n)) { prog(p, n); await new Promise(r => setTimeout(r, 0)); }
  }
  if (dirty) { try { await IE.idbSet('bkidx:' + id, { n, t: idx }); } catch (e) { /* */ } }
  return { n, idx };
}
/** Butun kitobning har bir beti boshi/oxiri (struktura aniqlash uchun). Matn qidiruv indeksiga ham keshlanadi. */
IE.bookSnips = async (id, prog) => {
  const doc = await openRaw(id);
  try {
    const { n, idx } = await loadIdx(doc, id, prog);
    const snips = [], empty = []; for (let p = 1; p <= n; p++) { const t = idx[p] || ''; if (t.length < 15) empty.push(p); snips.push({ p, t: t.length <= 230 ? t : t.slice(0, 170) + ' … ' + t.slice(-60) }); }
    return { n, snips, empty: empty.length };
  } finally { try { doc.destroy(); } catch (e) { /* */ } }
};
/** Butun kitob betlarining to‘liq matni: { n, t:[null, p1, p2, …] } */
IE.bookPages = async (id, prog) => {
  const doc = await openRaw(id);
  try { const { n, idx } = await loadIdx(doc, id, prog); return { n, t: idx }; } finally { try { doc.destroy(); } catch (e) { /* */ } }
};
/** Kitobning bitta betini JPEG (data URL) qilib beradi — AI ko‘rishi (diagramma, savol varaqasi) uchun. */
IE.bookPageImg = async (id, p, maxW) => {
  const doc = await openRaw(id);
  try {
    const pg = await doc.getPage(p), v0 = pg.getViewport({ scale: 1 }), vp = pg.getViewport({ scale: Math.min(3, (maxW || 1400) / v0.width) });
    const cv = document.createElement('canvas'); cv.width = vp.width | 0; cv.height = vp.height | 0;
    const g = cv.getContext('2d'); g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height); await pg.render({ canvasContext: g, viewport: vp }).promise;
    const d = cv.toDataURL('image/jpeg', 0.82); cv.width = cv.height = 0; return d;
  } finally { try { doc.destroy(); } catch (e) { /* */ } }
};
/** Kitobning a..b betlari matni (matn qatlami; bo‘lmasa OCR). prog(i, n, 'ocr'?) — jarayon. */
IE.bookText = async (id, a, b, prog) => {
  const bk = bookOf(id); if (!bk) throw new Error('Kitob topilmadi');
  let buf = await IE.idbGet('book:' + id);
  if (!buf) { if (!bk.cloud) throw new Error('Fayl bu qurilmada yo‘q'); buf = await cloudGet(id); await IE.idbSet('book:' + id, buf); locAdd(id); }
  const pdf = await lib(), doc = await pdf.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
  try {
    a = Math.max(1, a | 0); b = Math.min(doc.numPages, b | 0); if (b < a) throw new Error('Sahifa oralig‘i noto‘g‘ri');
    if (b - a > 40) throw new Error('Bir martada ko‘pi bilan 40 bet');
    let ocr = {}; try { ocr = (await IE.idbGet('bkocr:' + id)) || {}; } catch (e) { /* */ } let dirty = false; const out = [];
    for (let p = a; p <= b; p++) {
      if (prog) prog(p - a + 1, b - a + 1, '');
      let t = (await extractParas(doc, p)).join('\n\n');
      if (t.length < 15) { if (ocr[p] == null) { if (prog) prog(p - a + 1, b - a + 1, 'ocr'); ocr[p] = await ocrRaw(doc, p); dirty = true; } t = ocr[p]; }
      out.push('--- page ' + p + ' ---\n' + t);
    }
    if (dirty) { try { await IE.idbSet('bkocr:' + id, ocr); } catch (e) { /* */ } }
    return out.join('\n\n');
  } finally { try { doc.destroy(); } catch (e) { /* */ } }
};
})();
