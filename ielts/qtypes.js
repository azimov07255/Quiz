/* IELTS · BY AZIMOV — Savol turlari trenajyori: True/False/Not Given, Matching Headings, Listening map/plan labelling (TTS audio),
   Paraphrase (AI) va Collocation. Har javobga “nega aynan shu” tushuntirishi. Natijalar S().qt[kalit] = {t, ok} (bulutga birlashadi). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $ } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const Q = () => D.qt || { tfng: [], heads: [], maps: [], para: [], col: [], tips: {} };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const rec = (k, ok) => { const s = S(); s.qt = s.qt || {}; s.qt[k] = { t: Date.now(), ok: ok ? 1 : 0 }; IE.touchDay(); IE.save(); };
const stat = pre => { const e = Object.entries(S().qt || {}).filter(([k]) => k.startsWith(pre + ':')); return { n: e.length, ok: e.filter(x => x[1].ok).length }; };
IE.qtStat = stat;
const pct = (a, b) => b ? Math.round(a / b * 100) : 0;
const tipsH = k => '<div class="card qtip"><b>' + ic('bulb') + ' Strategiya</b><ul class="notes" style="margin:8px 0 0;padding-left:18px">' + ((Q().tips || {})[k] || []).map(t => '<li>' + esc(t) + '</li>').join('') + '</ul></div>';
const sub = (title, back, inner) => IE.sub(title, back, '<div class="pad">' + inner + '</div>');
const cur = (k, id) => { if (!V.qt || V.qt.k !== k || V.qt.id !== id) V.qt = { k, id, ans: {}, pick: {}, done: false }; return V.qt; };

const TYPES = [
  ['tfng', 'R', 'book', 'True / False / Not Given', () => { const n = Q().tfng.reduce((a, p) => a + p.q.length, 0), s = stat('tf'); return [s, n, n + ' ta gap · ' + Q().tfng.length + ' ta matn']; }],
  ['heads', 'R', 'list', 'Matching Headings', () => { const n = Q().heads.reduce((a, p) => a + p.paras.length, 0), s = stat('hd'); return [s, n, n + ' ta paragraf · ' + Q().heads.length + ' ta matn']; }],
  ['map', 'L', 'head', 'Map / Plan labelling', () => { const n = Q().maps.reduce((a, p) => a + p.q.length, 0), s = stat('mp'); return [s, n, n + ' ta savol · ' + Q().maps.length + ' ta xarita (audio)']; }],
  ['para', 'W', 'pen', 'Paraphrase', () => { const n = Q().para.length, s = stat('pa'); return [s, n, n + ' ta gap · AI tekshiradi']; }],
  ['col', 'V', 'cards', 'Collocation', () => { const n = Q().col.length, s = stat('co'); return [s, n, n + ' ta birikma']; }],
];
IE.qtCard = () => '<button class="mock rise qtcard" data-go="qtype">' + bd('target', 'A', 'lg') + '<div style="flex:1"><h3>Savol turlari trenajyori</h3><p>T/F/NG, Headings, Map labelling, Paraphrase, Collocation</p></div>' + ic('next') + '</button>';

R.qtype = a => {
  if (!D.qt) return sub('Savol turlari', 'practice', '<div class="card empty">Ma’lumot yuklanmadi. Internetga ulanib, sahifani yangilang.</div>');
  const k = a[0]; if (!k) return hub();
  if (k === 'tfng') return a[1] ? tfDrill(+a[1]) : listPage('tfng');
  if (k === 'heads') return a[1] ? hdDrill(+a[1]) : listPage('heads');
  if (k === 'map') return a[1] ? mpDrill(+a[1]) : listPage('map');
  if (k === 'para') return paDrill();
  if (k === 'col') return coDrill();
  return hub();
};
function hub() {
  const tot = TYPES.reduce((p, t) => { const [s, n] = t[4](); return [p[0] + s.ok, p[1] + n]; }, [0, 0]);
  return sub('Savol turlari', 'practice', '<div class="card rise"><div class="row">' + bd('target', 'A', 'lg') + '<div style="flex:1"><b style="font-size:16px">Aniq maqsadli mashq</b><div class="sm mu">Har tur alohida mashq qilinadi, har javobdan keyin “nega aynan shu” tushuntirishi chiqadi. To‘g‘ri topilganlar: <b>' + tot[0] + '/' + tot[1] + '</b></div></div></div><div class="prog" style="margin-top:12px"><i style="width:' + pct(tot[0], tot[1]) + '%"></i></div></div>' +
    '<div class="lst" style="margin-top:14px">' + TYPES.map(t => { const [s, n, info] = t[4](); return '<button class="item rise" data-go="qtype/' + t[0] + '">' + bd(t[2], t[1], 'sm') + '<div class="tx"><b>' + t[3] + '</b><span>' + info + '</span><div class="prog" style="margin-top:6px;height:5px"><i style="width:' + pct(s.ok, n) + '%"></i></div></div><span class="chip' + (s.ok >= n && n ? ' ok' : '') + '">' + s.ok + '/' + n + '</span></button>'; }).join('') + '</div>' +
    '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Tavsiya: avval eng past foizli turdan boshlang. Xato qilingan savollar keyingi safar “qayta” belgisi bilan ko‘rinadi.</p>');
}
function listPage(k) {
  const q = Q(), pre = { tfng: 'tf', heads: 'hd', map: 'mp' }[k], items = k === 'tfng' ? q.tfng : k === 'heads' ? q.heads : q.maps, title = { tfng: 'True / False / Not Given', heads: 'Matching Headings', map: 'Map / Plan labelling' }[k];
  const info = { tfng: '4 ta gap', heads: '4 ta paragraf', map: '6 ta savol · audio' }[k], icn = { tfng: 'book', heads: 'list', map: 'head' }[k], sk = k === 'map' ? 'L' : 'R';
  return sub(title, 'qtype', tipsH(k) + '<div class="lst" style="margin-top:14px">' + items.map(p => {
    const n = k === 'tfng' ? p.q.length : k === 'heads' ? p.paras.length : p.q.length, ok = Object.entries(S().qt || {}).filter(([kk, v]) => kk.startsWith(pre + ':' + p.id + ':') && v.ok).length;
    return '<button class="item" data-go="qtype/' + k + '/' + p.id + '">' + bd(icn, sk, 'sm') + '<div class="tx"><b>' + esc(p.t) + '</b><span>' + info + '</span></div><span class="chip' + (ok >= n ? ' ok' : '') + '">' + ok + '/' + n + '</span></button>';
  }).join('') + '</div>');
}
const why = (ok, txt, ans) => '<div class="qwhy ' + (ok ? 'ok' : 'no') + '"><b>' + (ok ? '✓ To‘g‘ri' : '✗ Noto‘g‘ri') + (ok ? '' : ' — javob: ' + esc(ans)) + '</b><div>' + esc(txt) + '</div></div>';
const nextBtn = (k, id, list) => { const i = list.findIndex(x => x.id === id), nx = list[i + 1]; return '<div class="two" style="margin-top:14px"><button class="btn ghost" data-go="qtype/' + k + '">Ro‘yxat</button>' + (nx ? '<button class="btn" data-go="qtype/' + k + '/' + nx.id + '">Keyingisi</button>' : '<button class="btn" data-go="qtype">Tugatish</button>') + '</div>'; };

/* ---------- True / False / Not Given ---------- */
function tfDrill(id) {
  const p = Q().tfng.find(x => x.id === id); if (!p) return listPage('tfng');
  const c = cur('tfng', id), done = Object.keys(c.ans).length === p.q.length, okN = Object.entries(c.ans).filter(([i, v]) => v === p.q[i][1]).length;
  return sub(p.t, 'qtype/tfng', '<div class="prompt" style="font-size:15.5px;line-height:1.6">' + esc(p.p) + '</div><div class="sec"><h2>Gaplar</h2></div>' + p.q.map((s, i) => {
    const a = c.ans[i], ans = s[1];
    return '<div class="card qq" style="margin-bottom:10px"><div style="font-weight:700;line-height:1.45;margin-bottom:10px"><span class="chip" style="margin-right:6px">' + (i + 1) + '</span>' + esc(s[0]) + '</div><div class="qos">' +
      ['TRUE', 'FALSE', 'NOT GIVEN'].map(v => '<button class="qo' + (a === v ? (v === ans ? ' ok' : ' no') : a && v === ans ? ' ok' : '') + '"' + (a ? ' disabled' : ' data-a="qtf" data-i="' + i + '" data-v="' + v + '"') + '>' + v + '</button>').join('') + '</div>' + (a ? why(a === ans, s[2], ans) : '') + '</div>';
  }).join('') + (done ? '<div class="card c rise"><b style="font-size:18px">' + okN + ' / ' + p.q.length + '</b><div class="sm mu">' + (okN === p.q.length ? 'Ajoyib! Hammasi to‘g‘ri.' : 'Xatolarni sharhlar bilan solishtiring — qayta urinib ko‘ring.') + '</div></div>' + nextBtn('tfng', id, Q().tfng) : ''));
}
A.qtf = el => { const c = V.qt, p = Q().tfng.find(x => x.id === c.id), i = +el.dataset.i, v = el.dataset.v; if (c.ans[i]) return; c.ans[i] = v; rec('tf:' + p.id + ':' + i, v === p.q[i][1]); IE.draw(false); };

