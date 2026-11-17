/* IELTS · BY AZIMOV — Xatolar banki: Reading va Listening’dagi BARCHA xato javoblaringiz bitta takrorlash tizimida (1–3–7–16–35 kun).
   Har urinishning oxirgi natijasidagi xato savollar avtomatik yig‘iladi; to‘g‘ri topsangiz keyingi takrorga suriladi, xato qilsangiz ertaga emas — bugun qaytadi.
   Holat S().mb[key] = {b, d, t, ok, no} (bulutga sinxronlanadi). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), D = IE.D, R = IE.routes, A = IE.act, V = IE.V;
const LAD = [0, 1, 3, 7, 16, 35], TYP = { tfng: 'T/F/NG', mcq: 'Test (MCQ)', fill: 'Gap fill', heads: 'Sarlavha' };
const DK = 'ielts:mbd';
const bump = () => { const d = lsGet(DK, {}) || {}, k = IE.dayKey(); d[k] = (d[k] || 0) + 1; Object.keys(d).sort().slice(0, -20).forEach(x => delete d[x]); lsSet(DK, d); IE.touchDay(); };
IE.bankToday = () => (lsGet(DK, {}) || {})[IE.dayKey()] || 0;
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/** Faol xato savollar: har test bo‘yicha OXIRGI urinishdagi xatolar. */
IE.bankItems = () => {
  const s = S(), last = new Map(), td = IE.dayNum(), out = [];
  s.reads.forEach(r => last.set('R:' + r.p, r)); s.listens.forEach(r => last.set('L:' + r.id, r));
  // vaqt bo‘yicha oxirgisi: yuqoridagi tartib bo‘yicha emas, ts bo‘yicha tanlaymiz
  const best = new Map(); [...s.reads.map(r => ['R:' + r.p, r]), ...s.listens.map(r => ['L:' + r.id, r])].forEach(([k, r]) => { const o = best.get(k); if (!o || r.ts > o.ts) best.set(k, r); });
  best.forEach((rec, ku) => {
    const k = ku[0], id = ku.slice(2), u = k === 'R' ? D.reading.passages.find(p => p.id === id) : D.listening.tests.find(t => t.id === id); if (!u) return;
    IE.allQ(u).forEach(({ g, q }) => {
      if (IE.isOk(g, q, (rec.a || {})[q.n])) return;
      const key = ku + ':' + q.n, st = (s.mb || {})[key] || null, mastered = !!st && st.b >= 5;
      out.push({ key, k, u, g, q, rec, st, mastered, due: !mastered && (!st || st.d <= td) });
    });
  });
  return out;
};
IE.bankStats = () => {
  const it = IE.bankItems(), act = it.filter(x => !x.mastered), types = {}, units = new Map();
  act.forEach(x => { types[x.g.type] = (types[x.g.type] || 0) + 1; const e = units.get(x.k + x.u.id) || { k: x.k, u: x.u, rec: x.rec, n: 0, due: 0 }; e.n++; if (x.due) e.due++; units.set(x.k + x.u.id, e); });
  return { total: it.length, active: act.length, due: act.filter(x => x.due).length, mastered: it.filter(x => x.mastered).length, types, units: [...units.values()].sort((a, b) => b.due - a.due || b.n - a.n) };
};
IE.bankCard = () => {
  const st = IE.bankStats(); if (!st.active) return '';
  return '<button class="mbcard rise" data-go="mb"><span class="mbi">' + ic('cards') + '</span><div style="flex:1;min-width:0"><b>Xatolar banki</b><span>' + (st.due ? st.due + ' ta savol takrorga tayyor' : 'Bugun takror yo‘q · ' + st.active + ' ta faol xato') + '</span></div>' + (st.due ? '<i class="mbn">' + st.due + '</i>' : '<span class="go">' + ic('next') + '</span>') + '</button>';
};

