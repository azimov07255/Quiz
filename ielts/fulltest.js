/* IELTS · To‘liq imtihon rejimi (Cambridge testlari) va Scores sahifasi.
   To‘liq rejim: Listening 4 qism ketma-ket (audio bir marta) → Reading (60 daqiqa umumiy vaqt) → umumiy band. Eski usul (qismlarni alohida topshirish) ham saqlanadi. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), A = IE.act, V = IE.V, D = IE.D;
const sub = (title, back, inner) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1></header><div class="scr sub">' + inner + '</div>', sub: true });
const FK = 'ielts:ft', ft = () => lsGet(FK, null), setFt = o => { try { o ? lsSet(FK, o) : localStorage.removeItem(FK); } catch (e) { /* */ } };
const grp = (book, n) => { const g = IE.camGroups().books.find(b => b[0] === book); return g && g[1].get(n); };
const ids = (t, k) => Object.values(t[k]).map(u => u.id);
const clearRuns = t => ids(t, 'L').forEach(i => { try { localStorage.removeItem('ielts:lrun:' + i); } catch (e) { /* */ } }) || ids(t, 'R').forEach(i => { try { localStorage.removeItem('ielts:run:' + i); } catch (e) { /* */ } });
const fmt = s => Math.floor(Math.max(0, s) / 60) + ':' + String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');

/** Shu birlik hozir faol to‘liq imtihonning joriy bosqichiga tegishlimi? */
IE.ftOn = (kind, id) => { const f = ft(); if (!f || f.phase !== kind || !f.skills.includes(kind)) return false; const t = grp(f.book, f.n); return !!t && ids(t, kind).includes(id); };
IE.ftLeft = (r, kind) => (kind === 'R' && IE.ftOn('R', r.id) && ft().tR) ? 3600 - (Date.now() - ft().tR) / 1000 : 1200 - (Date.now() - r.t0) / 1000;
IE.ftBanner = kind => { const f = ft(); if (!f || !IE.ftOn(kind, (V.l && V.l.id) || (V.run && V.run.id) || '')) return ''; return '<div class="ftb">' + ic('clock') + ' <b>To‘liq imtihon</b> · ' + (kind === 'L' ? 'Listening, Section ' + f.li + '/4' : 'Reading · 60 daqiqa umumiy vaqt') + '</div>'; };

function open(f) {
  const t = grp(f.book, f.n); if (!t) return IE.toast('Test topilmadi');
  if (f.phase === 'L') { const u = t.L[f.li]; V.lmode = 'exam'; A.lstart({ dataset: { id: u.id } }); }
  else { if (!f.tR) { f.tR = Date.now(); setFt(f); } const u = t.R[1] || Object.values(t.R)[0]; IE.go('reading/' + u.id + '/run'); }
}
A.ftstart = el => {
  const book = decodeURIComponent(el.dataset.b), n = +el.dataset.n, sk = el.dataset.s.split(''), t = grp(book, n); if (!t) return;
  const go = () => { clearRuns(t); const f = { book, n, skills: sk, phase: sk[0], li: 1, tR: 0, t0: Date.now(), parts: {} }; setFt(f); open(f); };
  const old = ft(); if (old && (old.book !== book || old.n !== n)) return IE.ask('Boshqa imtihon davom etmoqda', 'Yangisini boshlasangiz, oldingisi bekor qilinadi.', 'Yangisini boshlash', go);
  go();
};
A.ftresume = () => { const f = ft(); if (f) open(f); };
A.ftcancel = () => IE.ask('Imtihonni bekor qilasizmi?', 'Shu urinish natijasi hisoblanmaydi (topshirilgan qismlar tarixda qoladi).', 'Bekor qilish', () => { setFt(null); IE.draw(false); });
A.ftgoR = () => { const f = ft(); if (!f) return; f.phase = 'R'; f.tR = Date.now(); setFt(f); IE.closeSheet(); open(f); };

