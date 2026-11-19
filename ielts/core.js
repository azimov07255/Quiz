/* IELTS · BY AZIMOV — yadro: yordamchilar, ikonkalar, holat (localStorage) va Supabase bilan sinxronlash. */
(() => {
'use strict';
const IE = window.IE = { act: {}, routes: {}, V: {}, D: {}, timers: [], APP_VERSION: '2.4.4' };
const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
Object.assign(IE, { $, $$, esc });
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } };
Object.assign(IE, { lsGet, lsSet });

/* ---------- ikonkalar ---------- */
const P = {
  home: '<path d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6H9v6H5a2 2 0 0 1-2-2z"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" class="x"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20.5l1.2-4.4A8 8 0 1 1 21 12z"/>',
  grid: '<rect x="3.5" y="3.5" width="7" height="7" rx="2"/><rect x="13.5" y="3.5" width="7" height="7" rx="2"/><rect x="3.5" y="13.5" width="7" height="7" rx="2"/><rect x="13.5" y="13.5" width="7" height="7" rx="2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  head: '<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="7" rx="2"/><rect x="16.5" y="14" width="4.5" height="7" rx="2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 5v16"/><path d="M9 8h6"/>',
  pen: '<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
  mic: '<rect x="9" y="2.5" width="6" height="11.5" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3.5"/>',
  trophy: '<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/>',
  cards: '<rect x="3" y="7" width="14" height="14" rx="2.5"/><path d="M7 3.5h11.5A2.5 2.5 0 0 1 21 6v11.5"/>',
  bulb: '<path d="M9 18h6M10 21h4"/><path d="M12 3a6 6 0 0 0-4 10.5c.7.7 1 1.5 1 2.5h6c0-1 .3-1.8 1-2.5A6 6 0 0 0 12 3z"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  back: '<path d="M15 5l-7 7 7 7"/>',
  next: '<path d="M9 5l7 7-7 7"/>',
  play: '<path d="M7 4.5l13 7.5-13 7.5z" class="f"/>',
  stop: '<rect x="6" y="6" width="12" height="12" rx="2.5" class="f"/>',
  flame: '<path d="M12 3c.8 4 5 5.5 5 10.5a5 5 0 0 1-10 0c0-2.2 1.1-3.4 2.3-4.5.1 1.8.9 2.7 1.9 2.7C12 8.5 10.8 6.5 12 3z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  spark: '<path d="M12 3l2.2 6.3L20.5 11l-6.3 2.2L12 20l-2.2-6.8L3.5 11l6.3-1.7z"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  out: '<path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3M16 8l4 4-4 4M20 12H9"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  doc: '<path d="M6 3h8l5 5v13H6z"/><path d="M14 3v5h5M9 13h7M9 17h7"/>',
  spk: '<path d="M4 9.5v5h4l5 4v-13l-5 4z"/><path d="M16.5 9a4 4 0 0 1 0 6"/>',
  down: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  key: '<circle cx="8" cy="15" r="4"/><path d="M11 12l9-9M16 7l3 3"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
  type: '<rect x="2.5" y="6" width="19" height="12" rx="3"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10"/>',
  news: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 9h8M8 13h8M8 17h5"/>',
  wave: '<path d="M3 12h2M7 7v10M11 4v16M15 8v8M19 10v4"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.2-4.2"/>',
  cal: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4M16 3v4M4 10h16"/>',
  list: '<path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01"/>',
  eye: '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  pause: '<rect x="6" y="5" width="4" height="14" rx="1.5" class="f"/><rect x="14" y="5" width="4" height="14" rx="1.5" class="f"/>',
  flag: '<path d="M5 21V4"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
  cloud: '<path d="M7 18a4.5 4.5 0 0 1-.6-9A6 6 0 0 1 18 8.5a4.8 4.8 0 0 1-.5 9.5z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  share: '<circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 10.7l7.4-4.4M8.3 13.3l7.4 4.4"/>',
  dl: '<path d="M12 4v11m0 0l-4-4m4 4l4-4M5 20h14"/>',
  up: '<path d="M12 16V5m0 0L8 9m4-4l4 4M5 20h14"/>',
  edit: '<path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14 7l3 3"/>',
  bed: '<path d="M3 18V6m0 8h18v4M21 14v-2a3 3 0 0 0-3-3h-7v5"/><circle cx="7" cy="11" r="1.6"/>',
  zap: '<path d="M13 3L5 13h6l-1 8 8-10h-6z"/>',
  sparkl: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.4 6"/><path d="M20 4v7h-7"/>',
  back2: '<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5"/>'
};
IE.ic = (n, cls) => '<svg class="i ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '').replace(/ class="f"/g, ' fill="currentColor" stroke="none"').replace(/ class="x"/g, ' fill="currentColor" stroke="none"') + '</svg>';
IE.bd = (n, sk, size) => '<span class="bd sk-' + sk + (size ? ' ' + size : '') + '">' + IE.ic(n) + '</span>';

