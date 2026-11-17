/* IELTS · BY AZIMOV — tahlil: band dinamikasi, prognoz, faollik xaritasi, haftalik hisobot, ulashish kartasi. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd } = IE, S = () => IE.S(), A = IE.act;
const dk = t => IE.dayKey(t), parse = k => new Date(k + 'T00:00:00'), addD = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dk(d.getTime()); };
const SKN = { L: 'Listening', R: 'Reading', W: 'Writing', S: 'Speaking' };

/** Barcha band natijalari vaqt bo‘yicha. */
IE.bandSeries = (skill) => {
  const s = S(), o = [];
  s.reads.forEach(r => { if (typeof r.band === 'number') o.push({ ts: r.ts, b: r.band, k: 'R' }); });
  s.listens.forEach(r => { if (typeof r.band === 'number') o.push({ ts: r.ts, b: r.band, k: 'L' }); });
  s.writes.forEach(w => { if (w.ai && typeof w.ai.overall === 'number') o.push({ ts: w.ts, b: w.ai.overall, k: 'W' }); });
  s.speaks.forEach(x => { if (x.ai && typeof x.ai.overall === 'number') o.push({ ts: x.ts, b: x.ai.overall, k: 'S' }); });
  return o.filter(x => x.ts && (!skill || x.k === skill)).sort((a, b) => a.ts - b.ts);
};
/** SVG chiziqli grafik (sparkline). */
IE.spark = (vals, o) => {
  o = o || {}; const w = o.w || 120, h = o.h || 38, n = vals.length; if (n < 2) return '';
  const lo = Math.min(...vals, o.min != null ? o.min : 9), hi = Math.max(...vals, o.max != null ? o.max : 0), rg = Math.max(.5, hi - lo), pad = 4;
  const pts = vals.map((v, i) => [pad + i / (n - 1) * (w - pad * 2), h - pad - (v - lo) / rg * (h - pad * 2)]);
  const d = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' '), id = 'sg' + Math.random().toString(36).slice(2, 7), c = o.c || 'var(--pl)';
  return '<svg class="spk" viewBox="0 0 ' + w + ' ' + h + '" preserveAspectRatio="none" aria-hidden="true"><defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c + '" stop-opacity=".35"/><stop offset="1" stop-color="' + c + '" stop-opacity="0"/></linearGradient></defs>' +
    '<path d="' + d + ' L' + pts[n - 1][0].toFixed(1) + ' ' + h + ' L' + pts[0][0].toFixed(1) + ' ' + h + ' Z" fill="url(#' + id + ')"/><path d="' + d + '" fill="none" stroke="' + c + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/><circle cx="' + pts[n - 1][0].toFixed(1) + '" cy="' + pts[n - 1][1].toFixed(1) + '" r="3.4" fill="' + c + '"/></svg>';
};
/** Kichik kvadrat qiymat ko‘rsatgich (haftalik hisobotlar uchun). */
const delta = (a, b) => { const d = a - b; return d === 0 ? '<i class="dl0">=</i>' : '<i class="dl' + (d > 0 ? 'u' : 'd') + '">' + (d > 0 ? '▲' : '▼') + Math.abs(Math.round(d * 10) / 10) + '</i>'; };

/** Prognoz: oxirgi natijalar bo‘yicha chiziqli trend. */
IE.forecast = () => {
  const ser = IE.bandSeries().slice(-14); if (ser.length < 4) return null;
  const t0 = ser[0].ts, xs = ser.map(p => (p.ts - t0) / 864e5), ys = ser.map(p => p.b), n = xs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, den = 0; xs.forEach((x, i) => { num += (x - mx) * (ys[i] - my); den += (x - mx) * (x - mx); });
  if (den < 1) return null; // hammasi bir kunda — trend yo‘q
  const slope = num / den, cur = my + slope * (xs[n - 1] - mx), p = S().prof, dl = p.date ? Math.ceil((parse(p.date) - parse(dk())) / 864e5) : null, horizon = dl != null && dl > 0 ? Math.min(dl, 90) : 30;
  const raw = cur + Math.max(-1, Math.min(1.5, slope * horizon * .7)), pred = Math.max(1, Math.min(9, Math.round(raw * 2) / 2));
  return { cur: Math.round(cur * 2) / 2, slopeW: Math.round(slope * 7 * 100) / 100, pred, horizon, dl, target: +p.target || 7, n };
};

