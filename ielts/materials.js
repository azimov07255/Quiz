/* IELTS · BY AZIMOV — Materiallar: maqolalar (audio bilan sinxron matn, lug‘at, grammatika, savollar, rasm) va podkastlar (transkript + tahlil). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $, $$, lsGet, lsSet, fmtT } = IE, S = () => IE.S(), R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const mmss = s => { s = Math.max(0, Math.floor(s || 0)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const nq = s => String(s || '').replace(/[’‘]/g, '\'').replace(/[“”]/g, '"').replace(/[—–]/g, '-').toLowerCase();
const sub = (title, back, inner, right) => ({ h: '<header class="top"><button class="ib" data-a="back" data-r="' + back + '" aria-label="Orqaga">' + ic('back') + '</button><h1>' + esc(title) + '</h1>' + (right || '') + '</header><div class="scr sub">' + inner + '</div>', sub: true });
const fmtDur = d => /^\d+$/.test(String(d)) ? mmss(+d) : String(d);
const spin = '<div style="padding-top:36vh"><div class="spin"></div></div>';

/* ---------- material ombori ---------- */
V.mats = V.mats || {}; V.mload = V.mload || {};
const saveMat = m => IE.idbSet('mat:' + m.id, m);
IE.matSync = id => {
  const b = D.articles.items.find(x => x.id === id); if (b) return Object.assign({ k: 'b' }, b);
  const meta = S().lib.find(x => x.id === id);
  if (V.mats[id]) { const mm = V.mats[id]; if (meta && mm.k === 'p' && (meta.au || meta.pl)) { const o = IE.fixAudio(meta.au || meta.pl), p = IE.fixAudio(meta.pl || meta.au); mm.audio = o; mm.alt = p && p !== o ? p : ''; } return mm; }
  if (!meta) return null;
  if (!V.mload[id]) { V.mload[id] = 1; IE.idbGet('mat:' + id).then(m => { if (m) { V.mats[id] = m; if ((IE.curRoute || '') === 'article/' + id) IE.draw(false); } }); }
  return { id, k: meta.k, title: meta.t, audio: IE.fixAudio(meta.au || meta.pl || ''), alt: meta.pl && meta.au && IE.fixAudio(meta.pl) !== IE.fixAudio(meta.au) ? IE.fixAudio(meta.pl) : '', dur: 0, img: meta.img ? { src: meta.img, credit: '', license: '', link: meta.src || '' } : null, src: meta.src || '', blocks: [], vocab: [], grammar: [], groups: [], stub: true };
};