/* ---------- vaqt/sana ---------- */
const dayKey = (t = Date.now()) => { const d = new Date(t); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
const dayNum = (t = Date.now()) => { const d = new Date(t); return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5); };
const fmtT = s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const fmtD = t => { const d = new Date(t); return d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };
const ago = t => { const m = Math.round((Date.now() - t) / 6e4); if (m < 1) return 'hozir'; if (m < 60) return m + ' daq oldin'; const h = Math.round(m / 60); if (h < 24) return h + ' soat oldin'; const d = Math.round(h / 24); return d < 8 ? d + ' kun oldin' : fmtD(t); };
Object.assign(IE, { dayKey, dayNum, fmtT, fmtD, ago });

/* ---------- Reading: raw/40 → taxminiy band (Academic) ---------- */
const RB = [[39, 9], [37, 8.5], [35, 8], [33, 7.5], [30, 7], [27, 6.5], [23, 6], [19, 5.5], [15, 5], [13, 4.5], [10, 4], [8, 3.5], [6, 3], [4, 2.5], [1, 2], [0, 1]];
IE.band = (c, t) => { const raw = Math.round(c / Math.max(1, t) * 40); for (const [m, b] of RB) if (raw >= m) return b; return 1; };
const LBT = [[39, 9], [37, 8.5], [35, 8], [32, 7.5], [30, 7], [26, 6.5], [23, 6], [18, 5.5], [16, 5], [13, 4.5], [11, 4], [8, 3.5], [6, 3], [4, 2.5], [1, 2], [0, 1]];
IE.bandL = (c, t) => { const raw = Math.round(c / Math.max(1, t) * 40); for (const [m, b] of LBT) if (raw >= m) return b; return 1; };
IE.bandTxt = b => (b == null || isNaN(b)) ? '—' : (Math.round(b * 2) / 2).toFixed(1);

