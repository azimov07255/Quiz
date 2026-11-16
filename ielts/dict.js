/* IELTS · Dictionary 2.0: tezkor taklif, ingliz→o‘zbek (ta’rif, talaffuz, sinonim, birikma, so‘z oilasi, misol, maslahat),
   o‘zbek→ingliz, gap tarjimasi, sevimlilar, tarix, mini-test. Manbalar: dictionaryapi.dev + Datamuse (bepul) + AI (ielts-dict, umumiy kesh). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const HK = 'ielts:dhist', FKEY = 'ielts:dfav', CK = 'ielts:dcx';
const hist = () => lsGet(HK, []) || [], favs = () => lsGet(FKEY, []) || [];
const addHist = w => { const k = w.toLowerCase(), h = hist().filter(x => x.w !== k); h.unshift({ w: k, t: Date.now() }); lsSet(HK, h.slice(0, 60)); };
const isFav = w => favs().includes(w.toLowerCase());
const cache = () => lsGet(CK, {}) || {}, cget = w => cache()[w.toLowerCase()];
const cset = (w, v) => { const m = cache(); delete m[w.toLowerCase()]; m[w.toLowerCase()] = v; const k = Object.keys(m); while (k.length > 140) delete m[k.shift()]; lsSet(CK, m); };
const dx = () => V.dx || (V.dx = { mode: 'en', q: '', tab: 'm', sug: [], input: '' });
const aiCall = async body => { try { return await SB.fn('ielts-dict', body); } catch (e) { throw new Error(e.net ? 'Internetga ulanib bo‘lmadi.' : (e.message || 'AI xatosi')); } };
const getJ = async (url, ms = 6500) => { const c = new AbortController(), t = setTimeout(() => c.abort(), ms); try { const r = await fetch(url, { signal: c.signal }); return r.ok ? await r.json() : []; } catch (e) { return []; } finally { clearTimeout(t); } };
const STOP = new Set('the a an of to and in is that it for on with as by at be this from or are was were has have had not but his her its their our your my you we they he she i me him them us who which what when where how all any more most other some such no only own same so than too very can will just should now'.split(' '));
async function datamuse(w) {
  const e = encodeURIComponent(w), u = r => 'https://api.datamuse.com/words?' + r + '=' + e + '&max=16';
  const [syn, ant, bga, bgb] = await Promise.all([getJ(u('rel_syn')), getJ(u('rel_ant')), getJ(u('rel_bga')), getJ(u('rel_bgb'))]);
  const col = [...bgb.map(x => x.word + ' ' + w), ...bga.map(x => w + ' ' + x.word)].filter(p => p.split(' ').filter(z => z.toLowerCase() !== w.toLowerCase()).every(z => !STOP.has(z) && z.length > 2));
  return { syn: syn.map(x => x.word).slice(0, 12), ant: ant.map(x => x.word).slice(0, 8), col: col.slice(0, 10) };
}
const ieltsSet = () => { if (ieltsSet.c) return ieltsSet.c; const s = new Set(); D.vocab.topics.forEach(t => t.words.forEach(w => s.add(w.w.toLowerCase()))); return ieltsSet.c = s; };
const say = (t, r) => { try { const u = new SpeechSynthesisUtterance(t); u.lang = 'en-GB'; u.rate = r || .9; speechSynthesis.cancel(); speechSynthesis.speak(u); } catch (e) { IE.toast('Ovoz qo‘llab-quvvatlanmaydi'); } };
const hi = (t, w) => { try { const rx = new RegExp('\\b(' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/e$/, 'e?').replace(/y$/, '(?:y|ie)') + '\\w*)', 'i'); return esc(t).replace(rx, '<mark class="ev">$1</mark>'); } catch (e) { return esc(t); } };

/* ---------- taklif (autocomplete) ---------- */
async function suggest(q) {
  const ql = q.toLowerCase(), out = [], add = (w, tag) => { if (!out.some(x => x.w === w)) out.push({ w, tag }); };
  favs().filter(w => w.startsWith(ql)).forEach(w => add(w, 'fav')); hist().filter(x => x.w.startsWith(ql)).forEach(x => add(x.w, 'hist'));
  D.vocab.topics.forEach(t => t.words.forEach(w => { if (w.w.toLowerCase().startsWith(ql)) add(w.w.toLowerCase(), 'ielts'); }));
  const dm = await getJ('https://api.datamuse.com/sug?s=' + encodeURIComponent(q) + '&max=6', 3500); dm.forEach(x => add(x.word, ''));
  return out.slice(0, 8);
}
let sugT = 0;
IE.dsug = el => {
  const d = dx(); d.input = el.value; const x = $('#dclr'); if (x) x.classList.toggle('hide', !el.value);
  clearTimeout(sugT); const q = el.value.trim();
  if (d.mode !== 'en' || q.length < 2 || q.includes(' ')) { d.sug = []; return paintSug(); }
  sugT = setTimeout(async () => { const r = await suggest(q); if (dx().input.trim() === q && !d.busy && d.q !== q) { d.sug = r; paintSug(); } }, 160);
};
const sugHTML = () => { const d = dx(); return d.sug.length ? '<div class="dsug">' + d.sug.map(s => '<button data-a="dgo" data-w="' + esc(s.w) + '"><span>' + esc(s.w) + '</span>' + (s.tag ? '<em>' + (s.tag === 'fav' ? '♥' : s.tag === 'hist' ? 'oldin' : 'IELTS') + '</em>' : '') + '</button>').join('') + '</div>' : ''; };
const paintSug = () => { const b = $('#dsg'); if (b) b.innerHTML = sugHTML(); };

