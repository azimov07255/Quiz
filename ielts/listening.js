/* IELTS · BY AZIMOV — Listening: haqiqiy diktor yozuvlari (VOA Learning English, ommaviy mulk), imtihon/mashq rejimi, natija va transkript. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet, fmtT, ago } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const LK = 'ielts:lrun';
const tests = () => (D.listening && D.listening.tests) || [];
const find = id => tests().find(t => t.id === id);
const sub = (title, back, inner, right) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + '</header><div class="scr sub">' + inner + '</div>', sub: true });
const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

R.listening = a => {
  const t = a[0] && find(a[0]);
  if (!t) return list();
  if (a[1] === 'run') return run(t);
  if (a[1] === 'result') return result(t);
  return intro(t);
};

/* ---------- ro‘yxat ---------- */
function list() {
  const s = S(), run = lsGet(LK, null);
  const inner = '<div class="pad"><div class="card rise" style="margin-bottom:14px"><div class="row">' + bd('head', 'L', 'lg') + '<div style="flex:1"><b style="font-size:16px">Haqiqiy diktor ovozi</b><div class="sm mu">Yozuvlar — VOA Learning English (AQSh hukumati loyihasi, ommaviy mulk). Telefon ovozi emas, jonli o‘qilgan matnlar.</div></div></div></div><div class="lst">' +
    tests().map(t => {
      const last = s.listens.filter(r => r.id === t.id).slice(-1)[0], going = run && run.id === t.id;
      return '<button class="item rise" data-go="listening/' + t.id + '">' + bd('head', 'L') + '<div class="tx"><b>' + esc(t.topic.split(' · ')[1] || t.title) + '</b><span>' + esc(t.topic.split(' · ')[0]) + ' · ' + esc(t.sec) + ' · ' + mmss(t.dur) + (going ? ' · <b style="color:var(--warn)">davom etmoqda</b>' : '') + '</span></div>' + (last ? '<span class="band sk-L">' + IE.bandTxt(last.band) + '</span>' : '<span class="go">' + ic('next') + '</span>') + '</button>';
    }).join('') + '</div><p class="hint" style="margin-top:14px">' + ic('bulb') + ' Yangi yozuvlar muntazam qo‘shib boriladi.</p></div>';
  return sub('Listening', 'practice', inner);
}

/* ---------- kirish: rejim tanlash ---------- */
function intro(t) {
  const m = V.lmode || 'practice', n = IE.allQ(t).length;
  const inner = '<div class="pad"><div class="card rise"><div class="row">' + bd('head', 'L', 'lg') + '<div style="flex:1"><b style="font-size:17px;line-height:1.25">' + esc(t.title) + '</b><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"><span class="chip">' + esc(t.sec) + '</span><span class="chip">' + esc(t.level) + '</span><span class="chip">' + ic('clock') + ' ' + mmss(t.dur) + '</span><span class="chip">' + n + ' savol</span></div></div></div></div>' +
    '<div class="sec"><h2>Rejim</h2></div><div class="lst">' +
    '<button class="item' + (m === 'practice' ? ' sel' : '') + '" data-a="lmode" data-v="practice">' + bd('play', 'S', 'sm') + '<div class="tx"><b>Mashq rejimi</b><span style="white-space:normal;display:block">To‘xtatish, 10 soniya orqaga, tezlikni o‘zgartirish mumkin</span></div>' + (m === 'practice' ? '<span class="go" style="color:var(--ok)">' + ic('check') + '</span>' : '') + '</button>' +
    '<button class="item' + (m === 'exam' ? ' sel' : '') + '" data-a="lmode" data-v="exam">' + bd('clock', 'W', 'sm') + '<div class="tx"><b>Imtihon rejimi</b><span style="white-space:normal;display:block">Haqiqiy imtihondagidek: audio bir marta, to‘xtatib va o‘tkazib bo‘lmaydi</span></div>' + (m === 'exam' ? '<span class="go" style="color:var(--ok)">' + ic('check') + '</span>' : '') + '</button></div>' +
    '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Quloqchin taqing. Savollarni audio davomida to‘ldiring; transkript faqat tugagach ochiladi.</p>' +
    '<button class="btn block" style="margin-top:12px" data-a="lstart" data-id="' + t.id + '">' + ic('play') + ' Boshlash</button>' +
    '<p class="mu xs c" style="margin-top:16px">Audio: <a href="' + esc(t.credit.url) + '" target="_blank" rel="noopener" style="color:var(--pl)">' + esc(t.credit.name) + '</a> (voanews.com) — AQSh hukumati materiali, ommaviy mulk.</p></div>';
  return sub(t.topic.split(' · ')[1] || t.title, 'listening', inner);
}
A.lmode = el => { V.lmode = el.dataset.v; IE.draw(false); };
A.lstart = el => { const id = el.dataset.id, sv = lsGet(LK, null); V.l = (sv && sv.id === id && Date.now() - sv.t0 < 6 * 36e5) ? sv : { id, mode: V.lmode || 'practice', ans: {}, t0: Date.now() }; lsSet(LK, V.l); IE.go('listening/' + id + '/run'); };