IE.ftListenSubmit = (t, rec) => {
  const f = ft(); if (!f || f.phase !== 'L') return false; const tt = grp(f.book, f.n), e = tt && Object.entries(tt.L).find(([, u]) => u.id === t.id); if (!e) return false;
  f.parts['L' + e[0]] = { raw: rec.raw, tot: rec.tot }; const next = +e[0] + 1;
  if (tt.L[next]) { f.li = next; setFt(f); IE.toast('Section ' + next + ' boshlanmoqda'); open(f); return true; }
  if (f.skills.includes('R')) { f.phase = 'R'; setFt(f); IE.go('cambridge/t/' + encodeURIComponent(f.book) + '/' + f.n); setTimeout(() => IE.sheet('<h2>Listening tugadi ✔</h2><p class="mu" style="margin:6px 0 16px">Endi Reading: 3 ta passage, umumiy vaqt <b>60 daqiqa</b>. Passage’lar orasida erkin o‘tishingiz mumkin. Tayyormisiz?</p><button class="btn block" data-a="ftgoR">' + ic('play') + ' Reading’ni boshlash</button>'), 250); return true; }
  finish(f); return true;
};
/** Reading'ni yakunlash: hamma passage topshiriladi. */
IE.ftReadSubmit = auto => {
  const f = ft(); if (!f || f.phase !== 'R' || !V.run || !IE.ftOn('R', V.run.id)) return false; const t = grp(f.book, f.n); if (!t) return false;
  Object.entries(t.R).forEach(([i, u]) => {
    const st = lsGet('ielts:run:' + u.id, null), ans = (st && st.ans) || {}, qs = IE.allQ(u), raw = qs.filter(x => IE.isOk(x.g, x.q, ans[x.q.n])).length;
    S().reads.push({ ts: Date.now() + (+i), p: u.id, raw, tot: qs.length, band: IE.band(raw, qs.length), secs: Math.min(3600, Math.round((Date.now() - f.tR) / 1000)), a: ans }); f.parts['R' + i] = { raw, tot: qs.length };
    try { localStorage.removeItem('ielts:run:' + u.id); } catch (e) { /* */ }
  });
  V.run = null; if (auto) IE.toast('Vaqt tugadi — Reading topshirildi'); finish(f); return true;
};
function finish(f) {
  const sum = k => Object.entries(f.parts).filter(([x]) => x[0] === k).reduce((a, [, p]) => ({ raw: a.raw + p.raw, tot: a.tot + p.tot }), { raw: 0, tot: 0 });
  const L = f.skills.includes('L') ? sum('L') : null, Rr = f.skills.includes('R') ? sum('R') : null;
  if (L) L.band = IE.bandL(L.raw, L.tot); if (Rr) Rr.band = IE.band(Rr.raw, Rr.tot);
  const bs = [L && L.band, Rr && Rr.band].filter(x => x != null), overall = bs.length ? Math.round(bs.reduce((a, b) => a + b, 0) / bs.length * 2) / 2 : null;
  S().ftests.push({ ts: Date.now(), book: f.book, n: f.n, skills: f.skills.join(''), L, R: Rr, overall, secs: Math.round((Date.now() - f.t0) / 1000) }); IE.touchDay(); IE.save(true); setFt(null);
  IE.confetti(); IE.vib([30, 50, 30]); IE.go('cambridge/s/' + encodeURIComponent(f.book) + '/' + f.n);
}

/* ---------- Test sahifasidagi karta: rejim tanlash ---------- */
IE.ftCard = (book, n, t) => {
  const f = ft(), me = f && f.book === book && f.n === n, e = encodeURIComponent(book), lOk = [1, 2, 3, 4].every(i => t.L[i] && t.L[i].dur > 0), rOk = [1, 2, 3].every(i => t.R[i]);
  if (me) return '<div class="card ftc" style="margin-top:12px"><div class="row">' + bd('clock', 'M') + '<div style="flex:1"><b>Imtihon davom etmoqda</b><div class="sm mu">' + (f.phase === 'L' ? 'Listening · Section ' + f.li + '/4' : 'Reading · qolgan vaqt ' + fmt(3600 - (Date.now() - f.tR) / 1000)) + '</div></div></div><div class="two" style="margin-top:10px"><button class="btn" data-a="ftresume">Davom etish</button><button class="btn ghost" data-a="ftcancel">Bekor qilish</button></div></div>';
  const b = (s, lab, ok) => '<button class="btn' + (s === 'LR' ? '' : ' ghost') + ' sm" ' + (ok ? 'data-a="ftstart" data-b="' + e + '" data-n="' + n + '" data-s="' + s + '"' : 'disabled') + '>' + lab + '</button>';
  return '<div class="card ftc" style="margin-top:12px"><div class="row">' + bd('trophy', 'M') + '<div style="flex:1"><b>Haqiqiy imtihon rejimi</b><div class="sm mu">Listening: 4 qism ketma-ket, audio bir marta. Reading: 3 passage, 60 daqiqa umumiy vaqt. Oxirida umumiy band.</div></div></div>' +
    '<div class="ftb3">' + b('LR', 'Listening + Reading', lOk && rOk) + b('L', 'Faqat Listening', lOk) + b('R', 'Faqat Reading', rOk) + '</div>' + (!lOk ? '<p class="sm" style="margin:8px 0 0;color:var(--warn)">Listening uchun 4 ta Section va audiolari kerak.</p>' : '') +
    '<p class="mu xs" style="margin:10px 2px 0">Eski usul: pastdagi qismlarni alohida-alohida topshiring.</p></div>';
};

