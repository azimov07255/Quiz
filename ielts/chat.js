/* IELTS · BY AZIMOV — AI Speaking Chat 2.0: rejimlar (Part 1/2/3, imtihon simulyatori, grammar coach, rol o‘yini), tezkor yordam,
   yakuniy hisobot, xatolar daftari, suhbatlar tarixi, so‘z bosib lug‘at, ovozli o‘qish, Part 2 taymeri. AI: Edge Function "ielts-ai" (action: chat). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, lsGet, lsSet } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V;
const CK = 'ielts:chat', MK = 'ielts:chatm', HK = 'ielts:chats', XK = 'ielts:cmist', RK = 'ielts:cread';
const MODES = {
  free: { n: 'Erkin suhbat', i: 'chat', d: 'Istalgan mavzu, har javobdan keyin tuzatish', role: '' },
  p1: { n: 'Part 1', i: 'mic', d: 'Qisqa kundalik savollar', role: 'Act as an IELTS Speaking Part 1 examiner: ask short everyday questions, ONE at a time, about 4 questions per topic, then move to a new topic.' },
  p2: { n: 'Part 2', i: 'doc', d: 'Cue card · 1–2 daqiqa gapirasiz', role: 'Act as an IELTS Speaking Part 2 examiner. Give ONE cue card: "Describe ..." followed by 4 bullet points (what / when or where / who / why). Then wait for my long answer. After my answer, ask one or two short rounding-off questions.' },
  p3: { n: 'Part 3', i: 'bulb', d: 'Chuqur muhokama savollari', role: 'Act as an IELTS Speaking Part 3 examiner: ask abstract, opinion-based discussion questions about ONE theme, ONE at a time, with natural follow-ups ("Why do you think so?", "How might this change in the future?").' },
  exam: { n: 'Imtihon simulyatori', i: 'trophy', d: 'Part 1→2→3, tuzatishsiz', role: 'Run a full IELTS Speaking test simulation as a strict but polite examiner: Part 1 (4 questions), Part 2 (one cue card), Part 3 (4 questions). Ask ONE question at a time. DO NOT include any "💡 Tuzatish" section and give no feedback until I ask for the final report.', nofix: true },
  gram: { n: 'Grammar coach', i: 'pen', d: 'Xatolar batafsil + qoida', role: 'Act as a strict grammar coach. For every message of mine list ALL grammar/word-choice mistakes (up to 4) in the "💡 Tuzatish:" section: corrected sentence + a one-line rule in Uzbek. Then ask a new question that practises the same grammar point.' },
  agent: { n: 'AI yordamchi', i: 'spark', d: 'Reja tuzadi, vazifa qo‘shadi', role: '', agent: true },
  role: { n: 'Hayotiy vaziyat', i: 'user', d: 'Mehmonxona, intervyu, do‘kon…', role: 'Role-play an everyday situation (pick one: hotel check-in, job interview, university enrolment, shop complaint). Stay in character as the other person, speak naturally in one or two sentences at a time and let me answer.' },
};
const QUICK = {
  hint: ['💡 Maslahat', 'Give me a short hint IN UZBEK (Latin) on how to answer your last question: 3 useful English phrases or ideas. Do not give the full answer. Do not add a "💡 Tuzatish" section.'],
  model: ['⭐ Namuna javob', 'Give a Band 8 model answer (about 60 words, natural spoken English) to your last question, then add a short Uzbek note naming 3 strong phrases from it. Then ask me the same question again so I can try. Do not add a "💡 Tuzatish" section.'],
  next: ['⏭ Keyingi savol', 'Skip this question and ask me a different one.'],
  fin: ['🏁 Tugatish va tahlil', 'The session is over. Write a final report IN UZBEK (Latin script), max 230 words, with short headed sections: 1) 📊 Estimated Speaking band range (Fluency, Vocabulary, Grammar). 2) ✅ 3 strengths. 3) ⚠️ Top 3 mistakes with corrections. 4) 📚 5 useful words/phrases to learn. 5) 🎯 One next step. Do not ask another question and do not add a "💡 Tuzatish" section.'],
};
const st = () => V.chat || (V.chat = Object.assign({ m: lsGet(CK, []), busy: false, topic: '', err: '', mode: 'free', fin: false, id: '', t0: 0 }, lsGet(MK, {})));
const persist = () => { const c = st(); lsSet(CK, c.m.slice(-60)); lsSet(MK, { mode: c.mode, topic: c.topic, fin: c.fin, id: c.id, t0: c.t0 }); };
const nl = t => t.replace(/\n/g, '<br>');
const words = t => { let o = '', last = 0; t.replace(/[A-Za-z][A-Za-z'’-]{2,}/g, (m, i) => { o += esc(t.slice(last, i)) + '<span class="cw" data-go="dict/' + encodeURIComponent(m.replace(/['’-]+$/, '')) + '">' + esc(m) + '</span>'; last = i + m.length; return m; }); return nl(o + esc(t.slice(last))); };
const reading = () => { try { return localStorage.getItem(RK) === '1'; } catch (e) { return false; } };

const bubble = m => {
  if (m.r === 'user') return m.hid ? '<div class="bub me sys">' + esc(m.c) + '</div>' : '<div class="bub me">' + nl(esc(m.c)) + '</div>';
  const parts = m.c.split(/💡\s*Tuzatish:?/), main = parts[0].trim(), note = (parts[1] || '').trim(), ag = !!(m.ag || m.loc);
  return '<div class="bub ai' + (m.rep ? ' rep' : '') + (ag ? ' ag' : '') + '">' + (ag ? nl(esc(main)) : words(main)) + (m.act && m.act.length && IE.agentCard ? IE.agentCard(m) : '') + (note ? '<div class="cnote"><b>Tuzatish</b>' + nl(esc(note)) + '</div>' : '') + '<button class="mini" data-a="say" data-t="' + esc(main) + '" aria-label="Eshitish">' + ic('spk') + '</button></div>';
};
const sessions = () => lsGet(HK, []);
const ago = ts => { const d = Math.floor((Date.now() - ts) / 864e5); return d <= 0 ? 'bugun' : d === 1 ? 'kecha' : d + ' kun oldin'; };
function emptyHTML() {
  const topics = IE.D.prompts.sp1.map(t => t.t), his = sessions().slice(0, 4);
  return '<div class="card c" style="padding:20px 16px">' + bd('spark', 'A', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<h3 style="font-size:19px">Salom! Inglizcha gaplashamiz</h3><p class="mu sm" style="margin:6px 0 14px">Rejimni tanlang. AI savol beradi, siz javob berasiz — xatolaringiz o‘zbekcha tushuntiriladi va “Xatolar daftari”ga yig‘iladi.</p><button class="btn block" data-a="cstart" data-t="">' + ic('chat') + ' Erkin suhbatni boshlash</button></div>' +
    '<button class="aibn rise" style="margin-top:12px" data-a="cmode" data-m="agent">' + bd('sparkl', 'A', 'lg') + '<div style="flex:1"><h3>AI yordamchi</h3><p>“2 haftalik reja tuz” — AI tuzadi, siz tasdiqlaysiz. Vazifa va so‘z ham qo‘sha oladi.</p></div><span class="go">' + ic('next') + '</span></button>' +
    '<div class="sec"><h2>Imtihon rejimlari</h2></div><div class="cmodes">' + ['p1', 'p2', 'p3', 'exam', 'gram', 'role'].map(k => '<button class="cmode' + (k === 'exam' ? ' hot' : '') + '" data-a="cmode" data-m="' + k + '">' + bd(MODES[k].i, k === 'exam' ? 'M' : k === 'gram' ? 'W' : k === 'p2' ? 'R' : k === 'p3' ? 'T' : k === 'role' ? 'S' : 'L', 'sm') + '<b>' + MODES[k].n + '</b><span>' + MODES[k].d + '</span></button>').join('') + '</div>' +
    '<div class="sec"><h2>Yoki mavzu tanlang</h2></div><div class="seg wrap">' + topics.map(t => '<button data-a="cstart" data-t="' + esc(t) + '">' + esc(t) + '</button>').join('') + '</div>' +
    (his.length ? '<div class="sec"><h2>Oldingi suhbatlar</h2></div>' + his.map((h, i) => '<button class="item" data-a="copen" data-i="' + i + '">' + bd(MODES[h.mode] ? MODES[h.mode].i : 'chat', 'S', 'sm') + '<div class="tx"><b>' + esc((MODES[h.mode] || MODES.free).n + (h.topic ? ' · ' + h.topic : '')) + '</b><span>' + h.n + ' ta javob · ' + ago(h.ts) + (h.rep ? ' · hisobot bor' : '') + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') : '');
}
const msgsHTML = () => {
  const c = st(); if (!c.m.length) return emptyHTML() + (c.busy ? '<div class="bub ai typing"><i></i><i></i><i></i></div>' : '');
  return c.m.map(bubble).join('') + (c.busy ? '<div class="bub ai typing"><i></i><i></i><i></i></div>' : '') + (c.err ? '<div class="card c" style="margin-bottom:10px"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(c.err) + '</p><button class="btn sm" style="margin-top:8px" data-a="cretry">Qayta urinish</button></div>' : '') +
    (c.fin && !c.busy ? '<div class="card c rise" style="margin:6px 0 14px"><b>Suhbat yakunlandi 🎉</b><div class="sm mu" style="margin:4px 0 10px">Hisobot “Oldingi suhbatlar”da saqlandi.</div><button class="btn sm" data-a="cnew2">Yangi suhbat</button></div>' : '');
};
const AGQ = [['📅 2 haftalik reja', 'Menga bugundan boshlab 14 kunlik reja tuz.'], ['🎯 Zaif tomonimga', 'Eng zaif ko‘nikmamga e’tibor qaratib, 7 kunlik reja tuz.'], ['➕ Bugunga vazifa', 'Bugunga 2 ta qo‘shimcha vazifa qo‘sh.'], ['📚 10 ta so‘z', 'Writing uchun 10 ta academic so‘z qo‘sh.'], ['😴 Ertaga dam', 'Ertangi kunni dam olish kuni qil.'], ['🏁 Imtihon rejasi', 'Imtihon sanamga qarab to‘liq tayyorgarlik rejasi tuz.']];
const quickHTML = () => { const c = st(); if (!c.m.length || c.fin) return ''; if (c.mode === 'agent') return '<div class="cq" id="cq">' + AGQ.map(q => '<button class="chip" data-a="cag" data-p="' + esc(q[1]) + '"' + (c.busy ? ' disabled' : '') + '>' + q[0] + '</button>').join('') + '</div>'; const tm = c.mode === 'p2' || c.mode === 'exam'; return '<div class="cq" id="cq"><button class="chip" data-a="cq" data-k="hint"' + (c.busy ? ' disabled' : '') + '>💡 Maslahat</button><button class="chip" data-a="cq" data-k="model"' + (c.busy ? ' disabled' : '') + '>⭐ Namuna javob</button><button class="chip" data-a="cq" data-k="next"' + (c.busy ? ' disabled' : '') + '>⏭ Keyingi</button>' + (tm ? '<button class="chip" data-a="ctimer">⏱ Part 2 taymer</button>' : '') + '<button class="chip hot" data-a="cq" data-k="fin"' + (c.busy ? ' disabled' : '') + '>🏁 Tugatish</button></div>'; };
const paint = () => {
  const m = $('#cmsgs'); if (!m || location.hash !== '#/chat') return; const c = st();
  m.innerHTML = msgsHTML(); const q = $('#cqw'); if (q) q.innerHTML = quickHTML(); const b = $('.cin .send'), n = $('#cnewb'); if (b) b.disabled = c.busy; if (n) n.classList.toggle('hide', !c.m.length);
  const sub = $('#csub'); if (sub) sub.textContent = 'AI repetitor' + (c.m.length ? ' · ' + (MODES[c.mode] || MODES.free).n : '');
  m.scrollTo({ top: c.m.length ? m.scrollHeight : 0, behavior: 'smooth' });
};
R.chat = () => {
  const c = st(), SR = window.SpeechRecognition || window.webkitSpeechRecognition, nm = lsGet(XK, []).length;
  const o = { h: '<div class="chat"><div class="chead"><div><div class="hi" id="csub">AI repetitor' + (c.m.length ? ' · ' + (MODES[c.mode] || MODES.free).n : '') + '</div><h1>Speaking Chat</h1></div><div class="row" style="gap:8px"><button class="ib w' + (reading() ? ' act' : '') + '" id="cread" data-a="cread" aria-label="Ovozli o‘qish">' + ic('spk') + '</button><button class="ib w" data-go="cmist" aria-label="Xatolar daftari" style="position:relative">' + ic('cards') + (nm ? '<i class="cbadge">' + (nm > 99 ? '99+' : nm) + '</i>' : '') + '</button><button class="ib w' + (c.m.length ? '' : ' hide') + '" id="cnewb" data-a="cnew" aria-label="Yangi suhbat">' + ic('back2') + '</button></div></div>' +
    '<div class="cmsgs" id="cmsgs">' + msgsHTML() + '</div><div id="cqw">' + quickHTML() + '</div><div id="ctw"></div>' +
    '<div class="cin"><textarea id="ci" rows="1" placeholder="' + (c.mode === 'agent' ? 'AI ga yozing: “2 haftalik reja tuz”…' : 'Inglizcha javob yozing…') + '" enterkeyhint="send"></textarea>' + (SR ? '<button class="ib" id="cm" data-a="cmic" aria-label="Ovoz bilan">' + ic('mic') + '</button>' : '') + '<button class="ib send" data-a="csend" aria-label="Yuborish"' + (c.busy ? ' disabled' : '') + '>' + ic('next') + '</button></div></div>' +
    '<nav class="nav">' + [['home', 'home', 'Home'], ['practice', 'target', 'Practice'], ['chat', 'chat', 'Chat'], ['tools', 'grid', 'Tools'], ['me', 'user', 'Profil']].map(t => '<button class="' + (t[0] === 'chat' ? 'on' : '') + '" data-go="' + t[0] + '">' + ic(t[1]) + '<span>' + t[2] + '</span></button>').join('') + '</nav>', tab: 'chat' };
  o.mount = () => { const m = $('#cmsgs'); if (m) m.scrollTop = c.m.length ? m.scrollHeight : 0; if (V.chatAuto) { const t = V.chatAuto.text; V.chatAuto = null; setTimeout(() => openAgent(t), 30); } };
  return o;
};
/** Server uchun xabarlar: oxirgi foydalanuvchi xabariga rol ko‘rsatmasi qo‘shiladi. */
function payload(c) {
  const role = (MODES[c.mode] || MODES.free).role, ms = c.m.filter(x => !x.loc).slice(-10).map(x => ({ role: x.r === 'user' ? 'user' : 'assistant', content: x.hid || x.c }));
  if (role && ms.length) { const l = ms[ms.length - 1]; if (l.role === 'user') l.content = '[TUTOR ROLE: ' + role + ']\n' + l.content; }
  return ms;
}
async function send(text, o) {
  const c = st(); if (c.busy) return; o = o || {};
  if (!c.id) { c.id = Date.now().toString(36); c.t0 = Date.now(); }
  if (text) c.m.push(o.hid ? { r: 'user', c: text, hid: o.hid } : { r: 'user', c: text });
  c.busy = true; c.err = ''; persist(); paint();
  try {
    if (c.mode === 'agent') {
      const ag = await IE.agentAsk(c.m); c.m.push({ r: 'ai', c: ag.reply, id: uid(), act: ag.acts, ag: 1 }); IE.touchDay(); IE.save(); if (reading()) IE.say(ag.reply.replace(/[*#_]/g, '').trim());
      c.busy = false; persist(); paint(); return;
    }
    const out = await IE.ai({ action: 'chat', topic: c.topic, messages: payload(c) });
    const rep = !!(o.hid && o.fin), m = { r: 'ai', c: out.reply }; if (rep) { m.rep = 1; c.fin = true; }
    c.m.push(m); IE.touchDay(); IE.save();
    const nt = /💡\s*Tuzatish:?([\s\S]*)$/.exec(out.reply);
    if (nt && !rep && nt[1].trim().length > 8) { const ls = lsGet(XK, []), q = (c.m.slice().reverse().find(x => x.r === 'user' && !x.hid) || {}).c || ''; ls.unshift({ ts: Date.now(), q: q.slice(0, 160), n: nt[1].trim().slice(0, 500) }); lsSet(XK, ls.slice(0, 120)); }
    if (rep) saveSession();
    if (reading()) IE.say(out.reply.split(/💡/)[0].replace(/[*#_]/g, '').trim());
  } catch (e) { c.err = e.message; }
  c.busy = false; persist(); paint();
}
const uid = () => 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 5);
function saveSession() {
  const c = st(), n = c.m.filter(x => x.r === 'user' && !x.hid).length; if (n < 2 && !c.fin) return;
  const l = sessions().filter(x => x.id !== c.id); l.unshift({ id: c.id || Date.now().toString(36), ts: Date.now(), mode: c.mode, topic: c.topic, n, rep: c.fin ? 1 : 0, m: c.m.slice(-60) }); lsSet(HK, l.slice(0, 12));
}
const reset = (mode, topic) => { const c = st(); saveSession(); V.chat = { m: [], busy: false, topic: topic || '', err: '', mode: mode || 'free', fin: false, id: Date.now().toString(36), t0: Date.now() }; persist(); return V.chat; };
A.csend = () => { const ta = $('#ci'), t = ta ? ta.value.trim() : ''; if (!t || st().busy) return; ta.value = ''; ta.style.height = ''; if (V.sr) { try { V.sr.stop(); } catch (e) { /* */ } } send(t); };
A.cstart = el => { const t = el.dataset.t || ''; reset('free', t); const n = $('#cnewb'); if (n) n.classList.remove('hide'); send(t ? 'Let’s talk about: ' + t + '.' : '', t ? {} : { hid: 'Hi! Please start a friendly English conversation and ask me the first question.' }); };
A.cmode = el => { const k = el.dataset.m; if (k === 'agent') return openAgent(''); reset(k, ''); const n = $('#cnewb'); if (n) n.classList.remove('hide'); send('Boshladik 🚀', { hid: 'Start now. ' + (k === 'exam' ? 'Greet me briefly as the examiner and begin Part 1.' : 'Begin.') }); };
A.cq = el => { const k = el.dataset.k, q = QUICK[k]; if (!q || st().busy) return; if (k === 'fin' && st().m.filter(x => x.r === 'user' && !x.hid).length < 2) return IE.toast('Avval kamida 2 ta javob bering'); send(q[0], { hid: q[1], fin: k === 'fin' }); };
A.cretry = () => send('');
const INTRO = 'Salom! Men AI yordamchiman 🤖\n\nReja tuzaman, vazifa va so‘z qo‘shaman, imtihon sanangiz va maqsadingizni sozlayman. Siz tasdiqlamaguncha hech narsa o‘zgarmaydi.\n\nMasalan: “2 haftalik reja tuz”, “Ertaga dam kuni qil”, “Listening’ni kuchaytiradigan reja”, “Writing uchun 10 ta so‘z qo‘sh”.';
function openAgent(text) { reset('agent', ''); const c = st(); c.m.push({ r: 'ai', c: INTRO, loc: 1, ag: 1, id: uid() }); persist(); const n = $('#cnewb'); if (n) n.classList.remove('hide'); paint(); if (text) send(text); }
IE.chatOpen = (mode, text) => { if (mode === 'agent') { V.chatAuto = { text: text || '' }; IE.go('chat'); } else IE.go('chat'); };
IE.chatSave = () => { persist(); paint(); };
A.cag = el => { if (!st().busy) send(el.dataset.p || ''); };
A.cnew = () => IE.ask('Yangi suhbat?', 'Joriy suhbat tarixga saqlanadi.', 'Boshlash', () => { reset('free', ''); paint(); });
A.cnew2 = () => { reset('free', ''); paint(); };
A.copen = el => { const h = sessions()[+el.dataset.i]; if (!h) return; saveSession(); V.chat = { m: h.m, busy: false, topic: h.topic || '', err: '', mode: h.mode || 'free', fin: !!h.rep, id: h.id, t0: h.ts }; persist(); IE.draw(false); };
A.cread = el => { const on = !reading(); try { localStorage.setItem(RK, on ? '1' : '0'); } catch (e) { /* */ } el.classList.toggle('act', on); IE.toast(on ? 'AI javoblari ovoz chiqarib o‘qiladi' : 'Ovozli o‘qish o‘chirildi'); if (!on) { try { speechSynthesis.cancel(); } catch (e) { /* */ } } };
A.cmic = () => {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition, btn = $('#cm'), ta = $('#ci'); if (!SR) return IE.toast('Bu brauzerda ovozni matnga aylantirish yo‘q');
  if (V.sr) { try { V.sr.stop(); } catch (e) { /* */ } return; }
  const r = new SR(); r.lang = 'en-GB'; r.interimResults = true; r.continuous = false;
  r.onresult = e => { if (ta) ta.value = [...e.results].map(x => x[0].transcript).join(' '); };
  r.onend = () => { V.sr = null; if (btn) btn.classList.remove('rec-on'); }; r.onerror = e => { V.sr = null; if (btn) btn.classList.remove('rec-on'); IE.toast(e.error === 'not-allowed' ? 'Mikrofonga ruxsat berilmadi' : 'Ovoz tanilmadi'); };
  try { r.start(); V.sr = r; if (btn) btn.classList.add('rec-on'); } catch (e) { IE.toast('Ovoz yozib bo‘lmadi'); }
};
/* Part 2 taymeri: 1 daqiqa tayyorgarlik → 2 daqiqa gapirish */
A.ctimer = () => {
  const w = $('#ctw'); if (!w) return; IE.clearTimers(); let ph = 'prep', t = 60;
  const paintT = () => { w.innerHTML = '<div class="ctimer ' + ph + '"><span>' + (ph === 'prep' ? 'Tayyorgarlik' : 'Gapiring!') + '</span><b>' + String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0') + '</b><button class="ib sm2" data-a="ctstop" aria-label="To‘xtatish">' + ic('x') + '</button></div>'; };
  paintT(); IE.every(1000, () => { t--; if (t <= 0) { if (ph === 'prep') { ph = 'talk'; t = 120; IE.vib([120, 60, 120]); } else { IE.clearTimers(); w.innerHTML = '<div class="ctimer done"><span>Vaqt tugadi — endi javobingizni yozing/ayting</span></div>'; IE.vib([200, 80, 200]); return; } } paintT(); });
};
A.ctstop = () => { IE.clearTimers(); const w = $('#ctw'); if (w) w.innerHTML = ''; };

/* ---------- Xatolar daftari ---------- */
R.cmist = () => {
  const ls = lsGet(XK, []);
  const body = ls.length ? '<div class="pad"><p class="mu sm" style="margin:0 0 12px">Chatdagi AI tuzatishlaringiz shu yerda yig‘iladi. Muntazam qayta o‘qib chiqing — bir xil xatolarni takrorlamaslik uchun.</p>' + ls.map((x, i) => '<div class="card mist rise"><div class="mu xs b" style="letter-spacing:.06em;text-transform:uppercase">' + new Date(x.ts).toLocaleDateString('uz') + (x.q ? ' · sizning gapingiz' : '') + '</div>' + (x.q ? '<div class="mq">“' + esc(x.q) + '”</div>' : '') + '<div class="cnote" style="margin-top:8px"><b>Tuzatish</b>' + nl(esc(x.n)) + '</div><div class="row" style="justify-content:flex-end;margin-top:6px"><button class="chip" data-a="cmdel" data-i="' + i + '">' + ic('trash') + ' O‘chirish</button></div></div>').join('') + '</div>'
    : '<div class="pad"><div class="card empty">' + bd('cards', 'A') + 'Hali tuzatishlar yo‘q.<br>Chatda gaplashing — AI xatolaringizni shu yerga yig‘adi.<br><button class="btn sm" style="margin-top:12px" data-go="chat">Chatni ochish</button></div></div>';
  return IE.sub('Xatolar daftari', 'chat', body, ls.length ? '<button class="ib" data-a="cmclr" aria-label="Hammasini tozalash">' + ic('trash') + '</button>' : '');
};
A.cmdel = el => { const ls = lsGet(XK, []); ls.splice(+el.dataset.i, 1); lsSet(XK, ls); IE.draw(false); };
A.cmclr = () => IE.ask('Daftar tozalansinmi?', 'Hamma yig‘ilgan tuzatishlar o‘chadi.', 'Tozalash', () => { lsSet(XK, []); IE.draw(false); });
IE.chatMist = () => lsGet(XK, []).length;
})();
