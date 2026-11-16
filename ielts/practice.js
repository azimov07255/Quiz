/* IELTS · BY AZIMOV — Shadowing (eshitib takrorlash) va Dictation (eshitib yozish): VOA maqolalaridagi gap vaqtlari asosida. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$ } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const sub = (title, back, inner, right) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + '</header><div class="scr sub">' + inner + '</div>', sub: true });

/* gaplar: audio vaqti bilan (juda qisqa/uzunlari tashlab ketiladi) */
function sentsOf(m) {
  const all = []; m.blocks.forEach(b => { if (b.s) b.s.forEach(s => all.push({ t: s[0], x: s[1] })); });
  return all.map((s, i) => Object.assign({}, s, { e: i + 1 < all.length ? all[i + 1].t : m.dur })).filter(s => { const n = s.x.split(/\s+/).length; return n >= 5 && n <= 30 && s.e - s.t > 1.2; });
}
const art = id => D.articles.items.find(x => x.id === id);

/* gap bo‘lagini ijro etish: Promise — tugaganda hal bo‘ladi */
function playSeg(a, t0, t1, rate) {
  return new Promise(res => {
    if (V.segStop) V.segStop();
    a.playbackRate = rate || 1; a.currentTime = Math.max(0, t0);
    const fin = () => { a.removeEventListener('timeupdate', on); a.removeEventListener('pause', fin); V.segStop = null; try { a.pause(); } catch (e) { /* */ } res(); };
    const on = () => { if (a.currentTime >= t1 - 0.04) fin(); };
    V.segStop = fin; a.addEventListener('timeupdate', on);
    a.play().catch(() => { IE.toast('Audio boshlanmadi — qayta bosing'); fin(); });
  });
}

