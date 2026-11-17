/* IELTS · Reja: kunlik / haftalik / oylik tayyorgarlik rejasi, XP va daraja, yutuqlar, Home vidjetlari. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$ } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const sub = (title, back, inner, right) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + '</header><div class="scr sub">' + inner + '</div>', sub: true });
const WD = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'], WS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh'];
const MO = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const dk = t => IE.dayKey(t), parse = k => new Date(k + 'T00:00:00'), addD = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dk(d.getTime()); };
const dowOf = k => parse(k).getDay(), dayN = k => Math.floor(Date.UTC(parse(k).getFullYear(), parse(k).getMonth(), parse(k).getDate()) / 864e5);
const prof = () => S().prof, mins = () => Math.min(720, Math.max(20, +prof().mins || 60));
const due = () => { const t = IE.dayNum(); return Object.values(S().srs).filter(x => x.d <= t).length; };
const daysLeft = () => { const p = prof(); return p.date ? Math.ceil((parse(p.date) - parse(dk())) / 864e5) : null; };

/* ---------- kun bo‘yicha faollik hisobi ---------- */
const on = (ts, k) => ts && dk(ts) === k;
function cnt(k) {
  const s = S(), bl = (s.books || []).filter(b => !b.del);
  return { R: s.reads.filter(r => on(r.ts, k)).length, L: s.listens.filter(r => on(r.ts, k)).length, W: s.writes.filter(r => on(r.ts, k)).length, S: s.speaks.filter(r => on(r.ts, k)).length,
    T: (s.typ || []).filter(r => on(r.ts, k)).length, A: s.arts.filter(r => on(r.ts, k)).length, M: s.mocks.filter(r => on(r.ts, k)).length,
    V: Object.values(s.srs).filter(x => x.t && on(x.t, k)).length, P: bl.reduce((n, b) => n + ((b.log && b.log[k]) || 0), 0) };
}
const act = c => c.R + c.L + c.W + c.S + c.T + c.A + c.M + Math.min(3, Math.floor(c.V / 5)) + Math.min(2, c.P);