/** Faollik xaritasi: oxirgi N hafta, ustunlar = haftalar. */
IE.heat = weeks => {
  weeks = weeks || 12; const today = dk(), dow = (parse(today).getDay() + 6) % 7, start = addD(today, -(dow + (weeks - 1) * 7)), cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const k = addD(start, i), fut = k > today, a = fut ? 0 : IE.dayAct(k), lv = fut ? -1 : !a ? 0 : a >= 6 ? 4 : a >= 4 ? 3 : a >= 2 ? 2 : 1;
    cells.push('<i class="hc l' + (lv < 0 ? 'f' : lv) + (k === today ? ' now' : '') + '" title="' + k + '"></i>');
  }
  return '<div class="heat" style="--w:' + weeks + '">' + cells.join('') + '</div>';
};

/** Hafta kesimi (off: 0 = shu hafta, -1 = o‘tgan). */
const weekOf = off => { const today = dk(), dow = (parse(today).getDay() + 6) % 7, mon = addD(today, -dow + off * 7); return Array.from({ length: 7 }, (_, i) => addD(mon, i)); };
IE.weekStats = off => {
  const days = weekOf(off), t = { R: 0, L: 0, W: 0, S: 0, T: 0, A: 0, M: 0, V: 0 }; let act = 0, foc = 0;
  days.forEach(k => { const c = IE.dayCnt(k); Object.keys(t).forEach(x => { t[x] += c[x] || 0; }); if (IE.dayAct(k) > 0) act++; foc += +(S().focus || {})[k] || 0; });
  const lo = parse(days[0]).getTime(), hi = parse(days[6]).getTime() + 864e5, bs = IE.bandSeries().filter(x => x.ts >= lo && x.ts < hi);
  return { t, act, foc, tests: t.R + t.L + t.W + t.S + t.M, avg: bs.length ? bs.reduce((a, b) => a + b.b, 0) / bs.length : null, nb: bs.length };
};
IE.weekCard = () => {
  const a = IE.weekStats(0), b = IE.weekStats(-1), row = (l, x, y, unit) => '<div class="wrow"><span>' + l + '</span><b>' + x + (unit || '') + '</b>' + delta(x, y) + '</div>';
  const best = Object.entries({ L: a.t.L, R: a.t.R, W: a.t.W, S: a.t.S }).sort((p, q) => q[1] - p[1])[0];
  return '<div class="card rise"><div class="row" style="justify-content:space-between;align-items:center"><b style="font-size:16px">Haftalik hisobot</b><span class="chip">Shu hafta</span></div><div class="wgrid">' +
    row('Faol kun', a.act, b.act, '/7') + row('Mashq / test', a.tests, b.tests) + row('Fokus daqiqa', a.foc, b.foc) + row('So‘z takrori', a.t.V, b.t.V) + '</div>' +
    '<div class="sm mu" style="margin-top:10px">' + (a.avg != null ? 'O‘rtacha band: <b style="color:var(--tx)">' + IE.bandTxt(a.avg) + '</b>' + (b.avg != null ? ' (o‘tgan hafta ' + IE.bandTxt(b.avg) + ')' : '') + '. ' : '') +
    (best && best[1] > 0 ? 'Eng ko‘p: <b style="color:var(--tx)">' + SKN[best[0]] + '</b>.' : 'Bu hafta hali mashq yo‘q — bugun boshlang!') + '</div></div>';
};

