/* IELTS · BY AZIMOV — Mock Test: Listening → Reading → Writing → Speaking ketma-ketligi; natijalar mavjud mashq yozuvlaridan yig‘iladi. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, fmtD } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, D = IE.D;
const sub = (title, back, inner) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1></header><div class="scr sub">' + inner + '</div>', sub: true });
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const MODES = { full: { name: 'To‘liq mock', info: '4 ta Listening, 3 ta Reading (40 savol), Writing Task 1 + Task 2 va Speaking (Part 1, 2, 3)', time: '≈ 3 soat', L: 4, R: 3 }, mini: { name: 'Tezkor mock', info: '2 ta Listening, 1 ta Reading, Writing Task 1 + Task 2 va Speaking (Part 1, 2, 3)', time: '≈ 1 soat 30 daq', L: 2, R: 1 } };
const ex = (arr, n) => shuffle(arr).slice(0, n);

function makePlan(mode) {
  const s = S(), seen = new Set(s.listens.map(x => x.id)), tl = D.listening.tests.filter(t => !t.priv).map(t => t.id);
  const fresh = shuffle(tl.filter(i => !seen.has(i))), old = shuffle(tl.filter(i => seen.has(i)));
  const rs = D.reading.passages.filter(p => !p.priv).map(p => p.id), M = MODES[mode];
  const wn = Math.floor(Math.random() * 30), p1 = Math.floor(Math.random() * D.prompts.sp1.length), p2 = Math.floor(Math.random() * D.prompts.sp2.length);
  return { id: 'm' + Date.now(), ts: Date.now(), mode, L: [...fresh, ...old].slice(0, M.L), R: ex(rs, M.R), W: wn, W1: IE.T1 && IE.T1.length ? 't1:' + IE.T1[Math.floor(Math.random() * IE.T1.length)].id : '', S: { p1, p2 } };
}
/* bajarilganlik: mock boshlangandan keyingi yozuvlardan */
function progress(m) {
  const s = S(), after = x => x.ts >= m.ts, last = (arr, key, v) => arr.filter(x => after(x) && x[key] === v).slice(-1)[0];
  const L = m.L.map(id => last(s.listens, 'id', id) || null), Rr = m.R.map(id => last(s.reads, 'p', id) || null);
  const W = s.writes.filter(x => after(x) && x.p === m.W).slice(-1)[0] || null, W1 = m.W1 ? s.writes.filter(x => after(x) && x.p === m.W1).slice(-1)[0] || null : null;
  const t1 = D.prompts.sp1[m.S.p1].t, t2 = D.prompts.sp2[m.S.p2].t.replace('Describe ', '');
  const S1 = s.speaks.filter(x => after(x) && x.k === '1' && x.t === t1).slice(-1)[0] || null, S2 = s.speaks.filter(x => after(x) && x.k === '2' && x.t === t2).slice(-1)[0] || null, S3 = (D.prompts.sp2[m.S.p2].f || []).length ? s.speaks.filter(x => after(x) && x.k === '3' && x.t === t2).slice(-1)[0] || null : undefined;
  const total = m.L.length + m.R.length + 3 + (m.W1 ? 1 : 0) + (S3 !== undefined ? 1 : 0), done = L.filter(Boolean).length + Rr.filter(Boolean).length + (W ? 1 : 0) + (W1 ? 1 : 0) + (S1 ? 1 : 0) + (S2 ? 1 : 0) + (S3 ? 1 : 0);
  return { L, R: Rr, W, W1, S1, S2, S3, done, total, all: done === total };
}
function results(m, p) {
  const sumL = p.L.filter(Boolean), sumR = p.R.filter(Boolean);
  const bl = sumL.length ? IE.bandL(sumL.reduce((a, x) => a + x.raw, 0), sumL.reduce((a, x) => a + x.tot, 0)) : null;
  const br = sumR.length ? IE.band(sumR.reduce((a, x) => a + x.raw, 0), sumR.reduce((a, x) => a + x.tot, 0)) : null;
  const w1 = p.W1 && p.W1.ai ? p.W1.ai.overall : null, w2 = p.W && p.W.ai ? p.W.ai.overall : null, bw = w2 == null ? null : w1 == null ? w2 : Math.round((w1 + 2 * w2) / 3 * 2) / 2, sp = [p.S1, p.S2, p.S3].filter(x => x && x.ai).map(x => x.ai.overall), bs = sp.length ? Math.round(sp.reduce((a, b) => a + b, 0) / sp.length * 2) / 2 : null;
  const have = [bl, br, bw, bs].filter(x => x != null), overall = have.length ? Math.round(have.reduce((a, b) => a + b, 0) / have.length * 2) / 2 : null;
  return { L: bl, R: br, W: bw, S: bs, overall, partial: have.length < 4 };
}
const cur = () => { const m = S().mock; return m && m.id ? m : null; };
IE.mockActive = () => !!cur();

