/* IELTS · BY AZIMOV — Guruhlar: do‘stlar bilan haftalik reyting va streak musobaqasi YOKI o‘qituvchi sinfi (vazifa berish, yuborilgan ishlarga izoh).
   Hamma ma’lumot Supabase RPC orqali (jadvallarga to‘g‘ridan-to‘g‘ri kirish yo‘q, RLS yoqilgan): ielts_group_*, ielts_assign_*, ielts_work_*, ielts_publish_summary.
   A’zolarga faqat: ism, seriya, haftalik ball, daqiqa. Guruh egasiga (o‘qituvchi) qo‘shimcha: band, maqsad, mashqlar soni. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, lsGet, lsSet } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V;
const G = () => V.g || (V.g = { list: null, err: '', busy: '', board: {}, assign: {}, works: {}, tab: {}, at: {} });
const fresh = k => { const g = G(); return g.at[k] && Date.now() - g.at[k] < 20000; };
const LK = 'ielts:gl';
const rpc = (fn, args) => SB.rpc(fn, args || {});
const errMsg = e => e && e.net ? 'Internetga ulanib bo‘lmadi' : String((e && e.message) || 'Xatolik').replace(/^.*?:\s*/, '').slice(0, 120);
const ago = t => { const m = Math.max(0, (Date.now() - t) / 6e4 | 0); return m < 1 ? 'hozir' : m < 60 ? m + ' daq oldin' : m < 1440 ? (m / 60 | 0) + ' soat oldin' : (m / 1440 | 0) + ' kun oldin'; };
const cache = () => lsGet(LK, []) || [];
IE.grpList = () => (G().list || cache());

/* ---------- mening xulosam (a’zolarga ko‘rinadigan sodda ko‘rsatkichlar) ---------- */
IE.mySummary = () => {
  const s = S(), keys = []; for (let i = 0; i < 7; i++) keys.push(IE.dayKey(Date.now() - i * 864e5));
  const acts = keys.map(k => (IE.dayAct ? IE.dayAct(k) : 0)), wk = acts.reduce((a, b) => a + b, 0), mins7 = keys.reduce((a, k) => a + (IE.focusMins ? IE.focusMins(k) : 0), 0);
  return { v: 1, streak: IE.streak(), wk, mins7, days7: acts.filter(x => x > 0).length, ov: IE.overall(), bands: IE.skillBands(), target: +s.prof.target || 7, exam: s.prof.date || '', n: { r: s.reads.length, l: s.listens.length, w: s.writes.length, sp: s.speaks.length, m: (s.mocks || []).length }, words: s.my.length, qt: Object.values(s.qt || {}).filter(v => v.ok).length };
};
let pubT = 0, lastPub = 0;
IE.grpPublish = async force => {
  if (!SB.session() || !(force || cache().length)) return;
  if (!force && Date.now() - lastPub < 60000) return; lastPub = Date.now();
  try { await rpc('ielts_publish_summary', { p_data: IE.mySummary() }); } catch (e) { /* keyingi safar */ }
};
const sched = () => { if (!cache().length) return; clearTimeout(pubT); pubT = setTimeout(() => IE.grpPublish(), 20000); };
{ const _save = IE.save; IE.save = function () { const r = _save.apply(this, arguments); try { sched(); } catch (e) { /* */ } return r; }; }

