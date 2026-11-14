/* Testlar — fan → mavzu → 4 variantli testlar. Vanilla JS, build bosqichisiz.
   Savol banki: IndexedDB. Natijalar/xatolar/sozlamalar: localStorage. Hech qanday server yoki kalit yo‘q. */
(() => {
'use strict';
const APP_VERSION = '1.5.1';   // sw.js dagi VERSION bilan bir xil bo‘lsin

// ───────────── yordamchilar ─────────────
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const pad = n => String(n).padStart(2, '0');
const keyOf = d => d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
const today = () => keyOf(new Date());
const addDays = (k, n) => { const d = new Date(k + 'T12:00:00'); d.setDate(d.getDate() + n); return keyOf(d); };
const diffDays = (a, b) => Math.round((new Date(b + 'T12:00:00') - new Date(a + 'T12:00:00')) / 864e5);
const fmtDate = k => { const [y, m, d] = String(k).split('-'); return d + '.' + m + '.' + y; };
const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const DAYS = ['Yak', 'Du', 'Se', 'Chor', 'Pay', 'Jum', 'Shan'];
const mmss = s => { s = Math.max(0, Math.round(s)); return Math.floor(s / 60) + ':' + pad(s % 60); };
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const shuffle = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const LET = 'ABCD';
const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) { /* ixtiyoriy */ } };

// ───────────── SVG ikonkalar ─────────────
const P = {
  chevL: '<path d="M15 18l-6-6 6-6"/>', chevR: '<path d="M9 18l6-6-6-6"/>', x: '<path d="M18 6L6 18M6 6l12 12"/>',
  play: '<path d="M8 5.5v13l11-6.5z" fill="currentColor"/>', check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  book: '<path d="M12 6.5C10.5 5 8 4.3 4 4.5v13c4-.2 6.5.5 8 2 1.5-1.5 4-2.2 8-2v-13c-4-.2-6.5.5-8 2z"/><path d="M12 6.5v13"/>',
  chart: '<path d="M5 20v-8M12 20V4M19 20v-5"/>', sliders: '<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  flame: '<path d="M12 3c.8 3.4 5 5.4 5 10a5 5 0 0 1-10 0c0-2 1-3.3 2-4.3.2 1.5 1 2.3 1.8 2.6C10.6 8.5 11 5.6 12 3z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>', bulb: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.7.6 1 1.3 1 2.1h5c0-.8.3-1.5 1-2.1A6 6 0 0 0 12 3z"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 1.5M9.5 3h5"/>', pencil: '<path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-3-3L5 17z"/><path d="M14.5 7.5l2 2"/>',
  dice: '<rect x="4" y="4" width="16" height="16" rx="4"/><circle cx="9" cy="9" r="1" fill="currentColor"/><circle cx="15" cy="15" r="1" fill="currentColor"/><circle cx="15" cy="9" r="1" fill="currentColor"/><circle cx="9" cy="15" r="1" fill="currentColor"/>',
  refresh: '<path d="M20 11a8 8 0 0 0-14.5-4M4 4.5V8h3.5M4 13a8 8 0 0 0 14.5 4M20 19.5V16h-3.5"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.5v5M12 16.3v.1"/>', calendar: '<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M5 20h14"/>', download: '<path d="M12 4v12M7 11l5 5 5-5M5 20h14"/>', trash: '<path d="M5 7h14M10 7V4h4v3M7 7l1 13h8l1-13"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', layers: '<path d="M12 4l9 5-9 5-9-5z"/><path d="M3 14l9 5 9-5"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>',
  ok: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l3 3 5-6"/>', no: '<circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/>', half: '<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',
  shuffle: '<path d="M16 4h4v4M4 20L20 4M20 16v4h-4M4 4l5 5M15 15l5 5"/>', moon: '<path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z"/>', link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const ic = (n, sz) => `<svg class="i" viewBox="0 0 24 24" aria-hidden="true"${sz ? ` style="width:${sz}px;height:${sz}px"` : ''}>${P[n] || ''}</svg>`;
const hueOf = id => { const i = TB ? TB.subjects.findIndex(s => s.id === id) : -1; return i >= 0 ? (232 + i * 57) % 360 : 232; };
const initials = n => { const w = String(n).trim().split(/\s+/).filter(Boolean); return esc((w.length > 1 ? w[0][0] + w[1][0] : String(n).slice(0, 2)).toUpperCase()); };
const avatar = s => `<span class="av" style="--h:${hueOf(s.id)}" aria-hidden="true">${initials(s.name)}</span>`;
function ring(p, size, sw, inner, style) {
  const r = (size - sw) / 2, c = 2 * Math.PI * r, off = c * (1 - Math.max(0, Math.min(100, p)) / 100), m = size / 2;
  return `<div class="ringw" style="width:${size}px;height:${size}px;${style || ''}"><svg class="ring" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle class="trk" cx="${m}" cy="${m}" r="${r}" stroke-width="${sw}"/><circle class="val" cx="${m}" cy="${m}" r="${r}" stroke-width="${sw}" stroke-dasharray="${c}" style="--c:${c};stroke-dashoffset:${off}" transform="rotate(-90 ${m} ${m})"/></svg><div class="ri">${inner || ''}</div></div>`;
}
const scoreClr = p => p >= 75 ? 'var(--ok)' : p >= 50 ? 'var(--warn)' : 'var(--bad)';

// ───────────── holat (localStorage) ─────────────
const LS = 'testlar:state:v1';
const normState = o => {
  o = o && typeof o === 'object' ? o : {};
  const obj = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
  const set = Object.assign({ sh: 1, sec: 45, goal: 20, theme: 'auto' }, obj(o.set));
  return { h: Array.isArray(o.h) ? o.h : [], m: obj(o.m), f: obj(o.f), sn: obj(o.sn), ex: obj(o.ex), set, ts: +o.ts || 0, hc: +o.hc || 0 };
};
let S = (() => { try { return normState(JSON.parse(localStorage.getItem(LS))); } catch (e) { return normState(null); } })();
let saveFailed = false;
const save = () => { S.ts = Date.now(); persist(); scheduleSync(); };
const applyTheme = () => { const t = S.set.theme; if (t === 'light' || t === 'dark') document.documentElement.dataset.theme = t; else delete document.documentElement.dataset.theme; };

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
const idbGet = (k = 'bank') => idbDo('readonly', s => s.get(k));
const idbSet = (v, k = 'bank') => idbDo('readwrite', s => s.put(v, k));
const idbDel = (k = 'bank') => idbDo('readwrite', s => s.delete(k));

let TB = null, TBX = {};       // TB: ko‘rinadigan hamma fanlar (katalog + o‘zining)
let UB = null;                 // UB: foydalanuvchining o‘z banki (qurilmada saqlanadi va sinxronlanadi)
let CBRAW = [], CB = [];       // katalog: xom qatorlar va ilova ichida ishlatiladigan (id’lari “c:” bilan boshlanadigan) fanlar
function rebuild() {
  const subs = [...CB, ...(UB ? UB.subjects : [])];
  TB = subs.length ? { v: 1, subjects: subs } : null; TBX = {};
  subs.forEach(sb => sb.topics.forEach(t => t.q.forEach(q => { TBX[q.id] = { s: sb, t, q }; })));
}
function indexBank(d) { UB = d && d.subjects.length ? d : null; rebuild(); }
function catalogize(e) {
  const d = e.data, P = 'c:';
  return { ...d, id: P + e.subject_id, name: e.name, cat: true, category: e.category || '', draft: !e.published,
    topics: d.topics.map(t => ({ ...t, id: P + t.id, q: t.q.map(q => ({ ...q, id: P + q.id })) })) };
}
function setCatalog(raw) { CBRAW = raw.filter(e => e && e.data && !checkBank({ v: 1, subjects: [e.data] }).err.length); CB = CBRAW.map(catalogize); rebuild(); }
const topicsAll = () => TB ? TB.subjects.flatMap(s => s.topics) : [];
const findTopic = id => topicsAll().find(t => t.id === id);
const findSubj = id => TB && TB.subjects.find(s => s.id === id);
const subjQ = sid => { const s = findSubj(sid); return s ? s.topics.flatMap(t => t.q.map(q => q.id)) : []; };
const topicQ = id => { const t = findTopic(id); return t ? t.q.map(q => q.id) : []; };
const subjCount = s => s.topics.reduce((a, t) => a + t.q.length, 0);
const qCount = () => Object.keys(TBX).length;

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

// ───────────── hisob va bulut (Supabase) ─────────────
const KP = 'testlar:profile:v1', KU = 'testlar:uid', KD = 'testlar:dirty', KX = 'testlar:deleted', KS = 'testlar:synced', KL = 'testlar:last';
const lsGet = (k, d) => { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } };
const lsSet = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* xotira yopiq */ } };
let A = { mode: 'in', busy: false, err: '', info: '', form: { name: '', email: '' }, profile: lsGet(KP, null), sync: 'idle', syncMsg: '', last: +localStorage.getItem(KL) || 0, users: null, usersErr: '', pwOpen: false };
const online = () => navigator.onLine !== false;
const cloudOn = () => SB.configured && !!SB.session();
const isOwner = () => !!(A.profile && A.profile.role === 'owner');
const isActive = p => { if (!p) return true; if (p.blocked) return false; if (p.role === 'owner' || p.lifetime || !p.expires_at) return true; return new Date(p.expires_at) > new Date(); };
const persist = () => { try { localStorage.setItem(LS, JSON.stringify(S)); saveFailed = false; } catch (e) { saveFailed = true; } };
const markDirty = ids => { const d = new Set(lsGet(KD, [])); ids.forEach(i => d.add(i)); lsSet(KD, [...d]); const x = lsGet(KX, []).filter(i => !ids.includes(i)); lsSet(KX, x); };
const markDeleted = id => { const x = new Set(lsGet(KX, [])); x.add(id); lsSet(KX, [...x]); lsSet(KD, lsGet(KD, []).filter(i => i !== id)); };

// Login: “ozod1” kabi oddiy login yoki email. Oddiy login ichkarida login@<loginDomain> ko‘rinishida saqlanadi.
const LDOM = (window.TESTLAR_CONFIG && window.TESTLAR_CONFIG.loginDomain) || 'testlar.internal';
const LOGIN_RE = /^[a-z0-9][a-z0-9._-]{2,31}$/, MAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const toEmail = v => { v = String(v || '').trim().toLowerCase(); return v.includes('@') ? v : v + '@' + LDOM; };
const shownLogin = e => String(e || '').toLowerCase().endsWith('@' + LDOM) ? String(e).slice(0, -(LDOM.length + 1)) : String(e || '');
const validLogin = v => { v = String(v || '').trim().toLowerCase(); return v.includes('@') ? MAIL_RE.test(v) : LOGIN_RE.test(v); };
const LOGIN_HINT = 'Login 3–32 belgi: kichik harf, raqam, nuqta, chiziq (masalan ozod1) yoki to‘g‘ri email.';
function uzErr(e) {
  if (e && e.uz) return e.message;
  if (e && e.net) return 'Internetga ulanib bo‘lmadi. Ulanishni tekshirib, qayta urin.';
  const m = String(e && e.message || e).toLowerCase(), c = (e && e.code) || '';
  if (c === 'invalid_credentials' || m.includes('invalid login')) return 'Email yoki parol noto‘g‘ri.';
  if (c === 'user_already_exists' || m.includes('already')) return 'Bu email bilan hisob bor. “Kirish”ni tanla.';
  if (c === 'weak_password' || m.includes('at least') || m.includes('weak')) return 'Parol kamida 6 ta belgidan iborat bo‘lsin.';
  if (c === 'email_not_confirmed') return 'Email tasdiqlanmagan. Pochtangdagi xatni tekshir.';
  if (c === 'over_request_rate_limit' || c === 'over_email_send_rate_limit' || (e && e.status === 429)) return 'Juda ko‘p urinish. Birozdan keyin qayta urin.';
  if (c === 'email_address_invalid' || c === 'validation_failed' || (m.includes('invalid') && m.includes('email'))) return 'Email manzili noto‘g‘ri.';
  if (c === 'same_password') return 'Yangi parol eskisidan farq qilsin.';
  if (c === 'signup_disabled') return 'Ro‘yxatdan o‘tish hozir o‘chirilgan.';
  return 'Xatolik: ' + String(e && e.message || e).slice(0, 140);
}

/** Natijalarni birlashtirish: tarix — birlashma, ko‘rilgan sanalar — eng yangisi, qolganlari — yangiroq qurilmadan. */
function mergeState(a, b) {
  const hc = Math.max(a.hc || 0, b.hc || 0), byId = new Map();
  [...a.h, ...b.h].forEach(x => { if (x && x.id > hc) byId.set(x.id, x); });
  const h = [...byId.values()].sort((x, y) => x.id - y.id).slice(-400);
  const sn = Object.assign({}, a.sn); Object.entries(b.sn || {}).forEach(([k, v]) => { if (!sn[k] || v > sn[k]) sn[k] = v; });
  const win = (a.ts || 0) >= (b.ts || 0) ? a : b;
  return normState({ h, sn, hc, m: win.m, f: win.f, ex: win.ex, set: win.set, ts: Math.max(a.ts || 0, b.ts || 0) });
}
const sameSubj = (a, b) => a.name === b.name && a.topics.length === b.topics.length && a.topics.every(t => { const u = b.topics.find(y => y.id === t.id); return u && JSON.stringify(u) === JSON.stringify(t); });