IE.planDay = k => ({ rest: isRest(k), tasks: tasksFor(k).map(t => ({ t: t.t, m: t.m, ai: !!t.ai })) });
IE.dayCnt = cnt; IE.dayAct = k => act(cnt(k)) + (S().days.includes(k) ? 1 : 0) + Math.min(3, Math.floor(((S().focus || {})[k] || 0) / 20));
/* ---------- vazifalar katalogi ---------- */
const nextRead = () => { const ids = new Set(S().reads.map(r => r.p)), ps = D.reading.passages, p = ps.find(x => x.priv && !ids.has(x.id)) || ps.find(x => !ids.has(x.id)); return p ? { go: 'reading/' + p.id + '/run', t: p.title } : { go: 'reading', t: '' }; };
const nextListen = () => { const ids = new Set(S().listens.map(r => r.id)), ts = D.listening.tests, t = ts.find(x => x.priv && x.dur > 0 && !ids.has(x.id)) || ts.find(x => !x.priv && !ids.has(x.id)); return t ? { go: 'listening/' + t.id, t: (t.topic.split(' · ')[1] || t.title) } : { go: 'listening', t: '' }; };
const CAT = {
  srs: { t: 'So‘zlarni takrorlash', m: 8, ic: 'cards', k: 'V', go: () => due() ? 'vocab/review' : 'vocab', sub: () => due() ? due() + ' ta so‘z takrorni kutmoqda' : 'Yangi mavzu oching — 5 ta yangi so‘z', auto: c => c.V >= 5 || (c.V >= 1 && due() === 0) },
  read: { t: 'Reading', m: 20, ic: 'book', k: 'R', go: () => nextRead().go, sub: () => { const n = nextRead().t; return (n ? '«' + n + '»' : '1 ta matn') + ' · taymer bilan'; }, auto: c => c.R >= 1 },
  listen: { t: 'Listening', m: 12, ic: 'head', k: 'L', go: () => nextListen().go, sub: () => { const n = nextListen().t; return (n ? '«' + n + '»' : '1 ta bo‘lim') + ' · quloqchin bilan'; }, auto: c => c.L >= 1 },
  write: { t: 'Writing Task 2', m: 40, ic: 'pen', k: 'W', go: () => 'writing', sub: () => '40 daqiqa · AI baholaydi', auto: c => c.W >= 1 },
  speak: { t: 'Speaking', m: 12, ic: 'mic', k: 'S', go: () => 'speaking', sub: () => 'Part 1–2 · yozib oling, AI baholaydi', auto: c => c.S >= 1 },
  chat: { t: 'AI bilan suhbat', m: 10, ic: 'chat', k: 'S', go: () => 'chat', sub: () => 'Inglizcha gaplashing, xatolar tuzatiladi' },
  pod: { t: 'Podkast / maqola', m: 15, ic: 'news', k: 'L', go: () => 'articles/tab/p', sub: () => 'Tinglang, matnni kuzating, so‘z o‘rganing', auto: c => c.A >= 1 },
  shadow: { t: 'Shadowing', m: 8, ic: 'spk', k: 'S', go: () => 'shadow', sub: () => 'Diktor ortidan takrorlang — talaffuz uchun' },
  dict: { t: 'Dictation', m: 8, ic: 'wave', k: 'L', go: () => 'dictation', sub: () => 'Eshitganingizni yozing — imlo va diqqat' },
  type: { t: 'Typing mashqi', m: 5, ic: 'type', k: 'W', go: () => 'typing', sub: () => '1 daqiqa — Writing tezligi uchun', auto: c => c.T >= 1 },
  mock: { t: 'Mini Mock Test', m: 90, ic: 'trophy', k: 'M', go: () => 'mock', sub: () => 'Haftalik sinov: hamma ko‘nikma', auto: c => c.M >= 1 },
  ana: { t: 'Reading tahlili', m: 15, ic: 'bulb', k: 'R', go: () => { const p = IE.anaPending ? IE.anaPending()[0] : null; return p ? p.go : 'ana'; }, sub: () => 'So‘zlar, xatolar sababi, qayta yechish', auto: () => IE.anaToday && IE.anaToday() >= 3 },
  mb: { t: 'Xatolar banki', m: 10, ic: 'cards', k: 'V', go: () => 'mb', sub: () => (IE.bankStats ? IE.bankStats().due : 0) + ' ta xato savol takrorga tayyor', auto: () => IE.bankToday && IE.bankToday() >= 5 },
  review: { t: 'Haftalik takror', m: 20, ic: 'refresh', k: 'V', go: () => 'practice', sub: () => 'Xatolaringiz va yangi so‘zlarni ko‘rib chiqing' },
};
const weakest = () => { const b = IE.skillBands(), e = Object.entries(b).filter(([, v]) => v != null).sort((a, c) => a[1] - c[1]); return e.length ? e[0][0] : null; };
const WEAK = { L: ['listen', 'dict'], R: ['read'], W: ['write', 'type'], S: ['speak', 'chat'] };
/** Hafta kuni bo‘yicha asosiy shablon (0 = yakshanba). */
const DOW = { 1: ['listen', 'srs', 'pod'], 2: ['read', 'srs', 'type'], 3: ['write', 'srs', 'shadow'], 4: ['speak', 'srs', 'chat'], 5: ['listen', 'read', 'srs'], 6: ['mock', 'srs'], 0: ['srs', 'pod', 'dict', 'type'] };
function phase() {
  const d = daysLeft();
  if (d == null) return { id: 'free', n: 'Muntazam tayyorgarlik', c: '#8b5cf6', d: 'Imtihon sanasini Profilda belgilasangiz, reja imtihongacha moslashadi.' };
  if (d < 0) return { id: 'done', n: 'Imtihon o‘tdi', c: '#64748b', d: 'Yangi imtihon sanasini belgilang.' };
  if (d <= 7) return { id: 'final', n: 'Oxirgi hafta', c: '#f43f5e', d: 'Yangi narsa o‘rganmang: mock, xatolar ustida ishlash, uyqu va tinchlik.' };
  if (d <= 21) return { id: 'intense', n: 'Intensiv', c: '#f97316', d: 'Vaqtli mashqlar va to‘liq mocklar — imtihon tezligiga o‘rganing.' };
  if (d <= 60) return { id: 'skills', n: 'Ko‘nikmalar', c: '#3b82f6', d: 'Har bir ko‘nikmani muntazam mashq qiling, zaif tomonga ko‘proq vaqt.' };
  return { id: 'base', n: 'Poydevor', c: '#10b981', d: 'So‘z boyligi, grammatika va tinglash/o‘qish odatini shakllantiring.' };
}
/** Kunning vazifalar ro‘yxati (id lar). */
function planIds(k) {
  const M = mins(), dow = dowOf(k), ph = phase().id; let base = (DOW[dow] || ['srs']).slice();
  if (dow === 6 && M < 90) base = ['listen', 'read', 'srs'];
  if (ph === 'final') { base = dow === 3 || dow === 6 ? ['mock', 'srs'] : ['srs', 'review', 'listen']; if (M < 90) base = base.map(x => x === 'mock' ? 'read' : x); }
  else if (ph === 'intense' && (dow === 2 || dow === 4) && M >= 60) base.splice(1, 0, 'write');
  if (IE.anaPending && IE.anaPending().length && ph !== 'final') base.splice(Math.min(1, base.length), 0, 'ana');
  if (IE.bankStats && IE.bankStats().due >= 3) base.splice(Math.min(2, base.length), 0, 'mb');
  const wk = weakest(); if (wk && ph !== 'final' && (dow === 1 || dow === 3 || dow === 5)) WEAK[wk].forEach(id => { if (!base.includes(id)) base.push(id); });
  if (ph === 'base') ['pod', 'shadow'].forEach(id => { if (!base.includes(id) && M >= 45) base.push(id); });
  // vaqt byudjetiga sig‘dirish: birinchi (asosiy) vazifa va srs har doim qoladi
  const keep = [], must = new Set([base[0], 'srs']); let tot = 0;
  base.forEach(id => { const m = CAT[id].m; if (must.has(id) || tot + m <= M + 8) { keep.push(id); tot += m; } });
  const out = keep.sort((a, b) => (b === 'srs') - (a === 'srs') || 0).slice(); const si = out.indexOf('srs'); if (si > 0) { out.splice(si, 1); out.unshift('srs'); }
  // kitob rejasi: har kuni
  if (k >= dk()) (IE.bookPlans ? IE.bookPlans() : []).slice(0, 2).forEach(({ b }) => out.push('bk:' + b.id));
  return out;
}
function mk(id, k) {
  if (id.startsWith('bk:')) {
    const bid = id.slice(3), bp = (IE.bookPlans ? IE.bookPlans() : []).find(x => x.b.id === bid), b = bp ? bp.b : null; if (!b) return null; const i = bp.i;
    return { id, t: 'Kitob: ' + (b.t.length > 28 ? b.t.slice(0, 27) + '…' : b.t), m: Math.max(5, Math.min(40, (i.target || 5) * 2)), ic: 'doc', k: 'R', go: 'book/' + b.id, sub: i.need ? i.need + ' bet qoldi (' + (i.from + 1) + '–' + i.to + ')' : 'Bugungi reja bajarildi', auto: i.need === 0 && i.target > 0 };
  }
  const c = CAT[id]; if (!c) return null;
  return { id, t: c.t, m: c.m, ic: c.ic, k: c.k, go: c.go(), sub: c.sub(), autoFn: c.auto };
}
const customOf = k => ((S().ptask || {})[k] || []).filter(t => !t.del);
const GOK = { reading: ['R', 'book'], listening: ['L', 'head'], writing: ['W', 'pen'], speaking: ['S', 'mic'], chat: ['S', 'chat'], typing: ['T', 'type'], vocab: ['V', 'cards'], 'vocab/review': ['V', 'cards'], articles: ['L', 'news'], 'articles/tab/p': ['L', 'news'], mock: ['M', 'trophy'], ana: ['R', 'bulb'], shadow: ['S', 'spk'], dictation: ['L', 'wave'], dict: ['A', 'search'], books: ['R', 'doc'], cambridge: ['M', 'trophy'], practice: ['R', 'target'] };
const autoOf = (go, k) => { const r = String(go || '').split('/')[0]; return r === 'reading' ? c => c.R >= 1 : r === 'listening' ? c => c.L >= 1 : r === 'writing' ? c => c.W >= 1 : r === 'speaking' ? c => c.S >= 1 : r === 'typing' ? c => c.T >= 1 : r === 'vocab' ? c => c.V >= 5 : r === 'articles' ? c => c.A >= 1 : r === 'mock' ? c => c.M >= 1 : r === 'ana' ? () => k === dk() && IE.anaToday && IE.anaToday() >= 1 : null; };
const mkCustom = (t, k) => { const g = t.go && GOK[t.go] ? GOK[t.go] : null; return { id: 'c:' + t.id, t: t.t, m: t.m, ic: g ? g[1] : 'star', k: g ? g[0] : 'T', go: t.go || 'focus/t/' + encodeURIComponent(t.t) + '/' + Math.min(60, Math.max(15, Math.round(t.m / 5) * 5)), sub: t.ai ? 'AI reja' + (t.go ? ' · bosing — ochiladi' : '') : 'Shaxsiy vazifa · bosing — fokus taymer', custom: true, cid: t.id, ai: !!t.ai, autoFn: t.go ? autoOf(t.go, k) : null }; };
const isRest = k => !!(S().prest && S().prest[k] && S().prest[k].on);
IE.isRest = isRest;
const ordered = (k, ts) => { const o = ((S().pord || {})[k] || {}).l; if (!Array.isArray(o) || !o.length) return ts; const ix = id => { const i = o.indexOf(id); return i < 0 ? 1e6 : i; }; return ts.map((t, i) => [t, i]).sort((a, b) => ix(a[0].id) - ix(b[0].id) || a[1] - b[1]).map(x => x[0]); };
const tasksFor = k => isRest(k) ? [] : ordered(k, planIds(k).map(id => mk(id, k)).filter(Boolean).concat(customOf(k).map(t => mkCustom(t, k))));
function isDone(t, k) {
  const m = S().pdone[k]; if (m && m[t.id]) return true;
  if (t.auto === true) return k === dk();
  return t.autoFn ? !!t.autoFn(cnt(k)) : false;
}
IE.planToday = () => { const k = dk(), ts = tasksFor(k).map(t => Object.assign(t, { done: isDone(t, k) })); return { k, ts, done: ts.filter(t => t.done).length, total: ts.length, mins: ts.reduce((n, t) => n + t.m, 0) }; };
IE.planCheck = () => {
  const p = IE.planToday(), s = S(); if (!p.total) return; const pd = s.pdone[p.k] || (s.pdone[p.k] = {});
  if (p.done === p.total && !pd._) { pd._ = Date.now(); IE.save(); IE.confetti(); IE.vib([30, 50, 30]); IE.toast('🎉 Bugungi reja bajarildi — barakalla!'); }
};

