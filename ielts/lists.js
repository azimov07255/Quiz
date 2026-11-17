/* IELTS · BY AZIMOV — test ro‘yxatlari: bitta “uc” (unit card) komponenti — Listening/Reading ro‘yxatlari va Cambridge test sahifasi uchun.
   Raqamli nishon, sarlavha, belgilar (savol soni, audio, transkript), natija halqasi (band), Tahlil/Qayta/O‘chirish amallari. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, lsGet } = IE, S = () => IE.S(), D = IE.D, A = IE.act, V = IE.V;
const mmss = t => Math.floor(t / 60) + ':' + String(Math.floor(t % 60)).padStart(2, '0');
const chip = (t, cls) => '<span class="uck' + (cls ? ' ' + cls : '') + '">' + t + '</span>';
const nq = u => u.groups.reduce((n, g) => n + g.qs.length, 0);

/** Bitta test kartasi. o: {go, k:'L'|'R', num, lab, title, meta, chips[], rec, att, going, ana, del:{k,id}, empty} */
IE.uc = o => {
  const L = o.k === 'L';
  if (o.empty) return '<div class="uc empty sk-' + o.k + '"><span class="uc-n"><b>' + o.num + '</b><i>' + o.lab + '</i></span><span class="uc-b"><b class="uc-t">' + esc(o.title) + '</b><span class="uc-m">Qo‘shilmagan</span></span>' + (o.add ? '<button class="chip uc-add" ' + o.add + '>' + ic('plus') + ' Qo‘shish</button>' : '') + '</div>';
  const rec = o.rec, pc = rec ? Math.round(rec.raw / Math.max(1, rec.tot) * 100) : 0;
  const right = rec ? '<span class="uc-ring"><i style="--v:' + pc + '"></i><b>' + IE.bandTxt(rec.band) + '</b></span>' : '<span class="uc-play">' + ic('play') + '</span>';
  const foot = (rec ? '<span class="uc-att">' + rec.raw + '/' + rec.tot + ' · ' + (o.att > 1 ? o.att + ' urinish' : '1 urinish') + '</span>' : '') +
    '<span class="uc-fa">' + (o.extra || '') + (o.edit ? '<button class="chip" ' + o.edit + ' aria-label="Tahrirlash">' + ic('edit') + '</button>' : '') + (rec && o.ana ? '<button class="chip" data-go="ana/' + o.ana + '">' + ic('bulb') + ' Tahlil</button>' : '') + (rec ? '<button class="chip" data-go="' + o.go + '">Qayta</button>' : '') + (o.del ? '<button class="chip" data-a="camdel" data-k="' + o.del.k + '" data-id="' + esc(o.del.id) + '" aria-label="O‘chirish">' + ic('trash') + '</button>' : '') + '</span>';
  return '<div class="uc rise sk-' + o.k + (rec ? ' done' : '') + (o.going ? ' going' : '') + '"><button class="uc-main" data-go="' + o.go + '"><span class="uc-n"><b>' + o.num + '</b><i>' + o.lab + '</i></span><span class="uc-b"><b class="uc-t">' + esc(o.title) + '</b>' + (o.meta ? '<span class="uc-m">' + o.meta + '</span>' : '') + ((o.chips || []).length ? '<span class="uc-c">' + o.chips.join('') + '</span>' : '') + '</span>' + right + '</button>' + (rec || o.del ? '<div class="uc-f">' + foot + '</div>' : '') + '</div>';
};
IE.ucChip = chip;
IE.ucNq = nq;

/** Listening / Reading ro‘yxat sahifasi (Practice ichida). */
IE.listPage = kind => {
  const L = kind === 'L', s = S(), items = (L ? (D.listening.tests || []) : (D.reading.passages || [])).filter(u => !u.priv);
  const rows = items.map((u, i) => {
    const recs = L ? s.listens.filter(r => r.id === u.id) : s.reads.filter(r => r.p === u.id), rec = recs.slice(-1)[0] || null, going = !!lsGet(L ? 'ielts:lrun:' + u.id : 'ielts:run:' + u.id, null);
    return { u, i, rec, att: recs.length, going };
  });
  const done = rows.filter(r => r.rec).length, bs = rows.filter(r => r.rec).map(r => r.rec.band), avg = bs.length ? bs.reduce((a, b) => a + b, 0) / bs.length : null, f = V.ulf || 'all';
  const cnt = { all: rows.length, new: rows.filter(r => !r.rec).length, done, go: rows.filter(r => r.going).length };
  const shown = rows.filter(r => f === 'all' || (f === 'new' && !r.rec) || (f === 'done' && r.rec) || (f === 'go' && r.going));
  const hero = '<div class="ulh rise sk-' + kind + '"><div class="row" style="justify-content:space-between;align-items:flex-end"><div><div class="ulk">' + (L ? 'Listening' : 'Reading') + ' testlari</div><div class="ulbig">' + done + '<small>/' + rows.length + '</small></div><div class="uls">bajarilgan' + (avg != null ? ' · o‘rtacha band <b>' + IE.bandTxt(avg) + '</b>' : '') + '</div></div><button class="ulc" data-go="cambridge">' + ic('book') + ' Cambridge</button></div><div class="prog" style="margin-top:12px"><i style="width:' + (rows.length ? done / rows.length * 100 : 0) + '%"></i></div></div>';
  const seg = '<div class="seg" style="margin:12px 0 6px">' + [['all', 'Hammasi'], ['new', 'Yangi'], ['done', 'Bajarilgan'], ['go', 'Davom']].filter(x => x[0] !== 'go' || cnt.go).map(x => '<button class="' + (f === x[0] ? 'on' : '') + '" data-a="ulf" data-v="' + x[0] + '">' + x[1] + ' <i>' + cnt[x[0]] + '</i></button>').join('') + '</div>';
  const cards = shown.map(r => { const u = r.u, ana = r.rec ? (L ? 'l' : '') + r.rec.ts : '';
    return IE.uc({ go: L ? 'listening/' + u.id : 'reading/' + u.id + '/run', k: kind, num: String(r.i + 1).padStart(2, '0'), lab: L ? 'AUDIO' : 'MATN', title: L ? (u.topic.split(' · ')[1] || u.title) : u.title,
      meta: esc(L ? u.topic.split(' · ')[0] + ' · ' + u.sec : u.topic + ' · ' + u.level), chips: [chip(nq(u) + ' savol'), L ? chip(ic('clock') + ' ' + mmss(u.dur)) : '', L && (u.tr || []).length ? chip('transkript') : '', r.going ? chip('davom etmoqda', 'warn') : ''].filter(Boolean), rec: r.rec, att: r.att, going: r.going, ana }); }).join('');
  return hero + seg + '<div class="ucl">' + (cards || '<div class="card empty rise">' + bd(L ? 'head' : 'book', kind) + 'Bu bo‘limda test yo‘q.</div>') + '</div>';
};
A.ulf = el => { V.ulf = el.dataset.v; IE.draw(false); };
})();
