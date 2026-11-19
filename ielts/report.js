/* IELTS · BY AZIMOV — Hisobot (A4, PDF sifatida saqlanadi), maqsadga yetish bashorati va ulashish uchun “Natija kartasi” (PNG). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const SKN = { L: 'Listening', R: 'Reading', W: 'Writing', S: 'Speaking' }, bt = x => IE.bandTxt(x);
const pad2 = n => String(n).padStart(2, '0'), fmt = d => d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
/** Maqsadga yetish bashorati: trend bo‘yicha taxminiy sana. */
IE.goalEta = () => {
  const f = IE.forecast(), t = +S().prof.target || 7; if (!f) return { ok: false, msg: 'Bashorat uchun kamida 4 ta natija (turli kunlarda) kerak.' };
  if (f.cur >= t) return { ok: true, reached: true, msg: 'Hozirgi daraja maqsaddan yuqori yoki teng — ushlab turing!' };
  if (f.slopeW <= 0.02) return { ok: false, msg: 'Trend hozircha tekis — maqsadga yetish sanasini aytib bo‘lmaydi. Mashq hajmini oshiring.' };
  const weeks = Math.ceil((t - f.cur) / f.slopeW), d = new Date(Date.now() + weeks * 7 * 864e5), exam = S().prof.date, late = exam && fmt(d) > exam;
  return { ok: true, weeks, date: fmt(d), late: !!late, msg: 'Hozirgi tezlikda ≈ ' + weeks + ' haftada (' + fmt(d) + ') band ' + bt(t) + ' ga yetasiz' + (late ? ' — bu imtihon sanasidan keyin. Haftalik mashqni oshiring.' : '.') };
};
const adviceList = () => {
  const b = IE.skillBands(), t = +S().prof.target || 7, o = [], e = Object.entries(b).filter(([, v]) => v != null).sort((a, c) => a[1] - c[1]);
  if (e[0]) o.push(SKN[e[0][0]] + ' eng zaif (' + bt(e[0][1]) + '): bu ko‘nikmaga bu hafta ko‘proq vaqt ajrating' + (e[0][1] < t ? ' — maqsadgacha +' + (Math.round((t - e[0][1]) * 2) / 2).toFixed(1) + '.' : '.'));
  const miss = ['L', 'R', 'W', 'S'].filter(k => b[k] == null); if (miss.length) o.push(miss.map(k => SKN[k]).join(', ') + ' bo‘yicha hali natija yo‘q — baholangan mashq bajaring.');
  const bank = IE.bankStats ? IE.bankStats() : null; if (bank && bank.due) o.push('Xatolar bankida ' + bank.due + ' ta savol takrorga tayyor.');
  const due = IE.dueCount ? IE.dueCount() : 0; if (due >= 10) o.push('Lug‘atda ' + due + ' ta so‘z takrorni kutmoqda.');
  const st = IE.streak(); if (!st) o.push('Seriya uzilgan — bugun kamida 15 daqiqa mashq qiling.');
  return o.slice(0, 4);
};
R.report = () => {
  const s = S(), p = s.prof, b = IE.skillBands(), ov = IE.overall(), t = +p.target || 7, eta = IE.goalEta(), f = IE.forecast(), now = new Date(), exam = p.date ? Math.ceil((new Date(p.date + 'T00:00:00') - now) / 864e5) : null;
  const mins = Object.values(s.focus || {}).reduce((a, c) => a + (+c || 0), 0), last30 = s.days.filter(d => d >= fmt(new Date(Date.now() - 29 * 864e5))).length;
  const qt = IE.qtStat ? [['T/F/NG', 'tf', 32], ['Headings', 'hd', 12], ['Map', 'mp', 18], ['Paraphrase', 'pa', 16], ['Collocation', 'co', 25]].map(([n, k, tot]) => { const x = IE.qtStat(k); return [n, x.ok, tot]; }) : [];
  const bank = IE.bankStats ? IE.bankStats() : { types: {} }, TYP = { tfng: 'T/F/NG', mcq: 'MCQ', fill: 'Gap fill', heads: 'Headings' };
  const mk = (s.mocks || []).slice(-3).reverse();
  const bar = (v, c) => '<div class="rbar"><i style="width:' + (v == null ? 0 : Math.max(4, v / 9 * 100)) + '%;background:' + c + '"></i><s style="left:' + (t / 9 * 100) + '%"></s></div>';
  const cols = { L: '#3b82f6', R: '#10b981', W: '#f59e0b', S: '#ec4899' };
  const inner = '<div class="pad rep" id="rep"><div class="card rise" style="padding:18px"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">IELTS · BY AZIMOV · O‘quv hisoboti</div><h2 style="margin:6px 0 2px;font-size:22px">' + esc(p.name || IE.dispName()) + '</h2><div class="sm mu">' + fmt(now) + (p.date ? ' · imtihon ' + esc(p.date) + (exam != null && exam >= 0 ? ' (' + exam + ' kun)' : '') : '') + '</div></div><div class="c"><div class="mu xs b">Overall</div><div style="font-size:44px;font-weight:900;line-height:1">' + bt(ov) + '</div><div class="sm mu">maqsad ' + bt(t) + '</div></div></div></div>' +
    '<div class="sec"><h2>Ko‘nikmalar</h2></div><div class="card rise">' + ['L', 'R', 'W', 'S'].map(k => '<div class="rsk"><b>' + SKN[k] + '</b><span>' + (b[k] == null ? '—' : bt(b[k])) + '</span>' + bar(b[k], cols[k]) + '</div>').join('') + '<div class="sm mu" style="margin-top:6px">Oq chiziq — maqsad band. Har ko‘nikma oxirgi 3 ta natija o‘rtachasi.</div></div>' +
    '<div class="sec"><h2>Bashorat</h2></div><div class="card rise"><div style="font-size:15px;line-height:1.55">' + esc(eta.msg) + '</div>' + (f ? '<div class="sm mu" style="margin-top:8px">Trend: ' + (f.slopeW >= 0 ? '+' : '') + f.slopeW.toFixed(2) + ' band/hafta · ' + f.horizon + ' kundan keyin ≈ ' + bt(f.pred) + '</div>' : '') + (IE.spark && IE.bandSeries().length > 1 ? IE.spark(IE.bandSeries().slice(-14).map(x => x.b), { w: 300, h: 56 }) : '') + '</div>' +
    '<div class="sec"><h2>Faollik</h2></div><div class="card rise"><div class="rgrid"><div><b>' + IE.streak() + '</b><span>kun seriya</span></div><div><b>' + last30 + '/30</b><span>faol kun</span></div><div><b>' + mins + '’</b><span>fokus</span></div><div><b>' + s.reads.length + '</b><span>Reading</span></div><div><b>' + s.listens.length + '</b><span>Listening</span></div><div><b>' + s.writes.length + '</b><span>Writing</span></div><div><b>' + s.speaks.length + '</b><span>Speaking</span></div><div><b>' + (s.mocks || []).length + '</b><span>Mock</span></div></div></div>' +
    (qt.length ? '<div class="sec"><h2>Savol turlari</h2></div><div class="card rise">' + qt.map(([n, ok, tot]) => '<div class="rsk"><b>' + n + '</b><span>' + ok + '/' + tot + '</span><div class="rbar"><i style="width:' + Math.round(ok / tot * 100) + '%;background:var(--p1)"></i></div></div>').join('') + (Object.keys(bank.types || {}).length ? '<div class="sm mu" style="margin-top:6px">Faol xatolar turi: ' + Object.entries(bank.types).map(([k, v]) => (TYP[k] || k) + ' ' + v).join(' · ') + '</div>' : '') + '</div>' : '') +
    (mk.length ? '<div class="sec"><h2>Oxirgi Mock testlar</h2></div><div class="card rise">' + mk.map(m => '<div class="rsk"><b>' + new Date(m.ts).toLocaleDateString('en-GB') + '</b><span>' + bt(m.overall) + '</span><div class="sm mu" style="flex:1;text-align:right">L ' + bt(m.L) + ' · R ' + bt(m.R) + ' · W ' + bt(m.W) + ' · S ' + bt(m.S) + '</div></div>').join('') + '</div>' : '') +
    '<div class="sec"><h2>Tavsiyalar</h2></div><div class="card rise"><ul class="notes" style="margin:0;padding-left:18px;line-height:1.6">' + (adviceList().map(x => '<li>' + esc(x) + '</li>').join('') || '<li>Mashqni davom ettiring — natijalar to‘planganda tavsiyalar paydo bo‘ladi.</li>') + '</ul></div>' +
    '<div class="card rise rteach"><b>O‘qituvchi izohi</b><div class="rlines"><i></i><i></i><i></i></div></div>' +
    '<div class="two noprint" style="margin-top:14px"><button class="btn" data-a="rprint">' + ic('dl') + ' PDF sifatida saqlash</button><button class="btn ghost" data-a="share">' + ic('share') + ' Rasm (karta)</button></div><p class="hint noprint" style="margin-top:10px">' + ic('bulb') + ' “PDF sifatida saqlash” bosilganda chop etish oynasi ochiladi — printer o‘rniga “PDF sifatida saqlash” ni tanlang.</p></div>';
  return IE.sub('Hisobot', 'me', inner);
};
A.rprint = () => { try { window.print(); } catch (e) { IE.toast('Chop etib bo‘lmadi'); } };

