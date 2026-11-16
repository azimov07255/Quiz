/* IELTS · BY AZIMOV — Fokus taymeri (Pomodoro): kunlik o‘qish daqiqalari hisoblanadi, ekran o‘chmaydi, hamma sahifada mini-taymer. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $ } = IE, S = () => IE.S(), R = IE.routes, A = IE.act;
const K = 'ielts:focus', PRE = [15, 25, 45, 60];
const get = () => { try { return JSON.parse(localStorage.getItem(K) || 'null'); } catch (e) { return null; } };
const put = f => { try { f ? localStorage.setItem(K, JSON.stringify(f)) : localStorage.removeItem(K); } catch (e) { /* */ } };
const mmss = ms => { const s = Math.max(0, Math.ceil(ms / 1000)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
const left = f => f.paused ? f.rem : Math.max(0, f.end - Date.now());
IE.focusMins = k => +(S().focus || {})[k || IE.dayKey()] || 0;
IE.focusOn = () => { const f = get(); return !!f && !f.done; };
let wl = null, tick = 0, lastTask = '';
const lock = async () => { try { if (navigator.wakeLock && !wl) { wl = await navigator.wakeLock.request('screen'); wl.addEventListener('release', () => { wl = null; }); } } catch (e) { /* */ } };
const unlock = () => { try { if (wl) wl.release(); } catch (e) { /* */ } wl = null; };
const beep = () => { try { const C = window.AudioContext || window.webkitAudioContext, c = new C(); [0, .28, .56].forEach((d, i) => { const o = c.createOscillator(), g = c.createGain(); o.frequency.value = 660 + i * 110; g.gain.setValueAtTime(.001, c.currentTime + d); g.gain.exponentialRampToValueAtTime(.25, c.currentTime + d + .03); g.gain.exponentialRampToValueAtTime(.001, c.currentTime + d + .24); o.connect(g); g.connect(c.destination); o.start(c.currentTime + d); o.stop(c.currentTime + d + .26); }); } catch (e) { /* */ } };
const route = () => (location.hash.replace(/^#\/?/, '') || 'home').split('/')[0];

function log(mins) {
  mins = Math.floor(mins); if (mins < 1) return; const s = S(), k = IE.dayKey(); s.focus = s.focus || {}; s.focus[k] = (+s.focus[k] || 0) + mins; IE.touchDay(); s.pts = s.pts || 0; IE.save(true);
}
function finish(auto) {
  const f = get(); if (!f) return; const worked = f.brk ? 0 : (auto ? f.dur : (f.dur * 60000 - left(f)) / 60000);
  f.done = true; f.got = Math.floor(worked); put(f); unlock(); if (!f.brk) log(worked);
  if (auto) { beep(); IE.vib([200, 80, 200, 80, 300]); if (!f.brk) IE.confetti(); }
  paintPill(); if (route() === 'focus') IE.draw(false); else if (auto) IE.toast(f.brk ? 'Tanaffus tugadi' : '✓ Fokus tugadi: ' + f.dur + ' daqiqa hisobga olindi');
}
function loop() {
  const f = get(); if (!f || f.done) { clearInterval(tick); tick = 0; paintPill(); return; }
  if (!f.paused && left(f) <= 0) { clearInterval(tick); tick = 0; return finish(true); }
  const t = $('#fct'), r = $('#frg'); if (t) t.textContent = mmss(left(f)); if (r) r.style.strokeDashoffset = String(CIRC * (1 - (left(f) / (f.dur * 60000))));
  paintPill();
}
const CIRC = 2 * Math.PI * 120;
function ensure() { if (!tick) tick = setInterval(loop, 1000); }
function start(mins, task, brk) {
  put({ dur: mins, end: Date.now() + mins * 60000, rem: mins * 60000, paused: false, task: task || '', brk: !!brk, t0: Date.now() }); lastTask = task || lastTask; if (!brk) lock(); ensure(); IE.vib(20); IE.draw(false);
}
function paintPill() {
  let b = $('#fpill'); const f = get(), show = f && !f.done && route() !== 'focus' && !document.body.classList.contains('kb') && !!IE.D.access;
  if (!show) { if (b) b.classList.add('hide'); return; }
  if (!b) { b = document.createElement('button'); b.id = 'fpill'; b.className = 'fpill'; b.dataset.go = 'focus'; b.setAttribute('aria-label', 'Fokus taymeri'); document.body.appendChild(b); }
  b.classList.remove('hide'); b.innerHTML = ic(f.brk ? 'bed' : 'zap') + '<b>' + mmss(left(f)) + '</b>' + (f.paused ? '<small>pauza</small>' : '');
}
window.addEventListener('hashchange', paintPill);
document.addEventListener('visibilitychange', () => { if (!document.hidden) { const f = get(); if (f && !f.done) { if (!f.paused && left(f) <= 0) finish(true); else { ensure(); lock(); } } } });
/** Sahifa yuklanganda: tugagan bo‘lsa hisobga olish, davom etayotgan bo‘lsa taymerni yoqish. */
IE.focusBoot = () => { const f = get(); if (!f) return; if (f.done) { if (Date.now() - (f.end || 0) > 12 * 36e5) put(null); return; } if (!f.paused && left(f) <= 0) { if (Date.now() - f.end < 12 * 36e5) finish(true); else put(null); } else ensure(); paintPill(); };

/* ---------- ekran ---------- */
const ringSvg = (pct, big) => '<svg viewBox="0 0 260 260" class="frs"><defs><linearGradient id="frg2" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#f43f5e"/></linearGradient></defs><circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="14"/><circle id="frg" cx="130" cy="130" r="120" fill="none" stroke="url(#frg2)" stroke-width="14" stroke-linecap="round" stroke-dasharray="' + CIRC.toFixed(1) + '" stroke-dashoffset="' + (CIRC * (1 - pct)).toFixed(1) + '" transform="rotate(-90 130 130)"/></svg>';
R.focus = a => {
  const f = get(), today = IE.focusMins(), goal = Math.max(20, +S().prof.mins || 60);
  let inner;
  if (f && !f.done) {
    const l = left(f); ensure();
    inner = '<div class="fhero' + (f.brk ? ' brk' : '') + '"><div class="fdial">' + ringSvg(l / (f.dur * 60000)) + '<div class="fin"><div id="fct" class="fct">' + mmss(l) + '</div><div class="fsub">' + (f.brk ? 'Tanaffus — suv iching, yuring' : f.paused ? 'Pauza' : esc(f.task || 'Diqqat bilan ishlang')) + '</div></div></div>' +
      '<div class="fbtns">' + (f.paused ? '<button class="btn wb" data-a="fres">' + ic('play') + ' Davom</button>' : '<button class="btn wb ghost" data-a="fpause">' + ic('pause') + ' Pauza</button>') + '<button class="btn wb ghost" data-a="fstop">' + ic('stop') + ' ' + (f.brk ? 'Tugatish' : 'Tugatib saqlash') + '</button></div></div>' +
      '<div class="card" style="margin-top:14px"><div class="sm mu">' + ic('bulb') + ' ' + (f.brk ? 'Ekrandan uzoqlashing: ko‘zlarni dam oldiring, suv iching.' : 'Telefonni jim qiling. Ilovadan chiqib mashq ekraniga o‘tsangiz ham taymer ishlayveradi (pastda mini-taymer).') + '</div></div>';
  } else if (f && f.done) {
    inner = '<div class="fhero done"><div class="fdone">' + (f.brk ? '😌' : '🎯') + '</div><h2>' + (f.brk ? 'Tanaffus tugadi' : f.got + ' daqiqa hisobga olindi') + '</h2><p>' + (f.brk ? 'Yana bir fokus sessiyasiga tayyormisiz?' : 'Bugun jami: <b>' + today + ' daqiqa</b>. Ajoyib ish!') + '</p><div class="fbtns" style="margin-top:16px">' +
      (f.brk ? '' : '<button class="btn wb" data-a="fbrk">' + ic('bed') + ' 5 daq tanaffus</button>') + '<button class="btn wb ghost" data-a="fnew">' + ic('zap') + ' Yangi sessiya</button></div></div>';
  } else {
    const task = a[0] === 't' ? decodeURIComponent(a[1] || '') : lastTask, pm = +a[2] || +(localStorage.getItem('ielts:fdur') || 25), pl = IE.planToday ? IE.planToday().ts.filter(t => !t.done).slice(0, 4) : [];
    inner = '<div class="fhero idle"><div class="fbig">' + ic('zap') + '</div><h2>Fokus sessiya</h2><p>Bitta ish — to‘liq diqqat. Tugagach daqiqalar kunlik maqsadingizga qo‘shiladi.</p></div>' +
      '<div class="card" style="margin-top:14px"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">Davomiyligi</div><div class="seg" id="fdurs">' + PRE.map(m => '<button class="' + (m === pm ? 'on' : '') + '" data-a="fdur" data-m="' + m + '">' + m + ' daq</button>').join('') + '</div>' +
      '<div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;margin:14px 0 8px">Nima ustida ishlaysiz?</div><div class="fld" style="margin:0"><input id="ftask" placeholder="Masalan: Reading passage 2" maxlength="60" value="' + esc(task) + '"></div>' +
      (pl.length ? '<div class="dchips" style="margin-top:10px">' + pl.map(t => '<button class="chip" data-a="fpick" data-t="' + esc(t.t) + '" data-m="' + Math.min(60, Math.max(15, Math.round(t.m / 5) * 5)) + '">' + esc(t.t) + '</button>').join('') + '</div>' : '') +
      '<button class="btn block" style="margin-top:16px" data-a="fgo" id="fgo">' + ic('play') + ' Boshlash · <span id="fdv">' + pm + '</span> daq</button></div>';
  }
  const pct = Math.min(100, Math.round(today / goal * 100));
  inner += '<div class="card" style="margin-top:14px"><div class="row" style="justify-content:space-between"><b>Bugungi fokus</b><span class="sm mu">' + today + ' / ' + goal + ' daq</span></div><div class="prog" style="margin-top:8px"><i style="width:' + pct + '%"></i></div>' +
    '<div class="sm mu" style="margin-top:8px">' + (pct >= 100 ? 'Kunlik vaqt maqsadi bajarildi 🎉' : 'Maqsadga ' + (goal - today) + ' daqiqa qoldi') + '</div></div>';
  const o = IE.sub('Fokus', 'plan', '<div class="pad">' + inner + '</div>'); return o;
};
const dur = () => { const c = $('#fdurs .on'); return c ? +c.dataset.m : 25; };
A.fdur = el => { document.querySelectorAll('#fdurs button').forEach(b => b.classList.toggle('on', b === el)); const v = $('#fdv'); if (v) v.textContent = el.dataset.m; try { localStorage.setItem('ielts:fdur', el.dataset.m); } catch (e) { /* */ } };
A.fpick = el => { const i = $('#ftask'); if (i) i.value = el.dataset.t; const b = document.querySelector('#fdurs [data-m="' + el.dataset.m + '"]'); if (b) A.fdur(b); };
A.fgo = () => { const i = $('#ftask'); start(dur(), i ? i.value.trim() : ''); };
A.fpause = () => { const f = get(); if (!f || f.done || f.paused) return; f.rem = left(f); f.paused = true; put(f); unlock(); IE.draw(false); };
A.fres = () => { const f = get(); if (!f || !f.paused) return; f.end = Date.now() + f.rem; f.paused = false; put(f); lock(); ensure(); IE.draw(false); };
A.fstop = () => { const f = get(); if (!f) return; const w = f.brk ? 0 : Math.floor((f.dur * 60000 - left(f)) / 60000); if (w < 1) { put(null); unlock(); paintPill(); IE.toast('Bekor qilindi'); return IE.draw(false); } finish(false); IE.toast(w + ' daqiqa hisobga olindi'); };
A.fbrk = () => start(5, '', true);
A.fnew = () => { put(null); IE.draw(false); };
if (IE.D) { /* app.js yuklangach focusBoot chaqiriladi */ }
})();
