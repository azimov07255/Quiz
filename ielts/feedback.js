/* IELTS · BY AZIMOV — Fikr bildirish: foydalanuvchi g‘oya/xato/maqtov yuboradi (RPC ielts_send_feedback), owner “Fikrlar” sahifasida ko‘radi (owner_feedback_list). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, bd } = IE, R = IE.routes, A = IE.act, V = IE.V, D = IE.D;
const KINDS = [['idea', '💡 G‘oya'], ['bug', '🐞 Xato'], ['praise', '👍 Yoqdi'], ['other', '💬 Boshqa']];
const KL = Object.fromEntries(KINDS);
const ago = t => { const m = Math.max(0, (Date.now() - t) / 6e4 | 0); return m < 1 ? 'hozir' : m < 60 ? m + ' daq oldin' : m < 1440 ? (m / 60 | 0) + ' soat oldin' : (m / 1440 | 0) + ' kun oldin'; };
A.fbopen = () => {
  V.fbk = V.fbk || 'idea';
  IE.sheet('<h2>Fikr bildirish</h2><p class="mu sm" style="margin:4px 0 12px">Ilovada nima yoqdi, nima yetishmaydi yoki qayerda xato bor? To‘g‘ridan-to‘g‘ri ilova egasiga boradi.</p><div class="seg" style="margin-bottom:10px">' + KINDS.map(k => '<button class="' + (V.fbk === k[0] ? 'on' : '') + '" data-a="fbk" data-v="' + k[0] + '">' + k[1] + '</button>').join('') + '</div><textarea class="ed" id="fbm" maxlength="1500" style="min-height:120px;font:16px/1.5 -apple-system,sans-serif" placeholder="Fikringizni yozing…"></textarea><button class="btn block" style="margin-top:10px" data-a="fbsend">' + ic('check') + ' Yuborish</button>');
};
A.fbk = el => { V.fbk = el.dataset.v; const t = (document.getElementById('fbm') || {}).value || ''; A.fbopen(); const m = document.getElementById('fbm'); if (m) m.value = t; };
A.fbsend = async el => {
  const m = document.getElementById('fbm'), msg = ((m || {}).value || '').trim(); if (msg.length < 3) return IE.toast('Fikrni yozing');
  el.disabled = true;
  try { await SB.rpc('ielts_send_feedback', { p_kind: V.fbk || 'idea', p_msg: msg, p_ctx: ('v' + IE.APP_VERSION + ' · ' + (IE.curRoute || '') + ' · ' + (window.innerWidth + 'x' + window.innerHeight)).slice(0, 280) }); IE.closeSheet(); IE.toast('Rahmat! Fikringiz yuborildi'); }
  catch (e) { el.disabled = false; IE.toast(e.net ? 'Internetga ulanib bo‘lmadi' : (e.message || 'Yuborib bo‘lmadi').slice(0, 80)); }
};
const isOwner = () => !!(D.profile && D.profile.role === 'owner');
IE.fbMenu = () => '<button class="set" data-a="fbopen"><span class="bd sm sk-S">' + ic('chat') + '</span><div class="tx"><b>Fikr bildirish</b><span>G‘oya, xato yoki maqtov — to‘g‘ridan-to‘g‘ri egasiga</span></div></button>' + (isOwner() ? '<button class="set" data-go="feedback"><span class="bd sm sk-M">' + ic('list') + '</span><div class="tx"><b>Fikrlar (egasi)</b><span>Foydalanuvchilardan kelgan xabarlar</span></div></button>' : '');
R.feedback = () => {
  const f = V.fbl || (V.fbl = { items: null, err: '', busy: false }), top = IE.sub('Fikrlar', 'me', '<div class="pad">' + (!isOwner() ? '<div class="card empty">Bu sahifa faqat ilova egasi uchun.</div>' : f.err ? '<div class="card"><p class="sm" style="color:var(--bad);font-weight:600">' + esc(f.err) + '</p></div>' : !f.items ? '<div class="c" style="padding:30px"><div class="spin"></div></div>' : !f.items.length ? '<div class="card empty">' + bd('chat', 'A') + 'Hali fikr kelmagan.</div>' :
    '<div class="lst">' + f.items.map(x => '<div class="card" style="margin-bottom:10px"><div class="row" style="justify-content:space-between;margin-bottom:6px"><span class="chip">' + (KL[x.kind] || x.kind) + '</span><span class="mu xs">' + esc(x.name) + ' · ' + ago(new Date(x.created_at).getTime()) + '</span></div><div style="line-height:1.5;white-space:pre-wrap">' + esc(x.msg) + '</div><div class="mu xs" style="margin-top:6px">' + esc(x.ctx) + '</div><div class="two" style="margin-top:8px"><button class="btn sm ghost" data-a="fbst" data-id="' + x.id + '" data-s="read">' + (x.status === 'read' ? 'O‘qilgan ✓' : 'O‘qildi') + '</button><button class="btn sm' + (x.status === 'done' ? ' ghost' : '') + '" data-a="fbst" data-id="' + x.id + '" data-s="done">' + (x.status === 'done' ? 'Bajarilgan ✓' : 'Bajarildi') + '</button></div></div>').join('') + '</div>') + '</div>');
  top.mount = async () => { if (!isOwner() || f.items || f.busy) return; f.busy = true; try { f.items = await SB.rpc('owner_feedback_list', { p_limit: 100 }); } catch (e) { f.err = e.message || 'Yuklab bo‘lmadi'; } f.busy = false; if ((IE.curRoute || '') === 'feedback') IE.draw(false); };
  return top;
};
A.fbst = async el => { const f = V.fbl; try { await SB.rpc('owner_feedback_set', { p_id: +el.dataset.id, p_status: el.dataset.s }); const it = f.items.find(x => x.id === +el.dataset.id); if (it) it.status = el.dataset.s; IE.draw(false); } catch (e) { IE.toast(e.message || 'Xato'); } };
})();