/* ---------- holat ---------- */
const LS = 'ielts:state:v1';
const blank = () => ({ v: 1, prof: { name: '', level: '', target: 7, exam: 'Academic', date: '', mins: 60 }, pts: 0, typ: [], pdone: {}, focus: {}, prest: {}, ptask: {}, pord: {}, mb: {}, qt: {}, ftests: [], reads: [], listens: [], arts: [], writes: [], speaks: [], my: [], lib: [], mock: null, mocks: [], books: [], drafts: {}, srs: {}, days: [], uid: '' });
const norm = s => { const b = blank(); s = (s && typeof s === 'object') ? s : {}; return Object.assign(b, s, { prof: Object.assign(b.prof, s.prof || {}), reads: Array.isArray(s.reads) ? s.reads : [], listens: Array.isArray(s.listens) ? s.listens : [], mocks: Array.isArray(s.mocks) ? s.mocks : [], typ: Array.isArray(s.typ) ? s.typ : [], ftests: Array.isArray(s.ftests) ? s.ftests : [], pdone: s.pdone && typeof s.pdone === 'object' ? s.pdone : {}, books: Array.isArray(s.books) ? s.books : [], mock: s.mock && typeof s.mock === 'object' ? s.mock : null, arts: Array.isArray(s.arts) ? s.arts : [], lib: Array.isArray(s.lib) ? s.lib : [], writes: Array.isArray(s.writes) ? s.writes : [], speaks: Array.isArray(s.speaks) ? s.speaks : [], my: Array.isArray(s.my) ? s.my : [], days: Array.isArray(s.days) ? s.days : [], drafts: s.drafts && typeof s.drafts === 'object' ? s.drafts : {}, srs: s.srs && typeof s.srs === 'object' ? s.srs : {}, focus: s.focus && typeof s.focus === 'object' ? s.focus : {}, prest: s.prest && typeof s.prest === 'object' ? s.prest : {}, ptask: s.ptask && typeof s.ptask === 'object' ? s.ptask : {}, pord: s.pord && typeof s.pord === 'object' ? s.pord : {}, mb: s.mb && typeof s.mb === 'object' ? s.mb : {}, qt: s.qt && typeof s.qt === 'object' ? s.qt : {} }); };
let S = norm(lsGet(LS, null));
IE.S = () => S;
IE.setState = s => { S = norm(s); };
const union = (x, y) => { const m = new Map(); [...x, ...y].forEach(e => { if (!e || !e.ts) return; const o = m.get(e.ts); if (!o || (e.ai && !o.ai)) m.set(e.ts, e); }); return [...m.values()].sort((p, q) => p.ts - q.ts).slice(-300); };
const mergeBooks = (x, y) => { const m = new Map(); [...(x || []), ...(y || [])].forEach(e => { if (!e || !e.id) return; const o = m.get(e.id); if (!o || (e.mt || 0) > (o.mt || 0)) m.set(e.id, e); }); return [...m.values()].sort((p, q) => (p.ts || 0) - (q.ts || 0)).slice(-200); };
const mergeDone = (x, y) => { const o = {}; [x, y].forEach(m => Object.entries(m || {}).forEach(([d, v]) => { o[d] = Object.assign(o[d] || {}, v); })); const ks = Object.keys(o).sort(); while (ks.length > 80) delete o[ks.shift()]; return o; };
const unionMy = (x, y) => { const m = new Map(); [...x, ...y].forEach(e => { if (e && e.id) m.set(e.id, e); }); return [...m.values()].sort((p, q) => (p.ts || 0) - (q.ts || 0)).slice(-1500); };
const mergeFocus = (x, y) => { const o = Object.assign({}, x || {}); Object.entries(y || {}).forEach(([k, v]) => { o[k] = Math.max(+o[k] || 0, +v || 0); }); const ks = Object.keys(o).sort(); while (ks.length > 120) delete o[ks.shift()]; return o; };
const mergeRest = (x, y) => { const o = Object.assign({}, x || {}); Object.entries(y || {}).forEach(([k, v]) => { if (!o[k] || ((v && v.t) || 0) > ((o[k] && o[k].t) || 0)) o[k] = v; }); const ks = Object.keys(o).sort(); while (ks.length > 120) delete o[ks.shift()]; return o; };
const mergeMb = (x, y) => { const o = Object.assign({}, x || {}); Object.entries(y || {}).forEach(([k, v]) => { if (!o[k] || ((v && v.t) || 0) > ((o[k] && o[k].t) || 0)) o[k] = v; }); const ks = Object.keys(o); if (ks.length > 1500) ks.sort((a, b) => (o[a].t || 0) - (o[b].t || 0)).slice(0, ks.length - 1500).forEach(k => delete o[k]); return o; };
const mergeTasks = (x, y) => { const o = {}; [x, y].forEach(m => Object.entries(m || {}).forEach(([k, arr]) => { const mp = new Map((o[k] || []).map(t => [t.id, t])); (Array.isArray(arr) ? arr : []).forEach(t => { if (!t || !t.id) return; const e = mp.get(t.id); if (!e || (t.mt || t.ts || 0) > (e.mt || e.ts || 0)) mp.set(t.id, t); }); o[k] = [...mp.values()]; })); const ks = Object.keys(o).sort(); while (ks.length > 90) delete o[ks.shift()]; return o; };
function merge(a, b) {
  const srs = Object.assign({}, a.srs); Object.entries(b.srs || {}).forEach(([k, v]) => { if (!srs[k] || (v.t || 0) > (srs[k].t || 0)) srs[k] = v; });
  const drafts = Object.assign({}, a.drafts); Object.entries(b.drafts || {}).forEach(([k, v]) => { if (!drafts[k] || (v.t || 0) > (drafts[k].t || 0)) drafts[k] = v; });
  Object.keys(drafts).forEach(k => { if (drafts[k].del) delete drafts[k]; });
  const win = (a.pts || 0) >= (b.pts || 0) ? a : b;
  return norm({ v: 1, prof: win.prof, pts: Math.max(a.pts || 0, b.pts || 0), reads: union(a.reads, b.reads), listens: union(a.listens, b.listens), arts: union(a.arts, b.arts), mocks: union(a.mocks, b.mocks), typ: union(a.typ, b.typ), ftests: union(a.ftests, b.ftests), pdone: mergeDone(a.pdone, b.pdone), focus: mergeFocus(a.focus, b.focus), prest: mergeRest(a.prest, b.prest), ptask: mergeTasks(a.ptask, b.ptask), pord: mergeRest(a.pord, b.pord), mb: mergeMb(a.mb, b.mb), qt: mergeMb(a.qt, b.qt), books: mergeBooks(a.books, b.books), mock: ((a.mock && a.mock.ts) || 0) >= ((b.mock && b.mock.ts) || 0) ? a.mock : b.mock, lib: unionMy(a.lib, b.lib), writes: union(a.writes, b.writes), speaks: union(a.speaks, b.speaks), my: unionMy(a.my, b.my), drafts, srs, days: [...new Set([...a.days, ...b.days])].sort().slice(-400), uid: a.uid || b.uid });
}
let syncT = 0, saveFailed = false;
IE.save = (now) => { saveFailed = !lsSet(LS, S); clearTimeout(syncT); syncT = setTimeout(() => IE.sync().catch(() => {}), now ? 0 : 5000); };
IE.saveLocal = () => { saveFailed = !lsSet(LS, S); };
IE.sync = async () => {
  const sess = window.SB && SB.session(); if (!sess || !sess.user || !sess.user.id || !IE.D.access) return;
  const uid = sess.user.id;
  if (S.uid && S.uid !== uid) { S = norm(null); }
  S.uid = uid;
  const r = await SB.rest('ielts_state?select=data&user_id=eq.' + encodeURIComponent(uid));
  const remote = r.length ? norm(r[0].data) : null, merged = remote ? merge(S, remote) : S;
  const chL = JSON.stringify(merged) !== JSON.stringify(S), chR = !remote || JSON.stringify(merged) !== JSON.stringify(remote);
  S = merged; if (chL) { lsSet(LS, S); if (IE.onSynced) IE.onSynced(); }
  if (chR) await SB.rest('ielts_state?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: uid, data: S, updated_at: new Date().toISOString() } });
};
/** Audio manzilini tuzatadi: http→https; BBC mediaselector uchun https yetkazib berish (aks holda aralash kontent bloklanadi). */
IE.fixAudio = u => { u = String(u || '').trim().replace(/^http:\/\//i, 'https://'); if (/open\.live\.bbc\.co\.uk\/mediaselector/i.test(u)) u = u.replace(/\/proto\/http\//i, '/proto/https/'); return u; };
IE.mergeState = (a, b) => merge(norm(a), norm(b));
IE.vib = p => { try { if (localStorage.getItem('ielts:nohap') || (navigator.userActivation && !navigator.userActivation.hasBeenActive)) return; if (navigator.vibrate && !matchMedia('(prefers-reduced-motion:reduce)').matches) navigator.vibrate(p); } catch (e) { /* */ } };
IE.touchDay = () => { const k = dayKey(); if (!S.days.includes(k)) { S.days.push(k); S.days.sort(); } };
IE.streak = () => {
  const set = new Set(S.days), rest = k => !!(S.prest && S.prest[k] && S.prest[k].on); let n = 0, d = new Date();
  if (!set.has(dayKey(d)) && !rest(dayKey(d))) d.setDate(d.getDate() - 1);
  for (let g = 0; g < 4000 && (set.has(dayKey(d)) || rest(dayKey(d))); g++) { if (set.has(dayKey(d))) n++; d.setDate(d.getDate() - 1); }
  return n;
};
IE.skillBands = () => {
  const avg = (arr, k) => { const v = arr.slice(-3).map(x => x[k]).filter(x => typeof x === 'number'); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null; };
  const wr = S.writes.filter(w => w.ai && typeof w.ai.overall === 'number').map(w => ({ b: w.ai.overall }));
  const sp = S.speaks.filter(x => x.ai && typeof x.ai.overall === 'number').map(x => ({ b: x.ai.overall }));
  return { L: avg(S.listens, 'band'), R: avg(S.reads, 'band'), W: avg(wr, 'b'), S: avg(sp, 'b') };
};
IE.overall = () => { const b = IE.skillBands(), v = Object.values(b).filter(x => x != null); return v.length ? Math.round(v.reduce((a, c) => a + c, 0) / v.length * 2) / 2 : null; };

/* ---------- qulaylik: toast, konfetti, ovoz, mavzu ---------- */
let toastT;
IE.toast = m => { const t = $('#toast'); if (!t) return; t.textContent = m; t.className = 'on'; clearTimeout(toastT); toastT = setTimeout(() => { t.className = ''; }, 2600); };
IE.confetti = () => {
  const c = $('#fx'); if (!c || matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const x = c.getContext('2d'), W = c.width = innerWidth, H = c.height = innerHeight, cols = ['#8b5cf6', '#f97316', '#10b981', '#3b82f6', '#f472b6', '#fbbf24'];
  const ps = Array.from({ length: 90 }, () => ({ x: W / 2 + (Math.random() - .5) * 80, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 13 - 4, r: Math.random() * 6 + 3, c: cols[Math.random() * cols.length | 0], a: Math.random() * 6, va: (Math.random() - .5) * .4 }));
  let f = 0;
  (function tick() {
    x.clearRect(0, 0, W, H); f++;
    ps.forEach(p => { p.x += p.vx; p.y += p.vy; p.vy += .42; p.vx *= .992; p.a += p.va; x.save(); x.translate(p.x, p.y); x.rotate(p.a); x.fillStyle = p.c; x.globalAlpha = Math.max(0, 1 - f / 110); x.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); x.restore(); });
    if (f < 110) requestAnimationFrame(tick); else x.clearRect(0, 0, W, H);
  })();
};
IE.say = (txt, lang) => { try { const u = new SpeechSynthesisUtterance(txt); u.lang = lang || 'en-GB'; u.rate = .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { IE.toast('Ovoz qo‘llab-quvvatlanmaydi'); } };
IE.theme = () => { try { return localStorage.getItem('ielts:theme') || 'auto'; } catch (e) { return 'auto'; } };
IE.setTheme = t => { try { t === 'auto' ? localStorage.removeItem('ielts:theme') : localStorage.setItem('ielts:theme', t); } catch (e) { /* xotira yopiq */ } if (t === 'auto') document.documentElement.removeAttribute('data-theme'); else document.documentElement.setAttribute('data-theme', t); const m = document.querySelector('meta[name=theme-color]'); if (m) m.content = (t === 'dark' || (t === 'auto' && matchMedia('(prefers-color-scheme:dark)').matches)) ? '#2a1b8f' : '#5b3df5'; };

/* ---------- aksent rang ---------- */
IE.ACC = [['violet', 'Binafsha', '#5b3df5', '#c026d3'], ['blue', 'Ko‘k', '#2563eb', '#06b6d4'], ['green', 'Yashil', '#059669', '#84cc16'], ['pink', 'Pushti', '#db2777', '#f97316'], ['orange', 'To‘q sariq', '#ea580c', '#f59e0b'], ['slate', 'Grafit', '#334155', '#6366f1']];
IE.accent = () => { try { return localStorage.getItem('ielts:acc') || 'violet'; } catch (e) { return 'violet'; } };
IE.SKINS = [['std', 'Standart', 'Binafsha gradient, yengil kartalar'], ['glass', 'Liquid Glass', 'Shaffof, xira shisha — iPhone uslubida'], ['gold', 'Oltin Premium', 'Qora/ivory + tilla, serif sarlavhalar']];
IE.skin = () => { try { const v = localStorage.getItem('ielts:skin'); return v === 'glass' || v === 'gold' ? v : 'std'; } catch (e) { return 'std'; } };
IE.setSkin = k => { try { k === 'std' ? localStorage.removeItem('ielts:skin') : localStorage.setItem('ielts:skin', k); } catch (e) { /* */ } if (k === 'std') document.documentElement.removeAttribute('data-skin'); else document.documentElement.setAttribute('data-skin', k); const m = document.querySelector('meta[name=theme-color]'); if (m && k === 'gold') m.content = '#2b2007'; else if (IE.setTheme) IE.setTheme(IE.theme()); };
IE.setAccent = a => { try { a === 'violet' ? localStorage.removeItem('ielts:acc') : localStorage.setItem('ielts:acc', a); } catch (e) { /* */ } if (a === 'violet') document.documentElement.removeAttribute('data-acc'); else document.documentElement.setAttribute('data-acc', a); };

/* ---------- IndexedDB (shaxsiy lug‘at uchun) ---------- */
const idb = () => new Promise((res, rej) => { const r = indexedDB.open('ielts-db', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
IE.idbGet = async k => { try { const d = await idb(); return await new Promise((res, rej) => { const q = d.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); }); } catch (e) { return undefined; } };
IE.idbSet = async (k, v) => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); };
IE.idbDel = async k => { const d = await idb(); return new Promise((res, rej) => { const t = d.transaction('kv', 'readwrite'); t.objectStore('kv').delete(k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); }); };

/* ---------- mikrofon ---------- */
IE.rec = {
  mr: null, chunks: [], stream: null,
  async start() {
    if (!navigator.mediaDevices || !window.MediaRecorder) throw new Error('Bu qurilmada yozib olish qo‘llab-quvvatlanmaydi');
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = []; this.mr = new MediaRecorder(this.stream);
    this.mr.ondataavailable = e => { if (e.data && e.data.size) this.chunks.push(e.data); };
    this.mr.start();
  },
  stop() {
    return new Promise(res => {
      const done = () => { const blob = this.chunks.length ? new Blob(this.chunks, { type: (this.mr && this.mr.mimeType) || 'audio/webm' }) : null; this.lastBlob = blob; const url = blob ? URL.createObjectURL(blob) : ''; if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; this.mr = null; res(url); };
      if (!this.mr || this.mr.state === 'inactive') return done();
      this.mr.onstop = done; this.mr.stop();
    });
  },
  cancel() { try { if (this.mr && this.mr.state !== 'inactive') { this.mr.onstop = null; this.mr.stop(); } } catch (e) { /* e’tiborsiz */ } if (this.stream) this.stream.getTracks().forEach(t => t.stop()); this.stream = null; this.mr = null; }
};
IE.every = (ms, f) => { const id = setInterval(f, ms); IE.timers.push(id); return id; };
IE.clearTimers = () => { IE.timers.forEach(clearInterval); IE.timers = []; };
})();