/* ---------- umumiy markaz ---------- */
function hub(kind) {
  const title = kind === 'shadow' ? 'Shadowing' : 'Dictation', icon = kind === 'shadow' ? 'spk' : 'wave', sk = kind === 'shadow' ? 'S' : 'L';
  const info = kind === 'shadow' ? 'Gapni tinglang, so‘ng diktor kabi talaffuz va ohang bilan darrov takrorlang. O‘zingizni yozib olib, original bilan solishtiring.' : 'Gapni tinglab, eshitganingizni yozing. Dastur so‘zma-so‘z tekshiradi va xatolarni ko‘rsatadi.';
  return sub(title, 'tools', '<div class="pad"><div class="card rise" style="margin-bottom:14px"><div class="row">' + bd(icon, sk, 'lg') + '<div style="flex:1"><b style="font-size:16px">' + title + '</b><div class="sm mu">' + info + '</div></div></div></div><div class="lst">' +
    D.articles.items.map(m => '<button class="item rise" data-go="' + kind + '/' + m.id + '"><div class="aimg" style="width:54px;height:54px;border-radius:14px;flex:none;background-image:url(\'' + esc(m.img.src) + '\')"></div><div class="tx"><b>' + esc(m.topic.split(' · ')[1] || m.title) + '</b><span>' + sentsOf(m).length + ' ta gap · ' + esc(m.level) + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div></div>');
}

/* ---------- SHADOWING ---------- */
R.shadow = a => a[0] && art(a[0]) ? shadow(art(a[0])) : hub('shadow');
function shadow(m) {
  const ss = sentsOf(m); if (!V.sh || V.sh.id !== m.id) V.sh = { id: m.id, i: 0, rate: 1, rec: false, url: '' };
  const st = V.sh, s = ss[st.i];
  const inner = '<div class="pad"><audio id="sau" src="' + esc(m.audio) + '" data-alt="' + esc(m.alt || '') + '" preload="auto" playsinline></audio><div class="prog" style="margin:4px 0 6px"><i style="width:' + ((st.i + 1) / ss.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:10px">' + (st.i + 1) + ' / ' + ss.length + '</div>' +
    '<div class="qcard" style="font:600 20px/1.5 Georgia,serif;text-align:left;place-items:start">' + esc(s.x) + '</div>' +
    '<div class="row" style="justify-content:center;gap:10px;margin:16px 0 4px"><button class="btn" data-a="shplay">' + ic('play') + ' Eshitish</button><button class="btn ghost" data-a="shrate" id="shr">' + (st.rate === 1 ? '1×' : '0.75×') + '</button></div>' +
    '<p class="hint c" style="justify-content:center">' + ic('bulb') + ' Avval tinglang, keyin mikrofonni bosib darrov takrorlang.</p>' +
    '<div class="rec"><button class="mic' + (st.rec ? ' on' : '') + '" data-a="shrec" aria-label="Yozib olish">' + ic(st.rec ? 'stop' : 'mic') + '</button></div>' +
    (st.url ? '<audio id="uau" controls src="' + st.url + '"></audio><button class="btn block ghost" style="margin-top:10px" data-a="shcmp">' + ic('back2') + ' Original → mening ovozim</button>' : '') +
    '<div class="two" style="margin-top:18px"><button class="btn ghost" data-a="shn" data-d="-1"' + (st.i ? '' : ' disabled') + '>Oldingi</button><button class="btn" data-a="shn" data-d="1">' + (st.i + 1 >= ss.length ? 'Tugatish' : 'Keyingi') + '</button></div></div>';
  const o = sub('Shadowing', 'shadow', inner); o.mount = () => { if (IE.guardAudio) IE.guardAudio(document.getElementById('sau')); }; return o;
}
const shS = () => { const m = art(V.sh.id); return { m, s: sentsOf(m)[V.sh.i], a: $('#sau') }; };
A.shplay = () => { const { s, a } = shS(); if (!a) return; if (V.sh.rec) return IE.toast('Avval yozishni to‘xtating'); playSeg(a, s.t - IE.artShift(V.sh.id) - 0.1, s.e - IE.artShift(V.sh.id) + 0.15, V.sh.rate); };
A.shrate = () => { V.sh.rate = V.sh.rate === 1 ? 0.75 : 1; const b = $('#shr'); if (b) b.textContent = V.sh.rate === 1 ? '1×' : '0.75×'; };
A.shrec = async () => {
  const st = V.sh; const a = $('#sau'); if (a) a.pause();
  if (st.rec) { const url = await IE.rec.stop(); st.rec = false; if (url) st.url = url; return IE.draw(false); }
  try { await IE.rec.start(); st.rec = true; st.url = ''; IE.draw(false); } catch (e) { IE.toast(e && e.name === 'NotAllowedError' ? 'Mikrofonga ruxsat berilmadi' : (e.message || 'Yozib bo‘lmadi')); }
};
A.shcmp = async () => { const { s, a } = shS(), u = $('#uau'); if (!a || !u) return; await playSeg(a, s.t - IE.artShift(V.sh.id) - 0.1, s.e - IE.artShift(V.sh.id) + 0.15, V.sh.rate); u.currentTime = 0; u.play().catch(() => {}); };
A.shn = async el => {
  const st = V.sh, ss = sentsOf(art(st.id)), d = +el.dataset.d; if (st.rec) { await IE.rec.stop(); st.rec = false; }
  if (st.i + d >= ss.length) { IE.touchDay(); IE.save(); IE.toast('Shadowing tugadi — barakalla!'); IE.confetti(); V.sh = null; return IE.go('shadow'); }
  st.i = Math.max(0, st.i + d); st.url = ''; IE.draw(false); window.scrollTo(0, 0);
};

/* ---------- DICTATION ---------- */
R.dictation = a => a[0] && art(a[0]) ? dictation(art(a[0])) : hub('dictation');
function dictation(m) {
  const ss = sentsOf(m); if (!V.dc || V.dc.id !== m.id) V.dc = { id: m.id, i: 0, rate: 1, checked: null, val: '', pct: [] };
  const st = V.dc, s = ss[st.i], ck = st.checked;
  const inner = '<div class="pad"><audio id="sau" src="' + esc(m.audio) + '" data-alt="' + esc(m.alt || '') + '" preload="auto" playsinline></audio><div class="prog" style="margin:4px 0 6px"><i style="width:' + ((st.i + (ck ? 1 : 0)) / ss.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:10px">' + (st.i + 1) + ' / ' + ss.length + (st.pct.length ? ' · o‘rtacha ' + Math.round(st.pct.reduce((x, y) => x + y, 0) / st.pct.length) + '%' : '') + '</div>' +
    '<div class="row" style="justify-content:center;gap:10px;margin:6px 0 12px"><button class="btn" data-a="dcplay">' + ic('play') + ' Tinglash</button><button class="btn ghost" data-a="dcrate" id="dcr">' + (st.rate === 1 ? '1×' : '0.75×') + '</button></div>' +
    (ck ? '<div class="card dres"><div class="lbl mu xs b" style="letter-spacing:.1em;text-transform:uppercase">Natija: ' + ck.pct + '%</div><p class="dtx">' + ck.html + '</p>' + (ck.extra.length ? '<p class="sm mu">Ortiqcha so‘zlar: <b style="color:var(--bad)">' + esc(ck.extra.join(' ')) + '</b></p>' : '') + '</div>' : '') +
    '<textarea class="ed" id="dct" data-in="dct" style="min-height:120px;font:17px/1.5 Georgia,serif" placeholder="Eshitganingizni yozing…" autocapitalize="off" spellcheck="false"' + (ck ? ' readonly' : '') + '>' + esc(st.val) + '</textarea>' +
    '<div class="two" style="margin-top:12px">' + (ck ? '<button class="btn ghost" data-a="dcagain">Qayta</button><button class="btn" data-a="dcnext">' + (st.i + 1 >= ss.length ? 'Tugatish' : 'Keyingi') + '</button>' : '<button class="btn ghost" data-a="dchint">Birinchi so‘z</button><button class="btn" data-a="dccheck">Tekshirish</button>') + '</div></div>';
  const o = sub('Dictation', 'dictation', inner); o.mount = () => { if (IE.guardAudio) IE.guardAudio(document.getElementById('sau')); }; return o;
}
IE.dct = el => { if (V.dc) V.dc.val = el.value; };
const dS = () => { const m = art(V.dc.id); return { m, s: sentsOf(m)[V.dc.i], a: $('#sau') }; };
A.dcplay = () => { const { s, a } = dS(); if (a) playSeg(a, s.t - IE.artShift(V.dc.id) - 0.1, s.e - IE.artShift(V.dc.id) + 0.15, V.dc.rate); };
A.dcrate = () => { V.dc.rate = V.dc.rate === 1 ? 0.75 : 1; const b = $('#dcr'); if (b) b.textContent = V.dc.rate === 1 ? '1×' : '0.75×'; };
A.dchint = () => { const { s } = dS(); IE.toast('Gap “' + s.x.split(/\s+/)[0] + '” so‘zi bilan boshlanadi'); };
const norm = w => w.toLowerCase().replace(/[’‘]/g, '\'').replace(/[^a-z0-9']/g, '');
function diff(orig, user) {
  const O = orig.split(/\s+/), U = user.split(/\s+/).map(norm).filter(Boolean), n = O.length, m = U.length;
  const L = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) L[i][j] = norm(O[i]) === U[j] ? L[i + 1][j + 1] + 1 : Math.max(L[i + 1][j], L[i][j + 1]);
  const okI = new Set(), usedJ = new Set(); let i = 0, j = 0;
  while (i < n && j < m) { if (norm(O[i]) === U[j]) { okI.add(i); usedJ.add(j); i++; j++; } else if (L[i + 1][j] >= L[i][j + 1]) i++; else j++; }
  return { html: O.map((w, k) => '<span class="' + (okI.has(k) ? 'dok' : 'dno') + '">' + esc(w) + '</span>').join(' '), pct: Math.round(okI.size / n * 100), extra: U.filter((x, q) => !usedJ.has(q)).slice(0, 8) };
}
A.dccheck = () => { const { s } = dS(), ta = $('#dct'), v = ta ? ta.value.trim() : ''; if (v.length < 3) return IE.toast('Avval eshitganingizni yozing'); V.dc.val = v; const d = diff(s.x, v); V.dc.checked = d; V.dc.pct.push(d.pct); if (d.pct >= 80) IE.confetti(); IE.draw(false); };
A.dcagain = () => { const st = V.dc; st.pct.pop(); st.checked = null; IE.draw(false); };
A.dcnext = () => { const st = V.dc, ss = sentsOf(art(st.id)); if (st.i + 1 >= ss.length) { const avg = Math.round(st.pct.reduce((x, y) => x + y, 0) / Math.max(1, st.pct.length)); IE.touchDay(); IE.save(); IE.toast('Dictation tugadi — o‘rtacha ' + avg + '%'); if (avg >= 70) IE.confetti(); V.dc = null; return IE.go('dictation'); } st.i++; st.checked = null; st.val = ''; IE.draw(false); window.scrollTo(0, 0); };
})();
