/* Testlar — fan → mavzu → 4 variantli testlar. Vanilla JS, build bosqichisiz.
   Savol banki: IndexedDB. Natijalar/xatolar/sozlamalar: localStorage. Hech qanday server yoki kalit yo‘q. */
(() => {
'use strict';

// ───────────── yordamchilar ─────────────
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => keyOf(new Date());
const addDays = (k, n) => { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return keyOf(d); };
const diffDays = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const fmtDate = k => { const [y, m, d] = String(k).split('-'); return d + '.' + m + '.' + y; };
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad(s % 60); };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const LET = 'ABCD';

// ───────────── holat (localStorage) ─────────────
const LS = 'testlar:state:v1';
const normState = o => {
  o = o && typeof o === 'object' ? o : {};
  const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  const set = Object.assign({ sh: 1, sec: 45 }, obj(o.set));
  return { h: Array.isArray(o.h) ? o.h : [], m: obj(o.m), f: obj(o.f), sn: obj(o.sn), ex: obj(o.ex), set };
};
let S = (() => { try { return normState(JSON.parse(localStorage.getItem(LS))); } catch (e) { return normState(null); } })();
let saveFailed = false;
const save = () => { try { localStorage.setItem(LS, JSON.stringify(S)); saveFailed = false; } catch (e) { saveFailed = true; } };

// ───────────── savol banki (IndexedDB) ─────────────
const idb = () => new Promise((res, rej) => {
  const r = indexedDB.open('testlar-app', 1);
  r.onupgradeneeded = () => r.result.createObjectStore('d');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
async function idbDo(mode, fn) {
  const d = await idb();
  return new Promise((res, rej) => {
    const t = d.transaction('d', mode); const rq = fn(t.objectStore('d'));
    t.oncomplete = () => { d.close(); res(rq && rq.result); };
    t.onerror = t.onabort = () => { d.close(); rej(t.error); };
  });
}
const idbGet = () => idbDo('readonly', s => s.get('bank'));
const idbSet = v => idbDo('readwrite', s => s.put(v, 'bank'));
const idbDel = () => idbDo('readwrite', s => s.delete('bank'));

let TB = null, TBX = {};
function indexBank(d) {
  TB = d && d.subjects.length ? d : null; TBX = {};
  if (TB) TB.subjects.forEach(s => s.topics.forEach(t => t.q.forEach(q => { TBX[q.id] = { s, t, q }; })));
}
const topicsAll = () => TB ? TB.subjects.flatMap(s => s.topics) : [];
const findTopic = id => topicsAll().find(t => t.id === id);
const findSubj = id => TB && TB.subjects.find(s => s.id === id);
const subjQ = sid => { const s = findSubj(sid); return s ? s.topics.flatMap(t => t.q.map(q => q.id)) : []; };
const topicQ = id => { const t = findTopic(id); return t ? t.q.map(q => q.id) : []; };
const subjCount = s => s.topics.reduce((a, t) => a + t.q.length, 0);

/** Bankni tekshiradi. {err:[], warn:[]} qaytaradi. */
function checkBank(d) {
  const err = [], warn = [];
  if (!d || typeof d !== 'object' || d.v !== 1 || !Array.isArray(d.subjects) || !d.subjects.length)
    return { err: ['bu test banki fayli emas (v:1 va subjects kerak)'], warn };
  if (d.subjects.length > 60) err.push('fanlar soni 60 dan oshmasin');
  const qid = new Set(), tid = new Set(), sid = new Set();
  d.subjects.forEach((s, si) => {
    if (!s || typeof s.id !== 'string' || !s.id || typeof s.name !== 'string' || !Array.isArray(s.topics)) { err.push(`${si + 1}-fan: id/name/topics noto‘g‘ri`); return; }
    if (sid.has(s.id)) err.push(`fan id takrorlangan: ${s.id}`); sid.add(s.id);
    s.topics.forEach((t, ti) => {
      if (!t || typeof t.id !== 'string' || !t.id || typeof t.name !== 'string' || !Array.isArray(t.q)) { err.push(`${s.name}: ${ti + 1}-mavzu noto‘g‘ri`); return; }
      if (tid.has(t.id)) err.push(`mavzu id takrorlangan: ${t.id}`); tid.add(t.id);
      if (t.q.length > 2000) err.push(`${t.name}: 2000 dan ko‘p savol`);
      t.q.forEach((q, qi) => {
        const w = `${t.name} › ${qi + 1}-savol`;
        if (!q || typeof q.id !== 'string' || !q.id || typeof q.q !== 'string' || !q.q.trim() || !Array.isArray(q.o) || q.o.length !== 4
          || !q.o.every(o => typeof o === 'string' && o.trim()) || !Number.isInteger(q.a) || q.a < 0 || q.a > 3
          || (q.e != null && typeof q.e !== 'string') || (q.r != null && typeof q.r !== 'string')) { err.push(w + ': format xato'); return; }
        if (qid.has(q.id)) err.push(`${w}: id takrorlangan (${q.id})`); qid.add(q.id);
        if (new Set(q.o.map(o => o.trim().toLowerCase())).size < 4) warn.push(`${w}: bir xil variantlar bor`);
      });
    });
  });
  return { err, warn };
}
function mergeBank(a, b) {
  const o = a ? JSON.parse(JSON.stringify(a)) : { v: 1, subjects: [] };
  b.subjects.forEach(s => {
    const x = o.subjects.find(y => y.id === s.id);
    if (!x) { o.subjects.push(JSON.parse(JSON.stringify(s))); return; }
    x.name = s.name;
    s.topics.forEach(t => { const i = x.topics.findIndex(y => y.id === t.id); const c = JSON.parse(JSON.stringify(t)); if (i < 0) x.topics.push(c); else x.topics[i] = c; });
  });
  return o;
}

// ───────────── ko‘rinish holati ─────────────
let V = { v: 'home', sid: '', n: 20, mo: 'm', sel: {}, msg: null };
let Q = null, R = null, TI = 0;
const setMsg = (t, ok) => { V.msg = t ? { t, ok: !!ok } : null; };

function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600);
}

// ───────────── hisoblar ─────────────
const misIds = () => Object.keys(S.m).filter(i => TBX[i]);
const dueIds = () => { const T = today(); return misIds().filter(i => !S.m[i].nx || S.m[i].nx <= T); };
const flagIds = () => Object.keys(S.f).filter(i => TBX[i]);
const hist = key => S.h.filter(x => x.t === key);
const best = key => { const L = hist(key); return L.length ? Math.max(...L.map(x => pct(x.ok, x.n))) : null; };
const last = key => { const L = hist(key); return L.length ? pct(L[L.length - 1].ok, L[L.length - 1].n) : null; };
function subjAvg(s) {
  const keys = new Set(['s:' + s.id, ...s.topics.map(t => t.id)]);
  const L = S.h.filter(x => keys.has(x.t));
  return L.length ? Math.round(L.reduce((a, x) => a + x.ok / x.n, 0) / L.length * 100) : null;
}
function plan(sid) {
  const d = S.ex[sid]; if (!d) return null;
  const ids = subjQ(sid), seen = ids.filter(i => S.sn[i]).length, rem = ids.length - seen, left = diffDays(today(), d);
  if (left < 0) return { past: true, d };
  return { d, left, total: ids.length, seen, rem, quota: rem ? Math.ceil(rem / Math.max(1, left)) : 0 };
}
function keyName(k) {
  if (k.startsWith('s:')) { const s = findSubj(k.slice(2)); return 'Fan: ' + (s ? s.name : k.slice(2)); }
  if (k.startsWith('u:')) { const s = findSubj(k.slice(2)); return 'Reja: ' + (s ? s.name : k.slice(2)); }
  return { a: 'Umumiy test', m: 'Xatolar banki', f: 'Belgilanganlar', d: 'Takrorlash', c: 'Tanlangan mavzular' }[k] || (findTopic(k) || { name: k }).name;
}

// ───────────── testni boshlash ─────────────
function pool(c) {
  switch (c.kind) {
    case 't': return topicQ(c.id);
    case 's': return subjQ(c.id);
    case 'c': return (c.extra || []).flatMap(topicQ);
    case 'm': return misIds();
    case 'f': return flagIds();
    case 'd': return dueIds();
    case 'u': { const ids = subjQ(c.id), un = ids.filter(i => !S.sn[i]); return un.length ? un : ids; }
    default: return Object.keys(TBX);
  }
}
function begin(c) {
  let ids = shuffle(pool(c));
  if (!ids.length) { toast('Bu bo‘limda savol yo‘q'); return; }
  ids = ids.slice(0, c.n > 0 ? Math.min(c.n, ids.length) : ids.length);
  const sh = S.set.sh !== 0, now = Date.now();
  Q = { cfg: c, mo: c.mo, label: c.label || '', ids, i: 0, ans: {}, rv: {}, sf: {}, fin: false, t0: now,
    ord: ids.map(() => sh ? shuffle([0, 1, 2, 3]) : [0, 1, 2, 3]),
    dl: c.mo === 'e' ? now + ids.length * S.set.sec * 1000 : 0 };
  R = null; V.v = 'quiz'; startTimer(); draw(); window.scrollTo(0, 0);
}
const cfgOf = (kind, id, label, extra) => ({ kind, id: id || '', label, extra, n: ['m', 'f', 'd'].includes(kind) ? 0 : V.n, mo: V.mo });

function startTimer() {
  clearInterval(TI);
  if (!Q || !Q.dl) return;
  TI = setInterval(() => {
    if (!Q || Q.fin || V.v !== 'quiz') { clearInterval(TI); return; }
    const l = Math.round((Q.dl - Date.now()) / 1000), e = $('#tmr');
    if (e) e.textContent = mmss(l);
    if (l <= 0) { clearInterval(TI); toast('⏰ Vaqt tugadi'); finish(true); }
  }, 500);
}

function answer(k) {
  if (!Q || Q.fin || Q.mo === 'o') return;
  const i = Q.i, id = Q.ids[i];
  if (Q.mo === 'm' && Q.ans[id] !== undefined) return;
  Q.ans[id] = Q.ord[i][k]; draw(false);
  const fb = $('.fb'); if (fb) fb.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}
function go(d) { if (!Q) return; Q.i = Math.max(0, Math.min(Q.ids.length - 1, Q.i + d)); draw(); window.scrollTo(0, 0); }
function rate(r) { if (!Q || Q.fin) return; const id = Q.ids[Q.i], q = TBX[id].q; Q.sf[id] = r; Q.ans[id] = r === 'y' ? q.a : -1; draw(false); }
function flag(id) { S.f[id] ? delete S.f[id] : S.f[id] = 1; save(); draw(false); }

function finish(force) {
  if (!Q || Q.fin) return;
  const un = Q.ids.filter(id => Q.ans[id] === undefined).length;
  if (un && !force && !confirm(un + ' ta savolga javob berilmagan. Baribir yakunlansinmi?')) return;
  clearInterval(TI); Q.fin = true;
  const T = today(); let ok = 0; const wrong = [];
  Q.ids.forEach(id => {
    const q = TBX[id].q, a = Q.ans[id];
    if (a !== undefined) S.sn[id] = T;
    if (a === q.a) {
      ok++; const m = S.m[id];
      if (m) { m.s = (m.s || 0) + 1; if (m.s >= 2) delete S.m[id]; else m.nx = addDays(T, 3); }
    } else {
      wrong.push(id); const m = S.m[id] = S.m[id] || { w: 0, s: 0 };
      m.w++; m.s = 0; m.l = T; m.nx = addDays(T, 1);
    }
  });
  const c = Q.cfg, key = c.kind === 't' ? c.id : ['s', 'u'].includes(c.kind) ? c.kind + ':' + c.id : c.kind;
  const rec = { id: Date.now(), d: T, t: key, n: Q.ids.length, ok, sec: Math.round((Date.now() - Q.t0) / 1000), mo: Q.mo };
  S.h.push(rec); if (S.h.length > 400) S.h.splice(0, S.h.length - 400);
  R = { rec, wrong, un, ans: Q.ans, cfg: c, ord: Q.ord, ids: Q.ids };
  V.v = 'res'; save(); draw(); window.scrollTo(0, 0);
}
function quit() { if (confirm('Test to‘xtatilsinmi? Natija saqlanmaydi.')) { clearInterval(TI); Q = null; V.v = V.sid ? 'subj' : 'home'; draw(); } }

// ───────────── ko‘rinishlar ─────────────
const noteHtml = () => V.msg ? `<div class="note ${V.msg.ok ? 'okn' : ''}" role="status">${esc(V.msg.t)}</div>` : '';
const nChips = () => `<div class="chips" role="group" aria-label="Savollar soni"><small style="align-self:center">Savollar soni:</small>${[10, 20, 30, 50, 0].map(n => `<button class="chip ${V.n === n ? 'on' : ''}" data-a="setN" data-n="${n}" aria-pressed="${V.n === n}">${n || 'hammasi'}</button>`).join('')}</div>`;
const modeSeg = () => `<div class="seg" role="group" aria-label="Rejim">${[['m', '✍️ Mashq'], ['e', '⏱ Imtihon'], ['o', '🧠 Ochiq']].map(([k, n]) => `<button class="${V.mo === k ? 'on' : ''}" data-a="setMo" data-mo="${k}" aria-pressed="${V.mo === k}">${n}</button>`).join('')}</div><p class="mu s" style="margin:-2px 0 6px">${{ m: 'Har javobdan keyin izoh ko‘rinadi.', e: `Taymer (savolga ${S.set.sec} s), natija oxirida.`, o: 'Avval o‘zing o‘ylaysan, keyin javobni ko‘rib o‘zingni baholaysan.' }[V.mo]}</p>`;

function emptyView() {
  return `<h1>📝 Testlar</h1>${noteHtml()}<div class="card"><h2>Savol banki hali yo‘q</h2>
  <p class="mu">Kitob yoki PDF’dan tuzilgan <code>testlar-banki.json</code> faylni bir marta yuklaysan — u shu qurilmada saqlanadi va internetsiz ishlaydi.</p>
  <button class="big" data-a="pickBank">📥 Fayl tanlash</button>
  <button class="btn" style="width:100%;margin-top:8px" data-a="sample">📚 Namuna bankni yuklash</button></div>
  <div class="card"><h2>Bank qanday olinadi?</h2><p class="mu">Kitob/PDF/slaydlarni Claude’ga tashlaysan, u fan → mavzu → 4 variantli savollar qilib <code>.json</code> beradi. Batafsil: <code>KITOBDAN_TEST.md</code>.</p></div>`;
}

function homeView() {
  if (!TB) return emptyView();
  const due = dueIds().length, mis = misIds().length, fl = flagIds().length;
  const pl = TB.subjects.map(s => ({ s, p: plan(s.id) })).filter(x => x.p && !x.p.past && x.p.quota);
  let h = `<h1>📝 Testlar</h1>${noteHtml()}`;
  if (due || pl.length) {
    h += `<div class="card"><div class="hd"><h2>Bugun</h2><span class="chip static">${fmtDate(today())}</span></div>`;
    if (due) h += `<button class="row btnrow" data-a="start" data-kind="d" data-label="🔁 Bugun takrorlash"><span class="t">🔁 Takrorlash: <b>${due} ta</b> savol</span><span>▶</span></button>`;
    pl.forEach(({ s, p }) => { h += `<button class="row btnrow" data-a="plan" data-id="${esc(s.id)}"><span class="t">📅 ${esc(s.name)}<br><small>${p.left ? p.left + ' kun qoldi' : 'imtihon bugun'} · bugun ${p.quota} ta yangi savol</small></span><span>▶</span></button>`; });
    h += '</div>';
  }
  h += `${nChips()}${modeSeg()}
  <div class="in"><button class="btn" data-a="start" data-kind="a" data-label="Hamma fanlar">🎲 Umumiy test</button>
  <button class="btn" data-a="start" data-kind="m" data-label="Xatolar banki" ${mis ? '' : 'disabled'}>❗ Xatolar (${mis})</button></div>
  ${fl ? `<div class="chips"><button class="chip" data-a="nav" data-v="flag">🚩 Belgilangan savollar (${fl})</button></div>` : ''}
  <h2 style="margin:16px 0 4px">Fanlar</h2>`;
  TB.subjects.forEach(s => {
    const a = subjAvg(s);
    h += `<button class="row btnrow" data-a="subj" data-id="${esc(s.id)}"><span class="t"><b>${esc(s.name)}</b><br><small>${s.topics.length} mavzu · ${subjCount(s)} savol${a !== null ? ' · o‘rtacha ' + a + '%' : ''}</small></span><span>›</span></button>`;
  });
  return h;
}

function subjView() {
  const s = findSubj(V.sid); if (!s) { V.v = 'home'; return homeView(); }
  const sel = s.topics.filter(t => V.sel[t.id]), selQ = sel.reduce((a, t) => a + t.q.length, 0), p = plan(s.id);
  let h = `<div class="top"><button class="x" data-a="nav" data-v="home" aria-label="Orqaga">‹</button><h1 style="margin:0;flex:1;text-align:center;font-size:19px">${esc(s.name)}</h1><span style="width:44px"></span></div>${noteHtml()}`;
  if (p && !p.past) h += `<div class="card"><div class="hd"><b>📅 Imtihon: ${fmtDate(p.d)}</b><span class="chip static">${p.left} kun</span></div><div class="bar ok"><i style="width:${pct(p.seen, p.total)}%"></i></div><p class="mu s" style="margin:0 0 8px">Ko‘rilgan ${p.seen}/${p.total}${p.rem ? ' · kuniga ' + p.quota + ' ta yangi savol' : ' · hammasi ko‘rilgan, takrorlash vaqti'}</p><button class="btn s" style="width:100%" data-a="plan" data-id="${esc(s.id)}" ${p.quota ? '' : 'disabled'}>▶ Bugungi ${p.quota} ta savol</button></div>`;
  h += `${nChips()}${modeSeg()}<button class="big" data-a="start" data-kind="s" data-id="${esc(s.id)}" data-label="${esc(s.name)}">🎲 Butun fandan umumiy test (${subjCount(s)})</button>
  <div class="hd" style="margin:16px 0 0"><h2>Mavzular</h2><button class="chip" data-a="selAll">${sel.length === s.topics.length ? 'Belgini olish' : 'Hammasini tanlash'}</button></div>
  <p class="mu s" style="margin:2px 0">Mavzu nomiga bosib shu mavzudan boshlaysan, katakchalar bilan bir nechtasini birlashtirasan.</p>`;
  s.topics.forEach(t => {
    const b = best(t.id), l = last(t.id);
    h += `<div class="row"><input type="checkbox" data-c="sel" data-id="${esc(t.id)}" ${V.sel[t.id] ? 'checked' : ''} aria-label="${esc(t.name)} tanlash"><button class="t" style="background:none;border:0;text-align:left;padding:0" data-a="start" data-kind="t" data-id="${esc(t.id)}" data-label="${esc(t.name)}"><b>${esc(t.name)}</b><br><small>${t.q.length} savol${t.src ? ' · ' + esc(t.src) : ''}${b !== null ? ' · eng yaxshi ' + b + '%' : ''}${l !== null ? ' · oxirgi ' + l + '%' : ''}</small></button><span>▶</span></div>`;
  });
  h += `<div class="sticky"><button class="big" data-a="startSel" ${sel.length ? '' : 'disabled'}>${sel.length ? `▶ Tanlanganlardan test (${sel.length} mavzu · ${selQ} savol)` : 'Katakchalar bilan mavzu tanlang'}</button></div>`;
  return h;
}

function optionsHtml(id, x) {
  const i = Q.i, q = x.q, ord = Q.ord[i], a = Q.ans[id], ex = Q.mo === 'm';
  return ord.map((oi, k) => {
    let cls = 'opt';
    if (a !== undefined) { if (ex) { if (oi === q.a) cls += ' ok'; else if (oi === a) cls += ' bad'; } else if (oi === a) cls += ' sel'; }
    return `<button class="${cls}" data-a="ans" data-k="${k}" ${ex && a !== undefined ? 'disabled' : ''}><span class="l">${LET[k]}</span><span>${esc(q.o[oi])}</span></button>`;
  }).join('');
}
function quizView() {
  if (!Q) return '';
  const i = Q.i, id = Q.ids[i], x = TBX[id], q = x.q, open = Q.mo === 'o', a = Q.ans[id], ex = Q.mo === 'm', fl = !!S.f[id], lastQ = i >= Q.ids.length - 1;
  const answered = a !== undefined;
  const head = `<div class="top"><small>${esc(Q.label)} · <b>${i + 1} / ${Q.ids.length}</b>${open ? ' · 🧠' : ''}</small>${Q.dl ? `<span class="tmr" id="tmr">${mmss((Q.dl - Date.now()) / 1000)}</span>` : ''}<button class="x" data-a="quit" aria-label="To‘xtatish">✕</button></div><div class="bar"><i style="width:${pct(i + 1, Q.ids.length)}%"></i></div>`;
  let body;
  if (!open) {
    body = optionsHtml(id, x);
    if (ex && answered) body += `<div class="fb ${a === q.a ? '' : 'bad'}" role="status"><b>${a === q.a ? '✅ To‘g‘ri' : '❌ Noto‘g‘ri'}</b>${a === q.a ? '' : `<br>To‘g‘ri javob: <b>${esc(q.o[q.a])}</b>`}${q.e ? `<p>${esc(q.e)}</p>` : ''}${q.r ? `<p class="mu s">Manba: ${esc(x.t.name)}, ${esc(q.r)}</p>` : ''}</div>`;
  } else if (!Q.rv[id]) {
    body = `<p class="mu">Avval javobni o‘zing o‘ylab ko‘r yoki ovoz chiqarib ayt, keyin tekshir.</p><button class="big" data-a="rev">👁 Javobni ko‘rish</button>`;
  } else {
    const sf = Q.sf[id];
    body = `<div class="fb"><b>To‘g‘ri javob:</b> ${esc(q.o[q.a])}${q.e ? `<p>${esc(q.e)}</p>` : ''}${q.r ? `<p class="mu s">Manba: ${esc(x.t.name)}, ${esc(q.r)}</p>` : ''}</div><p class="mu s" style="margin:10px 0 4px">Qanchalik bilding?</p><div class="in">${[['y', '✅ Bildim'], ['p', '🟡 Qisman'], ['n', '❌ Bilmadim']].map(([k, n]) => `<button class="${sf === k ? 'big' : 'btn'}" data-a="rate" data-r="${k}" aria-pressed="${sf === k}">${n}</button>`).join('')}</div>`;
  }
  const need = (ex && !answered) || (open && !Q.sf[id]);
  const nav = `<div class="in"><button class="btn s fix" data-a="go" data-d="-1" ${i ? '' : 'disabled'} aria-label="Oldingi">‹</button><button class="btn s fix" data-a="flag" data-id="${esc(id)}" aria-pressed="${fl}">${fl ? '🚩 Belgilangan' : '🏳️ Shubhali'}</button>${lastQ ? `<button class="big" data-a="finish" ${need ? 'disabled' : ''}>🏁 Yakunlash</button>` : `<button class="big" data-a="go" data-d="1" ${need ? 'disabled' : ''}>Keyingisi ›</button>`}</div>`;
  const grid = Q.mo === 'e' ? `<div class="chips" style="margin-top:14px">${Q.ids.map((d, j) => `<button class="chip ${j === i ? 'on' : ''}" style="min-width:40px" data-a="jump" data-i="${j}">${Q.ans[d] !== undefined ? '✓' : j + 1}</button>`).join('')}</div><button class="btn s" style="width:100%;margin-top:6px" data-a="finish">🏁 Testni yakunlash</button>` : '';
  return head + `<p class="q">${esc(q.q)}</p>` + body + nav + grid;
}

function resView() {
  if (!R) return '';
  const r = R.rec, p = pct(r.ok, r.n), g = p >= 86 ? 'A’lo' : p >= 71 ? 'Yaxshi' : p >= 56 ? 'Qoniqarli' : 'Past';
  let h = `<div class="card score"><b class="n">${p}%</b><b>${r.ok} / ${r.n}</b> to‘g‘ri · ${g} · ${mmss(r.sec)}${R.un ? ` · javobsiz: ${R.un}` : ''}</div>
  <div class="in"><button class="big" data-a="again">🔁 Qayta</button>${R.wrong.length ? `<button class="btn" data-a="start" data-kind="m" data-label="Xatolar banki">❗ Xatolarni mashq qil</button>` : ''}<button class="btn" data-a="nav" data-v="${V.sid ? 'subj' : 'home'}">Orqaga</button></div>`;
  if (!R.wrong.length) return h + '<p style="text-align:center">🎉 Hammasi to‘g‘ri!</p>';
  h += `<h2 style="margin:16px 0 4px">Xato javoblar (${R.wrong.length})</h2>`;
  R.wrong.forEach(id => {
    const x = TBX[id]; if (!x) return; const q = x.q, a = R.ans[id];
    h += `<details class="rev"><summary>${esc(q.q)}</summary><p><b>To‘g‘ri:</b> ${esc(q.o[q.a])}</p>${a === undefined ? '<p class="mu">Javob berilmagan</p>' : a < 0 ? '<p class="mu">Ochiq rejimda “bilmadim/qisman” deb baholading</p>' : `<p class="mu"><b>Sen:</b> ${esc(q.o[a])}</p>`}${q.e ? `<p>${esc(q.e)}</p>` : ''}<small>${esc(x.t.name)}${q.r ? ', ' + esc(q.r) : ''}</small></details>`;
  });
  return h;
}

function statView() {
  const h = S.h;
  if (!h.length) return `<h1>📊 Statistika</h1><p class="mu">Hali test yechilmagan.</p>`;
  const by = {}; h.forEach(x => (by[x.t] = by[x.t] || []).push(x));
  const rows = Object.entries(by).map(([k, L]) => ({ k, n: L.length, avg: Math.round(L.reduce((a, x) => a + x.ok / x.n, 0) / L.length * 100) })).sort((a, b) => a.avg - b.avg);
  const tot = h.reduce((a, x) => a + x.n, 0), ok = h.reduce((a, x) => a + x.ok, 0);
  const days = {}; h.forEach(x => { days[x.d] = 1; });
  return `<h1>📊 Statistika</h1><div class="card"><div class="grid"><span>Yechilgan testlar</span><b>${h.length}</b><span>Javob berilgan savollar</span><b>${tot}</b><span>Umumiy to‘g‘ri</span><b>${pct(ok, tot)}%</b><span>Faol kunlar</span><b>${Object.keys(days).length}</b><span>Xatolar bankida</span><b>${misIds().length}</b></div></div>
  <h2 style="margin:16px 0 4px">Zaifdan kuchliga</h2><p class="mu s" style="margin:0 0 4px">Mavzuga bossang, shuni darrov mashq qilasan.</p>
  ${rows.map(r => `<button class="stbar" data-a="statGo" data-k="${esc(r.k)}"><span class="k">${esc(keyName(r.k))}</span><span class="b"><span class="bar ${r.avg >= 70 ? 'ok' : ''}" style="display:block"><i style="width:${r.avg}%"></i></span></span><span class="v">${r.avg}% · ${r.n}×</span></button>`).join('')}
  <h2 style="margin:16px 0 4px">So‘nggi natijalar</h2>${h.slice(-8).reverse().map(x => `<div class="row"><span class="t"><b>${pct(x.ok, x.n)}%</b> <small>${esc(keyName(x.t))} · ${x.ok}/${x.n} · ${fmtDate(x.d)} · ${{ m: 'mashq', e: 'imtihon', o: 'ochiq' }[x.mo] || ''}</small></span></div>`).join('')}`;
}

function flagView() {
  const L = flagIds();
  return `<div class="top"><button class="x" data-a="nav" data-v="home" aria-label="Orqaga">‹</button><h1 style="margin:0;flex:1;text-align:center;font-size:19px">🚩 Belgilanganlar</h1><span style="width:44px"></span></div>
  <p class="mu s">Shubhali deb belgilagan savollaringni kitob yoki o‘qituvchi bilan tekshir.</p>${L.length ? `<button class="big" data-a="start" data-kind="f" data-label="Belgilanganlar">▶ Yechish (${L.length})</button>` : '<p class="mu">Belgilangan savol yo‘q.</p>'}
  ${L.map(id => { const x = TBX[id]; return `<details class="rev"><summary>${esc(x.q.q)}</summary><p><b>Javob:</b> ${esc(x.q.o[x.q.a])}</p>${x.q.e ? `<p>${esc(x.q.e)}</p>` : ''}<small>${esc(x.t.name)}${x.q.r ? ', ' + esc(x.q.r) : ''}</small><div style="margin-top:8px"><button class="btn s" data-a="flag" data-id="${esc(id)}">Belgini olib tashlash</button></div></details>`; }).join('')}`;
}

const segHtml = (key, cur, opts) => `<div class="seg" role="group">${opts.map(([v, n]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-a="set" data-key="${key}" data-val="${v}" aria-pressed="${String(cur) === String(v)}">${n}</button>`).join('')}</div>`;
function setView() {
  const nq = qCount();
  let h = `<h1>⚙️ Sozlamalar</h1>${noteHtml()}${saveFailed ? '<div class="note">⚠️ Natijalarni saqlab bo‘lmadi (brauzer xotirasi to‘la yoki yopiq). Zaxira oling.</div>' : ''}
  <div class="card"><h2>Savol banki</h2>`;
  if (TB) {
    h += `<p class="mu s">${TB.subjects.length} fan · ${topicsAll().length} mavzu · ${nq} savol</p>` + TB.subjects.map(s => `<div class="row"><span class="t"><b>${esc(s.name)}</b><br><small>${s.topics.length} mavzu · ${subjCount(s)} savol</small></span><button class="btn s danger" style="min-height:40px" data-a="delSubj" data-id="${esc(s.id)}" aria-label="${esc(s.name)} fanini o‘chirish">🗑</button></div>`).join('');
  } else h += '<p class="mu s">Bank yo‘q.</p>';
  h += `<div class="in"><button class="btn" data-a="pickBank">📥 Fayl qo‘shish</button><button class="btn" data-a="sample">📚 Namuna</button></div><p class="mu s">Bir nechta fayl tanlash mumkin. Fan va mavzu <code>id</code>si bir xil bo‘lsa, mavzu yangilanadi, qolganlari saqlanadi.</p></div>
  <div class="card"><h2>Variantlar tartibi</h2>${segHtml('sh', S.set.sh, [[1, 'Aralashtirilsin'], [0, 'Faylda berilgandek']])}
  <h2 style="margin-top:12px">Imtihon rejimida bitta savolga vaqt</h2>${segHtml('sec', S.set.sec, [[30, '30 s'], [45, '45 s'], [60, '60 s'], [90, '90 s']])}</div>`;
  if (TB) h += `<div class="card"><h2>📅 Imtihon sanalari</h2><p class="mu s">Sana qo‘ysang, ilova ko‘rilmagan savollarni kunlarga bo‘lib “kuniga N ta” reja chiqaradi.</p>${TB.subjects.map(s => `<div class="row"><span class="t"><b>${esc(s.name)}</b></span><input type="date" value="${esc(S.ex[s.id] || '')}" data-c="exam" data-id="${esc(s.id)}" aria-label="${esc(s.name)} imtihon sanasi"></div>`).join('')}</div>`;
  h += `<div class="card"><h2>Zaxira</h2><p class="mu s">Natijalar, xatolar va savol banki bitta faylda. Telefonni almashtirsang shu fayl bilan tiklaysan.</p><div class="in"><button class="btn" data-a="export">💾 Zaxira olish</button><button class="btn" data-a="pickBack">♻️ Tiklash</button></div></div>
  <div class="card"><h2>Tozalash</h2><div class="in"><button class="btn danger" data-a="clrHist">Natijalar tarixini o‘chirish</button><button class="btn danger" data-a="reset">Hammasini o‘chirish</button></div></div>`;
  return h;
}
const qCount = () => Object.keys(TBX).length;

function view() {
  switch (V.v) { case 'quiz': return quizView(); case 'res': return resView(); case 'subj': return subjView(); case 'stat': return statView(); case 'set': return setView(); case 'flag': return flagView(); default: return homeView(); }
}
function draw(keepScroll = true) {
  const sy = window.scrollY;
  document.body.classList.toggle('noav', V.v === 'quiz');
  $('#app').innerHTML = view();
  const tab = V.v === 'stat' ? 'stat' : V.v === 'set' ? 'set' : 'home';
  $('#nav').innerHTML = [['home', '📚', 'Fanlar'], ['stat', '📊', 'Statistika'], ['set', '⚙️', 'Sozlamalar']].map(([v, i, n]) => `<button data-a="nav" data-v="${v}" class="${tab === v ? 'on' : ''}" ${tab === v ? 'aria-current="page"' : ''}><span>${i}</span>${n}</button>`).join('');
  if (keepScroll) window.scrollTo(0, sy);
}

// ───────────── import / eksport ─────────────
const readFile = f => f.text();
async function importTexts(files) {
  const out = []; let cur = TB, added = 0, ok = 0, bad = 0;
  for (const f of files) {
    if (f.big) { out.push(`${f.name}: fayl juda katta (25 MB dan oshmasin)`); bad++; continue; }
    let d; try { d = JSON.parse(f.text); } catch (e) { out.push(`${f.name}: JSON emas`); bad++; continue; }
    const c = checkBank(d);
    if (c.err.length) { out.push(`${f.name}: ${c.err.slice(0, 3).join('; ')}${c.err.length > 3 ? ` … (+${c.err.length - 3})` : ''}`); bad++; continue; }
    const m = mergeBank(cur, d), c2 = checkBank(m);
    if (c2.err.length) { out.push(`${f.name}: ${c2.err[0]}`); bad++; continue; }
    cur = m; ok++; added += d.subjects.reduce((a, s) => a + subjCount(s), 0);
    if (c.warn.length) out.push(`${f.name}: ⚠️ ${c.warn.length} ta ogohlantirish (${c.warn[0]})`);
  }
  if (ok) {
    try { await idbSet(cur); } catch (e) { setMsg('Qurilma xotirasiga yozib bo‘lmadi', false); draw(); return; }
    indexBank(cur); try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ixtiyoriy */ }
    out.unshift(`✅ ${ok} ta fayl, ${added} ta savol yuklandi (jami ${qCount()})`);
  }
  setMsg(out.join(' · ') || 'Fayl tanlanmadi', ok > 0 && !bad);
  draw();
}
async function pickedFiles(inp) {
  const fs = [...inp.files]; inp.value = ''; if (!fs.length) return;
  const files = [];
  for (const f of fs) { if (f.size > 25e6) { files.push({ name: f.name, big: true }); continue; } files.push({ name: f.name, text: await readFile(f) }); }
  importTexts(files);
}
async function loadSample() {
  try { const r = await fetch('data/testlar-banki.json'); if (!r.ok) throw 0; importTexts([{ name: 'namuna', text: await r.text() }]); }
  catch (e) { setMsg('Namuna bankni olib bo‘lmadi (internet yoki fayl yo‘q)', false); draw(); }
}
function download(name, text) {
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'application/json' })); a.download = name;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1500);
}
const exportBackup = () => { download('testlar-zaxira-' + today() + '.json', JSON.stringify({ app: 'testlar-app', v: 1, state: S, bank: TB })); setMsg('Zaxira fayli yuklab olindi', true); draw(); };
async function restoreBackup(inp) {
  const f = inp.files[0]; inp.value = ''; if (!f) return;
  try {
    const o = JSON.parse(await readFile(f));
    if (!o || o.app !== 'testlar-app' || !o.state) throw new Error('Bu zaxira fayli emas');
    if (o.bank) { const c = checkBank(o.bank); if (c.err.length) throw new Error('Zaxiradagi bank buzilgan: ' + c.err[0]); }
    if (!confirm('Hozirgi natijalar va bank zaxiradagi bilan almashtiriladi. Davom etasanmi?')) return;
    S = normState(o.state); save();
    if (o.bank) { await idbSet(o.bank); indexBank(o.bank); } else { await idbDel(); indexBank(null); }
    setMsg('✅ Zaxira tiklandi', true);
  } catch (e) { setMsg('Tiklab bo‘lmadi: ' + (e && e.message || e), false); }
  draw();
}
async function deleteSubject(id) {
  const s = findSubj(id); if (!s || !confirm(`“${s.name}” fani va undagi ${subjCount(s)} ta savol qurilmadan o‘chirilsinmi? (Natijalar tarixi qoladi.)`)) return;
  const nb = JSON.parse(JSON.stringify(TB)); nb.subjects = nb.subjects.filter(x => x.id !== id);
  try { nb.subjects.length ? await idbSet(nb) : await idbDel(); } catch (e) { setMsg('O‘chirib bo‘lmadi', false); draw(); return; }
  indexBank(nb.subjects.length ? nb : null); delete S.ex[id]; save(); if (V.sid === id) V.sid = ''; setMsg('Fan o‘chirildi', true); draw();
}

// ───────────── hodisalar ─────────────
function act(a, d) {
  switch (a) {
    case 'nav': V.v = d.v; if (d.v === 'home') V.sid = ''; if (d.v !== 'set') setMsg(null); draw(false); window.scrollTo(0, 0); break;
    case 'subj': V.sid = d.id; V.v = 'subj'; V.sel = {}; setMsg(null); draw(false); window.scrollTo(0, 0); break;
    case 'setN': V.n = +d.n; draw(); break;
    case 'setMo': V.mo = d.mo; draw(); break;
    case 'set': S.set[d.key] = +d.val; save(); draw(); break;
    case 'start': begin(cfgOf(d.kind, d.id, d.label)); break;
    case 'startSel': { const ids = Object.keys(V.sel).filter(i => V.sel[i] && findTopic(i)); begin(cfgOf('c', '', 'Tanlangan mavzular', ids)); break; }
    case 'selAll': { const s = findSubj(V.sid), all = s.topics.every(t => V.sel[t.id]); V.sel = {}; if (!all) s.topics.forEach(t => { V.sel[t.id] = 1; }); draw(); break; }
    case 'plan': { const p = plan(d.id), s = findSubj(d.id); if (!p || p.past || !p.quota) { toast('Bugun reja yo‘q'); break; } begin({ kind: 'u', id: d.id, label: '📅 ' + s.name, n: p.quota, mo: V.mo === 'e' ? 'e' : V.mo }); break; }
    case 'ans': answer(+d.k); break;
    case 'go': go(+d.d); break;
    case 'jump': if (Q) { Q.i = +d.i; draw(); window.scrollTo(0, 0); } break;
    case 'rev': if (Q) { Q.rv[Q.ids[Q.i]] = 1; draw(false); } break;
    case 'rate': rate(d.r); break;
    case 'flag': flag(d.id); break;
    case 'finish': finish(); break;
    case 'quit': quit(); break;
    case 'again': if (R) begin(R.cfg); break;
    case 'statGo': { const k = d.k; if (findTopic(k)) begin(cfgOf('t', k, keyName(k))); else if (k.startsWith('s:') || k.startsWith('u:')) begin(cfgOf('s', k.slice(2), keyName(k))); else if (['a', 'm', 'f', 'd'].includes(k)) begin(cfgOf(k, '', keyName(k))); else toast('Bu bo‘limni qayta ochib bo‘lmaydi'); break; }
    case 'pickBank': $('#fbank').click(); break;
    case 'pickBack': $('#fback').click(); break;
    case 'sample': loadSample(); break;
    case 'export': exportBackup(); break;
    case 'delSubj': deleteSubject(d.id); break;
    case 'clrHist': if (confirm('Barcha natijalar tarixi o‘chirilsinmi?')) { S.h = []; save(); setMsg('Tarix tozalandi', true); draw(); } break;
    case 'reset': if (confirm('Savol banki, natijalar va sozlamalar butunlay o‘chirilsinmi?')) { S = normState(null); save(); idbDel().finally(() => { indexBank(null); V = { v: 'home', sid: '', n: 20, mo: 'm', sel: {}, msg: null }; draw(); }); } break;
  }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) act(b.dataset.a, b.dataset); });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fbank') return pickedFiles(t);
  if (t.id === 'fback') return restoreBackup(t);
  if (t.dataset.c === 'sel') { V.sel[t.dataset.id] = t.checked; draw(); }
  if (t.dataset.c === 'exam') { t.value ? S.ex[t.dataset.id] = t.value : delete S.ex[t.dataset.id]; save(); toast(t.value ? 'Sana saqlandi' : 'Sana o‘chirildi'); }
});
document.addEventListener('keydown', e => {
  if (V.v !== 'quiz' || !Q || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
  if (i >= 0 && k.length === 1) { answer(i); return; }
  if (k === 'arrowright') { const b = $('[data-a="go"][data-d="1"]'); if (b && !b.disabled) go(1); }
  if (k === 'arrowleft') go(-1);
});

// ───────────── ishga tushirish ─────────────
(async () => {
  draw();
  try { const d = await idbGet(); if (d && !checkBank(d).err.length) indexBank(d); } catch (e) { /* bank yo‘q */ }
  draw();
  if ('serviceWorker' in navigator && location.protocol !== 'file:') navigator.serviceWorker.register('sw.js').catch(() => {});
})();
})();
