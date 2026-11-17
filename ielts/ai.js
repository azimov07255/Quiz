/* IELTS · BY AZIMOV — AI qismi: Speaking Chat, Writing bahosi, Dictionary (Edge Function "ielts-ai" orqali; kalitlar serverda). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V;
const call = async body => { try { return await SB.fn('ielts-ai', body); } catch (e) { throw new Error(e.net ? 'Internetga ulanib bo‘lmadi.' : (e.message || 'AI xatosi')); } };
IE.ai = call;
const nl = t => t.replace(/\n/g, '<br>');

/* Speaking Chat → chat.js */
const vv = window.visualViewport;
if (vv) { const set = () => { const r = document.documentElement.style; r.setProperty('--vh', vv.height + 'px'); r.setProperty('--vt', vv.offsetTop + 'px'); }; vv.addEventListener('resize', set); vv.addEventListener('scroll', set); set(); }
document.addEventListener('focusin', e => { if (e.target.id === 'ci') document.body.classList.add('kb'); });
document.addEventListener('focusout', e => { if (e.target.id === 'ci') setTimeout(() => { if (document.activeElement !== e.target) document.body.classList.remove('kb'); }, 200); });
document.addEventListener('mousedown', e => { if (e.target.closest('.cin .ib')) e.preventDefault(); });
document.addEventListener('input', e => { if (e.target.id === 'ci') { e.target.style.height = 'auto'; e.target.style.height = Math.min(120, e.target.scrollHeight) + 'px'; } });
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  if (e.target.id === 'ci') { e.preventDefault(); A.csend(); } else if (e.target.id === 'dq') { e.preventDefault(); A.dsearch(); }
});

