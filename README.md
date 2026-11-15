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

## Yangi versiya chiqarish
Ilova o‘zgargach **`sw.js` dagi `VERSION` va `app.js` dagi `APP_VERSION` ni bir xil qilib oshiring** (masalan 1.5.0 → 1.5.1) — shunda foydalanuvchida “Yangi versiya tayyor · Yangilash” xabari chiqadi (`node tests/update.cjs` ikkalasi mosligini tekshiradi). Versiyani oshirmasangiz, qurilmalar eski fayllarda qoladi.

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
| `supabase/migrations/`, `supabase/functions/` | baza sxemasi, RLS va owner uchun server funksiyasi |
| `tools/tekshir.py` | bank tekshiruvchi |
| `tests/smoke.cjs` | Playwright sinovi: `node tests/smoke.cjs` |
| `KITOBDAN_TEST.md` | kitob/PDF’dan savol tuzish tartibi va format |

## Hisob va bulut (Supabase)
- **Hisobni faqat owner ochib beradi** (Sozlamalar → Foydalanuvchilar → *Yangi foydalanuvchi qo‘shish*: ism, **login** (masalan `abdulaziz1`) yoki email, parol (🎲), obuna muddati, to‘lov summasi). Oddiy login ichkarida `abdulaziz1@testlar.internal` bo‘lib saqlanadi (`config.js` → `loginDomain`; `.internal` pochta qabul qila olmaydi), foydalanuvchi esa faqat `abdulaziz1` ni ko‘radi; katta-kichik harf farqi yo‘q. Oddiy login bilan kirganlar uchun email orqali tiklash ishlamaydi — parolni owner “Parol” tugmasi bilan beradi. Tayyor login-parol matnini mijozga yuborasan. Ilovada “Ro‘yxatdan o‘tish” yo‘q (`config.js` → `allowSignup:false`); to‘g‘ridan-to‘g‘ri API orqali ochilgan hisob “faollashtirilmagan” bo‘lib, hech narsa qila olmaydi.
- **Obuna:** 30 kun / 3 oy / 6 oy / 1 yil / umrbod. Muddati tugasa yoki bloklansa — ilova yopiladi (server tomonida RLS bilan ham). To‘lovlar hisobi: shu oy / jami daromad, faol obunachilar.
- **Umumiy katalog:** Sozlamalar → Umumiy katalog (faqat owner). Savol bankini (`.json`) bir marta yuklaysan, faol obunachilarning hammasida kategoriya bo‘yicha (masalan “Madrasa”) o‘zi paydo bo‘ladi. Kitoblarni birma-bir qo‘shish mumkin: bir xil fan `id`sidagi yangi mavzular shu fanga qo‘shiladi. Qoralama rejimi, mavzu/fan o‘chirish bor. Obuna tugasa, katalog qurilmadan ham tozalanadi. Katalog fanlari obunachining shaxsiy bankidan ajratilgan (ularni o‘zgartirib/o‘chirib bo‘lmaydi); natijalari esa hisobga saqlanadi.
- **Parolni unutdim:** email orqali tiklash havolasi; yoki owner “Parol” tugmasi bilan yangisini beradi.
- Natijalar, xatolar va savol banki hisobga bog‘lanadi, boshqa qurilmada o‘zi tushadi; oflayn ham ishlaydi.
- **Owner:** `brodyagayou1999@gmail.com` (birinchi bo‘lib kirgan). Baza: `supabase/migrations/`, server funksiyasi: `supabase/functions/admin-users/` (maxfiy kalit faqat serverda). `config.js` dagi “publishable” kalit ochiq bo‘lishi mo‘ljallangan.
- **Supabase panelida sozlash kerak:** Authentication → *URL Configuration*: **Site URL** = ilovaning haqiqiy manzili va *Redirect URLs* ga ham shu manzilni qo‘shing (aks holda tiklash havolasi noto‘g‘ri joyga olib boradi). Ko‘p foydalanuvchi bo‘lsa — o‘z SMTP’ingizni ulang (standart pochta soatiga bir necha xat bilan cheklangan). Sotishdan oldin Pro rejaga o‘ting (bepul loyiha 1 hafta faolsiz qolsa to‘xtatiladi).
- Sinovlar: `node tests/smoke.cjs` (mahalliy rejim), `node tests/update.cjs` (animatsiya va yangi versiya xabari), `node tests/cloud.cjs` va `node tests/catalog.cjs` (jonli baza: `tests/cloud-users.sql` dagi hisoblarni o‘z parolingiz bilan yarating va `TEST_PW=<parol>` bering; sinovdan keyin hisoblarni o‘chiring).

