/* IELTS · BY AZIMOV — AI agent: reja tuzadi, vazifa / so‘z qo‘shadi, profil sozlamalarini o‘zgartiradi.
   AI faqat TAKLIF beradi (Edge Function "ielts-agent"); ilova har amalni tekshiradi, foydalanuvchi “Qo‘llash”ni bosgachgina bajaradi. Bekor qilish (undo) bor. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd } = IE, S = () => IE.S(), A = IE.act, V = IE.V, R = IE.routes;
const ROUTES = new Set(['reading', 'listening', 'writing', 'speaking', 'vocab', 'vocab/review', 'typing', 'dict', 'chat', 'shadow', 'dictation', 'articles', 'articles/tab/p', 'mock', 'ana', 'practice', 'books', 'cambridge', 'plan', 'focus']);
const LV = ['A2', 'B1', 'B2', 'C1'];
const WE = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'], WU = ['Yakshanba', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];
const MO = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr'];
const parse = k => new Date(k + 'T00:00:00'), dk = t => IE.dayKey(t), addD = (k, n) => { const d = parse(k); d.setDate(d.getDate() + n); return dk(d.getTime()); };
const today = () => dk();
const okDate = d => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(parse(d).getTime()) && d >= today() && d <= addD(today(), 90);
const dayTxt = k => { const d = parse(k); return WU[d.getDay()] + ', ' + d.getDate() + '-' + MO[d.getMonth()]; };
const str = (x, n) => String(x == null ? '' : x).replace(/\s+/g, ' ').trim().slice(0, n);

/** AI taklif qilgan amallarni tekshiradi va tozalaydi (noma’lum yoki xavfli narsa tashlab yuboriladi). */
IE.agentValidate = list => {
  const out = []; if (!Array.isArray(list)) return out;
  list.slice(0, 60).forEach(a => {
    if (!a || typeof a !== 'object') return;
    if (a.type === 'add_task') { const t = str(a.title, 80), m = Math.round(+a.mins); if (okDate(a.date) && t.length >= 2 && m >= 5 && m <= 240) out.push({ type: 'add_task', date: a.date, title: t, mins: m, go: ROUTES.has(a.go) ? a.go : '' }); }
    else if (a.type === 'rest_day') { if (okDate(a.date)) out.push({ type: 'rest_day', date: a.date, on: a.on !== false }); }
    else if (a.type === 'clear_tasks') { const f = okDate(a.from) ? a.from : null, t = okDate(a.to) ? a.to : null; if (f && t && t >= f) out.push({ type: 'clear_tasks', from: f, to: t }); }
    else if (a.type === 'set_profile') {
      const o = { type: 'set_profile' }; const tg = +a.target, mn = Math.round(+a.mins);
      if (tg >= 5 && tg <= 9) o.target = Math.round(tg * 2) / 2; if (okDate(a.date)) o.date = a.date; if (mn >= 20 && mn <= 720) o.mins = mn; if (LV.includes(a.level)) o.level = a.level; if (/^([01]?\d|2[0-3]):[0-5]\d$/.test(String(a.start || ''))) o.start = String(a.start).padStart(5, '0');
      if (Object.keys(o).length > 1) out.push(o);
    } else if (a.type === 'add_words') {
      const ws = (Array.isArray(a.words) ? a.words : []).slice(0, 15).map(w => ({ w: str(w && w.w, 40), uz: str(w && w.uz, 80), def: str(w && w.def, 160), ex: str(w && w.ex, 200) })).filter(w => /^[A-Za-z][A-Za-z' -]{1,38}$/.test(w.w));
      if (ws.length) out.push({ type: 'add_words', words: ws });
    } else if (a.type === 'navigate') { if (ROUTES.has(a.route)) out.push({ type: 'navigate', route: a.route }); }
  });
  return out;
};

/** AI uchun kontekst. */
IE.agentCtx = () => {
  const s = S(), p = s.prof, k = today(), dl = p.date ? Math.ceil((parse(p.date) - parse(k)) / 864e5) : null, b = IE.skillBands(), ws = Object.entries(b).filter(([, v]) => v != null).sort((x, y) => x[1] - y[1]);
  const plan = Array.from({ length: 8 }, (_, i) => addD(k, i)).map(d => { const x = IE.planDay ? IE.planDay(d) : { rest: false, tasks: [] }; return { date: d, weekday: WE[parse(d).getDay()], rest: x.rest, tasks: x.tasks.slice(0, 6).map(t => t.t + ' (' + t.m + ')' + (t.ai ? ' [AI]' : '')) }; });
  const wk0 = IE.weekStats ? IE.weekStats(0) : null, wp = IE.weekStats ? IE.weekStats(-1) : null, fc = IE.forecast ? IE.forecast() : null, wr = s.writes.filter(w => w.ai && typeof w.ai.overall === 'number').slice(-3).map(w => ({ o: w.ai.overall, tr: w.ai.tr, cc: w.ai.cc, lr: w.ai.lr, gra: w.ai.gra }));
  const doneDays = Array.from({ length: 7 }, (_, i) => addD(k, -i)).filter(d => s.pdone[d] && s.pdone[d]._).length;
  return { today: k, weekday: WE[parse(k).getDay()], exam: p.date || null, daysLeft: dl, target: +p.target || 7, level: p.level || null, dailyMins: +p.mins || 60, start: p.start || '19:00', bands: { L: b.L, R: b.R, W: b.W, S: b.S }, weakest: ws[0] ? ws[0][0] : null, counts: { reading: s.reads.length, listening: s.listens.length, writing: s.writes.length, speaking: s.speaks.length, mocks: s.mocks.length, words: Object.keys(s.srs).length }, week: wk0 ? { activeDays: wk0.act, tests: wk0.tests, focusMin: wk0.foc, vocabReviews: wk0.t.V, avgBand: wk0.avg, prev: { activeDays: wp.act, tests: wp.tests, focusMin: wp.foc, avgBand: wp.avg } } : null, trend: fc ? { slopePerWeek: fc.slopeW, predicted: fc.pred } : null, planDoneDays7: doneDays, writingRecent: wr, streak: IE.streak(), dueWords: IE.dueCount ? IE.dueCount() : 0, bank: IE.bankStats ? (() => { const b = IE.bankStats(); return { active: b.active, due: b.due, mastered: b.mastered, weakTypes: b.types }; })() : null, plan };
};
IE.agentAsk = async msgs => {
  const hist = msgs.filter(x => !x.loc).slice(-10).map(x => ({ role: x.r === 'user' ? 'user' : 'assistant', content: (x.hid || x.c) + (x.act && x.act.length ? ' [' + x.act.length + ' ta amal taklif qilindi' + (x.done ? ', qo‘llandi' : x.rej ? ', rad etildi' : '') + ']' : '') }));
  const out = await SB.fn('ielts-agent', { messages: hist, ctx: IE.agentCtx() });
  if (!out || typeof out.reply !== 'string') throw new Error('AI javobi bo‘sh');
  return { reply: out.reply, acts: IE.agentValidate(out.actions) };
};

/* ---------- bajarish ---------- */
const nid = () => 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
function apply(acts) {
  const s = S(), u = { tasks: [], rest: {}, prof: {}, del: [], words: 0 }; let nav = null; const now = Date.now();
  s.ptask = s.ptask || {}; s.prest = s.prest || {};
  acts.filter(a => a.type === 'clear_tasks').forEach(a => { for (let d = a.from; d <= a.to; d = addD(d, 1)) (s.ptask[d] || []).forEach(t => { if (t.ai && !t.del) { t.del = true; t.mt = now; u.del.push([d, t.id]); } }); });
  acts.forEach(a => {
    if (a.type === 'add_task') { const id = nid(); (s.ptask[a.date] = s.ptask[a.date] || []).push({ id, t: a.title, m: a.mins, go: a.go, ai: 1, ts: now, mt: now }); u.tasks.push([a.date, id]); }
    else if (a.type === 'rest_day') { if (!(a.date in u.rest)) u.rest[a.date] = s.prest[a.date] ? JSON.parse(JSON.stringify(s.prest[a.date])) : null; s.prest[a.date] = { on: a.on, t: now }; }
    else if (a.type === 'set_profile') { ['target', 'date', 'mins', 'level', 'start'].forEach(f => { if (a[f] != null) { if (!(f in u.prof)) u.prof[f] = s.prof[f]; s.prof[f] = a[f]; } }); s.pts = now; }
    else if (a.type === 'add_words') { a.words.forEach(w => { const id = 'my:' + w.w.toLowerCase(); if (!s.my.some(x => x.id === id)) { s.my.push({ id, w: w.w, uz: w.uz, def: w.def, ex: w.ex, pos: '', ts: now }); u.words++; } if (!s.srs[id]) s.srs[id] = { b: 1, d: IE.dayNum(), t: now }; }); }
    else if (a.type === 'navigate') nav = a.route;
  });
  IE.touchDay(); IE.save(true); return { u, nav };
}
function undo(u) {
  const s = S(), now = Date.now();
  (u.tasks || []).forEach(([d, id]) => { const t = ((s.ptask || {})[d] || []).find(x => x.id === id); if (t) { t.del = true; t.mt = now; } });
  (u.del || []).forEach(([d, id]) => { const t = ((s.ptask || {})[d] || []).find(x => x.id === id); if (t) { t.del = false; t.mt = now; } });
  Object.entries(u.rest || {}).forEach(([d, v]) => { s.prest[d] = v || { on: false, t: now }; s.prest[d].t = now; });
  Object.entries(u.prof || {}).forEach(([f, v]) => { s.prof[f] = v; s.pts = now; });
  IE.save(true);
}

/* ---------- ko‘rinish ---------- */
IE.agentCard = m => {
  const acts = m.act || []; if (!acts.length) return '';
  const tasks = {}, rest = [], prof = [], words = [], nav = [], clr = [];
  acts.forEach(a => { if (a.type === 'add_task') (tasks[a.date] = tasks[a.date] || []).push(a); else if (a.type === 'rest_day') rest.push(a); else if (a.type === 'set_profile') prof.push(a); else if (a.type === 'add_words') words.push(...a.words); else if (a.type === 'navigate') nav.push(a); else if (a.type === 'clear_tasks') clr.push(a); });
  const days = Object.keys(tasks).sort(), nt = days.reduce((n, d) => n + tasks[d].length, 0), tm = days.reduce((n, d) => n + tasks[d].reduce((x, t) => x + t.mins, 0), 0);
  const row = d => '<div class="agd"><b>' + esc(dayTxt(d)) + '</b>' + tasks[d].map(t => '<div class="agt"><span>' + esc(t.title) + '</span><i>' + t.mins + '’</i></div>').join('') + '</div>';
  const pf = prof.map(p => ['target' in p ? 'Maqsad band: <b>' + p.target + '</b>' : '', 'date' in p ? 'Imtihon sanasi: <b>' + esc(p.date) + '</b>' : '', 'mins' in p ? 'Kunlik vaqt: <b>' + p.mins + ' daq</b>' : '', 'level' in p ? 'Daraja: <b>' + p.level + '</b>' : '', 'start' in p ? 'Boshlanish vaqti: <b>' + p.start + '</b>' : ''].filter(Boolean).join(' · ')).join('<br>');
  const body = (nt ? '<div class="agh">' + ic('cal') + ' <b>' + nt + ' vazifa</b> · ' + days.length + ' kun · ' + tm + ' daqiqa</div>' + (days.length > 4 ? '<details class="agdet"><summary>Kunlar bo‘yicha ko‘rish</summary>' + days.map(row).join('') + '</details>' : days.map(row).join('')) : '') +
    (rest.length ? '<div class="agh">' + ic('bed') + ' Dam olish: ' + rest.map(r => esc(dayTxt(r.date)) + (r.on ? '' : ' (bekor)')).join(', ') + '</div>' : '') +
    (clr.length ? '<div class="agh">' + ic('trash') + ' Eski AI vazifalar o‘chiriladi: ' + clr.map(c => esc(dayTxt(c.from)) + ' – ' + esc(dayTxt(c.to))).join('; ') + '</div>' : '') +
    (pf ? '<div class="agh">' + ic('sliders') + ' ' + pf + '</div>' : '') +
    (words.length ? '<div class="agh">' + ic('cards') + ' <b>' + words.length + ' so‘z</b> qo‘shiladi</div><div class="dchips">' + words.map(w => '<span class="chip">' + esc(w.w) + (w.uz ? ' · ' + esc(w.uz) : '') + '</span>').join('') + '</div>' : '') +
    (nav.length ? '<div class="agh">' + ic('next') + ' Ochiladi: <b>' + esc(nav[0].route) + '</b></div>' : '');
  const foot = m.done ? '<div class="agf ok"><span>✓ Qo‘llandi</span><span class="row" style="gap:6px"><button class="chip" data-a="agundo" data-id="' + esc(m.id) + '">↶ Bekor qilish</button>' + (nt || rest.length ? '<button class="chip" data-go="plan">Rejani ko‘rish</button>' : '') + '</span></div>'
    : m.rej ? '<div class="agf"><span class="mu">Rad etildi</span></div>'
    : m.undone ? '<div class="agf"><span class="mu">↶ Bekor qilindi</span></div>'
    : '<div class="agf"><button class="btn" data-a="agok" data-id="' + esc(m.id) + '">' + ic('check') + ' Qo‘llash (' + acts.length + ')</button><button class="btn ghost" data-a="agno" data-id="' + esc(m.id) + '">Rad etish</button></div>';
  return '<div class="agc' + (m.done ? ' done' : '') + '"><div class="agc-h">' + ic('spark') + ' AI taklifi</div>' + body + foot + '</div>';
};
const find = id => ((V.chat && V.chat.m) || []).find(x => x.id === id);
A.agok = el => {
  const m = find(el.dataset.id); if (!m || m.done || !m.act || !m.act.length) return;
  const r = apply(m.act); m.done = { u: r.u, ts: Date.now() }; IE.vib([15, 30, 15]); IE.chatSave && IE.chatSave();
  const nt = m.act.filter(a => a.type === 'add_task').length; IE.toast(nt ? '✓ ' + nt + ' vazifa rejaga qo‘shildi' : '✓ Qo‘llandi');
  if (r.nav) setTimeout(() => IE.go(r.nav), 700);
};
A.agno = el => { const m = find(el.dataset.id); if (!m || m.done) return; m.rej = 1; IE.chatSave && IE.chatSave(); };
A.agundo = el => { const m = find(el.dataset.id); if (!m || !m.done) return; undo(m.done.u || {}); m.done = null; m.undone = 1; IE.chatSave && IE.chatSave(); IE.toast('↶ Bekor qilindi'); };
R.agent = () => { IE.V.chatAuto = { text: '' }; try { location.replace(location.href.split('#')[0] + '#/chat'); } catch (e) { IE.go('chat'); } return { h: '<div style="padding-top:40vh"><div class="spin"></div></div>', sub: true }; };

const COACH = 'Haftalik tahlil qil: shu hafta nimalar yaxshi ketdi, qaysi joylar zaif (CONTEXT dagi band trendi, xatolar banki, Writing mezonlari va reja bajarilishiga qarab) va keyingi 7 kun uchun aniq reja taklif qil. Eski AI vazifalarni almashtir va zaif tomonlarga ko‘proq vaqt ber.';
IE.coachCard = force => {
  const d = new Date().getDay(); if (!force && d !== 0 && d !== 1) return '';
  return '<button class="mbcard rise coachc" data-a="agopen" data-p="' + esc(COACH) + '"><span class="mbi" style="background:linear-gradient(145deg,#a78bfa,#7c3aed)">' + ic('sparkl') + '</span><div style="flex:1;min-width:0"><b>AI haftalik trener</b><span>' + (d === 0 || d === 1 ? 'Yangi hafta — natijalaringiz tahlil qilinib, reja tuzib beriladi' : 'Haftangizni tahlil qilib, keyingi hafta rejasini tuzadi') + '</span></div><span class="go">' + ic('next') + '</span></button>';
};
A.agopen = el => IE.chatOpen && IE.chatOpen('agent', el && el.dataset.p ? el.dataset.p : '');
})();
