/* IELTS · To‘liq imtihon rejimi (Cambridge testlari va oddiy Practice) va Scores sahifasi.
   To‘liq rejim: Listening ketma-ket qismlar (audio bir marta) → Reading (60 daqiqa umumiy vaqt) → umumiy band.
   Eski usul (bitta qism / passage) ham saqlanadi. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), A = IE.act, V = IE.V, D = IE.D, R = IE.routes;
const sub = (title, back, inner) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1></header><div class="scr sub">' + inner + '</div>', sub: true });
const FK = 'ielts:ft', ft = () => lsGet(FK, null), setFt = o => { try { o ? lsSet(FK, o) : localStorage.removeItem(FK); } catch (e) { /* */ } };
const grp = (book, n) => { const g = IE.camGroups().books.find(b => b[0] === book); return g && g[1].get(n); };
const fmt = s => Math.floor(Math.max(0, s) / 60) + ':' + String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');
const lu = id => D.listening.tests.find(x => x.id === id), ru = id => D.reading.passages.find(x => x.id === id);
const clearRuns = f => { (f.units.L || []).forEach(i => { try { localStorage.removeItem('ielts:lrun:' + i); } catch (e) { /* */ } }); (f.units.R || []).forEach(i => { try { localStorage.removeItem('ielts:run:' + i); } catch (e) { /* */ } }); };

/** Shu birlik hozir faol to‘liq imtihonning joriy bosqichiga tegishlimi? */
IE.ftOn = (kind, id) => { const f = ft(); return !!f && f.phase === kind && f.skills.includes(kind) && (f.units[kind] || []).includes(id); };
IE.ftLeft = (r, kind) => (kind === 'R' && IE.ftOn('R', r.id) && ft().tR) ? 3600 - (Date.now() - ft().tR) / 1000 : 1200 - (Date.now() - r.t0) / 1000;
IE.ftBanner = kind => { const f = ft(); if (!f || !IE.ftOn(kind, (kind === 'L' ? (V.l && V.l.id) : (V.run && V.run.id)) || '')) return ''; return '<div class="ftb">' + ic('clock') + ' <b>To‘liq imtihon</b> · ' + (kind === 'L' ? 'Listening, Section ' + f.li + '/' + f.units.L.length : 'Reading · 60 daqiqa umumiy vaqt') + '</div>'; };

function open(f) {
  if (f.phase === 'L') { const pm = V.lmode; V.lmode = 'exam'; A.lstart({ dataset: { id: f.units.L[f.li - 1] } }); V.lmode = pm; }
  else { if (!f.tR) { f.tR = Date.now(); setFt(f); } IE.go('reading/' + f.units.R[0] + '/run'); }
}
const begin = f => { const old = ft(), go = () => { clearRuns(f); setFt(f); open(f); }; if (old && old.label !== f.label) return IE.ask('Boshqa imtihon davom etmoqda', 'Yangisini boshlasangiz, oldingisi bekor qilinadi.', 'Yangisini boshlash', go); go(); };
/** Cambridge Test */
A.ftstart = el => {
  const book = decodeURIComponent(el.dataset.b), n = +el.dataset.n, sk = el.dataset.s.split(''), t = grp(book, n); if (!t) return;
  const ids = k => Object.entries(t[k]).sort((a, b) => a[0] - b[0]).map(([, u]) => u.id);
  begin({ label: book + ' · Test ' + n, book, n, units: { L: sk.includes('L') ? ids('L') : [], R: sk.includes('R') ? ids('R') : [] }, skills: sk, phase: sk[0], li: 1, tR: 0, t0: Date.now(), parts: {}, back: 'cambridge/t/' + encodeURIComponent(book) + '/' + n });
};
/** Oddiy Practice: yangi (ko‘rilmagan) qismlardan to‘liq test tuzadi. */
const pickL = () => { const seen = new Set(S().listens.map(r => r.id)), ts = D.listening.tests.filter(t => !t.priv && t.dur > 0), fresh = ts.filter(t => !seen.has(t.id)), old = ts.filter(t => seen.has(t.id)), sh = a => a.slice().sort(() => Math.random() - .5); return [...sh(fresh), ...sh(old)].slice(0, 4).map(t => t.id); };
const pickR = () => D.reading.passages.filter(p => !p.priv).slice(0, 3).map(p => p.id);
A.ftcustom = el => {
  const sk = el.dataset.s.split(''), L = sk.includes('L') ? pickL() : [], Rr = sk.includes('R') ? pickR() : [];
  if (sk.includes('L') && L.length < 2) return IE.toast('Listening uchun qism yetarli emas'); if (sk.includes('R') && !Rr.length) return IE.toast('Reading matnlari topilmadi');
  begin({ label: 'Practice · to‘liq ' + (el.dataset.s === 'LR' ? 'test' : el.dataset.s === 'L' ? 'Listening' : 'Reading'), book: '', n: 0, units: { L, R: Rr }, skills: sk, phase: sk[0], li: 1, tR: 0, t0: Date.now(), parts: {}, back: sk[0] === 'L' ? 'listening' : 'reading' });
};
A.ftresume = () => { const f = ft(); if (f) open(f); };
A.ftcancel = () => IE.ask('Imtihonni bekor qilasizmi?', 'Shu urinish natijasi hisoblanmaydi (topshirilgan qismlar tarixda qoladi).', 'Bekor qilish', () => { setFt(null); IE.draw(false); });
A.ftgoR = () => { const f = ft(); if (!f) return; f.phase = 'R'; f.tR = Date.now(); setFt(f); IE.closeSheet(); open(f); };

