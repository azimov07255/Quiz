/* IELTS · Cambridge Writing va Speaking: shaxsiy savollar (kitobingizdan). Savol matni yoki rasm/skrinshotdan AI o‘qiydi (ielts-wr);
   Task 1 diagrammasi qurilmada (IndexedDB) saqlanadi, tavsifi esa sinxronlanadi. Mashq oqimi — oddiy Writing/Speaking ekranlari. */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd, $ } = IE, S = () => IE.S(), A = IE.act, V = IE.V;
const last = a => a.length ? a[a.length - 1] : null;
const MINW = t => t === '1' || t === 1 ? 150 : 250;
const wRec = u => last(S().writes.filter(w => w.p === u.id));
const wRecs = u => S().writes.filter(w => w.p === u.id);
const sRecs = u => ({ p1: last(S().speaks.filter(x => x.k === '1' && x.t === u.cam + ' · Part 1')), p2: last(S().speaks.filter(x => x.k === '2' && x.t === String((u.p2 && u.p2.t) || '').replace('Describe ', ''))), p3: last(S().speaks.filter(x => x.k === '3' && x.t === String((u.p2 && u.p2.t) || '').replace('Describe ', ''))) });
const r5 = x => Math.round(x * 2) / 2;
/** Writing: Task 1 + 2×Task 2 og‘irligi (IELTS bo‘yicha 1:2). */
IE.camWskill = t => {
  const W = t.W || {}, recs = [1, 2].map(i => W[i] ? wRec(W[i]) : null), b = recs.map(r => r && r.ai && typeof r.ai.overall === 'number' ? r.ai.overall : null);
  return { done: recs.filter(Boolean).length, need: 2, have: Object.keys(W).length, band: b[0] != null && b[1] != null ? r5((b[0] + 2 * b[1]) / 3) : null };
};
IE.camSskill = t => {
  const u = t.S; if (!u) return { done: 0, need: 2, have: 0, band: null };
  const r = sRecs(u), b = [r.p1, r.p2].map(x => x && x.ai && typeof x.ai.overall === 'number' ? x.ai.overall : null);
  return { done: [r.p1, r.p2].filter(Boolean).length, need: 2, have: 1, band: b[0] != null && b[1] != null ? r5((b[0] + b[1]) / 2) : null };
};
const firstLine = t => String(t || '').split(/\n/).map(x => x.trim()).filter(x => x && !/^you should spend|^write at least/i.test(x))[0] || 'Writing task';