/* ---------- pleyer ---------- */
const player = (t, mode) => '<div class="lpl' + (mode === 'exam' ? ' exam' : '') + '" id="lpl"><audio id="au" src="' + esc(t.audio) + '" preload="metadata" playsinline></audio>' +
  '<button class="lplay" id="lp" data-a="lplay" aria-label="Boshlash / to‘xtatish">' + ic('play') + '</button><div class="lmid"><div class="lbar"><i id="lfill"></i>' + (mode === 'exam' ? '' : '<input type="range" class="lrange" id="lseek" min="0" max="' + Math.round(t.dur) + '" step="1" value="0" data-in="lseek" aria-label="Joylashuv">') + '</div><div class="ltime"><span id="lcur">0:00</span><span>' + mmss(t.dur) + '</span></div></div>' +
  (mode === 'exam' ? '<span class="chip soon" style="margin-left:6px">Bir marta</span>' : '<button class="lsm" data-a="lback" aria-label="10 soniya orqaga">' + ic('back2') + '<small>10</small></button><button class="lsm" id="lsp" data-a="lspeed" aria-label="Tezlik">1×</button>') + '</div>';
IE.player = player;
const au = () => $('#au');
const setPlayIcon = on => { const b = $('#lp'); if (b) b.innerHTML = on ? ic('pause') : ic('play'); if (b) b.classList.toggle('on', on); };
const tick = t => { const a = au(); if (!a) return; const f = $('#lfill'), c = $('#lcur'), r = $('#lseek'), d = a.duration && isFinite(a.duration) ? a.duration : t.dur; if (f) f.style.width = Math.min(100, a.currentTime / d * 100) + '%'; if (c) c.textContent = mmss(a.currentTime); if (r && document.activeElement !== r) r.value = Math.round(a.currentTime); };
function wirePlayer(t, mode) {
  const a = au(); if (!a) return;
  a.addEventListener('play', () => setPlayIcon(true)); a.addEventListener('pause', () => setPlayIcon(false));
  a.addEventListener('ended', () => { setPlayIcon(false); tick(t); if (V.l) V.l.ended = true; if (IE.onAudioEnd) IE.onAudioEnd(); const lp = $('#lp'); if (mode === 'exam' && lp) { lp.disabled = true; } const n = $('#lend'); if (n) n.classList.remove('hide'); });
  a.addEventListener('loadedmetadata', () => { if (!isFinite(a.duration)) return; const r = $('#lseek'), tt = $('#lpl .ltime span:last-child'); if (r) r.max = Math.round(a.duration); if (tt) tt.textContent = mmss(a.duration); });
  a.addEventListener('error', () => IE.toast('Audio yuklanmadi. Internetni tekshiring.'));
  IE.every(250, () => tick(t));
}
A.lplay = () => {
  const a = au(); if (!a) return; const mode = (V.l && V.l.mode) || 'practice';
  if (a.paused) { a.play().catch(() => IE.toast('Audio boshlanmadi — qayta bosing')); if (V.l && !V.l.started) { V.l.started = true; } }
  else if (mode === 'exam') IE.toast('Imtihon rejimida to‘xtatib bo‘lmaydi'); else a.pause();
};
IE.wirePlayer = wirePlayer;
IE.audioEl = au;
A.lback = () => { const a = au(); if (a) a.currentTime = Math.max(0, a.currentTime - 10); };
A.lspeed = () => { const a = au(), b = $('#lsp'); if (!a) return; const sp = [1, 0.8, 1.25], i = (sp.indexOf(a.playbackRate) + 1) % sp.length; a.playbackRate = sp[i]; if (b) b.textContent = (sp[i] === 1 ? '1' : String(sp[i]).replace('0.8', '0.8')) + '×'; };
IE.lseek = el => { const a = au(); if (a) a.currentTime = +el.value; };
A.lgo = el => { const a = au(); if (!a) return; a.currentTime = Math.max(0, +el.dataset.t); a.play().catch(() => {}); const p = $('#lpl'); if (p) window.scrollTo({ top: 0, behavior: 'smooth' }); };