IE.ftListenSubmit = (t, rec) => {
  const f = ft(); if (!f || f.phase !== 'L') return false; const idx = f.units.L.indexOf(t.id); if (idx < 0) return false;
  f.parts['L' + (idx + 1)] = { raw: rec.raw, tot: rec.tot };
  if (f.units.L[idx + 1]) { f.li = idx + 2; setFt(f); IE.toast('Section ' + f.li + ' boshlanmoqda'); open(f); return true; }
  if (f.skills.includes('R')) { f.phase = 'R'; setFt(f); IE.go(f.back); setTimeout(() => IE.sheet('<h2>Listening tugadi ✔</h2><p class="mu" style="margin:6px 0 16px">Endi Reading: ' + f.units.R.length + ' ta passage, umumiy vaqt <b>60 daqiqa</b>. Passage’lar orasida erkin o‘tishingiz mumkin. Tayyormisiz?</p><button class="btn block" data-a="ftgoR">' + ic('play') + ' Reading’ni boshlash</button>'), 250); return true; }
  finish(f); return true;
};
/** Reading'ni yakunlash: hamma passage topshiriladi. */
IE.ftReadSubmit = auto => {
  const f = ft(); if (!f || f.phase !== 'R' || !V.run || !IE.ftOn('R', V.run.id)) return false;
  f.units.R.forEach((id, i) => {
    const u = ru(id); if (!u) return; const st = lsGet('ielts:run:' + id, null), ans = (st && st.ans) || {}, qs = IE.allQ(u), raw = qs.filter(x => IE.isOk(x.g, x.q, ans[x.q.n])).length;
    S().reads.push({ ts: Date.now() + i, p: id, raw, tot: qs.length, band: IE.band(raw, qs.length), secs: Math.min(3600, Math.round((Date.now() - f.tR) / 1000)), a: ans }); f.parts['R' + (i + 1)] = { raw, tot: qs.length };
    try { localStorage.removeItem('ielts:run:' + id); } catch (e) { /* */ }
  });
  V.run = null; if (auto) IE.toast('Vaqt tugadi — Reading topshirildi'); finish(f); return true;
};
function finish(f) {
  const sum = k => Object.entries(f.parts).filter(([x]) => x[0] === k).reduce((a, [, p]) => ({ raw: a.raw + p.raw, tot: a.tot + p.tot }), { raw: 0, tot: 0 });
  const L = f.skills.includes('L') ? sum('L') : null, Rr = f.skills.includes('R') ? sum('R') : null;
  if (L) L.band = IE.bandL(L.raw, L.tot); if (Rr) Rr.band = IE.band(Rr.raw, Rr.tot);
  const bs = [L && L.band, Rr && Rr.band].filter(x => x != null), overall = bs.length ? Math.round(bs.reduce((a, b) => a + b, 0) / bs.length * 2) / 2 : null, ts = Date.now();
  S().ftests.push({ ts, book: f.book || '', n: f.n || 0, label: f.label, skills: f.skills.join(''), L, R: Rr, overall, secs: Math.round((ts - f.t0) / 1000), units: f.units }); IE.touchDay(); IE.save(true); setFt(null);
  IE.confetti(); IE.vib([30, 50, 30]); IE.go(f.book ? 'cambridge/s/' + encodeURIComponent(f.book) + '/' + f.n : 'ft/' + ts);
}