/* ---------- XP, daraja, yutuqlar ---------- */
IE.xp = () => {
  const s = S(), c = (s.books || []).filter(b => !b.del).reduce((n, b) => n + (b.max || 0), 0), doneDays = Object.values(s.pdone || {}).filter(o => o && o._).length;
  return s.reads.length * 40 + s.listens.length * 40 + s.writes.length * (60) + s.speaks.length * 30 + s.arts.length * 15 + (s.mocks.length) * 200 + Object.keys(s.srs).length * 3 + s.my.length * 2 + (s.typ || []).length * 15 + c + s.days.length * 15 + doneDays * 40;
};
const LT = ['Boshlovchi', 'Izlanuvchi', 'Faol', 'Mustahkam', 'Mohir', 'Tajribali', 'Usta', 'Ekspert', 'Ustoz', 'Afsona'];
IE.level = () => { const xp = IE.xp(), L = Math.floor(Math.sqrt(xp / 60)) + 1, lo = (L - 1) * (L - 1) * 60, hi = L * L * 60; return { xp, L, name: LT[Math.min(LT.length - 1, L - 1)], lo, hi, pct: Math.round((xp - lo) / (hi - lo) * 100) }; };
const BG = [
  { id: 'first', i: 'star', t: 'Birinchi qadam', d: 'Birinchi mashqni bajaring', ok: s => s.reads.length + s.listens.length + s.writes.length + s.speaks.length + s.arts.length > 0 },
  { id: 's3', i: 'flame', t: '3 kun ketma-ket', d: '3 kunlik seriya', ok: () => IE.streak() >= 3 || bestStreak() >= 3 },
  { id: 's7', i: 'flame', t: 'Haftalik seriya', d: '7 kun ketma-ket', ok: () => bestStreak() >= 7 },
  { id: 's14', i: 'flame', t: 'Ikki hafta', d: '14 kun ketma-ket', ok: () => bestStreak() >= 14 },
  { id: 's30', i: 'trophy', t: 'Oylik chempion', d: '30 kun ketma-ket', ok: () => bestStreak() >= 30 },
  { id: 'w50', i: 'cards', t: '50 ta so‘z', d: 'Lug‘atda 50 ta so‘z', ok: s => Object.keys(s.srs).length >= 50 },
  { id: 'w200', i: 'cards', t: '200 ta so‘z', d: 'Lug‘atda 200 ta so‘z', ok: s => Object.keys(s.srs).length >= 200 },
  { id: 'r10', i: 'book', t: 'O‘quvchi', d: '10 ta Reading', ok: s => s.reads.length >= 10 },
  { id: 'l10', i: 'head', t: 'Tinglovchi', d: '10 ta Listening', ok: s => s.listens.length >= 10 },
  { id: 'wr5', i: 'pen', t: 'Yozuvchi', d: '5 ta Writing', ok: s => s.writes.length >= 5 },
  { id: 'sp10', i: 'mic', t: 'Notiq', d: '10 ta Speaking', ok: s => s.speaks.length >= 10 },
  { id: 'mock', i: 'trophy', t: 'Sinovchi', d: 'Birinchi Mock Test', ok: s => s.mocks.length >= 1 },
  { id: 'band7', i: 'target', t: 'Band 7', d: 'Reading yoki Listening 7.0+', ok: s => s.reads.concat(s.listens).some(r => r.band >= 7) },
  { id: 'cam', i: 'doc', t: 'Cambridge', d: 'Cambridge testini topshiring', ok: s => s.reads.some(r => /^c/.test(String(r.p))) || s.listens.some(r => /^c/.test(String(r.id))) },
  { id: 'wpm30', i: 'type', t: 'Tez barmoqlar', d: 'Typing 30+ WPM', ok: s => (s.typ || []).some(r => r.wpm >= 30) },
  { id: 'wpm50', i: 'type', t: 'Chaqmoq', d: 'Typing 50+ WPM', ok: s => (s.typ || []).some(r => r.wpm >= 50) },
  { id: 'plan3', i: 'check', t: 'Reja ustasi', d: 'Kunlik rejani 3 marta to‘liq bajaring', ok: s => Object.values(s.pdone || {}).filter(o => o && o._).length >= 3 },
  { id: 'plan10', i: 'check', t: 'Intizomli', d: 'Kunlik rejani 10 marta bajaring', ok: s => Object.values(s.pdone || {}).filter(o => o && o._).length >= 10 },
];
function bestStreak() { const ds = [...new Set(S().days)].sort(); let b = 0, c = 0, p = null; ds.forEach(k => { c = p && addD(p, 1) === k ? c + 1 : 1; b = Math.max(b, c); p = k; }); return b; }
IE.badges = () => BG.map(b => Object.assign({}, b, { got: !!b.ok(S()) }));

/* ---------- uzun yo‘l xaritasi ---------- */
function roadmap() {
  const p = prof(); if (!p.date) return null; const total = Math.max(1, Math.ceil((parse(p.date) - parse(dk())) / 864e5)); if (total < 1) return null;
  const phases = [['base', 'Poydevor', '#10b981', 'So‘z boyligi, grammatika, kunlik odat'], ['skills', 'Ko‘nikmalar', '#3b82f6', 'Har bir ko‘nikmani muntazam mashq qilish'], ['intense', 'Intensiv', '#f97316', 'Vaqtli mashqlar va to‘liq mocklar'], ['final', 'Oxirgi hafta', '#f43f5e', 'Takror, xatolar tahlili, dam']];
  const segs = []; const end = p.date; const b = [[end, 7], [end, 21], [end, 60]].map(([e, n]) => addD(e, -n));
  const today = dk(), cuts = [today, b[2] > today ? b[2] : today, b[1] > today ? b[1] : today, b[0] > today ? b[0] : today, end];
  phases.forEach((ph, i) => { let a = cuts[i], z = cuts[i + 1]; if (i === 0 && a < b[2]) { a = today; } if (z > a) segs.push({ id: ph[0], n: ph[1], c: ph[2], d: ph[3], a, z, days: dayN(z) - dayN(a) }); });
  return segs;
}