/* ---------- topshirish ---------- */
function run(t) {
  if (!V.l || V.l.id !== t.id) { const sv = lsGet(LK, null); V.l = sv && sv.id === t.id ? sv : { id: t.id, mode: V.lmode || 'practice', ans: {}, t0: Date.now() }; }
  const r = V.l, qs = IE.allQ(t), done = qs.filter(x => r.ans[x.q.n] != null && r.ans[x.q.n] !== '').length;
  const o = sub(t.topic.split(' · ')[1] || t.title, 'listening/' + t.id, '<div class="lsticky">' + player(t, r.mode) + '</div>' +
    '<p class="hint" style="margin:12px 16px 0">' + ic('head') + ' ' + (r.mode === 'exam' ? 'Imtihon rejimi: audio bir marta ijro etiladi.' : 'Mashq rejimi: to‘xtatish va qaytarish mumkin.') + '</p>' + IE.groupsHTML(t, r.ans, false) +
    '<div id="lend" class="pad hide" style="margin-top:6px"><div class="card c"><b>Audio tugadi</b><div class="mu sm">Javoblaringizni tekshirib, topshiring.</div></div></div>' +
    '<div style="height:96px"></div><div class="bar"><div class="prog" style="margin-bottom:10px"><i id="pg" style="width:' + (done / qs.length * 100) + '%"></i></div><button class="btn block" data-a="lsubmit">Topshirish <span class="chip" id="cnt" style="margin-left:6px;background:rgba(255,255,255,.22);color:#fff">' + done + '/' + qs.length + '</span></button></div>');
  o.mount = () => { wirePlayer(t, r.mode); };
  return o;
}
A.lsubmit = () => {
  const t = find(V.l.id), qs = IE.allQ(t), left = qs.filter(x => V.l.ans[x.q.n] == null || V.l.ans[x.q.n] === '').length;
  const go = () => {
    const raw = qs.filter(x => IE.isOk(x.g, x.q, V.l.ans[x.q.n])).length, a0 = au(); if (a0) a0.pause();
    const rec = { ts: Date.now(), id: t.id, raw, tot: qs.length, band: IE.bandL(raw, qs.length), secs: Math.round((Date.now() - V.l.t0) / 1000), mode: V.l.mode, a: V.l.ans };
    S().listens.push(rec); IE.touchDay(); IE.save(true); try { localStorage.removeItem(LK); } catch (e) { /* xotira yopiq */ } V.l = null;
    IE.go('listening/' + t.id + '/result'); setTimeout(() => { if (raw / qs.length >= .6) IE.confetti(); }, 350);
  };
  if (left) IE.ask('Topshirasizmi?', left + ' ta savolga javob bermadingiz. Baribir topshiramizmi?', 'Topshirish', go); else go();
};

/* ---------- natija ---------- */
function result(t) {
  const rec = S().listens.filter(r => r.id === t.id).slice(-1)[0]; if (!rec) return intro(t);
  const pc = Math.round(rec.raw / rec.tot * 100), wrong = new Set(IE.allQ(t).filter(x => !IE.isOk(x.g, x.q, rec.a[x.q.n])).map(x => x.q.p));
  const withSeek = t2 => t2; // savol bloklari uchun “tinglash” tugmasi pastda qo‘shiladi
  let html = IE.groupsHTML(t, rec.a || {}, true);
  html = html.replace(/<div class="q (ok|no)" id="q(\d+)">/g, (m0, cls, n) => { const q = IE.allQ(t).find(x => x.q.n === +n).q; return m0 + '<button class="chip lseekb" data-a="lgo" data-t="' + q.t + '">' + ic('play') + ' ' + mmss(q.t) + ' dan tinglash</button>'; });
  const inner = '<div class="lsticky">' + player(t, 'practice') + '</div><div class="res anim"><div class="lbl">Taxminiy band</div><div class="big">' + IE.bandTxt(rec.band) + '</div><div class="mu" style="margin-top:8px">' + rec.raw + ' / ' + rec.tot + ' to‘g‘ri (' + pc + '%)</div></div>' +
    '<div class="pad"><details class="card tr"><summary>' + ic('doc') + ' Transkript (' + t.tr.length + ' abzats) — bosib shu joydan tinglang</summary>' + t.tr.map((p, i) => '<p class="trp' + (wrong.has(i) ? ' wr' : '') + '" data-a="lgo" data-t="' + Math.max(0, p.t - 0.5) + '"><b>' + mmss(p.t) + '</b> ' + esc(p.x) + '</p>').join('') + '</details>' +
    '<p class="mu xs" style="margin:10px 2px">Qizil chiziq — xato javob berilgan joylar.</p></div>' + html +
    '<div class="pad" style="margin-top:8px"><div class="two"><button class="btn ghost" data-go="listening">Boshqa audio</button><button class="btn" data-a="lretry" data-id="' + t.id + '">Qayta urinish</button></div>' +
    '<p class="mu xs c" style="margin-top:14px">Audio: <a href="' + esc(t.credit.url) + '" target="_blank" rel="noopener" style="color:var(--pl)">' + esc(t.credit.name) + '</a> — ommaviy mulk.</p></div>';
  const o = sub('Natija', 'listening', inner); o.mount = () => { wirePlayer(t, 'practice'); }; return o;
}
A.lretry = el => { try { localStorage.removeItem(LK); } catch (e) { /* */ } V.l = null; IE.go('listening/' + el.dataset.id); };
})();