/* ---------- qidirish ---------- */
async function lookup(w) {
  const d = dx(); w = w.trim().replace(/\s+/g, ' '); if (!w) return;
  clearTimeout(sugT); Object.assign(d, { mode: 'en', tab: 'm', q: w, input: w, err: '', res: null, busy: true, sug: [], aiErr: '', uzres: null, sres: null }); addHist(w); IE.touchDay();
  if (location.hash.replace(/^#\/?/, '').split('/')[0] !== 'dict') return; paint(true);
  const c = cget(w);
  if (c && c.free !== undefined) { d.res = c; d.busy = false; paint(); if (!c.ai || (!c.free && !(c.ai.defs || []).length)) { c.ai = null; loadAI(d); } return; }
  const single = !w.includes(' '), [free, dm] = await Promise.all([single ? IE.freeDict(w).catch(() => null) : null, single ? datamuse(w) : { syn: [], ant: [], col: [] }]);
  if (dx() !== d || d.q !== w) return;
  d.res = { free: free && !free.nf ? free : null, dm, ai: null, t: Date.now() }; d.busy = false; paint(); loadAI(d);
}
const aiFree = res => { const g = []; (res.defs || []).forEach(x => { if (!x || !x.d) return; let m = g.find(y => y.pos === (x.pos || '')); if (!m) g.push(m = { pos: String(x.pos || ''), defs: [], syn: [] }); m.defs.push({ d: String(x.d).slice(0, 260), ex: String(x.ex || '').slice(0, 200) }); }); return g.length ? { ipa: res.ipa || '', ipaUK: '', ipaUS: '', auUK: '', auUS: '', ai: true, meanings: g } : null; };
async function loadAI(d) {
  const w = d.q, r = d.res; if (!r || d.aiBusy) return; d.aiBusy = true; d.aiErr = ''; paint();
  try {
    const hint = r.free ? r.free.meanings.slice(0, 3).map(m => m.pos + ': ' + ((m.defs[0] || {}).d || '')).join(' | ').slice(0, 480) : '', out = await aiCall({ mode: 'word', q: w, hint }), res = out.result || {};
    if (res.error) { d.aiErr = res.error; if (!r.free && !(r.dm.syn || []).length) { d.err = res.error; d.res = null; } } else { r.ai = res; if (!r.free) r.free = aiFree(res); cset(w, { free: r.free, dm: r.dm, ai: res, t: Date.now() }); }
  } catch (e) { d.aiErr = e.message; }
  d.aiBusy = false; if (dx() === d && d.q === w) paint();
}
async function lookupUz(q) {
  const d = dx(); Object.assign(d, { mode: 'uz', q, input: q, busy: true, err: '', uzres: null, res: null, sres: null }); paint(true);
  try { const out = await aiCall({ mode: 'uz', q }); d.uzres = out.result || { items: [] }; if (d.uzres.error && !(d.uzres.items || []).length) d.err = d.uzres.error; IE.touchDay(); } catch (e) { d.err = e.message; }
  d.busy = false; if (dx() === d) paint();
}
async function lookupSent(q) {
  const d = dx(); Object.assign(d, { mode: 'sent', q, input: q, busy: true, err: '', sres: null, res: null, uzres: null }); paint(true);
  try { const out = await aiCall({ mode: 'sent', q }); d.sres = out.result || {}; IE.touchDay(); } catch (e) { d.err = e.message; }
  d.busy = false; if (dx() === d) paint();
}
A.dsearch = () => {
  const i = $('#dq'), v = (i ? i.value : dx().input || '').trim().replace(/\s+/g, ' '), d = dx(); if (!v || d.busy) return;
  if (d.mode === 'uz') return lookupUz(v);
  if (d.mode === 'sent') return lookupSent(v);
  if (v.split(' ').length >= 4) { d.mode = 'sent'; return lookupSent(v); }
  if (!/^[A-Za-z][A-Za-z' .-]{0,58}$/.test(v)) return IE.toast('Inglizcha so‘z yozing (yoki “O‘zbek → Ingliz” rejimini tanlang)');
  lookup(v);
};
A.dgo = el => { const w = el.dataset.w; if (!w) return; const d = dx(); d.mode = 'en'; if (location.hash.replace(/^#\/?/, '').split('/')[0] !== 'dict') return IE.go('dict/' + encodeURIComponent(w)); lookup(w); window.scrollTo({ top: 0, behavior: 'smooth' }); };
A.dmode = el => { const d = dx(); d.mode = el.dataset.m; d.res = d.uzres = d.sres = null; d.err = ''; d.sug = []; d.busy = false; IE.draw(false); const i = $('#dq'); if (i) i.focus(); };
A.dtab = el => { dx().tab = el.dataset.v; paint(); };
A.dclr = () => { const d = dx(); d.input = ''; d.sug = []; const i = $('#dq'); if (i) { i.value = ''; i.focus(); } paintSug(); const x = $('#dclr'); if (x) x.classList.add('hide'); };
A.dhclr = () => IE.ask('Tarix tozalansinmi?', 'So‘nggi qidiruvlar o‘chadi (sevimlilar qoladi).', 'Tozalash', () => { lsSet(HK, []); IE.draw(false); });
A.dfav = () => { const d = dx(), k = d.q.toLowerCase(), f = favs(), i = f.indexOf(k); if (i >= 0) f.splice(i, 1); else f.unshift(k); lsSet(FKEY, f.slice(0, 80)); IE.vib(12); paint(); };
A.dcopy = () => { const d = dx(), r = d.res, t = d.q + (r && r.ai ? ' — ' + r.ai.uz : ''); try { navigator.clipboard.writeText(t); IE.toast('Nusxalandi'); } catch (e) { IE.toast(t); } };
A.dsay = el => say(dx().q, +el.dataset.r || .9);
A.dsayt = el => say(el.dataset.t, +el.dataset.r || .9);
A.daud = el => { const u = el.dataset.u; if (u) { try { new Audio(u).play().catch(() => say(dx().q)); return; } catch (e) { /* */ } } say(dx().q); };
A.dretry = () => { const d = dx(); if (d.res && !d.aiBusy) loadAI(d); };
const addMy = (w, uz, def, ex, pos) => { const id = 'my:' + w.toLowerCase(); if (!S().my.some(x => x.id === id)) { S().my.push({ id, w, uz: uz || '', def: def || '', ex: ex || '', pos: pos || '', ts: Date.now() }); IE.save(); return true; } return false; };
A.dadd = () => { const d = dx(), r = d.res; if (!r) return; const m = (r.free && r.free.meanings[0]) || { defs: [] }, df = m.defs[0] || {}, ex = (r.ai && r.ai.ex && r.ai.ex[0] && r.ai.ex[0].e) || df.ex || ''; addMy(d.q, r.ai && r.ai.uz, df.d, ex, m.pos); IE.vib(12); IE.toast('Lug‘atingizga qo‘shildi'); paint(); };
A.dsrs = () => { const d = dx(), r = d.res; if (!r) return; const m = (r.free && r.free.meanings[0]) || { defs: [] }, df = m.defs[0] || {}; addMy(d.q, r.ai && r.ai.uz, df.d, (r.ai && r.ai.ex && r.ai.ex[0] && r.ai.ex[0].e) || df.ex, m.pos); const id = 'my:' + d.q.toLowerCase(); S().srs[id] = { b: 1, d: IE.dayNum(), t: Date.now() }; IE.save(); IE.vib(12); IE.toast('Flesh-kartaga qo‘shildi — takrorlashda chiqadi'); paint(); };
A.dmic = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition; if (!SR) return IE.toast('Bu brauzerda ovozli qidiruv yo‘q');
  try { const r = new SR(); r.lang = dx().mode === 'uz' ? 'uz-UZ' : 'en-US'; r.interimResults = false; r.onresult = e => { const t = (e.results[0] && e.results[0][0] && e.results[0][0].transcript) || ''; const i = $('#dq'); if (i) { i.value = t; dx().input = t; } A.dsearch(); }; r.onerror = () => IE.toast('Eshitilmadi — qayta urinib ko‘ring'); r.start(); IE.toast('Gapiring…'); } catch (e) { IE.toast('Mikrofon ochilmadi'); }
};

/* ---------- ko‘rinish ---------- */
const chip = (w, tag) => '<button class="chip dc" data-a="dgo" data-w="' + esc(w) + '">' + (tag ? tag + ' ' : '') + esc(w) + '</button>';
const skel = '<div class="card c" style="margin-top:14px"><div class="bub ai typing" style="margin:0 auto;display:inline-flex"><i></i><i></i><i></i></div></div>';
function home() {
  const h = hist().slice(0, 14), f = favs().slice(0, 14), cs = Object.values(cache()).filter(x => x.ai && x.ai.uz).length, all = []; D.vocab.topics.forEach(t => t.words.forEach(w => all.push(w.w)));
  const dd = IE.dayNum(), rnd = Array.from({ length: 8 }, (_, i) => all[(dd * 7 + i * 13) % all.length]);
  return (f.length ? '<div class="sec"><h2>Sevimlilar</h2></div><div class="dchips">' + f.map(w => chip(w, '♥')).join('') + '</div>' : '') +
    (h.length ? '<div class="sec"><h2>So‘nggi qidiruvlar</h2><button class="chip" data-a="dhclr">Tozalash</button></div><div class="dchips">' + h.map(x => chip(x.w)).join('') + '</div>' : '') +
    (IE.wotd ? IE.wotd() : '') + '<div class="sec"><h2>Bugun o‘rganing</h2></div><div class="dchips">' + rnd.map(w => chip(w)).join('') + '</div>' +
    (cs >= 4 ? '<button class="aibn rise" style="margin-top:16px" data-go="dict/quiz">' + bd('target', 'A', 'lg') + '<div style="flex:1"><h3>Mini-test</h3><p>Qidirgan so‘zlaringizdan 5 ta savol — ma’nosini toping.</p></div><span class="go">' + ic('next') + '</span></button>' : '') +
    '<div class="card rise" style="margin-top:16px"><b>Imkoniyatlar</b><ul class="sm mu" style="margin:8px 0 0 18px;line-height:1.75"><li><b>Inglizcha → O‘zbekcha:</b> ta’rif, talaffuz (UK/US), sinonim, birikmalar, so‘z oilasi, IELTS misollari</li><li><b>O‘zbekcha → Inglizcha:</b> o‘zbekcha so‘z yozing — mos inglizcha so‘zlar chiqadi</li><li><b>Gap rejimi:</b> butun gapni tarjima qiling, kalit so‘zlar va paraphrase oling</li><li>Sevimlilar, tarix, ovozli qidiruv, flesh-karta</li></ul></div>';
}
function entry(d) {
  const r = d.res, f = r.free, ai = r.ai, w = d.q, fav = isFav(w), my = S().my.some(x => x.id === 'my:' + w.toLowerCase()), srs = !!S().srs['my:' + w.toLowerCase()];
  const pos = f ? [...new Set(f.meanings.map(m => m.pos).filter(Boolean))] : [], ie = ieltsSet().has(w.toLowerCase());
  const ipaB = (l, t, u) => t || u ? '<button class="chip w" data-a="daud" data-u="' + esc(u) + '">' + ic('spk') + ' ' + l + (t ? ' ' + esc(t) : '') + '</button>' : '';
  const hero = '<div class="dhero"><div class="row" style="align-items:flex-start"><div style="flex:1;min-width:0"><div class="dw">' + esc(w) + '</div><div class="dposr">' + pos.map(p => '<span class="chip w">' + esc(p) + '</span>').join('') + '</div></div><div class="row" style="gap:6px"><button class="ib w" data-a="dfav" aria-label="Sevimli" style="font-size:20px">' + (fav ? '♥' : '♡') + '</button><button class="ib w" data-a="dcopy" aria-label="Nusxalash">' + ic('doc') + '</button></div></div>' +
    '<div class="dposr" style="margin-top:10px">' + (f ? (f.ipaUK || f.ipaUS || f.auUK || f.auUS ? ipaB('UK', f.ipaUK, f.auUK) + ipaB('US', f.ipaUS, f.auUS) : ipaB('', f.ipa, '')) : '') + '<button class="chip w" data-a="dsay">' + ic('spk') + ' Eshitish</button><button class="chip w" data-a="dsay" data-r="0.55">🐢 Sekin</button></div>' +
    '<div class="duz">' + (ai ? esc(ai.uz) : d.aiBusy ? '<span class="shim"></span><span class="shim s2"></span>' : '<button class="chip w" data-a="dretry">' + (d.aiErr ? esc(d.aiErr).slice(0, 80) + ' · ' : '') + 'Tarjimani qayta urinish</button>') + '</div>' +
    (ai ? '<div class="dposr">' + (ai.level ? '<span class="chip w">' + esc(ai.level) + '</span>' : '') + (ai.reg ? '<span class="chip w">' + esc(ai.reg) + '</span>' : '') + (ie ? '<span class="chip w">★ IELTS lug‘ati</span>' : '') + '</div>' : '') + '</div>';
  const tabs = [['m', 'Ma’no'], ['s', 'Sinonim'], ['c', 'Birikma'], ['f', 'Oila'], ['x', 'Misol'], ['t', 'Maslahat']];
  const tb = tabs.map(t => '<button class="' + (d.tab === t[0] ? 'on' : '') + '" data-a="dtab" data-v="' + t[0] + '">' + t[1] + '</button>').join('');
  return hero + '<div class="seg dtabs">' + tb + '</div><div class="dbody">' + tab(d, r) + '</div>' +
    '<div class="two" style="margin-top:14px"><button class="btn' + (my ? ' ghost' : '') + '"' + (my ? ' disabled' : ' data-a="dadd"') + '>' + (my ? ic('check') + ' Lug‘atda' : ic('star') + ' Lug‘atimga') + '</button><button class="btn ghost"' + (srs ? ' disabled' : ' data-a="dsrs"') + '>' + (srs ? ic('check') + ' Flesh-kartada' : ic('cards') + ' Flesh-karta') + '</button></div>';
}
const wait = d => d.aiBusy ? '<div class="mu sm row" style="gap:8px;padding:10px 0"><span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> AI tayyorlamoqda…</div>' : '<div class="mu sm" style="padding:10px 0">' + (d.aiErr ? esc(d.aiErr) + ' ' : '') + '<button class="chip" data-a="dretry">Qayta urinish</button></div>';
function tab(d, r) {
  const f = r.free, ai = r.ai ? Object.assign({ ex: [], colloc: [], idioms: [], family: [], ant: [], defs: [] }, r.ai) : r.ai, dm = r.dm || { syn: [], ant: [], col: [] }, w = d.q, row = (l, sub, t) => '<div class="drow"><div style="flex:1;min-width:0"><b>' + l + '</b>' + (sub ? '<div class="sm mu">' + sub + '</div>' : '') + '</div>' + (t ? '<button class="ib sm2" data-a="dsayt" data-t="' + esc(t) + '" aria-label="Eshitish">' + ic('spk') + '</button>' : '') + '</div>';
  if (d.tab === 'm') {
    if (f) return f.meanings.map(m => '<h4 class="dh">' + esc(m.pos || 'ma’no') + '</h4>' + m.defs.map((x, i) => '<p class="df">' + (x.d ? '<b>' + (i + 1) + '.</b> ' + esc(x.d) : '') + (x.ex ? '<em>“' + hi(x.ex, w) + '” <button class="ib sm2 inl" data-a="dsayt" data-t="' + esc(x.ex) + '" aria-label="Eshitish">' + ic('spk') + '</button></em>' : '') + '</p>').join('')).join('');
    return '<p class="mu sm">Inglizcha ta’rif topilmadi.</p>' + (ai ? ai.ex.slice(0, 2).map(x => row(hi(x.e, w), esc(x.uz), x.e)).join('') : wait(d));
  }
  if (d.tab === 's') {
    const syn = [...new Set([...(f ? f.meanings.flatMap(m => m.syn || []) : []), ...dm.syn])].slice(0, 16), ant = [...new Set([...(ai && ai.ant || []), ...dm.ant])].slice(0, 10);
    return '<h4 class="dh">Sinonimlar</h4>' + (syn.length ? '<div class="dchips">' + syn.map(x => chip(x)).join('') + '</div>' : '<p class="mu sm">Topilmadi.</p>') + '<h4 class="dh">Antonimlar</h4>' + (ant.length ? '<div class="dchips">' + ant.map(x => chip(x)).join('') + '</div>' : (ai || !d.aiBusy ? '<p class="mu sm">Topilmadi.</p>' : wait(d)));
  }
  if (d.tab === 'c') {
    return (ai ? '<h4 class="dh">Birikmalar (collocations)</h4>' + ai.colloc.map(x => row(hi(x.p, w), esc(x.uz), x.p)).join('') + (ai.idioms && ai.idioms.length ? '<h4 class="dh">Iboralar va phrasal verb</h4>' + ai.idioms.map(x => row(esc(x.p), esc(x.uz) + (x.ex ? ' · <i>' + esc(x.ex) + '</i>' : ''), x.p)).join('') : '') : wait(d)) +
      (dm.col.length ? '<h4 class="dh">Ko‘p uchraydigan juftliklar</h4><div class="dchips">' + dm.col.map(x => '<button class="chip dc" data-a="dsayt" data-t="' + esc(x) + '">' + esc(x) + '</button>').join('') + '</div>' : '');
  }
  if (d.tab === 'f') return ai ? '<h4 class="dh">So‘z oilasi</h4>' + (ai.family || []).map(x => row('<span class="chip">' + esc(x.pos) + '</span> ' + esc(x.w), esc(x.uz), x.w)).join('') : wait(d);
  if (d.tab === 'x') return ai ? '<h4 class="dh">IELTS darajasidagi misollar</h4>' + (ai.ex || []).map(x => row(hi(x.e, w), esc(x.uz), x.e)).join('') : wait(d);
  return ai ? (ai.ielts ? '<div class="tip8"><b>IELTS’da:</b> ' + esc(ai.ielts) + '</div>' : '') + (ai.tip ? '<div class="tip8" style="margin-top:10px"><b>Eslatma:</b> ' + esc(ai.tip) + '</div>' : '') + (!ai.ielts && !ai.tip ? '<p class="mu sm">Maslahat yo‘q.</p>' : '') : wait(d);
}
function uzBody(d) {
  const it = (d.uzres && d.uzres.items) || [];
  return it.length ? '<div class="sec" style="margin-top:6px"><h2>“' + esc(d.q) + '” — inglizcha muqobillar</h2></div>' + it.map(x => '<div class="card dit"><div class="row"><div style="flex:1;min-width:0"><div class="dw2">' + esc(x.w) + ' <span class="chip">' + esc(x.pos || '') + '</span> ' + (x.level ? '<span class="chip">' + esc(x.level) + '</span>' : '') + '</div><div class="sm mu">' + esc(x.uz || '') + '</div>' + (x.ex ? '<div class="sm" style="margin-top:6px;font-style:italic">“' + hi(x.ex, x.w.split(' ')[0]) + '”</div>' : '') + '</div><button class="ib sm2" data-a="dsayt" data-t="' + esc(x.w) + '" aria-label="Eshitish">' + ic('spk') + '</button></div><div class="two" style="margin-top:10px"><button class="btn sm" data-a="dgo" data-w="' + esc(x.w) + '">Batafsil</button><button class="btn sm ghost" data-a="duadd" data-w="' + esc(x.w) + '" data-u="' + esc(x.uz || '') + '" data-e="' + esc(x.ex || '') + '">' + ic('star') + ' Lug‘atga</button></div></div>').join('') : '';
}
A.duadd = el => { addMy(el.dataset.w, el.dataset.u, '', el.dataset.e, ''); IE.vib(12); IE.toast('Lug‘atingizga qo‘shildi'); };
function sentBody(d) {
  const r = d.sres; if (!r) return '';
  return '<div class="dhero"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase;color:rgba(255,255,255,.8)">' + (r.dir === 'uz2en' ? 'O‘zbekcha → Inglizcha' : 'Inglizcha → O‘zbekcha') + '</div><div class="duz" style="margin-top:8px;font-size:21px">' + esc(r.tr || '') + '</div><div class="dposr" style="margin-top:12px"><button class="chip w" data-a="dsayt" data-t="' + esc(r.dir === 'uz2en' ? r.tr : d.q) + '">' + ic('spk') + ' Eshitish</button></div></div>' +
    ((r.key || []).length ? '<h4 class="dh">Kalit so‘zlar</h4>' + r.key.map(k => '<div class="drow"><div style="flex:1"><b>' + esc(k.w) + '</b><div class="sm mu">' + esc(k.uz) + '</div></div><button class="chip" data-a="dgo" data-w="' + esc(String(k.w).split(' ')[0].replace(/[^A-Za-z\'-]/g, '')) + '">Ko‘rish</button></div>').join('') : '') +
    (r.grammar ? '<div class="tip8" style="margin-top:12px"><b>Grammatika:</b> ' + esc(r.grammar) + '</div>' : '') +
    ((r.para || []).length ? '<h4 class="dh">Boshqacha ifodalash (paraphrase)</h4>' + r.para.map(p => '<div class="drow"><div style="flex:1;font-size:15px;line-height:1.5">' + esc(p) + '</div><button class="ib sm2" data-a="dsayt" data-t="' + esc(p) + '" aria-label="Eshitish">' + ic('spk') + '</button></div>').join('') : '');
}
function body() {
  const d = dx();
  if (d.busy) return skel;
  if (d.err) return '<div class="card c" style="margin-top:14px"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(d.err) + '</p></div>';
  if (d.mode === 'en' && d.res) return entry(d);
  if (d.mode === 'uz' && d.uzres) return uzBody(d) || '<div class="card empty">Mos so‘z topilmadi.</div>';
  if (d.mode === 'sent' && d.sres) return sentBody(d);
  return home();
}
function paint(full) {
  const b = $('#dres'); if (!b || full === true && false) return IE.draw(false);
  b.innerHTML = body(); paintSug(); const sc = $('#dscroll'); void sc;
}
const PH = { en: 'Inglizcha so‘z yoki ibora…', uz: 'O‘zbekcha so‘z yoki ibora…', sent: 'Inglizcha yoki o‘zbekcha gap…' };
R.dict = a => {
  if (a[0] === 'quiz') return quiz();
  const d = dx(), w = a[0] ? decodeURIComponent(a[0]) : '';
  if (w && d.auto !== w) { d.auto = w; setTimeout(() => (w.split(' ').length >= 4 ? lookupSent(w) : lookup(w)), 0); } else if (!w) d.auto = '';
  const modes = [['en', 'Ingliz → O‘zbek'], ['uz', 'O‘zbek → Ingliz'], ['sent', 'Gap']];
  return { h: '<header class="top"><button class="ib" data-a="back" data-r="tools" aria-label="Orqaga">' + ic('back') + '</button><h1>Dictionary</h1><button class="ib" style="margin-left:auto" data-go="dict/quiz" aria-label="Mini-test">' + ic('target') + '</button></header><div class="scr sub"><div class="pad dpad">' +
    '<div class="dsearch"><div class="dbar">' + ic('search') + '<input id="dq" data-in="dsug" placeholder="' + PH[d.mode] + '" value="' + esc(d.input || '') + '" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" enterkeyhint="search"><button class="dx' + (d.input ? '' : ' hide') + '" id="dclr" data-a="dclr" aria-label="Tozalash">' + ic('x') + '</button><button class="dm" data-a="dmic" aria-label="Ovozli qidiruv">' + ic('mic') + '</button><button class="dgo" data-a="dsearch" aria-label="Qidirish">' + ic('next') + '</button></div><div id="dsg">' + sugHTML() + '</div></div>' +
    '<div class="seg dmodes">' + modes.map(m => '<button class="' + (d.mode === m[0] ? 'on' : '') + '" data-a="dmode" data-m="' + m[0] + '">' + m[1] + '</button>').join('') + '</div><div id="dres">' + body() + '</div></div></div>', sub: true };
};
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'dq') { e.preventDefault(); e.target.blur(); A.dsearch(); } });

/* ---------- mini-test ---------- */
const shuf = a => a.slice().sort(() => Math.random() - .5);
function quiz() {
  const q = V.dq;
  if (!q) {
    const pool = Object.entries(cache()).filter(([, v]) => v.ai && v.ai.uz).map(([w, v]) => ({ w, uz: v.ai.uz.split(',')[0].trim() }));
    if (pool.length < 4) return { h: '<header class="top"><button class="ib" data-a="back" data-r="dict" aria-label="Orqaga">' + ic('back') + '</button><h1>Mini-test</h1></header><div class="scr sub"><div class="pad"><div class="card empty">' + bd('target', 'A') + 'Avval kamida 4 ta so‘z qidiring — keyin ularni sinab ko‘rasiz.<br><button class="btn sm" style="margin-top:12px" data-go="dict">Dictionary</button></div></div></div>', sub: true };
    V.dq = { qs: shuf(pool).slice(0, 5).map(it => ({ it, o: shuf([it.uz, ...shuf(pool.filter(x => x.uz !== it.uz)).slice(0, 3).map(x => x.uz)]) })), i: 0, ok: 0, done: false, pick: null };
    return quiz();
  }
  const back = '<header class="top"><button class="ib" data-a="dqx" aria-label="Orqaga">' + ic('back') + '</button><h1>Mini-test</h1></header>';
  if (q.done) return { h: back + '<div class="scr sub"><div class="pad"><div class="res anim"><div class="lbl">Natija</div><div class="big">' + q.ok + '/' + q.qs.length + '</div><div class="mu" style="margin-top:6px">' + (q.ok === q.qs.length ? 'Mukammal! 🎉' : 'Yaxshi — xatolarni qayta ko‘ring') + '</div></div><div class="two" style="margin-top:14px"><button class="btn ghost" data-a="dqx">Chiqish</button><button class="btn" data-a="dqre">Yana</button></div></div></div>', sub: true };
  const c = q.qs[q.i];
  return { h: back + '<div class="scr sub"><div class="pad"><div class="prog"><i style="width:' + (q.i / q.qs.length * 100) + '%"></i></div><div class="card c rise" style="margin-top:14px"><div class="mu xs b">' + (q.i + 1) + ' / ' + q.qs.length + '</div><div style="font:900 32px Georgia,serif;margin:8px 0">' + esc(c.it.w) + '</div><button class="chip" data-a="dsayt" data-t="' + esc(c.it.w) + '">' + ic('spk') + ' Eshitish</button></div><div class="opts" style="margin-top:14px">' + c.o.map((o, i) => '<button class="opt' + (q.pick != null ? (o === c.it.uz ? ' on ok' : i === q.pick ? ' on no' : '') : '') + '" data-a="dqa" data-i="' + i + '"><i>' + 'ABCD'[i] + '</i><span>' + esc(o) + '</span></button>').join('') + '</div>' + (q.pick != null ? '<button class="btn block" style="margin-top:14px" data-a="dqn">' + (q.i + 1 >= q.qs.length ? 'Natija' : 'Keyingisi') + '</button>' : '') + '</div></div>', sub: true };
}
A.dqa = el => { const q = V.dq; if (!q || q.pick != null) return; const i = +el.dataset.i, c = q.qs[q.i]; q.pick = i; if (c.o[i] === c.it.uz) { q.ok++; IE.vib(12); } else IE.vib([20, 40]); IE.draw(false); };
A.dqn = () => { const q = V.dq; if (!q) return; q.pick = null; q.i++; if (q.i >= q.qs.length) { q.done = true; if (q.ok === q.qs.length) IE.confetti(); IE.touchDay(); IE.save(); } IE.draw(false); };
A.dqre = () => { V.dq = null; IE.draw(false); };
A.dqx = () => { V.dq = null; IE.go('dict'); };
})();