/* ---------- Cambridge Test sahifasidagi karta ---------- */
IE.ftCard = (book, n, t) => {
  const f = ft(), me = f && f.book === book && f.n === n, e = encodeURIComponent(book), lOk = [1, 2, 3, 4].every(i => t.L[i] && t.L[i].dur > 0), rOk = [1, 2, 3].every(i => t.R[i]);
  if (me) return resumeCard(f);
  const b = (s, lab, ok) => '<button class="btn' + (s === 'LR' ? '' : ' ghost') + ' sm" ' + (ok ? 'data-a="ftstart" data-b="' + e + '" data-n="' + n + '" data-s="' + s + '"' : 'disabled') + '>' + lab + '</button>';
  return '<div class="card ftc" style="margin-top:12px"><div class="row">' + bd('trophy', 'M') + '<div style="flex:1"><b>Haqiqiy imtihon rejimi</b><div class="sm mu">Listening: 4 qism ketma-ket, audio bir marta. Reading: 3 passage, 60 daqiqa umumiy vaqt. Oxirida umumiy band.</div></div></div>' +
    '<div class="ftb3">' + b('LR', 'Listening + Reading', lOk && rOk) + b('L', 'Faqat Listening', lOk) + b('R', 'Faqat Reading', rOk) + '</div>' + (!lOk ? '<p class="sm" style="margin:8px 0 0;color:var(--warn)">Listening uchun 4 ta Section va audiolari kerak.</p>' : '') +
    '<p class="mu xs" style="margin:10px 2px 0">Eski usul: pastdagi qismlarni alohida-alohida topshiring.</p></div>';
};
const resumeCard = f => '<div class="card ftc" style="margin-top:12px"><div class="row">' + bd('clock', 'M') + '<div style="flex:1"><b>Imtihon davom etmoqda</b><div class="sm mu">' + esc(f.label) + ' · ' + (f.phase === 'L' ? 'Listening · Section ' + f.li + '/' + f.units.L.length : 'Reading · qolgan vaqt ' + fmt(3600 - (Date.now() - f.tR) / 1000)) + '</div></div></div><div class="two" style="margin-top:10px"><button class="btn" data-a="ftresume">Davom etish</button><button class="btn ghost" data-a="ftcancel">Bekor qilish</button></div></div>';

