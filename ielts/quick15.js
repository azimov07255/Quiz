/* IELTS · BY AZIMOV — “Bugungi 15 daqiqa”: har kuni 3 ta 5-daqiqalik qadam (takror → eng zaif ko‘nikma → xatolar/maqola).
   Qadamlar bugungi faoliyatdan avtomatik belgilanadi (qo‘shimcha ma’lumot saqlanmaydi, faqat kunlik “tayyor” belgisi). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, lsGet, lsSet } = IE, S = () => IE.S();
const ds = () => { const d = new Date(); d.setHours(0, 0, 0, 0); return d.getTime(); };
const qtN = pre => Object.entries(S().qt || {}).filter(([k, v]) => pre.some(p => k.startsWith(p + ':')) && v.t >= ds()).length;
const nTod = (arr, key) => (arr || []).filter(x => (x[key || 'ts'] || 0) >= ds()).length;
const srsN = () => Object.values(S().srs || {}).filter(v => (v.t || 0) >= ds()).length;
const pickLow = () => { const st = (p, n) => { const e = Object.entries(S().qt || {}).filter(([k]) => k.startsWith(p + ':')); return n ? e.filter(x => x[1].ok).length / n : 0; }; return st('tf', 32) <= st('hd', 12) ? 'tfng' : 'heads'; };
const nextUnfinished = (pre, list) => { const done = Object.keys(S().qt || {}).filter(k => k.startsWith(pre + ':') && S().qt[k].ok); const x = list.find(it => !done.some(k => k.startsWith(pre + ':' + it.id + ':'))) || list[0]; return x ? x.id : 1; };
IE.q15Steps = () => {
  const s = S(), qt = IE.D.qt || { tfng: [], heads: [], maps: [] }, b = IE.skillBands(), weak = Object.entries(b).filter(([, v]) => v != null).sort((a, c) => a[1] - c[1])[0], w = weak ? weak[0] : 'R';
  const due = IE.dueCount ? IE.dueCount() : 0, bank = IE.bankStats ? IE.bankStats() : { due: 0 }, out = [];
  out.push(due >= 5 ? { t: 'So‘zlar takrori', d: due + ' ta so‘z navbatda', go: 'vocab/review', ic: 'cards', done: srsN() >= 5 } : { t: 'Collocation', d: '10 ta birikma', go: 'qtype/col', ic: 'cards', done: qtN(['co']) >= 5 });
  if (w === 'W') out.push({ t: 'Writing: paraphrase', d: 'Gapni qayta yozish (AI)', go: 'qtype/para', ic: 'pen', done: qtN(['pa']) >= 3 || nTod(s.writes) >= 1 });
  else if (w === 'S') out.push({ t: 'Speaking Part 1', d: '4 ta savol, yozib oling', go: 'speaking/1/' + ((IE.dayNum() % 8) | 0), ic: 'mic', done: nTod(s.speaks) >= 1 });
  else if (w === 'L') out.push({ t: 'Listening: xarita', d: 'Audio + xarita mashqi', go: 'qtype/map/' + nextUnfinished('mp', qt.maps), ic: 'head', done: qtN(['mp']) >= 3 || nTod(s.listens) >= 1 });
  else { const k = pickLow(); out.push({ t: k === 'tfng' ? 'Reading: T/F/NG' : 'Reading: Headings', d: 'Qisqa matn + tushuntirish', go: 'qtype/' + k + '/' + nextUnfinished(k === 'tfng' ? 'tf' : 'hd', k === 'tfng' ? qt.tfng : qt.heads), ic: 'book', done: qtN(['tf', 'hd']) >= 4 || nTod(s.reads) >= 1 }); }
  out.push(bank.due ? { t: 'Xatolar banki', d: bank.due + ' ta savol takrorga tayyor', go: 'mb/run', ic: 'flame', done: IE.bankToday && IE.bankToday() >= 3 } : { t: 'Maqola o‘qish', d: 'Yangi matn va so‘zlar', go: 'articles', ic: 'doc', done: nTod(s.arts) >= 1 });
  return out;
};
IE.q15Card = () => {
  const st = IE.q15Steps(), n = st.filter(x => x.done).length, key = 'ielts:q15:' + IE.dayKey();
  if (n === st.length && !lsGet(key, 0)) { lsSet(key, 1); setTimeout(() => { IE.toast('Bugungi 15 daqiqa bajarildi! 🔥'); IE.confetti(); }, 400); }
  return '<div class="card rise q15"><div class="row" style="justify-content:space-between;margin-bottom:10px"><div><b style="font-size:16px">Bugungi 15 daqiqa</b><div class="sm mu">3 ta qisqa qadam — har kuni</div></div><span class="chip' + (n === st.length ? ' ok' : '') + '">' + n + '/' + st.length + '</span></div>' +
    st.map((x, i) => '<button class="q15r' + (x.done ? ' done' : '') + '" data-go="' + x.go + '"><span class="q15n">' + (x.done ? ic('check') : i + 1) + '</span><div class="tx"><b>' + esc(x.t) + '</b><span>' + esc(x.d) + ' · 5 daq</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>';
};
})();