/* ---------- ko‘rinish yordamchilari ---------- */
const ring = (pct, size, txt, sm) => { const r = size / 2 - 7, c = 2 * Math.PI * r; return '<div class="rg" style="width:' + size + 'px;height:' + size + 'px"><svg viewBox="0 0 ' + size + ' ' + size + '"><defs><linearGradient id="rgg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fbbf24"/><stop offset="1" stop-color="#f43f5e"/></linearGradient></defs><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="t"/><circle cx="' + size / 2 + '" cy="' + size / 2 + '" r="' + r + '" class="p" style="stroke-dasharray:' + c + ';stroke-dashoffset:' + (c * (1 - pct / 100)) + '"/></svg><div class="tx"><b>' + txt + '</b>' + (sm ? '<small>' + sm + '</small>' : '') + '</div></div>'; };
const dateTxt = k => { const d = parse(k); return WD[d.getDay()] + ', ' + d.getDate() + '-' + MO[d.getMonth()]; };
const TIPS = ['Reading’da avval savollarni o‘qing, so‘ng matnni skanerlang — kalit so‘zlarni qidiring.', 'Listening’da javobni yozib bo‘lgach keyingi savolga o‘ting — orqaga qaramang.', 'Writing Task 2: 4 abzats — kirish, 2 ta asosiy, xulosa. 250+ so‘z yozing.', 'Speaking Part 2: 1 daqiqa tayyorgarlikda 4–5 kalit so‘z yozib oling.', 'Har kuni 5 ta yangi so‘z — oyiga 150 ta. Ularni jumlada ishlating.', 'True/False/Not Given: “Not Given” — matnda umuman yo‘q degani, “False” — qarama-qarshi.', 'Imtihondan oldingi kuni yengil takror qiling va erta uxlang.', 'Listening’da raqam va ismlarni imlosi bilan yozing — bitta harf xato ham xato.', 'Reading’da bir savolga 1,5 daqiqadan ko‘p vaqt sarflamang — keyin qaytasiz.', 'Speaking’da “um…” o‘rniga “Well, let me think…” kabi ibora ishlating.', 'Writing’da bir xil so‘zni takrorlamang — sinonim va collocation ishlating.', 'Podkast tinglab, eshitgan 3 ta yangi iborani yozib qo‘ying.', 'Xatolar daftari yuriting: har xato — keyingi safar yo‘qotilmagan ball.', 'Har bir mashqni vaqt bilan bajaring — imtihon tezligiga o‘rganasiz.', 'Muhim: oz bo‘lsa ham har kuni — tasodifiy 5 soatdan yaxshi.'];
const tipOf = k => TIPS[dayN(k) % TIPS.length];