/* ---------- Practice: “Bitta qism / To‘liq” tanlovi ---------- */
const PM = 'ielts:pmode';
IE.pracMode = () => { try { return localStorage.getItem(PM) === 'full' ? 'full' : 'one'; } catch (e) { return 'one'; } };
A.pmode = el => { try { localStorage.setItem(PM, el.dataset.v); } catch (e) { /* */ } IE.draw(false); };
IE.pracSeg = kind => { const m = IE.pracMode(), t1 = kind === 'L' ? 'Bitta qism · 10 savol' : kind === 'R' ? 'Bitta passage · 13 savol' : 'Bitta qism · 10–13 savol', t2 = kind === 'L' ? 'To‘liq · 4 qism · 40' : kind === 'R' ? 'To‘liq · 3 passage · 40' : 'To‘liq test · 40 savol'; return '<div class="seg pseg"><button class="' + (m === 'one' ? 'on' : '') + '" data-a="pmode" data-v="one">' + t1 + '</button><button class="' + (m === 'full' ? 'on' : '') + '" data-a="pmode" data-v="full">' + t2 + '</button></div>'; };
/** To‘liq rejim kartasi (Listening / Reading ro‘yxati sahifalarida). */
IE.pracFull = kind => {
  const f = ft(); if (f && f.book === '') return resumeCard(f);
  const L = kind === 'L', n = L ? D.listening.tests.filter(t => !t.priv && t.dur > 0).length : D.reading.passages.filter(p => !p.priv).length;
  const last = S().ftests.filter(x => !x.book && x.skills === (L ? 'L' : 'R')).slice(-1)[0];
  return '<div class="card ftc rise">' + '<div class="row">' + bd(L ? 'head' : 'book', L ? 'L' : 'R', 'lg') + '<div style="flex:1"><b style="font-size:17px">To‘liq ' + (L ? 'Listening' : 'Reading') + '</b><div class="sm mu">' + (L ? '4 ta qism ketma-ket (40 savol). Audio bir marta ijro etiladi. Qismlar sizga yangi (eshitilmagan) yozuvlardan tanlanadi.' : '3 ta passage (39 savol) — umumiy 60 daqiqa. Passage’lar orasida erkin o‘tasiz, oxirida band hisoblanadi.') + '</div></div></div>' +
    '<button class="btn block" style="margin-top:12px" data-a="ftcustom" data-s="' + (L ? 'L' : 'R') + '"' + (n ? '' : ' disabled') + '>' + ic('play') + ' To‘liq ' + (L ? 'Listening' : 'Reading') + 'ni boshlash</button>' +
    (last ? '<button class="item" style="margin-top:10px" data-go="ft/' + last.ts + '">' + bd('trophy', 'M', 'sm') + '<div class="tx"><b>So‘nggi natija: band ' + IE.bandTxt(last.overall) + '</b><span>' + IE.fmtD(last.ts) + ' · ' + (last.L || last.R).raw + '/' + (last.L || last.R).tot + ' to‘g‘ri</span></div><span class="go">' + ic('next') + '</span></button>' : '') + '</div>';
};