/* ---------- markaz ---------- */
R.mock = a => {
  if (a[0] === 'r') return report(+a[1]);
  const m = cur();
  return m ? running(m) : start();
};
function start() {
  const hist = S().mocks.slice().reverse().slice(0, 6);
  return sub('Mock Test', 'practice', '<div class="pad"><div class="card rise" style="margin-bottom:14px"><div class="row">' + bd('trophy', 'M', 'lg') + '<div style="flex:1"><b style="font-size:16px">Imtihon sinovi</b><div class="sm mu">Bo‘limlarni ketma-ket topshirasiz, natijalar avtomatik yig‘iladi va umumiy band hisoblanadi.</div></div></div></div><div class="lst">' +
    Object.entries(MODES).map(([k, v]) => '<button class="item rise" data-a="mstart" data-m="' + k + '">' + bd(k === 'full' ? 'trophy' : 'clock', k === 'full' ? 'M' : 'W', 'sm') + '<div class="tx"><b>' + v.name + '</b><span style="white-space:normal;display:block">' + v.info + ' · ' + v.time + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>' +
    '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Imtihon rejimida bajaring: Listening audiosi bir marta, Reading’da 20 daqiqa. Writing va Speaking’ni AI bilan baholatsangiz, overall band to‘liq hisoblanadi.</p>' +
    (hist.length ? '<div class="sec"><h2>Oldingi sinovlar</h2></div><div class="lst">' + hist.map(h => '<button class="item" data-go="mock/r/' + h.ts + '">' + bd('trophy', 'M', 'sm') + '<div class="tx"><b>' + (MODES[h.mode] || MODES.full).name + '</b><span>' + fmtD(h.ts) + '</span></div><span class="band sk-M">' + IE.bandTxt(h.overall) + '</span></button>').join('') + '</div>' : '') + '</div>');
}
A.mstart = el => { const mode = el.dataset.m; S().mock = makePlan(mode); IE.touchDay(); IE.save(true); IE.go('mock'); };
A.mquit = () => IE.ask('Mock bekor qilinsinmi?', 'Joriy sinov to‘xtatiladi (mashq natijalari saqlanib qoladi).', 'Bekor qilish', () => { S().mock = null; IE.save(true); IE.draw(false); });

const row = (icon, sk, title, meta, go, done) => '<button class="item" data-go="' + go + '">' + bd(icon, sk, 'sm') + '<div class="tx"><b>' + esc(title) + '</b><span>' + esc(meta) + '</span></div>' + (done ? '<span class="chip ok">' + ic('check') + ' ' + esc(done) + '</span>' : '<span class="go">' + ic('next') + '</span>') + '</button>';
function running(m) {
  const p = progress(m), pc = Math.round(p.done / p.total * 100);
  const tl = id => D.listening.tests.find(t => t.id === id), pr = id => D.reading.passages.find(x => x.id === id);
  const next = (() => {
    const l = m.L.findIndex((id, i) => !p.L[i]); if (l >= 0) return 'listening/' + m.L[l];
    const r = m.R.findIndex((id, i) => !p.R[i]); if (r >= 0) return 'reading/' + m.R[r] + '/run';
    if (m.W1 && !p.W1) return 'writing/p/' + m.W1; if (!p.W) return 'writing/p/' + m.W; if (!p.S1) return 'speaking/1/' + m.S.p1; if (!p.S2) return 'speaking/2/' + m.S.p2; if (p.S3 === null) return 'speaking/3/' + m.S.p2; return '';
  })();
  const inner = '<div class="pad"><div class="card rise"><div class="row"><div style="flex:1"><b style="font-size:16px">' + MODES[m.mode].name + '</b><div class="sm mu">' + MODES[m.mode].time + ' · ' + p.done + ' / ' + p.total + ' bajarildi</div></div><span class="chip">' + pc + '%</span></div><div class="prog" style="margin-top:12px"><i style="width:' + pc + '%"></i></div>' +
    (p.all ? '<button class="btn block" style="margin-top:14px" data-a="mfin">' + ic('trophy') + ' Natijani ko‘rish</button>' : '<button class="btn block" style="margin-top:14px" data-go="' + next + '">' + ic('play') + ' Keyingi bo‘lim</button>') + '</div>' +
    '<div class="sec"><h2>Listening</h2></div><div class="lst">' + m.L.map((id, i) => row('head', 'L', 'Section ' + (i + 1) + ' · ' + (tl(id).topic.split(' · ')[1] || tl(id).title), mmss(tl(id).dur) + ' · 10 savol', 'listening/' + id, p.L[i] ? p.L[i].raw + '/' + p.L[i].tot : '')).join('') + '</div>' +
    '<div class="sec"><h2>Reading</h2></div><div class="lst">' + m.R.map((id, i) => row('book', 'R', 'Passage ' + (i + 1) + ' · ' + pr(id).title, '20 daqiqa · ' + nqOf(pr(id)) + ' savol', 'reading/' + id + '/run', p.R[i] ? p.R[i].raw + '/' + p.R[i].tot : '')).join('') + '</div>' +
    '<div class="sec"><h2>Writing</h2></div><div class="lst">' + (m.W1 && IE.t1Find(m.W1) ? row('pen', 'W', 'Task 1 · ' + IE.t1Find(m.W1).title, '20 daqiqa · kamida 150 so‘z', 'writing/p/' + m.W1, p.W1 ? p.W1.words + ' so‘z' + (p.W1.ai ? ' · ' + IE.bandTxt(p.W1.ai.overall) : '') : '') : '') + row('pen', 'W', 'Task 2 · insho', '40 daqiqa · kamida 250 so‘z', 'writing/p/' + m.W, p.W ? p.W.words + ' so‘z' + (p.W.ai ? ' · ' + IE.bandTxt(p.W.ai.overall) : '') : '') + '</div>' +
    '<div class="sec"><h2>Speaking</h2></div><div class="lst">' + row('mic', 'S', 'Part 1 · ' + D.prompts.sp1[m.S.p1].t, '4 ta qisqa savol', 'speaking/1/' + m.S.p1, p.S1 ? (p.S1.ai ? IE.bandTxt(p.S1.ai.overall) : '✓') : '') + row('mic', 'S', 'Part 2 · ' + D.prompts.sp2[m.S.p2].t.replace('Describe ', ''), '1 daq tayyorgarlik + 2 daq nutq', 'speaking/2/' + m.S.p2, p.S2 ? (p.S2.ai ? IE.bandTxt(p.S2.ai.overall) : '✓') : '') + (p.S3 !== undefined ? row('mic', 'S', 'Part 3 · ' + D.prompts.sp2[m.S.p2].t.replace('Describe ', ''), (D.prompts.sp2[m.S.p2].f || []).length + ' ta muhokama savoli', 'speaking/3/' + m.S.p2, p.S3 ? (p.S3.ai ? IE.bandTxt(p.S3.ai.overall) : '✓') : '') : '') + '</div>' +
    '<button class="btn ghost block" style="margin-top:16px" data-a="mquit">Sinovni bekor qilish</button></div>';
  return sub('Mock Test', 'practice', inner);
}
const nqOf = u => u ? (u.groups || []).reduce((n, g) => n + g.qs.length, 0) : 13;
const mmss = s => Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
A.mfin = () => {
  const m = cur(); if (!m) return; const r = results(m, progress(m));
  const rec = { ts: Date.now(), mode: m.mode, L: r.L, R: r.R, W: r.W, S: r.S, overall: r.overall, partial: r.partial, plan: { L: m.L, R: m.R, W: m.W, W1: m.W1 || '' } };
  S().mocks.push(rec); S().mock = null; IE.save(true); IE.confetti(); IE.go('mock/r/' + rec.ts);
};

/* ---------- hisobot ---------- */
function report(ts) {
  const h = S().mocks.find(x => x.ts === ts); if (!h) return start();
  const tg = +S().prof.target || 7, gap = h.overall != null ? Math.round((tg - h.overall) * 2) / 2 : null;
  const sk = [['L', 'head', 'Listening', h.L], ['R', 'book', 'Reading', h.R], ['W', 'pen', 'Writing', h.W], ['S', 'mic', 'Speaking', h.S]];
  const valid = sk.filter(x => x[3] != null).sort((a, b) => a[3] - b[3]), weak = valid[0];
  const adv = { L: 'Listening: audio davomida savollarni oldindan o‘qing, imlo va sonlarga e’tibor bering. Shadowing/Dictation mashqlari yordam beradi.', R: 'Reading: har savol turi uchun strategiyalarni takrorlang, vaqtni 20 daqiqadan oshirmang, Reading mashqlarini ko‘paytiring.', W: 'Writing: tuzilma (4 paragraf), bog‘lovchilar va xilma-xil grammatikani mashq qiling; namunalarni o‘qing va AI baholashdan foydalaning.', S: 'Speaking: javobni kengaytiring (sabab + misol), Shadowing bilan talaffuzni mashq qiling, har kuni 1–2 ta cue card yozib oling.' };
  const inner = '<div class="res anim"><div class="lbl">Umumiy taxminiy band</div><div class="big">' + IE.bandTxt(h.overall) + '</div><div class="mu" style="margin-top:8px">' + (MODES[h.mode] || MODES.full).name + ' · ' + fmtD(h.ts) + '</div></div><div class="pad">' +
    '<div class="skills" style="margin-bottom:12px">' + sk.map(x => '<div class="sktile" style="min-height:0;align-items:center;text-align:center;padding:14px">' + bd(x[1], x[0]) + '<b style="font-size:26px">' + IE.bandTxt(x[3]) + '</b><small style="color:var(--mu)">' + x[2] + '</small></div>').join('') + '</div>' +
    (h.partial ? '<div class="card sm" style="margin-bottom:12px">' + ic('bulb') + ' Writing yoki Speaking AI bilan baholanmagan — overall ularsiz hisoblandi. Ularni baholatsangiz, natija aniqroq bo‘ladi.</div>' : '') +
    (gap != null ? '<div class="card"><b>Maqsad: ' + IE.bandTxt(tg) + '</b><p class="sm mu" style="margin:6px 0 0">' + (gap > 0 ? 'Maqsadga yana <b>' + gap.toFixed(1) + '</b> band yetmaydi.' : 'Maqsad banddan yuqori yoki teng. Zo‘r!') + '</p></div>' : '') +
    (weak ? '<div class="card" style="margin-top:12px"><b>Eng zaif bo‘lim: ' + weak[2] + '</b><p class="sm" style="margin:6px 0 0;line-height:1.5">' + adv[weak[0]] + '</p></div>' : '') +
    '<div class="two" style="margin-top:16px"><button class="btn ghost" data-go="mock">Mock bosh sahifa</button><button class="btn" data-a="mstart" data-m="' + h.mode + '">Yana sinash</button></div>' + (IE.rcBtn ? IE.rcBtn({ kicker: (MODES[h.mode] || MODES.full).name + ' natijasi', big: IE.bandTxt(h.overall), bigLabel: 'Overall band', sub: 'Maqsad ' + IE.bandTxt(tg), rows: sk.map(x => [x[2], IE.bandTxt(x[3])]), foot: fmtD(h.ts) }) : '') + '</div>';
  return sub('Mock natijasi', 'mock', inner);
}
})();