/** Prognoz kartasi. */
IE.forecastCard = () => {
  const f = IE.forecast(), t = +S().prof.target || 7, ov = IE.overall();
  if (!f) return '<div class="card fcard rise"><div class="row" style="gap:12px">' + bd('target', 'A', 'lg') + '<div style="flex:1"><b style="font-size:16px">Band prognozi</b><div class="sm mu" style="margin-top:2px">Kamida 4 ta natija (turli kunlarda) to‘planganda trend va prognoz paydo bo‘ladi' + (ov == null ? '.' : ' — hozir ' + IE.bandTxt(ov) + '.') + '</div></div></div></div>';
  const up = f.slopeW > 0.04, dn = f.slopeW < -0.04, gap = Math.round((t - f.pred) * 2) / 2;
  return '<div class="card fcard rise"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">Band prognozi</div><div class="fbig2">' + IE.bandTxt(f.pred) + '<small>≈ ' + f.horizon + ' kundan keyin</small></div></div><div class="ftr ' + (up ? 'up' : dn ? 'dn' : '') + '">' + (up ? '▲' : dn ? '▼' : '►') + ' ' + (f.slopeW > 0 ? '+' : '') + f.slopeW.toFixed(2) + '<small>haftasiga</small></div></div>' +
    IE.spark(IE.bandSeries().slice(-12).map(x => x.b), { w: 300, h: 56 }) +
    '<div class="sm mu" style="margin-top:6px">' + (gap <= 0 ? 'Shu tezlikda maqsad <b style="color:var(--ok)">' + IE.bandTxt(t) + '</b> ga yetasiz 🎯' : 'Maqsad ' + IE.bandTxt(t) + ' uchun yana <b style="color:var(--tx)">+' + gap.toFixed(1) + '</b> kerak — mashqni oshiring.') + ' <span style="opacity:.7">(taxminiy)</span></div></div>';
};
/** Ko‘nikmalar bo‘yicha qatorlar: band, maqsadgacha farq, mini grafik. */
IE.skillRows = () => {
  const b = IE.skillBands(), t = +S().prof.target || 7, ic2 = { L: 'head', R: 'book', W: 'pen', S: 'mic' };
  return '<div class="sks">' + ['L', 'R', 'W', 'S'].map(k => { const v = b[k], ser = IE.bandSeries(k).slice(-8).map(x => x.b), gap = v == null ? null : Math.round((t - v) * 2) / 2;
    return '<button class="skr" data-go="' + ({ L: 'listening', R: 'reading', W: 'writing', S: 'speaking' })[k] + '">' + bd(ic2[k], k, 'sm') + '<div class="skm"><b>' + SKN[k] + '</b><span>' + (v == null ? 'Hali natija yo‘q' : gap <= 0 ? 'Maqsadga yetdingiz ✓' : '+' + gap.toFixed(1) + ' kerak') + '</span></div><div class="skg">' + IE.spark(ser, { w: 80, h: 30, c: 'var(--' + k + '2)' }) + '</div><b class="skb sk-' + k + '">' + IE.bandTxt(v) + '</b></button>'; }).join('') + '</div>';
};
/** Writing: qayta yozish natijasi (oldingi vs hozirgi baho). */
IE.wCompare = w => {
  if (!w.rev || !w.ai) return ''; const b = S().writes.find(x => x.ts === w.rev); if (!b || !b.ai) return '';
  const rows = [['tr', w.ai.task === '1' ? 'Task Achiev.' : 'Task Response'], ['cc', 'Coherence'], ['lr', 'Lexical'], ['gra', 'Grammar'], ['overall', 'Overall']];
  const d = (x, y) => { const v = Math.round((x - y) * 2) / 2; return v === 0 ? '<i class="dl0">=</i>' : '<i class="dl' + (v > 0 ? 'u' : 'd') + '">' + (v > 0 ? '▲ +' : '▼ ') + v + '</i>'; };
  const up = w.ai.overall - b.ai.overall;
  return '<div class="card wcmp rise"><b style="font-size:16px">↻ Qayta yozish natijasi</b><div class="sm mu" style="margin:2px 0 8px">' + (up > 0 ? 'Yaxshilandi! Mashq natija berdi 🎉' : up === 0 ? 'Baho o‘zgarmadi — AI maslahatlarini yana bir bor tekshiring.' : 'Bu safar baho pastroq — maslahatlarga qayting.') + '</div>' + rows.map(r => '<div class="wcr' + (r[0] === 'overall' ? ' tot' : '') + '"><span>' + r[1] + '</span><b>' + IE.bandTxt(b.ai[r[0]]) + ' → ' + IE.bandTxt(w.ai[r[0]]) + '</b>' + d(w.ai[r[0]], b.ai[r[0]]) + '</div>').join('') + '</div>';
};
/** Writing: mezonlar dinamikasi (oxirgi 12 baholangan yozuv). */
IE.wTrend = () => {
  const ev = S().writes.filter(w => w.ai && typeof w.ai.overall === 'number').slice(-12); if (ev.length < 2) return '';
  const rows = [['overall', 'Overall'], ['tr', 'Task'], ['cc', 'Coherence'], ['lr', 'Lexical'], ['gra', 'Grammar']];
  return '<div class="card wtr rise"><div class="row" style="justify-content:space-between"><b style="font-size:16px">Mezonlar dinamikasi</b><span class="chip">' + ev.length + ' ta yozuv</span></div>' + rows.map(r => { const v = ev.map(w => +w.ai[r[0]] || 0), dl = Math.round((v[v.length - 1] - v[0]) * 2) / 2; return '<div class="wtrr"><span>' + r[1] + '</span><div class="wtrs">' + IE.spark(v, { w: 120, h: 30, min: 4, max: 9, c: r[0] === 'overall' ? 'var(--pl)' : 'var(--W2)' }) + '</div><b>' + IE.bandTxt(v[v.length - 1]) + '</b>' + (dl ? '<i class="' + (dl > 0 ? 'dlu' : 'dld') + '">' + (dl > 0 ? '+' : '') + dl + '</i>' : '<i class="dl0">=</i>') + '</div>'; }).join('') + '<div class="sm mu" style="margin-top:8px">Eng past mezonga e’tibor bering: ' + (() => { const last = ev[ev.length - 1].ai, k = [['tr', 'Task'], ['cc', 'Coherence'], ['lr', 'Lexical'], ['gra', 'Grammar']].sort((a, b) => last[a[0]] - last[b[0]])[0]; return '<b style="color:var(--tx)">' + k[1] + ' (' + IE.bandTxt(last[k[0]]) + ')</b>'; })() + '.</div></div>';
};

