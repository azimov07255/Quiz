/* IELTS · Cambridge Reading va Listening: shaxsiy import. Kitob (PDF) sahifalaridan AI yordamida test tuziladi;
   natija FAQAT shu qurilmada (IndexedDB) saqlanadi — repoga ham, bulutga ham chiqmaydi (mualliflik huquqi). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet } = IE, R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const sub = (title, back, inner) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1></header><div class="scr sub">' + inner + '</div>', sub: true });
const KEY = 'camt', TYPES = ['heads', 'tfng', 'fill', 'mcq'];
let store = { reading: [], listening: [], del: {} };
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
  const out = { reading: [], listening: [], del };
  ['reading', 'listening'].forEach(k => { const m = new Map(); [...(a[k] || []), ...(b[k] || [])].forEach(u => { if (!u || !u.id) return; const o = m.get(u.id); if (!o || (u.mt || 0) > (o.mt || 0) || ((u.mt || 0) === (o.mt || 0) && u.cau && !o.cau)) m.set(u.id, u); }); out[k] = [...m.values()].filter(u => !(del[u.id] && del[u.id] >= (u.mt || 0))); });
  return out;
}
let syncing = null;
/** Bulutdagi indeks bilan qo‘shadi (id bo‘yicha, oxirgi o‘zgargani yutadi), kerak bo‘lsa audioni yuklaydi. true — mahalliy o‘zgardi. */
function camSync(manual) {
  if (syncing) return syncing;
  return syncing = (async () => {
    if (!cloudOn() || !window.SB || !SB.session()) return false;
    let remote = { reading: [], listening: [], del: {} };
    try { const r = await cGet('index.json'); if (r) { const j = await r.json(); if (j && Array.isArray(j.reading)) remote = j; } } catch (e) { if (manual) IE.toast(navigator.onLine ? 'Bulutga ulanib bo‘lmadi' : 'Internet yo‘q'); return false; }
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
IE.camSync = camSync;
function inject() {
  if (D.reading && D.reading.passages) D.reading.passages = D.reading.passages.filter(p => !p.priv).concat(store.reading.map(p => Object.assign({}, p, { priv: 1 })));
  if (D.listening && D.listening.tests) {
    const old = new Map((D.listening.tests || []).filter(t => t.priv).map(t => [t.id, t]));
    D.listening.tests = D.listening.tests.filter(t => !t.priv).concat(store.listening.map(t => { const o = old.get(t.id), keep = o ? { audio: o.audio, noaudio: o.noaudio } : {}; return Object.assign(o || {}, t, { priv: 1 }, keep); }));
  }
}
IE.camLoad = async () => { try { const s = await IE.idbGet(KEY); if (s && Array.isArray(s.reading) && Array.isArray(s.listening)) store = Object.assign({ del: {} }, s); } catch (e) { /* */ } inject(); setTimeout(() => camSync().catch(() => {}), 800); };

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
    if (paras.length < 2 || paras.reduce((s, p) => s + p.t.length, 0) < 600) throw new Error('Matn (passage) to‘liq chiqmadi. Sahifalarni tekshiring.');
    if (new Set(paras.map(p => p.k)).size !== paras.length) paras = paras.map((p, i) => Object.assign(p, { k: String(i + 1) }));
    return { unit: { id, mt: Date.now(), title, topic, level: 'Cambridge IELTS', cam: label || title, paras, groups }, warn };
  }
  const tr = (Array.isArray(raw.tr) ? raw.tr : []).map(x => ({ t: null, x: String(x.x || x.t || '').trim() })).filter(x => x.x);
  return { unit: { id, mt: Date.now(), title, topic: 'Cambridge · ' + title, sec: 'Section ' + (which || ''), level: 'Cambridge IELTS', cam: label || title, audio: '', dur: 0, credit: { name: 'Cambridge IELTS (shaxsiy nusxa)', url: '' }, tr, groups }, warn };
}
const answerTxt = (g, q) => g.type === 'mcq' ? 'ABCDEFGHIJ'[q.a] + ' — ' + (q.o[q.a] || '') : Array.isArray(q.a) ? q.a.join(' / ') : q.a;

/* ---------- audio (qurilmada) ---------- */
IE.camAudio = async (id, file) => {
  const t = store.listening.find(x => x.id === id); if (!t) return;
  const dur = await new Promise(res => { const a = new Audio(), u = URL.createObjectURL(file); a.preload = 'metadata'; a.onloadedmetadata = () => { res(isFinite(a.duration) ? Math.round(a.duration) : 0); URL.revokeObjectURL(u); }; a.onerror = () => { res(-1); URL.revokeObjectURL(u); }; a.src = u; });
  if (dur < 0) return IE.toast('Bu audio fayl ochilmadi (mp3/m4a/wav bo‘lsin)');
  await IE.idbSet('camaud:' + id, { buf: await file.arrayBuffer(), type: file.type || 'audio/mpeg' });
  t.dur = dur; t.mt = Date.now(); t.cau = 0; await persist(); const live = D.listening.tests.find(x => x.id === id); if (live) { if (live.audio) { try { URL.revokeObjectURL(live.audio); } catch (e) { /* */ } } live.dur = dur; live.audio = ''; live.noaudio = false; }
  IE.toast('Audio saqlandi (' + Math.floor(dur / 60) + ':' + String(dur % 60).padStart(2, '0') + ')'); IE.draw(false);
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
const kindOf = k => k === 'l' ? 'listening' : 'reading';
const rowH = (k, x) => {
  const nq = nqs(x.groups), noAud = k === 'l' && !(x.dur > 0);
  return '<div class="item" style="padding:8px 8px 8px 12px"><button class="row" style="flex:1;min-width:0;text-align:left" data-go="' + (k === 'r' ? 'reading/' + x.id + '/run' : 'listening/' + x.id) + '">' + bd(k === 'r' ? 'book' : 'head', k === 'r' ? 'R' : 'L', 'sm') + '<div class="tx"><b>' + esc(x.cam || x.title) + '</b><span>' + esc(x.title) + ' · ' + nq + ' savol' + (noAud ? ' · <b style="color:var(--warn)">audio yo‘q</b>' : '') + '</span></div></button><button class="ib" data-a="camdel" data-k="' + k + '" data-id="' + x.id + '" aria-label="O‘chirish">' + ic('trash') + '</button></div>';
};
R.cambridge = a => a[0] === 'new' ? form(a[1] === 'l' ? 'l' : 'r') : hub();
function hub() {
  const rd = store.reading, ls = store.listening;
  return sub('Cambridge IELTS', 'practice', '<div class="pad"><div class="card rise"><div class="row">' + bd('book', 'R', 'lg') + '<div style="flex:1"><b style="font-size:16px">Shaxsiy Cambridge testlari</b><div class="sm mu">Kitobingiz (PDF) sahifalaridan Reading passage va Listening section tuzing — keyin oddiy testdek yechasiz (band, tahlil, tarix).</div></div></div></div>' +
    '<div class="two" style="margin-top:12px"><button class="btn" data-go="cambridge/new/r">' + ic('plus') + ' Reading</button><button class="btn" data-go="cambridge/new/l">' + ic('plus') + ' Listening</button></div>' +
    '<div class="row" style="margin-top:12px;gap:8px;flex-wrap:wrap"><label class="chip" style="display:inline-flex">' + ic('doc') + ' JSON fayldan yuklash<input type="file" accept=".json,application/json" id="camj" hidden></label><button class="chip' + (cloudOn() ? ' on' : '') + '" data-a="camcl">' + ic('cloud') + ' Bulut: ' + (cloudOn() ? 'yoqilgan' : 'o‘chiq') + '</button>' + (cloudOn() ? '<button class="chip" data-a="camsyn">' + ic('refresh') + ' Sinxronlash</button>' : '') + '</div>' +
    (!rd.length && !ls.length ? '<div class="card rise" style="margin-top:14px"><b style="font-size:16px">Testlar hozircha yo‘q — o‘zingiz qo‘shasiz</b><div class="sm mu" style="margin:6px 0 10px">Cambridge matnlari ilovada tayyor emas (mualliflik huquqi). Kitobingizdan 3 qadamda olinadi:</div>' +
      '<div class="lst"><button class="item" data-go="books"><span class="qn">1</span><div class="tx"><b>Kitob PDF’ini yuklang</b><span>Kitoblar → PDF tanlash (telefondagi fayl)</span></div><span class="go">' + ic('next') + '</span></button>' +
      '<button class="item" data-go="cambridge/new/r"><span class="qn">2</span><div class="tx"><b>Reading qo‘shing</b><span>Passage va javoblar kaliti bet raqamlarini kiriting</span></div><span class="go">' + ic('next') + '</span></button>' +
      '<button class="item" data-go="cambridge/new/l"><span class="qn">3</span><div class="tx"><b>Listening qo‘shing</b><span>Section bet raqamlari + mp3 audio</span></div><span class="go">' + ic('next') + '</span></button></div></div>' : '') +
    '<div class="sec"><h2>Reading (' + rd.length + ')</h2></div>' + (rd.length ? '<div class="lst">' + rd.map(x => rowH('r', x)).join('') + '</div>' : '<div class="card empty">Hali Reading qo‘shilmagan.</div>') +
    '<div class="sec"><h2>Listening (' + ls.length + ')</h2></div>' + (ls.length ? '<div class="lst">' + ls.map(x => rowH('l', x)).join('') + '</div>' : '<div class="card empty">Hali Listening qo‘shilmagan.</div>') +
    '<p class="hint" style="margin-top:14px">' + ic('lock') + ' ' + (cloudOn() ? 'Testlar va audio shaxsiy bulut omboringizda ham saqlanadi (faqat siz ko‘rasiz) — boshqa qurilmangizda ham chiqadi.' : 'Bulut o‘chiq: testlar faqat shu qurilmada.') + ' Tayyorlash vaqtida tanlangan sahifalar matni AI’ga yuboriladi. Materialni faqat o‘zingiz uchun ishlating.</p></div>');
}
A.camdel = el => { const k = el.dataset.k, id = el.dataset.id; IE.ask('Test o‘chirilsinmi?', 'Qurilma va bulutdan butunlay o‘chadi (natijalar tarixi qoladi).', 'O‘chirish', async () => { store[kindOf(k)] = store[kindOf(k)].filter(x => x.id !== id); store.del = store.del || {}; store.del[id] = Date.now(); try { await IE.idbDel('camaud:' + id); } catch (e) { /* */ } if (cloudOn()) cDel('aud-' + id); await persist(); inject(); IE.draw(false); }); };

A.camcl = () => { lsSet('ielts:camcloud', cloudOn() ? 0 : 1); if (cloudOn()) { IE.toast('Bulut yoqildi'); camSync(true); } else IE.toast('Bulut o‘chirildi (mavjud nusxalar bulutda qoladi)'); IE.draw(false); };
A.camsyn = () => { camSync(true); };

/* ---------- JSON yuklash ---------- */
IE.camJson = async file => {
  try {
    const j = JSON.parse(await file.text()); let n = 0;
    const add = (k, list) => (Array.isArray(list) ? list : []).forEach(raw => { try { const { unit } = normUnit(k, raw, raw.cam || raw.title, raw.sec); store[kindOf(k)].push(unit); n++; } catch (e) { /* o‘tkazib */ } });
    if (Array.isArray(j.reading) || Array.isArray(j.listening)) { add('r', j.reading); add('l', j.listening); } else if (j && j.groups) add(j.paras ? 'r' : 'l', [j]);
    if (!n) return IE.toast('JSON ichida yaroqli test topilmadi');
    await persist(); inject(); IE.toast(n + ' ta test qo‘shildi'); IE.draw(false);
  } catch (e) { IE.toast('JSON o‘qilmadi'); }
};
IE.camChange = el => {
  const f = el.files && el.files[0]; if (!f) return false;
  if (el.id === 'camj') { el.value = ''; IE.camJson(f); return true; }
  if (el.id === 'camaf') { const id = el.dataset.id; el.value = ''; IE.camAudio(id, f); return true; }
  if (el.id === 'camaf0') { readForm(); V.cam.audio = f; IE.draw(false); return true; }
  return false;
};

/* ---------- import formasi ---------- */
const st = () => V.cam || (V.cam = {});
function readForm() {
  const s = st(), g = id => { const e = $('#' + id); return e ? e.value : undefined; };
  ['cbk', 'clb', 'cwh', 'cqa', 'cqb', 'cka', 'ckb', 'csa', 'csb'].forEach(id => { const v = g(id); if (v !== undefined) s[id] = v; });
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
  const pv = prev ? '<div class="card" style="margin-top:12px"><b>' + esc(prev.unit.title) + '</b><div class="sm mu">' + nqs(prev.unit.groups) + ' ta savol' + (r ? ' · ' + prev.unit.paras.length + ' abzats' : ' · ' + prev.unit.tr.length + ' transkript bo‘lagi') + '</div>' +
    (prev.warn.length ? '<div class="tip8" style="margin-top:8px">' + prev.warn.slice(0, 5).map(esc).join('<br>') + (prev.warn.length > 5 ? '<br>…' : '') + '</div>' : '') +
    '<details style="margin-top:10px"><summary class="b" style="cursor:pointer">Javoblar kaliti — kitob bilan solishtiring</summary><div class="sm" style="margin-top:8px;line-height:1.7">' + prev.unit.groups.map(g => g.qs.map(q => '<b>' + q.n + '</b> ' + esc(answerTxt(g, q))).join(' · ')).join('<br>') + '</div></details>' +
    '<div class="two" style="margin-top:12px"><button class="btn ghost" data-a="camredo">Qayta</button><button class="btn" data-a="camsave">Saqlash</button></div></div>' : '';
  return sub(r ? 'Reading qo‘shish' : 'Listening qo‘shish', 'cambridge', '<div class="pad">' + formH + pv + '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Tayyor bo‘lgach javoblar kalitini kitob bilan tezda solishtirib chiqing — AI ba’zan xato qilishi mumkin.</p></div>');
}
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
