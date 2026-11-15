/* IELTS · BY AZIMOV — AI qismi: Speaking Chat, Writing bahosi, Dictionary (Edge Function "ielts-ai" orqali; kalitlar serverda). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V;
const call = async body => { try { return await SB.fn('ielts-ai', body); } catch (e) { throw new Error(e.net ? 'Internetga ulanib bo‘lmadi.' : (e.message || 'AI xatosi')); } };
IE.ai = call;
const nl = t => t.replace(/\n/g, '<br>');
const bottom = () => setTimeout(() => window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }), 40);

/* ---------- Speaking Chat ---------- */
const CK = 'ielts:chat';
const st = () => V.chat || (V.chat = { m: lsGet(CK, []), busy: false, topic: '', err: '' });
const persist = () => lsSet(CK, st().m.slice(-40));
const bubble = m => {
  if (m.r === 'user') return '<div class="bub me">' + nl(esc(m.c)) + '</div>';
  const parts = m.c.split(/💡\s*Tuzatish:?/), main = parts[0].trim(), note = (parts[1] || '').trim();
  return '<div class="bub ai">' + nl(esc(main)) + (note ? '<div class="cnote"><b>Tuzatish</b>' + nl(esc(note)) + '</div>' : '') + '<button class="mini" data-a="say" data-t="' + esc(main) + '" aria-label="Eshitish">' + ic('spk') + '</button></div>';
};
R.chat = () => {
  const c = st(), empty = !c.m.length, topics = IE.D.prompts.sp1.map(t => t.t);
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const body = empty
    ? '<div class="card c" style="padding:22px 16px">' + bd('spark', 'A', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<h3 style="font-size:19px">Salom! Inglizcha gaplashamiz</h3><p class="mu sm" style="margin:6px 0 14px">AI savol beradi, siz javob berasiz. Har javobdan keyin xatolaringiz o‘zbekcha tushuntiriladi.</p><button class="btn block" data-a="cstart" data-t="">' + ic('play') + ' Suhbatni boshlash</button></div>' +
      '<div class="sec"><h2>Yoki mavzu tanlang</h2></div><div class="seg" style="flex-wrap:wrap;overflow:visible">' + topics.map(t => '<button data-a="cstart" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>'
    : c.m.map(bubble).join('') + (c.busy ? '<div class="bub ai typing"><i></i><i></i><i></i></div>' : '') + (c.err ? '<div class="card c" style="margin-bottom:10px"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(c.err) + '</p><button class="btn sm" style="margin-top:8px" data-a="cretry">Qayta urinish</button></div>' : '');
  const inner = '<div class="hero" style="padding-bottom:34px"><div class="row"><div><div class="hi">AI repetitor</div><h1>Speaking Chat</h1></div>' + (empty ? '' : '<button class="ib w" data-a="cnew" aria-label="Yangi suhbat">' + ic('back2') + '</button>') + '</div></div>' +
    '<div class="pad" style="margin-top:-12px;position:relative;padding-bottom:150px">' + body + '</div>' +
    '<div class="cin"><textarea id="ci" rows="1" placeholder="Inglizcha javob yozing…"' + (c.busy ? ' disabled' : '') + '></textarea>' + (SR ? '<button class="ib" id="cm" data-a="cmic" aria-label="Ovoz bilan">' + ic('mic') + '</button>' : '') + '<button class="ib send" data-a="csend" aria-label="Yuborish"' + (c.busy ? ' disabled' : '') + '>' + ic('next') + '</button></div>';
  const o = { h: '<div class="scr">' + inner + '</div><nav class="nav">' + [['home', 'home', 'Home'], ['practice', 'target', 'Practice'], ['chat', 'chat', 'Chat'], ['tools', 'grid', 'Tools'], ['me', 'user', 'Profil']].map(t => '<button class="' + (t[0] === 'chat' ? 'on' : '') + '" data-go="' + t[0] + '">' + ic(t[1]) + '<span>' + t[2] + '</span></button>').join('') + '</nav>', tab: 'chat' };
  return o;
};
async function send(text, retry) {
  const c = st(); if (c.busy) return;
  if (text) c.m.push({ r: 'user', c: text });
  c.busy = true; c.err = ''; persist(); IE.draw(false); bottom();
  try {
    const out = await call({ action: 'chat', topic: c.topic, messages: c.m.slice(-10).map(x => ({ role: x.r === 'user' ? 'user' : 'assistant', content: x.c })) });
    c.m.push({ r: 'ai', c: out.reply }); IE.touchDay(); IE.save();
  } catch (e) { c.err = e.message; }
  c.busy = false; persist();
  if (location.hash === '#/chat') { IE.draw(false); bottom(); }
}
A.csend = () => { const ta = $('#ci'), t = ta ? ta.value.trim() : ''; if (!t) return; if (V.sr) { try { V.sr.stop(); } catch (e) { /* */ } } send(t); };
A.cstart = el => { const c = st(); c.topic = el.dataset.t || ''; c.m = []; send(c.topic ? 'Let’s talk about: ' + c.topic + '.' : ''); };
A.cretry = () => send('', true);
A.cnew = () => IE.ask('Yangi suhbat?', 'Joriy suhbat tozalanadi.', 'Boshlash', () => { V.chat = { m: [], busy: false, topic: '', err: '' }; persist(); IE.draw(false); });
A.cmic = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, btn = $('#cm'), ta = $('#ci'); if (!SR) return IE.toast('Bu brauzerda ovozni matnga aylantirish yo‘q');
  if (V.sr) { try { V.sr.stop(); } catch (e) { /* */ } return; }
  const r = new SR(); r.lang = 'en-GB'; r.interimResults = true; r.continuous = false;
  r.onresult = e => { if (ta) ta.value = [...e.results].map(x => x[0].transcript).join(' '); };
  r.onend = () => { V.sr = null; if (btn) btn.classList.remove('rec-on'); }; r.onerror = e => { V.sr = null; if (btn) btn.classList.remove('rec-on'); IE.toast(e.error === 'not-allowed' ? 'Mikrofonga ruxsat berilmadi' : 'Ovoz tanilmadi'); };
  try { r.start(); V.sr = r; if (btn) btn.classList.add('rec-on'); } catch (e) { IE.toast('Ovoz yozib bo‘lmadi'); }
};
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter' || e.shiftKey || e.isComposing) return;
  if (e.target.id === 'ci') { e.preventDefault(); A.csend(); } else if (e.target.id === 'dq') { e.preventDefault(); A.dsearch(); }
});

