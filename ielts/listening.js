/* IELTS · BY AZIMOV — Listening: haqiqiy diktor yozuvlari (VOA Learning English, ommaviy mulk), imtihon/mashq rejimi, natija va transkript. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet, fmtT, ago } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const lk = id => 'ielts:lrun:' + id;
const needProxy = u => /^https?:\/\/([^/]+\.)?(bbc\.co\.uk|bbci\.co\.uk|bbc\.com)\//i.test(String(u || ''));
/** Audioni bizning serverimiz orqali uzatish (bloklangan/hotlink/aralash kontent manbalar uchun). */
IE.proxyAudio = async url => { const r = await SB.fn('ielts-audio', { url }); if (!r || !r.src) throw new Error('proxy'); return r.src; };
const tests = () => (D.listening && D.listening.tests) || [];
const find = id => tests().find(t => t.id === id);
const sub = (title, back, inner, right) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + '</header><div class="scr sub">' + inner + '</div>', sub: true });
const creditP = (t, mt, tail) => t.credit && t.credit.url ? '<p class="mu xs c" style="margin-top:' + mt + 'px">Audio: <a href="' + esc(t.credit.url) + '" target="_blank" rel="noopener" style="color:var(--pl)">' + esc(t.credit.name) + '</a>' + tail + '</p>' : '<p class="mu xs c" style="margin-top:' + mt + 'px">' + esc((t.credit && t.credit.name) || '') + '</p>';
const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };

R.listening = a => {
  const t = a[0] && find(a[0]);
  if (!t) return list();
  if (t.priv && !t.audio && !t.noaudio) { IE.camEnsure(t).then(() => { if ((IE.curRoute || '').startsWith('listening/' + t.id)) IE.draw(false); }); return sub(t.title, 'listening', '<div style="padding-top:34vh"><div class="spin"></div></div>'); }
  if (a[1] === 'run') return run(t);
  if (a[1] === 'result') return result(t);
  return intro(t);
};

/* ---------- ro‘yxat ---------- */
function list() {
  const s = S();
  const inner = '<div class="pad">' + (IE.pracSeg ? IE.pracSeg('L') : '') + (IE.pracMode && IE.pracMode() === 'full' ? IE.pracFull('L') + '<div class="sec"><h2>Yoki bitta qism</h2></div>' : '') + IE.listPage('L') + '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Yozuvlar — VOA Learning English (ommaviy mulk), jonli diktor ovozi. Yangilari muntazam qo‘shiladi.</p></div>';
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
    (t.priv && t.audio && IE.camTrBtn ? IE.camTrBtn(t) : '') +
    (t.priv && !t.audio ? IE.camAttach(t) : '<button class="btn block" style="margin-top:12px" data-a="lstart" data-id="' + t.id + '">' + ic('play') + ' Boshlash</button>') +
    creditP(t, 16, ' (voanews.com) — AQSh hukumati materiali, ommaviy mulk.') + '</div>';
  return sub(t.topic.split(' · ')[1] || t.title, 'listening', inner);
}
A.lmode = el => { V.lmode = el.dataset.v; IE.draw(false); };
A.lstart = el => { const id = el.dataset.id, sv = lsGet(lk(id), null); V.l = (sv && sv.id === id && Date.now() - sv.t0 < 6 * 36e5) ? sv : { id, mode: V.lmode || 'practice', ans: {}, t0: Date.now() }; lsSet(lk(id), V.l); IE.go('listening/' + id + '/run'); };

