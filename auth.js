/* Supabase Auth + PostgREST uchun kichik mijoz (kutubxonasiz, offline-do‘st).
   Sessiya localStorage’da; token muddati tugasa o‘zi yangilanadi. */
(() => {
'use strict';
const C = window.TESTLAR_CONFIG || {};
const SK = 'testlar:session:v1';
const configured = !!(C.url && C.key);
let sess = null, refreshing = null;
try { sess = JSON.parse(localStorage.getItem(SK)); } catch (e) { sess = null; }
const outCbs = [];
let recovery = null;
const store = s => { sess = s; try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch (e) { /* xotira yopiq */ } };

// Parolni tiklash havolasidan kelgan bo‘lsa (…#access_token=…&type=recovery), sessiyani qabul qilamiz.
(() => {
  const h = location.hash || ''; if (!/[#&](access_token|error)=/.test(h)) return;
  const q = new URLSearchParams(h.replace(/^#/, ''));
  if (q.get('error')) recovery = { error: q.get('error_description') || q.get('error') };
  else if (q.get('type') === 'recovery' && q.get('access_token')) {
    store({ access_token: q.get('access_token'), refresh_token: q.get('refresh_token') || '', expires_at: +q.get('expires_at') || Math.floor(Date.now() / 1000) + (+q.get('expires_in') || 3600), user: { id: '', email: '' } });
    recovery = { ok: true };
  } else return;
  try { history.replaceState(null, '', location.pathname + location.search); } catch (e) { /* ixtiyoriy */ }
})();

async function call(path, o = {}) {
  let r;
  try {
    r = await fetch(C.url + path, { method: o.method || 'GET', headers: Object.assign({ apikey: C.key, 'content-type': 'application/json' }, o.token ? { authorization: 'Bearer ' + o.token } : {}, o.headers || {}), body: o.body !== undefined ? JSON.stringify(o.body) : undefined });
  } catch (e) { const er = new Error('network'); er.net = true; throw er; }
  const t = await r.text(); let j = null; try { j = t ? JSON.parse(t) : null; } catch (e) { j = t; }
  if (!r.ok) {
    const er = new Error((j && (j.msg || j.error_description || j.message || j.error)) || ('HTTP ' + r.status));
    er.status = r.status; er.code = j && (j.error_code || j.code); throw er;
  }
  return j;
}
const fromTok = j => ({ access_token: j.access_token, refresh_token: j.refresh_token, expires_at: j.expires_at || Math.floor(Date.now() / 1000) + (j.expires_in || 3600), user: { id: j.user.id, email: j.user.email } });

async function signIn(email, password) { const j = await call('/auth/v1/token?grant_type=password', { method: 'POST', body: { email, password } }); store(fromTok(j)); return sess; }
async function signUp(email, password, name, code) {
  const j = await call('/auth/v1/signup', { method: 'POST', body: { email, password, data: { name, code: code || '' } } });
  if (j && j.access_token) { store(fromTok(j)); return { session: sess }; }
  return { confirm: true };
}
async function refresh() {
  if (!sess) throw new Error('no-session');
  if (refreshing) return refreshing;
  refreshing = (async () => {
    try { const j = await call('/auth/v1/token?grant_type=refresh_token', { method: 'POST', body: { refresh_token: sess.refresh_token } }); store(fromTok(j)); }
    catch (e) { if (!e.net && (e.status === 400 || e.status === 401 || e.status === 403)) { store(null); outCbs.forEach(f => f()); } throw e; }
    finally { refreshing = null; }
  })();
  return refreshing;
}
async function token() { if (!sess) throw new Error('no-session'); if (sess.expires_at - 45 < Date.now() / 1000) await refresh(); return sess.access_token; }
async function api(path, o = {}) {
  let tk = await token();
  try { return await call(path, Object.assign({}, o, { token: tk })); }
  catch (e) { if (e.status === 401 && !e.net) { await refresh(); return call(path, Object.assign({}, o, { token: sess.access_token })); } throw e; }
}
const rest = (path, o) => api('/rest/v1/' + path, o);
const rpc = (fn, args) => api('/rest/v1/rpc/' + fn, { method: 'POST', body: args || {} });
const rpcPub = (fn, args) => call('/rest/v1/rpc/' + fn, { method: 'POST', body: args || {} });   // kirishdan oldin (anon)
async function recover(email, redirectTo) { await call('/auth/v1/recover?redirect_to=' + encodeURIComponent(redirectTo), { method: 'POST', body: { email } }); }
async function loadUser() { const j = await api('/auth/v1/user'); sess.user = { id: j.id, email: j.email }; store(sess); return sess; }
async function fn(name, body) {
  const tk = await token(); let r;
  try { r = await fetch(C.url + '/functions/v1/' + name, { method: 'POST', headers: { apikey: C.key, 'content-type': 'application/json', authorization: 'Bearer ' + tk }, body: JSON.stringify(body) }); }
  catch (e) { const er = new Error('network'); er.net = true; throw er; }
  const j = await r.json().catch(() => null);
  if (!r.ok) { const er = new Error((j && (j.error || j.message)) || ('HTTP ' + r.status)); er.uz = true; er.status = r.status; throw er; }
  return j;
}
/** Xom so‘rov (Storage: ikkilik fayllar yuklash/yuklab olish uchun) — tokenni o‘zi qo‘yadi, Response qaytaradi. */
async function raw(path, o = {}) {
  const tk = await token();
  try { return await fetch(C.url + path, { method: o.method || 'GET', headers: Object.assign({ apikey: C.key, authorization: 'Bearer ' + tk }, o.headers || {}), body: o.body }); }
  catch (e) { const er = new Error('network'); er.net = true; throw er; }
}
async function changePassword(pw) { await api('/auth/v1/user', { method: 'PUT', body: { password: pw } }); }
async function signOut() { const t = sess && sess.access_token; store(null); if (t) { try { await call('/auth/v1/logout', { method: 'POST', token: t }); } catch (e) { /* offline bo‘lsa ham mahalliy chiqiladi */ } } }

window.SB = { configured, allowSignup: !!C.allowSignup, session: () => sess, signIn, signUp, signOut, rest, rpc, rpcPub, fn, raw, recover, loadUser, changePassword, refresh, recovery: () => recovery, clearRecovery: () => { recovery = null; }, onOut: f => outCbs.push(f) };
})();
