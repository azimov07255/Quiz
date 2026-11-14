# Testlar — mustaqil PWA

Har xil fanlar (univer, madrasa va h.k.) bo‘yicha 4 variantli testlar: **fan → mavzu → savollar**. Telefonda (iPhone Safari) “Ekranga qo‘shish” bilan o‘rnatiladi, **internetsiz ishlaydi**. Server, hisob, kalit kerak emas.

## Imkoniyatlar
- **Rejimlar:** ✍️ Mashq (har javobdan keyin izoh) · ⏱ Imtihon (taymer, savollar ro‘yxati) · 🧠 Ochiq (o‘zing o‘ylab, keyin baholaysan)
- Mavzu / butun fan / **bir nechta mavzu tanlab** / hamma fanlardan umumiy test; 10-20-30-50-hammasi
- **Xatolar banki** va takrorlash (xato → ertasi, to‘g‘ri → 3 kundan keyin; 2 marta ketma-ket to‘g‘ri bo‘lsa banklardan chiqadi)
- 📅 **Imtihon sanasi** → “kuniga N ta yangi savol” rejasi
- 🔥 Kunlik maqsad halqasi, ketma-ket kunlar (streak), o‘zlashtirish foizi, 7 kunlik faollik grafigi
- 🚩 Shubhali savollarni belgilash, 📊 statistika (zaif mavzular), zaxira/tiklash
- Yorug‘/qorong‘i/avto tema, animatsiyalar, 80%+ natijada tabrik effekti (“harakatni kamaytirish” sozlamasiga bo‘ysunadi)
- Bank import: bir nechta `.json`, validatsiya, mavjud mavzular saqlanadi

## Ishga tushirish
Statik fayllar — istalgan server bilan:
```bash
python3 -m http.server 8000   # keyin http://localhost:8000
```
PWA/offline uchun HTTPS (yoki localhost) kerak, masalan GitHub Pages/Netlify/Cloudflare Pages’ga joylash.

## Fayllar
| Fayl | Vazifasi |
|---|---|
| `index.html`, `style.css`, `app.js` | ilova |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA / offline |
| `data/testlar-banki.json` | namuna bank (239 savol, “Namuna” tugmasi yuklaydi) |
| `auth.js`, `config.js` | Supabase Auth/PostgREST mijozi va loyiha sozlamasi |
| `supabase/migrations/` | baza sxemasi va xavfsizlik (RLS) |
| `tools/tekshir.py` | bank tekshiruvchi |
| `tests/smoke.cjs` | Playwright sinovi: `node tests/smoke.cjs` |
| `KITOBDAN_TEST.md` | kitob/PDF’dan savol tuzish tartibi va format |

## Hisob va bulut (Supabase)
- Kirish: email + parol (ilovaning o‘zidan ro‘yxatdan o‘tiladi). Natijalar, xatolar va savol banki hisobga bog‘lanadi va boshqa qurilmada o‘zi tushadi; oflayn ham ishlaydi, internet kelganda sinxronlanadi.
- **Owner:** `brodyagayou1999@gmail.com` BIRINCHI bo‘lib ro‘yxatdan o‘tganda avtomatik owner bo‘ladi (⚙️ → Foydalanuvchilar: bloklash, +30 kun, umrbod, o‘chirish).
- Baza: `supabase/migrations/` (profiles, app_state, quiz_banks + RLS). `config.js` dagi “publishable” kalit ochiq bo‘lishi mo‘ljallangan; maxfiy kalit repoga yozilmaydi.
- **Supabase panelida bir marta:** Authentication → Sign In / Providers → Email → **“Confirm email”** ni o‘chiring (yoki o‘z SMTP’ingizni ulang), aks holda har bir ro‘yxatdan o‘tishda tasdiqlash xati kerak bo‘ladi.
- Sinovlar: `node tests/smoke.cjs` (mahalliy rejim), `node tests/cloud.cjs` (jonli baza, `tests/cloud-users.sql` kerak).

## Ma’lumot qayerda saqlanadi
Savol banki — IndexedDB, natijalar/xatolar/sozlamalar — localStorage (faqat shu qurilmada). **⚙️ Sozlamalar → Zaxira** bilan fayl qilib saqlab, boshqa qurilmada tiklash mumkin. Safari uzoq foydalanilmagan sayt ma’lumotini o‘chirib yuborishi mumkin — shuning uchun vaqti-vaqti bilan zaxira ol.