/** Kunning ilhom beruvchi gapi. */
const QUOTES = ['Har kuni 1% yaxshilansangiz, bir yilda 37 barobar kuchayasiz.', 'Katta natija kichik, lekin to‘xtovsiz qadamlardan boshlanadi.', 'Bugungi 30 daqiqa — imtihon kunidagi tinchlik.', 'Muvaffaqiyat — har kuni takrorlangan kichik harakatlar yig‘indisi.', 'Mukammal bo‘lish shart emas, muntazam bo‘lish yetarli.', 'Xato — o‘rganishning eng tez yo‘li. Qo‘rqmang.', 'Ingliz tili mushak kabi: mashq qilsangiz kuchayadi.', 'Bugun qilgan ishingiz kelajakdagi o‘zingizga sovg‘a.', 'Sabr va intizom — band 7 ning kaliti.', 'Eng qiyin qadam — boshlash. Siz allaqachon shu yerdasiz.', 'Tinglang, takrorlang, yozing — til shunday o‘rganiladi.', 'Charchaganingizda to‘xtamang, sekinlashing.'];
IE.quote = () => QUOTES[Math.floor(Date.UTC(parse(dk()).getFullYear(), parse(dk()).getMonth(), parse(dk()).getDate()) / 864e5) % QUOTES.length];

