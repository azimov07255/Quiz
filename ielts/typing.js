/* IELTS · Typing: klaviatura tezligi va aniqligi (kompyuterda topshiriladigan Writing uchun). WPM, aniqlik, rekordlar, tarix. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $ } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const sub = (title, back, inner) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1></header><div class="scr sub">' + inner + '</div>', sub: true });
const MODES = {
  quick: { n: '1 daqiqalik test', d: 'Tasodifiy jumlalar · vaqt bilan', secs: 60, ic: 'clock', k: 'W' },
  sprint: { n: 'Writing sprint', d: '3 daqiqa · uzun matn, imtihon ritmi', secs: 180, ic: 'pen', k: 'R' },
  words: { n: 'IELTS so‘zlari', d: '25 ta so‘z · ma’nosi ko‘rsatiladi', secs: 0, ic: 'cards', k: 'V' },
  para: { n: 'Abzats ko‘chirish', d: 'Bitta Reading abzatsi · tugaguncha', secs: 0, ic: 'book', k: 'L' },
};
const clean = t => String(t || '').replace(/[’‘`´]/g, '\'').replace(/[“”]/g, '"').replace(/[—–]/g, '-').replace(/…/g, '...').replace(/ /g, ' ').replace(/[^\x20-\x7E]/g, '').replace(/\s+/g, ' ').trim();
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
let CORP = null;
function corpus() {
  if (CORP && CORP.n === D.reading.passages.length) return CORP;
  const sents = [], paras = [], words = [];
  D.reading.passages.forEach(p => p.paras.forEach(pa => { const t = clean(pa.t); if (t.length >= 200 && t.length <= 520) paras.push(t); (t.match(/[^.!?]+[.!?]+/g) || []).forEach(x => { x = x.trim(); if (x.length >= 45 && x.length <= 150) sents.push(x); }); }));
  D.vocab.topics.forEach(t => t.words.forEach(w => { const e = clean(w.ex); if (e.length >= 40 && e.length <= 150) sents.push(e); if (/^[a-z][a-z \-']+$/i.test(w.w)) words.push({ w: w.w.toLowerCase(), uz: w.uz }); }));
  S().my.forEach(w => { if (/^[a-z][a-z \-']+$/i.test(w.w || '') && w.uz) words.push({ w: w.w.toLowerCase(), uz: w.uz }); });
  return CORP = { n: D.reading.passages.length, sents, paras, words };
}
function build(mode) {
  const c = corpus();
  if (mode === 'quick' || mode === 'sprint') { const need = mode === 'quick' ? 700 : 1800; let out = ''; for (const s of shuf(c.sents)) { out += (out ? ' ' : '') + s; if (out.length >= need) break; } return { text: out, hints: null }; }
  if (mode === 'para') return { text: shuf(c.paras)[0] || shuf(c.sents).slice(0, 3).join(' '), hints: null };
  const ws = shuf(c.words).slice(0, 25); return { text: ws.map(x => x.w).join(' '), hints: ws };
}
const ty = () => V.ty || (V.ty = { phase: 'hub' });

/* ---------- markaz ---------- */
const recs = () => (S().typ || []).slice().sort((a, b) => a.ts - b.ts);
const best = () => recs().reduce((m, r) => Math.max(m, r.wpm || 0), 0);
function rate(w) { return w >= 70 ? ['Mutaxassis', '#f43f5e'] : w >= 50 ? ['Ajoyib', '#f97316'] : w >= 35 ? ['Yaxshi', '#10b981'] : w >= 20 ? ['O‘rta', '#3b82f6'] : ['Boshlovchi', '#8b5cf6']; }
R.typing = a => {
  if (a[0] === 'run') return run(a[1] in MODES ? a[1] : 'quick');
  const rc = recs(), last = rc.slice(-12), bw = best(), avg = rc.slice(-5).length ? Math.round(rc.slice(-5).reduce((s, r) => s + r.wpm, 0) / rc.slice(-5).length) : 0, mx = Math.max(20, ...last.map(r => r.wpm));
  const o = sub('Typing', 'tools', '<div class="pad"><div class="tyhero rise"><div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.8)">Eng yaxshi natija</div><div class="ty-big">' + bw + '<small> WPM</small></div><div class="sm" style="opacity:.9">' + (bw ? rate(bw)[0] + ' · o‘rtacha (so‘nggi 5): ' + avg : 'Birinchi testni boshlang!') + '</div></div><div class="ty-ico">' + ic('type') + '</div></div>' +
    '<div class="stats rise" style="margin-top:12px"><div class="stat"><b>' + rc.length + '</b><span>Test</span></div><div class="stat"><b>' + (rc.length ? Math.round(rc.slice(-5).reduce((s, r) => s + r.acc, 0) / rc.slice(-5).length) + '%' : '—') + '</b><span>Aniqlik</span></div><div class="stat"><b>' + Math.round(rc.reduce((s, r) => s + (r.secs || 0), 0) / 60) + '</b><span>Daqiqa</span></div></div>' +
    '<div class="sec"><h2>Rejim tanlang</h2></div><div class="lst">' + Object.entries(MODES).map(([k, m]) => '<button class="item rise" data-a="tymode" data-m="' + k + '">' + bd(m.ic, m.k) + '<div class="tx"><b>' + m.n + '</b><span>' + m.d + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>' +
    (last.length > 1 ? '<div class="sec"><h2>So‘nggi natijalar</h2></div><div class="card"><div class="tychart">' + last.map(r => '<div title="' + r.wpm + ' WPM"><i style="height:' + Math.max(8, Math.round(r.wpm / mx * 100)) + '%;background:' + rate(r.wpm)[1] + '"></i><small>' + r.wpm + '</small></div>').join('') + '</div></div>' : '') +
    '<div class="card" style="margin-top:12px"><div class="row">' + bd('bulb', 'T', 'sm') + '<div style="flex:1"><b>Nega muhim?</b><div class="sm mu" style="margin-top:2px">Kompyuterda topshiriladigan IELTS’da Writing klaviaturada yoziladi. 25–30 WPM bo‘lsa, 250 so‘zni ~10 daqiqada yozib bo‘lasiz — qolgan vaqt rejalash va tekshirishga qoladi. Kuniga 5 daqiqa yetarli.</div></div></div></div>' +
    (matchMedia('(pointer:coarse)').matches ? '<p class="hint" style="margin-top:12px">' + ic('bulb') + ' Telefonda ham ishlaydi, lekin klaviaturali qurilmada mashq qilsangiz natija haqiqiy imtihonga yaqinroq bo‘ladi.</p>' : '') + '</div>');
  return o;
};
A.tymode = el => { const m = el.dataset.m, b = build(m); V.ty = { phase: 'ready', mode: m, text: b.text, hints: b.hints, typed: '', errs: 0, ks: 0, miss: {}, t0: 0, secs: MODES[m].secs }; IE.go('typing/run/' + m); };

/* ---------- mashq ---------- */
function run(mode) {
  let t = ty(); if (t.mode !== mode || !t.text) { const b = build(mode); V.ty = t = { phase: 'ready', mode, text: b.text, hints: b.hints, typed: '', errs: 0, ks: 0, miss: {}, t0: 0, secs: MODES[mode].secs }; }
  const m = MODES[mode];
  if (t.phase === 'done') return resultH(t, m);
  const inp = '<textarea id="tyin" class="tyin" data-in="tyin" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false" aria-label="Yozish maydoni"></textarea>';
  const head = '<div class="tystat"><div><small>Vaqt</small><b id="tytime">' + (t.secs ? fmtS(t.secs) : '0:00') + '</b></div><div><small>WPM</small><b id="tywpm">0</b></div><div><small>Aniqlik</small><b id="tyacc">100%</b></div></div>';
  const o = sub(m.n, 'typing', '<div class="pad">' + head + '<div id="tyhint" class="tyhint">' + (t.hints ? '&nbsp;' : '') + '</div><div class="tybox" id="tybox" data-a="tyfocus">' + textH(t) + '</div>' + inp +
    (t.phase === 'ready' ? '<button class="btn block pgo" style="margin-top:14px" data-a="tystart">' + ic('play') + ' Boshlash</button><p class="hint" style="margin-top:12px">' + ic('bulb') + ' “Boshlash”ni bosing va yozishni boshlang — taymer birinchi harfdan ishga tushadi. Xato qilsangiz Backspace bilan tuzatishingiz mumkin (xato hisoblanadi).</p>' : '<div class="two" style="margin-top:14px"><button class="btn ghost" data-a="tyredo">Qayta</button><button class="btn ghost" data-a="tyfin">Yakunlash</button></div>') + '</div>');
  o.mount = () => { if (t.phase === 'run') { const i = $('#tyin'); if (i) { i.focus(); i.value = t.typed; } paint(); IE.every(200, tick); } };
  return o;
}
const fmtS = s => Math.floor(Math.max(0, s) / 60) + ':' + String(Math.max(0, Math.ceil(s) % 60)).padStart(2, '0');
const textH = t => { const x = t.typed, tx = t.text; let h = ''; for (let i = 0; i < tx.length; i++) { const ch = tx[i], y = x[i]; const cls = y == null ? (i === x.length && t.phase === 'run' ? 'cur' : '') : (y === ch ? 'ok' : 'bad'); h += '<span' + (cls ? ' class="' + cls + '"' : '') + '>' + (ch === ' ' && cls === 'bad' ? '·' : esc(ch)) + '</span>'; } return h; };
const stats = t => { const el = Math.max(3, (Date.now() - t.t0) / 1000), ok = [...t.typed].filter((c, i) => c === t.text[i]).length; return { el, ok, wpm: Math.round(ok / 5 / (el / 60)), acc: t.ks ? Math.max(0, Math.round((t.ks - t.errs) / t.ks * 100)) : 100 }; };
function paint() {
  const t = V.ty, box = $('#tybox'); if (!t || !box || t.phase !== 'run') return; box.innerHTML = textH(t); const cur = box.querySelector('.cur'); if (cur) { const top = cur.offsetTop - box.offsetTop; if (top > box.clientHeight - 56 || top < box.scrollTop) box.scrollTop = Math.max(0, top - 36); }
  if (t.hints) { const wi = t.typed.split(' ').length - 1, h = t.hints[Math.min(wi, t.hints.length - 1)], e = $('#tyhint'); if (e && h) e.innerHTML = '<b>' + esc(h.w) + '</b> — ' + esc(h.uz); }
}
function tick() {
  const t = V.ty; if (!t || t.phase !== 'run' || !t.t0) return; const s = stats(t), tm = $('#tytime'), w = $('#tywpm'), a = $('#tyacc');
  if (tm) tm.textContent = t.secs ? fmtS(t.secs - s.el) : fmtS(s.el); if (w) w.textContent = s.wpm; if (a) a.textContent = s.acc + '%';
  if (t.secs && s.el >= t.secs) finish();
}
IE.tyin = el => {
  const t = V.ty; if (!t || t.phase !== 'run') return; let v = el.value.replace(/\n/g, ' ');
  if (v.length > t.text.length) v = v.slice(0, t.text.length);
  if (!t.t0) t.t0 = Date.now();
  if (v.length > t.typed.length) { for (let i = t.typed.length; i < v.length; i++) { t.ks++; if (v[i] !== t.text[i]) { t.errs++; const c = t.text[i]; t.miss[c] = (t.miss[c] || 0) + 1; } } }
  t.typed = v; paint(); tick();
  if (!t.secs && v.length >= t.text.length) finish();
};
A.tyfocus = () => { const i = $('#tyin'); if (i) i.focus(); };
A.tystart = () => { const t = V.ty; if (!t) return; t.phase = 'run'; t.typed = ''; t.t0 = 0; IE.draw(false); };
A.tyredo = () => { const m = V.ty && V.ty.mode; if (m) A.tymode({ dataset: { m } }); };
A.tyfin = () => { const t = V.ty; if (!t || !t.t0) return IE.toast('Avval yozishni boshlang'); finish(); };
function finish() {
  const t = V.ty; if (!t || t.phase !== 'run') return; const s = stats(t), el = t.secs ? Math.min(t.secs, s.el) : s.el, prevBest = best();
  t.phase = 'done'; t.res = { wpm: s.wpm, acc: s.acc, secs: Math.round(el), chars: t.typed.length, errs: t.errs, ok: s.ok, newBest: s.wpm > prevBest && prevBest > 0 };
  S().typ.push({ ts: Date.now(), mode: t.mode, wpm: s.wpm, acc: s.acc, secs: Math.round(el), chars: t.typed.length }); if (S().typ.length > 300) S().typ = S().typ.slice(-300);
  IE.touchDay(); IE.save(true); IE.vib([20, 40, 20]); if (t.res.newBest || (s.acc >= 95 && s.wpm >= 30)) IE.confetti();
  IE.draw(false);
}
function resultH(t, m) {
  const r = t.res, rt = rate(r.wpm), miss = Object.entries(t.miss).sort((a, b) => b[1] - a[1]).slice(0, 6), need250 = r.wpm ? Math.max(1, Math.round(250 / r.wpm)) : '—', plan = IE.planToday ? null : null;
  return sub('Natija', 'typing', '<div class="pad"><div class="tyres rise"><div class="tr-badge" style="--c:' + rt[1] + '">' + rt[0] + '</div><div class="ty-big" style="margin-top:6px">' + r.wpm + '<small> WPM</small></div>' + (r.newBest ? '<div class="chip" style="background:#fbbf24;color:#3b2a00;margin-top:8px">🏆 Yangi rekord!</div>' : '') + '</div>' +
    '<div class="stats rise" style="margin-top:12px"><div class="stat"><b>' + r.acc + '%</b><span>Aniqlik</span></div><div class="stat"><b>' + fmtS(r.secs) + '</b><span>Vaqt</span></div><div class="stat"><b>' + r.errs + '</b><span>Xato</span></div><div class="stat"><b>' + Math.round(r.ok / 5) + '</b><span>So‘z</span></div></div>' +
    '<div class="card" style="margin-top:12px"><div class="row">' + bd('pen', 'W', 'sm') + '<div style="flex:1"><b>Writing uchun</b><div class="sm mu">Shu tezlikda 250 so‘zlik inshoni faqat yozishga ≈ <b>' + need250 + ' daqiqa</b> ketadi (imtihonda 40 daqiqa bor).</div></div></div></div>' +
    (miss.length ? '<div class="card" style="margin-top:12px"><b>Eng ko‘p adashgan belgilar</b><div class="tymiss">' + miss.map(([c, n]) => '<span><i>' + (c === ' ' ? '␣' : esc(c)) + '</i>' + n + '</span>').join('') + '</div></div>' : '<div class="card c" style="margin-top:12px"><b>Xatosiz!</b> <span class="mu sm">Aniqlik mukammal 👏</span></div>') +
    '<div class="two" style="margin-top:14px"><button class="btn ghost" data-go="typing">Rejimlar</button><button class="btn" data-a="tyredo">' + ic('refresh') + ' Yana</button></div></div>');
}
})();