/** Natija kartasi (PNG): o = {kicker, big, bigLabel, sub, rows:[[nom, qiymat]], foot} */
IE.rcShare = async o => {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), acc = IE.ACC.find(a => a[0] === IE.accent()) || IE.ACC[0];
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, acc[2]); g.addColorStop(1, acc[3]); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.10)'; x.beginPath(); x.arc(W - 120, 160, 340, 0, 7); x.fill(); x.beginPath(); x.arc(80, H - 80, 260, 0, 7); x.fill();
  const font = (w, sz) => { x.font = w + ' ' + sz + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif'; }, rr = (a, b, w, h, r) => { x.beginPath(); if (x.roundRect) x.roundRect(a, b, w, h, r); else x.rect(a, b, w, h); x.fill(); };
  x.fillStyle = '#fff'; font(700, 38); x.fillText('IELTS · BY AZIMOV', 80, 120);
  font(600, 44); x.globalAlpha = .9; x.fillText(String(o.kicker || 'Natija').slice(0, 34), 80, 250); x.globalAlpha = 1;
  font(900, 72); x.fillText(String(o.name || IE.dispName()).slice(0, 20), 80, 340);
  x.fillStyle = 'rgba(255,255,255,.16)'; rr(80, 400, W - 160, 380, 48); x.fillStyle = '#fff';
  font(600, 36); x.globalAlpha = .85; x.fillText(String(o.bigLabel || 'Band').slice(0, 30), 130, 480); x.globalAlpha = 1; font(900, 230); x.fillText(String(o.big), 130, 700);
  if (o.sub) { font(600, 34); x.globalAlpha = .9; x.fillText(String(o.sub).slice(0, 36), 600, 700); x.globalAlpha = 1; }
  (o.rows || []).slice(0, 6).forEach((q, i) => { const py = 860 + i * 60; x.fillStyle = 'rgba(255,255,255,.14)'; rr(80, py - 40, W - 160, 52, 26); x.fillStyle = '#fff'; font(600, 32); x.globalAlpha = .9; x.fillText(String(q[0]).slice(0, 26), 110, py); x.globalAlpha = 1; font(900, 34); x.textAlign = 'right'; x.fillText(String(q[1]), W - 110, py); x.textAlign = 'left'; });
  x.fillStyle = '#fff'; font(600, 32); x.globalAlpha = .85; x.fillText(String(o.foot || new Date().toLocaleDateString('en-GB')).slice(0, 44), 80, 1270); x.globalAlpha = 1;
  const blob = await new Promise(r => c.toBlob(r, 'image/png')); if (!blob) return IE.toast('Rasm yaratib bo‘lmadi');
  const f = new File([blob], 'ielts-natija.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'IELTS natijam' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = 'ielts-natija.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); IE.toast('Rasm yuklab olindi');
};
/** Natija kartasi tugmasi (render vaqtida ma’lumotni eslab qoladi). */
IE.rcBtn = o => { V.rc = o; return '<button class="btn ghost block" style="margin-top:10px" data-a="rcs">' + ic('share') + ' Natija kartasi (ulashish)</button>'; };
A.rcs = () => V.rc && IE.rcShare(V.rc);
})();