## Ro‘yxatdan o‘tish, guruhlar va musobaqa (v1.6)
- **Taklif kodi bilan ro‘yxatdan o‘tish.** Owner: Sozlamalar → “Ro‘yxatdan o‘tish” (yoki Foydalanuvchilar sahifasi) — ochiq/yopiq, taklif kodi, necha kunga kirish beriladi va yangi hisoblar qaysi guruhga tushadi. Yopiq bo‘lsa, ilovada “Ro‘yxatdan o‘tish” tugmasi ko‘rinmaydi (server tekshiradi, kodsiz hisob faol bo‘lmaydi).
- **Guruhlar (kimga nima ko‘rinadi).** Har bir foydalanuvchi va har bir katalog fani guruhlarga ega bo‘lishi mumkin. Fan guruhsiz bo‘lsa — hammaga, guruhli bo‘lsa — faqat shu guruhdagilarga ko‘rinadi (RLS server tomonda). Foydalanuvchi: Foydalanuvchilar → “Guruh”. Fan: Umumiy katalog → “Tahrirlash” yoki yuklashda.
- **Musobaqa.** Bosh sahifadagi “Musobaqa”: xona ochiladi (5 belgili kod), kursdoshlar kod bilan qo‘shiladi, bir xil savollar, tez va to‘g‘ri javob ko‘proq ball beradi (100 + 60 gacha tezlik bonusi), jonli reyting va g‘oliblar zinapoyasi. Ball klientda hisoblanadi, server faqat chegaradan oshmasligini tekshiradi (do‘stlar orasida o‘ynash uchun).
- **Kim ochadi.** Musobaqani faqat owner va owner tanlaganlar ochadi (Foydalanuvchilar → “Musobaqa ochishga ruxsat”); qolganlar kod bilan qo‘shiladi. Server tekshiradi.
- **Haftalik reyting** (Musobaqa → Haftalik reyting): ball = to‘g‘ri javob × 10 + musobaqa ballari; Mashq va Imtihon rejimlari hisoblanadi, hafta dushanba 00:00 (Toshkent) da yangilanadi; faqat o‘z guruhingdagilar ko‘rinadi.
- Migratsiyalar: `supabase/migrations/20261115_groups_signup_arena.sql`, `20261115b_host_permission_weekly_board.sql`; sinov: `tests/arena.cjs` (jonli Supabase, 2 o‘yinchi).

## Savol xabarlari, statistika va konspektlar (v1.8)
- **Savolda xato bormi?** Katalogdagi savol javobidan keyin talaba “Savolda xato bormi?” tugmasini bosadi. Owner: Sozlamalar → **Savol xabarlari** — savol, variantlar, sabab va izohlar; “Tuzatish” savolni ilovaning o‘zida tahrirlaydi (hamma foydalanuvchida yangilanadi), “Hal qilindi”/“Rad etish”.
- **Statistika (owner).** Sozlamalar → **Statistika**: foydalanuvchilar, faolligi, umumiy aniqlik, eng qiyin savollar va mavzular. Ma’lumot talabalar Mashq/Imtihon testlarini yakunlaganda yig‘iladi; Foydalanuvchilarda “oxirgi kirish” ko‘rinadi.
- **Konspekt.** Mavzu qatoridagi kitob tugmasi: o‘qish ekrani, jumlani bosib 3 rangda belgilash (“Belgilash”ni yoqing), shaxsiy yozuv, “O‘qidim”, PDF/chop etish, “Shu mavzudan test”. Belgilar va yozuvlar hisobga sinxronlanadi.
- **Konspekt qo‘shish:** `banklar/konspekt/<fan>/<mavzu>.md` yozing (birinchi qator `# Sarlavha`; `##`, `-`, `1.`, `| jadval |`, `> eslatma`, `!! imtihonda tushadi`, `**qalin**`, `==muhim==`), keyin `python3 -I tools/konspekt_sql.py` bergan SQLni Supabase’da ishga tushiring (`catalog_notes`). `<fan>` va `<mavzu>` katalogdagi fan/mavzu `id`si bo‘lsin; ko‘rinish fan ko‘rinishiga (guruhlarga) bog‘liq.
- Migratsiya: `supabase/migrations/20261115c_reports_stats_notes.sql`; sinov: `tests/notes.cjs`.

## IELTS (eski "Kunlik tizim" paketidan)
- **Cambridge so‘zlari** (shaxsiy yopiq fayl `cambridge-sozlar.json`): `python3 -I tools/cambridge_bank.py <fayl>` → `banklar/_private/cambridge-sozlar-bank.json` (14 fan, 144 mavzu, ~7550 savol: so‘z→ma’no va ta’rif→so‘z). **Litsenziyali kontent — repoga tushmaydi** (`banklar/_private/` gitignore’da); faqat o‘zingizning telefoningizga Sozlamalar → “Fayl qo‘shish” orqali yuklanadi, umumiy katalogga emas.
- **Strategiyalar** (`tools/ielts_strategiya.py`): `banklar/ielts/strategiya.json` (fan `ielts`, 6 mavzu) + `banklar/konspekt/ielts/*.md` (konspektlar).
- **8+ mavzuli so‘zlar** (`tools/ielts_sozlar.py`, manba `banklar/ielts/sozlar8.txt`): `banklar/ielts/sozlar8.json` (fan `ielts8`, 18 mavzu, 720 savol).
- Katalogga yuklashda kategoriya “IELTS”, guruh `ielts` bering (faqat shu guruhdagilar ko‘radi).

## Ma’lumot qayerda saqlanadi
Savol banki — IndexedDB, natijalar/xatolar/sozlamalar — localStorage (faqat shu qurilmada). **⚙️ Sozlamalar → Zaxira** bilan fayl qilib saqlab, boshqa qurilmada tiklash mumkin. Safari uzoq foydalanilmagan sayt ma’lumotini o‘chirib yuborishi mumkin — shuning uchun vaqti-vaqti bilan zaxira ol.