/* ---------- Writing: AI bahosi ---------- */
IE.issHTML = i => '<div class="iss"><div class="was">' + esc(i.quote) + '</div><div class="now">' + esc(i.fix) + '</div><div class="why2">' + esc(i.why) + '</div><button class="chip issb" data-a="wiss" data-f="' + esc(i.fix) + '" data-w="' + esc(i.why) + '" data-q="' + esc(i.quote) + '">' + ic('plus') + ' Iboralarimga</button></div>';
A.wiss = el => {
  const f = String(el.dataset.f || '').trim().slice(0, 90); if (f.length < 3) return; const id = 'my:' + f.toLowerCase().replace(/[^a-z0-9 ]+/g, '').slice(0, 60).trim().replace(/\s+/g, '-');
  const s = S(); if (s.my.some(x => x.id === id)) return IE.toast('Bu ibora allaqachon lug‘atingizda');
  s.my.push({ id, w: f, uz: String(el.dataset.w || '').slice(0, 140), def: '', ex: String(el.dataset.q || '').slice(0, 160), pos: 'ibora', ts: Date.now() }); s.srs[id] = { b: 1, d: IE.dayNum(), t: Date.now() };
  IE.touchDay(); IE.save(); IE.vib(12); el.classList.add('done'); el.innerHTML = ic('check') + ' Qo‘shildi'; IE.toast('Iboralar daftariga qo‘shildi — takrorlash tizimida chiqadi');
};
IE.aiHTML = a => {
  const sc = (k, v, big) => '<div class="sc' + (big ? ' big' : '') + '"><b>' + IE.bandTxt(v) + '</b><span>' + k + '</span></div>';
  return '<div class="airs"><div class="scs">' + sc(a.task === '1' ? 'Task Achiev.' : 'Task Response', a.tr) + sc('Coherence', a.cc) + sc('Lexical', a.lr) + sc('Grammar', a.gra) + '</div><div class="sc big all"><b>' + IE.bandTxt(a.overall) + '</b><span>Taxminiy overall band</span></div>' +
    (a.strengths && a.strengths.length ? '<h4>Kuchli tomonlar</h4><ul>' + a.strengths.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' : '') +
    (a.issues && a.issues.length ? '<h4>Tuzatish kerak</h4>' + a.issues.map(IE.issHTML).join('') : '') +
    (a.upgrade ? '<h4>Kuchaytirilgan variant</h4><div class="essay card" style="padding:12px 14px"><p style="margin:0;font-size:15px">' + esc(a.upgrade) + '</p></div>' : '') +
    (a.next ? '<div class="tip8" style="margin-top:12px"><b>Keyingi qadam:</b> ' + esc(a.next) + '</div>' : '') + '<p class="hint" style="margin-top:10px">' + ic('bulb') + ' AI bahosi taxminiy — rasmiy imtihon bahosi emas.</p></div>';
};
A.wai = async el => {
  const ts = +el.dataset.ts, rec = S().writes.find(w => w.ts === ts), box = $('#aires'); if (!rec || !box) return;
  box.innerHTML = '<div class="card c"><div class="bub ai typing" style="margin:0 auto 8px;display:inline-flex"><i></i><i></i><i></i></div><p class="mu sm">AI inshoni o‘qiyapti… (10–20 soniya)</p></div>';
  try {
    const cu = IE.camWUnit ? IE.camWUnit(rec.p) : null, bt = IE.t1Find && String(rec.p).startsWith('t1:') ? IE.t1Find(rec.p) : null, img = cu && cu.task === '1' && IE.camWImg ? await IE.camWImg(cu.id) : null;
    const out = cu ? await SB.fn('ielts-wr', { mode: 'eval', task: cu.task, prompt: cu.text, desc: cu.desc || '', text: rec.x, img: img ? img.split(',')[1] : '' }) : bt ? await SB.fn('ielts-wr', { mode: 'eval', task: '1', prompt: bt.text, desc: IE.t1Desc(bt), text: rec.x, img: '' }) : await call({ action: 'writing', prompt: IE.wprompt(rec.p), text: rec.x });
    rec.ai = out.result; IE.save(true);
    const b = $('#aires'); if (b) b.innerHTML = (IE.wCompare ? IE.wCompare(rec) : '') + IE.aiHTML(rec.ai);
    if (rec.ai.overall >= (S().prof.target || 7)) IE.confetti();
  } catch (e) { const b = $('#aires'); if (b) b.innerHTML = '<div class="card c"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(e.message) + '</p><button class="btn sm" style="margin-top:8px" data-a="wai" data-ts="' + ts + '">Qayta urinish</button></div>'; }
};

/* ---------- Dictionary: ochiq lug‘at (darhol) + AI tarjima (keyin) ---------- */
const DC = 'ielts:dc';
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
IE.freeDict = freeDict; IE.dcGet = dcGet; IE.dcSet = dcSet;
const fromAI = r => ({ ipa: r.ipa || '', ipaUK: '', ipaUS: '', auUK: '', auUS: '', ai: true, meanings: [{ pos: r.pos || '', defs: [{ d: r.def || '', ex: (r.ex || [])[0] || '' }], syn: r.syn || [] }] });
const uzHTML = d => d.uz ? '<div style="font-size:19px;font-weight:800;color:var(--pl)">' + esc(d.uz) + '</div>' + (d.note ? '<div class="tip8" style="margin-top:10px">' + esc(d.note) + '</div>' : '')
  : d.uzBusy ? '<div class="mu sm row" style="gap:8px"><span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> O‘zbekcha tarjima tayyorlanmoqda…</div>'
    : '<div class="mu sm">' + (d.uzErr ? esc(d.uzErr) + ' ' : '') + '<button class="chip" data-a="dtr">Tarjimani qayta urinish</button></div>';
R.dict = () => {
  const d = V.dict || (V.dict = { q: '' }), f = d.free;
  const my = f && S().my.some(x => x.id === 'my:' + d.q.toLowerCase());
  const ipaBtn = (lbl, t, u) => t || u ? '<button class="chip" data-a="daud" data-u="' + esc(u) + '">' + ic('spk') + ' ' + lbl + (t ? ' ' + esc(t) : '') + '</button>' : '';
  const card = f ? '<div class="card" style="margin-top:14px"><div class="row"><div style="flex:1"><div style="font-size:28px;font-weight:900;word-break:break-word">' + esc(d.q) + '</div><div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">' +
    (f.ipaUK || f.ipaUS || f.auUK || f.auUS ? ipaBtn('UK', f.ipaUK, f.auUK) + ipaBtn('US', f.ipaUS, f.auUS) : ipaBtn('', f.ipa, '')) + '</div></div></div>' +
    '<div id="uzb" style="margin-top:14px">' + uzHTML(d) + '</div>' +
    f.meanings.map(m => '<h4 class="dh">' + esc(m.pos || 'ma’no') + '</h4>' + m.defs.map((x, i) => '<p class="df">' + (x.d ? '<b>' + (i + 1) + '.</b> ' + esc(x.d) : '') + (x.ex ? '<em>“' + esc(x.ex) + '”</em>' : '') + '</p>').join('') +
      (m.syn && m.syn.length ? '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:4px">' + m.syn.map(x => '<span class="chip">' + esc(x) + '</span>').join('') + '</div>' : '')).join('') +
    '<button class="btn block' + (my ? ' ghost' : '') + '" style="margin-top:16px"' + (my ? ' disabled' : ' data-a="dadd"') + '>' + (my ? ic('check') + ' Lug‘atingizda bor' : ic('star') + ' Mening so‘zlarimga qo‘shish') + '</button></div>' : '';
  return { h: '<header class="top"><button class="ib" data-a="back" data-r="tools" aria-label="Orqaga">' + ic('back') + '</button><h1>Dictionary</h1></header><div class="scr sub"><div class="pad"><div class="row" style="gap:8px"><input class="search" id="dq" style="margin:0" placeholder="Inglizcha so‘z yoki ibora…" value="' + esc(d.q) + '" autocapitalize="off" spellcheck="false"><button class="btn" style="min-width:56px;padding:0 16px" data-a="dsearch" aria-label="Qidirish">' + ic('search') + '</button></div>' +
    (d.busy ? '<div class="card c" style="margin-top:14px"><div class="bub ai typing" style="margin:0 auto;display:inline-flex"><i></i><i></i><i></i></div></div>' : '') +
    (d.err ? '<div class="card c" style="margin-top:14px"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(d.err) + '</p></div>' : '') + card +
    (!f && !d.busy && !d.err ? '<div class="empty">' + bd('search', 'A') + 'Istalgan so‘zni yozing — ta’rifi, talaffuzi, misollari va o‘zbekcha tarjimasi chiqadi.</div>' : '') + '</div></div>', sub: true };
};
async function translate(d) {
  d.uzBusy = true; d.uzErr = ''; const put = () => { const b = $('#uzb'); if (b && V.dict === d) b.innerHTML = uzHTML(d); }; put();
  try {
    const hint = d.free.meanings.slice(0, 3).map(m => m.pos + ': ' + ((m.defs[0] || {}).d || '')).join(' | ').slice(0, 480);
    const out = (await call({ action: 'dict', word: d.q, hint })).result || {};
    d.uz = out.uz || ''; d.note = out.note || ''; if (d.uz) dcSet(d.q, { uz: d.uz, note: d.note });
  } catch (e) { d.uzErr = e.message; }
  d.uzBusy = false; put();
}
A.dtr = () => { if (V.dict && V.dict.free && !V.dict.uzBusy) translate(V.dict); };
A.dsearch = async () => {
  const inp = $('#dq'), w = inp ? inp.value.trim().replace(/\s+/g, ' ') : '';
  if (!w || (V.dict && V.dict.busy)) return;
  if (!/^[A-Za-z][A-Za-z' -]{0,58}$/.test(w)) return IE.toast('Faqat inglizcha harflar kiriting');
  const d = V.dict = { q: w, busy: true, err: '' }; IE.draw(false);
  const cached = dcGet(w);
  let fr = null; if (!w.includes(' ')) { try { fr = await freeDict(w); } catch (e) { fr = null; } }
  if (V.dict !== d) return;
  if (fr && !fr.nf) {
    d.free = fr; d.busy = false; if (cached && cached.uz) { d.uz = cached.uz; d.note = cached.note || ''; }
    if (location.hash === '#/dict') IE.draw(false); if (!d.uz) translate(d); IE.touchDay(); return;
  }
  if (cached && cached.free) { d.free = cached.free; d.uz = cached.uz; d.note = cached.note || ''; d.busy = false; if (location.hash === '#/dict') IE.draw(false); return; }
  try { const r = (await call({ action: 'dict', word: w })).result; d.free = fromAI(r); d.uz = r.uz || ''; d.note = r.note || ''; dcSet(w, { uz: d.uz, note: d.note, free: d.free }); IE.touchDay(); } catch (e) { d.err = e.message; }
  d.busy = false; if (location.hash === '#/dict' && V.dict === d) IE.draw(false);
};
A.daud = el => { const u = el.dataset.u; if (u) { try { new Audio(u).play().catch(() => IE.say(V.dict.q)); return; } catch (e) { /* TTS */ } } IE.say(V.dict.q); };
A.dadd = () => {
  const d = V.dict; if (!d || !d.free) return; const m = d.free.meanings[0] || { defs: [] }, df = m.defs[0] || {};
  const id = 'my:' + d.q.toLowerCase(); if (S().my.some(x => x.id === id)) return;
  S().my.push({ id, w: d.q, uz: d.uz || '', def: df.d || '', ex: df.ex || '', pos: m.pos || '', ts: Date.now() }); IE.save(); IE.toast('Qo‘shildi'); IE.draw(false);
};

/* ---------- Speaking: AI bahosi (audio serverda matnga aylanadi, so‘ng IELTS mezonlari bo‘yicha baholanadi) ---------- */
const blobB64 = async b => { const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); };
IE.speakHTML = r => {
  const a = r.result, sc = (k, v) => '<div class="sc"><b>' + IE.bandTxt(v) + '</b><span>' + k + '</span></div>';
  return '<div class="airs"><div class="scs">' + sc('Fluency', a.fc) + sc('Lexical', a.lr) + sc('Grammar', a.gra) + sc('Pronun.*', a.pr) + '</div><div class="sc big all"><b>' + IE.bandTxt(a.overall) + '</b><span>Taxminiy overall band</span></div>' +
    '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:10px 0"><span class="chip">' + (r.words || 0) + ' so‘z</span><span class="chip">' + (r.wpm || 0) + ' so‘z/daq</span></div>' +
    '<details class="card tr" style="padding:12px 14px"><summary>' + ic('doc') + ' Siz aytgan matn</summary><p style="margin:10px 0 0;font:15px/1.6 Georgia,serif">' + esc(r.transcript || '') + '</p></details>' +
    (a.strengths && a.strengths.length ? '<h4>Kuchli tomonlar</h4><ul>' + a.strengths.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' : '') +
    (a.issues && a.issues.length ? '<h4>Tuzatish kerak</h4>' + a.issues.map(IE.issHTML).join('') : '') +
    (a.better ? '<h4>Namunaviy javob</h4><div class="essay card" style="padding:12px 14px"><p style="margin:0;font-size:15px">' + esc(a.better) + '</p></div><button class="chip" style="margin-top:8px" data-a="say" data-t="' + esc(a.better) + '">' + ic('spk') + ' Eshitish</button>' : '') +
    (a.next ? '<div class="tip8" style="margin-top:12px"><b>Keyingi qadam:</b> ' + esc(a.next) + '</div>' : '') +
    '<p class="hint" style="margin-top:10px">' + ic('bulb') + ' *Talaffuz ovozdan emas, matndan taxmin qilinadi. Baho taxminiy — rasmiy imtihon bahosi emas.</p></div>';
};
async function speakAI(kind) {
  const box = $('#sai'); let blob, q, part, secs, topic, store;
  if (kind === '1') { const s = V.s1, t = IE.D.prompts.sp1[s.i], key = s.i + ':' + s.q; blob = s.blobs && s.blobs[key]; q = t.q[s.q]; part = '1'; secs = (s.secs && s.secs[key]) || 15; topic = t.t; store = r => { s.ai[key] = r; }; }
  else if (kind === '3') { const s = V.s3, t = IE.D.prompts.sp2[s.i], key = s.i + ':' + s.q; blob = s.blobs && s.blobs[key]; q = t.f[s.q] + ' (follow-up to: ' + t.t + ')'; part = '3'; secs = (s.secs && s.secs[key]) || 30; topic = t.t.replace('Describe ', ''); store = r => { s.ai[key] = r; }; }
  else { const s = V.s2, t = IE.D.prompts.sp2[s.i]; blob = s.blob; q = t.t + ' You should say: ' + t.b.join('; '); part = '2'; secs = s.secsUsed || 90; topic = t.t.replace('Describe ', ''); store = r => { s.ai = r; }; }
  if (!blob || !box) return IE.toast('Avval javobingizni yozib oling');
  box.innerHTML = '<div class="card c"><div class="bub ai typing" style="margin:0 auto 8px;display:inline-flex"><i></i><i></i><i></i></div><p class="mu sm">AI nutqingizni tinglayapti… (15–40 soniya)</p></div>';
  try {
    const out = await call({ action: 'speaking', audio: await blobB64(blob), mime: blob.type || 'audio/webm', q, part, secs: Math.round(secs) });
    store(out); S().speaks.push({ ts: Date.now(), k: kind, t: topic, ai: { overall: out.result.overall, fc: out.result.fc, lr: out.result.lr, gra: out.result.gra, pr: out.result.pr } }); IE.touchDay(); IE.save(true);
    const b2 = $('#sai'); if (b2) b2.innerHTML = IE.speakHTML(out); if (out.result.overall >= (S().prof.target || 7)) IE.confetti();
  } catch (e) { const b2 = $('#sai'); if (b2) b2.innerHTML = '<div class="card c"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(e.message) + '</p><button class="btn sm" style="margin-top:8px" data-a="sp' + kind + 'ai">Qayta urinish</button></div>'; }
}
A.sp1ai = () => speakAI('1'); A.sp2ai = () => speakAI('2'); A.sp3ai = () => speakAI('3');
})();
