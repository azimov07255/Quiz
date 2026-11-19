/* IELTS · BY AZIMOV — ishga tushirish: kirish (Testlar bilan umumiy hisob), ruxsat tekshiruvi, yo‘naltirish, hodisalar. */
(() => {
'use strict';
const IE = window.IE, { esc, $, $$ } = IE, A = IE.act, V = IE.V, D = IE.D, app = $('#app');
const LDOM = (window.TESTLAR_CONFIG && window.TESTLAR_CONFIG.loginDomain) || 'testlar.internal';
const toEmail = v => { v = String(v || '').trim().toLowerCase(); return v.includes('@') ? v : v + '@' + LDOM; };
IE.uzErr = e => {
  if (e && e.uz) return e.message;
  if (e && e.net) return 'Internetga ulanib bo‘lmadi. Ulanishni tekshirib, qayta urining.';
  const m = String(e && e.message || e).toLowerCase(), c = (e && e.code) || '';
  if (c === 'invalid_credentials' || m.includes('invalid login')) return 'Login yoki parol noto‘g‘ri.';
  if (c === 'weak_password' || m.includes('at least') || m.includes('weak')) return 'Parol kamida 6 ta belgidan iborat bo‘lsin.';
  if (c === 'same_password') return 'Yangi parol eskisidan farq qilsin.';
  if (c === 'over_request_rate_limit' || (e && e.status === 429)) return 'Juda ko‘p urinish. Birozdan keyin qayta urining.';
  return 'Xatolik: ' + String(e && e.message || e).slice(0, 120);
};

/* ---------- ma’lumotlar va profil ---------- */
async function loadData() {
  const f = n => fetch('data/' + n + '.json').then(r => { if (!r.ok) throw new Error(n); return r.json(); });
  [D.reading, D.vocab, D.strategy, D.prompts, D.listening, D.articles, D.podcasts, D.qt] = await Promise.all([f('reading'), f('vocab8'), f('strategy'), f('prompts'), f('listening'), f('articles'), f('podcasts').catch(() => ({ shows: [], items: [] })), f('qtypes').catch(() => null)]);
  await IE.loadCam();
}
const KP = 'ielts:profile';
async function loadProfile() {
  const uid = SB.session().user.id; let p = null;
  try { const r = await SB.rest('profiles?select=*&user_id=eq.' + encodeURIComponent(uid)); p = r[0] || null; if (p) IE.lsSet(KP, p); }
  catch (e) { if (!e.net && e.status !== 0 && !String(e.message).includes('fetch')) { if (!SB.session()) throw e; } const c = IE.lsGet(KP, null); if (c && c.user_id === uid) p = c; else if (!e.net) throw e; else p = null; }
  D.profile = p;
  const now = Date.now();
  const active = !!p && !p.blocked && (p.role === 'owner' || p.lifetime || !p.expires_at || new Date(p.expires_at).getTime() > now);
  D.access = active && (p.role === 'owner' || (p.groups || []).includes('ielts'));
  D.reason = !p ? 'noprofile' : !active ? 'inactive' : 'nogroup';
}

/* ---------- kirish / ruxsat yo‘q ekranlari ---------- */
function showAuth(err) {
  IE.clearTimers();
  app.className = 'anim';
  app.innerHTML = '<div class="auth"><div class="logo">' + IE.bd('check', 'A') + '<h1>IELTS</h1><p>tayyorgarlik · by azimov</p></div>' +
    '<form id="af" autocomplete="on"><div class="fld"><label>Login</label><input id="lu" autocomplete="username" autocapitalize="off" spellcheck="false" placeholder="masalan, abdulaziz1" required></div>' +
    '<div class="fld"><label>Parol</label><input id="lp" type="password" autocomplete="current-password" placeholder="••••••" required></div>' +
    '<button class="btn block" type="submit" id="lb">Kirish</button><div class="err" id="er">' + esc(err || '') + '</div></form>' +
    '<p class="c" style="margin-top:18px;opacity:.85;font-size:13px">Testlar ilovasidagi login va parol bilan kiring.</p></div>';
  $('#af').onsubmit = async e => {
    e.preventDefault(); const b = $('#lb'), er = $('#er'); er.textContent = ''; b.disabled = true; b.textContent = 'Kirilmoqda…';
    try { await SB.signIn(toEmail($('#lu').value), $('#lp').value); await boot(); }
    catch (x) { er.textContent = IE.uzErr(x); b.disabled = false; b.textContent = 'Kirish'; }
  };
}
function showLock() {
  const why = D.reason === 'inactive' ? 'Hisobingiz muddati tugagan yoki o‘chirilgan.' : D.reason === 'noprofile' ? 'Profil topilmadi. Internetga ulanib, qayta urining.' : 'IELTS bo‘limi hisobingizda hali yoqilmagan.';
  app.className = 'anim';
  app.innerHTML = '<div class="auth"><div class="logo">' + IE.bd('lock', 'A') + '<h1>IELTS</h1><p>tayyorgarlik · by azimov</p></div><div class="card lockc" style="color:var(--tx)"><h2 style="font-size:20px">Ruxsat kerak</h2><p class="mu">' + why + '<br>Ilova egasiga yozing — u hisobingizga IELTS bo‘limini ochib beradi.</p>' +
    '<button class="btn block" id="rf">Qayta tekshirish</button><a class="btn ghost block" href="../">Testlar ilovasiga qaytish</a><button class="btn ghost block" id="lo">Chiqish</button></div></div>';
  $('#rf').onclick = () => boot();
  $('#lo').onclick = async () => { await SB.signOut(); location.hash = ''; location.reload(); };
}

/* ---------- yo‘naltirish ---------- */
IE.draw = (anim = true) => {
  const y = window.scrollY; IE.clearTimers(); document.querySelectorAll('audio').forEach(a => { try { a.pause(); } catch (e) { /* */ } });
  const r = (location.hash.replace(/^#\/?/, '') || 'home').split('/'), fn = IE.routes[r[0]] || IE.routes.home; let o;
  try { o = fn(r.slice(1)); } catch (e) { console.error(e); o = { h: '<div class="empty" style="padding-top:30vh">Xatolik: ' + esc(e.message) + '<br><button class="btn sm" data-go="home" style="margin-top:12px">Bosh sahifa</button></div>', sub: true }; }
  document.body.classList.toggle('chatpage', r[0] === 'chat'); document.body.classList.toggle('tw', (r[0] === 'reading' || r[0] === 'listening') && r[2] === 'run'); if (r[0] !== 'chat') document.body.classList.remove('kb');
  app.className = anim ? 'anim' : ''; app.innerHTML = o.h; if (o.mount) o.mount(); if (IE.paintUpd) IE.paintUpd(); window.scrollTo(0, r[0] === 'chat' ? 0 : y);
};
IE.curRoute = (location.hash.replace(/^#\/?/, '') || 'home'); IE.prevRoute = '';
IE.stk = [IE.curRoute]; IE.scr = {};
{ let st = 0; window.addEventListener('scroll', () => { if (st) return; st = setTimeout(() => { st = 0; if (!document.body.classList.contains('chatpage')) IE.scr[IE.curRoute] = window.scrollY; }, 120); }, { passive: true }); }
window.addEventListener('hashchange', () => {
  IE.prevRoute = IE.curRoute; IE.curRoute = (location.hash.replace(/^#\/?/, '') || 'home'); if (IE.toolUse) IE.toolUse(IE.curRoute.split('/')[0]);
  /* orqaga (swipe/back) o‘tishmi? — shunda animatsiyasiz va avvalgi scroll joyi bilan chiziladi */
  const back = IE.stk.length > 1 && IE.stk[IE.stk.length - 2] === IE.curRoute; if (back) IE.stk.pop(); else { IE.stk.push(IE.curRoute); if (IE.stk.length > 60) IE.stk.shift(); } IE.wasBack = back;
  IE.rec.cancel(); IE.closeSheet(); { const sn = document.getElementById('syncnow'); if (sn) sn.remove(); } V.s1 = null; V.s2 = null; V.fc = null; V.w = null;
  if (!D.access) return;
  IE.draw(!back); window.scrollTo(0, back ? (IE.scr[IE.curRoute] || 0) : 0);
});
IE.onSynced = () => { const r = (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0]; if (['home', 'practice', 'tools', 'me', 'vocab'].includes(r) && !$('#sheet')) IE.draw(false); };

/* ---------- hodisalar ---------- */
document.addEventListener('click', e => {
  const t = e.target.closest('[data-a],[data-go]'); if (!t) return;
  if (t.dataset.a) { const f = A[t.dataset.a]; if (f) { if (t.tagName === 'A') e.preventDefault(); f(t, e); } return; }
  IE.go(t.dataset.go);
});
const onIn = e => {
  const el = e.target, k = el.dataset && el.dataset.in; if (!k) return;
  const m = { fill: IE.inp, sel: IE.inp, ed: IE.edInput, notes: IE.inpNotes, vs: IE.vsearch, pf: IE.pf, lseek: IE.lseek, afollow: IE.afollow, dct: IE.dct, bks: IE.bks, tyin: IE.tyin, ntx: IE.ntx, lvol: IE.lvol, dsug: IE.dsug }[k]; if (m) m(el);
};
document.addEventListener('input', onIn);
document.addEventListener('change', e => {
  if (IE.camChange && IE.camChange(e.target)) return;
  if (e.target.id === 'bkf' && e.target.files && e.target.files[0]) { const f = e.target.files[0]; e.target.value = ''; return IE.bookAdd(f); }
  if (e.target.id === 'camf' && e.target.files && e.target.files[0]) return IE.camImport(e.target.files[0]);
  if (e.target.tagName === 'SELECT' || e.target.type === 'date' || e.target.type === 'checkbox') onIn(e);
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && D.access) IE.sync().catch(() => {}); });
window.addEventListener('online', () => { if (D.access) IE.sync().catch(() => {}); });
window.addEventListener('pagehide', () => { if (D.access) IE.saveLocal(); });
if (SB.onOut) SB.onOut(() => { D.access = false; showAuth('Seans tugadi. Qayta kiring.'); });

/* ---------- boshlash ---------- */
let booting = false;
async function boot() {
  if (booting) return; booting = true;
  try {
    IE.setTheme(IE.theme()); IE.setAccent(IE.accent()); IE.setSkin(IE.skin());
    if (!SB.configured || !SB.session()) { showAuth(); return; }
    app.innerHTML = '<div style="padding-top:42vh"><div class="spin"></div></div>';
    try { await Promise.all([loadData(), loadProfile()]); if (IE.camLoad) await IE.camLoad(); }
    catch (e) { app.innerHTML = '<div class="empty" style="padding-top:34vh">Ma’lumotni yuklab bo‘lmadi.<br>' + esc(IE.uzErr(e)) + '<br><button class="btn sm" style="margin-top:14px" id="rt">Qayta urinish</button></div>'; $('#rt').onclick = () => { booting = false; boot(); }; return; }
    if (!D.access) { showLock(); return; }
    const S = IE.S(), uid = SB.session().user.id; if (S.uid && S.uid !== uid) { IE.setState(null); } IE.S().uid = uid;
    IE.draw(true); IE.sync().catch(() => {}); if (IE.focusBoot) IE.focusBoot();
  } finally { booting = false; }
}
let swReg = null; IE.updReady = false;
const paintUpd = () => $$('[data-a="upd"]').forEach(b => b.classList.toggle('has', IE.updReady));
IE.paintUpd = paintUpd;
const banner = w => { if (!w || $('.upd')) return; const d = document.createElement('div'); d.className = 'upd'; d.innerHTML = '<span>Yangi versiya tayyor</span><button>Yangilash</button>'; d.querySelector('button').onclick = () => w.postMessage({ type: 'SKIP_WAITING' }); document.body.appendChild(d); };
const readyWorker = reg => new Promise(res => {
  if (reg.waiting) return res(reg.waiting);
  const w = reg.installing; if (!w) return res(null);
  const t = setTimeout(() => res(reg.waiting || null), 9000);
  w.addEventListener('statechange', () => { if (w.state === 'installed') { clearTimeout(t); res(reg.waiting || w); } else if (w.state === 'redundant') { clearTimeout(t); res(null); } });
});
/** Yangilanishni tekshiradi. manual=true: foydalanuvchi tugmani bosgan — topilsa darrov o‘rnatiladi, topilmasa xabar beradi. */
IE.checkUpdate = async manual => {
  if (!swReg) { if (manual) { IE.toast('Yangilanmoqda…'); setTimeout(() => location.reload(), 400); } return; }
  const btns = $$('[data-a="upd"]'); if (manual) btns.forEach(b => b.classList.add('spin'));
  let w = null;
  try { await swReg.update(); w = await readyWorker(swReg); } catch (e) { if (manual) IE.toast(navigator.onLine ? 'Tekshirib bo‘lmadi' : 'Internet yo‘q'); }
  btns.forEach(b => b.classList.remove('spin'));
  if (w && navigator.serviceWorker.controller) { IE.updReady = true; paintUpd(); if (manual) { IE.toast('Yangi versiya topildi — yangilanmoqda…'); w.postMessage({ type: 'SKIP_WAITING' }); } else banner(w); }
  else if (manual && IE.updReady === false) IE.toast('Sizda eng so‘nggi versiya (v' + IE.APP_VERSION + ')');
};
A.upd = () => { if (IE.updReady && swReg && swReg.waiting) { IE.toast('Yangilanmoqda…'); swReg.waiting.postMessage({ type: 'SKIP_WAITING' }); } else IE.checkUpdate(true); };
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  navigator.serviceWorker.register('sw.js').then(reg => {
    swReg = reg;
    if (reg.waiting && navigator.serviceWorker.controller) { IE.updReady = true; banner(reg.waiting); paintUpd(); }
    reg.addEventListener('updatefound', () => { const w = reg.installing; if (w) w.addEventListener('statechange', () => { if (w.state === 'installed' && navigator.serviceWorker.controller) { IE.updReady = true; paintUpd(); banner(w); } }); });
    setInterval(() => IE.checkUpdate(false), 20 * 60 * 1000);
  }).catch(() => {});
  let rl = false; navigator.serviceWorker.addEventListener('controllerchange', () => { if (!rl) { rl = true; location.reload(); } });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) IE.checkUpdate(false); });
}
IE.boot = boot;
boot();
})();