/* ---------- Writing: AI bahosi ---------- */
IE.aiHTML = a => {
  const sc = (k, v, big) => '<div class="sc' + (big ? ' big' : '') + '"><b>' + IE.bandTxt(v) + '</b><span>' + k + '</span></div>';
  return '<div class="airs"><div class="scs">' + sc('Task Response', a.tr) + sc('Coherence', a.cc) + sc('Lexical', a.lr) + sc('Grammar', a.gra) + '</div><div class="sc big all"><b>' + IE.bandTxt(a.overall) + '</b><span>Taxminiy overall band</span></div>' +
    (a.strengths && a.strengths.length ? '<h4>Kuchli tomonlar</h4><ul>' + a.strengths.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul>' : '') +
    (a.issues && a.issues.length ? '<h4>Tuzatish kerak</h4>' + a.issues.map(i => '<div class="iss"><div class="was">' + esc(i.quote) + '</div><div class="now">' + esc(i.fix) + '</div><div class="why2">' + esc(i.why) + '</div></div>').join('') : '') +
    (a.upgrade ? '<h4>Kuchaytirilgan variant</h4><div class="essay card" style="padding:12px 14px"><p style="margin:0;font-size:15px">' + esc(a.upgrade) + '</p></div>' : '') +
    (a.next ? '<div class="tip8" style="margin-top:12px"><b>Keyingi qadam:</b> ' + esc(a.next) + '</div>' : '') + '<p class="hint" style="margin-top:10px">' + ic('bulb') + ' AI bahosi taxminiy — rasmiy imtihon bahosi emas.</p></div>';
};
A.wai = async el => {
  const ts = +el.dataset.ts, rec = S().writes.find(w => w.ts === ts), box = $('#aires'); if (!rec || !box) return;
  box.innerHTML = '<div class="card c"><div class="bub ai typing" style="margin:0 auto 8px;display:inline-flex"><i></i><i></i><i></i></div><p class="mu sm">AI inshoni o‘qiyapti… (10–20 soniya)</p></div>';
  try {
    const out = await call({ action: 'writing', prompt: IE.wprompt(rec.p), text: rec.x });
    rec.ai = out.result; IE.save(true);
    const b = $('#aires'); if (b) b.innerHTML = IE.aiHTML(rec.ai);
    if (rec.ai.overall >= (S().prof.target || 7)) IE.confetti();
  } catch (e) { const b = $('#aires'); if (b) b.innerHTML = '<div class="card c"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(e.message) + '</p><button class="btn sm" style="margin-top:8px" data-a="wai" data-ts="' + ts + '">Qayta urinish</button></div>'; }
};

/* ---------- Dictionary ---------- */
R.dict = () => {
  const d = V.dict || (V.dict = { q: '', res: null, busy: false, err: '' }), r = d.res;
  const my = r && S().my.some(x => x.id === 'my:' + String(r.w).toLowerCase());
  const o = { h: '<header class="top"><button class="ib" data-go="tools" aria-label="Orqaga">' + ic('back') + '</button><h1>Dictionary</h1></header><div class="scr sub"><div class="pad"><div class="row" style="gap:8px"><input class="search" id="dq" style="margin:0" placeholder="Inglizcha so‘z yoki ibora…" value="' + esc(d.q) + '" autocapitalize="off" spellcheck="false"><button class="btn" style="min-width:56px;padding:0 16px" data-a="dsearch" aria-label="Qidirish">' + ic('search') + '</button></div>' +
    (d.busy ? '<div class="card c" style="margin-top:14px"><div class="bub ai typing" style="margin:0 auto;display:inline-flex"><i></i><i></i><i></i></div></div>' : '') +
    (d.err ? '<div class="card c" style="margin-top:14px"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(d.err) + '</p></div>' : '') +
    (r ? '<div class="card" style="margin-top:14px"><div class="row"><div style="flex:1"><div style="font-size:26px;font-weight:900">' + esc(r.w) + '</div><div class="mu sm">' + esc(r.pos || '') + (r.ipa ? ' · ' + esc(r.ipa) : '') + '</div></div><button class="ib" data-a="say" data-t="' + esc(r.w) + '" aria-label="Eshitish">' + ic('spk') + '</button></div>' +
      '<div style="margin-top:12px;font-size:18px;font-weight:800;color:var(--pl)">' + esc(r.uz) + '</div><p class="sm" style="margin-top:6px;line-height:1.5">' + esc(r.def || '') + '</p>' +
      (r.ex && r.ex.length ? '<h4 class="dh">Misollar</h4>' + r.ex.map(x => '<p class="exs">“' + esc(x) + '”</p>').join('') : '') +
      (r.syn && r.syn.length ? '<h4 class="dh">Sinonimlar</h4><div style="display:flex;gap:6px;flex-wrap:wrap">' + r.syn.map(x => '<span class="chip">' + esc(x) + '</span>').join('') + '</div>' : '') +
      (r.note ? '<div class="tip8" style="margin-top:12px">' + esc(r.note) + '</div>' : '') +
      '<button class="btn block' + (my ? ' ghost' : '') + '" style="margin-top:14px"' + (my ? ' disabled' : ' data-a="dadd"') + '>' + (my ? ic('check') + ' Lug‘atingizda bor' : ic('star') + ' Mening so‘zlarimga qo‘shish') + '</button></div>' : '') +
    (!r && !d.busy && !d.err ? '<div class="empty">' + bd('search', 'A') + 'Istalgan so‘zni yozing — ma’nosi, misollari va sinonimlari chiqadi.</div>' : '') + '</div></div>', sub: true };
  return o;
};
A.dsearch = async () => {
  const inp = $('#dq'), d = V.dict || (V.dict = {}), w = inp ? inp.value.trim() : ''; if (!w || d.busy) return;
  d.q = w; d.busy = true; d.err = ''; d.res = null; IE.draw(false);
  try { d.res = (await call({ action: 'dict', word: w })).result; if (d.res && !d.res.w) d.res.w = w; IE.touchDay(); IE.save(); } catch (e) { d.err = e.message; }
  d.busy = false; if (location.hash === '#/dict') IE.draw(false);
};
A.dadd = () => {
  const r = V.dict && V.dict.res; if (!r) return;
  const id = 'my:' + String(r.w).toLowerCase(); if (!S().my.some(x => x.id === id)) { S().my.push({ id, w: r.w, uz: r.uz, def: r.def, ex: (r.ex || [])[0] || '', pos: r.pos || '', ts: Date.now() }); IE.save(); IE.toast('Qo‘shildi'); IE.draw(false); }
};
})();