async function loadProfile() {
  const uid = SB.session().user.id, r = await SB.rest('profiles?select=*&user_id=eq.' + encodeURIComponent(uid));
  if (!r.length) throw new Error('Profil topilmadi');
  A.profile = r[0]; lsSet(KP, A.profile);
}
async function syncState() {
  const uid = SB.session().user.id, r = await SB.rest('app_state?select=data&user_id=eq.' + encodeURIComponent(uid));
  const remote = r.length ? normState(r[0].data) : null, merged = remote ? mergeState(S, remote) : S;
  const chLocal = JSON.stringify(merged) !== JSON.stringify(S), chRemote = !remote || JSON.stringify(merged) !== JSON.stringify(remote);
  S = merged; if (chLocal) persist();
  if (chRemote) await SB.rest('app_state?on_conflict=user_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: { user_id: uid, data: S, updated_at: new Date().toISOString() } });
  if (chLocal && V.v !== 'quiz' && V.v !== 'res') { V.anim = false; draw(); }
}
async function syncBanks() {
  const uid = SB.session().user.id, U = encodeURIComponent(uid), dirty = new Set(lsGet(KD, [])), synced = new Set(lsGet(KS, []));
  const del = lsGet(KX, []);
  if (del.length) { await SB.rest(`quiz_banks?user_id=eq.${U}&subject_id=in.(${del.map(i => '"' + String(i).replace(/"/g, '') + '"').join(',')})`, { method: 'DELETE' }); del.forEach(i => synced.delete(i)); lsSet(KX, []); }
  const rows = await SB.rest(`quiz_banks?select=subject_id,name,data&user_id=eq.${U}`), remote = new Map(rows.map(r => [r.subject_id, r.data]));
  const cur = UB ? JSON.parse(JSON.stringify(UB)) : { v: 1, subjects: [] }, push = new Set(dirty); let changed = false;
  remote.forEach((sub, id) => {
    if (!sub || !Array.isArray(sub.topics)) return;
    const k = cur.subjects.findIndex(s => s.id === id);
    if (k < 0) { cur.subjects.push(sub); changed = true; synced.add(id); return; }
    const loc = cur.subjects[k], isD = dirty.has(id), mer = JSON.parse(JSON.stringify(loc));
    if (!isD) mer.name = sub.name;
    sub.topics.forEach(t => { const j = mer.topics.findIndex(y => y.id === t.id); if (j < 0) mer.topics.push(t); else if (!isD) mer.topics[j] = t; });
    if (!sameSubj(mer, loc)) { cur.subjects[k] = mer; changed = true; }
    if (!sameSubj(mer, sub)) push.add(id);
    synced.add(id);
  });
  cur.subjects = cur.subjects.filter(s => { if (remote.has(s.id)) return true; if (synced.has(s.id) && !dirty.has(s.id)) { changed = true; return false; } push.add(s.id); return true; });
  if (changed) {
    if (cur.subjects.length && checkBank(cur).err.length) throw new Error('Bulutdagi bank formati buzilgan');
    if (cur.subjects.length) await idbSet(cur); else await idbDel();
    indexBank(cur.subjects.length ? cur : null);
  }
  const now = new Date().toISOString(), up = cur.subjects.filter(s => push.has(s.id)).map(s => ({ user_id: uid, subject_id: s.id, name: s.name, data: s, updated_at: now }));
  if (up.length) { await SB.rest('quiz_banks?on_conflict=user_id,subject_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: up }); up.forEach(u => synced.add(u.subject_id)); }
  lsSet(KD, []); lsSet(KS, [...synced]);
  if (changed && V.v !== 'quiz' && V.v !== 'res') { V.anim = false; draw(); }
}
async function syncCatalog() {
  const q = i => '"' + String(i).replace(/"/g, '') + '"';
  const meta = await SB.rest('catalog_subjects?select=subject_id,name,category,sort,published,updated_at&order=sort.asc,name.asc');
  const have = new Map(CBRAW.map(e => [e.subject_id, e]));
  const need = meta.filter(m => !have.get(m.subject_id) || have.get(m.subject_id).updated_at !== m.updated_at).map(m => m.subject_id);
  const got = need.length ? await SB.rest('catalog_subjects?select=subject_id,data&subject_id=in.(' + need.map(q).join(',') + ')') : [];
  const gm = new Map(got.map(g => [g.subject_id, g.data]));
  const raw = meta.map(m => ({ ...m, data: gm.get(m.subject_id) || (have.get(m.subject_id) || {}).data }));
  const sig = a => JSON.stringify(a.map(e => [e.subject_id, e.updated_at, e.name, e.category, e.sort, e.published]));
  if (sig(raw) === sig(CBRAW)) return;
  setCatalog(raw);
  try { CBRAW.length ? await idbSet({ raw: CBRAW }, 'catalog') : await idbDel('catalog'); } catch (e) { /* keshlab bo‘lmasa ham ishlaydi */ }
  if (V.v !== 'quiz' && V.v !== 'res') { V.anim = false; draw(); }
}
let curSync = null, again = false, syncTimer = 0;
function scheduleSync() { if (!cloudOn() || !A.profile || !isActive(A.profile)) return; clearTimeout(syncTimer); syncTimer = setTimeout(() => { syncAll(); }, 2500); }
function syncAll() {
  if (!cloudOn() || V.v === 'reset') return Promise.resolve();
  if (curSync) { again = true; return curSync; }
  curSync = (async () => {
    if (!online()) { A.sync = 'offline'; refreshAcct(); return; }
    A.sync = 'syncing'; refreshAcct();
    try {
      await loadProfile();
      if (!isActive(A.profile)) { A.sync = 'idle'; lockApp(); return; }
      if (V.v === 'locked') { V.v = 'home'; V.anim = true; draw(); }
      await syncBanks(); await syncCatalog(); await syncState();
      A.sync = 'ok'; A.syncMsg = ''; A.last = Date.now(); try { localStorage.setItem(KL, String(A.last)); } catch (e) { /* ixtiyoriy */ }
    } catch (e) { A.sync = e && e.net ? 'offline' : 'err'; A.syncMsg = e && e.net ? '' : String(e && e.message || e).slice(0, 120); }
    refreshAcct();
  })().finally(() => { curSync = null; if (again) { again = false; scheduleSync(); } });
  return curSync;
}
function syncLine() {
  const t = A.last ? new Date(A.last) : null, tm = t ? (keyOf(t) === today() ? '' : fmtDate(keyOf(t)) + ' ') + pad(t.getHours()) + ':' + pad(t.getMinutes()) : '';
  if (A.sync === 'syncing') return `${ic('refresh')} Sinxronlanmoqda…`;
  if (A.sync === 'err') return `${ic('alert')} Sinxronlanmadi: ${esc(A.syncMsg)}`;
  if (A.sync === 'offline' || !online()) return `${ic('alert')} Internet yo‘q — ulanganda o‘zi sinxronlanadi${tm ? ' · oxirgi: ' + tm : ''}`;
  return A.last ? `${ic('ok')} Bulutga saqlandi · ${tm}` : `${ic('refresh')} Hali sinxronlanmagan`;
}
function refreshAcct() { const e = $('#syncline'); if (e) e.innerHTML = syncLine(); }
function lockApp() { V.v = 'locked'; Q = null; clearInterval(TI); CBRAW = []; CB = []; rebuild(); idbDel('catalog').catch(() => {}); V.anim = true; draw(); }
function wipeLocal() {
  S = normState(null); persist(); applyTheme(); CBRAW = []; CB = []; indexBank(null); idbDel().catch(() => {}); idbDel('catalog').catch(() => {});
  [KP, KU, KD, KX, KS, KL].forEach(k => { try { localStorage.removeItem(k); } catch (e) { /* ixtiyoriy */ } });
  A.profile = null; A.last = 0; A.sync = 'idle'; A.users = null; V.sel = {}; V.sid = '';
}
async function afterLogin() {
  const uid = SB.session().user.id, prev = localStorage.getItem(KU);
  if (prev && prev !== uid) wipeLocal();           // boshqa hisobning ma’lumoti aralashmasin
  try { localStorage.setItem(KU, uid); } catch (e) { /* ixtiyoriy */ }
  await loadProfile();
  V.v = isActive(A.profile) ? 'home' : 'locked'; V.anim = true; A.pwOpen = false;
  draw(); window.scrollTo(0, 0);
  if (isActive(A.profile)) syncAll();
}
async function doAuth(form) {
  const fd = new FormData(form), email = String(fd.get('email') || '').trim(), password = String(fd.get('password') || ''), name = String(fd.get('name') || '').trim();
  A.form = { name, email }; A.err = ''; A.info = '';
  if (!email || !password) { A.err = 'Login (yoki email) va parolni kiriting.'; draw(false); return; }
  if (A.mode === 'up' && password.length < 6) { A.err = 'Parol kamida 6 ta belgidan iborat bo‘lsin.'; draw(false); return; }
  A.busy = true; draw(false);
  try {
    if (A.mode === 'up') {
      const r = await SB.signUp(toEmail(email), password, name);
      if (r.confirm) { A.busy = false; A.mode = 'in'; A.info = 'Emailingga tasdiqlash xati yuborildi. Havolani bosib, keyin kir.'; draw(false); return; }
    } else await SB.signIn(toEmail(email), password);
    A.busy = false; A.form = { name: '', email: '' }; await afterLogin();
  } catch (e) { A.busy = false; A.err = uzErr(e); draw(false); }
}
async function doForgot(form) {
  const email = String(new FormData(form).get('email') || '').trim();
  A.form = { name: '', email }; A.err = ''; A.info = '';
  if (!email) { A.err = 'Login yoki emailni kiriting.'; draw(false); return; }
  if (!email.includes('@')) { A.info = 'Login bilan kirgan bo‘lsang, parolni ilova egasi tiklab beradi. Unga yozib, yangi parol so‘ra.'; draw(false); return; }
  if (!MAIL_RE.test(email)) { A.err = 'To‘g‘ri email manzilini kiriting.'; draw(false); return; }
  A.busy = true; draw(false);
  try { await SB.recover(email, location.origin + location.pathname); A.info = 'Agar bu email ro‘yxatda bo‘lsa, tiklash havolasi yuborildi. Pochtani (Spam papkasini ham) tekshir.'; }
  catch (e) { A.err = uzErr(e); }
  A.busy = false; draw(false);
}
async function doReset(form) {
  const fd = new FormData(form), pw = String(fd.get('pw') || ''), pw2 = String(fd.get('pw2') || ''); A.err = '';
  if (pw.length < 6) { A.err = 'Parol kamida 6 ta belgidan iborat bo‘lsin.'; draw(false); return; }
  if (pw !== pw2) { A.err = 'Parollar bir xil emas.'; draw(false); return; }
  A.busy = true; draw(false);
  try { await SB.changePassword(pw); await SB.loadUser(); SB.clearRecovery(); A.busy = false; setMsg('Parol yangilandi', true); await afterLogin(); }
  catch (e) { A.busy = false; A.err = uzErr(e); draw(false); }
}
// ── owner: formalar, hisob ochish, obuna, parol ──
const PLANS = [['30', '30 kun'], ['90', '3 oy'], ['180', '6 oy'], ['365', '1 yil'], ['life', 'Umrbod']];
const genPw = () => { const al = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789', a = new Uint32Array(9); crypto.getRandomValues(a); return [...a].map(x => al[x % al.length]).join(''); };
const money = n => String(Math.round(+n || 0)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const intOf = v => parseInt(String(v || '').replace(/\D/g, ''), 10) || 0;
const planText = v => (PLANS.find(p => p[0] === v) || ['', ''])[1];
const fld = (name, label, o = {}) => `<label class="fld"><span class="lb">${esc(label)}</span>${o.gen ? `<span class="pw"><input name="${name}" type="text" value="${esc(o.value || '')}" autocomplete="off" autocapitalize="none" spellcheck="false"><button type="button" class="eye" data-a="gen" aria-label="Yangi parol yaratish">${ic('dice')}</button></span>` : `<input name="${name}" type="${o.type || 'text'}" value="${esc(o.value || '')}" placeholder="${esc(o.ph || '')}" ${o.mode ? `inputmode="${o.mode}"` : ''} autocomplete="off" autocapitalize="none" spellcheck="false">`}</label>`;
const chipsRow = (name, sel, opts, label) => `<span class="lb" style="display:block;font-size:13px;font-weight:700;color:var(--mu);margin:12px 0 6px 2px">${esc(label)}</span><div class="chips"><input type="hidden" name="${name}" value="${sel}">${opts.map(([v, n]) => `<button type="button" class="chip ${v === sel ? 'on' : ''}" data-a="sfChip" data-val="${v}">${n}</button>`).join('')}</div>`;
const planChips = sel => chipsRow('plan', sel, PLANS, 'Obuna muddati');
const formSheet = (title, inner, okLabel) => openSheet(`<h3>${esc(title)}</h3><form id="sf" novalidate>${inner}<p id="sferr" class="mu s" role="alert" style="color:var(--bad);min-height:18px;margin:8px 2px 0"></p><div class="in"><button type="button" class="btn" data-a="sheetNo">Bekor qilish</button><button type="submit" class="big">${esc(okLabel)}</button></div></form>`);
function sfValidate(form) {
  const v = Object.fromEntries(new FormData(form));
  if ('login' in v && !validLogin(v.login)) return LOGIN_HINT;
  if ('password' in v && (String(v.password).length < 6 || String(v.password).length > 72)) return 'Parol 6 dan 72 gacha belgi bo‘lsin.';
  return '';
}
function showCreds(email, pw, plan) {
  const text = `Testlar ilovasi\nLogin: ${shownLogin(email)}\nParol: ${pw}${plan ? '\nObuna: ' + plan : ''}\nHavola: ${location.origin}${location.pathname}`;
  return openSheet(`<h3>Hisob tayyor</h3><p class="mu s">Shu ma’lumotni mijozga yubor. Parol keyin ko‘rinmaydi.</p><pre class="cred" id="credtxt">${esc(text)}</pre><div class="in"><button class="btn" data-a="copyCred">${ic('link')} Nusxalash</button><button class="big" data-a="sheetOk">Yopish</button></div>`);
}
async function copyText(t) {
  try { await navigator.clipboard.writeText(t); return true; } catch (e) { /* zaxira usul */ }
  try { const r = document.createRange(); r.selectNodeContents($('#credtxt')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); return document.execCommand('copy'); } catch (e) { return false; }
}
async function newUser() {
  const v = await formSheet('Yangi foydalanuvchi', fld('name', 'Ism', { ph: 'Ism familiya' }) + fld('login', 'Login yoki email', { mode: 'email', ph: 'ozod1' }) + fld('password', 'Parol', { gen: true, value: genPw() }) + planChips('30') + fld('amount', 'To‘lov summasi (so‘m), ixtiyoriy', { mode: 'numeric', ph: '0' }), 'Hisob ochish');
  if (!v) return; const life = v.plan === 'life';
  try {
    const email = toEmail(v.login);
    await SB.fn('admin-users', { action: 'create', email, password: v.password, name: String(v.name || '').trim(), days: life ? 0 : +v.plan, lifetime: life, amount: intOf(v.amount) });
    await loadUsers(); await showCreds(email, v.password, planText(v.plan));
  } catch (e) { toast(uzErr(e)); }
}
async function grantUser(id) {
  const u = (A.users || []).find(x => x.user_id === id); if (!u) return;
  const v = await formSheet('Obuna: ' + (u.name || u.email), `<p class="mu s" style="margin:4px 2px">Hozir: ${esc(userStatus(u))}</p>` + planChips('30') + fld('amount', 'To‘lov summasi (so‘m), ixtiyoriy', { mode: 'numeric', ph: '0' }), 'Obuna berish');
  if (!v) return; const life = v.plan === 'life';
  try { await SB.rpc('owner_grant', { p_user: id, p_days: life ? 0 : +v.plan, p_lifetime: life, p_amount: intOf(v.amount) }); toast('Obuna berildi'); await loadUsers(); } catch (e) { toast(uzErr(e)); }
}
async function resetUserPw(id) {
  const u = (A.users || []).find(x => x.user_id === id); if (!u) return;
  const v = await formSheet('Yangi parol: ' + (u.name || u.email), fld('password', 'Yangi parol', { gen: true, value: genPw() }), 'Parolni o‘rnatish');
  if (!v) return;
  try { await SB.fn('admin-users', { action: 'set_password', user_id: id, password: v.password }); await showCreds(u.email, v.password, ''); } catch (e) { toast(uzErr(e)); }
}
// ── owner: umumiy katalog ──
const catQ = e => e.data.topics.reduce((a, t) => a + t.q.length, 0);
async function catSave(sid, patch, okMsg) {
  try { await SB.rest('catalog_subjects?subject_id=eq.' + encodeURIComponent(sid), { method: 'PATCH', headers: { Prefer: 'return=minimal' }, body: Object.assign({ updated_at: new Date().toISOString() }, patch) }); await syncCatalog(); toast(okMsg || 'Saqlandi'); if (V.v === 'cat') { V.anim = false; draw(); } }
  catch (e) { toast(uzErr(e)); }
}
async function catUpload(inp) {
  const fs = [...inp.files]; inp.value = ''; if (!fs.length) return;
  const subs = [], errs = [];
  for (const f of fs) {
    let d; try { d = JSON.parse(await f.text()); } catch (e) { errs.push(f.name + ': JSON emas'); continue; }
    const c = checkBank(d); if (c.err.length) { errs.push(`${f.name}: ${c.err[0]}`); continue; }
    d.subjects.forEach(x => subs.push(x));
  }
  if (errs.length) { setMsg(errs.join(' · '), false); V.anim = false; draw(); }
  if (!subs.length) return;
  const v = await formSheet('Katalogga qo‘shish', `<p class="mu s" style="margin:4px 2px">${subs.map(x => `${esc(x.name)} · ${x.topics.length} mavzu · ${subjCount(x)} savol`).join('<br>')}</p><p class="mu s" style="margin:4px 2px">Fan avval bor bo‘lsa, yangi mavzular (kitoblar) unga qo‘shiladi, bir xil <code>id</code>li mavzu yangilanadi.</p>` + fld('category', 'Kategoriya', { value: lsGet('testlar:lastcat', 'Madrasa'), ph: 'Masalan: Madrasa, IELTS' }) + chipsRow('pub', '1', [['1', 'Hammaga chop etilsin'], ['0', 'Qoralama (faqat men ko‘raman)']], 'Holati'), 'Yuklash');
  if (!v) return;
  const cat = String(v.category || '').trim().slice(0, 40), pub = v.pub !== '0'; lsSet('testlar:lastcat', cat || 'Madrasa');
  const now = new Map(CBRAW.map(e => [e.subject_id, e])), rows = []; let mx = Math.max(0, ...CBRAW.map(e => +e.sort || 0));
  subs.forEach(x => {
    const ex = now.get(x.id), data = ex ? JSON.parse(JSON.stringify(ex.data)) : { id: x.id, name: x.name, topics: [] };
    data.name = x.name; x.topics.forEach(t => { const i = data.topics.findIndex(y => y.id === t.id); if (i < 0) data.topics.push(t); else data.topics[i] = t; });
    rows.push({ subject_id: x.id, name: x.name, category: cat || (ex && ex.category) || '', sort: ex ? ex.sort : (mx += 10), published: pub, data, updated_at: new Date().toISOString() });
  });
  const all = [...CBRAW.filter(e => !rows.some(r => r.subject_id === e.subject_id)).map(e => e.data), ...rows.map(r => r.data)], chk = checkBank({ v: 1, subjects: all });
  if (chk.err.length) { setMsg('Katalogda xato: ' + chk.err[0], false); V.anim = false; draw(); return; }
  try {
    await SB.rest('catalog_subjects?on_conflict=subject_id', { method: 'POST', headers: { Prefer: 'resolution=merge-duplicates,return=minimal' }, body: rows });
    await syncCatalog(); setMsg(`Katalogga yuklandi: ${rows.length} ta fan, ${rows.reduce((a, r) => a + r.data.topics.reduce((b, t) => b + t.q.length, 0), 0)} ta savol${pub ? '' : ' (qoralama)'}`, true);
  } catch (e) { setMsg('Yuklanmadi: ' + uzErr(e), false); }
  V.anim = false; draw();
}
async function catEdit(sid) {
  const e = CBRAW.find(x => x.subject_id === sid); if (!e) return;
  const v = await formSheet('Tahrirlash', fld('name', 'Fan nomi', { value: e.name }) + fld('category', 'Kategoriya', { value: e.category }) + fld('sort', 'Tartib raqami (kichigi tepada)', { value: String(e.sort), mode: 'numeric' }) + chipsRow('pub', e.published ? '1' : '0', [['1', 'Chop etilgan'], ['0', 'Qoralama']], 'Holati'), 'Saqlash');
  if (!v) return; const name = String(v.name || '').trim(); if (!name) { toast('Nom bo‘sh bo‘lmasin'); return; }
  const data = JSON.parse(JSON.stringify(e.data)); data.name = name;
  await catSave(sid, { name, category: String(v.category || '').trim().slice(0, 40), sort: intOf(v.sort), published: v.pub !== '0', data });
}
async function catDel(sid) {
  const e = CBRAW.find(x => x.subject_id === sid); if (!e || !(await ask(`“${e.name}” kataloqdan o‘chirilsinmi?`, 'Barcha obunachilardan ham yo‘qoladi (ularning natijalari tarixda qoladi).', 'O‘chirish', true))) return;
  try { await SB.rest('catalog_subjects?subject_id=eq.' + encodeURIComponent(sid), { method: 'DELETE' }); await syncCatalog(); toast('O‘chirildi'); V.anim = false; draw(); } catch (er) { toast(uzErr(er)); }
}
async function catTopicDel(sid, tid) {
  const e = CBRAW.find(x => x.subject_id === sid); if (!e) return; const t = e.data.topics.find(x => x.id === tid); if (!t) return;
  if (e.data.topics.length < 2) { toast('Oxirgi mavzuni o‘chirib bo‘lmaydi. Butun fanni o‘chiring.'); return; }
  if (!(await ask(`“${t.name}” mavzusi o‘chirilsinmi?`, `${t.q.length} ta savol kataloqdan yo‘qoladi.`, 'O‘chirish', true))) return;
  const data = JSON.parse(JSON.stringify(e.data)); data.topics = data.topics.filter(x => x.id !== tid);
  await catSave(sid, { data }, 'Mavzu o‘chirildi');
}
function catView() {
  let h = `<header class="hdr up"><div style="display:flex;gap:12px;align-items:center"><button class="x" data-a="nav" data-v="set" aria-label="Orqaga">${ic('chevL')}</button><h1 style="font-size:26px">Umumiy katalog</h1></div></header>${noteHtml()}
  <p class="mu s">Bu yerga yuklagan savollaring faol obunachilarning hammasida o‘zi paydo bo‘ladi. Kitoblarni birma-bir qo‘sha berasan: bir xil fan <code>id</code>sidagi mavzular shu fanga qo‘shiladi.</p>
  <button class="big up" data-a="catPick">${ic('upload')} Katalogga fayl qo‘shish</button>`;
  if (!CBRAW.length) return h + '<div class="card empty"><p class="mu">Katalog hali bo‘sh.</p></div>';
  CBRAW.forEach((e, i) => {
    const hue = hueOf('c:' + e.subject_id);
    h += `<div class="card up" style="--i:${i}"><div style="display:flex;align-items:center;gap:12px"><span class="av" style="--h:${hue}">${initials(e.name)}</span><div style="min-width:0;flex:1"><b style="display:block;overflow-wrap:anywhere">${esc(e.name)}</b><small style="display:block">${e.data.topics.length} mavzu · ${catQ(e)} savol</small><span class="chip static" style="margin-top:6px">${esc(e.category || 'Kategoriyasiz')}</span> ${e.published ? '' : '<span class="chip static" style="margin-top:6px;color:var(--warn)">Qoralama</span>'}</div></div>
    <details class="rev" style="box-shadow:none;background:var(--card2)"><summary style="font-weight:600">Mavzular (kitoblar)</summary>${e.data.topics.map(t => `<div class="row" style="box-shadow:none;margin:8px 0;min-height:48px"><span class="t"><b style="font-size:14.5px">${esc(t.name)}</b><small>${t.q.length} savol</small></span><button class="x" style="color:var(--bad)" data-a="catTopicDel" data-sid="${esc(e.subject_id)}" data-tid="${esc(t.id)}" aria-label="${esc(t.name)} mavzusini o‘chirish">${ic('trash')}</button></div>`).join('')}</details>
    <div class="in"><button class="btn s" data-a="catEdit" data-id="${esc(e.subject_id)}">Tahrirlash</button><button class="btn s danger" data-a="catDel" data-id="${esc(e.subject_id)}">O‘chirish</button></div></div>`;
  });
  return h;
}
async function logout() {
  if (!(await ask('Chiqamizmi?', 'Ma’lumotlaring bulutda saqlanadi. Shu qurilmadagi nusxa o‘chiriladi.', 'Chiqish', true))) return;
  if (isActive(A.profile)) {   // faol bo‘lmagan (bloklangan) hisobda sinxronlanadigan narsa yo‘q
    if (online()) { clearTimeout(syncTimer); await syncAll(); }
    if (A.sync !== 'ok' && !(await ask('Sinxronlanmadi', 'Oxirgi o‘zgarishlar bulutga yuborilmadi va chiqsang yo‘qoladi.', 'Baribir chiqish', true))) return;
  }
  await SB.signOut(); wipeLocal(); A.mode = 'in'; A.err = ''; A.info = ''; V.v = 'auth'; V.anim = true; draw(); window.scrollTo(0, 0);
}
async function changePw(form) {
  const pw = String(new FormData(form).get('pw') || '');
  if (pw.length < 6) { toast('Parol kamida 6 ta belgi bo‘lsin'); return; }
  try { await SB.changePassword(pw); A.pwOpen = false; setMsg('Parol o‘zgartirildi', true); V.anim = false; draw(); } catch (e) { toast(uzErr(e)); }
}
async function loadUsers() {
  A.usersErr = '';
  try {
    const [u, p] = await Promise.all([SB.rest('profiles?select=*&order=created_at.desc'), SB.rest('payments?select=amount,days,lifetime,created_at&order=created_at.desc&limit=2000')]);
    A.users = u; A.pays = p;
  } catch (e) { A.usersErr = uzErr(e); A.users = A.users || []; A.pays = A.pays || []; }
  if (V.v === 'users') { V.anim = false; draw(); }
}
async function ownerSet(id, patch) {
  const u = (A.users || []).find(x => x.user_id === id); if (!u) return;
  const n = Object.assign({ blocked: u.blocked, lifetime: u.lifetime, expires_at: u.expires_at }, patch);
  try { await SB.rpc('owner_set_user', { p_user: id, p_blocked: n.blocked, p_lifetime: n.lifetime, p_expires: n.expires_at }); toast('Saqlandi'); await loadUsers(); } catch (e) { toast(uzErr(e)); }
}
async function ownerDelete(id) {
  const u = (A.users || []).find(x => x.user_id === id); if (!u) return;
  if (!(await ask(`“${u.name || u.email}” o‘chirilsinmi?`, 'Hisob va uning bulutdagi barcha ma’lumoti butunlay o‘chadi.', 'O‘chirish', true))) return;
  try { await SB.rpc('owner_delete_user', { p_user: id }); toast('O‘chirildi'); await loadUsers(); } catch (e) { toast(uzErr(e)); }
}
const userStatus = u => u.role === 'owner' ? 'Owner' : u.blocked ? 'Bloklangan' : u.pending ? 'Faollashtirilmagan' : u.lifetime ? 'Umrbod' : u.expires_at ? (new Date(u.expires_at) > new Date() ? 'Muddat: ' + fmtDate(keyOf(new Date(u.expires_at))) : 'Muddati tugagan') : 'Cheksiz';

// ───────────── ko‘rinish holati ─────────────
let V = { v: 'home', sid: '', n: 20, mo: 'm', sel: {}, msg: null, anim: true, fresh: false };
let Q = null, R = null, TI = 0;
const setMsg = (t, ok) => { V.msg = t ? { t, ok: !!ok } : null; };
function toast(t) {
  const e = $('#toast'); e.textContent = t; e.classList.add('on');
  clearTimeout(toast.t); toast.t = setTimeout(() => e.classList.remove('on'), 2600);
}
// tasdiqlash oynasi (alert/confirm o‘rniga)
let sheetRes = null;
function openSheet(inner) {
  return new Promise(res => {
    if (sheetRes) sheetRes(false);
    sheetRes = res; const e = $('#sheet');
    e.innerHTML = `<div class="sh-bg" data-a="sheetNo"></div><div class="sh-card" role="dialog" aria-modal="true">${inner}</div>`;
    e.classList.add('on'); setTimeout(() => { const b = $('#sheet input:not([type=hidden])') || $('#sheet .big'); b && b.focus({ preventScroll: true }); }, 60);
  });
}
function ask(title, body, okLabel, danger) {
  return openSheet(`<h3>${esc(title)}</h3><p>${esc(body)}</p><div class="in"><button class="btn" data-a="sheetNo">Bekor qilish</button><button class="big ${danger ? 'danger' : ''}" data-a="sheetOk">${esc(okLabel || 'Ha')}</button></div>`);
}
function closeSheet(v) { $('#sheet').classList.remove('on'); const r = sheetRes; sheetRes = null; if (r) r(v); }

// ───────────── hisoblar ─────────────
const misIds = () => Object.keys(S.m).filter(i => TBX[i]);
const dueIds = () => { const T = today(); return misIds().filter(i => !S.m[i].nx || S.m[i].nx <= T); };
const flagIds = () => Object.keys(S.f).filter(i => TBX[i]);
const hist = key => S.h.filter(x => x.t === key);
const best = key => { const L = hist(key); return L.length ? Math.max(...L.map(x => pct(x.ok, x.n))) : null; };
const last = key => { const L = hist(key); return L.length ? pct(L[L.length - 1].ok, L[L.length - 1].n) : null; };
const todayCount = () => S.h.filter(x => x.d === today()).reduce((a, x) => a + x.n, 0);
function streak() {
  const days = new Set(S.h.map(x => x.d)); let d = today(), n = 0;
  if (!days.has(d)) d = addDays(d, -1);
  while (days.has(d)) { n++; d = addDays(d, -1); }
  return n;
}
const mastery = ids => { const m = ids.filter(i => S.sn[i] && !S.m[i]).length; return pct(m, ids.length); };
function plan(sid) {
  const d = S.ex[sid]; if (!d) return null;
  const ids = subjQ(sid), seen = ids.filter(i => S.sn[i]).length, rem = ids.length - seen, left = diffDays(today(), d);
  if (left < 0) return { past: true, d };
  return { d, left, total: ids.length, seen, rem, quota: rem ? Math.ceil(rem / Math.max(1, left)) : 0 };
}
function keyName(k) {
  if (k.startsWith('s:')) { const s = findSubj(k.slice(2)); return s ? s.name + ' (umumiy)' : k.slice(2); }
  if (k.startsWith('u:')) { const s = findSubj(k.slice(2)); return (s ? s.name : k.slice(2)) + ' (reja)'; }
  return { a: 'Umumiy test', m: 'Xatolar banki', f: 'Belgilanganlar', d: 'Takrorlash', c: 'Tanlangan mavzular' }[k] || (findTopic(k) || { name: k }).name;
}
const greet = () => { const h = new Date().getHours(); return h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech'; };

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
  Q = { cfg: c, mo: c.mo, label: c.label || '', ids, i: 0, ans: {}, rv: {}, sf: {}, fin: false, t0: now, combo: 0,
    ord: ids.map(() => sh ? shuffle([0, 1, 2, 3]) : [0, 1, 2, 3]),
    dl: c.mo === 'e' ? now + ids.length * S.set.sec * 1000 : 0 };
  R = null; V.v = 'quiz'; V.anim = true; startTimer(); draw(); window.scrollTo(0, 0);
}
const cfgOf = (kind, id, label, extra) => ({ kind, id: id || '', label, extra, n: ['m', 'f', 'd'].includes(kind) ? 0 : V.n, mo: V.mo });

function startTimer() {
  clearInterval(TI);
  if (!Q || !Q.dl) return;
  TI = setInterval(() => {
    if (!Q || Q.fin || V.v !== 'quiz') { clearInterval(TI); return; }
    const l = Math.round((Q.dl - Date.now()) / 1000), e = $('#tmr');
    if (e) { e.textContent = mmss(l); e.parentElement.classList.toggle('low', l <= 10); }
    if (l <= 0) { clearInterval(TI); toast('⏰ Vaqt tugadi'); finish(true); }
  }, 500);
}

function answer(k) {
  if (!Q || Q.fin || Q.mo === 'o') return;
  const i = Q.i, id = Q.ids[i];
  if (Q.mo === 'm' && Q.ans[id] !== undefined) return;
  Q.ans[id] = Q.ord[i][k];
  if (Q.mo === 'm') { const good = Q.ans[id] === TBX[id].q.a; Q.combo = good ? Q.combo + 1 : 0; buzz(good ? 12 : [30, 40, 30]); }
  V.anim = false; draw(false);
  const fb = $('.fb'); if (fb) fb.scrollIntoView({ block: 'nearest', behavior: reduced() ? 'auto' : 'smooth' });
}
function go(d) { if (!Q) return; Q.i = Math.max(0, Math.min(Q.ids.length - 1, Q.i + d)); V.anim = true; draw(); window.scrollTo(0, 0); }
function rate(r) { if (!Q || Q.fin) return; const id = Q.ids[Q.i], q = TBX[id].q; Q.sf[id] = r; Q.ans[id] = r === 'y' ? q.a : -1; V.anim = false; draw(false); }
function flag(id) { S.f[id] ? delete S.f[id] : S.f[id] = 1; save(); V.anim = false; draw(false); }

async function finish(force) {
  if (!Q || Q.fin) return;
  const un = Q.ids.filter(id => Q.ans[id] === undefined).length;
  if (un && !force && !(await ask('Testni yakunlaymizmi?', un + ' ta savolga hali javob berilmagan. Ular xato hisoblanadi.', 'Yakunlash'))) return;
  if (!Q || Q.fin) return;
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
  R = { rec, wrong, un, ans: Q.ans, cfg: c };
  V.v = 'res'; V.anim = true; V.fresh = true; save(); draw(); window.scrollTo(0, 0);
}
async function quit() {
  if (await ask('Testni to‘xtatamizmi?', 'Natija saqlanmaydi.', 'To‘xtatish', true)) { clearInterval(TI); Q = null; V.v = V.sid ? 'subj' : 'home'; V.anim = true; draw(); }
}

// ───────────── ko‘rinishlar ─────────────
const noteHtml = () => V.msg ? `<div class="note ${V.msg.ok ? 'okn' : ''}" role="status">${ic(V.msg.ok ? 'ok' : 'alert')}<span>${esc(V.msg.t)}</span></div>` : '';
const nChips = () => `<div class="chips" role="group" aria-label="Savollar soni"><span class="lbl">Savollar soni</span>${[10, 20, 30, 50, 0].map(n => `<button class="chip ${V.n === n ? 'on' : ''}" data-a="setN" data-n="${n}" aria-pressed="${V.n === n}">${n || 'Hammasi'}</button>`).join('')}</div>`;
const modeSeg = () => `<div class="seg" role="group" aria-label="Rejim">${[['m', 'pencil', 'Mashq'], ['e', 'timer', 'Imtihon'], ['o', 'bulb', 'Ochiq']].map(([k, i, n]) => `<button class="${V.mo === k ? 'on' : ''}" data-a="setMo" data-mo="${k}" aria-pressed="${V.mo === k}">${ic(i)}${n}</button>`).join('')}</div><p class="mu s" style="margin:0 2px 8px">${{ m: 'Har javobdan keyin darrov izoh ko‘rinadi.', e: `Taymer: savolga ${S.set.sec} soniya. Natija oxirida.`, o: 'Avval o‘zing o‘ylaysan, keyin javobni ko‘rib o‘zingni baholaysan.' }[V.mo]}</p>`;

function emptyView() {
  return `${noteHtml()}<div class="card empty up" style="--i:0"><svg class="ill" viewBox="0 0 200 150" aria-hidden="true"><defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6cff"/><stop offset="1" stop-color="#8a4dff"/></linearGradient></defs><rect x="38" y="30" width="124" height="92" rx="18" fill="#8a4dff" opacity=".18" transform="rotate(-8 100 76)"/><rect x="38" y="30" width="124" height="92" rx="18" fill="#5b6cff" opacity=".28" transform="rotate(5 100 76)"/><rect x="38" y="24" width="124" height="96" rx="18" fill="url(#g1)"/><circle cx="62" cy="52" r="6" fill="#fff"/><rect x="76" y="48" width="64" height="8" rx="4" fill="#fff" opacity=".9"/><circle cx="62" cy="76" r="6" fill="none" stroke="#fff" stroke-width="3"/><rect x="76" y="72" width="52" height="8" rx="4" fill="#fff" opacity=".6"/><circle cx="62" cy="100" r="6" fill="none" stroke="#fff" stroke-width="3"/><rect x="76" y="96" width="60" height="8" rx="4" fill="#fff" opacity=".6"/></svg>
  <h1 style="font-size:26px">Testlar</h1><p class="mu" style="margin:6px 0 16px">Kitob va PDF’laringdan tuzilgan savollarni yuklab, 4 variantli testlar yech.</p>
  <button class="big" data-a="pickBank">${ic('upload')} Test banki faylini yuklash</button>
  <button class="btn" style="margin-top:10px" data-a="sample">${ic('sparkle')} Namuna bankni yuklash</button></div>
  <div class="card up" style="--i:1"><h2>Qanday ishlaydi?</h2><ol class="steps">
  <li><span class="n">1</span><span>Kitob yoki PDF’ni <b>Claude</b>’ga tashlaysan.</span></li>
  <li><span class="n">2</span><span>U fan → mavzu → savollar qilib <code>.json</code> bank beradi.</span></li>
  <li><span class="n">3</span><span>Bankni shu yerga yuklaysan. Internetsiz ham ishlaydi.</span></li></ol></div>`;
}

function homeView() {
  if (!TB) return emptyView();
  const due = dueIds().length, mis = misIds().length, fl = flagIds().length, td = todayCount(), goal = S.set.goal, st = streak();
  const pl = TB.subjects.map(s => ({ s, p: plan(s.id) })).filter(x => x.p && !x.p.past && x.p.quota);
  const d = new Date(), done = td >= goal;
  const cta = due ? `<button class="cta" data-a="start" data-kind="d" data-label="Bugun takrorlash">${ic('refresh')} Takrorlash · ${due}</button>` : `<button class="cta" data-a="start" data-kind="a" data-label="Hamma fanlar">${ic('play')} Boshlash</button>`;
  let h = `<header class="hdr up"><div><p class="eyebrow">${greet()}</p><h1>${d.getDate()}-${MONTHS[d.getMonth()]}</h1></div><div class="pill flame" title="Ketma-ket kunlar">${ic('flame')}<b>${st}</b> kun</div></header>${noteHtml()}
  <section class="hero up" style="--i:1" aria-label="Kunlik maqsad"><div class="hero-l"><p class="k">Kunlik maqsad</p><p class="n">${td}<span>/ ${goal} savol</span></p><p class="hint">${done ? 'Maqsad bajarildi! Zo‘r ish.' : (goal - td) + ' ta savol qoldi'}</p>${cta}</div>${ring(pct(td, goal), 98, 10, Math.min(100, pct(td, goal)) + '%')}</section>
  <div class="tiles">
   <button class="tile up" style="--i:2;--h:250" data-a="start" data-kind="a" data-label="Hamma fanlar"><span class="ti">${ic('dice')}</span><span><b>Umumiy test</b><small>Hamma fanlardan</small></span></button>
   <button class="tile up" style="--i:3;--h:8" data-a="start" data-kind="m" data-label="Xatolar banki" ${mis ? '' : 'disabled'}><span class="ti">${ic('alert')}</span>${mis ? `<span class="bdg">${mis}</span>` : ''}<span><b>Xatolar (${mis})</b><small>${mis ? 'Xatolaringni to‘g‘irla' : 'Hozircha xato yo‘q'}</small></span></button>
   <button class="tile up" style="--i:4;--h:160" data-a="start" data-kind="d" data-label="Bugun takrorlash" ${due ? '' : 'disabled'}><span class="ti">${ic('refresh')}</span>${due ? `<span class="bdg">${due}</span>` : ''}<span><b>Takrorlash</b><small>${due ? 'Bugun ' + due + ' ta' : 'Bugun reja yo‘q'}</small></span></button>
   <button class="tile up" style="--i:5;--h:35" data-a="nav" data-v="flag" ${fl ? '' : 'disabled'}><span class="ti">${ic('flag')}</span><span><b>Belgilangan</b><small>${fl ? fl + ' ta savol' : 'Shubhali savollar'}</small></span></button>
  </div>
  <div class="opts up" style="--i:6">${nChips()}${modeSeg()}</div>`;
  if (pl.length) {
    h += `<div class="sec up" style="--i:7"><h2>Imtihon rejasi</h2></div><div class="plans up" style="--i:7">${pl.map(({ s, p }) => `<button class="pcard" data-a="plan" data-id="${esc(s.id)}" style="--h:${hueOf(s.id)}">${ring(pct(p.seen, p.total), 56, 6, `${p.left}<small>kun</small>`, `--clr:hsl(${hueOf(s.id)} 85% 58%)`)}<span class="t"><b>${esc(s.name)}</b><small>Bugun ${p.quota} ta yangi savol</small></span>${ic('play')}</button>`).join('')}</div>`;
  }
  const card = (sb, i) => { const ids = subjQ(sb.id), m = mastery(ids);
    return `<button class="scard up" style="--i:${9 + i};--h:${hueOf(sb.id)}" data-a="subj" data-id="${esc(sb.id)}">${avatar(sb)}<span class="t"><b>${esc(sb.name)}${sb.draft ? ' <span class="chip static">Qoralama</span>' : ''}</b><small>${sb.topics.length} mavzu · ${subjCount(sb)} savol · ${m}% o‘zlashtirildi</small><span class="bar" style="display:block"><i style="width:${m}%"></i></span></span>${ic('chevR')}</button>`; };
  const cats = new Map(); TB.subjects.filter(x => x.cat).forEach(x => { const k = x.category || 'Katalog'; (cats.get(k) || cats.set(k, []).get(k)).push(x); });
  const own = TB.subjects.filter(x => !x.cat); let n = 0;
  cats.forEach((L, k) => { h += `<div class="sec up" style="--i:8"><h2>${esc(k)}</h2><span class="chip static">${L.length} ta</span></div>` + L.map(x => card(x, n++)).join(''); });
  if (own.length) h += `<div class="sec up" style="--i:8"><h2>${cats.size ? 'Mening fanlarim' : 'Fanlar'}</h2><span class="chip static">${own.length} ta</span></div>` + own.map(x => card(x, n++)).join('');
  return h;
}

function subjView() {
  const s = findSubj(V.sid); if (!s) { V.v = 'home'; return homeView(); }
  const h0 = hueOf(s.id), ids = subjQ(s.id), m = mastery(ids), p = plan(s.id);
  const sel = s.topics.filter(t => V.sel[t.id]), selQ = sel.reduce((a, t) => a + t.q.length, 0);
  let h = `<section class="shero up" style="--h:${h0}"><div class="top"><button class="x" data-a="nav" data-v="home" aria-label="Orqaga">${ic('chevL')}</button><span class="chip static" style="background:rgba(255,255,255,.2);color:#fff">${s.topics.length} mavzu</span></div>
  <div class="row2"><div><h1>${esc(s.name)}</h1><p>${ids.length} savol · ${S.h.filter(x => x.t === 's:' + s.id || s.topics.some(t => t.id === x.t)).length} urinish</p></div>${ring(m, 70, 8, m + '%')}</div></section>${noteHtml()}`;
  if (p && !p.past) h += `<div class="card up" style="--i:1;--h:${h0}"><div class="hd" style="display:flex;justify-content:space-between;align-items:center"><b>${ic('calendar')} Imtihon: ${fmtDate(p.d)}</b><span class="chip static">${p.left} kun</span></div><div class="bar ok" style="margin:10px 0"><i style="width:${pct(p.seen, p.total)}%"></i></div><p class="mu s" style="margin:0 0 10px">Ko‘rilgan ${p.seen}/${p.total}${p.rem ? ' · kuniga ' + p.quota + ' ta yangi savol' : ' · hammasi ko‘rilgan, takrorlash vaqti'}</p><button class="btn s" data-a="plan" data-id="${esc(s.id)}" ${p.quota ? '' : 'disabled'}>${ic('play')} Bugungi ${p.quota} ta savol</button></div>`;
  h += `<div class="opts up" style="--i:2">${nChips()}${modeSeg()}</div>
  <button class="big up" style="--i:3;background:linear-gradient(135deg,hsl(${h0} 80% 56%),hsl(${(h0 + 40) % 360} 80% 46%));box-shadow:0 8px 20px -6px hsl(${h0} 80% 45% / .6)" data-a="start" data-kind="s" data-id="${esc(s.id)}" data-label="${esc(s.name)}">${ic('dice')} Butun fandan umumiy test · ${subjCount(s)}</button>
  <div class="sec up" style="--i:4"><h2>Mavzular</h2><button class="chip" data-a="selAll">${sel.length === s.topics.length ? 'Belgini olish' : 'Hammasini tanlash'}</button></div>
  <p class="mu s up" style="margin:-2px 2px 4px;--i:4">Mavzuga bosib shundan boshlaysan. Katakchalar bilan bir nechtasini birlashtirasan.</p>`;
  s.topics.forEach((t, i) => {
    const b = best(t.id), l = last(t.id);
    h += `<div class="row up" style="--i:${5 + i};--h:${h0}"><input type="checkbox" data-c="sel" data-id="${esc(t.id)}" ${V.sel[t.id] ? 'checked' : ''} aria-label="${esc(t.name)} tanlash"><button class="tmain" data-a="start" data-kind="t" data-id="${esc(t.id)}" data-label="${esc(t.name)}"><span class="t"><b>${esc(t.name)}</b><small>${t.q.length} savol${b !== null ? ' · eng yaxshi ' + b + '%' : ''}${l !== null ? ' · oxirgi ' + l + '%' : ''}</small></span></button><span class="go">${ic('play')}</span></div>`;
  });
  if (sel.length) h += `<div class="sticky"><button class="big" data-a="startSel">${ic('layers')} Tanlanganlardan test · ${sel.length} mavzu · ${selQ} savol</button></div>`;
  return h;
}

function optionsHtml(id, x) {
  const i = Q.i, q = x.q, ord = Q.ord[i], a = Q.ans[id], ex = Q.mo === 'm';
  return ord.map((oi, k) => {
    let cls = 'opt', mk = '';
    if (a !== undefined) { if (ex) { if (oi === q.a) { cls += ' ok'; mk = ic('ok'); } else if (oi === a) { cls += ' bad'; mk = ic('no'); } } else if (oi === a) cls += ' sel'; }
    return `<button class="${cls}" data-a="ans" data-k="${k}" ${ex && a !== undefined ? 'disabled' : ''}><span class="l">${LET[k]}</span><span class="tx">${esc(q.o[oi])}</span><span class="mk">${mk}</span></button>`;
  }).join('');
}
function quizView() {
  if (!Q) return '';
  const i = Q.i, id = Q.ids[i], x = TBX[id], q = x.q, open = Q.mo === 'o', a = Q.ans[id], ex = Q.mo === 'm', fl = !!S.f[id], lastQ = i >= Q.ids.length - 1;
  const answered = a !== undefined;
  const top = `<div class="qtop"><button class="x" data-a="quit" aria-label="To‘xtatish">${ic('x')}</button><div class="mid"><div class="cnt"><span>${esc(Q.label)}</span><span><b>${i + 1} / ${Q.ids.length}</b></span></div><div class="bar"><i style="width:${pct(i + (answered ? 1 : 0), Q.ids.length)}%"></i></div></div>${Q.dl ? `<span class="tmr">${ic('timer')}<span id="tmr">${mmss((Q.dl - Date.now()) / 1000)}</span></span>` : ''}</div>`;
  const tags = `<div class="tags"><span class="tag">${esc(x.t.name)}</span>${open ? '<span class="tag">Ochiq rejim</span>' : ''}${Q.combo >= 2 && ex ? `<span class="tag fire">${ic('flame', 13)} ${Q.combo} ketma-ket</span>` : ''}</div>`;
  const src = q.r ? `<span class="src">${ic('book', 14)} ${esc(x.t.name)}, ${esc(q.r)}</span>` : '';
  let body;
  if (!open) {
    body = optionsHtml(id, x);
    if (ex && answered) body += `<div class="fb ${a === q.a ? '' : 'bad'}" role="status"><div class="fh">${ic(a === q.a ? 'ok' : 'no', 22)} ${a === q.a ? 'To‘g‘ri!' : 'Noto‘g‘ri'}</div>${a === q.a ? '' : `<p>To‘g‘ri javob: <b>${esc(q.o[q.a])}</b></p>`}${q.e ? `<p>${esc(q.e)}</p>` : ''}${src}</div>`;
  } else if (!Q.rv[id]) {
    body = `<div class="fb neutral"><div class="fh">${ic('bulb', 22)} O‘ylab ko‘r</div><p>Avval javobni ichingda yoki ovoz chiqarib ayt, keyin tekshir.</p></div><button class="big" data-a="rev" style="margin-top:6px">${ic('eye')} Javobni ko‘rish</button>`;
  } else {
    const sf = Q.sf[id];
    body = `<div class="fb"><div class="fh">${ic('ok', 22)} To‘g‘ri javob</div><p><b>${esc(q.o[q.a])}</b></p>${q.e ? `<p>${esc(q.e)}</p>` : ''}${src}</div><p class="mu s" style="margin:14px 2px 8px;font-weight:600">Qanchalik bilding?</p><div class="rate">${[['y', 'ok', 'Bildim'], ['p', 'half', 'Qisman'], ['n', 'no', 'Bilmadim']].map(([k, i, n]) => `<button class="${k} ${sf === k ? 'on' : ''}" data-a="rate" data-r="${k}" aria-pressed="${sf === k}">${ic(i)}${n}</button>`).join('')}</div>`;
  }
  const need = (ex && !answered) || (open && !Q.sf[id]);
  const bar = `<div class="qbar"><div class="in"><button class="ib" data-a="go" data-d="-1" ${i ? '' : 'disabled'} aria-label="Oldingi">${ic('chevL')}</button><button class="ib ${fl ? 'on' : ''}" data-a="flag" data-id="${esc(id)}" aria-pressed="${fl}" aria-label="Shubhali deb belgilash">${ic('flag')}</button>${lastQ ? `<button class="big" data-a="finish" ${need ? 'disabled' : ''}>${ic('check')} Yakunlash</button>` : `<button class="big" data-a="go" data-d="1" ${need ? 'disabled' : ''}>Keyingisi ${ic('chevR')}</button>`}</div></div>`;
  const grid = Q.mo === 'e' ? `<div class="grid-q">${Q.ids.map((d, j) => `<button class="dot ${j === i ? 'cur' : Q.ans[d] !== undefined ? 'done' : ''}" data-a="jump" data-i="${j}" aria-label="${j + 1}-savol">${Q.ans[d] !== undefined && j !== i ? ic('check', 16) : j + 1}</button>`).join('')}</div><button class="btn s" data-a="finish">${ic('check')} Testni yakunlash</button>` : '';
  return top + `<div class="qwrap ${V.anim ? 'in' : ''}">${tags}<div class="qcard"><p class="q">${esc(q.q)}</p></div>${body}${grid}</div>` + bar;
}

function resView() {
  if (!R) return '';
  const r = R.rec, p = pct(r.ok, r.n), msg = p >= 90 ? 'Ajoyib natija!' : p >= 75 ? 'Juda yaxshi!' : p >= 55 ? 'Yomon emas' : 'Mashqni davom ettir';
  const sub = p >= 90 ? 'Bu mavzu mustahkam.' : p >= 75 ? 'Xatolarni takrorlasang, a’lo bo‘ladi.' : p >= 55 ? 'Xatolar ustida ishlab, qayta urinib ko‘r.' : 'Xatolar bankidan mashq qilsang, tez o‘sasan.';
  let h = `<div class="card res up"><div class="hd"><span class="chip static">${esc(keyName(r.t))}</span></div>${ring(p, 150, 14, `<span class="n" id="cnt" data-to="${p}">${R.shown ? p : 0}%</span>`, `--clr:${scoreClr(p)}`)}<h2>${msg}</h2><p class="mu" style="margin:0">${sub}</p>
  <div class="stat3"><div class="g"><b>${r.ok}</b><small>To‘g‘ri</small></div><div class="r"><b>${r.n - r.ok}</b><small>Xato${R.un ? ' · ' + R.un + ' javobsiz' : ''}</small></div><div><b>${mmss(r.sec)}</b><small>Vaqt</small></div></div></div>
  <div class="in up" style="--i:1"><button class="big" data-a="again">${ic('refresh')} Qayta yechish</button>${R.wrong.length ? `<button class="btn" data-a="start" data-kind="m" data-label="Xatolar banki">${ic('alert')} Xatolarni mashq qil</button>` : ''}</div>
  <button class="btn s up" style="--i:2" data-a="nav" data-v="${V.sid ? 'subj' : 'home'}">Orqaga</button>`;
  if (!R.wrong.length) return h + '<p class="up" style="--i:3;text-align:center;font-weight:700;margin-top:18px">Hammasi to‘g‘ri!</p>';
  h += `<div class="sec up" style="--i:3"><h2>Xato javoblar</h2><span class="chip static">${R.wrong.length} ta</span></div>`;
  R.wrong.forEach(id => {
    const x = TBX[id]; if (!x) return; const q = x.q, a = R.ans[id];
    h += `<details class="rev"><summary>${esc(q.q)}</summary><p><b>To‘g‘ri:</b> ${esc(q.o[q.a])}</p>${a === undefined ? '<p class="mu">Javob berilmagan</p>' : a < 0 ? '<p class="mu">Ochiq rejimda “bilmadim/qisman” deb baholading</p>' : `<p class="mu"><b>Sen:</b> ${esc(q.o[a])}</p>`}${q.e ? `<p>${esc(q.e)}</p>` : ''}<small>${esc(x.t.name)}${q.r ? ', ' + esc(q.r) : ''}</small></details>`;
  });
  return h;
}

function statView() {
  const h = S.h;
  if (!h.length) return `<header class="hdr up"><h1>Statistika</h1></header><div class="card empty up"><p style="font-size:44px;margin:0">📊</p><h2>Hali test yechilmagan</h2><p class="mu">Birinchi testni yechgach, bu yerda natijalaring va zaif mavzularing ko‘rinadi.</p></div>`;
  const by = {}; h.forEach(x => (by[x.t] = by[x.t] || []).push(x));
  const rows = Object.entries(by).map(([k, L]) => ({ k, n: L.length, avg: Math.round(L.reduce((a, x) => a + x.ok / x.n, 0) / L.length * 100) })).sort((a, b) => a.avg - b.avg);
  const tot = h.reduce((a, x) => a + x.n, 0), ok = h.reduce((a, x) => a + x.ok, 0), days = new Set(h.map(x => x.d));
  const wk = []; for (let i = 6; i >= 0; i--) { const k = addDays(today(), -i), n = h.filter(x => x.d === k).reduce((a, x) => a + x.n, 0); wk.push({ k, n, l: DAYS[new Date(k + 'T12:00:00').getDay()] }); }
  const mx = Math.max(10, ...wk.map(w => w.n));
  return `<header class="hdr up"><h1>Statistika</h1><div class="pill flame">${ic('flame')}<b>${streak()}</b> kun</div></header>
  <div class="kpis"><div class="kpi up" style="--i:1">${ic('target')}<b>${pct(ok, tot)}%</b><small>Umumiy aniqlik</small></div><div class="kpi up" style="--i:2">${ic('layers')}<b>${tot}</b><small>Yechilgan savol</small></div><div class="kpi up" style="--i:3">${ic('check')}<b>${h.length}</b><small>Yechilgan test</small></div><div class="kpi up" style="--i:4">${ic('calendar')}<b>${days.size}</b><small>Faol kun</small></div></div>
  <div class="card up" style="--i:5"><div class="hd" style="display:flex;justify-content:space-between"><h2>Oxirgi 7 kun</h2><span class="chip static">savollar</span></div><div class="week">${wk.map((w, i) => `<div class="c ${w.n ? 'has' : ''} ${i === 6 ? 'now' : ''}"><em>${w.n || ''}</em><i style="height:${Math.max(6, Math.round(w.n / mx * 84))}px"></i><small>${w.l}</small></div>`).join('')}</div></div>
  <div class="sec up" style="--i:6"><h2>Zaifdan kuchliga</h2></div><p class="mu s" style="margin:-4px 2px 6px">Bosib, shu bo‘limni darrov mashq qil.</p>
  ${rows.map(r => `<button class="stbar" data-a="statGo" data-k="${esc(r.k)}">${ring(r.avg, 48, 6, r.avg + '%', `--clr:${scoreClr(r.avg)}`)}<span class="k">${esc(keyName(r.k))}<small>${r.n} marta yechilgan</small></span>${ic('chevR')}</button>`).join('')}
  <div class="sec"><h2>So‘nggi natijalar</h2></div>${h.slice(-8).reverse().map(x => `<div class="row"><span class="t"><b>${pct(x.ok, x.n)}% · ${esc(keyName(x.t))}</b><small>${x.ok}/${x.n} · ${fmtDate(x.d)} · ${{ m: 'mashq', e: 'imtihon', o: 'ochiq' }[x.mo] || ''}</small></span></div>`).join('')}`;
}

function flagView() {
  const L = flagIds();
  return `<header class="hdr up"><div style="display:flex;gap:12px;align-items:center"><button class="x" data-a="nav" data-v="home" aria-label="Orqaga">${ic('chevL')}</button><h1 style="font-size:26px">Belgilanganlar</h1></div></header>
  <p class="mu s">Shubhali deb belgilagan savollaringni kitob yoki o‘qituvchi bilan tekshir.</p>${L.length ? `<button class="big" data-a="start" data-kind="f" data-label="Belgilanganlar">${ic('play')} Yechish · ${L.length}</button>` : '<div class="card empty"><p class="mu">Belgilangan savol yo‘q.</p></div>'}
  ${L.map(id => { const x = TBX[id]; return `<details class="rev"><summary>${esc(x.q.q)}</summary><p><b>Javob:</b> ${esc(x.q.o[x.q.a])}</p>${x.q.e ? `<p>${esc(x.q.e)}</p>` : ''}<small>${esc(x.t.name)}${x.q.r ? ', ' + esc(x.q.r) : ''}</small><div style="margin-top:10px"><button class="btn s" data-a="flag" data-id="${esc(id)}">Belgini olib tashlash</button></div></details>`; }).join('')}`;
}

const segHtml = (key, cur, opts) => `<div class="seg" role="group">${opts.map(([v, n]) => `<button class="${String(cur) === String(v) ? 'on' : ''}" data-a="set" data-key="${key}" data-val="${v}" aria-pressed="${String(cur) === String(v)}">${n}</button>`).join('')}</div>`;
function setView() {
  let h = `<header class="hdr up"><h1>Sozlamalar</h1></header>${noteHtml()}${saveFailed ? `<div class="note">${ic('alert')}<span>Natijalarni saqlab bo‘lmadi (brauzer xotirasi to‘la yoki yopiq). Zaxira oling.</span></div>` : ''}${acctCard()}
  <div class="card up" style="--i:1"><h2>${ic('layers')}Savol banki</h2>`;
  if (TB) h += `<p class="mu s">${TB.subjects.length} fan · ${topicsAll().length} mavzu · ${qCount()} savol</p><div class="grp">` + TB.subjects.map(s => `<div class="row" style="--h:${hueOf(s.id)}">${avatar(s)}<span class="t"><b>${esc(s.name)}</b><small>${s.topics.length} mavzu · ${subjCount(s)} savol</small></span>${s.cat ? '<span class="chip static">Katalog</span>' : `<button class="x" style="color:var(--bad)" data-a="delSubj" data-id="${esc(s.id)}" aria-label="${esc(s.name)} fanini o‘chirish">${ic('trash')}</button>`}</div>`).join('') + '</div>';
  else h += '<p class="mu s">Bank hali yo‘q.</p>';
  h += `<div class="in"><button class="btn" data-a="pickBank">${ic('upload')} Fayl qo‘shish</button><button class="btn" data-a="sample">${ic('sparkle')} Namuna</button></div><p class="mu s">Bir nechta fayl tanlash mumkin. Fan va mavzu <code>id</code>si bir xil bo‘lsa, mavzu yangilanadi, qolganlari saqlanadi.</p></div>
  <div class="card up" style="--i:2"><h2>${ic('target')}Kunlik maqsad</h2><p class="mu s">Kuniga nechta savol yechmoqchisan?</p>${segHtml('goal', S.set.goal, [[10, '10'], [20, '20'], [40, '40'], [60, '60'], [100, '100']])}</div>
  <div class="card up" style="--i:3"><h2>${ic('sliders')}Test</h2><p class="mu s" style="margin-bottom:0">Variantlar tartibi</p>${segHtml('sh', S.set.sh, [[1, 'Aralashtirilsin'], [0, 'Faylda berilgandek']])}<p class="mu s" style="margin-bottom:0">Imtihonda bitta savolga vaqt</p>${segHtml('sec', S.set.sec, [[30, '30 s'], [45, '45 s'], [60, '60 s'], [90, '90 s']])}</div>
  <div class="card up" style="--i:4"><h2>${ic('moon')}Ko‘rinish</h2>${segHtml('theme', S.set.theme, [['auto', 'Avto'], ['light', 'Yorug‘'], ['dark', 'Qorong‘i']])}</div>`;
  if (TB) h += `<div class="card up" style="--i:5"><h2>${ic('calendar')}Imtihon sanalari</h2><p class="mu s">Sana qo‘ysang, ilova ko‘rilmagan savollarni kunlarga bo‘lib “kuniga N ta” reja chiqaradi.</p><div class="grp">${TB.subjects.map(s => `<div class="row"><span class="t"><b>${esc(s.name)}</b></span><input type="date" value="${esc(S.ex[s.id] || '')}" data-c="exam" data-id="${esc(s.id)}" aria-label="${esc(s.name)} imtihon sanasi"></div>`).join('')}</div></div>`;
  h += `<div class="card up" style="--i:6"><h2>${ic('download')}Zaxira</h2><p class="mu s">Natijalar, xatolar va savol banki bitta faylda. Telefonni almashtirsang, shu fayl bilan tiklaysan.</p><div class="in"><button class="btn" data-a="export">${ic('download')} Zaxira olish</button><button class="btn" data-a="pickBack">${ic('upload')} Tiklash</button></div></div>
  <div class="card up" style="--i:7"><h2>${ic('sparkle')}Ilova</h2><p class="mu s">Versiya ${APP_VERSION}. Yangilanish chiqsa, ilova o‘zi xabar beradi.</p><button class="btn" data-a="checkUpdate">${ic('refresh')} Yangilanishni tekshirish</button></div>
  <div class="card up" style="--i:8"><h2>${ic('trash')}Tozalash</h2><div class="in"><button class="btn danger" data-a="clrHist">Natijalar tarixi</button><button class="btn danger" data-a="reset">Hammasini o‘chirish</button></div></div>`;
  return h;
}

const LOGO = '<svg viewBox="0 0 120 120" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#5b6cff"/><stop offset="1" stop-color="#8a4dff"/></linearGradient></defs><rect width="120" height="120" rx="30" fill="url(#lg)"/><rect x="30" y="22" width="60" height="76" rx="10" fill="#fff"/><rect x="40" y="34" width="40" height="6" rx="3" fill="#5b6cff"/><circle cx="45" cy="55" r="4" fill="#5b6cff"/><rect x="54" y="53" width="26" height="4" rx="2" fill="#5b6cff"/><circle cx="45" cy="70" r="3.5" fill="none" stroke="#8a4dff" stroke-width="2"/><rect x="54" y="68" width="26" height="4" rx="2" fill="#c9cffd"/><circle cx="45" cy="85" r="3.5" fill="none" stroke="#8a4dff" stroke-width="2"/><rect x="54" y="83" width="20" height="4" rx="2" fill="#c9cffd"/></svg>';
function authView() {
  const m = A.mode, fg = m === 'forgot', up = m === 'up' && SB.allowSignup, f = A.form;
  const title = fg ? 'Parolni tiklash' : 'Testlar', sub = fg ? 'Email bilan kirgan bo‘lsang, tiklash havolasini yuboramiz.' : up ? 'Yangi hisob och.' : 'Hisobingga kir.';
  return `<div class="authw up"><div class="alogo">${LOGO}</div><h1>${title}</h1><p class="mu" style="margin:6px 0 18px">${sub}</p>
  ${SB.allowSignup && !fg ? `<div class="seg" role="group"><button class="${up ? '' : 'on'}" data-a="authMode" data-m="in">Kirish</button><button class="${up ? 'on' : ''}" data-a="authMode" data-m="up">Ro‘yxatdan o‘tish</button></div>` : ''}
  <form id="${fg ? 'ff' : 'af'}" class="card" novalidate>
   ${up ? `<label class="fld"><span class="lb">Ism</span><input name="name" autocomplete="name" value="${esc(f.name)}" placeholder="Ismingiz"></label>` : ''}
   <label class="fld"><span class="lb">${fg ? 'Login yoki email' : 'Login yoki email'}</span><input name="email" type="text" inputmode="email" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" value="${esc(f.email)}" placeholder="ozod1 yoki email@manzil.uz"></label>
   ${fg ? '' : `<label class="fld"><span class="lb">Parol</span><span class="pw"><input name="password" type="password" autocomplete="${up ? 'new-password' : 'current-password'}" placeholder="${up ? 'Kamida 6 ta belgi' : 'Parol'}"><button type="button" class="eye" data-a="eye" aria-label="Parolni ko‘rsatish/yashirish">${ic('eye')}</button></span></label>`}
   ${A.err ? `<div class="note" role="alert">${ic('alert')}<span>${esc(A.err)}</span></div>` : ''}${A.info ? `<div class="note okn" role="status">${ic('ok')}<span>${esc(A.info)}</span></div>` : ''}
   <button class="big" type="submit" ${A.busy ? 'disabled' : ''}>${A.busy ? 'Kutilmoqda…' : fg ? 'Havola yuborish' : up ? 'Hisob ochish' : 'Kirish'}</button>
   ${fg ? `<button type="button" class="lnk" data-a="authMode" data-m="in">‹ Kirishga qaytish</button>` : m === 'in' ? `<button type="button" class="lnk" data-a="authMode" data-m="forgot">Parolni unutdingmi?</button>` : ''}
  </form><p class="mu s" style="text-align:center">${fg ? 'Xat kelmasa (Spam papkasini ham tekshir), ilova egasidan yangi parol so‘ra.' : SB.allowSignup ? 'Boshqa telefonda ham shu login bilan kirasan.' : 'Hisobni ilova egasi ochib beradi. Hisobing yo‘qmi? Egasiga yoz.'}</p></div>`;
}
function resetView() {
  return `<div class="authw up"><div class="alogo">${LOGO}</div><h1>Yangi parol</h1><p class="mu" style="margin:6px 0 18px">Yangi parolni kiriting va saqlang.</p>
  <form id="rf" class="card" novalidate>
   <label class="fld"><span class="lb">Yangi parol</span><span class="pw"><input name="pw" type="password" autocomplete="new-password" placeholder="Kamida 6 ta belgi"><button type="button" class="eye" data-a="eye" aria-label="Ko‘rsatish/yashirish">${ic('eye')}</button></span></label>
   <label class="fld"><span class="lb">Parolni takrorlang</span><input name="pw2" type="password" autocomplete="new-password" placeholder="Yana bir marta"></label>
   ${A.err ? `<div class="note" role="alert">${ic('alert')}<span>${esc(A.err)}</span></div>` : ''}
   <button class="big" type="submit" ${A.busy ? 'disabled' : ''}>${A.busy ? 'Kutilmoqda…' : 'Parolni saqlash'}</button></form></div>`;
}
function lockedView() {
  const p = A.profile || {}, why = p.blocked ? 'Hisobing egasi tomonidan bloklangan.' : p.pending ? 'Hisobing hali faollashtirilmagan.' : 'Obuna muddatingiz tugagan' + (p.expires_at ? ' (' + fmtDate(keyOf(new Date(p.expires_at))) + ')' : '') + '.';
  return `<div class="authw up"><div class="alogo" style="filter:grayscale(.8)">${LOGO}</div><h1>Hisob faol emas</h1><p class="mu" style="margin:6px 0 18px">${esc(why)}<br>Ilova egasi bilan bog‘lan.</p>
  <button class="big" data-a="syncNow">${ic('refresh')} Qayta tekshirish</button><button class="btn" style="margin-top:10px" data-a="logout">${ic('x')} Chiqish</button></div>`;
}
function acctCard() {
  if (!SB.configured || !SB.session()) return '';
  const p = A.profile || {}, nm = p.name || (SB.session().user.email || '').split('@')[0];
  return `<div class="card up acct"><div class="hd" style="display:flex;align-items:center;gap:12px"><span class="av" style="--h:250">${initials(nm)}</span><div style="min-width:0;flex:1"><b style="display:block;overflow-wrap:anywhere">${esc(nm)}</b><small style="overflow-wrap:anywhere">${esc(shownLogin(SB.session().user.email || ''))}</small></div>${isOwner() ? '<span class="chip static" style="color:var(--ac)">Owner</span>' : ''}</div>
  <p class="mu s" id="syncline" style="margin:12px 0 0">${syncLine()}</p>
  <div class="in"><button class="btn" data-a="syncNow">${ic('refresh')} Sinxronlash</button><button class="btn" data-a="pw">${ic('link')} Parol</button></div>
  ${A.pwOpen ? `<form id="pf" class="grp" novalidate><label class="fld"><span class="lb">Yangi parol</span><span class="pw"><input name="pw" type="password" autocomplete="new-password" placeholder="Kamida 6 ta belgi"><button type="button" class="eye" data-a="eye" aria-label="Ko‘rsatish">${ic('eye')}</button></span></label><button class="big" type="submit">Parolni saqlash</button></form>` : ''}
  ${isOwner() ? `<button class="big" style="margin-top:10px" data-a="users">${ic('layers')} Foydalanuvchilar</button><button class="big" style="margin-top:10px" data-a="cat">${ic('book')} Umumiy katalog</button>` : ''}
  <button class="btn danger" style="margin-top:10px" data-a="logout">Chiqish</button></div>`;
}
function usersView() {
  let h = `<header class="hdr up"><div style="display:flex;gap:12px;align-items:center"><button class="x" data-a="nav" data-v="set" aria-label="Orqaga">${ic('chevL')}</button><h1 style="font-size:26px">Foydalanuvchilar</h1></div></header>`;
  if (A.usersErr) h += `<div class="note">${ic('alert')}<span>${esc(A.usersErr)}</span></div>`;
  if (!A.users) return h + '<p class="mu">Yuklanmoqda…</p>';
  const P = A.pays || [], ms = new Date(); ms.setDate(1); ms.setHours(0, 0, 0, 0);
  const tot = P.reduce((a, x) => a + (+x.amount || 0), 0), mon = P.filter(x => new Date(x.created_at) >= ms).reduce((a, x) => a + (+x.amount || 0), 0);
  const act = A.users.filter(u => u.role !== 'owner' && isActive(u) && !u.pending).length, pend = A.users.filter(u => u.pending).length;
  h += `<button class="big up" data-a="newUser">${ic('upload')} Yangi foydalanuvchi qo‘shish</button>
  <div class="kpis"><div class="kpi up" style="--i:1"><b>${money(mon)}</b><small>Shu oy daromad (so‘m)</small></div><div class="kpi up" style="--i:2"><b>${money(tot)}</b><small>Jami daromad (so‘m)</small></div><div class="kpi up" style="--i:3"><b>${act}</b><small>Faol obunachilar</small></div><div class="kpi up" style="--i:4"><b>${P.length}</b><small>To‘lovlar soni</small></div></div>`;
  if (pend) h += `<div class="note">${ic('alert')}<span>${pend} ta hisob faollashtirilmagan (o‘zi ro‘yxatdan o‘tgan). “Obuna” bersang ochiladi, keraksiz bo‘lsa o‘chir.</span></div>`;
  A.users.forEach((u, i) => {
    const st = userStatus(u), hue = [...String(u.user_id)].reduce((a, c) => (a * 31 + c.charCodeAt(0)) % 360, 7);
    h += `<div class="card up" style="--i:${i}"><div style="display:flex;align-items:center;gap:12px"><span class="av" style="--h:${hue}">${initials(u.name || u.email)}</span><div style="min-width:0;flex:1"><b style="display:block;overflow-wrap:anywhere">${esc(u.name || '—')}</b><small style="display:block;overflow-wrap:anywhere">${esc(shownLogin(u.email))}</small><span class="chip static" style="margin-top:6px">${esc(st)}</span></div></div>
    ${u.role === 'owner' ? '' : `<div class="in"><button class="btn s" data-a="uGrant" data-id="${esc(u.user_id)}">Obuna</button><button class="btn s" data-a="uPw" data-id="${esc(u.user_id)}">Parol</button><button class="btn s" data-a="uBlock" data-id="${esc(u.user_id)}">${u.blocked ? 'Ochish' : 'Bloklash'}</button><button class="btn s danger fix" data-a="uDel" data-id="${esc(u.user_id)}" aria-label="O‘chirish">${ic('trash')}</button></div>`}</div>`;
  });
  return h;
}

function view() {
  switch (V.v) { case 'cat': return catView(); case 'auth': return authView(); case 'reset': return resetView(); case 'locked': return lockedView(); case 'users': return usersView(); case 'quiz': return quizView(); case 'res': return resView(); case 'subj': return subjView(); case 'stat': return statView(); case 'set': return setView(); case 'flag': return flagView(); default: return homeView(); }
}
// ───────────── yangi versiya va kirish animatsiyasi ─────────────
let UPD = null, UPD_LATER = false, RELOADING = false, SWREG = null;
function paintUpdate() {
  const e = $('#upd'); if (!e) return;
  if (!UPD || UPD_LATER || V.v === 'quiz') { e.classList.remove('on'); return; }
  e.innerHTML = `<span class="ui">${ic('sparkle')}</span><span class="ut"><b>Yangi versiya tayyor</b><small>${UPD.version ? 'Versiya ' + esc(UPD.version) : 'Bir necha soniya oladi'}</small></span><button class="ub" data-a="applyUpdate">Yangilash</button><button class="ux" data-a="updLater" aria-label="Keyinroq">${ic('x')}</button>`;
  e.classList.add('on');
}
function offerUpdate(reg) {
  if (!reg.waiting) return;
  UPD = UPD || { reg, version: '' }; UPD.reg = reg; paintUpdate();
  try { reg.waiting.postMessage({ type: 'GET_VERSION' }); } catch (e) { /* ixtiyoriy */ }
}
async function setupSW() {
  if (!('serviceWorker' in navigator) || location.protocol === 'file:') return;
  navigator.serviceWorker.addEventListener('message', ev => { if (ev.data && ev.data.type === 'VERSION' && UPD) { UPD.version = ev.data.version; paintUpdate(); } });
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (UPD && UPD.applying && !RELOADING) { RELOADING = true; location.reload(); } });
  try {
    const reg = await navigator.serviceWorker.register('sw.js'); SWREG = reg;
    if (reg.waiting && navigator.serviceWorker.controller) offerUpdate(reg);
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(reg); }); });
    const chk = () => reg.update().catch(() => {});
    document.addEventListener('visibilitychange', () => { if (!document.hidden) chk(); });
    setInterval(chk, 30 * 60 * 1000);
  } catch (e) { /* oflayn yoki bloklangan */ }
}
function applyUpdate() {
  if (!UPD) return; UPD.applying = true;
  const w = UPD.reg && UPD.reg.waiting; if (w) w.postMessage({ type: 'SKIP_WAITING' }); else location.reload();
  setTimeout(() => { if (!RELOADING) { RELOADING = true; location.reload(); } }, 4000);
}
async function checkUpdate() {
  if (!SWREG) { toast('Yangilanishni tekshirib bo‘lmadi (oflayn rejim)'); return; }
  toast('Tekshirilmoqda…');
  try { await SWREG.update(); } catch (e) { toast('Internet yo‘q'); return; }
  await new Promise(r => setTimeout(r, 1500));
  if (SWREG.waiting) offerUpdate(SWREG); else if (SWREG.installing) toast('Yangi versiya yuklanmoqda…'); else toast('Eng so‘nggi versiya (v' + APP_VERSION + ')');
}
function hideSplash() {
  const e = $('#splash'); if (!e) return;
  const wait = Math.max(0, (reduced() ? 500 : 1900) - performance.now());
  setTimeout(() => { document.body.classList.remove('splashing'); e.classList.add('out'); V.anim = true; draw(true); setTimeout(() => e.remove(), 700); }, wait);
}
function draw(keepScroll = true) {
  const sy = window.scrollY, anim = V.anim;
  document.body.classList.toggle('noav', ['quiz', 'auth', 'locked', 'reset'].includes(V.v));
  const app = $('#app'); app.classList.toggle('anim', anim);
  app.innerHTML = view();
  const tab = V.v === 'stat' ? 'stat' : ['set', 'users', 'cat'].includes(V.v) ? 'set' : 'home';
  $('#nav').innerHTML = [['home', 'book', 'Fanlar'], ['stat', 'chart', 'Statistika'], ['set', 'sliders', 'Sozlamalar']].map(([v, i, n]) => `<button data-a="nav" data-v="${v}" class="${tab === v ? 'on' : ''}" ${tab === v ? 'aria-current="page"' : ''}>${ic(i)}${n}</button>`).join('');
  V.anim = false;
  if (keepScroll) window.scrollTo(0, sy);
  if (V.v === 'res' && V.fresh) { V.fresh = false; celebrate(); }
  paintUpdate();
}
function celebrate() {
  if (!R) return; const p = pct(R.rec.ok, R.rec.n), e = $('#cnt');
  if (!e) return;
  if (reduced()) { e.textContent = p + '%'; R.shown = true; return; }
  const t0 = performance.now(), D = 900;
  (function step(t) { const k = Math.min(1, (t - t0) / D), v = Math.round(p * (1 - Math.pow(1 - k, 3))); const el = $('#cnt'); if (el) el.textContent = v + '%'; if (k < 1) requestAnimationFrame(step); else if (R) R.shown = true; })(t0);
  if (p >= 80) { setTimeout(confetti, 350); buzz([20, 40, 20]); }
}
function confetti() {
  if (reduced()) return;
  const c = document.createElement('canvas'); c.className = 'confetti'; document.body.appendChild(c);
  const dpr = Math.min(2, devicePixelRatio || 1), W = c.width = innerWidth * dpr, H = c.height = innerHeight * dpr, x = c.getContext('2d');
  const cols = ['#5b6cff', '#8a4dff', '#12b76a', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];
  const ps = Array.from({ length: 110 }, () => ({ x: W / 2 + (Math.random() - .5) * W * .3, y: H * .35, vx: (Math.random() - .5) * 14 * dpr, vy: (-Math.random() * 15 - 5) * dpr, s: (5 + Math.random() * 6) * dpr, r: Math.random() * 6, vr: (Math.random() - .5) * .4, c: cols[Math.floor(Math.random() * cols.length)] }));
  const t0 = performance.now();
  (function f(t) {
    const el = t - t0; x.clearRect(0, 0, W, H);
    ps.forEach(p => { p.vy += .45 * dpr; p.x += p.vx; p.y += p.vy; p.r += p.vr; x.save(); x.globalAlpha = Math.max(0, 1 - el / 2600); x.translate(p.x, p.y); x.rotate(p.r); x.fillStyle = p.c; x.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .6); x.restore(); });
    if (el < 2600) requestAnimationFrame(f); else c.remove();
  })(t0);
}