/* ---------- pleyer ---------- */
const player = (t, mode) => '<div class="lpl' + (mode === 'exam' ? ' exam' : '') + '" id="lpl"><audio id="au" src="' + esc(t.audio) + '" data-alt="' + esc(t.alt || '') + '" data-orig="' + esc(t.audio) + '" data-pf="' + (needProxy(t.audio) ? '1' : '') + '" preload="metadata" playsinline></audio>' +
  '<button class="lplay" id="lp" data-a="lplay" aria-label="Boshlash / to‘xtatish">' + ic('play') + '</button><div class="lmid"><div class="lbar"><i id="lfill"></i>' + (mode === 'exam' ? '' : '<input type="range" class="lrange" id="lseek" min="0" max="' + Math.round(t.dur) + '" step="1" value="0" data-in="lseek" aria-label="Joylashuv">') + '</div><div class="ltime"><span id="lcur">0:00</span><span>' + mmss(t.dur) + '</span></div></div>' +
  (mode === 'exam' ? '<span class="chip soon" style="margin-left:6px">Bir marta</span>' : '<button class="lsm" data-a="lback" aria-label="10 soniya orqaga">' + ic('back2') + '<small>10</small></button><button class="lsm" data-a="lfwd" aria-label="10 soniya oldinga"><b style="font-size:12px">+10</b></button><button class="lsm" id="lsp" data-a="lmenu" aria-label="Pleyer sozlamalari">1×</button>') + '</div>';
IE.player = player;
const au = () => $('#au');
const setPlayIcon = on => { const b = $('#lp'); if (b) b.innerHTML = on ? ic('pause') : ic('play'); if (b) b.classList.toggle('on', on); };
const tick = t => { const a = au(); if (!a) return; const f = $('#lfill'), c = $('#lcur'), r = $('#lseek'), d = a.duration && isFinite(a.duration) ? a.duration : t.dur; if (f) f.style.width = Math.min(100, a.currentTime / d * 100) + '%'; if (c) c.textContent = mmss(a.currentTime); if (r && document.activeElement !== r) r.value = Math.round(a.currentTime);
  if (V.loop && V.loop.b != null && a.currentTime >= V.loop.b) a.currentTime = V.loop.a || 0;
  const tp = $('#trp'); if (tp && !tp.classList.contains('hide') && t.tr && t.tr.some(x => x.t != null)) { let ix = -1; t.tr.forEach((x, i) => { if (x.t != null && x.t <= a.currentTime + 0.25) ix = i; }); const els = $$('.trl', tp); els.forEach((e, i) => e.classList.toggle('cur', i === ix)); const e = els[ix]; if (e && V.lastTr !== ix) { V.lastTr = ix; tp.scrollTop = Math.max(0, e.offsetTop - tp.clientHeight / 3); } } };
