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
const store = s => { sess = s; try { s ? localStorage.setItem(SK, JSON.stringify(s)) : localStorage.removeItem(SK); } catch (e) { /* xotira yopiq */ } };

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
async function signUp(email, password, name) {
  const j = await call('/auth/v1/signup', { method: 'POST', body: { email, password, data: { name } } });
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
async function changePassword(pw) { await api('/auth/v1/user', { method: 'PUT', body: { password: pw } }); }
async function signOut() { const t = sess && sess.access_token; store(null); if (t) { try { await call('/auth/v1/logout', { method: 'POST', token: t }); } catch (e) { /* offline bo‘lsa ham mahalliy chiqiladi */ } } }

window.SB = { configured, session: () => sess, signIn, signUp, signOut, rest, rpc, changePassword, refresh, onOut: f => outCbs.push(f) };
})();
