/* IELTS · BY AZIMOV — ekranlar: Home, Practice, Reading, Writing, Speaking, So‘zlar, Strategiya, Chat, Profil. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet, fmtT, fmtD, ago } = Object.assign({}, IE, { ic: IE.ic, bd: IE.bd });
const S = () => IE.S(), D = IE.D, R = IE.routes, A = IE.act, V = IE.V;
A.back = el => { const r = el.dataset.r; if (IE.prevRoute === r && history.length > 1) history.back(); else IE.go(r); };
IE.go = r => { if (location.hash === '#/' + r) IE.draw(false); else location.hash = '#/' + r; };

/* ---------- umumiy bo‘laklar ---------- */
const TABS = [['home', 'home', 'Home'], ['practice', 'target', 'Practice'], ['chat', 'chat', 'Chat'], ['tools', 'grid', 'Tools'], ['me', 'user', 'Profil']];
const nav = tab => '<nav class="nav">' + TABS.map(t => '<button class="' + (t[0] === tab ? 'on' : '') + '" data-go="' + t[0] + '" aria-label="' + t[2] + '">' + ic(t[1]) + '<span>' + t[2] + '</span></button>').join('') + '</nav>';
const top = (title, back, right) => '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + '</header>';
const page = (tab, inner) => ({ h: '<div class="scr">' + inner + '</div>' + nav(tab), tab });
const sub = (title, back, inner, right, extra) => ({ h: top(title, back, right) + '<div class="scr sub">' + inner + '</div>' + (extra || ''), sub: true });
IE.page = page; IE.sub = sub; IE.top = top; IE.dispName = () => S().prof.name || (IE.D.profile && IE.D.profile.name) || 'Do‘st';
const soonChip = '<span class="chip soon">' + ic('lock') + ' Tez orada</span>';
const dispName = () => S().prof.name || (D.profile && D.profile.name) || 'Do‘st';
const sk = { L: ['head', 'L', 'Listening'], R: ['book', 'R', 'Reading'], W: ['pen', 'W', 'Writing'], S: ['mic', 'S', 'Speaking'] };
IE.sheet = html => { IE.closeSheet(); const d = document.createElement('div'); d.className = 'sheet-bg'; d.id = 'sheet'; d.innerHTML = '<div class="sheet">' + html + '</div>'; d.addEventListener('click', e => { if (e.target === d) IE.closeSheet(); }); document.body.appendChild(d); return d; };
IE.closeSheet = () => { const s = $('#sheet'); if (s) s.remove(); };
IE.ask = (title, text, ok, fn) => { IE.sheet('<h2>' + esc(title) + '</h2><p class="mu" style="margin:6px 0 18px">' + esc(text) + '</p><div class="two"><button class="btn ghost" data-a="sheet-x">Bekor</button><button class="btn" id="askok">' + esc(ok) + '</button></div>'); $('#askok').onclick = () => { IE.closeSheet(); fn(); }; };
A['sheet-x'] = () => IE.closeSheet();
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };

/* ---------- HOME ---------- */
function allRecent() {
  const s = S(), out = [];
  s.reads.forEach(r => { const p = D.reading.passages.find(x => x.id === r.p); out.push({ ts: r.ts, k: 'R', t: p ? p.title : 'Reading', m: r.raw + '/' + r.tot + ' to‘g‘ri', b: IE.bandTxt(r.band), go: 'reading/' + r.p + '/result' }); });
  s.listens.forEach(r => { const t = D.listening.tests.find(x => x.id === r.id); out.push({ ts: r.ts, k: 'L', t: t ? (t.topic.split(' · ')[1] || t.title) : 'Listening', m: r.raw + '/' + r.tot + ' to‘g‘ri', b: IE.bandTxt(r.band), go: 'listening/' + r.id + '/result' }); });
  s.writes.forEach(w => out.push({ ts: w.ts, k: 'W', t: 'Writing Task 2', m: w.words + ' so‘z · ' + Math.round(w.secs / 60) + ' daq', b: w.ai ? IE.bandTxt(w.ai.overall) : w.words + '', go: 'writing/h/' + w.ts }));
  s.speaks.forEach(w => out.push({ ts: w.ts, k: 'S', t: w.k === '2' ? 'Speaking Part 2' : 'Speaking Part 1', m: w.t || '', b: w.ai ? IE.bandTxt(w.ai.overall) : '✓', go: 'speaking' }));
  return out.sort((a, b) => b.ts - a.ts);
}
IE.allRecent = () => allRecent();
const dueCount = () => { const t = IE.dayNum(); return Object.values(S().srs).filter(x => x.d <= t).length; };
IE.dueCount = dueCount;
const resumeH = () => {
  const it = IE.resumeItems ? IE.resumeItems() : []; if (!it.length) return '';
  return '<div class="sec" style="margin-top:16px"><h2>Davom ettiring</h2></div><div class="lst rise">' + it.map(x => '<button class="item" data-go="' + x.go + '">' + bd(sk[x.k][0], sk[x.k][1], 'sm') + '<div class="tx"><b>' + esc(x.t) + '</b><span>' + esc(x.s) + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>';
};
const qaH = () => '<div class="qa rise">' + [['zap', 'Fokus', 'focus', 'T'], ['search', 'Lug‘at', 'dict', 'A'], ['type', 'Typing', 'typing', 'W'], ['chat', 'Suhbat', 'chat', 'S']].map(a => '<button data-go="' + a[2] + '">' + bd(a[0], a[3]) + '<span>' + a[1] + '</span></button>').join('') + '</div>';
R.home = () => {
  const s = S(), p = s.prof, ov = IE.overall(), st = IE.streak(), rec = allRecent().slice(0, 4);
  const days = p.date ? Math.ceil((new Date(p.date + 'T00:00:00') - Date.now()) / 864e5) : null;
  const total = s.reads.length + s.writes.length + s.speaks.length, due = dueCount();
  const inner = '<div class="hero"><div class="row"><div><div class="hi">' + (IE.greet ? IE.greet() : 'Xush kelibsiz') + '</div><h1>' + esc(dispName()) + '</h1></div>' +
    '<div class="row" style="gap:8px"><button class="ib w updb" data-a="upd" aria-label="Yangilanishni tekshirish">' + ic('refresh') + '</button><div class="chip" style="background:rgba(255,255,255,.2);color:#fff;font-size:13px;padding:7px 12px">' + ic('flame') + ' ' + st + ' kun</div></div></div><p class="hquote">' + esc(IE.quote ? IE.quote() : '') + '</p></div>' +
    '<div class="lift">' + (IE.q15Card ? IE.q15Card() : '') + (IE.homePlan ? IE.homePlan() : '') + resumeH() + qaH() + (IE.bankCard ? IE.bankCard() : '') + (IE.coachCard ? IE.coachCard() : '') + '<div class="card rise" style="margin-top:14px"><div class="score"><div class="ring" style="--v:' + (ov ? ov / 9 * 100 : 0) + '"><small>Overall</small><b>' + IE.bandTxt(ov) + '</b></div>' +
    '<div style="flex:1"><div class="mu xs b" style="letter-spacing:.08em;text-transform:uppercase">Maqsad band</div><div style="font-size:34px;font-weight:900;line-height:1.1">' + IE.bandTxt(p.target) + '</div>' +
    '<div class="sm mu">' + (days != null && days >= 0 ? 'Imtihongacha <b>' + days + '</b> kun' : '<a data-go="me" style="color:var(--pl);font-weight:700">Imtihon sanasini qo‘shing</a>') + '</div></div></div>' +
    '</div>' + '<div class="sec"><h2>Ko‘nikmalar</h2><button class="chip" data-go="me">Batafsil</button></div>' + IE.skillRows() + IE.forecastCard() +
    (IE.mockActive && IE.mockActive() ? '<div class="rise" style="margin-top:14px"><button class="item" data-go="mock">' + bd('trophy', 'M') + '<div class="tx"><b>Mock test davom etmoqda</b><span>Bosib davom ettiring</span></div><span class="go">' + ic('next') + '</span></button></div>' : '') +
    (IE.bookHome ? IE.bookHome() : '') +
    '<div class="rise" style="margin-top:14px"><button class="aibn" data-go="chat">' + bd('spark', 'A', 'lg') + '<div style="flex:1"><h3>AI Speaking Tutor</h3><p>Suhbat qiling, xatolaringiz tuzatiladi.</p></div><span class="chip" style="background:rgba(255,255,255,.22);color:#fff">AI</span></button></div>' +
    (IE.wotd ? IE.wotd() : '') +
    '<div class="sec"><h2>Tezkor mashq</h2></div><div class="qp rise">' +
    Object.entries(sk).map(([k, v]) => '<button data-go="' + (k === 'L' ? 'listening' : k === 'R' ? 'reading' : k === 'W' ? 'writing' : 'speaking') + '">' + bd(v[0], v[1]) + v[2] + '</button>').join('') + '</div>' +
    '<div class="rise" style="margin-top:14px"><button class="item" data-go="' + (due ? 'vocab/review' : 'vocab') + '">' + bd('cards', 'V') + '<div class="tx"><b>' + (due ? 'Takrorlash vaqti: ' + due + ' ta so‘z' : 'So‘zlar bilan ishlang') + '</b><span>' + (due ? 'Eslab qolish uchun hozir takrorlang' : 'Flesh-kartalar va avtomatik takrorlash') + '</span></div><span class="go">' + ic('next') + '</span></button></div>' +
    '<div class="sec"><h2>So‘nggi natijalar</h2>' + (rec.length ? '' : '') + '</div>' +
    (rec.length ? '<div class="lst rise">' + rec.map(r => '<button class="item" data-go="' + r.go + '">' + bd(sk[r.k][0], sk[r.k][1], 'sm') + '<div class="tx"><b>' + esc(r.t) + '</b><span>' + esc(r.m) + ' · ' + ago(r.ts) + '</span></div><span class="band sk-' + sk[r.k][1] + '">' + esc(r.b) + '</span></button>').join('') + '</div>'
      : '<div class="card empty rise">' + bd('target', 'A') + 'Hali natija yo‘q.<br>Birinchi Reading mashqini boshlang!<br><button class="btn sm" style="margin-top:12px" data-go="reading">Reading’ni boshlash</button></div>') +
    '<div class="sec"><h2>Faollik xaritasi</h2><span class="mu xs">10 hafta</span></div><div class="card rise">' + IE.heat(10) + '<div class="row sm mu" style="justify-content:space-between;margin-top:8px"><span>Kam</span><span class="cal-lg"><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i></span><span>Ko‘p</span></div></div></div>';
  const hp = page('home', inner); hp.mount = () => { if (IE.planCheck) IE.planCheck(); }; return hp;
};

/* ---------- PRACTICE / TOOLS / CHAT ---------- */
const camCard = () => {
  const g = IE.camGroups ? IE.camGroups() : null, nb = g ? g.books.length : 0, nt = g ? g.books.reduce((n, b) => n + b[1].size, 0) : 0;
  return '<button class="camcard rise" data-go="cambridge"><span class="cc-ic">' + ic('book') + '</span><div style="flex:1;min-width:0"><div class="cc-k">Cambridge IELTS</div><b>' + (nt ? nb + ' kitob · ' + nt + ' test' : 'Kitoblaringizdan testlar') + '</b><span>' + (nt ? 'Listening, Reading va to‘liq imtihon rejimi' : 'PDF yuklab, hammasini avtomatik qo‘shing') + '</span></div><span class="go">' + ic('next') + '</span></button>';
};
R.practice = () => { const full = IE.pracMode && IE.pracMode() === 'full'; return page('practice', '<div class="hero" style="padding-bottom:70px"><div class="hi">Imtihon formati</div><h1>Practice</h1></div><div class="lift">' + (IE.pracSeg ? IE.pracSeg() : '') + '<div class="skills rise">' +
  [['L', 'head', 'Listening', full ? '4 qism · 40 savol · audio bir marta' : '1 qism · 10 savol (8 ta yozuv)', 'listening'], ['R', 'book', 'Reading', full ? '3 passage · 40 savol · 60 daq' : '1 passage · 13 savol (3 matn)', 'reading'], ['W', 'pen', 'Writing', 'Task 1 + 2 · taymer, namunalar', 'writing'], ['S', 'mic', 'Speaking', '3 qism · yozib olish', 'speaking']]
    .map(a => '<button class="sktile" data-go="' + a[4] + '">' + (a[5] ? soonChip : '') + bd(a[1], a[0], 'lg') + '<b>' + a[2] + '</b><small>' + a[3] + '</small></button>').join('') + '</div>' +
  camCard() + (IE.qtCard ? IE.qtCard() : '') + '<button class="mock rise" data-go="mock">' + bd('trophy', 'M', 'lg') + '<div style="flex:1"><h3>Mock Test</h3><p>To‘liq imtihon sinovi: 4 ta bo‘lim ketma-ket</p></div>' + '<span class="chip" style="background:rgba(255,255,255,.22);color:#fff">' + (IE.mockActive && IE.mockActive() ? 'Davom' : 'Boshlash') + '</span></button></div>'); };

/* ---------- TOOLS: guruhlangan, qidiruv + tezkor lug‘at, statistikalar bilan ---------- */
const TR = 'ielts:toolrecent';
const TOOLS = () => {
  const st = S(), due = dueCount(), hist = (lsGet('ielts:dhist', []) || []).length, pods = st.lib.filter(x => x.k === 'p').length, arts = D.articles.items.length + st.lib.filter(x => x.k !== 'p').length;
  const bw = (st.typ || []).reduce((m, r) => Math.max(m, r.wpm || 0), 0), nb = IE.bookList ? IE.bookList().length : 0, cg = IE.camGroups ? IE.camGroups() : null, nc = cg ? cg.books.reduce((n, b) => n + b[1].size, 0) : 0, pl = IE.planToday ? IE.planToday() : null, lv = IE.level ? IE.level() : null;
  return [
    ['Lug‘at va so‘z boyligi', [
      ['dict', 'search', 'A', 'Dictionary', 'Ta’rif, tarjima, birikma, so‘z oilasi, UZ↔EN', 'dict', 'Yangi', hist ? hist + ' ta qidiruv' : 'AI bilan'],
      ['vocab', 'cards', 'V', 'Vocabulary', 'Mavzular va flesh-kartalar', 'vocab', '', Object.keys(st.srs).length + ' so‘z' + (due ? ' · ' + due + ' takror' : '')],
      ['dictold', 'search', 'A', 'Dictionary (eski)', 'Tezkor oddiy lug‘at: ta’rif, talaffuz, UZ tarjima', 'dictold', '', 'Tez'],
      ['strat', 'bulb', 'T', 'Strategiyalar', 'Har bir savol turi uchun usullar', 'strat', '', ''],
    ]],
    ['Tinglash va talaffuz', [
      ['podcasts', 'head', 'L', 'Podkastlar', 'Tayyor epizodlar, transkript, so‘z-so‘z', 'articles/tab/p', '', pods + ' epizod'],
      ['shadow', 'spk', 'S', 'Shadowing', 'Diktor ortidan takrorlang', 'shadow', '', ''],
      ['dictation', 'wave', 'L', 'Dictation', 'Eshiting va yozing', 'dictation', '', ''],
    ]],
    ['O‘qish va yozish', [
      ['articles', 'news', 'R', 'Maqolalar', 'Audio, lug‘at, grammatika, savollar', 'articles', '', arts + ' ta'],
      ['wsamples', 'doc', 'W', 'Writing namunalar', 'Band 8+ insho namunalari', 'writing/tab/s', '', (D.prompts.samples || []).length + ' namuna'],
      ['books', 'doc', 'R', 'Kitoblar (PDF)', 'Yuklang, o‘qing, reja tuzing, qidiring', 'books', '', nb ? nb + ' kitob' : ''],
      ['typing', 'type', 'G', 'Typing', 'Klaviatura tezligi — WPM', 'typing', '', bw ? 'Rekord ' + bw + ' WPM' : ''],
    ]],
    ['Reja va testlar', [
      ['plan', 'cal', 'T', 'Reja', 'Kunlik, haftalik, oylik reja', 'plan', '', pl ? pl.done + '/' + pl.total + ' bugun' : ''],
      ['agent', 'sparkl', 'A', 'AI yordamchi', 'Reja tuzadi, vazifa va so‘z qo‘shadi', '@agopen', 'Yangi', ''],
      ['groups', 'user', 'M', 'Guruhlar', 'Do‘stlar reytingi, o‘qituvchi sinfi, vazifalar', 'groups', 'Yangi', IE.grpList && IE.grpList().length ? IE.grpList().length + ' ta guruh' : ''],
      ['mb', 'cards', 'V', 'Xatolar banki', 'Xato savollar — takrorlash tizimi bilan', 'mb', 'Yangi', IE.bankStats && IE.bankStats().due ? IE.bankStats().due + ' takror' : ''],
      ['ana', 'bulb', 'W', 'Tahlil markazi', 'Toza urinishdan keyin: so‘zlar, xatolar, qayta yechish', 'ana', 'Yangi', IE.anaPending && IE.anaPending().length ? 'Kutmoqda' : ''],
      ['ach', 'star', 'M', 'Yutuqlar', 'Daraja, nishonlar, seriya', 'achievements', '', lv ? 'Daraja ' + lv.L : ''],
    ]],
  ];
};
const toolTile = t => '<button class="tool2" ' + (t[5][0] === '@' ? 'data-a="' + t[5].slice(1) + '"' : 'data-go="' + t[5] + '"') + ' data-k="' + esc((t[3] + ' ' + t[4]).toLowerCase()) + '">' + (t[6] ? '<span class="tnew">' + t[6] + '</span>' : '') + bd(t[1], t[2], 'lg') + '<b>' + t[3] + '</b><span class="td">' + t[4] + '</span>' + (t[7] ? '<span class="ts">' + esc(t[7]) + '</span>' : '') + '</button>';
IE.toolUse = r0 => { const map = { dict: 'dict', vocab: 'vocab', strat: 'strat', shadow: 'shadow', dictation: 'dictation', articles: 'articles', books: 'books', typing: 'typing', plan: 'plan', ana: 'ana', mb: 'mb', agent: 'agent', cambridge: 'cambridge', achievements: 'achievements' }; if (!map[r0]) return; const l = (lsGet(TR, []) || []).filter(x => x !== map[r0]); l.unshift(map[r0]); lsSet(TR, l.slice(0, 5)); };
R.tools = () => {
  const G = TOOLS(), all = G.flatMap(g => g[1]), rec = (lsGet(TR, []) || []).map(id => all.find(t => t[5].split('/')[0] === id || t[0] === id)).filter(Boolean).slice(0, 3), hist = (lsGet('ielts:dhist', []) || []).slice(0, 6);
  return page('tools', '<div class="hero" style="padding-bottom:84px"><div class="hi">O‘rganish vositalari</div><h1>Study Tools</h1></div><div class="lift">' +
    '<div class="tfeat rise"><div class="row">' + bd('search', 'A', 'lg') + '<div style="flex:1"><h3>Tezkor lug‘at</h3><p>So‘z yozing — ta’rif, tarjima, talaffuz, birikmalar. O‘zbekcha ham, gap ham bo‘ladi.</p></div></div>' +
    '<div class="tfq"><input id="tdq" placeholder="Masalan: mitigate…" autocomplete="off" autocapitalize="off" spellcheck="false" enterkeyhint="search"><button data-a="tdgo" aria-label="Qidirish">' + ic('next') + '</button></div>' +
    (hist.length ? '<div class="dchips" style="margin-top:10px">' + hist.map(x => '<button class="chip w" data-go="dict/' + encodeURIComponent(x.w) + '">' + esc(x.w) + '</button>').join('') + '</div>' : '') + '</div>' +
    (rec.length ? '<div class="sec"><h2>Davom ettirish</h2></div><div class="trec rise">' + rec.map(t => '<button class="item" ' + (t[5][0] === '@' ? 'data-a="' + t[5].slice(1) + '"' : 'data-go="' + t[5] + '"') + '>' + bd(t[1], t[2], 'sm') + '<div class="tx"><b>' + t[3] + '</b><span>' + esc(t[7] || t[4]) + '</span></div></button>').join('') + '</div>' : '') +
    G.map(g => '<div class="sec"><h2>' + g[0] + '</h2></div><div class="tools2 rise">' + g[1].map(toolTile).join('') + '</div>').join('') + '</div>');
};
A.tdgo = () => { const i = $('#tdq'), v = i ? i.value.trim() : ''; IE.go('dict' + (v ? '/' + encodeURIComponent(v) : '')); };
document.addEventListener('keydown', e => { if (e.key === 'Enter' && e.target && e.target.id === 'tdq') { e.preventDefault(); A.tdgo(); } });
const SOON = {
  listening: ['Listening', 'head', 'L', 'Audio matnlarni tinglab javob berish: 4 qism, 40 savol. Matnlar ovozli (TTS) o‘qiladi, yozuv bilan tekshirish bor.'],
  mock: ['Mock Test', 'trophy', 'M', 'To‘liq imtihon: Listening → Reading → Writing → Speaking, umumiy band bilan.'],
  ai: ['AI Speaking Tutor', 'spark', 'A', 'Inglizcha suhbat, xatolarni tuzatish, band bahosi va Writing insholarini tekshirish.'],
  articles: ['Articles', 'news', 'R', 'Qiziqarli maqolalar, so‘zlarni bosib tarjima qilish va lug‘atga qo‘shish.'],
  shadowing: ['Shadowing', 'spk', 'S', 'Gapni eshitib, orqasidan takrorlash — talaffuz va ritm uchun.'],
  dictation: ['Dictation', 'wave', 'L', 'Eshitib yozish mashqi: imlo va quloq uchun.'],
  typing: ['Typing', 'type', 'G', 'Inglizcha yozish tezligi va xatosiz terish mashqi.'],
  dict: ['Dictionary', 'search', 'A', 'Istalgan so‘zning ma’nosi, misollari va tarjimasi (AI bilan).']
};
R.soon = a => {
  const x = SOON[a[0]] || SOON.mock;
  return sub(x[0], a[0] === 'listening' || a[0] === 'mock' ? 'practice' : (a[0] === 'ai' ? 'home' : 'tools'), '<div class="lockc anim">' + bd(x[1], x[2], 'lg') + '<h2 style="font-size:22px">' + esc(x[0]) + '</h2>' + soonChip + '<p class="mu">' + esc(x[3]) + '</p><p class="mu sm">Hozircha <b>Reading</b>, <b>Writing</b>, <b>Speaking</b>, <b>so‘zlar</b> va <b>strategiyalar</b> ishlaydi.</p><button class="btn" data-go="practice">Mashqga qaytish</button></div>');
};

/* ---------- READING ---------- */
const nz = s => String(s == null ? '' : s).toLowerCase().replace(/[‘’`´]/g, '\'').replace(/[.,;:!?"“”()]/g, ' ').replace(/\s+/g, ' ').trim().replace(/^(a|an|the) /, '');
const isOk = (g, q, a) => {
  if (a == null || a === '') return false;
  if (g.type === 'fill') return q.a.some(x => nz(x) === nz(a));
  return a === q.a;
};
IE.isOk = isOk;
IE.allQ = p => p.groups.flatMap(g => g.qs.map(q => ({ g, q })));
const allQ = p => p.groups.flatMap(g => g.qs.map(q => ({ g, q })));
const sents = t => t.match(/[^.!?]+(?:[.!?]+["”’)]*)?\s*/g) || [t];
const RUNK = 'ielts:run', rk = id => RUNK + ':' + id;
R.reading = a => {
  if (a[0] && a[1] === 'run') return readRun(a[0]);
  if (a[0] && a[1] === 'result') return readRes(a[0]);
  const s = S();
  const inner = '<div class="pad">' + (IE.pracSeg ? IE.pracSeg('R') : '') + (IE.pracMode && IE.pracMode() === 'full' ? IE.pracFull('R') + '<div class="sec"><h2>Yoki bitta passage</h2></div>' : '') + IE.listPage('R') + '<p class="hint" style="margin-top:14px">' + ic('bulb') + ' 20 daqiqa, har matnda 13 savol; yakunda taxminiy band. Yangi matnlar muntazam qo‘shiladi.</p></div>';
  return sub('Reading', 'practice', inner);
};
const initRun = id => {
  const saved = lsGet(rk(id), null);
  if (saved && saved.id === id && Date.now() - saved.t0 < 3 * 36e5) V.run = saved;
  else { V.run = { id, ans: {}, t0: Date.now(), hl: {}, tab: 'text' }; lsSet(rk(id), V.run); }
  return V.run;
};
const tkBtn = (n, rev, fl) => rev ? '<button class="evb" data-a="ev" data-n="' + n + '">' + ic('target') + ' Dalil</button>' : (fl == null ? '' : '<button class="flg' + (fl ? ' on' : '') + '" data-a="flag" data-n="' + n + '" aria-label="Keyinroq tekshirish uchun belgilash">' + ic('flag') + '</button>');
function qBlock(g, q, a, rev, fl) {
  const n = q.n, ok = rev ? isOk(g, q, a) : null, AT = rev ? ' disabled' : '';
  let body = '', qt = '';
  if (g.type === 'heads') {
    qt = 'Paragraph <b>' + q.para + '</b>';
    body = '<select class="sel" data-in="sel" data-n="' + n + '"' + AT + '><option value="">Sarlavhani tanlang…</option>' + g.headings.map(h => '<option value="' + h.id + '"' + (a === h.id ? ' selected' : '') + '>' + h.id + '. ' + esc(h.t) + '</option>').join('') + '</select>';
  } else if (g.type === 'tfng') {
    qt = esc(q.q);
    body = '<div class="tf">' + ['TRUE', 'FALSE', 'NOT GIVEN'].map(v => '<button class="opt' + (a === v ? ' on' : '') + '"' + (rev ? '' : ' data-a="ans" data-n="' + n + '" data-v="' + v + '"') + '>' + v + '</button>').join('') + '</div>';
  } else if (g.type === 'mcq') {
    qt = esc(q.q);
    body = '<div class="opts">' + q.o.map((o, i) => '<button class="opt' + (a === i ? ' on' : '') + '"' + (rev ? '' : ' data-a="ans" data-n="' + n + '" data-v="' + i + '"') + '><i>' + 'ABCDEFGHIJ'[i] + '</i><span>' + esc(o) + '</span></button>').join('') + '</div>';
  } else {
    qt = g.summary ? 'Gap <b>' + n + '</b>' : esc(q.q);
    body = '<input class="fill" data-in="fill" data-n="' + n + '" value="' + esc(a || '') + '" placeholder="Javobingiz" autocomplete="off" autocapitalize="off" spellcheck="false"' + AT + '>';
  }
  let rv = '';
  if (rev) {
    let corr = g.type === 'heads' ? q.a + '. ' + (g.headings.find(h => h.id === q.a) || {}).t : g.type === 'mcq' ? 'ABCDEFGHIJ'[q.a] + '. ' + q.o[q.a] : Array.isArray(q.a) ? q.a.join(' / ') : q.a;
    rv = '<div class="why"><b>' + (ok ? 'To‘g‘ri' : 'Xato') + '</b>' + (ok ? '' : ' · Javob: <b style="color:var(--tx)">' + esc(corr) + '</b>') + '<br>' + esc(q.why || '') + '</div>';
  }
  return '<div class="q' + (rev ? (ok ? ' ok' : ' no') : '') + (fl ? ' flagged' : '') + '" id="q' + n + '"><div class="qt"><span class="qn">' + n + '</span>' + qt + tkBtn(n, rev, fl) + '</div>' + body + rv + '</div>';
}
const boldCaps = t => esc(t).replace(/\b[A-Z]{2,}(?:\/[A-Z]{2,})*(?:\s+(?:A\s+)?[A-Z]{2,}(?:\/[A-Z]{2,})*)*/g, m => '<b>' + m + '</b>');
const rangeTxt = p => { const ns = p.groups.flatMap(g => g.qs.map(q => q.n)); return ns.length ? Math.min(...ns) + '–' + Math.max(...ns) : ''; };
IE.rangeTxt = rangeTxt;
/** Kitobdagidek: gap — matn ichida (qo‘shma raqam bilan), qutida. */
function fillItem(g, q, a, rev, fl) {
  const n = q.n, ok = rev ? isOk(g, q, a) : null;
  const inp = '<span class="gap"><i class="gn">' + n + '</i><input class="fill gi" data-in="fill" data-n="' + n + '" value="' + esc(a || '') + '" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Savol ' + n + '"' + (rev ? ' disabled' : '') + '></span>';
  const parts = String(q.q || '').split(/_{3,}/), body = parts.length > 1 ? esc(parts[0]) + inp + esc(parts.slice(1).join('______')) : esc(q.q || '') + ' ' + inp;
  let rv = '';
  if (rev) { const corr = Array.isArray(q.a) ? q.a.join(' / ') : q.a; rv = ' <span class="mk ' + (ok ? 'ok' : 'no') + '">' + (ok ? '✓' : '✗') + '</span>' + (ok ? '' : ' <span class="ca">' + esc(corr) + '</span>') + (q.why ? '<div class="why">' + esc(q.why) + '</div>' : ''); }
  return '<li class="q' + (rev ? (ok ? ' ok' : ' no') : '') + (fl ? ' flagged' : '') + '" id="q' + n + '">' + body + tkBtn(n, rev, fl) + rv + '</li>';
}
function groupsHTML(p, ans, rev, flags) {
  return '<div class="qg bk">' + p.groups.map(g => {
    const body = g.type === 'fill' && !g.summary ? '<div class="notebox"><ul>' + g.qs.map(q => fillItem(g, q, ans[q.n], rev, flags ? !!flags[q.n] : undefined)).join('') + '</ul></div>' : g.qs.map(q => qBlock(g, q, ans[q.n], rev, flags ? !!flags[q.n] : undefined)).join('');
    return '<section class="qgrp t-' + g.type + '"><h3 class="qh">' + esc(g.title) + '</h3><div class="note">' + boldCaps(g.note) + '</div>' +
      (g.headings ? '<div class="hlist">' + g.headings.map(h => '<div><b>' + h.id + '</b>' + esc(h.t) + '</div>').join('') + '</div>' : '') +
      (g.summary ? '<div class="sum">' + esc(g.summary) + '</div>' : '') + body + '</section>';
  }).join('') + '</div>';
}
IE.qBlock = (...a) => qBlock(...a);
IE.groupsHTML = (...a) => groupsHTML(...a);
function readRun(id) {
  const p = D.reading.passages.find(x => x.id === id); if (!p) return R.reading([]);
  const r = V.run && V.run.id === id ? V.run : initRun(id), qs = allQ(p), done = qs.filter(x => r.ans[x.q.n] != null && r.ans[x.q.n] !== '').length;
  const left = IE.ftLeft ? IE.ftLeft(r, 'R') : 1200 - (Date.now() - r.t0) / 1000;
  const txt = '<div class="psg">' + (IE.tkTools ? IE.tkTools(p.id) : '') + '<div class="bkhd"><small>READING PASSAGE</small><p class="ins">You should spend about 20 minutes on Questions ' + rangeTxt(p) + ', which are based on the reading passage below.</p></div><h2>' + esc(p.title) + '</h2><div class="meta"><span class="chip">' + esc(p.topic) + '</span><span class="chip">' + esc(p.level) + '</span></div><p class="hint">' + ic('eye') + ' Gapni bosing — belgilanadi (sariq → yashil → o‘chadi).</p>' +
    p.paras.map(pa => '<div class="para"><b>' + pa.k + '</b><div data-pk="' + esc(pa.k) + '">' + sents(pa.t).map((s, i) => '<span class="s' + (r.hl[pa.k + i] === 1 ? ' hl' : r.hl[pa.k + i] === 2 ? ' hl2' : '') + '" data-a="hl" data-k="' + pa.k + i + '">' + esc(s) + '</span>').join('') + '</div></div>').join('') + '</div>';
  const inner = (IE.ftBanner ? IE.ftBanner('R') : '') + '<div class="tabs2 tgt"><button class="' + (r.tab !== 'q' ? 'on' : '') + '" data-a="rtab" data-v="text">Matn</button><button class="' + (r.tab === 'q' ? 'on' : '') + '" data-a="rtab" data-v="q">Savollar <span class="chip" style="margin-left:4px">' + done + '/' + qs.length + '</span></button></div>' +
    '<div class="tg"><div class="tg-l' + (r.tab === 'q' ? ' off' : '') + '">' + txt + '</div><div class="tg-r' + (r.tab !== 'q' ? ' off' : '') + '"><div class="bkhd"><small>QUESTIONS ' + rangeTxt(p) + '</small></div>' + groupsHTML(p, r.ans, false, r.flag || {}) + '</div></div>' +
    '<div style="height:120px"></div><div class="bar">' + (IE.partNav ? IE.partNav(p, 'r') : '') + '<div class="prog" style="margin-bottom:10px"><i id="pg" style="width:' + (done / qs.length * 100) + '%"></i></div><div class="barrow"><button class="btn ghost palb" data-a="pal" aria-label="Savollar paneli">' + ic('grid') + '<span id="cnt">' + done + '/' + qs.length + '</span></button><button class="btn" data-a="rsubmit">' + (IE.ftOn && IE.ftOn('R', id) ? 'Reading’ni yakunlash' : 'Topshirish') + '</button></div></div>';
  const o = sub(p.title, 'reading', inner, '<div class="tmr' + (left < 120 ? ' low' : '') + '" id="tm">' + ic('clock') + '<span>' + fmtT(left) + '</span></div>');
  o.mount = () => {
    if (IE.tkMount) IE.tkMount('R');
    IE.every(1000, () => { const l = IE.ftLeft ? IE.ftLeft(r, 'R') : 1200 - (Date.now() - r.t0) / 1000, t = $('#tm'); if (t) { t.lastChild.textContent = fmtT(l); t.classList.toggle('low', l < 120); } if (l <= 0) { IE.clearTimers(); readSubmit(true); } });
  };
  return o;
}
A.rtab = el => { V.run.tab = el.dataset.v; lsSet(rk(V.run.id), V.run); IE.draw(false); window.scrollTo(0, 0); };
A.hl = el => { const r = V.run, k = el.dataset.k, v = ((r.hl[k] || 0) + 1) % 3; if (v) r.hl[k] = v; else delete r.hl[k]; el.classList.toggle('hl', v === 1); el.classList.toggle('hl2', v === 2); lsSet(rk(r.id), r); };
const LRUNK = 'ielts:lrun';
const ctx = () => { const cr = IE.curRoute || ''; if (cr.startsWith('listening')) return { r: V.l, test: () => D.listening.tests.find(x => x.id === V.l.id), key: LRUNK + ':' + V.l.id }; if (cr.startsWith('article/') && V.art) return { r: V.art, test: () => IE.matSync(V.art.id), key: 'ielts:art:' + V.art.id }; return { r: V.run, test: () => D.reading.passages.find(x => x.id === V.run.id), key: rk(V.run.id) }; };
IE.ctx = ctx;
const refreshCount = () => {
  const c0 = ctx(), p = c0.test(), qs = allQ(p), done = qs.filter(x => c0.r.ans[x.q.n] != null && c0.r.ans[x.q.n] !== '').length;
  const c = $('#cnt'), g = $('#pg'); if (c) c.textContent = done + '/' + qs.length; if (g) g.style.width = (done / qs.length * 100) + '%';
};
A.ans = el => {
  const c0 = ctx(), n = el.dataset.n, g = el.closest('.q'); let v = el.dataset.v; if (/^\d+$/.test(v) && el.closest('.opts')) v = +v;
  if (c0.r.ans[n] === v) { delete c0.r.ans[n]; el.classList.remove('on'); }
  else { c0.r.ans[n] = v; $$('.opt', g).forEach(o => o.classList.toggle('on', o === el)); }
  lsSet(c0.key, c0.r); refreshCount();
};
IE.inp = (el) => {
  const c0 = ctx(); if (!c0.r || !el.dataset.n) return;
  const v = el.value; if (v === '') delete c0.r.ans[el.dataset.n]; else c0.r.ans[el.dataset.n] = v;
  lsSet(c0.key, c0.r); refreshCount();
};
A.rsubmit = () => {
  if (IE.ftOn && IE.ftOn('R', V.run.id)) return IE.ask('Reading’ni yakunlaysizmi?', 'Hamma passage javoblari topshiriladi va natija hisoblanadi.', 'Yakunlash', () => readSubmit(false));
  const p = D.reading.passages.find(x => x.id === V.run.id), qs = allQ(p), left = qs.filter(x => V.run.ans[x.q.n] == null || V.run.ans[x.q.n] === '').length;
  if (left) IE.ask('Topshirasizmi?', left + ' ta savolga javob bermadingiz. Baribir topshiramizmi?', 'Topshirish', () => readSubmit(false)); else readSubmit(false);
};
function readSubmit(auto) {
  if (IE.ftReadSubmit && IE.ftReadSubmit(auto)) return;
  const r = V.run; if (!r) return; const p = D.reading.passages.find(x => x.id === r.id), qs = allQ(p);
  const raw = qs.filter(x => isOk(x.g, x.q, r.ans[x.q.n])).length, secs = Math.min(1200, Math.round((Date.now() - r.t0) / 1000));
  const rec = { ts: Date.now(), p: r.id, raw, tot: qs.length, band: IE.band(raw, qs.length), secs, a: r.ans };
  S().reads.push(rec); IE.touchDay(); IE.save(true); try { localStorage.removeItem(rk(r.id)); } catch (e) { /* xotira yopiq */ }
  V.run = null; if (auto) IE.toast('Vaqt tugadi — javoblar topshirildi'); IE.go('reading/' + p.id + '/result'); setTimeout(() => { if (raw / qs.length >= .6) IE.confetti(); }, 350);
}
function readRes(id) {
  const p = D.reading.passages.find(x => x.id === id), rec = S().reads.filter(r => r.p === id).slice(-1)[0];
  if (!p || !rec) return R.reading([]);
  const pc = Math.round(rec.raw / rec.tot * 100);
  const inner = (IE.partNav ? '<div class="pad">' + IE.partNav(p, 'r') + '</div>' : '') + '<div class="res anim"><div class="lbl">Taxminiy band</div><div class="big">' + IE.bandTxt(rec.band) + '</div><div class="mu" style="margin-top:8px">' + rec.raw + ' / ' + rec.tot + ' to‘g‘ri (' + pc + '%) · ' + fmtT(rec.secs) + '</div>' +
    '<div class="card sm mu" style="margin-top:16px;text-align:left">' + ic('bulb') + ' Band — 40 savollik imtihon shkalasiga o‘tkazilgan taxminiy baho. Haqiqiy imtihonda 3 ta matn bo‘ladi.</div></div>' + (IE.anaCta ? IE.anaCta(rec) : '') + (IE.keyList ? IE.keyList(p, rec.a || {}) : '') + groupsHTML(p, rec.a || {}, true) +
    '<div class="pad" style="margin-top:8px"><div class="two"><button class="btn ghost" data-go="' + (IE.mockActive && IE.mockActive() ? 'mock' : 'reading') + '">' + (IE.mockActive && IE.mockActive() ? 'Mock testga qaytish' : 'Boshqa matn') + '</button><button class="btn" data-a="rretry" data-id="' + id + '">Qayta urinish</button></div>' + (IE.rcBtn ? IE.rcBtn({ kicker: 'Reading natijasi', big: IE.bandTxt(rec.band), bigLabel: 'Taxminiy band', sub: rec.raw + ' / ' + rec.tot + ' (' + pc + '%)', rows: [[String(p.title || '').slice(0, 26), rec.raw + '/' + rec.tot], ['Vaqt', fmtT(rec.secs)]], foot: 'IELTS Academic · Reading' }) : '') + '</div>';
  return sub('Natija', 'reading', inner);
}
A.rretry = el => { try { localStorage.removeItem(rk(el.dataset.id)); } catch (e) { /* */ } V.run = null; IE.go('reading/' + el.dataset.id + '/run'); };

/* ---------- WRITING ---------- */
const wlist = () => { let n = 0; const o = []; Object.entries(D.prompts.task2).forEach(([cat, arr]) => arr.forEach(t => o.push({ n: n++, cat, t }))); (IE.T1 || []).forEach(t => o.push({ n: 't1:' + t.id, cat: 'Task 1', t: t.text, task: '1', chart: t })); ((IE.camStore ? IE.camStore().writing : []) || []).forEach(u => o.push({ n: u.id, cat: 'Cambridge', t: u.text, priv: 1, task: u.task, cam: u.cam })); return o; };
const wfind = n => wlist().find(x => x.n === n);
const wmin = x => x && x.task === '1' ? 150 : 250;
IE.wprompt = n => (wfind(n) || {}).t || '';
const wc = t => (String(t).trim().match(/\S+/g) || []).length;
R.writing = a => {
  if (a[0] === 'p') return writeEd(/^\d+$/.test(a[1] || '') ? +a[1] : a[1]);
  if (a[0] === 's') return writeSample(a[1]);
  if (a[0] === 'h') return writeHist(+a[1]);
  const tab = a[0] === 'tab' ? a[1] : (V.wtab || 'p'); V.wtab = tab;
  const cats = Object.keys(D.prompts.task2).concat(['Task 1']).concat(wlist().some(x => x.priv) ? ['Cambridge'] : []), cat = V.wcat || 'all', s = S();
  let body = '';
  if (tab === 'p') {
    body = '<div class="seg"><button class="' + (cat === 'all' ? 'on' : '') + '" data-a="wcat" data-v="all">Hammasi</button>' + cats.map(c => '<button class="' + (cat === c ? 'on' : '') + '" data-a="wcat" data-v="' + esc(c) + '">' + esc(c) + '</button>').join('') + '</div><div class="lst">' +
      wlist().filter(x => cat === 'all' || x.cat === cat).map(x => { const d = s.drafts['w' + x.n], dn = s.writes.some(w => w.p === x.n); return '<button class="item" data-go="writing/p/' + x.n + '">' + bd('pen', 'W', 'sm') + '<div class="tx"><b style="white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden">' + esc(x.priv ? x.t.split(/\n/).filter(l => l.trim() && !/^you should spend|^write at least/i.test(l.trim()))[0] || x.t : x.chart ? x.t.split(/\n/)[0] : x.t) + '</b><span>' + esc(x.priv ? x.cam : x.cat) + (d && !d.del ? ' · qoralama bor' : '') + (dn ? ' · yozilgan' : '') + '</span></div></button>'; }).join('') + '</div>';
  } else if (tab === 's') {
    body = '<div class="lst">' + D.prompts.samples.map(x => '<button class="item" data-go="writing/s/' + x.id + '">' + bd('doc', 'W') + '<div class="tx"><b>Band ' + x.band + ' · ' + esc(x.type) + '</b><span style="white-space:normal;display:block">' + esc(x.prompt.slice(0, 90)) + '…</span></div></button>').join('') + '</div>';
  } else {
    const h = s.writes.slice().reverse();
    body = h.length ? (IE.wTrend ? IE.wTrend() : '') + '<div class="lst">' + h.map(w => '<button class="item" data-go="writing/h/' + w.ts + '">' + bd('pen', 'W', 'sm') + '<div class="tx"><b>' + w.words + ' so‘z · ' + Math.round(w.secs / 60) + ' daqiqa' + (w.rev ? ' · ↻ qayta yozilgan' : '') + '</b><span>' + ago(w.ts) + (w.ai ? ' · AI ' + IE.bandTxt(w.ai.overall) : '') + '</span></div></button>').join('') + '</div>' : '<div class="card empty">' + bd('pen', 'W') + 'Hali yozuv yo‘q.</div>';
  }
  return sub('Writing', 'practice', '<div class="pad"><div class="card" style="margin-bottom:14px"><div class="row">' + bd('pen', 'W', 'lg') + '<div style="flex:1"><b style="font-size:16px">Task 1 va Task 2</b><div class="sm mu">Task 1 — diagramma tavsifi: 20 daqiqa, 150+ so‘z. Task 2 — insho: 40 daqiqa, 250+ so‘z.</div></div></div></div>' +
    '<div class="tabs2" style="margin:0 0 12px;grid-template-columns:repeat(3,1fr)">' + [['p', 'Mavzular'], ['s', 'Namunalar'], ['h', 'Yozuvlarim']].map(t => '<button class="' + (tab === t[0] ? 'on' : '') + '" data-a="wtab" data-v="' + t[0] + '" style="padding:9px 2px;font-size:13px">' + t[1] + '</button>').join('') + '</div>' + body + '</div>');
};
A.wtab = el => { V.wtab = el.dataset.v; IE.draw(false); };
A.wcat = el => { V.wcat = el.dataset.v; IE.draw(false); };
function writeEd(n) {
  const x = wfind(n); if (!x) return R.writing([]);
  const k = 'w' + n, d = S().drafts[k], txt = d && !d.del ? d.x : '', min = wmin(x), t1 = x.task === '1';
  if (!V.w || V.w.n !== n) V.w = { n, t0: Date.now() - ((d && d.s) || 0) * 1000 };
  V.w.min = min;
  const c = wc(txt);
  const o = sub(t1 ? 'Task 1' : 'Task 2', x.priv ? 'cambridge' : 'writing', '<div class="pad"><div class="prompt">' + esc(x.t) + '</div>' + (t1 ? (x.chart ? IE.t1Chart(x.chart) : '<div id="wimg"></div>') : '') + '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:12px 0">' + (t1 ? '<span class="chip">1 Paraphrase</span><span class="chip">2 Overview</span><span class="chip">3 Detail</span><span class="chip">4 Detail</span>' : '<span class="chip">1 Kirish</span><span class="chip">2 Asosiy qism</span><span class="chip">3 Asosiy qism</span><span class="chip">4 Xulosa</span>') + '</div>' +
    '<textarea class="ed" id="ed" data-in="ed" placeholder="Inshoni shu yerda yozing…" spellcheck="true">' + esc(txt) + '</textarea><div class="wc' + (c >= min ? ' ok' : '') + '" id="wcn"><span><b>' + c + '</b> so‘z · kamida ' + min + '</span><span>' + ic('clock') + ' <span id="wt">' + fmtT((Date.now() - V.w.t0) / 1000) + '</span></span></div>' +
    '<button class="btn block" data-a="wfin" data-n="' + n + '">Tugatish</button></div>', '');
  o.mount = () => { IE.every(1000, () => { const t = $('#wt'); if (t && V.w) t.textContent = fmtT((Date.now() - V.w.t0) / 1000); }); if (t1 && !x.chart && IE.camWImg) IE.camWImg(x.n).then(d => { const b = $('#wimg'); if (b && d) b.innerHTML = '<img class="wchart" src="' + d + '" alt="Task 1 diagramma">'; }); };
  return o;
}
let wTimer;
IE.edInput = el => {
  const c = wc(el.value), mn = (V.w && V.w.min) || 250, n = $('#wcn'); if (n) { n.classList.toggle('ok', c >= mn); n.firstElementChild.innerHTML = '<b>' + c + '</b> so‘z · kamida ' + mn; }
  clearTimeout(wTimer); wTimer = setTimeout(() => { if (!V.w) return; S().drafts['w' + V.w.n] = { t: Date.now(), x: el.value, s: Math.round((Date.now() - V.w.t0) / 1000) }; IE.saveLocal(); }, 500);
};
A.wfin = el => {
  const n = /^\d+$/.test(el.dataset.n) ? +el.dataset.n : el.dataset.n, ed = $('#ed'), txt = ed.value, c = wc(txt);
  if (c < 30) return IE.toast('Avval kamida 30 so‘z yozing');
  const secs = Math.round((Date.now() - V.w.t0) / 1000), rec = { ts: Date.now(), p: n, words: c, secs, x: txt.slice(0, 8000) }; if (V.wrev && V.wrev.n === n) { rec.rev = V.wrev.from; V.wrev = null; }
  S().writes.push(rec); S().drafts['w' + n] = { t: Date.now(), x: '', del: true }; IE.touchDay(); IE.save(true); V.w = null; clearTimeout(wTimer); IE.clearTimers();
  const lst = ['Savolga to‘liq javob berdim (barcha qismlari)', 'Pozitsiyam boshidan oxirigacha aniq', 'Har paragrafda bitta asosiy g‘oya + sabab/misol', 'Bog‘lovchilarni (however, moreover…) me’yorida ishlatdim', 'Xilma-xil grammatika: shart, nisbiy gap, passiv', 'Imlo va artikllarni tekshirdim'];
  IE.sheet('<h2>Ajoyib, ' + c + ' so‘z!</h2><p class="mu sm" style="margin-bottom:8px">' + (c < ((V.w && V.w.min) || 250) ? 'Diqqat: imtihonda ' + ((V.w && V.w.min) || 250) + ' so‘zdan kam yozish ballni tushiradi.' : 'Hajm yetarli.') + ' Vaqt: ' + fmtT(secs) + '. O‘zingizni tekshiring:</p>' + lst.map(l => '<label class="ck"><input type="checkbox"><span>' + l + '</span></label>').join('') + '<div class="two" style="margin-top:16px"><button class="btn ghost" data-a="wsam">Namunalarni ko‘rish</button><button class="btn" data-a="wdone">Yopish</button></div><div id="aires" style="margin-top:14px"><button class="btn block" data-a="wai" data-ts="' + rec.ts + '">' + ic('spark') + ' AI bilan baholash</button></div>');
  IE.confetti();
};
A.wsam = () => { IE.closeSheet(); IE.go('writing/tab/s'); };
A.wdone = () => { IE.closeSheet(); IE.go(IE.mockActive && IE.mockActive() ? 'mock' : 'writing/tab/h'); };
function writeSample(id) {
  const x = D.prompts.samples.find(s => s.id === id); if (!x) return R.writing([]);
  return sub('Namuna · Band ' + x.band, 'writing/tab/s', '<div class="pad"><div class="prompt">' + esc(x.prompt) + '</div><div class="card essay" style="margin-top:14px">' + x.text.map(p => '<p>' + esc(p) + '</p>').join('') + '<div class="mu xs b">' + wc(x.text.join(' ')) + ' so‘z</div></div>' +
    '<div class="sec"><h2>Nega bu yaxshi insho?</h2></div><div class="card"><ul class="notes" style="margin:0;padding-left:20px">' + x.notes.map(n => '<li>' + esc(n) + '</li>').join('') + '</ul></div></div>');
}
function writeHist(ts) {
  const w = S().writes.find(x => x.ts === ts); if (!w) return R.writing([]);
  const pr = wfind(w.p);
  return sub('Yozuvim', 'writing/tab/h', '<div class="pad">' + (pr ? '<div class="prompt">' + esc(pr.t) + '</div>' : '') + '<div class="card essay" style="margin-top:14px">' + String(w.x || '').split(/\n+/).map(p => '<p>' + esc(p) + '</p>').join('') + '<div class="mu xs b">' + w.words + ' so‘z · ' + fmtD(w.ts) + '</div></div><div id="aires" style="margin-top:14px">' + (w.ai ? (IE.wCompare ? IE.wCompare(w) : '') + IE.aiHTML(w.ai) : '<button class="btn block" data-a="wai" data-ts="' + ts + '">' + ic('spark') + ' AI bilan baholash</button>') + '</div>' + (w.ai && pr ? '<button class="btn block wrevb" style="margin-top:14px" data-a="wrev" data-ts="' + ts + '">' + ic('edit') + ' Qayta yozish — baholangan insho ustida ishlash</button>' : '') + '<button class="btn block ghost" style="margin-top:10px" data-a="wcopy" data-ts="' + ts + '">Nusxalash</button>' + (IE.grpShareBtn ? IE.grpShareBtn(ts) : '') + (w.ai && IE.rcBtn ? IE.rcBtn({ kicker: 'Writing · AI baho', big: IE.bandTxt(w.ai.overall), bigLabel: 'Overall band', sub: w.words + ' so‘z', rows: [['Task Achievement/Response', w.ai.tr], ['Coherence & Cohesion', w.ai.cc], ['Lexical Resource', w.ai.lr], ['Grammar', w.ai.gra]], foot: 'IELTS Academic · Writing' }) : '') + '</div>');
}
A.wrev = el => { const w = S().writes.find(x => x.ts === +el.dataset.ts); if (!w) return; const n = w.p; S().drafts['w' + n] = { t: Date.now(), x: w.x || '', s: 0 }; V.w = null; V.wrev = { n, from: w.ts }; IE.saveLocal(); IE.toast('Insho muharrirga qo‘yildi — AI maslahatlari bo‘yicha tuzating'); IE.go('writing/p/' + n); };
A.wcopy = el => { const w = S().writes.find(x => x.ts === +el.dataset.ts); try { navigator.clipboard.writeText(w.x || ''); IE.toast('Nusxalandi'); } catch (e) { IE.toast('Nusxalab bo‘lmadi'); } };

/* ---------- SPEAKING ---------- */
R.speaking = a => {
  if (a[0] === '1') return sp1(+a[1]);
  if (a[0] === '2') return sp2(+a[1]);
  if (a[0] === '3') return sp3(+a[1]);
  const P = D.prompts;
  return sub('Speaking', 'practice', '<div class="pad"><div class="card" style="margin-bottom:6px"><div class="row">' + bd('mic', 'S', 'lg') + '<div style="flex:1"><b style="font-size:16px">3 qismli suhbat</b><div class="sm mu">Savolga javob bering, o‘zingizni yozib oling va qayta tinglang. Mikrofonga ruxsat so‘raladi.</div></div></div></div>' +
    '<div class="sec"><h2>Part 1 · Qisqa savollar</h2></div><div class="lst">' + P.sp1.map((t, i) => '<button class="item" data-go="speaking/1/' + i + '"><span class="bd sk-S sm num">' + (i + 1) + '</span>' + '<div class="tx"><b>' + esc(t.t) + '</b><span>' + t.q.length + ' savol</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>' +
    '<div class="sec"><h2>Part 2 · Cue card</h2></div><div class="lst">' + P.sp2.map((t, i) => '<button class="item" data-go="speaking/2/' + i + '"><span class="bd sk-S sm num">' + (i + 1) + '</span>' + '<div class="tx"><b style="white-space:normal">' + esc(t.t.replace('Describe ', '')) + '</b><span>1 daq tayyorgarlik · 2 daq nutq</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div>' +
    '<div class="sec"><h2>Part 3 · Muhokama</h2></div><div class="lst">' + P.sp2.map((t, i) => (t.f || []).length ? '<button class="item" data-go="speaking/3/' + i + '"><span class="bd sk-S sm num">' + (i + 1) + '</span><div class="tx"><b style="white-space:normal">' + esc(t.t.replace('Describe ', '')) + '</b><span>' + t.f.length + ' ta chuqur savol</span></div><span class="go">' + ic('next') + '</span></button>' : '').join('') + '</div></div>');
};
const micBtn = (on, act) => '<div class="rec"><button class="mic' + (on ? ' on' : '') + '" data-a="' + act + '" aria-label="Yozib olish">' + ic(on ? 'stop' : 'mic') + '</button></div>';
function sp1(i) {
  const t = D.prompts.sp1[i]; if (!t) return R.speaking([]);
  if (!V.s1 || V.s1.i !== i) V.s1 = { i, q: 0, rec: false, t0: 0, urls: {}, blobs: {}, secs: {}, ai: {} };
  const s = V.s1, key = i + ':' + s.q, url = s.urls[key];
  const o = sub('Part 1 · ' + t.t, 'speaking', '<div class="pad"><div class="prog" style="margin:4px 0 16px"><i style="width:' + ((s.q + 1) / t.q.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:8px">' + (s.q + 1) + ' / ' + t.q.length + '</div><div class="qcard">' + esc(t.q[s.q]) + '</div>' +
    '<p class="hint c" style="justify-content:center;margin-top:12px">' + ic('bulb') + ' 2–3 gapdan iborat javob bering: javob + sabab + misol.</p>' + micBtn(s.rec, 'sp1rec') +
    '<div class="big-t" id="bigt" style="font-size:28px">' + (s.rec ? fmtT((Date.now() - s.t0) / 1000) : '') + '</div>' + (url ? '<audio controls src="' + url + '"></audio><div id="sai" style="margin-top:12px">' + (s.ai[key] ? IE.speakHTML(s.ai[key]) : '<button class="btn block" data-a="sp1ai">' + ic('spark') + ' AI bilan baholash</button>') + '</div>' : '') +
    '<div class="two" style="margin-top:18px"><button class="btn ghost" data-a="sp1n" data-d="-1"' + (s.q ? '' : ' disabled') + '>Oldingi</button><button class="btn" data-a="sp1n" data-d="1">' + (s.q + 1 >= t.q.length ? 'Tugatish' : 'Keyingi') + '</button></div></div>');
  o.mount = () => { if (s.rec) IE.every(500, () => { const b = $('#bigt'); if (b) b.textContent = fmtT((Date.now() - s.t0) / 1000); }); };
  return o;
}
A.sp1rec = async () => {
  const s = V.s1; if (!s) return;
  if (s.rec) { const url = await IE.rec.stop(); s.rec = false; if (url) { const k = s.i + ':' + s.q; s.urls[k] = url; s.blobs[k] = IE.rec.lastBlob; s.secs[k] = (Date.now() - s.t0) / 1000; delete s.ai[k]; } IE.draw(false); return; }
  try { await IE.rec.start(); s.rec = true; s.t0 = Date.now(); IE.draw(false); } catch (e) { IE.toast(e && e.name === 'NotAllowedError' ? 'Mikrofonga ruxsat berilmadi' : (e.message || 'Yozib bo‘lmadi')); }
};
A.sp1n = async el => {
  const s = V.s1, t = D.prompts.sp1[s.i], d = +el.dataset.d; if (s.rec) { const u = await IE.rec.stop(); s.rec = false; if (u) { const k = s.i + ':' + s.q; s.urls[k] = u; s.blobs[k] = IE.rec.lastBlob; s.secs[k] = (Date.now() - s.t0) / 1000; delete s.ai[k]; } }
  if (s.q + d >= t.q.length) { if (!Object.keys(s.ai).length) S().speaks.push({ ts: Date.now(), k: '1', t: t.t }); IE.touchDay(); IE.save(true); IE.toast('Part 1 tugadi — barakalla!'); IE.confetti(); V.s1 = null; return IE.go(IE.mockActive && IE.mockActive() ? 'mock' : 'speaking'); }
  s.q = Math.max(0, s.q + d); IE.draw(false); window.scrollTo(0, 0);
};
/* Part 3 — muhokama savollari (Part 2 mavzusining davomi): har savolga alohida javob yoziladi va AI baholaydi */
function sp3(i) {
  const t = D.prompts.sp2[i]; if (!t || !(t.f || []).length) return R.speaking([]);
  if (!V.s3 || V.s3.i !== i) V.s3 = { i, q: 0, rec: false, t0: 0, urls: {}, blobs: {}, secs: {}, ai: {} };
  const s = V.s3, key = i + ':' + s.q, url = s.urls[key], qs = t.f;
  const o = sub('Part 3 · ' + t.t.replace('Describe ', ''), 'speaking', '<div class="pad"><div class="prog" style="margin:4px 0 16px"><i style="width:' + ((s.q + 1) / qs.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:8px">' + (s.q + 1) + ' / ' + qs.length + '</div><div class="qcard">' + esc(qs[s.q]) + '</div>' +
    '<p class="hint c" style="justify-content:center;margin-top:12px">' + ic('bulb') + ' 4–5 gap: fikr → sabab → misol → qarama-qarshi nuqtai nazar. Taxminan 30–45 soniya.</p>' + micBtn(s.rec, 'sp3rec') +
    '<div class="big-t" id="bigt" style="font-size:28px">' + (s.rec ? fmtT((Date.now() - s.t0) / 1000) : '') + '</div>' + (url ? '<audio controls src="' + url + '"></audio><div id="sai" style="margin-top:12px">' + (s.ai[key] ? IE.speakHTML(s.ai[key]) : '<button class="btn block" data-a="sp3ai">' + ic('spark') + ' AI bilan baholash</button>') + '</div>' : '') +
    '<div class="two" style="margin-top:18px"><button class="btn ghost" data-a="sp3n" data-d="-1"' + (s.q ? '' : ' disabled') + '>Oldingi</button><button class="btn" data-a="sp3n" data-d="1">' + (s.q + 1 >= qs.length ? 'Tugatish' : 'Keyingi') + '</button></div></div>');
  o.mount = () => { if (s.rec) IE.every(500, () => { const b = $('#bigt'); if (b) b.textContent = fmtT((Date.now() - s.t0) / 1000); }); };
  return o;
}
A.sp3rec = async () => {
  const s = V.s3; if (!s) return;
  if (s.rec) { const url = await IE.rec.stop(); s.rec = false; if (url) { const k = s.i + ':' + s.q; s.urls[k] = url; s.blobs[k] = IE.rec.lastBlob; s.secs[k] = (Date.now() - s.t0) / 1000; delete s.ai[k]; } IE.draw(false); return; }
  try { await IE.rec.start(); s.rec = true; s.t0 = Date.now(); IE.draw(false); } catch (e) { IE.toast(e && e.name === 'NotAllowedError' ? 'Mikrofonga ruxsat berilmadi' : (e.message || 'Yozib bo‘lmadi')); }
};
A.sp3n = async el => {
  const s = V.s3, t = D.prompts.sp2[s.i], d = +el.dataset.d; if (s.rec) { const u = await IE.rec.stop(); s.rec = false; if (u) { const k = s.i + ':' + s.q; s.urls[k] = u; s.blobs[k] = IE.rec.lastBlob; s.secs[k] = (Date.now() - s.t0) / 1000; delete s.ai[k]; } }
  if (s.q + d >= t.f.length) { if (!Object.keys(s.ai).length) S().speaks.push({ ts: Date.now(), k: '3', t: t.t.replace('Describe ', '') }); IE.touchDay(); IE.save(true); IE.toast('Part 3 tugadi — barakalla!'); IE.confetti(); V.s3 = null; return IE.go(IE.mockActive && IE.mockActive() ? 'mock' : 'speaking'); }
  s.q = Math.max(0, s.q + d); IE.draw(false); window.scrollTo(0, 0);
};
function sp2(i) {
  const t = D.prompts.sp2[i]; if (!t) return R.speaking([]);
  if (!V.s2 || V.s2.i !== i) V.s2 = { i, ph: 'read', t: 60, url: '', rec: false, notes: '', blob: null, secsUsed: 0, ai: null };
  const s = V.s2, cue = '<div class="cue"><div class="mu xs b" style="color:rgba(255,255,255,.8);letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px">Cue card</div><h2>' + esc(t.t) + '</h2><div style="margin-top:8px;font-size:14px">You should say:</div><ul>' + t.b.map(b => '<li>' + esc(b) + '</li>').join('') + '</ul></div>';
  let body = '';
  if (s.ph === 'read') body = '<p class="hint c" style="justify-content:center;margin:14px 0">' + ic('clock') + ' 1 daqiqa tayyorlanasiz, so‘ng 2 daqiqagacha gapirasiz.</p><button class="btn block" data-a="sp2go">Tayyorlanishni boshlash</button>';
  else if (s.ph === 'prep') body = '<div class="mu xs b c" style="margin:16px 0 4px;letter-spacing:.1em;text-transform:uppercase">Tayyorlanish</div><div class="big-t" id="bigt">' + fmtT(s.t) + '</div><textarea class="ed" data-in="notes" style="min-height:110px;margin-top:10px;font:15px/1.5 -apple-system,sans-serif" placeholder="Qisqa eslatmalar (kalit so‘zlar)…">' + esc(s.notes) + '</textarea><button class="btn block" style="margin-top:12px" data-a="sp2talk">Hoziroq gapirishni boshlash</button>';
  else if (s.ph === 'talk') body = '<div class="mu xs b c" style="margin:16px 0 0;letter-spacing:.1em;text-transform:uppercase">Gapiring' + (s.rec ? ' · yozilmoqda' : '') + '</div><div class="big-t" id="bigt">' + fmtT(s.t) + '</div>' + micBtn(s.rec, 'sp2stop').replace('data-a="sp2stop"', 'data-a="sp2stop"') + '<p class="hint c" style="justify-content:center">Kamida 1 daqiqa gapirishga harakat qiling.</p>';
  else body = '<div class="card c" style="margin-top:14px">' + bd('check', 'S', 'lg').replace('class="bd', 'style="margin:0 auto 8px" class="bd') + '<b style="font-size:17px">Part 2 tugadi!</b>' + (s.url ? '<audio controls src="' + s.url + '"></audio><div id="sai" style="margin-top:12px;text-align:left">' + (s.ai ? IE.speakHTML(s.ai) : '<button class="btn block" data-a="sp2ai">' + ic('spark') + ' AI bilan baholash</button>') + '</div>' : '<p class="mu sm">Yozuv saqlanmadi (mikrofon yo‘q).</p>') + '</div>' +
    '<div class="sec"><h2>Part 3 · Muhokama savollari</h2></div><div class="lst">' + t.f.map((q, k) => '<div class="card" style="padding:14px"><span class="chip" style="margin-bottom:6px">Savol ' + (k + 1) + '</span><div style="font-weight:700;line-height:1.4">' + esc(q) + '</div></div>').join('') + '</div><p class="hint" style="margin-top:10px">' + ic('bulb') + ' Har savolga 4–5 gap: fikr → sabab → misol → qarama-qarshi taraf.</p><div class="two" style="margin-top:12px"><button class="btn ghost" data-a="sp2re">Qayta urinish</button><button class="btn" data-a="sp2fin">Tugatdim</button></div>' + ((t.f || []).length ? '<button class="btn block ghost" style="margin-top:10px" data-a="sp2to3">' + ic('mic') + ' Part 3 ni gapirib mashq qilish</button>' : '');
  const o = sub('Part 2', 'speaking', '<div class="pad">' + cue + body + '</div>');
  o.mount = () => {
    if (s.ph !== 'prep' && s.ph !== 'talk') return;
    IE.every(1000, () => { s.t--; const b = $('#bigt'); if (b) b.textContent = fmtT(s.t); if (s.t <= 0) { IE.clearTimers(); s.ph === 'prep' ? A.sp2talk() : A.sp2stop(); } });
  };
  return o;
}
A.sp2go = () => { V.s2.ph = 'prep'; V.s2.t = 60; IE.draw(false); };
A.sp2talk = async () => {
  const s = V.s2; if (!s) return; s.ph = 'talk'; s.t = 120; s.rec = false;
  try { await IE.rec.start(); s.rec = true; } catch (e) { IE.toast(e && e.name === 'NotAllowedError' ? 'Mikrofonga ruxsat berilmadi — yozuvsiz davom etamiz' : 'Yozib bo‘lmadi — yozuvsiz davom etamiz'); }
  IE.draw(false);
};
A.sp2stop = async () => { const s = V.s2; if (!s) return; if (s.rec) { s.url = await IE.rec.stop(); s.blob = IE.rec.lastBlob; s.secsUsed = 120 - s.t; s.rec = false; } s.ph = 'done'; IE.draw(false); IE.confetti(); };
A.sp2re = () => { const i = V.s2.i; V.s2 = null; IE.draw(false); };
A.sp2fin = () => { const s = V.s2, t = D.prompts.sp2[s.i]; if (!s.ai) S().speaks.push({ ts: Date.now(), k: '2', t: t.t.replace('Describe ', '') }); IE.touchDay(); IE.save(true); V.s2 = null; IE.toast('Saqlandi'); IE.go(IE.mockActive && IE.mockActive() ? 'mock' : 'speaking'); };
A.sp2to3 = () => { const s = V.s2, i = s.i, t = D.prompts.sp2[i]; if (!s.ai) S().speaks.push({ ts: Date.now(), k: '2', t: t.t.replace('Describe ', '') }); IE.touchDay(); IE.save(true); V.s2 = null; IE.go('speaking/3/' + i); };
IE.inpNotes = el => { if (V.s2) V.s2.notes = el.value; };

/* ---------- SO‘ZLAR (lug‘at + flesh-karta) ---------- */
const topicWords = id => {
  if (/^cam\d+$/.test(id) && IE.cam) { const p = IE.cam.p.get(+id.slice(3)); return p ? { name: p.t, sub: p.s, words: p.words } : null; }
  if (id === 'my') return { name: 'Mening so‘zlarim', words: S().my };
  if (id.startsWith('ana:') && IE.anaTopic) return IE.anaTopic(id.slice(4));
  const t = D.vocab.topics.find(x => x.id === id); return t ? { name: t.name, icon: t.icon, words: t.words } : null;
};
const wordMap = () => { const m = new Map(); D.vocab.topics.forEach(t => t.words.forEach(w => m.set(w.id, w))); if (IE.cam) IE.cam.p.forEach(p => p.words.forEach(w => m.set(w.id, w))); S().my.forEach(w => m.set(w.id, w)); return m; };
IE.loadCam = async () => {
  const d = await IE.idbGet('cam'); if (!d || !d.p) { IE.cam = null; return; }
  const p = new Map(); d.p.forEach(x => p.set(x.i, { i: x.i, t: x.t, s: x.s, words: [] }));
  d.w.forEach(r => { const q = p.get(r[0]); if (q) q.words.push({ id: 'c' + r[0] + '.' + r[1] + '.' + r[2], w: r[3], pos: r[4], def: r[5], uz: r[6], ex: r[7] }); });
  IE.cam = { p, n: d.w.length, src: d.src };
};
const prog = ws => { const s = S().srs; return Math.round(ws.filter(w => s[w.id] && s[w.id].b >= 3).length / Math.max(1, ws.length) * 100); };
R.vocab = a => {
  if (a[0] === 't') return vocTopic(a[1]);
  if (a[0] === 'cards') return vocCards(a[1]);
  if (a[0] === 'review') return vocCards('review');
  if (a[0] === 'c') return vocCam();
  const due = dueCount();
  const inner = '<div class="pad">' + (due ? '<button class="mock rise" style="background:linear-gradient(135deg,#f472b6,#db2777);box-shadow:0 14px 28px -14px #db2777;margin:0 0 14px" data-go="vocab/review">' + bd('flame', 'V', 'lg').replace('sk-V', 'sk-V') + '<div style="flex:1"><h3>Takrorlash vaqti</h3><p>' + due + ' ta so‘z sizni kutmoqda</p></div>' + ic('next') + '</button>' : '') +
    '<div class="sec" style="margin-top:4px"><h2>Mavzular</h2><span class="mu xs">' + D.vocab.topics.reduce((n, t) => n + t.words.length, 0) + ' so‘z · 8+ daraja</span></div><div class="grid2">' +
    D.vocab.topics.map(t => '<button class="card rise" style="text-align:left;padding:14px;margin:0" data-go="vocab/t/' + t.id + '"><div style="font-size:30px;line-height:1">' + t.icon + '</div><div class="b" style="margin:8px 0 2px;font-size:14.5px">' + esc(t.name) + '</div><div class="mu xs">' + t.words.length + ' so‘z</div><div class="prog" style="margin-top:8px;height:6px"><i style="width:' + prog(t.words) + '%"></i></div></button>').join('') + '</div>' +
    '<div class="sec"><h2>Shaxsiy lug‘at</h2></div>' + (S().my.length ? '<button class="item" style="margin-bottom:10px" data-go="vocab/t/my">' + bd('star', 'A') + '<div class="tx"><b>Mening so‘zlarim</b><span>' + S().my.length + ' ta so‘z · Dictionary’dan qo‘shilgan</span></div><span class="go">' + ic('next') + '</span></button>' : '') + (IE.cam ? '<button class="item" data-go="vocab/c">' + bd('book', 'R') + '<div class="tx"><b>Cambridge so‘zlari</b><span>' + IE.cam.n + ' so‘z · ' + IE.cam.p.size + ' matn · faqat shu qurilmada</span></div><span class="go">' + ic('next') + '</span></button>'
      : '<div class="card"><div class="row">' + bd('down', 'R') + '<div style="flex:1"><b>Cambridge lug‘atini yuklash</b><div class="sm mu">O‘zingizdagi <code>cambridge-sozlar.json</code> faylini tanlang. Fayl serverga yuborilmaydi — faqat shu telefonda saqlanadi.</div></div></div><label class="btn block" style="margin-top:12px">Fayl tanlash<input type="file" accept=".json,application/json" id="camf" hidden></label></div>') + '</div>';
  return sub('So‘zlar', 'tools', inner);
};
IE.camImport = async file => {
  try {
    const d = JSON.parse(await file.text());
    if (!d || !Array.isArray(d.p) || !Array.isArray(d.w) || !d.w.length) throw new Error('format');
    await IE.idbSet('cam', { v: 1, src: d.src || '', p: d.p.map(x => ({ i: x.i, t: x.t, s: x.s })), w: d.w });
    await IE.loadCam(); IE.toast(IE.cam.n + ' ta so‘z yuklandi'); IE.draw(false);
  } catch (e) { IE.toast('Fayl mos emas: cambridge-sozlar.json kerak'); }
};
function vocCam() {
  if (!IE.cam) return R.vocab([]);
  const ps = [...IE.cam.p.values()].filter(p => p.words.length);
  const o = sub('Cambridge', 'vocab', '<div class="pad"><input class="search" id="vs" placeholder="Matn nomini qidiring…" data-in="vs"><div class="lst" id="vl">' + ps.map(p => '<button class="item" data-q="' + esc((p.t + ' ' + p.s).toLowerCase()) + '" data-go="vocab/t/cam' + p.i + '">' + bd('book', 'R', 'sm') + '<div class="tx"><b>' + esc(p.t) + '</b><span>' + esc(p.s) + ' · ' + p.words.length + ' so‘z</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div></div>');
  return o;
}
IE.vsearch = el => { const q = el.value.trim().toLowerCase(); $$('#vl .item').forEach(b => { b.classList.toggle('hide', !!q && !b.dataset.q.includes(q)); }); };
function vocTopic(id) {
  const t = topicWords(id); if (!t) return R.vocab([]);
  const s = S().srs, today = IE.dayNum(), nw = t.words.filter(w => !s[w.id]).length, dueN = t.words.filter(w => s[w.id] && s[w.id].d <= today).length;
  return sub(t.name, id.startsWith('cam') ? 'vocab/c' : 'vocab', '<div class="pad"><div class="card rise"><div class="row"><div style="flex:1"><b style="font-size:16px">' + t.words.length + ' so‘z</b><div class="sm mu">Yangi: ' + nw + ' · Takrorlash: ' + dueN + ' · O‘zlashtirilgan: ' + prog(t.words) + '%</div></div></div><button class="btn block" style="margin-top:12px" data-go="vocab/cards/' + id + '">' + ic('cards') + ' Flesh-karta</button></div>' +
    '<div class="card" style="margin-top:12px">' + t.words.map(w => '<div class="wrow"><b>' + esc(w.w) + '</b>' + (w.pos ? ' <span class="chip" style="display:inline-flex">' + esc(w.pos) + '</span>' : '') + '<span>' + esc(w.uz) + '</span>' + (w.def ? '<em>' + esc(w.def) + '</em>' : '') + (w.ex ? '<em>“' + esc(w.ex) + '”</em>' : '') + '</div>').join('') + '</div></div>');
}
function buildQ(id) {
  const s = S().srs, today = IE.dayNum();
  if (id === 'review') { const m = wordMap(); return shuffle(Object.entries(s).filter(([k, v]) => v.d <= today && m.has(k)).map(([k]) => m.get(k))).slice(0, 30); }
  const t = topicWords(id); if (!t) return [];
  const due = t.words.filter(w => s[w.id] && s[w.id].d <= today), fresh = t.words.filter(w => !s[w.id]);
  return [...shuffle(due), ...shuffle(fresh).slice(0, 12)].slice(0, 20);
}
function vocCards(id) {
  if (!V.fc || V.fc.id !== id) { const q = buildQ(id); V.fc = { id, q, i: 0, flip: false, know: 0, dont: 0, re: new Set(), total: q.length }; }
  const f = V.fc, back = id === 'review' ? 'vocab' : 'vocab/t/' + id;
  if (!f.q.length || f.i >= f.q.length) {
    const none = !f.total;
    return sub('Flesh-karta', back, '<div class="res anim">' + (none ? '<div class="big" style="font-size:52px">✓</div><div class="mu" style="margin:10px 0 20px">Hozircha takrorlaydigan so‘z yo‘q. Yangi mavzu tanlang!</div>' : '<div class="lbl">Seans tugadi</div><div class="big">' + f.know + '<span style="font-size:32px">/' + f.total + '</span></div><div class="mu" style="margin:10px 0 20px">Bildim: ' + f.know + ' · Qayta ko‘riladi: ' + f.dont + '</div>') + '<div class="two"><button class="btn ghost" data-go="' + back + '">Orqaga</button><button class="btn" data-a="fcagain">Yana</button></div></div>');
  }
  const w = f.q[f.i], o = sub('Flesh-karta', back, '<div class="pad"><div class="prog" style="margin:6px 0 6px"><i style="width:' + (f.i / f.q.length * 100) + '%"></i></div><div class="mu xs b c" style="margin-bottom:10px">' + (f.i + 1) + ' / ' + f.q.length + '</div>' +
    '<div class="fc' + (f.flip ? ' flip' : '') + '" data-a="fcflip"><div class="in"><div class="f a"><h2>' + esc(w.w) + '</h2>' + (w.pos ? '<small>' + esc(w.pos) + '</small>' : '') + '<button class="spk" data-a="say" data-t="' + esc(w.w) + '" aria-label="Eshitish">' + ic('spk') + '</button><small style="margin-top:14px">Bosing — ma’nosini ko‘ring</small></div>' +
    '<div class="f z"><h3>' + esc(w.uz || w.def) + '</h3>' + (w.def ? '<p>' + esc(w.def) + '</p>' : '') + (w.ex ? '<em>“' + esc(w.ex) + '”</em>' : '') + '</div></div></div>' +
    '<div id="fcb">' + fcBtns(f.flip) + '</div></div>');
  return o;
}
const fcBtns = fl => fl ? '<div class="two"><button class="btn dont" data-a="fcg" data-v="0">' + ic('x') + ' Bilmayman</button><button class="btn know" data-a="fcg" data-v="1">' + ic('check') + ' Bilaman</button></div>' : '<button class="btn block ghost" data-a="fcflip">Javobni ko‘rsatish</button>';
A.fcflip = () => { const f = V.fc; if (!f) return; f.flip = !f.flip; const c = $('.fc'), b = $('#fcb'); if (c) c.classList.toggle('flip', f.flip); if (b) b.innerHTML = fcBtns(f.flip); };
A.say = (el, e) => { if (e) e.stopPropagation(); IE.say(el.dataset.t); };
A.fcagain = () => { const id = V.fc.id; V.fc = null; IE.draw(false); };
A.fcg = el => {
  const f = V.fc, w = f.q[f.i], know = el.dataset.v === '1', s = S().srs, cur = s[w.id] || { b: 0 }, today = IE.dayNum();
  if (know) { const b = Math.min(5, (cur.b || 0) + 1); s[w.id] = { b, d: today + [0, 1, 3, 7, 16, 35][b], t: Date.now() }; f.know++; }
  else { s[w.id] = { b: 1, d: today, t: Date.now() }; f.dont++; if (!f.re.has(w.id)) { f.re.add(w.id); f.q.push(w); } }
  f.i++; f.flip = false; IE.touchDay(); IE.save();
  if (f.i >= f.q.length && f.know >= f.total * .6) IE.confetti();
  IE.draw(false);
};

/* ---------- STRATEGIYALAR ---------- */
const SKC = { R: 'R', L: 'L', W1: 'W', W2: 'W', S: 'S', G: 'G' };
R.strat = a => {
  const T = D.strategy;
  if (a[0]) {
    const x = T.items.find(i => i.id === a[0]); if (!x) return R.strat([]);
    return sub(x.t, 'strat', '<div class="pad st"><div class="card"><div class="row">' + bd(x.s === 'R' ? 'book' : x.s === 'L' ? 'head' : x.s[0] === 'W' ? 'pen' : x.s === 'S' ? 'mic' : 'bulb', SKC[x.s]) + '<div style="flex:1"><span class="chip">' + esc(T.skills[x.s]) + '</span>' + (x.tm ? ' <span class="chip">' + ic('clock') + ' ' + esc(x.tm) + '</span>' : '') + '</div></div><p style="margin-top:12px;line-height:1.55">' + esc(x.w) + '</p></div>' +
      '<h3>Qadamlar</h3><div class="card"><ol>' + x.st.map(s => '<li>' + esc(s) + '</li>').join('') + '</ol></div><h3>Tuzoqlar</h3><div class="card"><ul>' + x.tr.map(s => '<li>' + esc(s) + '</li>').join('') + '</ul></div>' + (x.b8 ? '<h3>Band 8+ uchun</h3><div class="tip8">' + esc(x.b8) + '</div>' : '') + '</div>');
  }
  const f = V.sk || 'all';
  return sub('Strategiyalar', 'tools', '<div class="pad"><div class="seg"><button class="' + (f === 'all' ? 'on' : '') + '" data-a="skf" data-v="all">Hammasi</button>' + Object.entries(T.skills).map(([k, v]) => '<button class="' + (f === k ? 'on' : '') + '" data-a="skf" data-v="' + k + '">' + esc(v) + '</button>').join('') + '</div><div class="lst">' +
    T.items.filter(x => f === 'all' || x.s === f).map(x => '<button class="item" data-go="strat/' + x.id + '">' + bd(x.s === 'R' ? 'book' : x.s === 'L' ? 'head' : x.s[0] === 'W' ? 'pen' : x.s === 'S' ? 'mic' : 'bulb', SKC[x.s], 'sm') + '<div class="tx"><b>' + esc(x.t) + '</b><span>' + esc(T.skills[x.s]) + (x.tm ? ' · ' + esc(x.tm) : '') + '</span></div><span class="go">' + ic('next') + '</span></button>').join('') + '</div></div>');
};
A.skf = el => { V.sk = el.dataset.v; IE.draw(false); };

/* ---------- PROFIL ---------- */
const LV = ['Beginner', 'Elementary', 'Intermediate', 'Upper-Intermediate', 'Advanced'];
A.theme = () => { const c = IE.theme(), n = c === 'auto' ? 'dark' : c === 'dark' ? 'light' : 'auto'; IE.setTheme(n); IE.draw(false, true); };
A.pwd = () => { IE.sheet('<h2>Yangi parol</h2><div class="fld" style="margin-top:12px"><input id="np" type="password" placeholder="Kamida 6 ta belgi" autocomplete="new-password"></div><button class="btn block" id="npok">Saqlash</button>'); $('#npok').onclick = async () => { const v = $('#np').value; if (v.length < 6) return IE.toast('Kamida 6 ta belgi'); try { await SB.changePassword(v); IE.closeSheet(); IE.toast('Parol o‘zgartirildi'); } catch (e) { IE.toast(IE.uzErr(e)); } }; };
A.camvdel = () => IE.ask('O‘chirilsinmi?', 'Cambridge so‘zlari bu qurilmadan o‘chadi. Keyin fayldan qayta yuklash mumkin.', 'O‘chirish', async () => { await IE.idbDel('cam'); IE.cam = null; IE.draw(false); });
A.logout = () => IE.ask('Chiqasizmi?', 'Natijalaringiz serverda saqlangan.', 'Chiqish', async () => { try { await IE.sync(); } catch (e) { /* offline */ } await SB.signOut(); try { localStorage.removeItem('ielts:state:v1'); localStorage.removeItem('ielts:run'); localStorage.removeItem('ielts:profile'); } catch (e) { /* */ } IE.setState(null); location.hash = ''; location.reload(); });
})();