/* ---------- BUGUN / HAFTA / OY ---------- */
R.plan = a => {
  const tab = a[0] === 'week' ? 'week' : a[0] === 'month' ? 'month' : 'today', tabs = [['today', 'Bugun'], ['week', 'Hafta'], ['month', 'Oy']];
  const body = tab === 'today' ? todayH() : tab === 'week' ? weekH() : monthH();
  const o = sub('Reja', 'home', '<div class="pad"><div class="tabs2 t3" style="margin:0 0 14px">' + tabs.map(t => '<button class="' + (t[0] === tab ? 'on' : '') + '" data-go="plan' + (t[0] === 'today' ? '' : '/' + t[0]) + '">' + t[1] + '</button>').join('') + '</div>' + body + '</div>');
  o.mount = () => { IE.planCheck(); const w = $('.wday.today'); if (w) setTimeout(() => w.scrollIntoView({ block: 'center', behavior: 'smooth' }), 120); };
  return o;
};
function taskRow(t, k, tm, pos, n) {
  if (V.pedit) return '<div class="ptask edit"><div class="pmv"><button data-a="pmove" data-d="-1" data-id="' + esc(t.id) + '" data-k="' + k + '"' + (pos === 0 ? ' disabled' : '') + ' aria-label="Yuqoriga">' + ic('up') + '</button><button data-a="pmove" data-d="1" data-id="' + esc(t.id) + '" data-k="' + k + '"' + (pos === n - 1 ? ' disabled' : '') + ' aria-label="Pastga" style="transform:rotate(180deg)">' + ic('up') + '</button></div><div class="pt-main static">' + bd(t.ic, t.k === 'M' ? 'M' : t.k, 'sm') + '<div class="tx"><b>' + esc(t.t) + '</b><span>' + t.m + ' daq' + (t.custom ? (t.ai ? ' · AI reja' : ' · shaxsiy') : ' · avtomatik') + '</span></div></div>' + (t.custom ? '<button class="pdel" data-a="ptedit" data-id="' + esc(t.cid) + '" data-k="' + k + '" aria-label="Tahrirlash">' + ic('edit') + '</button><button class="pdel" data-a="pdel" data-id="' + esc(t.cid) + '" data-k="' + k + '" aria-label="O‘chirish">' + ic('trash') + '</button>' : '') + '</div>';
  const done = isDone(t, k), mcolor = 'sk-' + t.k;
  return '<div class="ptask' + (done ? ' done' : '') + '"><button class="pt-main" data-go="' + t.go + '">' + bd(t.ic, t.k === 'M' ? 'M' : t.k, 'sm') + '<div class="tx"><b>' + esc(t.t) + '</b><span>' + esc(t.sub || '') + '</span></div><span class="pmin">' + (tm ? '<em>' + tm + '</em>' : '') + t.m + ' daq</span></button>' + (t.custom ? '<button class="pdel" data-a="pdel" data-id="' + esc(t.cid) + '" data-k="' + k + '" aria-label="O‘chirish">' + ic('trash') + '</button>' : '') + '<button class="pchk" data-a="pchk" data-id="' + esc(t.id) + '" data-k="' + k + '" aria-label="Belgilash">' + (done ? ic('check') : '') + '</button></div>';
}
function todayH() {
  const k = dk(), ts = tasksFor(k), done = ts.filter(t => isDone(t, k)).length, tot = ts.length, ph = phase(), dl = daysLeft(), M = mins(), wk = weakest(), lv = IE.level();
  const next = ts.find(t => !isDone(t, k)), pct = tot ? Math.round(done / tot * 100) : 0;
  const hero = '<div class="phero"><div class="ph-l"><div class="ph-d">' + dateTxt(k) + '</div><h2>' + (pct === 100 ? 'Ajoyib! Bugun tayyor 🎉' : done ? 'Davom eting — oz qoldi' : 'Bugungi reja') + '</h2><div class="ph-m">' + ts.reduce((n, t) => n + t.m, 0) + ' daqiqa · ' + tot + ' vazifa</div>' +
    '<div class="ph-b" style="--c:' + ph.c + '">' + esc(ph.n) + (dl != null && dl >= 0 ? ' · ' + dl + ' kun qoldi' : '') + '</div></div>' + ring(pct, 96, done + '/' + tot, 'bajarildi') + '</div>';
  const rest = isRest(k), st0 = prof().start || '19:00', toM = h => { const q = /^(\d{1,2}):(\d{2})$/.exec(h || ''); return q ? (+q[1]) * 60 + (+q[2]) : 19 * 60; }, hm = m => String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0');
  let cur = toM(st0); const times = ts.map(t => { const a = cur; cur += t.m + 5; return hm(a); });
  const acts = '<div class="pacts"><button class="pact" data-a="ptadd">' + ic('plus') + '<span>Vazifa</span></button><button class="pact" data-go="focus">' + ic('zap') + '<span>Fokus' + (IE.focusMins() ? ' · ' + IE.focusMins() + '’' : '') + '</span></button><button class="pact' + (rest ? ' on' : '') + '" data-a="prest">' + ic('bed') + '<span>' + (rest ? 'Rejaga qaytish' : 'Dam kuni') + '</span></button></div>' +
    '<button class="aibn rise" style="margin-top:12px" data-a="agopen">' + bd('sparkl', 'A', 'lg') + '<div style="flex:1"><h3>AI bilan reja tuzish</h3><p>“2 haftalik reja tuz” desangiz AI tuzadi, siz tasdiqlaysiz</p></div><span class="go">' + ic('next') + '</span></button>';
  const go = next ? '<button class="btn block pgo" data-go="' + next.go + '">' + ic('play') + ' Keyingisi: ' + esc(next.t) + '</button>' : '<div class="card c rise" style="margin-top:12px"><b>Hammasi bajarildi!</b><div class="sm mu">Ixtiyoriy: Practice’dan yana mashq qiling yoki dam oling.</div></div>';
  const ins = '<div class="card pins"><div class="row">' + bd('bulb', 'T', 'sm') + '<div style="flex:1"><b>Kun maslahati</b><div class="sm mu" style="margin-top:2px">' + esc(tipOf(k)) + '</div></div></div>' +
    (wk && IE.skillBands()[wk] != null ? '<div class="sm" style="margin-top:10px;padding-top:10px;border-top:1px solid var(--ln)"><b>Eng zaif: ' + ({ L: 'Listening', R: 'Reading', W: 'Writing', S: 'Speaking' })[wk] + '</b> <span class="mu">(' + IE.bandTxt(IE.skillBands()[wk]) + ' → maqsad ' + IE.bandTxt(prof().target) + ') — rejada unga qo‘shimcha vazifa bor.</span></div>' : '') + '</div>';
  if (rest) return hero.replace('Bugungi reja', 'Dam olish kuni') + '<div class="card c rise" style="margin-top:12px"><div style="font-size:44px">😌</div><b style="font-size:18px">Bugun dam olasiz</b><div class="sm mu" style="margin:6px 0 0">Seriyangiz saqlanadi. Miya ham dam olganda o‘rganadi — ertaga yangi kuch bilan davom etamiz.</div></div>' + acts + ins;
  return hero + go + '<div class="sec"><h2>Vazifalar</h2><span class="row" style="gap:6px"><button class="chip" data-a="pstart">' + ic('clock') + ' ' + st0 + '</button><button class="chip" data-a="pmins">' + M + ' daq</button><button class="chip' + (V.pedit ? ' on' : '') + '" data-a="pedit">' + ic('edit') + ' ' + (V.pedit ? 'Tayyor' : 'Tahrir') + '</button></span></div><div class="plist">' + ts.map((t, i) => taskRow(t, k, times[i], i, ts.length)).join('') + '</div>' + acts + ins +
    '<div class="card" style="margin-top:12px"><div class="row" style="justify-content:space-between"><div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">Daraja ' + lv.L + ' · ' + lv.name + '</div><div class="sm mu">' + lv.xp + ' XP · keyingisigacha ' + (lv.hi - lv.xp) + '</div></div><button class="chip" data-go="achievements">' + ic('trophy') + ' Yutuqlar</button></div><div class="prog" style="margin-top:10px"><i style="width:' + lv.pct + '%"></i></div></div>';
}
A.pchk = el => {
  const k = el.dataset.k, id = el.dataset.id, s = S(), pd = s.pdone[k] || (s.pdone[k] = {}), t = tasksFor(k).find(x => x.id === id); if (!t) return;
  if (isDone(t, k) && !pd[id]) return IE.toast('Bu avtomatik belgilangan — mashq bajarilgan');
  if (pd[id]) delete pd[id]; else { pd[id] = Date.now(); IE.vib(18); }
  if (pd._ && !tasksFor(k).every(x => isDone(x, k))) delete pd._;
  IE.save(); IE.draw(false); IE.planCheck();
};
A.pedit = () => { V.pedit = !V.pedit; IE.draw(false); };
A.pmove = el => {
  const k = el.dataset.k, id = el.dataset.id, d = +el.dataset.d, ids = tasksFor(k).map(t => t.id), i = ids.indexOf(id), j = i + d; if (i < 0 || j < 0 || j >= ids.length) return;
  [ids[i], ids[j]] = [ids[j], ids[i]]; const s = S(); s.pord = s.pord || {}; s.pord[k] = { l: ids, t: Date.now() }; const ks = Object.keys(s.pord).sort(); while (ks.length > 90) delete s.pord[ks.shift()]; IE.save(); IE.vib(8); IE.draw(false);
};
const MCH = [10, 15, 20, 30, 45, 60, 90];
A.ptedit = el => {
  const k = el.dataset.k, t = ((S().ptask || {})[k] || []).find(x => x.id === el.dataset.id); if (!t) return;
  IE.sheet('<h2>Vazifani tahrirlash</h2><div class="fld" style="margin-top:10px"><label>Nomi</label><input id="pet" maxlength="80" value="' + esc(t.t) + '"></div><div class="fld"><label>Daqiqa</label><div class="seg wrap" id="pem">' + MCH.map(m => '<button class="' + (m === t.m ? 'on' : '') + '" data-a="pemin" data-m="' + m + '">' + m + '</button>').join('') + '</div><input id="pemn" type="number" inputmode="numeric" min="5" max="240" placeholder="yoki daqiqa yozing" value="' + (MCH.includes(t.m) ? '' : t.m) + '" style="margin-top:6px"></div><div class="fld"><label>Sana</label><input id="ped" type="date" min="' + dk() + '" value="' + k + '"></div><div class="two" style="margin-top:12px"><button class="btn ghost" data-a="sheet-x">Bekor</button><button class="btn" data-a="pesave" data-id="' + esc(t.id) + '" data-k="' + k + '">Saqlash</button></div>');
};
A.pemin = el => { document.querySelectorAll('#pem button').forEach(b => b.classList.toggle('on', b === el)); const i = $('#pemn'); if (i) i.value = ''; };
A.pesave = el => {
  const s = S(), k = el.dataset.k, t = ((s.ptask || {})[k] || []).find(x => x.id === el.dataset.id); if (!t) return;
  const nm = ($('#pet') || {}).value ? $('#pet').value.trim().slice(0, 80) : '', b = $('#pem .on'), custom = Math.round(+(($('#pemn') || {}).value || 0)), m = custom >= 5 && custom <= 240 ? custom : b ? +b.dataset.m : t.m, nd = ($('#ped') || {}).value || k;
  if (nm.length < 2) return IE.toast('Nomini yozing'); if (nd < dk()) return IE.toast('O‘tgan sanaga ko‘chirib bo‘lmaydi');
  const now = Date.now();
  if (nd === k) { t.t = nm; t.m = m; t.mt = now; }
  else { t.del = true; t.mt = now; (s.ptask[nd] = s.ptask[nd] || []).push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2, 5), t: nm, m, go: t.go || '', ai: t.ai ? 1 : 0, ts: now, mt: now }); }
  IE.save(); IE.closeSheet(); IE.toast(nd === k ? 'Saqlandi' : 'Boshqa kunga ko‘chirildi'); IE.draw(false);
};
A.ptadd = el => { const k0 = el && el.dataset && el.dataset.k ? el.dataset.k : dk(); IE.sheet('<h2>Shaxsiy vazifa</h2><p class="mu sm" style="margin:4px 0 12px">Rejaga o‘zingizning vazifangizni qo‘shing (masalan: “Cambridge 17 Test 2 Listening”).</p><div class="fld"><label>Nomi</label><input id="ptn" placeholder="Vazifa nomi" maxlength="80"></div><div class="fld"><label>Daqiqa</label><div class="seg wrap" id="ptm">' + [10, 15, 20, 30, 45, 60, 90].map(m => '<button class="' + (m === 20 ? 'on' : '') + '" data-a="ptmin" data-m="' + m + '">' + m + '</button>').join('') + '</div><input id="ptmn" type="number" inputmode="numeric" min="5" max="240" placeholder="yoki daqiqa yozing" style="margin-top:6px"></div><div class="fld"><label>Sana</label><input id="ptd" type="date" min="' + dk() + '" value="' + k0 + '"></div><button class="btn block" style="margin-top:6px" data-a="ptsave">Qo‘shish</button>'); };
A.ptmin = el => { document.querySelectorAll('#ptm button').forEach(b => b.classList.toggle('on', b === el)); const i = $('#ptmn'); if (i) i.value = ''; };
A.ptsave = () => { const i = $('#ptn'), t = i ? i.value.trim() : ''; if (!t) return IE.toast('Vazifa nomini yozing'); const b = $('#ptm .on'), cm = Math.round(+(($('#ptmn') || {}).value || 0)), m = cm >= 5 && cm <= 240 ? cm : b ? +b.dataset.m : 20, k = ($('#ptd') || {}).value || dk(), s = S(); if (k < dk()) return IE.toast('O‘tgan sanaga qo‘shib bo‘lmaydi'); s.ptask = s.ptask || {}; (s.ptask[k] = s.ptask[k] || []).push({ id: Date.now().toString(36), t, m, ts: Date.now(), mt: Date.now() }); IE.save(); IE.closeSheet(); IE.toast(k === dk() ? 'Qo‘shildi' : 'Qo‘shildi: ' + dateTxt(k)); IE.draw(false); };
A.pdel = el => { const s = S(), k = el.dataset.k, t = ((s.ptask || {})[k] || []).find(x => x.id === el.dataset.id); if (!t) return; t.del = true; t.mt = Date.now(); IE.save(); IE.draw(false); };
A.prest = () => { const s = S(), k = dk(); s.prest = s.prest || {}; const on = !isRest(k); s.prest[k] = { on, t: Date.now() }; IE.save(); IE.toast(on ? 'Dam olish kuni belgilandi — seriya saqlanadi' : 'Reja qaytarildi'); IE.draw(false); };
A.pstart = () => IE.sheet('<h2>Qachon o‘qiysiz?</h2><p class="mu sm" style="margin:4px 0 12px">Vazifalar shu vaqtdan boshlab jadvalga qo‘yiladi.</p><div class="fld"><input id="pst" type="time" value="' + esc(prof().start || '19:00') + '"></div><button class="btn block" data-a="pstsave">Saqlash</button>');
A.pstsave = () => { const i = $('#pst'); if (!i || !i.value) return; const s = S(); s.prof.start = i.value; s.pts = Date.now(); IE.save(); IE.closeSheet(); IE.draw(false); };
A.pmins = () => IE.sheet('<h2>Kuniga qancha vaqt ajrata olasiz?</h2><p class="mu sm" style="margin:4px 0 14px">Reja shunga moslanadi. Keyinroq o‘zgartirsa bo‘ladi.</p><div class="lst">' + [[30, 'Yengil', 'Faqat eng muhimi'], [45, 'Qisqa', 'Asosiy + so‘zlar'], [60, 'Standart', 'Tavsiya etiladi'], [90, 'Jiddiy', 'Mock va Writing sig‘adi'], [120, 'Intensiv', 'To‘liq tayyorgarlik'], [180, 'Maksimal', 'Imtihon oldi']].map(x => '<button class="item' + (mins() === x[0] ? ' sel' : '') + '" data-a="pset" data-v="' + x[0] + '"><span class="qn" style="width:auto;padding:0 10px">' + x[0] + '</span><div class="tx"><b>' + x[1] + '</b><span>' + x[2] + '</span></div></button>').join('') + '</div><div class="fld" style="margin-top:14px"><label>Yoki o‘zingiz kiriting (20–720 daqiqa)</label><div class="row" style="gap:8px"><input id="pmv" type="number" inputmode="numeric" min="20" max="720" step="5" value="' + mins() + '" style="flex:1"><button class="btn" data-a="pmsave">Saqlash</button></div></div>');
A.pmsave = () => { const i = $('#pmv'), v = Math.round(+(i ? i.value : 0)); if (!(v >= 20 && v <= 720)) return IE.toast('20 dan 720 gacha daqiqa kiriting'); const s = S(); s.prof.mins = v; s.pts = Date.now(); IE.save(); IE.closeSheet(); IE.toast('Reja yangilandi: ' + v + ' daq'); IE.draw(false); };
A.pset = el => { const s = S(); s.prof.mins = +el.dataset.v; s.pts = Date.now(); IE.save(); IE.closeSheet(); IE.toast('Reja yangilandi'); IE.draw(false); };