/* ---------- Matching Headings ---------- */
function hdDrill(id) {
  const p = Q().heads.find(x => x.id === id); if (!p) return listPage('heads');
  const c = cur('heads', id), used = new Set(Object.values(c.pick)), all = p.paras.every(([l]) => c.pick[l]);
  const okN = c.done ? p.paras.filter(([l]) => c.pick[l] === p.a[l]).length : 0;
  return sub(p.t, 'qtype/heads', '<div class="card"><b>Sarlavhalar</b><ol class="qhl" style="margin:8px 0 0;padding:0;list-style:none">' + p.h.map(h => '<li class="' + (used.has(h[0]) ? 'used' : '') + '"><b>' + h[0] + '</b> ' + esc(h[1]) + '</li>').join('') + '</ol></div>' +
    p.paras.map(([l, t]) => {
      const sel = c.pick[l], ok = c.done && sel === p.a[l];
      return '<div class="card qq" style="margin-top:10px"><div class="row" style="align-items:flex-start;gap:10px"><span class="qlet">' + l + '</span><div style="font-size:15px;line-height:1.55">' + esc(t) + '</div></div><div class="qos wrap" style="margin-top:10px">' + p.h.map(h => '<button class="qo sm' + (sel === h[0] ? (c.done ? (ok ? ' ok' : ' no') : ' sel') : c.done && h[0] === p.a[l] ? ' ok' : '') + '"' + (c.done ? ' disabled' : ' data-a="qhp" data-p="' + l + '" data-h="' + h[0] + '"') + '>' + h[0] + '</button>').join('') + '</div>' + (c.done ? why(ok, p.w[l], p.a[l] + ' — ' + ((p.h.find(h => h[0] === p.a[l]) || [])[1] || '')) : '') + '</div>';
    }).join('') + (c.done ? '<div class="card c rise" style="margin-top:12px"><b style="font-size:18px">' + okN + ' / ' + p.paras.length + '</b></div>' + nextBtn('heads', id, Q().heads) : '<button class="btn block" style="margin-top:14px"' + (all ? ' data-a="qhc"' : ' disabled') + '>' + ic('check') + ' Tekshirish</button><p class="hint" style="margin-top:10px">' + ic('bulb') + ' Har paragrafga bitta sarlavha tanlang (ikkita sarlavha ortiqcha).</p>'));
}
A.qhp = el => { const c = V.qt, l = el.dataset.p, h = el.dataset.h, was = c.pick[l] === h; Object.keys(c.pick).forEach(k => { if (c.pick[k] === h) delete c.pick[k]; }); if (!was) c.pick[l] = h; IE.draw(false); };
A.qhc = () => { const c = V.qt, p = Q().heads.find(x => x.id === c.id); c.done = true; p.paras.forEach(([l]) => rec('hd:' + p.id + ':' + l, c.pick[l] === p.a[l])); IE.draw(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

/* ---------- Map / Plan labelling (TTS audio) ---------- */
const mapSvg = m => {
  const slot = s => '<g><rect x="' + s.x + '" y="' + s.y + '" width="' + s.w + '" height="' + s.h + '" rx="6" class="mps"/><text x="' + (s.x + s.w / 2) + '" y="' + (s.y + s.h / 2 + 6) + '" text-anchor="middle" class="mpl">' + s.id + '</text></g>';
  const fx = f => '<g><rect x="' + f.x + '" y="' + f.y + '" width="' + f.w + '" height="' + f.h + '" rx="6" class="mpf"/>' + f.t.split(' ').map((w, i, arr) => '<text x="' + (f.x + f.w / 2) + '" y="' + (f.y + f.h / 2 + 4 + (i - (arr.length - 1) / 2) * 11) + '" text-anchor="middle" class="mpt">' + esc(w) + '</text>').join('') + '</g>';
  return '<svg viewBox="0 0 ' + m.w + ' ' + m.h + '" class="t1svg mpsvg" role="img" aria-label="' + esc(m.t) + '"><rect x="1" y="1" width="' + (m.w - 2) + '" height="' + (m.h - 2) + '" rx="10" class="mpb"/><rect x="' + m.cor[0] + '" y="' + m.cor[1] + '" width="' + m.cor[2] + '" height="' + m.cor[3] + '" class="mpc"/>' + m.fixed.map(fx).join('') + m.slots.map(slot).join('') + '</svg>';
};
const speak = (text, rate) => {
  const ss = window.speechSynthesis; if (!ss) return false;
  try { ss.cancel(); } catch (e) { /* */ }
  const parts = text.match(/[^.!?]+[.!?]+/g) || [text], voices = ss.getVoices ? ss.getVoices() : [], v = voices.find(x => /en-GB/i.test(x.lang)) || voices.find(x => /^en/i.test(x.lang));
  V.qt.speaking = true; let i = 0;
  const next = () => { if (!V.qt || !V.qt.speaking || i >= parts.length) { if (V.qt) { V.qt.speaking = false; V.qt.heard = true; } if (location.hash.startsWith('#/qtype/map')) IE.draw(false); return; } const u = new SpeechSynthesisUtterance(parts[i++].trim()); u.lang = (v && v.lang) || 'en-GB'; if (v) u.voice = v; u.rate = rate || .92; u.onend = next; u.onerror = next; ss.speak(u); };
  next(); return true;
};
const stopSpeak = () => { if (V.qt) V.qt.speaking = false; try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* */ } };
window.addEventListener('hashchange', () => { if (!location.hash.startsWith('#/qtype/map/')) stopSpeak(); });
function mpDrill(id) {
  const m = Q().maps.find(x => x.id === id); if (!m) return listPage('map');
  const c = cur('map', id), can = !!window.speechSynthesis, okN = c.done ? m.q.filter((q, i) => c.ans[i] === q.a).length : 0, letters = m.slots.map(s => s.id);
  return sub(m.t, 'qtype/map', '<div class="card"><b>Questions 1–' + m.q.length + '</b><div class="sm mu" style="margin-top:4px">Label the plan. Write the correct letter, <b>' + letters[0] + '–' + letters[letters.length - 1] + '</b>, next to each place. Audio bir marta emas — xohlagancha tinglashingiz mumkin (mashq).</div></div>' +
    '<div class="t1box">' + mapSvg(m) + '</div>' +
    (can ? '<div class="two" style="margin:12px 0"><button class="btn' + (c.speaking ? ' ghost' : '') + '" data-a="qmplay">' + ic(c.speaking ? 'stop' : 'play') + ' ' + (c.speaking ? 'To‘xtatish' : (c.heard ? 'Qayta tinglash' : 'Tinglash')) + '</button><button class="btn ghost" data-a="qmslow">' + (c.slow ? 'Sekin ✓' : 'Sekinroq') + '</button></div><p class="hint" style="margin-bottom:8px">' + ic('bulb') + ' Audio telefon ovozi (TTS) bilan o‘qiladi. Ovoz chiqmasa, qurilma sozlamalarida ingliz tili ovozini yoqing.</p>' : '<div class="card" style="margin:12px 0"><b>Audio mavjud emas</b><div class="sm mu">Bu brauzer ovozli o‘qishni qo‘llamaydi — matnni o‘qib mashq qiling.</div><div style="margin-top:8px;line-height:1.6">' + esc(m.script) + '</div></div>') +
    m.q.map((q, i) => { const a = c.ans[i], ok = c.done && a === q.a; return '<div class="card qq" style="margin-top:8px"><div style="font-weight:700;margin-bottom:8px"><span class="chip" style="margin-right:6px">' + (i + 1) + '</span>' + esc(q.q) + '</div><div class="qos wrap">' + letters.map(l => '<button class="qo sm' + (a === l ? (c.done ? (ok ? ' ok' : ' no') : ' sel') : c.done && l === q.a ? ' ok' : '') + '"' + (c.done ? ' disabled' : ' data-a="qmp" data-i="' + i + '" data-l="' + l + '"') + '>' + l + '</button>').join('') + '</div>' + (c.done ? why(ok, q.why, q.a) : '') + '</div>'; }).join('') +
    (c.done ? '<div class="card c rise" style="margin-top:12px"><b style="font-size:18px">' + okN + ' / ' + m.q.length + '</b></div><details class="card" style="margin-top:10px" open><summary class="b" style="cursor:pointer">Audio matni (transkript)</summary><p style="margin:8px 0 0;line-height:1.65">' + esc(m.script) + '</p></details>' + nextBtn('map', id, Q().maps) :
      '<button class="btn block" style="margin-top:14px"' + (m.q.every((q, i) => c.ans[i]) ? ' data-a="qmc"' : ' disabled') + '>' + ic('check') + ' Tekshirish</button>'));
}
A.qmplay = () => { const c = V.qt, m = Q().maps.find(x => x.id === c.id); if (c.speaking) { stopSpeak(); return IE.draw(false); } speak(m.script, c.slow ? .78 : .92); IE.draw(false); };
A.qmslow = () => { V.qt.slow = !V.qt.slow; IE.draw(false); };
A.qmp = el => { const c = V.qt; c.ans[+el.dataset.i] = el.dataset.l; IE.draw(false); };
A.qmc = () => { const c = V.qt, m = Q().maps.find(x => x.id === c.id); stopSpeak(); c.done = true; m.q.forEach((q, i) => rec('mp:' + m.id + ':' + i, c.ans[i] === q.a)); IE.draw(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

/* ---------- Paraphrase ---------- */
const words = t => String(t || '').toLowerCase().match(/[a-z']+/g) || [];
function paDrill() {
  const q = Q().para; if (!V.qtp || !V.qtp.order) V.qtp = { order: shuffle(q.map(x => x.id)), i: 0, text: '', res: null, busy: false };
  const p = V.qtp, it = q.find(x => x.id === p.order[p.i]); if (!it) { V.qtp = null; return paDrill(); }
  const r = p.res;
  return sub('Paraphrase', 'qtype', tipsH('para') + '<div class="prog" style="margin:14px 0 6px"><i style="width:' + ((p.i + 1) / p.order.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:8px">' + (p.i + 1) + ' / ' + p.order.length + '</div>' +
    '<div class="qcard" style="font-size:18px">' + esc(it.s) + '</div><div style="margin:10px 0;display:flex;gap:6px;flex-wrap:wrap">' + it.k.map(k => '<span class="chip">' + esc(k) + '</span>').join('') + '</div>' +
    '<textarea class="ed" id="qpa" style="min-height:96px;font:16px/1.5 -apple-system,sans-serif" placeholder="Shu gapni boshqa so‘zlar bilan qayta yozing (ma’no o‘zgarmasin)…"' + (r ? ' readonly' : '') + '>' + esc(p.text) + '</textarea>' +
    (!r ? '<button class="btn block" style="margin-top:10px" data-a="qpa"' + (p.busy ? ' disabled' : '') + '>' + (p.busy ? 'AI tekshirmoqda…' : ic('spark') + ' Tekshirish') + '</button>' :
      '<div class="card qq" style="margin-top:12px">' + (r.kept.length ? '<div class="qwhy no"><b>Takrorlangan kalit so‘zlar:</b> ' + r.kept.map(esc).join(', ') + '<div>Bularni sinonim bilan almashtiring.</div></div>' : '<div class="qwhy ok"><b>✓ Kalit so‘zlar almashtirilgan</b></div>') +
      (r.ai ? '<div class="sm" style="margin-top:10px;line-height:1.55"><b>AI: ' + r.ai.score + '/3</b> — ' + esc(r.ai.comment || '') + '</div>' + (r.ai.better ? '<div class="qwhy ok" style="margin-top:8px"><b>Yaxshiroq variant</b><div>' + esc(r.ai.better) + '</div></div>' : '') : '<div class="sm mu" style="margin-top:10px">AI tekshiruvi mavjud emas' + (r.err ? ' (' + esc(r.err) + ')' : '') + ' — namunalar bilan solishtiring:</div>') +
      '<div class="sm" style="margin-top:10px"><b>Namuna:</b><ul class="notes" style="margin:4px 0 0;padding-left:18px">' + it.m.map(m => '<li>' + esc(m) + '</li>').join('') + '</ul></div>' +
      (r.ai ? '' : '<div class="two" style="margin-top:12px"><button class="btn ghost" data-a="qpself" data-v="0">Yana mashq</button><button class="btn" data-a="qpself" data-v="1">Yaxshi chiqdi</button></div>') + '</div>' +
      (r.ai ? '<button class="btn block" style="margin-top:12px" data-a="qpn">' + (p.i + 1 >= p.order.length ? 'Tugatish' : 'Keyingi gap') + '</button>' : '')));
}
A.qpa = async () => {
  const p = V.qtp, it = Q().para.find(x => x.id === p.order[p.i]), t = (($('#qpa') || {}).value || '').trim(); if (words(t).length < 4) return IE.toast('Gapni to‘liq yozing');
  p.text = t; p.busy = true; IE.draw(false);
  const used = new Set(words(t)), kept = it.k.filter(k => words(k).length === 1 && used.has(k.toLowerCase())).concat(it.k.filter(k => words(k).length > 1 && t.toLowerCase().includes(k.toLowerCase())));
  const res = { kept, ai: null, err: '' };
  try { const out = await SB.fn('ielts-wr', { mode: 'para', s: it.s, text: t }); if (out && out.result && typeof out.result.score === 'number') { res.ai = out.result; rec('pa:' + it.id, out.result.score >= 2); } } catch (e) { res.err = e.net ? 'internet yo‘q' : (e.message || '').slice(0, 60); }
  p.res = res; p.busy = false; IE.draw(false);
};
A.qpself = el => { const it = Q().para.find(x => x.id === V.qtp.order[V.qtp.i]); rec('pa:' + it.id, el.dataset.v === '1'); A.qpn(); };
A.qpn = () => { const p = V.qtp; if (p.i + 1 >= p.order.length) { V.qtp = null; IE.toast('Barakalla!'); IE.confetti(); return IE.go('qtype'); } p.i++; p.text = ''; p.res = null; IE.draw(false); window.scrollTo({ top: 0 }); };

/* ---------- Collocation ---------- */
function coDrill() {
  const q = Q().col;
  if (!V.qtc) { const done = new Set(Object.entries(S().qt || {}).filter(([k, v]) => k.startsWith('co:') && v.ok).map(([k]) => +k.slice(3))); V.qtc = { ids: shuffle(q.filter(x => !done.has(x.id)).map(x => x.id)).concat(shuffle(q.filter(x => done.has(x.id)).map(x => x.id))).slice(0, 10), i: 0, ans: null, wrong: [], ok: 0 }; }
  const c = V.qtc, it = q.find(x => x.id === c.ids[c.i]);
  if (!it) { const wr = c.wrong.map(id => q.find(x => x.id === id)); return sub('Collocation', 'qtype', '<div class="card c rise">' + bd('trophy', 'M', 'lg').replace('class="bd', 'style="margin:0 auto 8px" class="bd') + '<b style="font-size:22px">' + c.ok + ' / ' + c.ids.length + '</b><div class="sm mu">' + (wr.length ? 'Xato qilingan birikmalar:' : 'Hammasi to‘g‘ri!') + '</div></div>' + (wr.length ? '<div class="lst" style="margin-top:12px">' + wr.map(x => '<div class="item"><div class="tx"><b style="white-space:normal">' + esc(x.n) + '</b></div></div>').join('') + '</div><button class="btn block ghost" style="margin-top:12px" data-a="qcadd">' + ic('plus') + ' Iboralarimga qo‘shish (takrorlash uchun)</button>' : '') + '<div class="two" style="margin-top:14px"><button class="btn ghost" data-go="qtype">Orqaga</button><button class="btn" data-a="qcre">Yana 10 ta</button></div>'); }
  const a = c.ans;
  return sub('Collocation', 'qtype', tipsH('col') + '<div class="prog" style="margin:14px 0 6px"><i style="width:' + ((c.i + (a != null ? 1 : 0)) / c.ids.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:8px">' + (c.i + 1) + ' / ' + c.ids.length + '</div>' +
    '<div class="qcard" style="font-size:18px;line-height:1.5">' + esc(it.q).replace('___', '<span class="qblank">' + (a != null ? esc(it.o[it.a]) : '&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;') + '</span>') + '</div>' +
    '<div class="qos wrap" style="margin-top:14px">' + it.o.map((o, i) => '<button class="qo' + (a != null ? (i === it.a ? ' ok' : i === a ? ' no' : '') : '') + '"' + (a != null ? ' disabled' : ' data-a="qco" data-i="' + i + '"') + '>' + esc(o) + '</button>').join('') + '</div>' +
    (a != null ? why(a === it.a, it.n, it.o[it.a]) + '<button class="btn block" style="margin-top:12px" data-a="qcn">' + (c.i + 1 >= c.ids.length ? 'Natija' : 'Keyingisi') + '</button>' : ''));
}
A.qco = el => { const c = V.qtc, it = Q().col.find(x => x.id === c.ids[c.i]), i = +el.dataset.i; c.ans = i; if (i === it.a) c.ok++; else c.wrong.push(it.id); rec('co:' + it.id, i === it.a); IE.draw(false); };
A.qcn = () => { const c = V.qtc; c.i++; c.ans = null; IE.draw(false); window.scrollTo({ top: 0 }); if (c.i >= c.ids.length && c.ok === c.ids.length) IE.confetti(); };
A.qcre = () => { V.qtc = null; IE.draw(false); };
A.qcadd = () => {
  const c = V.qtc, s = S(), now = Date.now(); let n = 0;
  c.wrong.forEach(id => { const x = Q().col.find(y => y.id === id), ph = x.n.split(' — ')[0].split(' (')[0].trim(), mid = 'my:' + ph.toLowerCase().replace(/[^a-z0-9 ]+/g, '').replace(/\s+/g, '-').slice(0, 60); if (!s.my.some(m => m.id === mid)) { s.my.push({ id: mid, w: ph, uz: x.n.split(' — ')[1] || '', def: '', ex: x.q.replace('___', x.o[x.a]), pos: 'collocation', ts: now }); n++; } if (!s.srs[mid]) s.srs[mid] = { b: 1, d: IE.dayNum(), t: now }; });
  IE.save(true); IE.toast(n ? n + ' ta ibora qo‘shildi' : 'Allaqachon qo‘shilgan');
};
})();