// ───────────── import / eksport ─────────────
async function importTexts(files) {
  const out = [], touched = new Set(); let cur = UB, added = 0, ok = 0, bad = 0;
  for (const f of files) {
    if (f.big) { out.push(`${f.name}: fayl juda katta (25 MB dan oshmasin)`); bad++; continue; }
    let d; try { d = JSON.parse(f.text); } catch (e) { out.push(`${f.name}: JSON emas`); bad++; continue; }
    const c = checkBank(d);
    if (c.err.length) { out.push(`${f.name}: ${c.err.slice(0, 3).join('; ')}${c.err.length > 3 ? ` … (+${c.err.length - 3})` : ''}`); bad++; continue; }
    const m = mergeBank(cur, d), c2 = checkBank(m);
    if (c2.err.length) { out.push(`${f.name}: ${c2.err[0]}`); bad++; continue; }
    cur = m; ok++; added += d.subjects.reduce((a, s) => a + subjCount(s), 0); d.subjects.forEach(x => touched.add(x.id));
    if (c.warn.length) out.push(`${f.name}: ${c.warn.length} ta ogohlantirish (${c.warn[0]})`);
  }
  if (ok) {
    try { await idbSet(cur); } catch (e) { setMsg('Qurilma xotirasiga yozib bo‘lmadi', false); V.anim = false; draw(); return; }
    indexBank(cur); markDirty([...touched]); scheduleSync(); try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) { /* ixtiyoriy */ }
    out.unshift(`${ok} ta fayl, ${added} ta savol yuklandi (jami ${qCount()})`);
  }
  setMsg(out.join(' · ') || 'Fayl tanlanmadi', ok > 0 && !bad);
  V.anim = true; draw();
}
async function pickedFiles(inp) {
  const fs = [...inp.files]; inp.value = ''; if (!fs.length) return;
  const files = [];
  for (const f of fs) { if (f.size > 25e6) { files.push({ name: f.name, big: true }); continue; } files.push({ name: f.name, text: await f.text() }); }
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
const exportBackup = () => { download('testlar-zaxira-' + today() + '.json', JSON.stringify({ app: 'testlar-app', v: 1, state: S, bank: UB })); setMsg('Zaxira fayli yuklab olindi', true); V.anim = false; draw(); };
async function restoreBackup(inp) {
  const f = inp.files[0]; inp.value = ''; if (!f) return;
  try {
    const o = JSON.parse(await f.text());
    if (!o || o.app !== 'testlar-app' || !o.state) throw new Error('Bu zaxira fayli emas');
    if (o.bank) { const c = checkBank(o.bank); if (c.err.length) throw new Error('Zaxiradagi bank buzilgan: ' + c.err[0]); }
    if (!(await ask('Zaxiradan tiklaymizmi?', 'Hozirgi natijalar va bank zaxiradagi bilan almashtiriladi.', 'Tiklash', true))) return;
    S = normState(o.state); save(); applyTheme();
    if (o.bank) { const before = UB ? UB.subjects.map(x => x.id) : [], now = o.bank.subjects.map(x => x.id); await idbSet(o.bank); indexBank(o.bank); before.filter(i => !now.includes(i)).forEach(i => markDeleted(i)); markDirty(now); } else { (UB ? UB.subjects.map(x => x.id) : []).forEach(i => markDeleted(i)); await idbDel(); indexBank(null); }
    setMsg('Zaxira tiklandi', true);
  } catch (e) { setMsg('Tiklab bo‘lmadi: ' + (e && e.message || e), false); }
  V.anim = true; draw();
}
async function deleteSubject(id) {
  const s = findSubj(id); if (!s || s.cat || !(await ask(`“${s.name}” o‘chirilsinmi?`, `Fan va undagi ${subjCount(s)} ta savol qurilmadan o‘chadi. Natijalar tarixi qoladi.`, 'O‘chirish', true))) return;
  const nb = JSON.parse(JSON.stringify(UB)); nb.subjects = nb.subjects.filter(x => x.id !== id);
  try { nb.subjects.length ? await idbSet(nb) : await idbDel(); } catch (e) { setMsg('O‘chirib bo‘lmadi', false); draw(); return; }
  indexBank(nb.subjects.length ? nb : null); delete S.ex[id]; markDeleted(id); save(); if (V.sid === id) V.sid = ''; setMsg('Fan o‘chirildi', true); V.anim = false; draw();
}

// ───────────── hodisalar ─────────────
async function act(a, d, el) {
  switch (a) {
    case 'authMode': { const f = $('#af') || $('#ff'); if (f) { const fd = new FormData(f); A.form = { name: String(fd.get('name') || ''), email: String(fd.get('email') || '') }; } A.mode = d.m; A.err = ''; A.info = ''; draw(false); break; }
    case 'eye': { const i = el.closest('.pw').querySelector('input'); i.type = i.type === 'password' ? 'text' : 'password'; break; }
    case 'syncNow': if (!online()) { toast('Internet yo‘q'); break; } toast('Sinxronlanmoqda…'); await syncAll(); toast(A.sync === 'ok' ? 'Sinxronlandi' : 'Sinxronlanmadi'); break;
    case 'pw': A.pwOpen = !A.pwOpen; V.anim = false; draw(); break;
    case 'logout': logout(); break;
    case 'users': V.v = 'users'; V.anim = true; draw(false); window.scrollTo(0, 0); loadUsers(); break;
    case 'uBlock': { const u = (A.users || []).find(x => x.user_id === d.id); if (u) ownerSet(d.id, { blocked: !u.blocked }); break; }
    case 'cat': V.v = 'cat'; V.anim = true; setMsg(null); draw(false); window.scrollTo(0, 0); break;
    case 'catPick': $('#fcat').click(); break;
    case 'catEdit': catEdit(d.id); break;
    case 'catDel': catDel(d.id); break;
    case 'catTopicDel': catTopicDel(d.sid, d.tid); break;
    case 'applyUpdate': applyUpdate(); break;
    case 'updLater': UPD_LATER = true; paintUpdate(); break;
    case 'checkUpdate': checkUpdate(); break;
    case 'newUser': newUser(); break;
    case 'uGrant': grantUser(d.id); break;
    case 'uPw': resetUserPw(d.id); break;
    case 'gen': { const inp = el.closest('.pw').querySelector('input'); inp.value = genPw(); break; }
    case 'sfChip': { const wrap = el.parentElement; wrap.querySelector('input[type=hidden]').value = d.val; wrap.querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === el)); break; }
    case 'copyCred': toast((await copyText($('#credtxt').textContent)) ? 'Nusxalandi' : 'Nusxalab bo‘lmadi, qo‘lda belgilab ol'); break;
    case 'uDel': ownerDelete(d.id); break;
    case 'sheetOk': closeSheet(true); break;
    case 'sheetNo': closeSheet(false); break;
    case 'nav': V.v = d.v; if (d.v === 'home') V.sid = ''; if (d.v !== 'set') setMsg(null); V.anim = true; draw(false); window.scrollTo(0, 0); break;
    case 'subj': V.sid = d.id; V.v = 'subj'; V.sel = {}; setMsg(null); V.anim = true; draw(false); window.scrollTo(0, 0); break;
    case 'setN': V.n = +d.n; draw(); break;
    case 'setMo': V.mo = d.mo; draw(); break;
    case 'set': S.set[d.key] = d.key === 'theme' ? d.val : +d.val; save(); if (d.key === 'theme') applyTheme(); draw(); break;
    case 'start': begin(cfgOf(d.kind, d.id, d.label)); break;
    case 'startSel': { const ids = Object.keys(V.sel).filter(i => V.sel[i] && findTopic(i)); begin(cfgOf('c', '', 'Tanlangan mavzular', ids)); break; }
    case 'selAll': { const s = findSubj(V.sid), all = s.topics.every(t => V.sel[t.id]); V.sel = {}; if (!all) s.topics.forEach(t => { V.sel[t.id] = 1; }); draw(); break; }
    case 'plan': { const p = plan(d.id), s = findSubj(d.id); if (!p || p.past || !p.quota) { toast('Bugun reja yo‘q'); break; } begin({ kind: 'u', id: d.id, label: s.name + ' · reja', n: p.quota, mo: V.mo }); break; }
    case 'ans': answer(+d.k); break;
    case 'go': go(+d.d); break;
    case 'jump': if (Q) { Q.i = +d.i; V.anim = true; draw(); window.scrollTo(0, 0); } break;
    case 'rev': if (Q) { Q.rv[Q.ids[Q.i]] = 1; V.anim = false; draw(false); } break;
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
    case 'clrHist': if (await ask('Natijalar tarixi o‘chirilsinmi?', 'Statistika tozalanadi. Xatolar banki va savollar qoladi.', 'O‘chirish', true)) { S.h = []; S.hc = Date.now(); save(); setMsg('Tarix tozalandi', true); V.anim = false; draw(); } break;
    case 'reset': if (await ask('Hammasi o‘chirilsinmi?', 'Savol banki, natijalar va sozlamalar butunlay o‘chadi' + (cloudOn() ? ', bulutdagi nusxa ham' : '') + '. Avval zaxira olgan bo‘lsang yaxshi.', 'Hammasini o‘chirish', true)) {
      if (cloudOn()) { try { const U = encodeURIComponent(SB.session().user.id); await SB.rest('quiz_banks?user_id=eq.' + U, { method: 'DELETE' }); await SB.rest('app_state?user_id=eq.' + U, { method: 'DELETE' }); } catch (e) { toast('Bulutdagi nusxani o‘chirib bo‘lmadi: ' + uzErr(e)); break; } }
      lsSet(KD, []); lsSet(KX, []); lsSet(KS, []); S = normState(null); persist(); applyTheme(); try { await idbDel(); await idbDel('catalog'); } catch (e) { /* bo‘sh */ } CBRAW = []; CB = []; indexBank(null);
      V = { v: 'home', sid: '', n: 20, mo: 'm', sel: {}, msg: null, anim: true, fresh: false }; draw(); } break;
  }
}
document.addEventListener('click', e => { const b = e.target.closest('[data-a]'); if (b && !b.disabled) act(b.dataset.a, b.dataset, b); });
document.addEventListener('submit', e => {
  e.preventDefault(); const id = e.target.id;
  if (id === 'af') doAuth(e.target); else if (id === 'ff') doForgot(e.target); else if (id === 'rf') doReset(e.target); else if (id === 'pf') changePw(e.target);
  else if (id === 'sf') { const er = sfValidate(e.target); if (er) { $('#sferr').textContent = er; return; } closeSheet(Object.fromEntries(new FormData(e.target))); }
});
window.addEventListener('online', () => { syncAll(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && cloudOn() && Date.now() - A.last > 60000) syncAll(); });
document.addEventListener('change', e => {
  const t = e.target;
  if (t.id === 'fbank') return pickedFiles(t);
  if (t.id === 'fback') return restoreBackup(t);
  if (t.id === 'fcat') return catUpload(t);
  if (t.dataset.c === 'sel') { V.sel[t.dataset.id] = t.checked; draw(); }
  if (t.dataset.c === 'exam') { t.value ? S.ex[t.dataset.id] = t.value : delete S.ex[t.dataset.id]; save(); toast(t.value ? 'Sana saqlandi' : 'Sana o‘chirildi'); }
});
document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && sheetRes) { closeSheet(false); return; }
  if (sheetRes || V.v !== 'quiz' || !Q || e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase(), i = '1234'.indexOf(k) >= 0 ? '1234'.indexOf(k) : 'abcd'.indexOf(k);
  if (i >= 0 && k.length === 1) { answer(i); return; }
  if (k === 'arrowright' || k === 'enter') { const b = $('.qbar [data-a="go"][data-d="1"]'); if (b && !b.disabled) go(1); }
  if (k === 'arrowleft') go(-1);
});

// ───────────── ishga tushirish ─────────────
(async () => {
  applyTheme();
  const rec = SB.recovery();
  if (rec && rec.ok) V.v = 'reset';
  else if (rec && rec.error) { A.err = 'Havola eskirgan yoki yaroqsiz. Tiklashni qaytadan so‘ra.'; A.mode = 'forgot'; V.v = 'auth'; }
  else if (SB.configured && !SB.session()) V.v = 'auth';
  else if (SB.configured && A.profile && !isActive(A.profile)) V.v = 'locked';
  draw();
  try { const d = await idbGet(); if (d && !checkBank(d).err.length) indexBank(d); } catch (e) { /* bank yo‘q */ }
  try { const c = await idbGet('catalog'); if (c && Array.isArray(c.raw) && cloudOn()) setCatalog(c.raw); } catch (e) { /* katalog keshi yo‘q */ }
  V.anim = true; draw();
  SB.onOut(() => { A.profile = null; V.v = 'auth'; V.anim = true; draw(); });
  setupSW(); hideSplash();
  if (cloudOn() && V.v !== 'reset') syncAll();
})();
})();