/* ---------- Scores (umumiy) ---------- */
function scoresPage(o) {
  const last = (k, id) => IE.camLast(k, id), fts = o.fts, cur = fts[0];
  const part = (k, i, u) => {
    if (!u) return '';
    const rec = last(k === 'L' ? 'l' : 'r', u.id), a = (rec && rec.a) || {}, qs = IE.allQ(u);
    return '<div class="scp"><div class="row" style="justify-content:space-between"><b>' + (k === 'L' ? 'Listening · Section ' : 'Reading · Passage ') + i + '</b>' + (rec ? '<span class="chip">' + rec.raw + '/' + rec.tot + '</span>' : '<span class="chip mu">topshirilmagan</span>') + '</div><div class="sgrid">' +
      qs.map(({ g, q }) => { const v = a[q.n], st = !rec ? 'em' : (v == null || v === '') ? 'em' : IE.isOk(g, q, v) ? 'ok' : 'no'; return '<button class="sq ' + st + '" ' + (rec ? 'data-a="ev" data-k="' + k + '" data-u="' + u.id + '" data-n="' + q.n + '"' : 'disabled') + '>' + q.n + '</button>'; }).join('') + '</div>' +
      (rec ? '<button class="chip" style="margin-top:8px" data-go="' + (k === 'L' ? 'listening/' + u.id + '/result' : 'reading/' + u.id + '/result') + '">To‘liq natija</button>' : '') + '</div>';
  };
  const lus = Object.values(o.tL), rus = Object.values(o.tR);
  const skillBand = (k, ps) => { const rs = ps.map(u => u && last(k === 'L' ? 'l' : 'r', u.id)); if (!rs.length || rs.some(r => !r)) return null; const raw = rs.reduce((x, r) => x + r.raw, 0), tot = rs.reduce((x, r) => x + r.tot, 0); return (k === 'L' ? IE.bandL : IE.band)(raw, tot); };
  const lb = cur && cur.L ? cur.L.band : skillBand('L', lus), rb = cur && cur.R ? cur.R.band : skillBand('R', rus), bs = [lb, rb].filter(x => x != null), ov = cur && cur.overall != null ? cur.overall : (bs.length ? Math.round(bs.reduce((a, b) => a + b, 0) / bs.length * 2) / 2 : null);
  const hist = fts.length ? '<div class="sec"><h2>Urinishlar</h2></div><div class="lst">' + fts.slice(0, 8).map(x => '<div class="item" style="padding:10px 14px"><div class="tx"><b>' + IE.fmtD(x.ts) + ' · ' + (x.skills === 'LR' ? 'To‘liq' : x.skills === 'L' ? 'Listening' : 'Reading') + '</b><span>' + (x.L ? 'L ' + IE.bandTxt(x.L.band) + ' (' + x.L.raw + '/' + x.L.tot + ')' : '') + (x.L && x.R ? ' · ' : '') + (x.R ? 'R ' + IE.bandTxt(x.R.band) + ' (' + x.R.raw + '/' + x.R.tot + ')' : '') + ' · ' + fmt(x.secs) + '</span></div><span class="band sk-M">' + IE.bandTxt(x.overall) + '</span></div>').join('') + '</div>' : '';
  const inner = '<div class="pad"><div class="res anim" style="margin-top:0"><div class="lbl">' + esc(o.title) + '</div><div class="big">' + IE.bandTxt(ov) + '</div><div class="mu" style="margin-top:6px">Listening ' + IE.bandTxt(lb) + ' · Reading ' + IE.bandTxt(rb) + (cur ? ' · ' + fmt(cur.secs) : '') + '</div></div>' +
    '<div class="card" style="margin-top:12px"><div class="row sm mu" style="gap:14px"><span><i class="sqk ok"></i> To‘g‘ri</span><span><i class="sqk no"></i> Xato</span><span><i class="sqk em"></i> Javobsiz</span></div><div class="sm mu" style="margin-top:6px">Raqamni bossangiz — o‘sha savolning dalili ochiladi.</div></div>' +
    Object.entries(o.tL).map(([i, u]) => part('L', i, u)).join('') + Object.entries(o.tR).map(([i, u]) => part('R', i, u)).join('') + hist + o.foot + '</div>';
  return sub('Scores', o.back, inner);
}
IE.camScores = (book, n) => {
  const t = grp(book, n); if (!t) return R.cambridge([]);
  return scoresPage({ title: book + ' · Test ' + n, back: 'cambridge/t/' + encodeURIComponent(book) + '/' + n, tL: t.L, tR: t.R, fts: S().ftests.filter(x => x.book === book && x.n === n).sort((a, b) => b.ts - a.ts),
    foot: '<div class="two" style="margin-top:14px"><button class="btn ghost" data-go="cambridge/t/' + encodeURIComponent(book) + '/' + n + '">Test sahifasi</button><button class="btn" data-go="cambridge">Boshqa test</button></div>' });
};
/** Oddiy to‘liq test natijasi: #/ft/<ts> */
R.ft = a => {
  const rec = S().ftests.find(x => x.ts === +a[0]); if (!rec || !rec.units) return R.practice ? R.practice([]) : { h: '', sub: true };
  const tL = {}, tR = {}; (rec.units.L || []).forEach((id, i) => { const u = lu(id); if (u) tL[i + 1] = u; }); (rec.units.R || []).forEach((id, i) => { const u = ru(id); if (u) tR[i + 1] = u; });
  return scoresPage({ title: rec.label || 'To‘liq test', back: 'practice', tL, tR, fts: [rec], foot: '<div class="two" style="margin-top:14px"><button class="btn ghost" data-go="practice">Practice</button><button class="btn" data-a="ftcustom" data-s="' + rec.skills + '">' + ic('refresh') + ' Yana</button></div>' });
};
})();
