/* IELTS · BY AZIMOV — Kunlik eslatma (Web Push): foydalanuvchi vaqt tanlaydi, server (ielts-push + pg_cron) shu vaqtda — agar bugun hali o‘qimagan bo‘lsa —
   bildirishnoma yuboradi. Matn service worker (sw.js) ichida. iPhone’da faqat Home Screen’ga qo‘shilgan ilovada ishlaydi (iOS 16.4+). */
(() => {
'use strict';
const IE = window.IE, { esc, ic, lsGet, lsSet } = IE, A = IE.act, S = () => IE.S();
const KEY = 'ielts:push';
const st = () => lsGet(KEY, { on: false, hhmm: 1140 }) || { on: false, hhmm: 1140 };
const sup = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
const standalone = () => (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone === true;
const ios = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const hm = n => String(Math.floor(n / 60)).padStart(2, '0') + ':' + String(n % 60).padStart(2, '0');
const toMin = v => { const m = /^(\d{1,2}):(\d{2})$/.exec(v || ''); return m ? Math.min(1439, +m[1] * 60 + +m[2]) : 1140; };
const u8 = b64 => { const p = '='.repeat((4 - b64.length % 4) % 4), s = atob((b64 + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from([...s].map(c => c.charCodeAt(0))); };
const errMsg = e => e && e.net ? 'Internetga ulanib bo‘lmadi' : String((e && e.message) || 'Xatolik').slice(0, 110);

IE.pushMenu = () => { const s = st(), on = s.on && sup() && Notification.permission === 'granted'; return '<button class="set" data-a="pushopen"><span class="bd sm sk-W">' + ic('clock') + '</span><div class="tx"><b>Kunlik eslatma</b><span>' + (on ? 'Yoqilgan · har kuni ' + hm(s.hhmm) + ' (bugun o‘qimagan bo‘lsangiz)' : 'Telefonga bildirishnoma — seriya uzilmasin') + '</span></div></button>'; };
A.pushopen = () => {
  const s = st();
  if (!sup()) return IE.sheet('<h2>Kunlik eslatma</h2><p class="mu" style="margin:8px 0 14px;line-height:1.55">Bu brauzer bildirishnomalarni (Web Push) qo‘llamaydi. ' + (ios() ? 'iPhone’da: Safari → Ulashish → <b>Bosh ekranga qo‘shish</b>, so‘ng ilovani shu ikondan oching.' : 'Chrome, Edge yoki Firefox’dan foydalaning.') + '</p><button class="btn block" data-a="closeSheet">Yopish</button>');
  const need = ios() && !standalone();
  IE.sheet('<h2>Kunlik eslatma</h2><p class="mu sm" style="margin:6px 0 12px;line-height:1.5">Belgilangan vaqtda — faqat o‘sha kuni hali mashq qilmagan bo‘lsangiz — telefoningizga bitta bildirishnoma keladi.</p>' +
    (need ? '<div class="card" style="margin-bottom:12px"><b>iPhone uchun</b><div class="sm mu" style="margin-top:4px;line-height:1.5">Bildirishnoma faqat ilova <b>Bosh ekranga qo‘shilgan</b> bo‘lsa ishlaydi: Safari → Ulashish → “Bosh ekranga qo‘shish”, so‘ng ilovani shu ikondan oching.</div></div>' : '') +
    '<div class="fld"><label>Vaqt (sizning soat mintaqangiz)</label><input id="pht" type="time" value="' + hm(s.hhmm) + '"></div>' +
    '<button class="btn block" data-a="pushon">' + ic('check') + ' ' + (s.on ? 'Vaqtni saqlash' : 'Yoqish') + '</button>' +
    (s.on ? '<div class="two" style="margin-top:10px"><button class="btn ghost" data-a="pushtest">Sinab ko‘rish</button><button class="btn ghost" data-a="pushoff" style="color:var(--bad)">O‘chirish</button></div>' : '') + '<div id="pst" class="sm mu" style="margin-top:10px"></div>');
};
const say = t => { const e = document.getElementById('pst'); if (e) e.textContent = t; };
A.pushon = async el => {
  const hhmm = toMin((document.getElementById('pht') || {}).value); el.disabled = true;
  try {
    const perm = Notification.permission === 'granted' ? 'granted' : await Notification.requestPermission();
    if (perm !== 'granted') { el.disabled = false; return say('Bildirishnomaga ruxsat berilmadi. Brauzer/telefon sozlamalaridan ruxsat bering.'); }
    say('Ulanmoqda…');
    const reg = await navigator.serviceWorker.ready, k = await SB.fn('ielts-push', { action: 'key' });
    let sub = await reg.pushManager.getSubscription();
    if (!sub) sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: u8(k.key) });
    await SB.fn('ielts-push', { action: 'sub', sub: sub.toJSON(), hhmm, tz: -new Date().getTimezoneOffset() });
    lsSet(KEY, { on: true, hhmm }); IE.closeSheet(); IE.toast('Eslatma yoqildi — har kuni ' + hm(hhmm)); if ((IE.curRoute || '') === 'me') IE.draw(false);
  } catch (e) { el.disabled = false; say('Yoqib bo‘lmadi: ' + errMsg(e)); }
};
A.pushoff = async () => {
  try { const reg = await navigator.serviceWorker.ready, sub = await reg.pushManager.getSubscription(); if (sub) { try { await SB.fn('ielts-push', { action: 'unsub', endpoint: sub.endpoint }); } catch (e) { /* */ } await sub.unsubscribe(); } } catch (e) { /* */ }
  lsSet(KEY, { on: false, hhmm: st().hhmm }); IE.closeSheet(); IE.toast('Eslatma o‘chirildi'); if ((IE.curRoute || '') === 'me') IE.draw(false);
};
A.pushtest = async () => { try { const reg = await navigator.serviceWorker.ready; await reg.showNotification('IELTS · BY AZIMOV', { body: 'Eslatma ishlayapti ✅ Har kuni shu vaqtda xabar olasiz.', icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'ielts-test' }); say('Bildirishnoma yuborildi.'); } catch (e) { say('Sinab bo‘lmadi: ' + errMsg(e)); } };
A.closeSheet = () => IE.closeSheet();

/* Ilovani o‘rnatish (kompyuter/telefon): brauzer “beforeinstallprompt” bergan bo‘lsa ko‘rsatiladi */
let ip = null;
window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); ip = e; if ((IE.curRoute || '') === 'me') IE.draw(false); });
window.addEventListener('appinstalled', () => { ip = null; IE.toast('Ilova o‘rnatildi'); if ((IE.curRoute || '') === 'me') IE.draw(false); });
IE.installMenu = () => '<button class="set" data-a="pwainst"><span class="bd sm sk-R">' + ic('dl') + '</span><div class="tx"><b>Ilovani o‘rnatish</b><span>' + (standalone() ? 'Hozir ilova oynasidasiz' : ip ? 'Alohida oynada, tezroq ochiladi — bir bosishda' : 'Telefon yoki kompyuterga alohida ilova sifatida') + '</span></div></button>';
const IURL = () => location.origin + location.pathname.replace(/[^/]*$/, '');
A.pwainst = async () => {
  if (ip) { try { ip.prompt(); await ip.userChoice; } catch (e) { /* */ } ip = null; if ((IE.curRoute || '') === 'me') IE.draw(false); return; }
  const droid = /android/i.test(navigator.userAgent), edge = /edg\//i.test(navigator.userAgent), ipad = ios();
  const steps = ipad ? ['Safari’da shu sahifani oching (Chrome emas).', 'Pastdagi <b>Ulashish</b> tugmasini bosing.', '<b>Bosh ekranga qo‘shish</b> ni tanlang, nomi: <b>IELTS</b>.', 'Ilovani Bosh ekrandagi ikondan oching.']
    : droid ? ['Chrome’da shu sahifani oching.', 'Yuqori o‘ngdagi <b>⋮</b> menyusini bosing.', '<b>Ilovani o‘rnatish</b> yoki <b>Bosh ekranga qo‘shish</b> ni tanlang.', 'Ilovani yangi ikondan oching.']
    : edge ? ['Edge menyusi <b>⋯</b> → <b>Ilovalar</b> → <b>Bu saytni ilova sifatida o‘rnatish</b>.', 'Nomi: <b>IELTS</b> — o‘rnating.']
      : ['Chrome manzil satrining o‘ng chetidagi <b>o‘rnatish belgisi</b>ni (⊕ yoki monitor) bosing; yo‘q bo‘lsa <b>⋮ → Cast, save and share → Install page as app</b>.', 'Nomi: <b>IELTS</b> — o‘rnating.'];
  IE.sheet('<h2>Ilovani o‘rnatish</h2>' + (standalone() ? '<div class="card" style="margin:10px 0"><b>Hozir ilova oynasidasiz</b><div class="sm mu" style="margin-top:4px;line-height:1.5">Agar bu oyna <b>Testlar</b> ilovasi bo‘lib ochilgan bo‘lsa — uni yoping, IELTS havolasini oddiy brauzerda oching va shu yerdan o‘rnating. Shunda IELTS alohida ilova bo‘ladi.</div></div>' : '') +
    '<ol class="notes" style="margin:10px 0 12px;padding-left:20px;line-height:1.7">' + steps.map(x => '<li>' + x + '</li>').join('') + '</ol>' +
    '<div class="card sm mu" style="margin-bottom:12px;line-height:1.5">' + ic('bulb') + ' Testlar ilovasi o‘rnatilgan bo‘lsa, brauzer ba’zan o‘rnatish taklifini ko‘rsatmaydi — yuqoridagi qo‘lda usul har doim ishlaydi. O‘rnatilgach “Open in app” IELTS’ni ochadi.</div>' +
    '<div class="two"><button class="btn ghost" data-a="pwacopy">Havolani nusxalash</button><button class="btn" data-a="closeSheet">Tushunarli</button></div>');
};
A.pwacopy = async () => { try { await navigator.clipboard.writeText(IURL()); IE.toast('Havola nusxalandi'); } catch (e) { IE.toast(IURL()); } };
})();