/** Test sahifasidagi Writing va Speaking bo‘limlari. */
IE.camWS = (book, n, t) => {
  const W = t.W || {}, bk = esc(book), P = IE.D.prompts;
  const wcard = i => {
    const u = W[i], add = 'data-a="camwadd" data-b="' + bk + '" data-n="' + n + '" data-t="' + i + '"';
    if (!u) return IE.uc({ empty: true, k: 'W', num: i, lab: 'TASK', title: 'Writing Task ' + i, add });
    const recs = wRecs(u), w = last(recs), min = MINW(u.task);
    return IE.uc({ go: 'writing/p/' + u.id, k: 'W', num: i, lab: 'TASK', title: firstLine(u.text), meta: 'Task ' + i + ' · ' + (i === 1 ? '20 daq · 150+ so‘z' : '40 daq · 250+ so‘z'),
      chips: [u.hasImg || u.desc ? IE.ucChip(ic('doc') + ' diagramma') : '', w && w.ai ? IE.ucChip('AI baho ' + IE.bandTxt(w.ai.overall)) : w ? IE.ucChip('baholanmagan', 'warn') : ''].filter(Boolean),
      rec: w ? { band: w.ai ? w.ai.overall : null, raw: Math.min(w.words, min), tot: min, ts: w.ts } : null, att: recs.length, del: { k: 'w', id: u.id }, edit: 'data-a="camwedit" data-b="' + bk + '" data-n="' + n + '" data-t="' + i + '"' });
  };
  const su = t.S; let scard;
  const sadd = 'data-a="camsadd" data-b="' + bk + '" data-n="' + n + '"';
  if (!su) scard = IE.uc({ empty: true, k: 'S', num: 'S', lab: 'PART', title: 'Speaking (Part 1–3)', add: sadd });
  else {
    const r = sRecs(su), i1 = P.sp1.findIndex(x => x.priv === su.id), i2 = P.sp2.findIndex(x => x.priv === su.id), sk = IE.camSskill(t), done = sk.done;
    scard = IE.uc({ go: i1 >= 0 ? 'speaking/1/' + i1 : 'speaking/2/' + i2, k: 'S', num: 'S', lab: 'PART', title: 'Speaking', meta: [su.p1 && su.p1.length ? 'Part 1 · ' + su.p1.length + ' savol' : '', su.p2 && su.p2.t ? 'Part 2 cue card' : '', su.p3 && su.p3.length ? 'Part 3 · ' + su.p3.length : ''].filter(Boolean).join(' · '),
      chips: [r.p1 ? IE.ucChip('P1 ✓' + (r.p1.ai ? ' ' + IE.bandTxt(r.p1.ai.overall) : '')) : '', r.p2 ? IE.ucChip('P2 ✓' + (r.p2.ai ? ' ' + IE.bandTxt(r.p2.ai.overall) : '')) : '', r.p3 ? IE.ucChip('P3 ✓' + (r.p3.ai ? ' ' + IE.bandTxt(r.p3.ai.overall) : '')) : ''].filter(Boolean),
      rec: done ? { band: sk.band, raw: done, tot: 2, ts: (r.p2 || r.p1).ts } : null, att: done, del: { k: 's', id: su.id }, edit: 'data-a="camsadd" data-b="' + bk + '" data-n="' + n + '"',
      extra: (i1 >= 0 ? '<button class="chip" data-go="speaking/1/' + i1 + '">Part 1</button>' : '') + (i2 >= 0 ? '<button class="chip" data-go="speaking/2/' + i2 + '">Part 2</button>' : '') + (i2 >= 0 && su.p3 && su.p3.length ? '<button class="chip" data-go="speaking/3/' + i2 + '">Part 3</button>' : '') });
  }
  return '<div class="sec"><h2>Writing</h2><span class="chip">' + IE.camWskill(t).done + '/2</span></div><div class="ucl">' + wcard(1) + wcard(2) + '</div>' +
    '<div class="sec"><h2>Speaking</h2><span class="chip">' + IE.camSskill(t).done + '/2</span></div><div class="ucl">' + scard + '</div>';
};