function wirePlayer(t, mode) {
  const a = au(); if (!a) return;
  a.addEventListener('play', () => setPlayIcon(true)); a.addEventListener('pause', () => setPlayIcon(false));
  a.addEventListener('ended', () => { setPlayIcon(false); tick(t); if (V.l) V.l.ended = true; if (IE.onAudioEnd) IE.onAudioEnd(); const lp = $('#lp'); if (mode === 'exam' && lp) { lp.disabled = true; } const n = $('#lend'); if (n) n.classList.remove('hide'); });
  a.addEventListener('loadedmetadata', () => { if (!isFinite(a.duration)) return; const r = $('#lseek'), tt = $('#lpl .ltime span:last-child'); if (r) r.max = Math.round(a.duration); if (tt) tt.textContent = mmss(a.duration); });
  a.addEventListener('error', () => { if (tryAlt()) return; const er = a.error; IE.toast('Audio ochilmadi' + (er ? ' (xato kodi ' + er.code + ')' : '') + '. Internetni tekshiring yoki boshqa epizodni sinang.'); });
  if (a.dataset.pf && /^https?:/.test(a.dataset.orig || '') && IE.proxyAudio) { a.dataset.step = '2'; IE.proxyAudio(a.dataset.orig).then(src => { a.src = src; a.load(); }).catch(() => { /* to‘g‘ridan-to‘g‘ri manzil qoladi */ }); }
  IE.every(250, () => tick(t));
}
/** Birinchi manzil ishlamasa, zaxira manzilga (server topgan yakuniy URL) o‘tadi. */
const swapSrc = (a, src) => { a.src = src; a.load(); a.play().catch(() => {}); };
const tryAlt = () => {
  const a = au(); if (!a) return false; const st = +(a.dataset.step || 0);
  if (st === 0 && a.dataset.alt) { a.dataset.step = '1'; swapSrc(a, a.dataset.alt); return true; }
  if (st < 2 && IE.proxyAudio && /^https?:/.test(a.dataset.orig || '')) { a.dataset.step = '2'; IE.proxyAudio(a.dataset.orig).then(src => swapSrc(a, src)).catch(() => IE.toast('Audio ochilmadi. Boshqa epizodni sinab ko‘ring.')); return true; }
  return false;
};
/** Boshqa ekranlardagi (Shadowing/Dictation) <audio> uchun ham zaxira zanjiri. */
IE.guardAudio = a => {
  if (!a || a.dataset.g) return; a.dataset.g = '1'; a.dataset.orig = a.dataset.orig || a.getAttribute('src') || '';
  const swap = src => { a.src = src; a.load(); };
  a.addEventListener('error', () => { const st = +(a.dataset.step || 0); if (st === 0 && a.dataset.alt) { a.dataset.step = '1'; swap(a.dataset.alt); } else if (st < 2 && IE.proxyAudio && /^https?:/.test(a.dataset.orig)) { a.dataset.step = '2'; IE.proxyAudio(a.dataset.orig).then(swap).catch(() => IE.toast('Audio ochilmadi')); } });
  if (needProxy(a.dataset.orig) && IE.proxyAudio) { a.dataset.step = '2'; IE.proxyAudio(a.dataset.orig).then(swap).catch(() => {}); }
};
A.lplay = () => {
  const a = au(); if (!a) return; const mode = (V.l && V.l.mode) || 'practice';
  if (a.paused) { a.play().catch(() => { if (!tryAlt()) IE.toast('Audio boshlanmadi — qayta bosing'); }); if (V.l && !V.l.started) { V.l.started = true; } }
  else if (mode === 'exam') IE.toast('Imtihon rejimida to‘xtatib bo‘lmaydi'); else a.pause();
};
IE.wirePlayer = wirePlayer;
IE.audioEl = au;
A.lfwd = () => { const a = au(); if (a) a.currentTime = Math.min(a.duration || 1e9, a.currentTime + 10); };
const RATES = [0.75, 0.9, 1, 1.1, 1.25, 1.5], rtxt = r => (r === 1 ? '1' : String(r)) + '×';
const mm = x => mmss(x);
A.lmenu = () => {
  const a = au(); if (!a) return; const lp = V.loop || {};
  IE.sheet('<h2>Pleyer</h2><div class="lm-l">Tezlik</div><div class="seg wrap">' + RATES.map(r => '<button class="' + (a.playbackRate === r ? 'on' : '') + '" data-a="lrate" data-v="' + r + '">' + rtxt(r) + '</button>').join('') + '</div>' +
    '<div class="lm-l">Ovoz balandligi</div><input type="range" class="lrange" min="0" max="1" step="0.05" value="' + a.volume + '" data-in="lvol" aria-label="Ovoz" style="width:100%">' +
    '<div class="lm-l">Oraliqni takrorlash (A–B)</div><div class="row" style="gap:8px;flex-wrap:wrap"><button class="chip" data-a="lloop" data-p="a">A: ' + (lp.a != null ? mm(lp.a) : 'belgilash') + '</button><button class="chip" data-a="lloop" data-p="b">B: ' + (lp.b != null ? mm(lp.b) : 'belgilash') + '</button><button class="chip" data-a="lloop" data-p="x">Tozalash</button></div>' +
    '<p class="mu xs" style="margin:10px 0 0">Eslatma: pleyerni ijro paytida “A” va “B” ni kerakli joyda bosing — oraliq takrorlanaveradi.</p><button class="btn block" style="margin-top:14px" data-a="sheet-x">Yopish</button>');
};
A.lrate = el => { const a = au(), b = $('#lsp'); if (!a) return; a.playbackRate = +el.dataset.v; if (b) b.textContent = rtxt(a.playbackRate) + (V.loop && V.loop.b != null ? ' ↻' : ''); IE.closeSheet(); };
IE.lvol = el => { const a = au(); if (a) a.volume = +el.value; };
A.lloop = el => {
  const a = au(); if (!a) return; const p = el.dataset.p, lp = V.loop = V.loop || {};
  if (p === 'x') V.loop = null; else if (p === 'a') { lp.a = a.currentTime; if (lp.b != null && lp.b <= lp.a) lp.b = null; } else { lp.b = Math.max(a.currentTime, (lp.a || 0) + 1); if (lp.a == null) lp.a = Math.max(0, lp.b - 8); }
  const b = $('#lsp'); if (b) b.textContent = rtxt(a.playbackRate) + (V.loop && V.loop.b != null ? ' ↻' : ''); A.lmenu();
};
if (!window.__lkb) { window.__lkb = 1; document.addEventListener('keydown', e => {
  if (!/^listening\//.test(IE.curRoute || '') || e.ctrlKey || e.metaKey || e.altKey) return; const tg = e.target; if (tg && /^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName)) return; const a = au(); if (!a) return;
  if (e.code === 'Space') { e.preventDefault(); A.lplay(); } else if (e.code === 'ArrowLeft' && !(V.l && V.l.mode === 'exam')) { a.currentTime = Math.max(0, a.currentTime - 5); } else if (e.code === 'ArrowRight' && !(V.l && V.l.mode === 'exam')) { a.currentTime += 5; }
}); }
A.lback = () => { const a = au(); if (a) a.currentTime = Math.max(0, a.currentTime - 10); };
A.lspeed = () => { const a = au(), b = $('#lsp'); if (!a) return; const sp = [1, 0.8, 1.25], i = (sp.indexOf(a.playbackRate) + 1) % sp.length; a.playbackRate = sp[i]; if (b) b.textContent = (sp[i] === 1 ? '1' : String(sp[i]).replace('0.8', '0.8')) + '×'; };
IE.lseek = el => { const a = au(); if (a) a.currentTime = +el.value; };
A.lgo = el => { const a = au(); if (!a) return; a.currentTime = Math.max(0, +el.dataset.t); a.play().catch(() => {}); const p = $('#lpl'); if (p) window.scrollTo({ top: 0, behavior: 'smooth' }); };

/* ---------- topshirish ---------- */
function trPanel(t, r) {
  const tr = t.tr || []; if (!tr.length) return '';
  const locked = r.mode === 'exam' && !r.ended, shown = !!r.tr && !locked;
  return '<div class="trbar"><button class="chip' + (shown ? ' on' : '') + '" data-a="trtog" id="trbtn">' + ic('eye') + '<span>Audioscript: ' + (shown ? 'ko‘rinadi' : 'yashirin') + '</span></button>' + (r.mode === 'exam' ? '<small class="mu">Imtihon rejimida audio tugagach ochiladi</small>' : '') + '</div>' +
    '<div class="trp' + (shown ? '' : ' hide') + '" id="trp">' + tr.map((p, i) => '<p class="trl" data-i="' + i + '"' + (p.t != null ? ' data-a="lgo" data-t="' + Math.max(0, p.t - 0.3) + '"' : '') + '>' + (p.t != null ? '<b>' + mmss(p.t) + '</b> ' : '') + esc(p.x) + '</p>').join('') + '</div>';
}
A.trtog = () => {
  const r = V.l; if (!r) return; if (r.mode === 'exam' && !r.ended) return IE.toast('Imtihon rejimida audioscript audio tugagach ochiladi');
  r.tr = !r.tr; lsSet(lk(r.id), r); const p = $('#trp'), b = $('#trbtn'); if (p) p.classList.toggle('hide', !r.tr); V.lastTr = -1;
  if (b) { b.classList.toggle('on', r.tr); b.lastElementChild.textContent = 'Audioscript: ' + (r.tr ? 'ko‘rinadi' : 'yashirin'); }
};
function run(t) {
  V.loop = null;
  if (!V.l || V.l.id !== t.id) { const sv = lsGet(lk(t.id), null); V.l = sv && sv.id === t.id ? sv : { id: t.id, mode: V.lmode || 'practice', ans: {}, t0: Date.now() }; }
  const r = V.l, qs = IE.allQ(t), done = qs.filter(x => r.ans[x.q.n] != null && r.ans[x.q.n] !== '').length, pm = /Section\s*(\d)/i.exec(t.sec || '') || /Section\s*(\d)/i.exec(t.cam || '');
  const o = sub(t.topic.split(' · ')[1] || t.title, 'listening/' + t.id, '<div class="tg"><div class="tg-l"><div class="lsticky">' + player(t, r.mode) + '</div>' + trPanel(t, r) +
    (IE.tkTools ? IE.tkTools(t.id) : '') + '<p class="hint" style="margin:12px 16px 0">' + ic('head') + ' ' + (r.mode === 'exam' ? 'Imtihon rejimi: audio bir marta ijro etiladi.' : 'Mashq rejimi: to‘xtatish va qaytarish mumkin.') + '</p></div>' +
    '<div class="tg-r">' + (IE.ftBanner ? IE.ftBanner('L') : '') + '<div class="bkhd"><small>' + (pm ? 'PART ' + pm[1] : 'LISTENING') + '</small><p class="ins">Questions ' + IE.rangeTxt(t) + '</p></div>' + IE.groupsHTML(t, r.ans, false, r.flag || {}) +
    '<div id="lend" class="pad hide" style="margin-top:6px"><div class="card c"><b>Audio tugadi</b><div class="mu sm">Javoblaringizni tekshirib, topshiring.</div></div></div></div></div>' +
    '<div style="height:120px"></div><div class="bar">' + (IE.partNav ? IE.partNav(t, 'l') : '') + '<div class="prog" style="margin-bottom:10px"><i id="pg" style="width:' + (done / qs.length * 100) + '%"></i></div><div class="barrow"><button class="btn ghost palb" data-a="pal" aria-label="Savollar paneli">' + ic('grid') + '<span id="cnt">' + done + '/' + qs.length + '</span></button><button class="btn" data-a="lsubmit">' + (IE.ftOn && IE.ftOn('L', t.id) ? 'Keyingi qism →' : 'Topshirish') + '</button></div></div>');
  o.mount = () => { wirePlayer(t, r.mode); if (IE.tkMount) IE.tkMount('L'); };
  return o;
}
A.lsubmit = () => {
  const t = find(V.l.id), qs = IE.allQ(t), left = qs.filter(x => V.l.ans[x.q.n] == null || V.l.ans[x.q.n] === '').length;
  const go = () => {
    const raw = qs.filter(x => IE.isOk(x.g, x.q, V.l.ans[x.q.n])).length, a0 = au(); if (a0) a0.pause();
    const rec = { ts: Date.now(), id: t.id, raw, tot: qs.length, band: IE.bandL(raw, qs.length), secs: Math.round((Date.now() - V.l.t0) / 1000), mode: V.l.mode, a: V.l.ans };
    S().listens.push(rec); IE.touchDay(); IE.save(true); try { localStorage.removeItem(lk(t.id)); } catch (e) { /* xotira yopiq */ } V.l = null;
    if (IE.ftListenSubmit && IE.ftListenSubmit(t, rec)) return;
    IE.go('listening/' + t.id + '/result'); setTimeout(() => { if (raw / qs.length >= .6) IE.confetti(); }, 350);
  };
  if (left) IE.ask('Topshirasizmi?', left + ' ta savolga javob bermadingiz. Baribir topshiramizmi?', 'Topshirish', go); else go();
};

/* ---------- natija ---------- */
function result(t) {
  const rec = S().listens.filter(r => r.id === t.id).slice(-1)[0]; if (!rec) return intro(t);
  const pc = Math.round(rec.raw / rec.tot * 100), wrong = new Set(IE.allQ(t).filter(x => !IE.isOk(x.g, x.q, rec.a[x.q.n])).map(x => x.q.p));
  const withSeek = t2 => t2; // savol bloklari uchun “tinglash” tugmasi pastda qo‘shiladi
  let html = (IE.keyList ? IE.keyList(t, rec.a || {}) : '') + IE.groupsHTML(t, rec.a || {}, true);
  html = html.replace(/<(div|li) class="q (ok|no)" id="q(\d+)">/g, (m0, tg, cls, n) => { const q = IE.allQ(t).find(x => x.q.n === +n).q; return m0 + (q.t != null ? '<button class="chip lseekb" data-a="lgo" data-t="' + q.t + '">' + ic('play') + ' ' + mmss(q.t) + ' dan tinglash</button>' : ''); });
  const inner = (IE.partNav ? '<div class="pad">' + IE.partNav(t, 'l') + '</div>' : '') + '<div class="lsticky">' + player(t, 'practice') + '</div><div class="res anim"><div class="lbl">Taxminiy band</div><div class="big">' + IE.bandTxt(rec.band) + '</div><div class="mu" style="margin-top:8px">' + rec.raw + ' / ' + rec.tot + ' to‘g‘ri (' + pc + '%)</div></div>' + (IE.anaCta ? IE.anaCta(rec, 'L') : '') +
    (t.tr && t.tr.length ? '<div class="pad"><details class="card tr"><summary>' + ic('doc') + ' Transkript (' + t.tr.length + ' abzats)' + (t.tr.some(p => p.t != null) ? ' — bosib shu joydan tinglang' : '') + '</summary>' + t.tr.map((p, i) => p.t != null ? '<p class="trp' + (wrong.has(i) ? ' wr' : '') + '" data-a="lgo" data-t="' + Math.max(0, p.t - 0.5) + '"><b>' + mmss(p.t) + '</b> ' + esc(p.x) + '</p>' : '<p class="trp' + (wrong.has(i) ? ' wr' : '') + '">' + esc(p.x) + '</p>').join('') + '</details>' +
    '<p class="mu xs" style="margin:10px 2px">Qizil chiziq — xato javob berilgan joylar.</p></div>' : '') + html +
    '<div class="pad" style="margin-top:8px"><div class="two"><button class="btn ghost" data-go="' + (IE.mockActive && IE.mockActive() ? 'mock' : 'listening') + '">' + (IE.mockActive && IE.mockActive() ? 'Mock testga qaytish' : 'Boshqa audio') + '</button><button class="btn" data-a="lretry" data-id="' + t.id + '">Qayta urinish</button></div>' + (IE.rcBtn ? IE.rcBtn({ kicker: 'Listening natijasi', big: IE.bandTxt(rec.band), bigLabel: 'Taxminiy band', sub: rec.raw + ' / ' + rec.tot, rows: [[String(t.title || t.topic || '').slice(0, 26), rec.raw + '/' + rec.tot]], foot: 'IELTS Academic · Listening' }) : '') +
    creditP(t, 14, ' — ommaviy mulk.') + '</div>';
  const o = sub('Natija', 'listening', inner); o.mount = () => { wirePlayer(t, 'practice'); }; return o;
}
A.lretry = el => { try { localStorage.removeItem(lk(el.dataset.id)); } catch (e) { /* */ } V.l = null; IE.go('listening/' + el.dataset.id); };
})();
