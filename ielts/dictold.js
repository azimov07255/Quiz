/* IELTS · BY AZIMOV — “Dictionary (eski, tezkor)”: v1.2 dagi sodda lug‘at. Ochiq lug‘at (IPA, ovoz, ta’rif) darhol chiqadi, o‘zbekcha tarjima AI orqali keyin qo‘shiladi.
   Yangi Dictionary (dict.js) dan mustaqil: o‘z marshruti (#/dictold), o‘z keshi va amallari — bir-biriga tegmaydi. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V;
const DC = 'ielts:dco';
const dcGet = w => (lsGet(DC, {}) || {})[w.toLowerCase()];
const dcSet = (w, v) => { const m = lsGet(DC, {}) || {}; m[w.toLowerCase()] = v; const k = Object.keys(m); if (k.length > 300) delete m[k[0]]; lsSet(DC, m); };
async function freeDict(w) {
  const ctl = new AbortController(), t = setTimeout(() => ctl.abort(), 8000);
  try {
    const r = await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + encodeURIComponent(w.toLowerCase()), { signal: ctl.signal });
    if (r.status === 404) return { nf: true };
    if (!r.ok) throw new Error('lug‘at ' + r.status);
    const arr = await r.json(); if (!Array.isArray(arr) || !arr.length) return { nf: true };
    const ph = [], meanings = [], okU = x => (/^https:\/\/[^\s"'<>]{5,300}$/.test(String(x || '')) ? String(x) : '');
    arr.slice(0, 3).forEach(en => {
      (en.phonetics || []).forEach(p => ph.push({ t: String(p.text || ''), a: okU(p.audio) }));
      if (en.phonetic) ph.push({ t: String(en.phonetic), a: '' });
      (en.meanings || []).slice(0, 4).forEach(m => meanings.push({ pos: String(m.partOfSpeech || ''), defs: (m.definitions || []).slice(0, 3).map(d => ({ d: String(d.definition || '').slice(0, 240), ex: String(d.example || '').slice(0, 200) })), syn: (m.synonyms || []).slice(0, 6).map(String) }));
    });
    const uk = ph.find(p => /-uk\.mp3/i.test(p.a)), us = ph.find(p => /-us\.mp3/i.test(p.a)), any = ph.find(p => p.t) || { t: '' };
    return { ipaUK: (uk && uk.t) || '', ipaUS: (us && us.t) || '', ipa: any.t, auUK: (uk && uk.a) || '', auUS: (us && us.a) || '', meanings: meanings.slice(0, 5) };
  } finally { clearTimeout(t); }
}
const fromAI = r => ({ ipa: r.ipa || '', ipaUK: '', ipaUS: '', auUK: '', auUS: '', ai: true, meanings: [{ pos: r.pos || '', defs: [{ d: r.def || '', ex: (r.ex || [])[0] || '' }], syn: r.syn || [] }] });
const uzHTML = d => d.uz ? '<div style="font-size:19px;font-weight:800;color:var(--pl)">' + esc(d.uz) + '</div>' + (d.note ? '<div class="tip8" style="margin-top:10px">' + esc(d.note) + '</div>' : '')
  : d.uzBusy ? '<div class="mu sm row" style="gap:8px"><span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> O‘zbekcha tarjima tayyorlanmoqda…</div>'
    : '<div class="mu sm">' + (d.uzErr ? esc(d.uzErr) + ' ' : '') + '<button class="chip" data-a="dotr">Tarjimani qayta urinish</button></div>';
const here = () => (IE.curRoute || '') === 'dictold';
R.dictold = () => {
  const d = V.dold || (V.dold = { q: '' }), f = d.free;
  const my = f && S().my.some(x => x.id === 'my:' + d.q.toLowerCase());
  const ipaBtn = (lbl, t, u) => t || u ? '<button class="chip" data-a="doaud" data-u="' + esc(u) + '">' + ic('spk') + ' ' + lbl + (t ? ' ' + esc(t) : '') + '</button>' : '';
  const card = f ? '<div class="card" style="margin-top:14px"><div class="row"><div style="flex:1"><div style="font-size:28px;font-weight:900;word-break:break-word">' + esc(d.q) + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    (f.ipaUK || f.ipaUS || f.auUK || f.auUS ? ipaBtn('UK', f.ipaUK, f.auUK) + ipaBtn('US', f.ipaUS, f.auUS) : ipaBtn('', f.ipa, '')) + '</div></div></div>' +
    '<div id="uzb" style="margin-top:14px">' + uzHTML(d) + '</div>' +
    f.meanings.map(m => '<h4 class="dh">' + esc(m.pos || 'ma’no') + '</h4>' + m.defs.map((x, i) => '<p class="df">' + (x.d ? '<b>' + (i + 1) + '.</b> ' + esc(x.d) : '') + (x.ex ? '<em>“' + esc(x.ex) + '”</em>' : '') + '</p>').join('') +
      (m.syn && m.syn.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">' + m.syn.map(x => '<span class="chip">' + esc(x) + '</span>').join('') + '</div>' : '')).join('') +
    '<button class="btn block' + (my ? ' ghost' : '') + '" style="margin-top:16px"' + (my ? ' disabled' : ' data-a="doadd"') + '>' + (my ? ic('check') + ' Lug‘atingizda bor' : ic('star') + ' Mening so‘zlarimga qo‘shish') + '</button></div>' : '';
  return IE.sub('Dictionary (eski)', 'tools', '<div class="pad"><div class="row" style="gap:8px"><input class="search" id="doq" style="margin:0" placeholder="Inglizcha so‘z yoki ibora…" value="' + esc(d.q) + '" autocapitalize="off" spellcheck="false"><button class="btn" style="min-width:56px;padding:0 16px" data-a="dosearch" aria-label="Qidirish">' + ic('search') + '</button></div>' +
    (d.busy ? '<div class="card c" style="margin-top:14px"><div class="bub ai typing" style="margin:0 auto;display:inline-flex"><i></i><i></i><i></i></div></div>' : '') +
    (d.err ? '<div class="card c" style="margin-top:14px"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(d.err) + '</p></div>' : '') + card +
    (!f && !d.busy && !d.err ? '<div class="empty">' + bd('search', 'A') + 'Istalgan so‘zni yozing — ta’rifi, talaffuzi, misollari va o‘zbekcha tarjimasi chiqadi.</div>' : '') + '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' Bu tezkor, sodda lug‘at. Kengaytirilgan imkoniyatlar (sinonim, birikma, gap rejimi, UZ→EN) — yangi Dictionary’da.</p></div>');
};
async function translate(d) {
  d.uzBusy = true; d.uzErr = ''; const put = () => { const b = $('#uzb'); if (b && V.dold === d) b.innerHTML = uzHTML(d); }; put();
  try {
    const hint = d.free.meanings.slice(0, 3).map(m => m.pos + ': ' + ((m.defs[0] || {}).d || '')).join(' | ').slice(0, 480);
    const out = (await IE.ai({ action: 'dict', word: d.q, hint })).result || {};
    d.uz = out.uz || ''; d.note = out.note || ''; if (d.uz) dcSet(d.q, { uz: d.uz, note: d.note });
  } catch (e) { d.uzErr = e.message; }
  d.uzBusy = false; put();
}
A.dotr = () => { if (V.dold && V.dold.free && !V.dold.uzBusy) translate(V.dold); };
A.dosearch = async () => {
  const inp = $('#doq'), w = inp ? inp.value.trim().replace(/\s+/g, ' ') : '';
  if (!w || (V.dold && V.dold.busy)) return;
  if (!/^[A-Za-z][A-Za-z' -]{0,58}$/.test(w)) return IE.toast('Faqat inglizcha harflar kiriting');
  const d = V.dold = { q: w, busy: true, err: '' }; IE.draw(false);
  const cached = dcGet(w);
  let fr = null; if (!w.includes(' ')) { try { fr = await freeDict(w); } catch (e) { fr = null; } }
  if (V.dold !== d) return;
  if (fr && !fr.nf) {
    d.free = fr; d.busy = false; if (cached && cached.uz) { d.uz = cached.uz; d.note = cached.note || ''; }
    if (here()) IE.draw(false); if (!d.uz) translate(d); IE.touchDay(); return;
  }
  if (cached && cached.free) { d.free = cached.free; d.uz = cached.uz; d.note = cached.note || ''; d.busy = false; if (here()) IE.draw(false); return; }
  try { const r = (await IE.ai({ action: 'dict', word: w })).result; d.free = fromAI(r); d.uz = r.uz || ''; d.note = r.note || ''; dcSet(w, { uz: d.uz, note: d.note, free: d.free }); IE.touchDay(); } catch (e) { d.err = e.message; }
  d.busy = false; if (here() && V.dold === d) IE.draw(false);
};
A.doaud = el => { const u = el.dataset.u; if (u) { try { new Audio(u).play().catch(() => IE.say(V.dold.q)); return; } catch (e) { /* TTS */ } } IE.say(V.dold.q); };
A.doadd = () => {
  const d = V.dold; if (!d || !d.free) return; const m = d.free.meanings[0] || { defs: [] }, df = m.defs[0] || {};
  const id = 'my:' + d.q.toLowerCase(); if (S().my.some(x => x.id === id)) return;
  S().my.push({ id, w: d.q, uz: d.uz || '', def: df.d || '', ex: df.ex || '', pos: m.pos || '', ts: Date.now() }); IE.save(); IE.toast('Qo‘shildi'); IE.draw(false);
};
})();