/* ---------- ro‘yxat ---------- */
const load = async force => {
  const g = G(); if (g.busy === 'list' || (!force && g.list && fresh('list'))) return; g.busy = 'list';
  try { g.list = await rpc('ielts_my_groups'); lsSet(LK, g.list.map(x => ({ id: x.id, name: x.name, owner: x.is_owner }))); g.err = ''; g.at.list = Date.now(); } catch (e) { g.err = errMsg(e); }
  g.busy = ''; if ((IE.curRoute || '').startsWith('groups')) IE.draw(false);
};
const KIND = { study: ['Do‘stlar guruhi', 'cal'], class: ['O‘qituvchi sinfi', 'trophy'] };
R.groups = a => {
  if (a[0]) return room(a[0]);
  const g = G(), top = IE.sub('Guruhlar', 'me', '<div class="pad"><div class="card rise"><div class="row">' + bd('trophy', 'M', 'lg') + '<div style="flex:1"><b style="font-size:16px">Birga o‘qing — kuchli bo‘ling</b><div class="sm mu">Do‘stlar bilan haftalik reyting va seriya musobaqasi, yoki o‘qituvchi sinfi: vazifa berish va yuborilgan ishlarga izoh. A’zolar faqat ismingiz, seriya va haftalik ballingizni ko‘radi; band va natijalarni faqat guruh egasi (o‘qituvchi).</div></div></div></div>' +
    '<div class="two" style="margin:14px 0"><button class="btn" data-a="gnew">' + ic('plus') + ' Guruh yaratish</button><button class="btn ghost" data-a="gjoin">Kod bilan qo‘shilish</button></div>' +
    (g.err ? '<div class="card"><p class="sm" style="color:var(--bad);font-weight:600;margin:0">' + esc(g.err) + '</p></div>' : !g.list ? '<div class="c" style="padding:26px"><div class="spin"></div></div>' : !g.list.length ? '<div class="card empty">' + bd('user', 'A') + 'Hali guruh yo‘q. Yarating yoki do‘stingiz bergan kod bilan qo‘shiling.</div>' :
      '<div class="lst">' + g.list.map(x => '<button class="item rise" data-go="groups/' + x.id + '">' + bd(KIND[x.kind][1], x.is_owner ? 'W' : 'R', 'sm') + '<div class="tx"><b>' + esc(x.name) + '</b><span>' + KIND[x.kind][0] + ' · ' + x.members + ' a’zo' + (x.is_owner ? ' · siz egasisiz' : '') + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>') + '</div>');
  top.mount = () => { load(); };
  return top;
};
A.gnew = () => { V.gk = V.gk || 'study'; IE.sheet('<h2>Guruh yaratish</h2><div class="seg" style="margin:10px 0">' + Object.entries(KIND).map(([k, v]) => '<button class="' + (V.gk === k ? 'on' : '') + '" data-a="gkind" data-v="' + k + '">' + v[0] + '</button>').join('') + '</div><div class="fld"><label>Guruh nomi</label><input id="gnm" maxlength="40" placeholder="' + (V.gk === 'class' ? 'Masalan: IELTS 7.0 — kechki guruh' : 'Masalan: Kursdoshlar') + '"></div><button class="btn block" data-a="gnewgo">' + ic('check') + ' Yaratish</button>'); };
A.gkind = el => { const v = (document.getElementById('gnm') || {}).value || ''; V.gk = el.dataset.v; A.gnew(); const i = document.getElementById('gnm'); if (i) i.value = v; };
A.gnewgo = async el => {
  const n = ((document.getElementById('gnm') || {}).value || '').trim(); if (n.length < 2) return IE.toast('Guruh nomini yozing'); el.disabled = true;
  try { const r = await rpc('ielts_group_create', { p_name: n, p_kind: V.gk || 'study' }); IE.closeSheet(); IE.grpPublish(true); G().list = null; G().at = {}; IE.toast('Guruh yaratildi — kod: ' + r.code); IE.go('groups/' + r.id); } catch (e) { el.disabled = false; IE.toast(errMsg(e)); }
};
A.gjoin = () => IE.sheet('<h2>Guruhga qo‘shilish</h2><p class="mu sm" style="margin:4px 0 10px">Guruh egasi bergan 6 belgili kodni kiriting.</p><div class="fld"><input id="gcd" maxlength="8" placeholder="ABC123" autocapitalize="characters" autocomplete="off" style="text-transform:uppercase;letter-spacing:.2em;font-weight:800;text-align:center"></div><button class="btn block" data-a="gjoingo">' + ic('check') + ' Qo‘shilish</button>');
A.gjoingo = async el => {
  const c = ((document.getElementById('gcd') || {}).value || '').trim(); if (c.length < 4) return IE.toast('Kodni kiriting'); el.disabled = true;
  try { const r = await rpc('ielts_group_join', { p_code: c }); IE.closeSheet(); IE.grpPublish(true); G().list = null; G().at = {}; IE.toast('Qo‘shildingiz: ' + r.name); IE.go('groups/' + r.id); } catch (e) { el.disabled = false; IE.toast(errMsg(e)); }
};

/* ---------- guruh xonasi ---------- */
const info = id => (G().list || []).find(x => x.id === id) || null;
const loadRoom = async (id, force) => {
  const g = G(), tab = g.tab[id] || 'board', key = id + ':' + tab; if (g.busy === 'room:' + id || (!force && fresh(key))) return; g.busy = 'room:' + id;
  try {
    if (!g.list) await load();
    if (tab === 'board') g.board[id] = await rpc('ielts_group_board', { p_group: id }); else if (tab === 'tasks') g.assign[id] = await rpc('ielts_assign_list', { p_group: id }); else g.works[id] = await rpc('ielts_works', { p_group: id });
    g.err = ''; g.at[key] = Date.now();
  } catch (e) { g.err = errMsg(e); g.at[key] = Date.now(); }
  g.busy = ''; if ((IE.curRoute || '') === 'groups/' + id) IE.draw(false);
};
const medal = i => ['🥇', '🥈', '🥉'][i] || (i + 1);
function room(id) {
  const g = G(), x = info(id) || (cache().find(c => c.id === id) ? { id, name: cache().find(c => c.id === id).name, is_owner: cache().find(c => c.id === id).owner, kind: 'study', members: '', code: null } : null), tab = g.tab[id] || 'board';
  if (!x && g.list) return IE.sub('Guruh', 'groups', '<div class="pad"><div class="card empty">Guruh topilmadi yoki siz a’zo emassiz.</div></div>');
  const own = x && x.is_owner;
  let body = '';
  if (g.err) body = '<div class="card"><p class="sm" style="color:var(--bad);font-weight:600;margin:0">' + esc(g.err) + '</p></div>';
  else if (tab === 'board') body = board(id, own);
  else if (tab === 'tasks') body = tasks(id, own);
  else body = works(id, own);
  const head = x ? '<div class="card rise"><div class="row" style="justify-content:space-between;align-items:flex-start"><div><b style="font-size:18px">' + esc(x.name) + '</b><div class="sm mu">' + KIND[x.kind][0] + (x.members ? ' · ' + x.members + ' a’zo' : '') + '</div></div>' + (own && x.code ? '<button class="chip" data-a="gcode" data-c="' + esc(x.code) + '" data-n="' + esc(x.name) + '">' + ic('share') + ' Kod: <b>' + esc(x.code) + '</b></button>' : '') + '</div></div>' : '';
  const tabs = '<div class="tabs2" style="margin:12px 0;grid-template-columns:repeat(3,1fr)">' + [['board', 'Reyting'], ['tasks', 'Vazifalar'], ['works', 'Ishlar']].map(t => '<button class="' + (tab === t[0] ? 'on' : '') + '" data-a="gtab" data-id="' + id + '" data-v="' + t[0] + '" style="padding:9px 2px;font-size:13px">' + t[1] + '</button>').join('') + '</div>';
  const foot = x ? '<div style="margin-top:18px;text-align:center">' + (own ? '<button class="chip" style="color:var(--bad)" data-a="gdel" data-id="' + id + '">' + ic('trash') + ' Guruhni o‘chirish</button>' : '<button class="chip" data-a="gleave" data-id="' + id + '">Guruhdan chiqish</button>') + '</div>' : '';
  const o = IE.sub(x ? x.name : 'Guruh', 'groups', '<div class="pad">' + head + tabs + body + foot + '</div>');
  o.mount = () => { IE.grpPublish(); loadRoom(id); };
  return o;
}
A.gtab = el => { const g = G(); g.tab[el.dataset.id] = el.dataset.v; g.err = ''; IE.draw(false); loadRoom(el.dataset.id); };
A.gcode = async el => { const c = el.dataset.c, t = 'IELTS guruhimizga qo‘shiling: «' + el.dataset.n + '». Kod: ' + c + ' (Ilova: ' + location.origin + location.pathname.replace(/[^/]*$/, '') + '#/groups )'; try { if (navigator.share) { await navigator.share({ text: t }); return; } } catch (e) { if (e && e.name === 'AbortError') return; } try { await navigator.clipboard.writeText(t); IE.toast('Kod nusxalandi'); } catch (e) { IE.toast('Kod: ' + c); } };
A.gleave = el => IE.ask('Guruhdan chiqasizmi?', 'Reytingdan va vazifalardan chiqarilasiz. Qayta qo‘shilish uchun kod kerak.', 'Chiqish', async () => { try { await rpc('ielts_group_leave', { p_group: el.dataset.id }); G().list = null; localStorage.removeItem(LK); IE.toast('Guruhdan chiqdingiz'); IE.go('groups'); } catch (e) { IE.toast(errMsg(e)); } });
A.gdel = el => IE.ask('Guruh o‘chirilsinmi?', 'Barcha a’zolar, vazifalar va yuborilgan ishlar o‘chadi. Bu amalni qaytarib bo‘lmaydi.', 'O‘chirish', async () => { try { await rpc('ielts_group_delete', { p_group: el.dataset.id }); G().list = null; localStorage.removeItem(LK); IE.toast('Guruh o‘chirildi'); IE.go('groups'); } catch (e) { IE.toast(errMsg(e)); } });

/* ----- Reyting ----- */
function board(id, own) {
  const rows = G().board[id]; if (!rows) return '<div class="c" style="padding:26px"><div class="spin"></div></div>';
  const sorted = rows.slice().sort((a, b) => ((b.data.wk || 0) - (a.data.wk || 0)) || ((b.data.streak || 0) - (a.data.streak || 0)));
  const top = sorted[0], str = rows.slice().sort((a, b) => (b.data.streak || 0) - (a.data.streak || 0))[0];
  const hero = rows.length > 1 && top ? '<div class="card rise gbh"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">Hafta yetakchisi</div><div style="font-size:20px;font-weight:900;margin-top:4px">' + esc(top.name) + ' <small style="font-size:13px;color:var(--mu)">' + (top.data.wk || 0) + ' ball</small></div>' + (str && (str.data.streak || 0) > 1 ? '<div class="sm mu" style="margin-top:4px">🔥 Eng uzun seriya: <b>' + esc(str.name) + '</b> — ' + str.data.streak + ' kun</div>' : '') + '</div>' : '';
  const max = Math.max(1, ...sorted.map(r => r.data.wk || 0));
  return hero + '<div class="sec"><h2>Haftalik reyting</h2><span class="mu xs">oxirgi 7 kun · faollik bali</span></div><div class="lst">' + sorted.map((r, i) => {
    const d = r.data || {}, open = V.gopen === r.user_id;
    return '<div class="item gr' + (r.me ? ' me' : '') + '" style="flex-wrap:wrap;gap:0"><div class="row" style="width:100%;gap:10px' + (own && !r.me ? ';cursor:pointer" data-a="gopen" data-u="' + r.user_id + '' : '') + '"><span class="grk">' + medal(i) + '</span><div class="tx" style="min-width:0"><b>' + esc(r.name) + (r.me ? ' (siz)' : '') + (r.is_owner ? ' · egasi' : '') + '</b><span>🔥 ' + (d.streak || 0) + ' kun · ' + (d.mins7 || 0) + '’ fokus · ' + (d.days7 || 0) + '/7 kun</span><div class="prog" style="margin-top:6px;height:5px"><i style="width:' + Math.round((d.wk || 0) / max * 100) + '%"></i></div></div><b class="grw">' + (d.wk || 0) + '</b></div>' +
      ((own && (open || r.me) && d.bands) ? '<div class="gd" style="width:100%;margin-top:10px;padding-top:10px;border-top:1px dashed var(--ln)"><div class="rgrid">' + ['L', 'R', 'W', 'S'].map(k => '<div><b>' + (d.bands[k] != null ? IE.bandTxt(d.bands[k]) : '—') + '</b><span>' + ({ L: 'Listening', R: 'Reading', W: 'Writing', S: 'Speaking' })[k] + '</span></div>').join('') + '</div><div class="sm mu" style="margin-top:8px">Overall <b>' + IE.bandTxt(d.ov) + '</b> · maqsad ' + IE.bandTxt(d.target) + (d.exam ? ' · imtihon ' + esc(d.exam) : '') + '<br>Reading ' + ((d.n || {}).r || 0) + ' · Listening ' + ((d.n || {}).l || 0) + ' · Writing ' + ((d.n || {}).w || 0) + ' · Speaking ' + ((d.n || {}).sp || 0) + ' · Mock ' + ((d.n || {}).m || 0) + ' · so‘z ' + (d.words || 0) + (r.updated_at ? '<br>Yangilangan: ' + ago(new Date(r.updated_at).getTime()) : '') + '</div></div>' : (own && !r.me && !d.bands ? '<div class="sm mu" style="width:100%;margin-top:6px">Batafsil ma’lumot hali yuborilmagan.</div>' : '')) + '</div>';
  }).join('') + '</div><p class="hint" style="margin-top:12px">' + ic('bulb') + ' Ball — kunlik faollikdan (mashq, fokus daqiqalari) yig‘iladi. Ma’lumot ilova ochilganda yangilanadi.' + (own ? ' A’zoni bosib batafsil natijani ko‘ring.' : '') + '</p>';
}
A.gopen = el => { V.gopen = V.gopen === el.dataset.u ? null : el.dataset.u; IE.draw(false); };

/* ----- Vazifalar ----- */
const STEPS = [['Reading: T/F/NG mashqi', 'qtype/tfng'], ['Reading: Matching Headings', 'qtype/heads'], ['Listening: Map labelling', 'qtype/map'], ['Collocation (10 ta)', 'qtype/col'], ['Paraphrase (AI)', 'qtype/para'], ['Writing Task 2 insho', 'writing'], ['Writing Task 1 (diagramma)', 'writing'], ['Speaking Part 1', 'speaking'], ['Speaking Part 3', 'speaking'], ['Listening testi', 'listening'], ['Reading testi', 'reading'], ['Xatolar banki takrori', 'mb'], ['So‘zlar takrori', 'vocab/review'], ['Tezkor Mock', 'mock']];
function tasks(id, own) {
  const list = G().assign[id]; if (!list) return '<div class="c" style="padding:26px"><div class="spin"></div></div>';
  const mem = ((G().board[id] || []).length) || (info(id) || {}).members || 0;
  return (own ? '<button class="btn block" data-a="gtask" data-id="' + id + '">' + ic('plus') + ' Vazifa berish</button>' : '') + (list.length ? list.map(a => {
    const done = new Set(a.done || []), n = a.items.length, late = a.due && new Date(a.due + 'T23:59:59') < new Date() && done.size < n;
    return '<div class="card rise" style="margin-top:12px"><div class="row" style="justify-content:space-between;align-items:flex-start"><div style="min-width:0"><b style="font-size:16px">' + esc(a.title) + '</b><div class="sm mu">' + (a.due ? 'Muddat: ' + esc(a.due) + (late ? ' · <span style="color:var(--bad)">o‘tib ketgan</span>' : '') : 'Muddatsiz') + '</div></div><span class="chip' + (done.size === n ? ' ok' : '') + '">' + done.size + '/' + n + '</span></div>' +
      a.items.map((it, i) => '<div class="q15r' + (done.has(i) ? ' done' : '') + '"><button class="q15n" data-a="gmark" data-a2="' + a.id + '" data-i="' + i + '" data-g="' + id + '" data-v="' + (done.has(i) ? 0 : 1) + '" aria-label="Belgilash">' + (done.has(i) ? ic('check') : i + 1) + '</button><div class="tx"><b>' + esc(it.t) + '</b></div>' + (it.go ? '<button class="chip" data-go="' + esc(it.go) + '">Boshlash</button>' : '') + '</div>').join('') +
      (own ? '<div class="sm" style="margin-top:10px;padding-top:10px;border-top:1px dashed var(--ln)"><b>A’zolar:</b> ' + ((a.prog || []).length ? (a.prog || []).map(p => esc(p.n || 'A’zo') + ' ' + (p.d || []).length + '/' + n).join(' · ') : '<span class="mu">hali hech kim belgilamagan</span>') + (mem ? ' <span class="mu">(' + mem + ' a’zodan)</span>' : '') + '</div><div style="margin-top:8px"><button class="chip" style="color:var(--bad)" data-a="gtdel" data-id="' + a.id + '" data-g="' + id + '">' + ic('trash') + ' O‘chirish</button></div>' : '') + '</div>';
  }).join('') : '<div class="card empty" style="margin-top:12px">' + bd('list', 'A') + (own ? 'Hali vazifa berilmagan.' : 'Hozircha vazifa yo‘q.') + '</div>');
}
A.gmark = async el => { const g = el.dataset.g, a = (G().assign[g] || []).find(x => x.id === el.dataset.a2), i = +el.dataset.i, v = el.dataset.v === '1'; if (!a) return; const s = new Set(a.done || []); v ? s.add(i) : s.delete(i); a.done = [...s].sort((x, y) => x - y); IE.draw(false); try { await rpc('ielts_assign_mark', { p_assign: a.id, p_idx: i, p_val: v }); } catch (e) { IE.toast(errMsg(e)); loadRoom(g, true); } };
A.gtask = el => {
  V.gt = { g: el.dataset.id, sel: new Set(), custom: '' };
  IE.sheet('<h2>Vazifa berish</h2><div class="fld"><label>Sarlavha</label><input id="gtt" maxlength="80" placeholder="Masalan: Haftalik vazifa — Reading"></div><div class="fld"><label>Qadamlarni tanlang</label><div class="gsteps">' + STEPS.map((s, i) => '<button class="chip gst" data-a="gstep" data-i="' + i + '">' + esc(s[0]) + '</button>').join('') + '</div></div><div class="fld"><label>O‘z qadamingiz (ixtiyoriy)</label><input id="gtc" maxlength="100" placeholder="Masalan: Cambridge 15 Test 2 Reading"></div><div class="fld"><label>Muddat (ixtiyoriy)</label><input id="gtd" type="date"></div><button class="btn block" data-a="gtaskgo">' + ic('check') + ' Berish</button>');
};
A.gstep = el => { const s = V.gt.sel, i = +el.dataset.i; s.has(i) ? s.delete(i) : s.add(i); el.classList.toggle('on', s.has(i)); };
A.gtaskgo = async el => {
  const t = ((document.getElementById('gtt') || {}).value || '').trim(), c = ((document.getElementById('gtc') || {}).value || '').trim(), d = (document.getElementById('gtd') || {}).value || null, items = [...V.gt.sel].sort((a, b) => a - b).map(i => ({ t: STEPS[i][0], go: STEPS[i][1] }));
  if (c) items.push({ t: c, go: '' }); if (t.length < 2) return IE.toast('Sarlavhani yozing'); if (!items.length) return IE.toast('Kamida bitta qadam tanlang');
  el.disabled = true;
  try { await rpc('ielts_assign_create', { p_group: V.gt.g, p_title: t, p_items: items, p_due: d || null }); IE.closeSheet(); IE.toast('Vazifa berildi'); loadRoom(V.gt.g, true); } catch (e) { el.disabled = false; IE.toast(errMsg(e)); }
};
A.gtdel = el => IE.ask('Vazifa o‘chirilsinmi?', 'A’zolarning belgilari ham o‘chadi.', 'O‘chirish', async () => { try { await rpc('ielts_assign_delete', { p_assign: el.dataset.id }); loadRoom(el.dataset.g, true); } catch (e) { IE.toast(errMsg(e)); } });

/* ----- Ishlar (insho yuborish + izohlar) ----- */
function works(id, own) {
  const list = G().works[id]; if (!list) return '<div class="c" style="padding:26px"><div class="spin"></div></div>';
  return (!own ? '<button class="btn block" data-a="gsend" data-id="' + id + '">' + ic('up') + ' Ishimni yuborish (insho)</button><p class="hint" style="margin:10px 0 0">' + ic('bulb') + ' Faqat o‘zingiz tanlagan insho yuboriladi. Uni guruh egasi ko‘radi va izoh yozadi.</p>' : '<p class="hint">' + ic('bulb') + ' A’zolar yuborgan ishlar shu yerda — izoh yozing.</p>') + (list.length ? list.map(w => {
    const ai = w.ai && typeof w.ai.overall === 'number' ? '<span class="chip">AI ' + IE.bandTxt(w.ai.overall) + '</span>' : '';
    return '<div class="card rise" style="margin-top:12px"><div class="row" style="justify-content:space-between;align-items:flex-start;gap:8px"><div style="min-width:0"><b>' + esc(w.title || 'Insho') + '</b><div class="sm mu">' + esc(w.name) + ' · ' + ago(new Date(w.created_at).getTime()) + '</div></div>' + ai + '</div>' +
      '<details style="margin-top:8px"><summary class="b" style="cursor:pointer">Matn (' + (String(w.body).match(/\S+/g) || []).length + ' so‘z)</summary><p style="margin:8px 0 0;line-height:1.6;white-space:pre-wrap">' + esc(w.body) + '</p></details>' +
      (w.comments || []).map(c => '<div class="gcm' + (c.m ? ' mine' : '') + '"><b>' + esc(c.n || 'Izoh') + '</b> <span class="mu xs">' + ago(new Date(c.t).getTime()) + '</span><div>' + esc(c.b) + '</div></div>').join('') +
      '<div class="row" style="gap:8px;margin-top:10px"><input class="search" id="gc' + w.id + '" style="margin:0;flex:1" maxlength="1200" placeholder="' + (own ? 'Izoh yozing…' : 'Javob yozing…') + '"><button class="btn sm" data-a="gcm" data-w="' + w.id + '" data-g="' + id + '">' + ic('next') + '</button></div>' +
      (own || w.user_id === (SB.session() || { user: {} }).user.id ? '<div style="margin-top:8px"><button class="chip" data-a="gwdel" data-w="' + w.id + '" data-g="' + id + '">' + ic('trash') + ' O‘chirish</button></div>' : '') + '</div>';
  }).join('') : '<div class="card empty" style="margin-top:12px">' + bd('pen', 'W') + (own ? 'Hali ish yuborilmagan.' : 'Hali ish yubormadingiz.') + '</div>');
}
A.gsend = el => {
  const gid = el.dataset.id, ws = S().writes.filter(w => w.x && w.x.length > 40).slice(-8).reverse();
  IE.sheet('<h2>Qaysi inshoni yuboramiz?</h2>' + (ws.length ? '<div class="lst" style="margin-top:10px">' + ws.map(w => '<button class="item" data-a="gsendgo" data-g="' + gid + '" data-ts="' + w.ts + '"><div class="tx"><b>' + w.words + ' so‘z' + (w.ai ? ' · AI ' + IE.bandTxt(w.ai.overall) : '') + '</b><span>' + esc(String(IE.wprompt ? IE.wprompt(w.p) : '').slice(0, 70) || 'Insho') + ' · ' + new Date(w.ts).toLocaleDateString('en-GB') + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>' : '<p class="mu">Avval Writing bo‘limida insho yozing.</p>'));
};
A.gsendgo = async el => {
  const w = S().writes.find(x => x.ts === +el.dataset.ts); if (!w) return; el.disabled = true;
  const title = String((IE.wprompt ? IE.wprompt(w.p) : '') || 'Insho').split('\n')[0].slice(0, 120), ai = w.ai ? { overall: w.ai.overall, tr: w.ai.tr, cc: w.ai.cc, lr: w.ai.lr, gra: w.ai.gra } : null;
  try { await rpc('ielts_work_share', { p_group: el.dataset.g, p_title: title, p_body: String(w.x).slice(0, 8900), p_ai: ai }); IE.closeSheet(); IE.toast('Yuborildi'); const g = G(); g.tab[el.dataset.g] = 'works'; IE.draw(false); loadRoom(el.dataset.g, true); } catch (e) { el.disabled = false; IE.toast(errMsg(e)); }
};
A.gcm = async el => { const i = document.getElementById('gc' + el.dataset.w), b = ((i || {}).value || '').trim(); if (!b) return; el.disabled = true; try { await rpc('ielts_comment_add', { p_work: el.dataset.w, p_body: b }); loadRoom(el.dataset.g, true); } catch (e) { el.disabled = false; IE.toast(errMsg(e)); } };
A.gwdel = el => IE.ask('Ish o‘chirilsinmi?', 'Izohlar ham o‘chadi.', 'O‘chirish', async () => { try { await rpc('ielts_work_delete', { p_work: el.dataset.w }); loadRoom(el.dataset.g, true); } catch (e) { IE.toast(errMsg(e)); } });

/* Writing tarixidan to‘g‘ridan-to‘g‘ri yuborish tugmasi */
IE.grpShareBtn = ts => { const l = cache(); return l.length ? '<button class="btn block ghost" style="margin-top:10px" data-a="gshare" data-ts="' + ts + '">' + ic('up') + ' Guruhga yuborish</button>' : ''; };
A.gshare = el => {
  const l = cache(); if (!l.length) return IE.toast('Avval guruhga qo‘shiling');
  if (l.length === 1) return A.gsendgo({ dataset: { g: l[0].id, ts: el.dataset.ts }, disabled: false, closest: () => null });
  IE.sheet('<h2>Qaysi guruhga?</h2><div class="lst" style="margin-top:10px">' + l.map(x => '<button class="item" data-a="gsendgo" data-g="' + x.id + '" data-ts="' + el.dataset.ts + '"><div class="tx"><b>' + esc(x.name) + '</b></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>');
};
IE.grpMenu = () => '<button class="set" data-go="groups"><span class="bd sm sk-M">' + ic('trophy') + '</span><div class="tx"><b>Guruhlar</b><span>Do‘stlar reytingi yoki o‘qituvchi sinfi · ' + (cache().length ? cache().length + ' ta guruh' : 'yaratish / qo‘shilish') + '</span></div></button>';
})();