/* ---------- Scores sahifasi ---------- */
IE.camScores = (book, n) => {
  const t = grp(book, n); if (!t) return IE.routes.cambridge([]);
  const last = (k, id) => IE.camLast(k, id), fts = S().ftests.filter(x => x.book === book && x.n === n).sort((a, b) => b.ts - a.ts), cur = fts[0];
  const part = (k, i, u) => {
    if (!u) return '';
    const rec = last(k === 'L' ? 'l' : 'r', u.id), a = (rec && rec.a) || {}, qs = IE.allQ(u);
    return '<div class="scp"><div class="row" style="justify-content:space-between"><b>' + (k === 'L' ? 'Listening · Section ' : 'Reading · Passage ') + i + '</b>' + (rec ? '<span class="chip">' + rec.raw + '/' + rec.tot + '</span>' : '<span class="chip mu">topshirilmagan</span>') + '</div><div class="sgrid">' +
      qs.map(({ g, q }) => { const v = a[q.n], st = !rec ? 'em' : (v == null || v === '') ? 'em' : IE.isOk(g, q, v) ? 'ok' : 'no'; return '<button class="sq ' + st + '" ' + (rec ? 'data-a="ev" data-k="' + k + '" data-u="' + u.id + '" data-n="' + q.n + '"' : 'disabled') + '>' + q.n + '</button>'; }).join('') + '</div>' +
      (rec ? '<button class="chip" style="margin-top:8px" data-go="' + (k === 'L' ? 'listening/' + u.id + '/result' : 'reading/' + u.id + '/result') + '">To‘liq natija</button>' : '') + '</div>';
  };
  const skillBand = (k, ps) => { const rs = ps.map(u => u && last(k === 'L' ? 'l' : 'r', u.id)); if (rs.some(r => !r)) return null; const raw = rs.reduce((x, r) => x + r.raw, 0), tot = rs.reduce((x, r) => x + r.tot, 0); return (k === 'L' ? IE.bandL : IE.band)(raw, tot); };
  const lb = cur && cur.L ? cur.L.band : skillBand('L', [1, 2, 3, 4].map(i => t.L[i])), rb = cur && cur.R ? cur.R.band : skillBand('R', [1, 2, 3].map(i => t.R[i])), bs = [lb, rb].filter(x => x != null), ov = cur && cur.overall != null ? cur.overall : (bs.length ? Math.round(bs.reduce((a, b) => a + b, 0) / bs.length * 2) / 2 : null);
  const hist = fts.length ? '<div class="sec"><h2>Urinishlar</h2></div><div class="lst">' + fts.slice(0, 8).map(x => '<div class="item" style="padding:10px 14px"><div class="tx"><b>' + IE.fmtD(x.ts) + ' · ' + (x.skills === 'LR' ? 'To‘liq' : x.skills === 'L' ? 'Listening' : 'Reading') + '</b><span>' + (x.L ? 'L ' + IE.bandTxt(x.L.band) + ' (' + x.L.raw + '/' + x.L.tot + ')' : '') + (x.L && x.R ? ' · ' : '') + (x.R ? 'R ' + IE.bandTxt(x.R.band) + ' (' + x.R.raw + '/' + x.R.tot + ')' : '') + ' · ' + fmt(x.secs) + '</span></div><span class="band sk-M">' + IE.bandTxt(x.overall) + '</span></div>').join('') + '</div>' : '';
  const inner = '<div class="pad"><div class="res anim" style="margin-top:0"><div class="lbl">' + esc(book) + ' · Test ' + n + '</div><div class="big">' + IE.bandTxt(ov) + '</div><div class="mu" style="margin-top:6px">Listening ' + IE.bandTxt(lb) + ' · Reading ' + IE.bandTxt(rb) + (cur ? ' · ' + fmt(cur.secs) : '') + '</div></div>' +
    '<div class="card" style="margin-top:12px"><div class="row sm mu" style="gap:14px"><span><i class="sqk ok"></i> To‘g‘ri</span><span><i class="sqk no"></i> Xato</span><span><i class="sqk em"></i> Javobsiz</span></div><div class="sm mu" style="margin-top:6px">Raqamni bossangiz — o‘sha savolning dalili ochiladi.</div></div>' +
    [1, 2, 3, 4].map(i => part('L', i, t.L[i])).join('') + [1, 2, 3].map(i => part('R', i, t.R[i])).join('') + hist +
    '<div class="two" style="margin-top:14px"><button class="btn ghost" data-go="cambridge/t/' + encodeURIComponent(book) + '/' + n + '">Test sahifasi</button><button class="btn" data-go="cambridge">Boshqa test</button></div></div>';
  return sub('Scores', 'cambridge/t/' + encodeURIComponent(book) + '/' + n, inner);
};
})();