/* ---------- gaplarga bo‘lish va bloklar ---------- */
const ABBR = new Set(['u.s.', 'u.n.', 'd.c.', 'a.m.', 'p.m.', 'dr.', 'mr.', 'mrs.', 'ms.', 'st.', 'jr.', 'no.', 'vs.', 'inc.', 'corp.', 'e.g.', 'i.e.']);
function splitSents(p) {
  const w = p.split(/\s+/), out = []; let buf = [];
  w.forEach((x, i) => {
    buf.push(x); const nx = w[i + 1];
    if (/[.!?]["”’)]*$/.test(x) && !ABBR.has(x.toLowerCase()) && (!nx || /^[A-Z“"‘(\d]/.test(nx))) { out.push(buf.join(' ')); buf = []; }
  });
  if (buf.length) out.push(buf.join(' ')); return out;
}
const isHead = p => p.length < 80 && !/[.]["”’)]*$/.test(p);
const blocksFromText = text => String(text).split(/\n{2,}/).map(p => p.trim()).filter(Boolean).map(p => isHead(p) ? { h: 1, x: p } : { s: splitSents(p).map(x => [0, x]) });
function blocksFromCues(cues) {
  const blocks = []; let cur = null, n = 0, prevEnd = -9;
  cues.forEach(c => { if (!cur || c.s - prevEnd > 1.2 || n >= 4) { cur = { s: [] }; blocks.push(cur); n = 0; } cur.s.push(c.w && c.w.length ? [c.s, c.t, c.w] : [c.s, c.t]); n++; prevEnd = c.e; });
  return blocks;
}
const allSents = m => m.blocks.flatMap((b, bi) => b.s ? b.s.map((s, si) => ({ bi, si, t: s[0], x: s[1] })) : []);
const findSent = (m, ex) => { const r = nq(ex); return allSents(m).find(s => nq(s.x).includes(r)) || null; };

/* ---------- so‘z tahlili ---------- */
const clean = w => String(w).toLowerCase().replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '');
const stemEq = (tok, key) => { if (!tok || !key) return false; if (tok === key) return true; const k = key.replace(/e$/, ''); return [key + 's', key + 'es', key + 'ed', key + 'd', key + 'ing', k + 'ing', key.replace(/y$/, 'ies'), key.replace(/y$/, 'ied')].includes(tok); };
const vocabFor = (m, tok) => (m.vocab || []).find(v => !/\s/.test(v.w) && stemEq(tok, v.w.toLowerCase()));
function wordsHTML(m, s) {
  const text = s[1], words = s[2];
  if (words && words.length) return words.map(w => '<span class="w" data-a="aword" data-w="' + esc(clean(w[0])) + '" data-ws="' + w[1] + '" data-we="' + w[2] + '">' + esc(w[0]) + '</span>').join(' ');
  return text.split(' ').map(tok => { const c = clean(tok), v = c && vocabFor(m, c); return '<span class="w' + (v ? ' vw' : '') + '" data-a="aword" data-w="' + esc(c) + '">' + esc(tok) + '</span>'; }).join(' ');
}
/** Podkast boshidagi reklama/kirish gaplarini aniqlaydi (dastur “Hello, welcome…” dan boshlanadi). */
const AD = /supported by ads|advertis|sponsor|www\.|\.(?:de|com|net)\b/i, foreign = x => (x.match(/[äöüßéèàçñ]/gi) || []).length >= 2;
IE.adInfo = m => {
  if (!m || m.k !== 'p') return { set: new Set(), start: null };
  const all = allSents(m).slice(0, 12); let st = -1;
  for (let i = 0; i < all.length; i++) { const x = all[i].x; if (AD.test(x) || foreign(x)) continue; if (/\b(hello|welcome|you'?re listening|this is)\b/i.test(x)) { st = i; break; } }
  return st > 0 ? { set: new Set(all.slice(0, st).map(s => s.bi + ':' + s.si)), start: all[st] } : { set: new Set(), start: null };
};
function textHTML(m) {
  const au = !!m.audio, ad = IE.adInfo(m).set;
  return m.blocks.map((b, bi) => b.h ? '<h3 class="ah">' + esc(b.x) + '</h3>' : '<p class="ap">' + b.s.map((s, si) => '<span class="snt' + (ad.has(bi + ':' + si) ? ' adx' : '') + '" data-t="' + s[0] + '"' + (s[2] && s[2].length ? ' data-wl="1"' : '') + '>' + (au && m.k !== 'a' ? '<i class="sp" data-a="aseek" data-t="' + s[0] + '">' + ic('play') + '</i>' : '') + wordsHTML(m, s) + ' </span>').join('') + '</p>').join('');
}

/* ---------- markaz (ro‘yxat + qo‘shish) ---------- */
const net = () => V.net || (V.net = { url: '', busy: '', err: '', feed: null, paste: false });
const SEEDK = 'ielts:seedpod:v1';
/** Tayyor podkastlar: birinchi marta ochilganda mening podkastlarimga qo‘shiladi (keyin o‘chirsa bo‘ladi). */
function seedPods() {
  if (lsGet(SEEDK, 0) || !D.podcasts || !D.podcasts.items) return;
  const lib = S().lib; let n = 0, t0 = Date.now() - 1e4;
  D.podcasts.items.forEach((it, i) => { if (lib.some(x => x.id === it.id || x.au === it.au)) return; lib.push({ id: it.id, k: 'p', t: it.t.slice(0, 120), au: it.au, img: it.img || '', src: '', show: it.show || '', ts: t0 - i, an: 0 }); n++; });
  lsSet(SEEDK, 1); if (n) IE.save(true);
}
const libRow = x => '<div class="item' + (V.newId === x.id ? ' fresh' : '') + '" style="padding:8px 8px 8px 12px"><button class="row" style="flex:1;min-width:0;text-align:left" data-go="article/' + x.id + '">' + (x.img && x.k === 'p' ? '<span class="aimg sm" style="background-image:url(\'' + esc(x.img) + '\')"></span>' : bd(x.k === 'p' ? 'head' : 'news', x.k === 'p' ? 'L' : 'R', 'sm')) + '<div class="tx"><b>' + esc(x.t) + '</b><span>' + esc(x.k === 'p' ? (x.show || 'Podkast') : 'Maqola') + (x.an ? ' · tahlil tayyor' : '') + '</span></div></button><button class="ib" data-a="ndel" data-id="' + x.id + '" aria-label="O‘chirish">' + ic('trash') + '</button></div>';
R.articles = a => {
  const tab = a[0] === 'tab' ? a[1] : (V.atab || 'a'); V.atab = tab; const s = S();
  if (tab === 'p') seedPods();
  const body = tab === 'a' ? webCard('a') + '<div class="lst">' + D.articles.items.map(m => {
    const last = s.arts.filter(r => r.id === m.id).slice(-1)[0];
    return '<button class="acard rise" data-go="article/' + m.id + '"><div class="aimg" style="background-image:url(\'' + esc(m.img.src) + '\')"></div><div class="abody"><b>' + esc(m.title) + '</b><span>' + esc(m.topic) + '</span><div class="ameta"><span class="chip">' + esc(m.level) + '</span><span class="chip">' + ic('book') + ' ' + m.mins + ' daq</span><span class="chip">' + ic('head') + ' ' + mmss(m.dur) + '</span>' + (last ? '<span class="chip ok">' + last.raw + '/' + last.tot + '</span>' : '') + '</div></div></button>';
  }).join('') + '</div><p class="hint" style="margin-top:14px">' + ic('bulb') + ' Audio — VOA Learning English; rasmlar — Wikimedia Commons (ommaviy mulk/CC). Matnni audio bilan birga kuzating, so‘zni bosing, lug‘at va grammatikani o‘rganing.</p>' + artAdd() : podsHTML();
  return sub(tab === 'p' ? 'Podkastlar' : 'Maqolalar', 'tools', '<div class="pad"><div class="tabs2" style="margin:0 0 14px"><button class="' + (tab === 'a' ? 'on' : '') + '" data-a="atabs" data-v="a">Maqolalar</button><button class="' + (tab === 'p' ? 'on' : '') + '" data-a="atabs" data-v="p">Podkastlar</button></div>' + body + '</div>');
};
A.atabs = el => IE.go('articles/tab/' + el.dataset.v);
const presets = () => (D.podcasts && D.podcasts.shows ? D.podcasts.shows : []).map(x => [x.name, x.feed]);
function podsHTML() {
  const n = net(), mine = S().lib.filter(x => x.k === 'p').slice().reverse(), open = n.openP || n.feed || n.err || n.busy === 'feed';
  const have = it => S().lib.some(x => x.au === it.au);
  const mineH = '<div class="sec" style="margin-top:0"><h2>Mening podkastlarim</h2></div>' + (mine.length ? '<div class="lst">' + mine.map(libRow).join('') + '</div>' : '<div class="card empty">Hali podkast yo‘q.</div>');
  const add = !open ? '<button class="btn block ghost" style="margin-top:16px" data-a="nopen">' + ic('search') + ' Podkast qidirish va qo‘shish</button>' :
    '<div class="card" style="margin-top:16px"><div class="row">' + bd('search', 'A') + '<div style="flex:1"><b>Podkast qo‘shish</b><div class="sm mu">Tayyor manbani tanlang yoki RSS havolasini qo‘ying. Audio AI bilan transkripsiya qilinadi (1–3 daqiqa, bir marta).</div></div></div>' +
    '<div class="seg" style="margin-top:10px;padding-bottom:4px">' + presets().map(p => '<button data-a="npre" data-u="' + esc(p[1]) + '">' + esc(p[0]) + '</button>').join('') + '</div>' +
    '<input class="search" id="nfu" style="margin:6px 0 10px" placeholder="https://…  (RSS havola)" value="' + esc(n.url) + '" autocapitalize="off" spellcheck="false">' +
    '<div class="two"><button class="btn sm" data-a="nfeed"' + (n.busy ? ' disabled' : '') + '>' + (n.busy === 'feed' ? 'Yuklanmoqda…' : 'Ro‘yxatni ochish') + '</button><button class="btn sm ghost" data-a="nclose">Yopish</button></div>' +
    (n.err ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(n.err) + '</p>' : '') + '</div>' +
    (n.feed ? '<div class="sec"><h2>' + esc(n.feed.title || 'Ro‘yxat') + '</h2></div><div class="lst">' + n.feed.items.map((it, i) => '<div class="item"><div class="tx"><b style="white-space:normal">' + esc(it.t) + '</b><span>' + esc(it.d.slice(0, 16)) + (it.dur ? ' · ' + esc(fmtDur(it.dur)) : '') + (it.au ? '' : ' · audio yo‘q') + '</span></div>' + (it.au && have(it) ? '<span class="chip ok">' + ic('check') + ' Qo‘shildi</span>' : '<button class="btn sm" data-a="nadd" data-i="' + i + '">Qo‘shish</button>') + '</div>').join('') + '</div>' : '');
  return webCard('p') + mineH + add;
}
function artAdd() {
  const n = net(), mine = S().lib.filter(x => x.k !== 'p').slice().reverse(), open = n.openA || n.paste || n.busy === 'art' || n.afeed || n.busy === 'af';
  return '<div class="sec"><h2>Mening maqolalarim</h2></div>' + (mine.length ? '<div class="lst">' + mine.map(libRow).join('') + '</div>' : '<div class="card empty">Hali maqola qo‘shilmagan.</div>') +
    (!open ? '<button class="btn block ghost" style="margin-top:16px" data-a="naopen">' + ic('plus') + ' Maqola qo‘shish</button>' :
    '<div class="card" style="margin-top:16px"><b>Maqola qo‘shish</b><div class="sm mu">Tayyor manbani tanlang, maqola havolasini qo‘ying yoki matnni qo‘lda kiriting — AI lug‘at, grammatika va savollar tuzadi.</div>' +
    '<div class="seg" style="margin-top:10px;padding-bottom:4px">' + APRE.map(p => '<button data-a="nprea" data-u="' + esc(p[1]) + '">' + esc(p[0]) + '</button>').join('') + '</div>' +
    '<input class="search" id="nau" style="margin:10px 0" placeholder="https://…  (maqola havolasi)" value="' + esc(n.aurl || '') + '" autocapitalize="off" spellcheck="false">' +
    '<div class="two"><button class="btn sm" data-a="nart"' + (n.busy ? ' disabled' : '') + '>' + (n.busy === 'art' ? 'Yuklanmoqda…' : 'Havoladan olish') + '</button><button class="btn sm ghost" data-a="nclose">Yopish</button></div>' +
    (n.err ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(n.err) + '</p>' : '') +
    '<button class="chip" style="margin-top:12px" data-a="npaste">' + ic('doc') + ' Matnni qo‘lda qo‘shish</button>' +
    (n.busy === 'af' ? '<div class="mu sm row" style="gap:8px;margin-top:10px"><div class="spin sm"></div> Ro‘yxat yuklanmoqda…</div>' : '') +
    (n.afeed ? '<div class="sec"><h2>' + esc(n.afeed.title || 'Ro‘yxat') + '</h2></div><div class="lst">' + n.afeed.items.filter(it => it.link).map((it, i) => '<div class="item"><div class="tx"><b style="white-space:normal">' + esc(it.t) + '</b><span>' + esc(it.d.slice(0, 16)) + '</span></div>' + (S().lib.some(x => x.src === it.link) ? '<span class="chip ok">' + ic('check') + ' Qo‘shildi</span>' : '<button class="btn sm" data-a="naadd" data-l="' + esc(it.link) + '"' + (n.busy ? ' disabled' : '') + '>Qo‘shish</button>') + '</div>').join('') + '</div>' : '') +
    (n.paste ? '<div style="margin-top:10px"><input class="search" id="ptt" placeholder="Sarlavha" style="margin-bottom:8px"><textarea class="ed" id="ptx" style="min-height:140px;font:15px/1.5 -apple-system,sans-serif" placeholder="Inglizcha matnni shu yerga qo‘ying…"></textarea><button class="btn sm block" style="margin-top:8px" data-a="npadd">Qo‘shish</button></div>' : '') + '</div>');
}
/* ---------- internetdan topib qo‘shish: Wikipedia (maqola) va iTunes katalogi (podkast) + RSS manbalar ---------- */
const APRE = [['BBC · Science', 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml'], ['BBC · Technology', 'https://feeds.bbci.co.uk/news/technology/rss.xml'], ['BBC · Health', 'https://feeds.bbci.co.uk/news/health/rss.xml'], ['BBC · Education', 'https://feeds.bbci.co.uk/news/education/rss.xml'], ['BBC · World', 'https://feeds.bbci.co.uk/news/world/rss.xml'], ['VOA Learning English', 'https://learningenglish.voanews.com/podcast/?count=20&zoneId=1689']];
const TOPICS = ['climate change', 'renewable energy', 'artificial intelligence', 'urbanisation', 'online education', 'public health', 'globalisation', 'space exploration', 'biodiversity', 'sleep', 'migration', 'tourism', 'cybersecurity', 'ocean pollution', 'memory and learning', 'sustainable transport', 'ageing population'];
const PODQ = ['english listening practice', 'ielts listening', 'bbc learning english', 'voa learning english', 'news in slow english', 'english conversation'];
const web = () => net().web || (net().web = { q: '', busy: '', err: '', res: null });
const pick = a => a[Math.random() * a.length | 0];
const jget = async u => { let r; try { r = await fetch(u); } catch (e) { const er = new Error('Internetga ulanib bo‘lmadi.'); er.net = true; throw er; } if (!r.ok) throw new Error('Manba javob bermadi (' + r.status + ')'); return r.json(); };
const wikiSearch = async q => {
  const d = await jget('https://en.wikipedia.org/w/api.php?action=query&generator=search&gsrsearch=' + encodeURIComponent(q) + '&gsrlimit=8&prop=extracts|pageimages&exintro=1&explaintext=1&exlimit=max&piprop=thumbnail&pithumbsize=900&format=json&origin=*');
  return Object.values((d.query && d.query.pages) || {}).sort((a, b) => (a.index || 0) - (b.index || 0)).map(p => ({ title: p.title, sn: String(p.extract || '').replace(/\s+/g, ' ').slice(0, 170), img: (p.thumbnail && p.thumbnail.source) || '', url: 'https://en.wikipedia.org/wiki/' + encodeURIComponent(p.title.replace(/ /g, '_')) })).filter(x => x.sn.length > 40);
};
const SKIP_SEC = /^(see also|references|external links|notes|further reading|sources|bibliography|citations|footnotes|gallery|footnotes and references)$/i;
const wikiFull = async title => {
  const d = await jget('https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&redirects=1&titles=' + encodeURIComponent(title) + '&format=json&origin=*'), pg = Object.values((d.query && d.query.pages) || {})[0];
  let skip = false; const out = []; let len = 0;
  String((pg && pg.extract) || '').split(/\n+/).map(x => x.trim()).filter(Boolean).forEach(l => {
    const h = /^=+\s*(.+?)\s*=+$/.exec(l); if (h) { skip = SKIP_SEC.test(h[1]); if (!skip && len < 9000) out.push(h[1]); return; }
    if (skip || len > 9000) return; out.push(l); len += l.length;
  });
  return out.join('\n\n');
};
async function addWiki(x, opt) {
  if (S().lib.some(m => m.src === x.url)) return null;
  const text = await wikiFull(x.title); if (text.length < 400) throw new Error('“' + x.title + '” maqolasi juda qisqa');
  return addArticle(x.title, text, x.url, x.img, opt);
}
function webCard(kind) {
  const w = web(), P = kind === 'p', busy = w.busy === kind, r = w.res && w.res.kind === kind ? w.res : null;
  const list = !r ? '' : r.kind === 'a' ? '<div class="lst" style="margin-top:12px">' + r.items.map((x, i) => '<div class="item"><div class="tx"><b style="white-space:normal">' + esc(x.title) + '</b><span style="white-space:normal;display:block">' + esc(x.sn) + '…</span></div>' + (S().lib.some(m => m.src === x.url) ? '<span class="chip ok">' + ic('check') + ' Qo‘shildi</span>' : '<button class="btn sm" data-a="nwadd" data-i="' + i + '"' + (w.busy ? ' disabled' : '') + '>Qo‘shish</button>') + '</div>').join('') + '</div>' :
    '<div class="lst" style="margin-top:12px">' + r.items.map((x, i) => '<div class="item">' + (x.img ? '<span class="aimg sm" style="background-image:url(\'' + esc(x.img) + '\')"></span>' : bd('head', 'L', 'sm')) + '<div class="tx"><b style="white-space:normal">' + esc(x.t) + '</b><span>' + esc(x.by) + '</span></div><button class="btn sm ghost" data-a="nwshow" data-i="' + i + '">Epizodlar</button></div>').join('') + '</div>';
  return '<div class="card rise webc" style="margin-bottom:14px"><div class="row">' + bd('search', 'A') + '<div style="flex:1"><b style="font-size:16px">Internetdan topib qo‘shish</b><div class="sm mu">' + (P ? 'Mavzu yozing — podkast katalogidan topib, eng mosini qo‘shaman.' : 'Mavzu yozing — Wikipedia’dan eng mos maqolani topib qo‘shaman.') + ' Bo‘sh qoldirsangiz, IELTS mavzusini o‘zim tanlayman.</div></div></div>' +
    '<input class="search" id="nwq" style="margin:10px 0" placeholder="' + (P ? 'masalan: ielts listening' : 'masalan: climate change') + '" value="' + esc(w.q || '') + '" autocapitalize="off" spellcheck="false">' +
    '<button class="btn block" data-a="nweb"' + (w.busy ? ' disabled' : '') + '>' + (busy ? '<span class="spin sm" style="display:inline-block;vertical-align:-3px;margin-right:6px"></span> Qidirilmoqda…' : ic('spark') + ' Topib qo‘shish') + '</button>' +
    (w.err && w.errK === kind ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(w.err) + '</p>' : '') + list + '</div>';
}
A.nweb = async () => {
  const w = web(), P = V.atab === 'p', kind = P ? 'p' : 'a', typed = readUrl('#nwq'); w.q = typed; w.busy = kind; w.err = ''; w.errK = kind; w.res = null; IE.draw(false);
  const q = typed || pick(P ? PODQ : TOPICS);
  try {
    if (!P) {
      const items = await wikiSearch(q); if (!items.length) throw new Error('“' + q + '” bo‘yicha maqola topilmadi. Boshqacha yozib ko‘ring.');
      w.res = { kind, q, items };
      let added = null; for (const x of items.slice(0, 3)) { try { added = await addWiki(x, { stay: true }); if (added) break; } catch (e) { if (e.net) throw e; } }
      if (!added) IE.toast('Ro‘yxatdagilar allaqachon qo‘shilgan yoki juda qisqa');
    } else {
      const d = await jget('https://itunes.apple.com/search?media=podcast&limit=8&term=' + encodeURIComponent(q)), items = (d.results || []).filter(x => x.feedUrl).map(x => ({ t: x.collectionName || x.trackName, by: x.artistName || '', feed: x.feedUrl, img: x.artworkUrl100 || '' }));
      if (!items.length) throw new Error('“' + q + '” bo‘yicha podkast topilmadi.');
      w.res = { kind, q, items };
      const feed = await IE.ai({ action: 'feed', url: items[0].feed }), it = (feed.items || []).find(x => x.au && !S().lib.some(m => m.au === x.au));
      if (it) { addPod(it, feed); IE.toast('Qo‘shildi: ' + it.t.slice(0, 40)); } else IE.toast('Birinchi podkastda yangi epizod topilmadi — pastdan boshqasini tanlang');
    }
  } catch (e) { w.err = e.net ? e.message : (e.message || 'Xatolik'); w.res = w.res || null; }
  w.busy = ''; if (location.hash.startsWith('#/articles')) { IE.draw(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }
};
A.nwadd = async el => {
  const w = web(), x = w.res && w.res.items[+el.dataset.i]; if (!x || w.busy) return; w.busy = 'a'; w.err = ''; w.errK = 'a'; IE.draw(false);
  try { await addWiki(x, { stay: true }); } catch (e) { w.err = e.message || 'Xatolik'; }
  w.busy = ''; IE.draw(false);
};
A.nwshow = async el => { const w = web(), x = w.res && w.res.items[+el.dataset.i]; if (!x) return; const n = net(); n.url = x.feed; n.openP = true; w.res = null; IE.draw(false); A.nfeed(); };
A.nprea = async el => {
  const n = net(); n.openA = true; n.afeed = null; n.busy = 'af'; n.err = ''; IE.draw(false);
  try { n.afeed = await IE.ai({ action: 'feed', url: el.dataset.u }); } catch (e) { n.err = e.message; }
  n.busy = ''; if (location.hash.startsWith('#/articles')) IE.draw(false);
};
A.naadd = async el => {
  const n = net(), link = el.dataset.l; if (!link || n.busy) return; n.busy = 'art'; n.err = ''; IE.draw(false);
  try { const d = await IE.ai({ action: 'article', url: link }); await addArticle(d.title, d.text, link, d.image, { stay: true }); } catch (e) { n.err = e.message; }
  n.busy = ''; if (location.hash.startsWith('#/articles')) IE.draw(false);
};
A.nopen = () => { net().openP = true; IE.draw(false); };
A.naopen = () => { net().openA = true; IE.draw(false); };
A.nclose = () => { const n = net(); n.openP = n.openA = n.paste = false; n.feed = null; n.afeed = null; n.err = ''; IE.draw(false); };
A.npre = el => { const n = net(); n.url = el.dataset.u; n.openP = true; IE.draw(false); A.nfeed(); };
A.npaste = () => { net().paste = !net().paste; IE.draw(false); };
const readUrl = id => { const i = $(id); return i ? i.value.trim() : ''; };
A.nfeed = async () => {
  const n = net(); n.url = readUrl('#nfu') || n.url; if (!/^https?:\/\//i.test(n.url)) { n.err = 'To‘liq havola yozing (https:// bilan).'; return IE.draw(false); }
  n.busy = 'feed'; n.err = ''; IE.draw(false);
  try { n.feed = await IE.ai({ action: 'feed', url: n.url }); } catch (e) { n.err = e.message; n.feed = null; }
  n.busy = ''; if (location.hash.startsWith('#/articles')) IE.draw(false);
};
A.nart = async () => {
  const n = net(); n.aurl = readUrl('#nau') || n.aurl || ''; if (!/^https?:\/\//i.test(n.aurl)) { n.err = 'To‘liq havola yozing (https:// bilan).'; return IE.draw(false); }
  n.busy = 'art'; n.err = ''; IE.draw(false);
  try { const d = await IE.ai({ action: 'article', url: n.aurl }); await addArticle(d.title, d.text, n.aurl, d.image); } catch (e) { n.err = e.message; }
  n.busy = ''; if (location.hash.startsWith('#/articles')) IE.draw(false);
};
async function addArticle(title, text, src, image, opt) {
  const id = 'u' + Date.now(), m = { id, k: 'a', title: String(title || 'Maqola').slice(0, 120), audio: '', dur: 0, img: image ? { src: image, credit: src ? new URL(src).hostname : '', license: '', link: src || '' } : null, src: src || '', blocks: blocksFromText(text), vocab: [], grammar: [], groups: [] };
  await saveMat(m); V.mats[id] = m; S().lib.push({ id, k: 'a', t: m.title, au: '', img: image || '', src: src || '', ts: Date.now(), an: 0 }); IE.touchDay(); IE.save(true); IE.toast('Maqola qo‘shildi'); if (opt && opt.stay) { V.newId = id; setTimeout(() => { V.newId = null; }, 4000); return id; } IE.go('article/' + id);
}
A.npadd = async () => { const t = $('#ptt'), x = $('#ptx'); if (!x || x.value.trim().length < 300) return IE.toast('Matn kamida 300 belgi bo‘lsin'); await addArticle((t && t.value.trim()) || 'Mening matnim', x.value.trim(), '', ''); };
function addPod(it, feed) { const id = 'u' + Date.now(); S().lib.push({ id, k: 'p', t: it.t.slice(0, 120), au: it.au, img: it.img || (feed && feed.image) || '', src: it.link || '', show: ((feed && feed.title) || '').slice(0, 60), ts: Date.now(), an: 0 }); V.newId = id; IE.touchDay(); IE.save(true); return id; }
A.nadd = async el => {
  const n = net(), it = n.feed && n.feed.items[+el.dataset.i]; if (!it) return;
  if (!it.au) return IE.toast('Bu elementda audio yo‘q');
  if (S().lib.some(x => x.au === it.au)) return IE.toast('Bu podkast allaqachon qo‘shilgan');
  addPod(it, n.feed);
  IE.toast('Qo‘shildi — “Mening podkastlarim” ro‘yxatining tepasida'); IE.draw(false); window.scrollTo({ top: 0, behavior: 'smooth' }); setTimeout(() => { V.newId = null; }, 4000);
};
A.ndel = el => IE.ask('O‘chirilsinmi?', 'Material va uning tahlili o‘chadi.', 'O‘chirish', async () => { const id = el.dataset.id; S().lib = S().lib.filter(x => x.id !== id); delete V.mats[id]; try { await IE.idbDel('mat:' + id); localStorage.removeItem('ielts:art:' + id); } catch (e) { /* */ } IE.save(true); IE.draw(false); });

/* ---------- o‘quvchi ---------- */
const keyOf = id => 'ielts:art:' + id;
function stateFor(id) { if (!V.art || V.art.id !== id) { const sv = lsGet(keyOf(id), null); V.art = { id, ans: (sv && sv.ans) || {}, done: !!(sv && sv.done), follow: true }; } return V.art; }
const hasAnalysis = m => (m.vocab && m.vocab.length) || (m.groups && m.groups.length);
const aiCTA = (m, what) => !m.blocks.length ? '<div class="card empty">Avval transkript kerak.</div>' : '<div class="card c">' + bd('spark', 'A', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<b>' + what + '</b><p class="mu sm" style="margin:6px 0 12px">AI matnni tahlil qilib lug‘at, grammatika va savollarni tuzadi (≈20 soniya).</p>' + (V.art.busy === 'an' ? '<div class="spin"></div>' : '<button class="btn" data-a="aan">' + ic('spark') + ' Tahlil qilish</button>') + (V.art.err ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(V.art.err) + '</p>' : '') + '</div>';

function vocabHTML(m) {
  if (!m.vocab.length) return aiCTA(m, 'Lug‘at hali yo‘q');
  const have = new Set(S().my.map(x => x.id)), left = m.vocab.filter(v => !have.has('my:' + v.w.toLowerCase())).length;
  return '<div class="row" style="margin:0 2px 10px"><span class="mu sm" style="flex:1">' + m.vocab.length + ' ta so‘z · matnda tagiga chizilgan</span>' + (left ? '<button class="btn sm" data-a="vall">' + ic('star') + ' Hammasini qo‘shish</button>' : '<span class="chip ok">' + ic('check') + ' Hammasi lug‘atda</span>') + '</div>' +
    '<div class="lst">' + m.vocab.map((v, i) => { const added = have.has('my:' + v.w.toLowerCase()); return '<div class="vcard"><div class="row"><b class="vw2">' + esc(v.w) + '</b><span class="chip">' + esc(v.pos) + '</span><span style="flex:1"></span><button class="ib sm2" data-a="say" data-t="' + esc(v.w) + '" aria-label="Eshitish">' + ic('spk') + '</button><button class="ib sm2' + (added ? ' on' : '') + '" data-a="vadd" data-i="' + i + '" aria-label="Lug‘atga qo‘shish">' + ic(added ? 'check' : 'star') + '</button></div><div class="vuz">' + esc(v.uz) + '</div>' + (v.ex ? '<div class="vex">' + (m.audio && v.t != null ? '<i class="sp" data-a="aseek" data-t="' + v.t + '">' + ic('play') + '</i>' : '') + '“…' + esc(v.ex) + '…”</div>' : '') + '</div>'; }).join('') + '</div>';
}
function grammarHTML(m) {
  if (!m.grammar.length) return aiCTA(m, 'Grammatika hali yo‘q');
  return '<div class="lst">' + m.grammar.map(g => '<div class="card"><h3 style="font-size:16px;font-weight:800">' + esc(g.t) + '</h3><p class="sm" style="margin:6px 0 10px;line-height:1.55">' + esc(g.r) + '</p>' + g.ex.map(e => '<div class="vex">' + (m.audio ? '<i class="sp" data-a="aseek" data-t="' + e.t + '">' + ic('play') + '</i>' : '') + '“' + esc(e.x) + '”</div>').join('') + '</div>').join('') + '</div>';
}
function qsHTML(m) {
  if (!m.groups.length) return aiCTA(m, 'Savollar hali yo‘q');
  const st = V.art; let html = IE.groupsHTML(m, st.ans, st.done);
  if (st.done && m.audio) html = html.replace(/<div class="q (ok|no)" id="q(\d+)">/g, (m0, c, n) => { const q = IE.allQ(m).find(x => x.q.n === +n).q; return m0 + '<button class="chip lseekb" data-a="aseek" data-t="' + (q.t || 0) + '">' + ic('play') + ' ' + mmss(q.t || 0) + ' dan tinglash</button>'; });
  const qs = IE.allQ(m), raw = st.done ? qs.filter(x => IE.isOk(x.g, x.q, st.ans[x.q.n])).length : 0;
  return (st.done ? '<div class="res" style="padding:12px 0 0"><div class="lbl">Natija</div><div class="big" style="font-size:56px">' + raw + '<span style="font-size:28px">/' + qs.length + '</span></div></div>' : '') + html +
    (st.done ? '<button class="btn block ghost" style="margin-top:6px" data-a="aretry">Qayta urinish</button>' : '<div style="height:70px"></div><div class="bar"><button class="btn block" data-a="achk">Tekshirish <span class="chip" id="cnt" style="margin-left:6px;background:rgba(255,255,255,.22);color:#fff">' + qs.filter(x => st.ans[x.q.n] != null && st.ans[x.q.n] !== '').length + '/' + qs.length + '</span></button></div>');
}
const credit = m => m.img && m.img.credit ? '<div class="icr">Rasm: ' + esc(m.img.credit) + (m.img.license ? ' · ' + esc(m.img.license) : '') + (m.img.link ? ' · <a href="' + esc(m.img.link) + '" target="_blank" rel="noopener">manba</a>' : '') + '</div>' : '';

R.article = a => {
  const id = a[0], m = IE.matSync(id); if (!m) return R.articles([]);
  const st = stateFor(id), tab = st.tab || 'text', stub = m.stub && !m.blocks.length;
  const meta = S().lib.find(x => x.id === id);
  const hero = '<div class="ahero">' + (m.img ? '<div class="aimg big" style="background-image:url(\'' + esc(m.img.src) + '\')"></div>' : '<div class="aimg big ph">' + ic(m.k === 'p' ? 'head' : 'news') + '</div>') + '<div class="aover"><h1>' + esc(m.title) + '</h1></div></div>' + credit(m) +
    '<div class="ameta" style="margin:10px 2px">' + (m.topic ? '<span class="chip">' + esc(m.topic) + '</span>' : '') + (m.level ? '<span class="chip">' + esc(m.level) + '</span>' : '') + (m.mins ? '<span class="chip">' + ic('book') + ' ' + m.mins + ' daq</span>' : '') + (m.src && m.k !== 'b' ? '<a class="chip" href="' + esc(m.src) + '" target="_blank" rel="noopener">manba</a>' : '') + '</div>';
  const player = m.audio ? '<div class="lsticky">' + IE.player({ audio: m.audio, alt: m.alt || '', dur: m.dur || 0 }, 'practice') + '<label class="follow"><input type="checkbox" data-in="afollow"' + (st.follow ? ' checked' : '') + '> Matn audio bilan birga yursin</label><button class="chip syncb" data-a="sync">' + ic('clock') + ' Sinxron' + (IE.artShift(id) ? ' (' + (IE.artShift(id) > 0 ? '+' : '') + IE.artShift(id).toFixed(1) + 's)' : '') + '</button></div>' : '';
  const tabs = ['text', 'vocab', 'grammar', 'qs'], lbl = { text: 'Matn', vocab: 'Lug‘at', grammar: 'Grammatika', qs: 'Savollar' };
  const trBlock = stub ? '<div class="card c">' + bd('wave', 'L', 'lg').replace('class="bd', 'style="margin:0 auto 10px" class="bd') + '<b>' + (m.audio ? 'Transkript hali yo‘q' : 'Matn yuklanmoqda…') + '</b><p class="mu sm" style="margin:6px 0 12px">' + (m.audio ? 'AI audioni tinglab so‘zma-so‘z matn tuzadi (vaqtlari bilan). Odatda 1–3 daqiqa.' : '') + '</p>' + (st.busy === 'tr' ? '<div class="spin"></div><p class="mu sm c" style="margin-top:8px">Transkript tuzilmoqda…</p>' : (m.audio ? '<button class="btn" data-a="atr">' + ic('spark') + ' Transkript tuzish</button>' : '')) + (st.err ? '<p class="sm" style="color:var(--bad);font-weight:600;margin-top:10px">' + esc(st.err) + '</p>' : '') + '</div>' : '';
  const inner = '<div class="pad">' + hero + '</div>' + player + '<div class="pad"><div class="tabs4">' + tabs.map(t => '<button class="' + (t === tab ? 'on' : '') + '" data-a="atab" data-v="' + t + '">' + lbl[t] + '</button>').join('') + '</div>' +
    '<div class="apanel' + (st.phr ? ' phr' : '') + '" data-p="text"' + (tab === 'text' ? '' : ' hidden') + '>' + (stub ? trBlock : '<p class="hint">' + ic('eye') + ' So‘zni bossangiz — ma’nosi chiqadi' + (m.audio ? '; ▶ — shu gapdan tinglash' : '') + '. Ibora (phrasal verb, collocation) uchun matnni belgilang yoki rejimni yoqing.</p><button class="chip phtg' + (st.phr ? ' on' : '') + '" data-a="aphr" id="phtg">' + ic('list') + ' Ibora rejimi: ' + (st.phr ? 'yoqilgan' : 'o‘chiq') + '</button>' + textHTML(m)) + '</div>' +
    '<div class="apanel" data-p="vocab"' + (tab === 'vocab' ? '' : ' hidden') + '>' + vocabHTML(m) + '</div>' +
    '<div class="apanel" data-p="grammar"' + (tab === 'grammar' ? '' : ' hidden') + '>' + grammarHTML(m) + '</div>' +
    '<div class="apanel" data-p="qs"' + (tab === 'qs' ? '' : ' hidden') + '>' + qsHTML(m) + '</div></div>' +
    '<div class="phbar hide" id="phbar"><span id="phtx"></span><button class="btn sm" data-a="phgo">Ma’nosi</button><button class="ib sm2" data-a="phclr" aria-label="Tozalash">' + ic('x') + '</button></div>';
  const o = sub(m.k === 'p' ? 'Podkast' : 'Maqola', 'articles', inner);
  o.mount = () => { if (m.audio) { IE.wirePlayer({ audio: m.audio, alt: m.alt || '', dur: m.dur || 0 }, 'practice'); wireSync(); } };
  return o;
};
A.atab = el => {
  const t = el.dataset.v; if (V.art) V.art.tab = t;
  $$('.tabs4 button').forEach(b => b.classList.toggle('on', b.dataset.v === t)); $$('.apanel').forEach(p => { p.hidden = p.dataset.p !== t; });
  const tb = $('.tabs4'); if (tb) window.scrollTo({ top: Math.max(0, tb.getBoundingClientRect().top + scrollY - (m0() && m0().audio ? 150 : 70)), behavior: 'smooth' });
};
const m0 = () => V.art && IE.matSync(V.art.id);
IE.afollow = el => { if (V.art) V.art.follow = el.checked; };
A.aseek = el => { const a = IE.audioEl(); if (!a) return; a.currentTime = Math.max(0, +el.dataset.t - (V.art ? IE.artShift(V.art.id) : 0) - 0.1); a.play().catch(() => IE.toast('Audio boshlanmadi — qayta bosing')); };
/** Audio va matn vaqtlari orasidagi siljish (soniya): matn vaqti = audio vaqti + siljish. Reklama/kirish farqini tuzatadi. */
IE.artShift = id => { const mt = S().lib.find(x => x.id === id); return (mt && +mt.sh) || 0; };
const setShift = (id, v) => { const mt = S().lib.find(x => x.id === id); if (!mt) return; mt.sh = Math.round(v * 10) / 10; if (!mt.sh) delete mt.sh; IE.save(); const b = $('.syncb'); if (b) b.lastChild.textContent = ' Sinxron' + (mt.sh ? ' (' + (mt.sh > 0 ? '+' : '') + mt.sh.toFixed(1) + 's)' : ''); };
const syncSheet = () => {
  const id = V.art && V.art.id, sh = IE.artShift(id);
  IE.sheet('<h2>Matn va audioni moslash</h2><p class="mu sm" style="margin:4px 0 12px">Audioda reklama yoki kirish bo‘lsa, matn bilan farq qilishi mumkin. Eng oson yo‘l: audioni boshlang va hozir <b>aytilayotgan gapni</b> matndan bosing.</p>' +
    '<button class="btn block" data-a="syncpick">' + ic('target') + ' Hozir aytilayotgan gapni belgilayman</button>' + (IE.adInfo(IE.matSync(id)).start ? '<button class="btn block ghost" style="margin-top:8px" data-a="syncstart">' + ic('play') + ' Reklamadan keyin dastur boshlanishini belgilayman</button>' : '') +
    '<div class="lm-l">Qo‘lda sozlash <span style="text-transform:none;letter-spacing:0">(hozir: ' + (sh > 0 ? '+' : '') + sh.toFixed(1) + ' s)</span></div>' +
    '<div class="seg wrap"><button data-a="syncadj" data-d="-5">−5</button><button data-a="syncadj" data-d="-1">−1</button><button data-a="syncadj" data-d="-0.3">−0.3</button><button data-a="syncadj" data-d="0.3">+0.3</button><button data-a="syncadj" data-d="1">+1</button><button data-a="syncadj" data-d="5">+5</button></div>' +
    '<p class="mu xs" style="margin:8px 0 14px"><b>+</b> — matn audiodan orqada qolsa (belgilangan gap yuqorida qolsa). <b>−</b> — matn oldinga ketib qolsa (belgi pastroqda bo‘lsa).</p>' +
    '<div class="two"><button class="btn ghost" data-a="syncadj" data-d="0" data-r="1">Tozalash</button><button class="btn" data-a="sheet-x">Tayyor</button></div>');
};
A.sync = () => { if (V.art) syncSheet(); };
A.syncadj = el => { if (!V.art) return; setShift(V.art.id, el.dataset.r ? 0 : IE.artShift(V.art.id) + (+el.dataset.d)); syncSheet(); };
A.syncstart = () => {
  const m = IE.matSync(V.art.id), st = IE.adInfo(m).start; if (!st) return; IE.closeSheet();
  const old = document.getElementById('syncnow'); if (old) old.remove(); const b = document.createElement('button'); b.id = 'syncnow'; b.className = 'syncnow'; b.innerHTML = ic('play') + ' Dastur boshlandi — “' + esc(st.x.slice(0, 28)) + '…”';
  b.onclick = () => { const a = IE.audioEl(); if (a) { setShift(V.art.id, st.t - a.currentTime); IE.toast('Moslandi: ' + (IE.artShift(V.art.id) > 0 ? '+' : '') + IE.artShift(V.art.id).toFixed(1) + ' s'); IE.vib(15); } b.remove(); };
  document.body.appendChild(b); IE.toast('Audioni boshlang. Reklamadan keyin dastur boshlanganda pastdagi tugmani bosing');
};
A.syncpick = () => { IE.closeSheet(); V.syncPick = true; IE.toast('Audio ijro bo‘layotganda, hozir aytilayotgan gapni bosing'); };
document.addEventListener('click', e => {
  if (!V.syncPick) return; const s = e.target && e.target.closest && e.target.closest('.snt'); if (!s || !V.art) return;
  e.preventDefault(); e.stopPropagation(); V.syncPick = false; const a = IE.audioEl(); if (!a) return;
  setShift(V.art.id, +s.dataset.t - a.currentTime); IE.toast('Moslandi: ' + (IE.artShift(V.art.id) > 0 ? '+' : '') + IE.artShift(V.art.id).toFixed(1) + ' s'); IE.vib(15);
}, true);
function wireSync() {
  const a = IE.audioEl(); if (!a) return; const sn = $$('.snt'); if (!sn.length) return;
  const times = sn.map(x => +x.dataset.t); let cur = -1, curW = null;
  IE.every(200, () => {
    const t = a.currentTime + (V.art ? IE.artShift(V.art.id) : 0); let i = -1; for (let k = 0; k < times.length; k++) { if (times[k] <= t + 0.05) i = k; else break; }
    if (i !== cur) { if (cur >= 0) sn[cur].classList.remove('on'); cur = i; if (i >= 0) { sn[i].classList.add('on'); if (V.art && V.art.follow && !a.paused && !(V.art.tab && V.art.tab !== 'text')) { const r = sn[i].getBoundingClientRect(); if (r.top < 170 || r.bottom > innerHeight - 130) sn[i].scrollIntoView({ block: 'center', behavior: 'smooth' }); } } }
    if (i >= 0 && sn[i].dataset.wl) { const ws = $$('.w', sn[i]); let w = null; for (const x of ws) { if (+x.dataset.ws <= t + 0.03) w = x; else break; } if (w !== curW) { if (curW) curW.classList.remove('cur'); curW = w; if (w) w.classList.add('cur'); } }
  });
}

/* ---------- so‘z varag‘i ---------- */
A.aword = async el => {
  const w = el.dataset.w; if (!w) return;
  if (V.art && V.art.phr) { el.classList.toggle('psel'); V.phSel = null; return updateBar(); } const m = m0(), v = m && vocabFor(m, w);
  IE.sheet('<div id="wsh"></div>'); const draw = d => { const b = $('#wsh'); if (b) b.innerHTML = d; };
  const base = { w, uz: v ? v.uz : '', pos: v ? v.pos : '', ex: v ? v.ex : '', free: null, note: '', busy: !v };
  const paint = () => {
    const f = base.free, my = S().my.some(x => x.id === 'my:' + (v ? v.w : w).toLowerCase());
    draw('<h2 style="display:flex;align-items:center;gap:10px">' + esc(v ? v.w : w) + (base.pos ? ' <span class="chip">' + esc(base.pos) + '</span>' : '') + '<button class="ib" style="margin-left:auto" data-a="say" data-t="' + esc(w) + '" aria-label="Eshitish">' + ic('spk') + '</button></h2>' +
      (f && (f.ipaUK || f.ipaUS || f.ipa) ? '<div class="mu sm" style="margin-bottom:6px">' + esc(f.ipaUK || f.ipaUS || f.ipa) + '</div>' : '') +
      (base.uz ? '<div style="font-size:19px;font-weight:800;color:var(--pl);margin:6px 0">' + esc(base.uz) + '</div>' : (base.busy ? '<div class="mu sm row" style="gap:8px"><span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> Tarjima…</div>' : '')) +
      (base.note ? '<div class="tip8">' + esc(base.note) + '</div>' : '') +
      (f ? f.meanings.slice(0, 2).map(x => '<h4 class="dh">' + esc(x.pos) + '</h4><p class="df">' + esc((x.defs[0] || {}).d || '') + ((x.defs[0] || {}).ex ? '<em>“' + esc(x.defs[0].ex) + '”</em>' : '') + '</p>').join('') : '') +
      (base.ex ? '<h4 class="dh">Matnda</h4><p class="df"><em>“…' + esc(base.ex) + '…”</em></p>' : '') +
      '<button class="btn block' + (my ? ' ghost' : '') + '" style="margin-top:14px"' + (my ? ' disabled' : ' data-a="wadd"') + '>' + (my ? ic('check') + ' Lug‘atingizda bor' : ic('star') + ' Mening so‘zlarimga qo‘shish') + '</button><button class="btn block ghost" style="margin-top:8px" data-go="dict/' + encodeURIComponent(w) + '">Dictionary’da to‘liq ko‘rish</button>');
  };
  V.wcur = base; V.wpaint = paint; paint();
  try { const c = IE.dcGet(w); if (c && c.uz && !base.uz) { base.uz = c.uz; base.note = c.note || ''; base.busy = false; paint(); } } catch (e) { /* */ }
  try { base.free = await IE.freeDict(w); if (base.free && base.free.nf) base.free = null; } catch (e) { base.free = null; }
  paint();
  if (!base.uz) {
    try { const hint = base.free ? base.free.meanings.slice(0, 3).map(x => x.pos + ': ' + ((x.defs[0] || {}).d || '')).join(' | ').slice(0, 480) : ''; const out = (await IE.ai(hint ? { action: 'dict', word: w, hint } : { action: 'dict', word: w })).result || {}; base.uz = out.uz || ''; base.note = out.note || ''; if (!base.pos && out.pos) base.pos = out.pos; if (base.uz) IE.dcSet(w, { uz: base.uz, note: base.note }); } catch (e) { base.note = ''; }
    base.busy = false; paint();
  }
};
A.wadd = () => { const b = V.wcur; if (!b) return; const id = 'my:' + b.w.toLowerCase(), m = m0(), v = m && vocabFor(m, b.w); const word = v ? v.w : b.w; const mid = 'my:' + word.toLowerCase(); if (S().my.some(x => x.id === mid)) return; const df = b.free && b.free.meanings[0] && b.free.meanings[0].defs[0]; S().my.push({ id: mid, w: word, uz: b.uz || '', def: df ? df.d : '', ex: b.ex || (df ? df.ex : ''), pos: b.pos || '', ts: Date.now() }); IE.save(); IE.toast('Qo‘shildi'); if (V.wpaint) V.wpaint(); paintVocab(); };
IE.addArticle = addArticle;
function paintVocab() { const m = m0(), p = $('.apanel[data-p="vocab"]'); if (m && p) p.innerHTML = vocabHTML(m); }
A.vadd = el => { const m = m0(), v = m && m.vocab[+el.dataset.i]; if (!v) return; const id = 'my:' + v.w.toLowerCase(); if (!S().my.some(x => x.id === id)) { S().my.push({ id, w: v.w, uz: v.uz, def: '', ex: v.ex || '', pos: v.pos, ts: Date.now() }); IE.save(); IE.toast('Qo‘shildi'); } paintVocab(); };
A.vall = () => { const m = m0(); if (!m) return; let n = 0; m.vocab.forEach(v => { const id = 'my:' + v.w.toLowerCase(); if (!S().my.some(x => x.id === id)) { S().my.push({ id, w: v.w, uz: v.uz, def: '', ex: v.ex || '', pos: v.pos, ts: Date.now() }); n++; } }); IE.save(); IE.toast(n + ' ta so‘z qo‘shildi'); paintVocab(); };

/* ---------- savollar ---------- */
function paintQs() { const m = m0(), p = $('.apanel[data-p="qs"]'); if (m && p) p.innerHTML = qsHTML(m); }
A.achk = () => {
  const m = m0(), st = V.art, qs = IE.allQ(m), raw = qs.filter(x => IE.isOk(x.g, x.q, st.ans[x.q.n])).length;
  st.done = true; lsSet(keyOf(st.id), { ans: st.ans, done: true }); S().arts.push({ ts: Date.now(), id: st.id, raw, tot: qs.length }); IE.touchDay(); IE.save(true); paintQs();
  const p = $('.apanel[data-p="qs"]'); if (p) window.scrollTo({ top: p.getBoundingClientRect().top + scrollY - 120, behavior: 'smooth' }); if (raw / qs.length >= .6) IE.confetti();
};
A.aretry = () => { const st = V.art; st.ans = {}; st.done = false; lsSet(keyOf(st.id), { ans: {}, done: false }); paintQs(); };

/* ---------- podkast: transkript va tahlil ---------- */
A.atr = async () => {
  const st = V.art, meta = S().lib.find(x => x.id === st.id); if (!meta || !meta.au) return;
  st.busy = 'tr'; st.err = ''; IE.draw(false);
  try {
    const out = await IE.ai({ action: 'transcript', url: meta.au }), cues = out.cues || [];
    if (out.au) meta.pl = out.au;
    const m = { id: meta.id, k: 'p', title: meta.t, audio: out.au || meta.au, dur: out.dur || (cues.length ? cues[cues.length - 1].e : 0), img: meta.img ? { src: meta.img, credit: '', license: '', link: meta.src || '' } : null, src: meta.src || '', blocks: blocksFromCues(cues), vocab: [], grammar: [], groups: [] };
    await saveMat(m); V.mats[m.id] = m; IE.toast(out.cached ? 'Transkript tayyor (keshdan)' : 'Transkript tayyor');
  } catch (e) { st.err = e.message; }
  st.busy = ''; if ((IE.curRoute || '') === 'article/' + st.id) IE.draw(false);
};
A.aan = async () => {
  const st = V.art, m = IE.matSync(st.id), meta = S().lib.find(x => x.id === st.id); if (!m || !meta) return;
  const text = m.blocks.map(b => b.h ? b.x : b.s.map(s => s[1]).join(' ')).join('\n\n');
  st.busy = 'an'; st.err = ''; paintCta();
  try {
    const r = (await IE.ai({ action: 'analyze', title: m.title, text })).result || {};
    const exT = ex => { const s = findSent(m, ex); return s ? s.t : null; };
    m.level = String(r.level || '').slice(0, 20);
    m.vocab = (r.vocab || []).filter(v => v && v.w && v.uz).slice(0, 14).map(v => { const t = v.ex ? exT(v.ex) : null; return { w: String(v.w).slice(0, 40), pos: String(v.pos || '').slice(0, 12), uz: String(v.uz).slice(0, 90), ex: t != null ? String(v.ex) : '', t: t != null ? t : 0 }; });
    m.grammar = (r.grammar || []).filter(g => g && g.t && g.r).slice(0, 5).map(g => ({ t: String(g.t).slice(0, 80), r: String(g.r).slice(0, 400), ex: (g.ex || []).map(x => ({ x: String(x), t: exT(String(x)) })).filter(x => x.t != null) }));
    const gs = [], push = (type, note, q) => { let g = gs.find(x => x.type === type); if (!g) { g = { type, title: '', note, qs: [] }; gs.push(g); } g.qs.push(q); };
    let n = 0;
    (r.qs || []).forEach(q => { if (!q || !q.q) return; n++; const base = { n, q: String(q.q).slice(0, 220), why: String(q.why || '').slice(0, 300), t: 0 };
      if (q.type === 'tf' && ['TRUE', 'FALSE', 'NOT GIVEN'].includes(q.a)) push('tfng', 'Do the following statements agree with the information in the text? Choose TRUE, FALSE or NOT GIVEN.', Object.assign(base, { a: q.a }));
      else if (q.type === 'mc' && Array.isArray(q.o) && q.o.length >= 2 && Number.isInteger(q.a) && q.a < q.o.length) push('mcq', 'Choose the correct letter, A, B or C.', Object.assign(base, { o: q.o.slice(0, 4).map(String), a: q.a }));
      else if (q.type === 'fl' && Array.isArray(q.a) && q.a.length) push('fill', 'Complete the sentences. Write NO MORE THAN TWO WORDS AND/OR A NUMBER from the text.', Object.assign(base, { a: q.a.map(String) }));
      else n--; });
    // savol raqamlarini guruhlar tartibida qayta belgilash
    let k = 0; gs.forEach(g => { g.qs.forEach(q => { q.n = ++k; }); g.title = 'Questions ' + g.qs[0].n + (g.qs.length > 1 ? '–' + g.qs[g.qs.length - 1].n : ''); });
    m.groups = gs; await saveMat(m); V.mats[m.id] = m; meta.an = 1; IE.save(true); IE.toast('Tahlil tayyor');
  } catch (e) { st.err = e.message; }
  st.busy = ''; if ((IE.curRoute || '') === 'article/' + st.id) IE.draw(false);
};
function paintCta() { const m = m0(); if (!m) return; ['vocab', 'grammar', 'qs'].forEach(p => { const el = $('.apanel[data-p="' + p + '"]'); if (el && !(m[p === 'qs' ? 'groups' : p] || []).length) el.innerHTML = aiCTA(m, 'Tahlil qilinmoqda…'); }); }

/* ---------- ibora (phrasal verb, collocation) ma’nosi ---------- */
function barText() {
  if (V.phSel) return V.phSel;
  const ws = $$('.w.psel'); if (!ws.length) return null;
  const text = ws.map(w => w.textContent.replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, '')).filter(Boolean).join(' '), snt = ws[0].closest('.snt');
  return { text, ctx: snt ? snt.textContent.replace(/\s+/g, ' ').trim() : text };
}
function updateBar() {
  const bar = $('#phbar'); if (!bar) return; const b = barText(); bar.classList.toggle('hide', !b);
  if (b) { const t = $('#phtx'); if (t) t.textContent = b.text.length > 46 ? b.text.slice(0, 44) + '…' : b.text; }
}
A.aphr = () => { const st = V.art; if (!st) return; st.phr = !st.phr; const p = $('.apanel[data-p="text"]'), b = $('#phtg'); if (p) p.classList.toggle('phr', st.phr); if (b) { b.classList.toggle('on', st.phr); b.lastChild.textContent = ' Ibora rejimi: ' + (st.phr ? 'yoqilgan' : 'o‘chiq'); } if (!st.phr) A.phclr(); else IE.toast('So‘zlarni ketma-ket bosing, so‘ng “Ma’nosi”'); };
A.phclr = () => { $$('.w.psel').forEach(w => w.classList.remove('psel')); V.phSel = null; try { getSelection().removeAllRanges(); } catch (e) { /* */ } updateBar(); };
let selT;
document.addEventListener('selectionchange', () => {
  clearTimeout(selT); selT = setTimeout(() => {
    if (!V.art || !(IE.curRoute || '').startsWith('article/')) return;
    const sel = getSelection(); if (!sel || sel.isCollapsed) { if (V.phSel) { V.phSel = null; updateBar(); } return; }
    const an = sel.anchorNode && (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentElement); if (!an || !an.closest || !an.closest('.ap')) return;
    const text = sel.toString().replace(/\s+/g, ' ').trim().replace(/^[^A-Za-z0-9]+|[^A-Za-z0-9]+$/g, ''), n = text.split(' ').length; if (n < 2 || n > 10) return;
    const snt = an.closest('.snt'); V.phSel = { text, ctx: snt ? snt.textContent.replace(/\s+/g, ' ').trim() : text }; updateBar();
  }, 250);
});
A.phgo = async () => {
  const b = barText(); if (!b) return; const text = b.text, ctx = b.ctx;
  IE.sheet('<div id="wsh"></div>'); const draw = h => { const x = $('#wsh'); if (x) x.innerHTML = h; };
  const st = { w: text, type: 'phrase', uz: '', def: '', ex: '', note: '', busy: true, err: '' };
  const paint = () => {
    const my = S().my.some(x => x.id === 'my:' + st.w.toLowerCase());
    draw('<h2 style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">' + esc(st.w) + ' <span class="chip">' + esc(st.type) + '</span><button class="ib" style="margin-left:auto" data-a="say" data-t="' + esc(st.w) + '" aria-label="Eshitish">' + ic('spk') + '</button></h2>' +
      (st.uz ? '<div style="font-size:19px;font-weight:800;color:var(--pl);margin:8px 0">' + esc(st.uz) + '</div>' : (st.busy ? '<div class="mu sm row" style="gap:8px;margin:10px 0"><span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> Ma’nosi aniqlanmoqda…</div>' : '')) +
      (st.err ? '<p class="sm" style="color:var(--bad);font-weight:600">' + esc(st.err) + '</p>' : '') + (st.def ? '<p class="df">' + esc(st.def) + '</p>' : '') + (st.note ? '<div class="tip8" style="margin:8px 0">' + esc(st.note) + '</div>' : '') +
      '<h4 class="dh">Matnda</h4><p class="df"><em>“' + esc(ctx) + '”</em></p>' + (st.ex ? '<h4 class="dh">Yana bir misol</h4><p class="df"><em>“' + esc(st.ex) + '”</em></p>' : '') +
      '<button class="btn block' + (my ? ' ghost' : '') + '" style="margin-top:14px"' + (my ? ' disabled' : ' data-a="padd"') + '>' + (my ? ic('check') + ' Lug‘atingizda bor' : ic('star') + ' Mening so‘zlarimga qo‘shish') + '</button>');
  };
  V.pcur = st; V.ppaint = paint; paint();
  const ck = 'p:' + text.toLowerCase() + '@' + ctx.slice(0, 24), c = IE.dcGet(ck);
  if (c) { Object.assign(st, c, { busy: false }); return paint(); }
  try { const r = (await IE.ai({ action: 'dict', word: text, ctx })).result || {}; Object.assign(st, { w: r.w || text, type: r.type || 'phrase', uz: r.uz || '', def: r.def || '', ex: r.ex || '', note: r.note || '' }); if (st.uz) IE.dcSet(ck, { w: st.w, type: st.type, uz: st.uz, def: st.def, ex: st.ex, note: st.note }); } catch (e) { st.err = e.message; }
  st.busy = false; paint();
};
A.padd = () => { const st = V.pcur; if (!st) return; const id = 'my:' + st.w.toLowerCase(); if (S().my.some(x => x.id === id)) return; S().my.push({ id, w: st.w, uz: st.uz, def: st.def, ex: st.ex, pos: st.type, ts: Date.now() }); IE.save(); IE.toast('Qo‘shildi'); if (V.ppaint) V.ppaint(); paintVocab(); };
})();