/* ---------- bosh sahifa ---------- */
const corr = (g, q) => g.type === 'mcq' ? 'ABCDEFGHIJ'[q.a] + '. ' + q.o[q.a] : g.type === 'heads' ? q.a + '. ' + ((g.headings.find(h => h.id === q.a) || {}).t || '') : Array.isArray(q.a) ? q.a.join(' / ') : String(q.a);
const label = x => esc(x.u.cam || x.u.title);
function home() {
  const st = IE.bankStats(), mx = Math.max(1, ...Object.values(st.types), 1);
  const hero = '<div class="mbh rise"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;opacity:.85">Xatolar banki</div><div class="mbbig">' + st.due + '<small> takrorga tayyor</small></div><p>Xato qilgan savollaringiz shu yerda yig‘iladi va 1–3–7–16–35 kunlik oraliq bilan takrorlanadi. To‘g‘ri topsangiz “o‘zlashtirilgan” bo‘ladi.</p>' +
    (st.due ? '<button class="btn wb" data-a="mbgo">' + ic('play') + ' Takrorni boshlash</button>' : '<div class="chip" style="background:rgba(255,255,255,.2);color:#fff">' + (st.active ? 'Bugungi takror tugadi 🎉' : 'Hozircha xato yo‘q') + '</div>') + '</div>';
  const stats = '<div class="stats rise" style="margin-top:12px"><div class="stat"><b>' + st.active + '</b><span>Faol xato</span></div><div class="stat"><b>' + st.due + '</b><span>Bugun</span></div><div class="stat"><b>' + st.mastered + '</b><span>O‘zlashtirilgan</span></div><div class="stat"><b>' + IE.bankToday() + '</b><span>Bugun yechildi</span></div></div>';
  const types = Object.keys(st.types).length ? '<div class="sec"><h2>Zaif savol turlari</h2></div><div class="card rise">' + Object.entries(st.types).sort((a, b) => b[1] - a[1]).map(([t, n]) => '<div class="mbt"><span>' + (TYP[t] || t) + '</span><div class="prog"><i style="width:' + Math.round(n / mx * 100) + '%"></i></div><b>' + n + '</b></div>').join('') + '</div>' : '';
  const list = st.units.length ? '<div class="sec"><h2>Testlar bo‘yicha</h2></div><div class="lst">' + st.units.slice(0, 12).map(e => '<button class="item rise" data-go="ana/' + (e.k === 'L' ? 'l' : '') + e.rec.ts + '">' + bd(e.k === 'L' ? 'head' : 'book', e.k, 'sm') + '<div class="tx"><b>' + esc(e.u.cam || e.u.title) + '</b><span>' + e.n + ' ta xato' + (e.due ? ' · <b style="color:var(--warn)">' + e.due + ' ta takrorda</b>' : '') + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>' : '<div class="card empty rise" style="margin-top:12px">' + bd('cards', 'V') + 'Reading yoki Listening ishlang — xato qilgan savollaringiz avtomatik shu yerga tushadi.<br><div class="two" style="margin-top:12px"><button class="btn sm" data-go="reading">Reading</button><button class="btn sm ghost" data-go="listening">Listening</button></div></div>';
  return IE.sub('Xatolar banki', 'tools', '<div class="pad">' + hero + stats + types + list + '</div>');
}

/* ---------- takrorlash seansi ---------- */
const find = key => IE.bankItems().find(x => x.key === key);
const ctl = (x) => {
  const g = x.g, q = x.q;
  if (g.type === 'tfng') return '<div class="tf">' + ['TRUE', 'FALSE', 'NOT GIVEN'].map(v => '<button class="opt" data-a="mbans" data-v="' + v + '">' + v + '</button>').join('') + '</div>';
  if (g.type === 'mcq') return '<div class="opts">' + q.o.map((o, i) => '<button class="opt" data-a="mbans" data-v="' + i + '"><i>' + 'ABCDEFGHIJ'[i] + '</i><span>' + esc(o) + '</span></button>').join('') + '</div>';
  if (g.type === 'heads') return '<div class="opts">' + g.headings.map(h => '<button class="opt" data-a="mbans" data-v="' + esc(h.id) + '"><i>' + esc(h.id) + '</i><span>' + esc(h.t) + '</span></button>').join('') + '</div>';
  return '<div class="row" style="gap:8px"><input class="fill" id="mbf" placeholder="Javobingiz" autocomplete="off" autocapitalize="off" spellcheck="false" style="flex:1"><button class="btn" data-a="mbans" data-f="1">Tekshirish</button></div>';
};
function run() {
  const m = V.mb; if (!m) return home();
  if (m.i >= m.q.length) {
    const tot = m.ok + m.no, pc = tot ? Math.round(m.ok / tot * 100) : 0, st = IE.bankStats();
    return IE.sub('Xatolar banki', 'mb', '<div class="pad"><div class="res anim"><div class="lbl">Seans tugadi</div><div class="big">' + m.ok + '<span style="font-size:32px">/' + tot + '</span></div><div class="mu" style="margin:8px 0 6px">' + (pc >= 80 ? 'Ajoyib! Xatolar yopilmoqda 🎉' : pc >= 50 ? 'Yaxshi — xato savollar bugun yana qaytadi.' : 'Xato savollar tez-tez qaytadi — shunda o‘rganasiz.') + '</div><div class="sm mu" style="margin-bottom:16px">Qolgan faol xato: ' + st.active + ' · bugun takror: ' + st.due + '</div><div class="two"><button class="btn ghost" data-go="mb">Banka</button>' + (st.due ? '<button class="btn" data-a="mbgo">Yana</button>' : '<button class="btn" data-go="home">Home</button>') + '</div></div></div>');
  }
  const key = m.q[m.i], x = find(key); if (!x) { m.i++; return run(); }
  const g = x.g, q = x.q, qt = g.type === 'heads' ? 'Paragraph <b>' + esc(q.para) + '</b> uchun sarlavhani tanlang' : esc(q.q || 'Gap ' + q.n);
  const fb = m.fb ? '<div class="mbfb ' + (m.fb.ok ? 'ok' : 'no') + '"><b>' + (m.fb.ok ? '✓ To‘g‘ri!' : '✗ Noto‘g‘ri') + '</b>' + (m.fb.ok ? '' : '<div>Sizning javobingiz: <b>' + esc(m.fb.given) + '</b></div>') + '<div>To‘g‘ri javob: <b>' + esc(corr(g, q)) + '</b></div>' + (q.why ? '<p>' + esc(q.why) + '</p>' : '') + '<div class="row" style="gap:8px;margin-top:8px"><button class="chip" data-a="ev" data-k="' + x.k + '" data-u="' + esc(x.u.id) + '" data-n="' + q.n + '">' + ic('eye') + ' Dalil</button></div></div><button class="btn block" style="margin-top:12px" data-a="mbnext">' + (m.i + 1 >= m.q.length ? 'Natija' : 'Keyingisi') + '</button>' : ctl(x);
  return IE.sub('Xatolar banki', 'mb', '<div class="pad"><div class="prog" style="margin:4px 0 6px"><i style="width:' + (m.i / m.q.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:10px">' + (m.i + 1) + ' / ' + m.q.length + '</div><div class="card rise mbq"><div class="row" style="gap:6px;margin-bottom:8px;flex-wrap:wrap"><span class="chip">' + (TYP[g.type] || g.type) + '</span><span class="chip">' + (x.k === 'L' ? 'Listening' : 'Reading') + '</span>' + (x.st ? '<span class="chip">' + (x.st.b >= 3 ? '★★★' : x.st.b >= 1 ? '★' : 'yangi') + '</span>' : '<span class="chip">yangi</span>') + '</div><div class="mbsrc">' + label(x) + '</div><div class="mbqt">' + qt + '</div></div><div style="margin-top:12px">' + fb + '</div></div>');
}
A.mbgo = () => {
  const due = IE.bankItems().filter(x => x.due); if (!due.length) return IE.toast('Bugun takror yo‘q');
  V.mb = { q: shuffle(due).slice(0, 12).map(x => x.key), i: 0, ok: 0, no: 0, fb: null, again: new Set() }; IE.go('mb/run'); IE.draw(false);
};
A.mbans = el => {
  const m = V.mb; if (!m || m.fb) return; const x = find(m.q[m.i]); if (!x) return;
  let v = el.dataset.f ? ($('#mbf') || {}).value : el.dataset.v; if (v == null || String(v).trim() === '') return IE.toast('Javob yozing'); if (x.g.type === 'mcq') v = +v;
  const ok = IE.isOk(x.g, x.q, v), s = S(); s.mb = s.mb || {}; const cur = s.mb[x.key] || { b: 0, d: 0, ok: 0, no: 0 }, td = IE.dayNum();
  if (ok) { const b = Math.min(5, cur.b + 1); s.mb[x.key] = { b, d: td + LAD[b], t: Date.now(), ok: cur.ok + 1, no: cur.no }; m.ok++; IE.vib(12); }
  else { s.mb[x.key] = { b: 0, d: td, t: Date.now(), ok: cur.ok, no: cur.no + 1 }; m.no++; IE.vib([20, 40]); if (!m.again.has(x.key)) { m.again.add(x.key); m.q.push(x.key); } }
  const given = x.g.type === 'mcq' ? ('ABCDEFGHIJ'[v] + '. ' + (x.q.o[v] || '')) : x.g.type === 'heads' ? v + '. ' + ((x.g.headings.find(h => h.id === v) || {}).t || '') : String(v);
  m.fb = { ok, given }; bump(); IE.save(); IE.draw(false);
};
A.mbnext = () => { const m = V.mb; if (!m) return; m.i++; m.fb = null; if (m.i >= m.q.length && m.ok / Math.max(1, m.ok + m.no) >= .7) IE.confetti(); IE.draw(false); window.scrollTo(0, 0); };
R.mb = a => a[0] === 'run' ? run() : home();
})();
