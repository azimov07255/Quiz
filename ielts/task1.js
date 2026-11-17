/* IELTS · BY AZIMOV — Writing Task 1: tayyor diagramma topshiriqlari (ustunli, chiziqli, doira, jadval). Diagramma ma’lumotdan SVG/HTML bo‘lib chiziladi;
   AI bahosi uchun ma’lumot matnli tavsifga aylantiriladi (ielts-wr). Ma’lumotlar o‘quv maqsadida tuzilgan (haqiqiy statistika emas). */
(() => {
'use strict';
const IE = window.IE, { esc } = IE;
const Q = 'Summarise the information by selecting and reporting the main features, and make comparisons where relevant.\nWrite at least 150 words.';
IE.T1 = [
  { id: 'b1', type: 'bar', unit: '%', title: 'Households with internet access (%)', text: 'The chart below shows the percentage of households with internet access in four countries in 2000 and 2020.\n' + Q, labels: ['Canada', 'Brazil', 'India', 'Kenya'], series: [{ n: '2000', v: [42, 5, 1, 0.5] }, { n: '2020', v: [92, 74, 43, 28] }] },
  { id: 'l1', type: 'line', unit: 'kWh', title: 'Monthly electricity use per household (kWh)', text: 'The graph below shows average monthly electricity use per household in three cities between 2005 and 2020.\n' + Q, labels: ['2005', '2010', '2015', '2020'], series: [{ n: 'Oslo', v: [610, 590, 540, 500] }, { n: 'Madrid', v: [310, 340, 380, 420] }, { n: 'Tokyo', v: [390, 410, 400, 385] }] },
  { id: 't1', type: 'table', unit: 'hours', title: 'Leisure time (hours per week), 2022', text: 'The table below shows the average number of hours per week that people in four age groups spent on leisure activities in 2022.\n' + Q, labels: ['Watching TV', 'Online games', 'Reading', 'Sport'], series: [{ n: '16–24', v: [8, 12, 2, 6] }, { n: '25–44', v: [11, 5, 3, 4] }, { n: '45–64', v: [16, 2, 6, 3] }, { n: '65+', v: [21, 1, 9, 2] }] },
  { id: 'p1', type: 'pie', unit: '%', title: 'Household spending (%)', text: 'The pie charts below show how a typical household in a European country spent its income in 1990 and in 2020.\n' + Q, labels: ['Housing', 'Food', 'Transport', 'Leisure', 'Savings', 'Other'], series: [{ n: '1990', v: [28, 24, 12, 8, 10, 18] }, { n: '2020', v: [35, 14, 16, 13, 8, 14] }] },
  { id: 'b2', type: 'bar', unit: 'thousands', title: 'University enrolment (thousands)', text: 'The chart below shows the number of students (in thousands) enrolled in four subjects at a university in 2010 and 2022.\n' + Q, labels: ['Engineering', 'Medicine', 'Business', 'Arts'], series: [{ n: '2010', v: [12, 6, 15, 9] }, { n: '2022', v: [18, 9, 13, 5] }] },
  { id: 'l2', type: 'line', unit: '%', title: 'Commuting methods (%)', text: 'The graph below shows the percentage of people in a city who used public transport, cars and bicycles to travel to work between 1995 and 2020.\n' + Q, labels: ['1995', '2000', '2005', '2010', '2015', '2020'], series: [{ n: 'Public transport', v: [30, 32, 35, 41, 46, 50] }, { n: 'Car', v: [60, 58, 53, 45, 38, 32] }, { n: 'Bicycle', v: [4, 5, 6, 8, 12, 14] }] },
];
IE.t1Find = id => { const k = String(id || '').replace(/^t1:/, ''); return IE.T1.find(x => x.id === k) || null; };
const COL = ['#7c3aed', '#f59e0b', '#10b981', '#ef4444', '#0ea5e9', '#ec4899'];
/** AI uchun matnli tavsif (barcha raqamlar bilan). */
IE.t1Desc = t => t.type + ' chart/table. Title: ' + t.title + '. Unit: ' + t.unit + '. ' + t.series.map(s => s.n + ': ' + t.labels.map((l, i) => l + ' = ' + s.v[i]).join(', ')).join('. ') + '.';
const nice = m => { const e = Math.pow(10, Math.floor(Math.log10(m))), f = m / e; return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * e; };
/** Diagramma HTML (SVG) — Writing muharririda ko‘rsatiladi. */
IE.t1Chart = t => {
  const W = 340, H = 220, L = 38, B = 28, T = 14, R = 8, pw = W - L - R, ph = H - T - B;
  const legend = '<div class="t1lg">' + t.series.map((s, i) => '<span><i style="background:' + COL[i % COL.length] + '"></i>' + esc(s.n) + '</span>').join('') + '</div>';
  const cap = '<div class="t1cap">' + esc(t.title) + '</div>';
  if (t.type === 'table') return '<div class="t1box">' + cap + '<div class="t1tw"><table class="t1tbl"><thead><tr><th></th>' + t.labels.map(l => '<th>' + esc(l) + '</th>').join('') + '</tr></thead><tbody>' + t.series.map(s => '<tr><th>' + esc(s.n) + '</th>' + s.v.map(v => '<td>' + v + '</td>').join('') + '</tr>').join('') + '</tbody></table></div></div>';
  if (t.type === 'pie') {
    const pies = t.series.map((s, si) => { let off = 0; const sum = s.v.reduce((a, b) => a + b, 0); return '<div class="t1pie"><svg viewBox="0 0 42 42"><circle cx="21" cy="21" r="15.9155" fill="none" stroke="var(--ln)" stroke-width="7"/>' + s.v.map((v, i) => { const p = v / sum * 100, seg = '<circle cx="21" cy="21" r="15.9155" fill="none" stroke="' + COL[i % COL.length] + '" stroke-width="7" stroke-dasharray="' + p.toFixed(2) + ' ' + (100 - p).toFixed(2) + '" stroke-dashoffset="' + (25 - off).toFixed(2) + '"/>'; off += p; return seg; }).join('') + '</svg><b>' + esc(s.n) + '</b></div>'; }).join('');
    return '<div class="t1box">' + cap + '<div class="t1pies">' + pies + '</div><div class="t1lg">' + t.labels.map((l, i) => '<span><i style="background:' + COL[i % COL.length] + '"></i>' + esc(l) + ' ' + t.series.map(s => s.v[i] + '%').join(' → ') + '</span>').join('') + '</div></div>';
  }
  const mx = nice(Math.max(...t.series.flatMap(s => s.v))), y = v => T + ph - v / mx * ph, grid = [0, .25, .5, .75, 1].map(f => { const v = mx * f, yy = y(v); return '<line x1="' + L + '" y1="' + yy + '" x2="' + (W - R) + '" y2="' + yy + '" stroke="var(--ln)" stroke-width="1"/><text x="' + (L - 5) + '" y="' + (yy + 3) + '" text-anchor="end" font-size="9" fill="var(--mu)">' + (Math.round(v * 10) / 10) + '</text>'; }).join('');
  let body = '';
  if (t.type === 'bar') {
    const n = t.labels.length, k = t.series.length, gw = pw / n, bw = Math.min(26, gw * .78 / k);
    body = t.labels.map((lb, i) => { const x0 = L + i * gw + (gw - bw * k) / 2; return t.series.map((s, j) => '<rect x="' + (x0 + j * bw).toFixed(1) + '" y="' + y(s.v[i]).toFixed(1) + '" width="' + (bw - 2).toFixed(1) + '" height="' + (T + ph - y(s.v[i])).toFixed(1) + '" rx="3" fill="' + COL[j % COL.length] + '"/><text x="' + (x0 + j * bw + (bw - 2) / 2).toFixed(1) + '" y="' + (y(s.v[i]) - 3).toFixed(1) + '" text-anchor="middle" font-size="8" fill="var(--tx)">' + s.v[i] + '</text>').join('') + '<text x="' + (L + i * gw + gw / 2).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="9" fill="var(--mu)">' + esc(lb) + '</text>'; }).join('');
  } else {
    const n = t.labels.length, x = i => L + (n === 1 ? pw / 2 : i * pw / (n - 1));
    body = t.series.map((s, j) => '<polyline fill="none" stroke="' + COL[j % COL.length] + '" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round" points="' + s.v.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') + '"/>' + s.v.map((v, i) => '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3" fill="' + COL[j % COL.length] + '"/>').join('')).join('') + t.labels.map((lb, i) => '<text x="' + x(i).toFixed(1) + '" y="' + (H - 10) + '" text-anchor="middle" font-size="9" fill="var(--mu)">' + esc(lb) + '</text>').join('');
  }
  return '<div class="t1box">' + cap + '<svg viewBox="0 0 ' + W + ' ' + H + '" class="t1svg" role="img" aria-label="' + esc(t.title) + '">' + grid + body + '</svg>' + legend + '</div>';
};
})();
