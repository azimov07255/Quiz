/* IELTS · Test vositalari: savollar paneli + belgilash, izoh, matn o‘lchami, erkin belgilash (highlighter), javoblar kaliti va dalil ko‘rinishi. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, $, $$, lsGet, lsSet } = IE, S = () => IE.S(), A = IE.act, V = IE.V, D = IE.D;

/* ---------- matn o‘lchami ---------- */
const fsGet = () => { try { return parseFloat(localStorage.getItem('ielts:tfs')) || 1; } catch (e) { return 1; } };
const applyFs = () => document.documentElement.style.setProperty('--tfs', String(fsGet()));
applyFs();
A.tfs = el => { const v = Math.max(.85, Math.min(1.7, Math.round((fsGet() + (+el.dataset.d)) * 100) / 100)); try { localStorage.setItem('ielts:tfs', String(v)); } catch (e) { /* */ } applyFs(); IE.toast('Matn o‘lchami: ' + Math.round(v * 100) + '%'); };

/* ---------- izoh (har test uchun, faqat shu qurilmada) ---------- */
const nk = id => 'ielts:note:' + id, hasNote = id => { try { return !!localStorage.getItem(nk(id)); } catch (e) { return false; } };
IE.tkTools = id => '<div class="ttools"><button class="tt" data-a="tfs" data-d="-0.1" aria-label="Matnni kichraytirish">A<small>−</small></button><button class="tt" data-a="tfs" data-d="0.1" aria-label="Matnni kattalashtirish">A<small>+</small></button><button class="tt' + (hasNote(id) ? ' on' : '') + '" data-a="note" data-id="' + esc(id) + '" aria-label="Izoh">' + ic('doc') + '<small>Izoh</small></button>' + (/^reading/.test(IE.curRoute || '') || /^reading/.test(location.hash.replace(/^#\/?/, '')) ? '<span class="tt-h mu xs">Matnni belgilab, rang tanlang</span>' : '') + '</div>';
A.note = el => {
  const id = el.dataset.id, v = (() => { try { return localStorage.getItem(nk(id)) || ''; } catch (e) { return ''; } })();
  IE.sheet('<h2>Izoh</h2><p class="mu sm" style="margin:4px 0 10px">Ish daftari — faqat shu qurilmada saqlanadi.</p><textarea class="ed" id="ntx" data-in="ntx" data-id="' + esc(id) + '" style="min-height:190px" placeholder="Muhim joylar, taxminlar…">' + esc(v) + '</textarea><button class="btn block" style="margin-top:12px" data-a="sheet-x">Tayyor</button>');
  setTimeout(() => { const t = $('#ntx'); if (t) t.focus(); }, 80);
};
IE.ntx = el => { try { if (el.value) localStorage.setItem(nk(el.dataset.id), el.value); else localStorage.removeItem(nk(el.dataset.id)); } catch (e) { /* */ } $$('.tt[data-a="note"]').forEach(b => b.classList.toggle('on', !!el.value)); };

/* ---------- savollar paneli va belgilash (flag) ---------- */
A.flag = el => {
  const c = IE.ctx && IE.ctx(); if (!c || !c.r) return; const n = el.dataset.n, r = c.r; r.flag = r.flag || {};
  if (r.flag[n]) delete r.flag[n]; else r.flag[n] = 1;
  lsSet(c.key, r); el.classList.toggle('on', !!r.flag[n]); const q = el.closest('.q'); if (q) q.classList.toggle('flagged', !!r.flag[n]); IE.vib(10);
};
A.pal = () => {
  const c = IE.ctx(), t = c.test(), r = c.r, qs = IE.allQ(t), fl = r.flag || {}, ans = n => r.ans[n] != null && r.ans[n] !== '';
  const nd = qs.filter(x => ans(x.q.n)).length, nf = qs.filter(x => fl[x.q.n]).length;
  IE.sheet('<h2>Savollar</h2><div class="pq-lg"><span><i class="d"></i> Javob berilgan ' + nd + '</span><span><i></i> Javobsiz ' + (qs.length - nd) + '</span><span><i class="f"></i> Belgilangan ' + nf + '</span></div><div class="pqg">' +
    qs.map(({ q }) => '<button class="pq' + (ans(q.n) ? ' d' : '') + (fl[q.n] ? ' f' : '') + '" data-a="palgo" data-n="' + q.n + '">' + q.n + (fl[q.n] ? '<i>' + ic('flag') + '</i>' : '') + '</button>').join('') + '</div>' +
    '<div class="two" style="margin-top:14px">' + (qs.length - nd ? '<button class="btn ghost" data-a="palgo" data-n="' + (qs.find(x => !ans(x.q.n)) || { q: {} }).q.n + '">Birinchi javobsizga</button>' : '<button class="btn ghost" data-a="sheet-x">Yopish</button>') + (nf ? '<button class="btn ghost" data-a="palgo" data-n="' + qs.find(x => fl[x.q.n]).q.n + '">Belgilanganga</button>' : '<button class="btn" data-a="sheet-x">Yopish</button>') + '</div>');
};
A.palgo = el => {
  const n = el.dataset.n; IE.closeSheet(); if (!n) return;
  const go = () => { const e = $('#q' + n); if (e) { e.scrollIntoView({ block: 'center', behavior: 'smooth' }); e.classList.add('pulse'); setTimeout(() => e.classList.remove('pulse'), 1400); const i = e.querySelector('input.fill, input.gi'); if (i && matchMedia('(pointer:fine)').matches) i.focus({ preventScroll: true }); } };
  const e0 = $('#q' + n);
  if (e0 && e0.offsetParent === null && V.run && /^reading/.test(IE.curRoute || '')) { A.rtab({ dataset: { v: 'q' } }); setTimeout(go, 160); } else go();
};

/* ---------- erkin belgilash (Reading matni) ---------- */
const pkOf = node => { const el = node && (node.nodeType === 1 ? node : node.parentElement); return el && el.closest ? el.closest('[data-pk]') : null; };
const offs = (root, rg) => { const pre = document.createRange(); pre.selectNodeContents(root); pre.setEnd(rg.startContainer, rg.startOffset); const a = pre.toString().length; return [a, a + rg.toString().length]; };
function wrapRange(root, a, b, cls, id) {
  const tw = document.createTreeWalker(root, NodeFilter.SHOW_TEXT), segs = []; let pos = 0, n;
  while ((n = tw.nextNode())) { const len = n.nodeValue.length, s = Math.max(a, pos), e = Math.min(b, pos + len); if (s < e) segs.push([n, s - pos, e - pos]); pos += len; }
  segs.reverse().forEach(([nd, s, e]) => { const r = document.createRange(); r.setStart(nd, s); r.setEnd(nd, e); const m = document.createElement('mark'); m.className = 'uh ' + cls; m.dataset.id = id; try { r.surroundContents(m); } catch (er) { /* */ } });
}
function hlBar() {
  let b = $('#hlbar'); if (b) return b; b = document.createElement('div'); b.id = 'hlbar'; b.className = 'hlbar hide';
  b.innerHTML = '<button class="hc c1" data-a="hlc" data-c="c1" onmousedown="event.preventDefault()">Sariq</button><button class="hc c2" data-a="hlc" data-c="c2" onmousedown="event.preventDefault()">Yashil</button><button class="hc c3" data-a="hlc" data-c="c3" onmousedown="event.preventDefault()">Pushti</button>';
  document.body.appendChild(b); return b;
}
IE.tkMount = kind => {
  applyFs(); const bar = hlBar(); bar.classList.add('hide');
  if (kind === 'R' && V.run) (V.run.hx || []).forEach(h => { const root = $('[data-pk="' + h.k + '"]'); if (root) wrapRange(root, h.a, h.b, h.c, h.id); });
};
let selT = 0;
document.addEventListener('selectionchange', () => {
  clearTimeout(selT); selT = setTimeout(() => {
    const bar = $('#hlbar'); if (!bar) return; const sel = getSelection();
    if (!/^reading\/[^/]+\/run/.test(IE.curRoute || '') || !sel || sel.isCollapsed || !sel.rangeCount) { bar.classList.add('hide'); return; }
    const rg = sel.getRangeAt(0), h = pkOf(rg.startContainer);
    if (!h || h !== pkOf(rg.endContainer)) { bar.classList.add('hide'); return; }
    const [a, b] = offs(h, rg); if (b - a < 2) { bar.classList.add('hide'); return; }
    V.hlsel = { k: h.dataset.pk, a, b }; bar.classList.remove('hide');
  }, 140);
});
A.hlc = el => {
  const s = V.hlsel, r = V.run; if (!s || !r) return; const c = IE.ctx(), id = 'h' + Date.now().toString(36), root = $('[data-pk="' + s.k + '"]'); if (!root) return;
  r.hx = (r.hx || []).concat([{ id, k: s.k, a: s.a, b: s.b, c: el.dataset.c }]); lsSet(c.key, r); wrapRange(root, s.a, s.b, el.dataset.c, id);
  try { getSelection().removeAllRanges(); } catch (e) { /* */ } V.hlsel = null; $('#hlbar').classList.add('hide'); IE.vib(12);
};
document.addEventListener('click', e => {
  const m = e.target && e.target.closest && e.target.closest('mark.uh'); if (!m || !V.run || !/^reading\/[^/]+\/run/.test(IE.curRoute || '')) return;
  const sel = getSelection(); if (sel && !sel.isCollapsed) return; e.stopPropagation(); e.preventDefault();
  const id = m.dataset.id; IE.ask('Belgini o‘chirasizmi?', 'Tanlangan belgi matndan olib tashlanadi.', 'O‘chirish', () => {
    const c = IE.ctx(); V.run.hx = (V.run.hx || []).filter(h => h.id !== id); lsSet(c.key, V.run);
    $$('mark.uh[data-id="' + id + '"]').forEach(x => { const p = x.parentNode; while (x.firstChild) p.insertBefore(x.firstChild, x); p.removeChild(x); p.normalize(); });
  });
}, true);

/* ---------- javoblar kaliti ---------- */
const corr = (g, q) => g.type === 'heads' ? q.a + '. ' + ((g.headings.find(h => h.id === q.a) || {}).t || '') : g.type === 'mcq' ? 'ABCDEFGHIJ'[q.a] + '. ' + (q.o[q.a] || '') : Array.isArray(q.a) ? q.a.join(' / ') : q.a;
IE.keyList = (u, ans) => '<div class="pad"><details class="card keyd"><summary>' + ic('key') + ' Javoblar kaliti</summary><div class="keyg">' + IE.allQ(u).map(({ g, q }) => { const a = ans[q.n], ok = IE.isOk(g, q, a); return '<div class="kc ' + (ok ? 'ok' : (a == null || a === '' ? 'em' : 'no')) + '"><b>' + q.n + '</b><span>' + esc(corr(g, q)) + '</span></div>'; }).join('') + '</div></details></div>';

/* ---------- dalil ko‘rinishi ---------- */
const nrm = s => String(s || '').toLowerCase().replace(/[’‘`´]/g, '\'').replace(/[“”]/g, '"').replace(/[—–]/g, '-').replace(/\s+/g, ' ').trim();
const rxEsc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const fragRx = f => { const w = nrm(f).replace(/\.\.\.|…/g, ' ').split(' ').filter(Boolean).map(x => rxEsc(x).replace(/'/g, '[\'’‘]').replace(/-/g, '[-—–]')); try { return w.length ? new RegExp(w.join('\\s+'), 'i') : null; } catch (e) { return null; } };
function findReading(p, q) {
  if (q.para) { const pa = p.paras.find(x => x.k === q.para); if (pa) return { pa, frag: '' }; }
  const why = String(q.why || ''), qm = /[‘'“"]([^’'”"]{14,240})[’'”"]/.exec(why);
  if (qm) { const f = nrm(qm[1]).replace(/\.\.\.|…/g, ' ').trim(), probe = f.split(' ').slice(0, 6).join(' '); for (const pa of p.paras) if (nrm(pa.t).indexOf(probe) >= 0) return { pa, frag: f }; }
  const pm = /Paragraph\s+([A-Z])\b/i.exec(why); if (pm) { const pa = p.paras.find(x => String(x.k).toUpperCase() === pm[1].toUpperCase()); if (pa) return { pa, frag: '' }; }
  for (const a of (Array.isArray(q.a) ? q.a : [])) { if (String(a).length < 3) continue; for (const pa of p.paras) if (nrm(pa.t).indexOf(nrm(a)) >= 0) return { pa, frag: String(a) }; }
  return null;
}
const hiText = (text, frag) => { const rx = frag && fragRx(frag), m = rx && rx.exec(text); return m ? esc(text.slice(0, m.index)) + '<mark class="ev">' + esc(m[0]) + '</mark>' + esc(text.slice(m.index + m[0].length)) : esc(text); };
function findListen(t, q) {
  const tr = t.tr || []; if (!tr.length) return null;
  let i = q.p != null && tr[q.p] ? q.p : -1;
  if (i < 0) for (const a of (Array.isArray(q.a) ? q.a : [])) { if (String(a).length < 2) continue; const k = tr.findIndex(x => nrm(x.x).indexOf(nrm(a)) >= 0); if (k >= 0) { i = k; break; } }
  return i < 0 ? null : { i, tr };
}
/** Savol bo‘yicha dalil oynasi. kind: 'R' | 'L'. */
IE.evidence = (kind, id, n) => {
  const u = kind === 'R' ? D.reading.passages.find(x => x.id === id) : D.listening.tests.find(x => x.id === id); if (!u) return;
  const hit = IE.allQ(u).find(x => x.q.n === +n); if (!hit) return; const { g, q } = hit;
  const head = '<h2 style="font-size:19px">Savol ' + q.n + ' — dalil</h2><div class="evq">' + (q.q ? esc(q.q) : (q.para ? 'Paragraph ' + esc(q.para) : '')) + '</div><div class="evk"><b>Javob:</b> ' + esc(corr(g, q)) + '</div>';
  if (kind === 'R') {
    const f = findReading(u, q);
    return IE.sheet(head + (f ? '<div class="evt"><b>Paragraph ' + esc(f.pa.k) + '</b><p>' + hiText(f.pa.t, f.frag) + '</p></div>' : '<p class="mu sm">Bu savol uchun aniq joy topilmadi.</p>') + (q.why ? '<p class="why" style="margin-top:8px">' + esc(q.why) + '</p>' : '') + '<button class="btn block" style="margin-top:14px" data-a="sheet-x">Yopish</button>');
  }
  const f = findListen(u, q), tt = q.t != null ? q.t : (f && f.tr[f.i].t != null ? Math.max(0, f.tr[f.i].t - 0.5) : null);
  IE.sheet(head + (f ? '<div class="evt">' + [f.i - 1, f.i, f.i + 1].filter(k => k >= 0 && k < f.tr.length).map(k => '<p class="' + (k === f.i ? 'evcur' : 'mu') + '">' + (f.tr[k].t != null ? '<b>' + Math.floor(f.tr[k].t / 60) + ':' + String(Math.floor(f.tr[k].t % 60)).padStart(2, '0') + '</b> ' : '') + (k === f.i ? hiText(f.tr[k].x, (Array.isArray(q.a) ? q.a[0] : '')) : esc(f.tr[k].x)) + '</p>').join('') + '</div>' : '<p class="mu sm">Audioscript topilmadi (yoki bu qism uchun kiritilmagan).</p>') +
    (q.why ? '<p class="why" style="margin-top:8px">' + esc(q.why) + '</p>' : '') + '<div class="two" style="margin-top:14px">' + (tt != null && $('#au') ? '<button class="btn" data-a="evgo" data-t="' + tt + '">Shu joydan tinglash</button>' : '<button class="btn ghost" data-a="sheet-x">Yopish</button>') + '<button class="btn ghost" data-a="sheet-x">Yopish</button></div>');
};
IE.evFind = (u, q) => findReading(u, q); IE.evFindL = (u, q) => findListen(u, q); IE.fragRx = fragRx;
A.evgo = el => { IE.closeSheet(); A.lgo(el); };
A.ev = el => {
  const r = /^(reading|listening)\/([^/]+)\/result/.exec(IE.curRoute || ''); const kind = el.dataset.k || (r ? (r[1] === 'reading' ? 'R' : 'L') : ''), id = el.dataset.u || (r && r[2]); if (kind && id) IE.evidence(kind, id, el.dataset.n);
};
})();