function weekDays() { const k = dk(), dow = dowOf(k), mon = addD(k, -((dow + 6) % 7)); return Array.from({ length: 7 }, (_, i) => addD(mon, i)); }
function weekH() { return (IE.coachCard ? IE.coachCard(true) + '<div style="height:12px"></div>' : '') + IE.weekCard() + '<div style="height:12px"></div>' + weekH0(); }
function weekH0() {
  const today = dk(), days = weekDays(); let pl = 0, dn = 0, mn = 0;
  const rows = days.map(k => {
    const past = k < today, ts = past ? [] : tasksFor(k), c = cnt(k), isT = k === today;
    const done = ts.filter(t => isDone(t, k)).length; if (!past) { pl += ts.length; dn += done; mn += ts.reduce((n, t) => n + t.m, 0); }
    const chips = past ? ['R', 'L', 'W', 'S', 'T', 'A', 'M'].filter(x => c[x]).map(x => '<span class="wchip sk-' + (x === 'T' ? 'W' : x === 'A' ? 'L' : x) + '">' + ({ R: 'Reading', L: 'Listening', W: 'Writing', S: 'Speaking', T: 'Typing', A: 'Maqola', M: 'Mock' })[x] + (c[x] > 1 ? ' ×' + c[x] : '') + '</span>').join('') + (c.V >= 5 ? '<span class="wchip sk-V">So‘zlar</span>' : '') : ts.map(t => '<span class="wchip sk-' + t.k + (isDone(t, k) ? ' ok' : '') + '">' + (isDone(t, k) ? '✓ ' : '') + esc(t.t.replace('Kitob: ', '📖 ')) + '</span>').join('');
    const pct = past ? (act(c) ? 100 : 0) : (ts.length ? Math.round(done / ts.length * 100) : 0);
    return '<button class="wday' + (isT ? ' today' : '') + (past ? ' past' : '') + '" data-a="pday" data-k="' + k + '"><div class="wd-h"><b>' + WD[dowOf(k)].slice(0, 3) + '</b><span>' + parse(k).getDate() + '</span></div><div class="wd-b">' + (chips || '<span class="mu xs">' + (past ? 'Faollik yo‘q' : 'Dam olish') + '</span>') + '</div><div class="wd-r" style="--v:' + pct + '"><i></i></div></button>';
  }).join('');
  const pctW = pl ? Math.round(dn / pl * 100) : 0;
  return '<div class="card"><div class="row" style="justify-content:space-between"><div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">Shu hafta</div><div style="font-size:24px;font-weight:900">' + dn + '/' + pl + ' <span class="sm mu">vazifa</span></div></div>' + ring(pctW, 70, pctW + '%') + '</div><div class="sm mu" style="margin-top:6px">Qolgan reja: ≈ ' + Math.round(mn / 60 * 10) / 10 + ' soat · seriya: <b>' + IE.streak() + ' kun</b></div></div>' +
    '<div class="sec"><h2>Kunlar</h2></div><div class="wlist">' + rows + '</div><p class="hint" style="margin-top:12px">' + ic('bulb') + ' Kunni bossangiz — tafsilotlari ochiladi. Reja kun, vaqtingiz va zaif tomoningizga qarab har kuni yangilanadi.</p>';
}
A.pday = el => {
  const k = el.dataset.k, ts = k >= dk() ? tasksFor(k) : [], c = cnt(k);
  IE.sheet('<h2>' + dateTxt(k) + '</h2>' + (k < dk() ? '<p class="mu sm" style="margin:6px 0 10px">O‘tgan kun: ' + (act(c) ? 'faollik bor — ' + ['R', 'L', 'W', 'S', 'T', 'M'].filter(x => c[x]).map(x => ({ R: 'Reading', L: 'Listening', W: 'Writing', S: 'Speaking', T: 'Typing', M: 'Mock' })[x]).join(', ') + (c.V ? (c.V ? ', ' + c.V + ' ta so‘z' : '') : '') : 'faollik yo‘q') + '.</p>' : '<div class="plist" style="margin-top:12px">' + ts.map(t => taskRow(t, k)).join('') + '</div>' + '<p class="mu xs" style="margin-top:10px">Jami ≈ ' + ts.reduce((n, t) => n + t.m, 0) + ' daqiqa.</p>' + (ts.some(t => t.custom) ? '<div class="dchips" style="margin-top:8px">' + ts.filter(t => t.custom).map(t => '<button class="chip" data-a="ptedit" data-id="' + esc(t.cid) + '" data-k="' + k + '">' + ic('edit') + ' ' + esc(t.t.slice(0, 26)) + '</button>').join('') + '</div>' : '') + '<button class="btn block ghost" style="margin-top:12px" data-a="ptadd" data-k="' + k + '">' + ic('plus') + ' Shu kunga vazifa qo‘shish</button>'));
};
function monthH() { return '<div class="card rise"><div class="row" style="justify-content:space-between"><b style="font-size:16px">Faollik xaritasi</b><span class="sm mu">12 hafta</span></div>' + IE.heat(12) + '<div class="row sm mu" style="justify-content:space-between;margin-top:8px"><span>Kam</span><span class="cal-lg"><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><span>Ko‘p</span></div></div><div style="height:12px"></div>' + monthH0(); }
function monthH0() {
  const off = V.pmo || 0, now = new Date(), base = new Date(now.getFullYear(), now.getMonth() + off, 1), y = base.getFullYear(), mo = base.getMonth(), first = new Date(y, mo, 1), nd = new Date(y, mo + 1, 0).getDate(), lead = (first.getDay() + 6) % 7, today = dk();
  let study = 0, tot = { R: 0, L: 0, W: 0, S: 0, T: 0, V: 0, M: 0, P: 0 }; const cells = [];
  for (let i = 0; i < lead; i++) cells.push('<i class="cal-e"></i>');
  for (let d = 1; d <= nd; d++) {
    const k = y + '-' + String(mo + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'), c = cnt(k), a = act(c), has = S().days.includes(k) || a > 0, full = S().pdone[k] && S().pdone[k]._;
    if (has) study++; Object.keys(tot).forEach(x => { tot[x] += c[x] || 0; });
    const lv = !has ? 0 : a >= 5 ? 4 : a >= 3 ? 3 : a >= 2 ? 2 : 1;
    cells.push('<button class="cal-d l' + lv + (k === today ? ' now' : '') + (k > today ? ' fut' : '') + '" data-a="pday" data-k="' + k + '"><span>' + d + '</span>' + (full ? '<em>★</em>' : '') + '</button>');
  }
  const M = mins(), f = M / 60, goals = [['R', 'Reading', 8, 'sk-R'], ['L', 'Listening', 10, 'sk-L'], ['W', 'Writing', 6, 'sk-W'], ['S', 'Speaking', 8, 'sk-S'], ['V', 'So‘z takrori (bet)', 0, 'sk-V']].filter(g => g[2]).map(g => { const target = Math.max(2, Math.round(g[2] * f)); return [g[1], tot[g[0]], target, g[3]]; });
  goals.push(['Mock Test', tot.M, Math.max(1, Math.round(2 * Math.min(1.5, f))), 'sk-M'], ['Typing', tot.T, Math.max(4, Math.round(12 * f)), 'sk-W']);
  const road = roadmap();
  return '<div class="card"><div class="row" style="justify-content:space-between"><button class="ib" data-a="pmo" data-d="-1" aria-label="Oldingi oy">' + ic('back') + '</button><b style="font-size:17px">' + y + ' · ' + MO[mo][0].toUpperCase() + MO[mo].slice(1) + '</b><button class="ib" data-a="pmo" data-d="1" aria-label="Keyingi oy"' + (off >= 0 ? ' disabled' : '') + '>' + ic('next') + '</button></div>' +
    '<div class="cal-h">' + ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'].map(x => '<span>' + x + '</span>').join('') + '</div><div class="cal">' + cells.join('') + '</div>' +
    '<div class="row sm mu" style="justify-content:space-between;margin-top:10px"><span><b style="color:var(--tx)">' + study + '</b> kun o‘qidingiz</span><span class="cal-lg"><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i> ko‘proq</span><span>★ reja bajarilgan</span></div></div>' +
    '<div class="sec"><h2>Oylik maqsadlar</h2><span class="mu xs">Kuniga ' + M + ' daq asosida</span></div><div class="card goals">' + goals.map(g => '<div class="goal"><div class="row" style="justify-content:space-between"><b>' + g[0] + '</b><span class="sm mu">' + g[1] + ' / ' + g[2] + '</span></div><div class="prog ' + g[3] + '"><i style="width:' + Math.min(100, Math.round(g[1] / g[2] * 100)) + '%"></i></div></div>').join('') + '</div>' +
    '<div class="sec"><h2>Imtihongacha yo‘l xaritasi</h2></div>' + (road && road.length ? '<div class="road">' + road.map((r, i) => { const now = r.a <= today && today < r.z; return '<div class="rd' + (now ? ' now' : '') + '" style="--c:' + r.c + '"><div class="rd-dot"></div><div class="rd-b"><b>' + r.n + (now ? ' <span class="chip">hozir</span>' : '') + '</b><span class="sm mu">' + parse(r.a).getDate() + '.' + String(parse(r.a).getMonth() + 1).padStart(2, '0') + ' — ' + parse(r.z).getDate() + '.' + String(parse(r.z).getMonth() + 1).padStart(2, '0') + ' · ' + r.days + ' kun</span><span class="sm">' + esc(r.d) + '</span></div></div>'; }).join('') + '</div><p class="hint" style="margin-top:10px">' + ic('target') + ' Imtihon: <b>' + fmt(prof().date) + '</b> · maqsad band <b>' + IE.bandTxt(prof().target) + '</b></p>' : '<div class="card empty">' + bd('cal', 'T') + 'Imtihon sanasini belgilang — ilova sizga bosqichma-bosqich yo‘l xaritasi tuzadi.<br><button class="btn sm" style="margin-top:12px" data-go="me">Profilga o‘tish</button></div>');
}
const fmt = k => { const d = parse(k); return d.getDate() + '.' + String(d.getMonth() + 1).padStart(2, '0') + '.' + d.getFullYear(); };
A.pmo = el => { V.pmo = Math.min(0, (V.pmo || 0) + (+el.dataset.d)); IE.draw(false); };

/* ---------- Yutuqlar ---------- */
R.achievements = () => {
  const lv = IE.level(), bs = IE.badges(), got = bs.filter(b => b.got).length, st = IE.streak();
  const o = sub('Yutuqlar', 'home', '<div class="pad"><div class="lvl rise"><div class="lv-n"><small>DARAJA</small><b>' + lv.L + '</b></div><div style="flex:1"><div class="lv-t">' + esc(lv.name) + '</div><div class="sm" style="opacity:.85">' + lv.xp + ' XP · keyingisiga ' + (lv.hi - lv.xp) + '</div><div class="lv-bar"><i style="width:' + lv.pct + '%"></i></div></div></div>' +
    '<div class="stats rise" style="margin-top:14px"><div class="stat"><b>' + st + '</b><span>Seriya</span></div><div class="stat"><b>' + bestStreak() + '</b><span>Eng uzun</span></div><div class="stat"><b>' + S().days.length + '</b><span>Kun</span></div><div class="stat"><b>' + got + '/' + bs.length + '</b><span>Yutuq</span></div></div>' +
    '<div class="sec"><h2>Nishonlar</h2></div><div class="bgrid">' + bs.map(b => '<div class="bgc' + (b.got ? ' got' : '') + '"><div class="bgi">' + ic(b.i) + '</div><b>' + esc(b.t) + '</b><span>' + esc(b.d) + '</span></div>').join('') + '</div></div>');
  return o;
};

/* ---------- Home vidjetlari ---------- */
IE.homePlan = () => {
  const p = IE.planToday(), next = p.ts.find(t => !t.done), pct = p.total ? Math.round(p.done / p.total * 100) : 0, st = IE.streak(), lv = IE.level();
  const wk = weekDays(), today = dk(), set = new Set(S().days);
  const strip = wk.map(k => { const a = act(cnt(k)) || set.has(k), f = S().pdone[k] && S().pdone[k]._; return '<div class="wk' + (k === today ? ' now' : '') + (a ? ' on' : '') + '"><span>' + WS[dowOf(k)] + '</span><i>' + (f ? '★' : a ? '✓' : (k < today ? '' : '·')) + '</i></div>'; }).join('');
  return '<div class="card hplan rise"><div class="row" style="justify-content:space-between;align-items:flex-start"><div style="flex:1;min-width:0"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">Bugungi reja</div><div style="font-size:22px;font-weight:900;line-height:1.2;margin:2px 0 4px">' + (isRest(p.k) ? 'Dam olish kuni 😌' : pct === 100 ? 'Hammasi tayyor! 🎉' : next ? esc(next.t) : 'Dam oling') + '</div><div class="sm mu">' + (isRest(p.k) ? 'Seriyangiz saqlanadi' : next ? esc(next.sub) : 'Barakalla — yana mashq qilsangiz ham bo‘ladi') + '</div></div>' + ring(pct, 78, p.done + '/' + p.total) + '</div>' +
    '<div class="hp-t">' + p.ts.slice(0, 5).map(t => '<span class="hpc sk-' + t.k + (t.done ? ' ok' : '') + '">' + (t.done ? '✓ ' : '') + esc(t.t.replace('Kitob: ', '📖 ').replace(' Task 2', '').replace('So‘zlarni takrorlash', 'So‘zlar').replace('Mini Mock Test', 'Mock')) + '</span>').join('') + '</div>' +
    '<div class="two" style="margin-top:12px">' + (next ? '<button class="btn" data-go="' + next.go + '">' + ic('play') + ' Boshlash</button>' : '<button class="btn" data-go="practice">Mashq qilish</button>') + '<button class="btn ghost" data-go="plan">Butun reja</button></div>' +
    '<div class="wkstrip">' + strip + '</div>' +
    '<button class="hp-lv" data-go="achievements"><span class="lvb">' + lv.L + '</span><div style="flex:1;text-align:left"><b>' + esc(lv.name) + '</b><div class="prog" style="margin-top:5px"><i style="width:' + lv.pct + '%"></i></div></div><span class="sm mu">' + lv.xp + ' XP</span></button></div>';
};
/** Kun so‘zi: har kun bitta so‘z (lug‘atdan). */
IE.wotd = () => {
  const ws = []; D.vocab.topics.forEach(t => t.words.forEach(w => ws.push(w))); if (!ws.length) return '';
  const w = ws[dayN(dk()) % ws.length], has = S().my.some(x => x.id === 'my:' + w.w.toLowerCase()) || !!S().srs[w.id];
  return '<div class="card wotd rise"><div class="row" style="justify-content:space-between"><span class="chip">Kun so‘zi</span><button class="ib" data-a="say" data-t="' + esc(w.w) + '" aria-label="Eshitish">' + ic('spk') + '</button></div><div class="wo-w">' + esc(w.w) + '</div><div class="wo-u">' + esc(w.uz) + '</div><div class="wo-e">“' + esc(w.ex) + '”</div>' + (has ? '<div class="sm mu" style="margin-top:10px">' + ic('check') + ' Lug‘atingizda bor</div>' : '<button class="btn sm" style="margin-top:12px" data-a="wotd" data-id="' + esc(w.id) + '">' + ic('star') + ' Lug‘atimga qo‘shish</button>') + '</div>';
};
A.wotd = el => { let w = null; D.vocab.topics.forEach(t => t.words.forEach(x => { if (x.id === el.dataset.id) w = x; })); if (!w) return; const id = 'my:' + w.w.toLowerCase(); if (!S().my.some(x => x.id === id)) S().my.push({ id, w: w.w, uz: w.uz, def: '', ex: w.ex, pos: '', ts: Date.now() }); IE.vib(15); IE.save(); IE.toast('Lug‘atingizga qo‘shildi'); IE.draw(false); };
IE.greet = () => { const h = new Date().getHours(); return h < 5 ? 'Xayrli tun' : h < 12 ? 'Xayrli tong' : h < 18 ? 'Xayrli kun' : 'Xayrli kech'; };
})();