/** Davom ettirish: tugallanmagan mashqlar. */
IE.resumeItems = () => {
  const out = [], D = IE.D;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i) || '';
      let m = /^ielts:run:(.+)$/.exec(k);
      if (m) { const r = JSON.parse(localStorage.getItem(k) || 'null'), p = D.reading.passages.find(x => x.id === m[1]); if (r && p && r.ans && Object.keys(r.ans).length) out.push({ t: p.title, s: 'Reading · ' + Object.keys(r.ans).length + ' ta javob', go: 'reading/' + p.id + '/run', k: 'R', ts: r.t0 || 0 }); continue; }
      m = /^ielts:lrun:(.+)$/.exec(k);
      if (m) { const r = JSON.parse(localStorage.getItem(k) || 'null'), t = D.listening.tests.find(x => x.id === m[1]); if (r && t && r.ans && Object.keys(r.ans).length && Date.now() - (r.t0 || 0) < 6 * 36e5) out.push({ t: (t.topic.split(' · ')[1] || t.title), s: 'Listening · davom eting', go: 'listening/' + t.id + '/run', k: 'L', ts: r.t0 || 0 }); }
    }
  } catch (e) { /* */ }
  out.sort((a, b) => b.ts - a.ts); const pend = IE.anaPending ? IE.anaPending() : []; return pend.concat(out).slice(0, 3);
};

/** Ulashish kartasi (PNG). */
IE.shareCard = async () => {
  const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H; const x = c.getContext('2d'), p = S().prof, lv = IE.level(), acc = IE.ACC.find(a => a[0] === IE.accent()) || IE.ACC[0];
  const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, acc[2]); g.addColorStop(1, acc[3]); x.fillStyle = g; x.fillRect(0, 0, W, H);
  x.fillStyle = 'rgba(255,255,255,.10)'; x.beginPath(); x.arc(W - 120, 160, 340, 0, 7); x.fill(); x.beginPath(); x.arc(80, H - 80, 260, 0, 7); x.fill();
  const font = (w, sz) => { x.font = w + ' ' + sz + 'px -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif'; };
  x.fillStyle = '#fff'; font(700, 38); x.fillText('IELTS · BY AZIMOV', 80, 120);
  font(900, 84); x.fillText((p.name || IE.dispName()).slice(0, 18), 80, 290);
  font(600, 40); x.globalAlpha = .85; x.fillText('Daraja ' + lv.L + ' · ' + lv.name, 80, 350); x.globalAlpha = 1;
  x.fillStyle = 'rgba(255,255,255,.16)'; x.beginPath(); if (x.roundRect) x.roundRect(80, 420, W - 160, 440, 48); else x.rect(80, 420, W - 160, 440); x.fill();
  x.fillStyle = '#fff'; font(600, 36); x.fillText('Hozirgi overall', 130, 500); font(900, 220); x.fillText(IE.bandTxt(IE.overall()), 130, 700);
  font(600, 36); x.globalAlpha = .85; x.fillText('Maqsad: ' + IE.bandTxt(p.target), 130, 780); x.globalAlpha = 1;
  const bs = IE.skillBands(); [['L', 'Listening'], ['R', 'Reading'], ['W', 'Writing'], ['S', 'Speaking']].forEach((q, i) => { const px = 560 + (i % 2) * 230, py = 500 + Math.floor(i / 2) * 160; font(600, 28); x.globalAlpha = .8; x.fillText(q[1], px, py); x.globalAlpha = 1; font(900, 70); x.fillText(IE.bandTxt(bs[q[0]]), px, py + 78); });
  const st = [[IE.streak() + '', 'kun seriya'], [S().days.length + '', 'o‘qigan kun'], [Object.keys(S().srs).length + '', 'so‘z'], [lv.xp + '', 'XP']];
  st.forEach((q, i) => { const px = 80 + i * 240; font(900, 72); x.fillText(q[0], px, 1010); font(600, 28); x.globalAlpha = .8; x.fillText(q[1], px, 1055); x.globalAlpha = 1; });
  font(600, 34); x.globalAlpha = .9; x.fillText(p.date ? 'Imtihon: ' + p.date : 'Har kuni oldinga!', 80, 1210); x.globalAlpha = 1;
  const blob = await new Promise(r => c.toBlob(r, 'image/png')); if (!blob) return IE.toast('Rasm yaratib bo‘lmadi');
  const f = new File([blob], 'ielts-progress.png', { type: 'image/png' });
  try { if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title: 'IELTS progressim' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
  const u = URL.createObjectURL(blob), a = document.createElement('a'); a.href = u; a.download = 'ielts-progress.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); IE.toast('Rasm yuklab olindi');
};
A.share = () => IE.shareCard();
})();