/* ---------- qo‘shish / tahrirlash oynalari ---------- */
const imgData = (file, max) => new Promise((res, rej) => {
  const fr = new FileReader(); fr.onload = () => { const im = new Image(); im.onload = () => { const k = Math.min(1, (max || 1100) / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height); res(c.toDataURL('image/jpeg', .72)); }; im.onerror = () => rej(new Error('Rasm ochilmadi')); im.src = fr.result; };
  fr.onerror = () => rej(new Error('Fayl o‘qilmadi')); fr.readAsDataURL(file);
});
IE.camWImg = async id => { try { const r = await IE.idbGet('camimg:' + id); return r && r.d ? r.d : null; } catch (e) { return null; } };
const find = (kind, book, n, task) => { const st = IE.camStore(); return kind === 'w' ? st.writing.find(u => u.book === book && u.n === n && u.task === String(task)) : st.speaking.find(u => u.book === book && u.n === n); };
IE.camWUnit = id => IE.camStore().writing.find(u => u.id === id) || null;
const fileBtn = () => '<label class="btn block ghost" style="margin-bottom:12px" id="cwfl">' + ic('sparkl') + ' Rasm / skrinshotdan AI o‘qisin<input type="file" accept="image/*" id="cwf" hidden></label><div id="cwst" class="sm mu" style="margin:-4px 0 10px"></div>';
A.camwadd = A.camwedit = el => {
  const book = el.dataset.b, n = +el.dataset.n, task = String(el.dataset.t || '2'), u = find('w', book, n, task);
  V.cw = { kind: 'w', book, n, task, id: u ? u.id : '', img: null, had: !!(u && u.hasImg) };
  IE.sheet('<h2>' + esc(book) + ' · Test ' + n + ' · Writing Task ' + task + '</h2><p class="mu sm" style="margin:4px 0 12px">' + (task === '1' ? 'Diagramma suratini yuklang — AI savol matnini va diagramma tavsifini o‘qib beradi (tekshirib, tahrirlang).' : 'Savol matnini yozing yoki kitob sahifasi suratidan o‘qitib oling.') + ' Faqat o‘zingiz uchun saqlanadi.</p>' + fileBtn() +
    '<div class="fld"><label>Savol matni</label><textarea id="cwp" rows="6" class="ed" style="min-height:130px;font:15px/1.5 -apple-system,sans-serif" placeholder="Masalan: Some people think that…">' + esc(u ? u.text : '') + '</textarea></div>' +
    (task === '1' ? '<div class="fld"><label>Diagramma tavsifi (AI baholash uchun)</label><textarea id="cwd" rows="5" class="ed" style="min-height:110px;font:14px/1.5 -apple-system,sans-serif" placeholder="Rasm yuklasangiz AI to‘ldiradi: tur, raqamlar, tendensiyalar…">' + esc(u ? u.desc || '' : '') + '</textarea></div>' : '') +
    '<button class="btn block" data-a="cwsave">' + ic('check') + ' Saqlash</button>');
};
A.camsadd = el => {
  const book = el.dataset.b, n = +el.dataset.n, u = find('s', book, n);
  V.cw = { kind: 's', book, n, id: u ? u.id : '' };
  IE.sheet('<h2>' + esc(book) + ' · Test ' + n + ' · Speaking</h2><p class="mu sm" style="margin:4px 0 12px">Savollarni yozing yoki kitob sahifasi suratidan AI o‘qib bersin. Har qatorga bitta savol.</p>' + fileBtn() +
    '<div class="fld"><label>Part 1 savollari</label><textarea id="csp1" rows="5" class="ed" style="min-height:100px;font:14px/1.5 -apple-system,sans-serif" placeholder="Do you work or study?">' + esc(u && u.p1 ? u.p1.join('\n') : '') + '</textarea></div>' +
    '<div class="fld"><label>Part 2 cue card (1-qator: Describe…, keyingilari — nuqtalar)</label><textarea id="csp2" rows="6" class="ed" style="min-height:120px;font:14px/1.5 -apple-system,sans-serif" placeholder="Describe a place you visited…">' + esc(u && u.p2 ? [u.p2.t].concat(u.p2.b || []).join('\n') : '') + '</textarea></div>' +
    '<div class="fld"><label>Part 3 savollari</label><textarea id="csp3" rows="5" class="ed" style="min-height:100px;font:14px/1.5 -apple-system,sans-serif" placeholder="Why do people travel?">' + esc(u && u.p3 ? u.p3.join('\n') : '') + '</textarea></div>' +
    '<button class="btn block" data-a="cwsave">' + ic('check') + ' Saqlash</button>');
};
/** Kitobdan avtomatik olingan Writing/Speaking sahifalarini saqlaydi. rs: [{ img (data URL), r (ielts-wr extract natijasi) }] */
IE.camWSAdd = async (bn, n, k, task, rs) => {
  const st = IE.camStore(), now = Date.now(), rnd = () => now.toString(36) + Math.random().toString(36).slice(2, 5);
  if (k === 'w') {
    const r = (rs[0] && rs[0].r) || {}, text = String(r.prompt || '').trim(); if (text.length < 20) throw new Error('Savol matni o‘qilmadi — bet oralig‘ini tekshiring');
    const id = 'cw' + rnd(), u = { id, mt: now, cam: bn + ' · Test ' + n + ' · Writing Task ' + task, book: bn, n, task: String(task), text: text.slice(0, 1200), desc: String(r.desc || '').slice(0, 2000), hasImg: String(task) === '1' && !!rs[0].img };
    st.writing = st.writing.filter(x => x.cam !== u.cam).concat([u]); if (u.hasImg) { try { await IE.idbSet('camimg:' + id, { d: rs[0].img }); } catch (e) { /* */ } }
  } else {
    const p1 = [], p3 = []; let p2 = null; rs.forEach(x => { const r = x.r || {}; (r.p1 || []).forEach(q => p1.push(String(q).slice(0, 200))); (r.p3 || []).forEach(q => p3.push(String(q).slice(0, 200))); if (!p2 && r.p2 && r.p2.t) p2 = { t: String(r.p2.t).slice(0, 200), b: (r.p2.b || []).slice(0, 8).map(b => String(b).slice(0, 200)) }; });
    if (!p1.length && !p2) throw new Error('Speaking savollari o‘qilmadi — bet oralig‘ini tekshiring');
    const u = { id: 'cs' + rnd(), mt: now, cam: bn + ' · Test ' + n + ' · Speaking', book: bn, n, p1: p1.slice(0, 14), p2, p3: p3.slice(0, 12) };
    st.speaking = st.speaking.filter(x => x.cam !== u.cam).concat([u]);
  }
  await IE.camSave();
};
const lines = id => (($('#' + id) || {}).value || '').split(/\n+/).map(x => x.replace(/^\s*[•\-*·]\s*/, '').trim()).filter(Boolean);
document.addEventListener('change', async e => {
  const t = e.target; if (!t || t.id !== 'cwf' || !t.files || !t.files[0]) return; const f = t.files[0]; t.value = ''; const c = V.cw; if (!c) return;
  const st = $('#cwst'); if (st) st.innerHTML = '<span class="typing" style="padding:0;display:inline-flex"><i></i><i></i><i></i></span> AI rasmni o‘qiyapti…';
  try {
    const img = await imgData(f); if (c.kind === 'w') c.img = img;
    const out = await SB.fn('ielts-wr', { mode: 'extract', kind: c.kind === 's' ? 'sp' : 'w', img: img.split(',')[1] }), r = out.result || {};
    if (c.kind === 'w') { if ($('#cwp') && r.prompt) $('#cwp').value = String(r.prompt); if ($('#cwd') && r.desc) $('#cwd').value = String(r.desc); }
    else { if ($('#csp1')) $('#csp1').value = (r.p1 || []).join('\n'); if ($('#csp2') && r.p2) $('#csp2').value = [r.p2.t].concat(r.p2.b || []).filter(Boolean).join('\n'); if ($('#csp3')) $('#csp3').value = (r.p3 || []).join('\n'); }
    if (st) st.innerHTML = '✓ O‘qildi — tekshirib, kerak bo‘lsa tahrirlang.';
  } catch (er) { if (st) st.innerHTML = '<span style="color:var(--bad);font-weight:600">' + esc(er.net ? 'Internetga ulanib bo‘lmadi.' : (er.message || 'O‘qib bo‘lmadi')) + '</span>'; }
});
A.cwsave = async () => {
  const c = V.cw; if (!c) return; const st = IE.camStore(), now = Date.now(), id = c.id || (c.kind === 'w' ? 'cw' : 'cs') + now.toString(36) + Math.random().toString(36).slice(2, 5);
  if (c.kind === 'w') {
    const text = (($('#cwp') || {}).value || '').trim(), desc = (($('#cwd') || {}).value || '').trim(); if (text.length < 20) return IE.toast('Savol matnini kiriting (kamida 20 belgi)');
    const u = { id, mt: now, cam: c.book + ' · Test ' + c.n + ' · Writing Task ' + c.task, book: c.book, n: c.n, task: c.task, text: text.slice(0, 1200), desc: desc.slice(0, 2000), hasImg: !!(c.img || c.had) };
    st.writing = st.writing.filter(x => x.id !== id).concat([u]); if (c.img) { try { await IE.idbSet('camimg:' + id, { d: c.img }); } catch (e) { /* */ } }
  } else {
    const p1 = lines('csp1').slice(0, 14), p2l = lines('csp2'), p3 = lines('csp3').slice(0, 12);
    if (!p1.length && !p2l.length) return IE.toast('Kamida Part 1 yoki Part 2 ni kiriting');
    const u = { id, mt: now, cam: c.book + ' · Test ' + c.n + ' · Speaking', book: c.book, n: c.n, p1: p1.map(x => x.slice(0, 200)), p2: p2l.length ? { t: p2l[0].slice(0, 200), b: p2l.slice(1, 8).map(x => x.slice(0, 200)) } : null, p3: p3.map(x => x.slice(0, 200)) };
    st.speaking = st.speaking.filter(x => x.id !== id).concat([u]);
  }
  await IE.camSave(); V.cw = null; IE.closeSheet(); IE.toast('Saqlandi'); IE.draw(false);
};
})();
