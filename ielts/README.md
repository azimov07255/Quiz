# IELTS · BY AZIMOV

IELTS **Academic** tayyorgarligi uchun alohida PWA (Testlar ilovasi bilan bir repoda, `/ielts/` papkasida).
Hisob, parol va Supabase loyihasi **Testlar bilan umumiy** — alohida repo yoki loyiha kerak emas.

## Kirish huquqi
Foydalanuvchida `ielts` **guruhi** bo‘lishi (yoki owner bo‘lishi) kerak. Owner Testlar ilovasida
Egasi → Foydalanuvchilar → Guruhlar bo‘limida `ielts` guruhini qo‘shadi. Guruhsiz foydalanuvchi “Ruxsat kerak” ekranini ko‘radi.
Server tomonida ham `can_ielts()` va `ielts_state` jadvalidagi RLS shuni tekshiradi
(`supabase/migrations/20261116_ielts_state.sql`).

## Hozir ishlaydi (v2.4.2)
- **Dictionary (eski)** (`dictold.js`, Tools → Lug‘at): v1.2 dagi tezkor lug‘at — ochiq lug‘at (IPA, ovoz, ta’rif) darhol, o‘zbekcha tarjima AI orqali keyin. Yangi Dictionary’dan mustaqil (`#/dictold`, alohida kesh va amallar).
- **“Open in app” Testlar o‘rniga ochilishi**: Testlar PWA’ning scope’i (`/Quiz/`) IELTS (`/Quiz/ielts/`) ni ham qamraydi. IELTS’ni alohida o‘rnatsangiz (Profil → “Ilovani o‘rnatish” yoki iPhone’da Bosh ekranga qo‘shish), brauzer eng aniq scope’li ilovani ochadi. Manifest’ga `id` qo‘shildi.

## (v2.4.0)
- **Kunlik eslatma** (`push.js`, `ielts-push` funksiyasi, `pg_cron`): Profil → Kunlik eslatma → vaqt tanlanadi; server har 10 daqiqada tekshiradi va — agar o‘sha kuni hali mashq qilinmagan bo‘lsa — Web Push yuboradi (payload’siz; matn `sw.js` ichida). VAPID kalitlari funksiyaning o‘zida yaratiladi va bazada (`ielts_push_cfg`, RLS, faqat servis roli) saqlanadi — qo‘lda sir kiritish shart emas. iPhone’da ilova **Bosh ekranga qo‘shilgan** bo‘lishi kerak (iOS 16.4+).
- **Sayt ko‘rinishi**: kompyuterda (≥1000px) chap menyu + keng kontent ustuni; telefon ko‘rinishi o‘zgarmaydi. Profil → “Ilovani o‘rnatish” (brauzer taklif qilsa) — alohida oynada ochiladigan ilova. Havola ulashilganda chiroyli ko‘rinish uchun Open Graph teglari qo‘shildi.
- **O‘z domeni**: hosting qaysi bo‘lsa, shu yerda domen ulang (masalan GitHub Pages: Settings → Pages → Custom domain; DNS’da `CNAME` yozuvi). Domen ulangach `index.html` dagi `og:image` ni to‘liq manzilga (`https://domen/ielts/icons/icon-512.png`) almashtiring — ijtimoiy tarmoqlar rasmni shunda ko‘rsatadi. Supabase’da Auth → URL Configuration → Site URL / Redirect URLs ga ham yangi domenni qo‘shing.

## (v2.3)
- **Guruhlar** (`groups.js`; Profil/Tools → Guruhlar): ikki xil — *Do‘stlar guruhi* (haftalik reyting: oxirgi 7 kun faollik bali, seriya, fokus daqiqalari) va *O‘qituvchi sinfi* (guruh egasi vazifa beradi — tayyor mashq havolalari bilan; a’zolar qadamlarni belgilaydi; a’zolar insho yuboradi, ega izoh yozadi; ega har a’zoning band/maqsad/mashq sonini ko‘radi). Kod bilan qo‘shilish (6 belgi). Maxfiylik: a’zolar bir-birining faqat ism, seriya, haftalik ball, fokus daqiqasini ko‘radi.
- Baza (`ielts_groups`, `ielts_members`, `ielts_summary`, `ielts_assign`, `ielts_assign_prog`, `ielts_works`, `ielts_comments`): RLS yoqilgan, to‘g‘ridan-to‘g‘ri kirish yo‘q — hammasi `security definer` RPC orqali (`ielts_group_*`, `ielts_assign_*`, `ielts_work_*`, `ielts_publish_summary`), har birida a’zolik/egalik tekshiruvi.

## (v2.2)
- **Savol turlari trenajyori** (`qtypes.js`, `data/qtypes.json`; Practice → “Savol turlari”): True/False/Not Given (8 matn · 32 gap), Matching Headings (3 matn), Listening Map/Plan labelling (3 xarita, audio brauzer TTS orqali), Paraphrase (AI baho: `ielts-wr` `mode:'para'`) va Collocation (25 birikma; xatolari “Iboralarimga” qo‘shiladi). Har javobga “nega” tushuntirishi; natijalar `S().qt` (bulutga birlashadi).
- **Bugungi 15 daqiqa** (`quick15.js`, Home): 3 ta 5-daqiqalik qadam (takror → eng zaif ko‘nikma → xatolar banki/maqola); bugungi faoliyatdan avtomatik belgilanadi.
- **Hisobot** (`report.js`, Profil → Hisobot): ko‘nikmalar, maqsadga yetish bashorati (taxminiy sana), faollik, savol turlari, Mock tarixi, tavsiyalar, o‘qituvchi izohi uchun joy; “PDF sifatida saqlash” (chop etish stili).
- **Natija kartasi** (PNG, ulashish): Mock, Reading, Listening va Writing (AI) natijalarida.
- **Fikr bildirish** (`feedback.js`, Profil → Boshqa): `ielts_feedback` jadvali (faqat RPC orqali: `ielts_send_feedback`, owner uchun `owner_feedback_list`/`owner_feedback_set`); owner “Fikrlar” sahifasini ko‘radi.

## (v2.1)
- **Reading 40 savol**: 3 passage = 13 + 13 + 14 (Mock’dagi “39 savol” tuzatildi).
- **Writing Task 1**: 6 ta tayyor diagramma (ustunli, chiziqli, doira, jadval — SVG, `task1.js`); AI bahosi diagramma ma’lumotlarini matnli tavsif sifatida oladi (`ielts-wr`). Task 1 — 150+ so‘z, 20 daqiqa.
- **Speaking Part 3**: Part 2 mavzusining muhokama savollari alohida (`speaking/3/<i>`) — yozib olish + AI baho; Cambridge Speaking kartasida ham.
- **Mock**: Writing Task 1 + Task 2, Speaking Part 1 + 2 + 3; Writing bandi Task 1 : Task 2 = 1 : 2 og‘irlik bilan.
- **Cambridge kitobdan avtomatik**: “Strukturani qayta aniqlash” endi Writing Task 1/2 va Speaking sahifalarini ham matn bo‘yicha topadi (WRITING TASK 1/2, SPEAKING PART 1…), “Test n ni qo‘shish” sahifani rasmga olib `ielts-wr` (extract) orqali Writing/Speaking birliklarini ham qo‘shadi. Topilmasa, bet oralig‘ini qo‘lda yozsa bo‘ladi.
- **Fayldan import**: Cambridge → Reading/Listening qo‘shish ichida HTML (CD), PDF, TXT/MD fayl(lar)dan matn olinadi (`IE.fileText`) va `camimport` ga beriladi.
- **Internetdan topib qo‘shish**: Maqolalar — Wikipedia (CORS API) dan mavzu bo‘yicha eng mos maqola(lar); Podkastlar — iTunes katalogi → RSS → birinchi epizod; bo‘sh qidiruv = IELTS mavzusini o‘zi tanlaydi. Maqola RSS manbalari (BBC, VOA Learning English) tayyor tugmalar sifatida.

## (v2.0)
- **Xatolar banki** (`mb.js`): Reading va Listening’dagi barcha xato savollar (har testning oxirgi urinishi bo‘yicha) takrorlash tizimida (1–3–7–16–35 kun). To‘g‘ri → keyingi quti, xato → bugun yana qaytadi. Zaif savol turlari, Home kartasi, Reja vazifasi, qurilmalar o‘rtasida sinxron (`S().mb`).
- **Writing murabbiy**: baholangan inshoni “Qayta yozish” (asl nusxaga bog‘lanadi) → qayta baholash → mezonlar bo‘yicha oldingi/hozirgi solishtirish; “Mezonlar dinamikasi” grafigi; AI tuzatishlarini bir bosishda “Iboralarimga” (lug‘at + takrorlash).
- **AI haftalik trener**: Reja → Hafta (yakshanba/dushanba — Home’da ham) — AI hafta statistikasi, band trendi, xatolar banki va Writing mezonlariga qarab tahlil qiladi va keyingi hafta rejasini taklif kartasi sifatida beradi (tasdiqlab qo‘llanadi).
## (v1.9)
- **Cambridge Writing va Speaking** (`camws.js`, Edge Function `ielts-wr`): test sahifasida Writing Task 1/2 va Speaking (Part 1–3) kartalari. Savollarni yozasiz yoki kitob sahifasi suratidan AI o‘qiydi (Task 1 uchun diagramma tavsifi ham). Diagramma surati faqat qurilmada; matn va tavsif shaxsiy bulutda sinxronlanadi. Mashq — oddiy Writing/Speaking ekranlari (Task 1: 150 so‘z, taymer, diagramma ko‘rinadi); Writing baholash Task Achievement/Response bo‘yicha (`ielts-wr` eval); Speaking — mavjud audio-tahlil (haqiqiy ovoz transkripsiyasi). Test bandiga Writing (T1:T2 = 1:2) va Speaking ham kiradi.
- Tuzatish: to‘liq Reading boshlanganda banner (Listening sessiyasidan keyin) chiqmasdi.
## (v1.8)
- **Navigatsiya**: orqaga (swipe-back) animatsiyasiz va avvalgi scroll joyiga qaytadi; AI yordamchi endi orqaga-oldinga tsikl hosil qilmaydi; Chat ekrani to‘liq ekranni egallaydi (klaviatura ochilganda gina visualViewport).
- **Practice → Cambridge IELTS** kartasi (Tools’dan ko‘chirildi).
- **Reja**: vazifalarni tahrirlash (nom, daqiqa, sana — boshqa kunga ko‘chirish), tartibini yuqoriga/pastga o‘zgartirish, kunlik vaqt 20–720 daqiqa (qo‘lda kiritiladi), istalgan kunga vazifa qo‘shish.
- **Profil**: “Imtihon sozlamalari” yig‘iladigan blok (xulosa bilan).
- **Test ro‘yxatlari** (`lists.js`): Listening/Reading ro‘yxatlari va Cambridge test sahifasi — raqamli kartalar, natija halqasi (band), Tahlil/Qayta tugmalari, filtrlar (Hammasi/Yangi/Bajarilgan/Davom).
## (v1.7)
- **Dizayn uslublari** (Profil → Ko‘rinish → Dizayn uslubi): **Standart**, **Liquid Glass** (iPhone uslubidagi xira shisha: backdrop blur, yorqin jonli fon, yaltiroq tugmalar va menyu) va **Oltin Premium** (qora/ivory + tilla gradient, serif sarlavhalar, yaltiroq hero). Hammasi yorug‘ va tungi rejim bilan ishlaydi; tanlov saqlanadi. Liquid Glass aksent ranglar bilan birga ishlaydi.
## (v1.6)
- **AI agent** (`agent.js`, Edge Function `ielts-agent`): Chat → “AI yordamchi” (yoki Reja → “AI bilan reja tuzish”, Tools). “2 haftalik reja tuz”, “ertaga dam kuni”, “Writing uchun 10 ta so‘z qo‘sh”, “maqsadim 7.5” kabi so‘rovlarga **taklif kartasi** chiqaradi; faqat “Qo‘llash” bosilgach bajariladi, “Bekor qilish” bilan qaytariladi. Amallar: vazifa qo‘shish (reja bilan bog‘langan, bajarilganda avtomatik belgilanadi), dam kuni, eski AI vazifalarni o‘chirish, profil sozlamalari, so‘z qo‘shish, ekranni ochish. Mijoz har amalni tekshiradi (sana, qiymat, marshrut oq ro‘yxati).
- **Tahlil markazi: Listening** — Reading kabi: skript so‘zlari, har savol uchun “nega?”, xato turlari (eshitish bo‘yicha maslahatlar), qayta yechish, skriptda dalil, so‘zlar testi.
## (v1.5)
- **Tahlil markazi** (`analyze.js`, Reading): avval toza ishlang, keyin `Natija → Tahlil qilish` (yoki Tools → Tahlil markazi). Bo‘limlar: Sharh (1-urinish va “tahlildan keyin” band, bosqichlar, xato sabablari) · So‘zlar (matnda topilgan Cambridge ro‘yxati + 8+ lug‘at + mening so‘zlarim; yodlayman/bilaman, flesh-kartalar) · Savollar (xato turi, dalil, AI “nega to‘g‘ri/xato?” — `ielts-dict` `qa` rejimi) · Qayta yechish · Matn (so‘z va dalillar bo‘yalgan) · So‘zlar testi.
## (v1.4)
- **Home**: kun gapi, tezkor tugmalar (Fokus/Lug‘at/Typing/Suhbat), “Davom ettiring” (tugallanmagan Reading/Listening), ko‘nikmalar qatori (band, maqsadgacha farq, mini grafik), **band prognozi** (trend bo‘yicha), 10 haftalik faollik xaritasi.
- **Chat 2.0** (`chat.js`): rejimlar — Part 1/2/3, imtihon simulyatori (tuzatishsiz), Grammar coach, hayotiy vaziyat; tezkor yordam (Maslahat, Namuna javob, Keyingi savol, Tugatish → yakuniy hisobot); Part 2 taymeri (1+2 daq); AI so‘zlarini bosib lug‘atga o‘tish; ovozli o‘qish; **Xatolar daftari**; suhbatlar tarixi.
- **Profil 2.0** (`me.js`): daraja/XP, statistika, prognoz, 16 haftalik xarita, haftalik hisobot, 6 aksent rang, haptik sozlama, **zaxira nusxa/tiklash** (JSON), progress kartasini ulashish (PNG).
- **Reja**: shaxsiy vazifa qo‘shish, “Dam olish kuni” (seriya uzilmaydi), boshlanish vaqtidan jadval, haftalik hisobot, oylik faollik xaritasi.
- **Fokus taymeri** (`focus.js`): 15–60 daq, hamma sahifada mini-taymer, ekran o‘chmaydi, daqiqalar kunlik maqsadga qo‘shiladi.
- (v1.3) **Practice: bitta qism yoki to‘liq** — Practice, Listening va Reading ro‘yxatlarida tanlov: “Bitta qism · 10–13 savol” yoki “To‘liq” (Listening 4 qism / Reading 3 passage, 60 daqiqa, Scores bilan). Tanlov eslab qolinadi.
- **Dictionary 2.0** (`dict.js`, edge function `ielts-dict`): avto-takliflar, ta’rif + UK/US talaffuz, o‘zbekcha tarjima (AI, umumiy kesh), sinonim/antonim/birikma/so‘z oilasi/IELTS misollari tablari, O‘zbekcha→Inglizcha va gap tarjimasi (paraphrase bilan) rejimlari, sevimlilar, tarix, ovozli qidiruv, “Lug‘atimga”/flesh-kart, mini-test, `dict/<so‘z>` havolasi (matn/maqoladagi so‘zdan ham).
- **Tools markazi**: tezkor lug‘at qidiruvi, “Davom ettirish”, guruhlangan vositalar (statistika bilan).
- **Podkast reklamasi**: homiy/reklama gaplari xira ko‘rsatiladi; moslash oynasida “dastur boshlanishi” tugmasi — audioda dastur boshlanganda bosiladi, siljish avtomatik hisoblanadi.
- **Home**: target band, overall, seriya, imtihongacha kun, tezkor mashq, so‘nggi natijalar
- **Listening**: 8 ta haqiqiy diktor yozuvi (VOA Learning English, ommaviy mulk; `audio/`), 80 savol, imtihon rejimi (bir marta, to‘xtatib bo‘lmaydi) va mashq rejimi (to‘xtatish, 10 s orqaga, tezlik), natijada har savol uchun “shu joydan tinglash” va bosiladigan transkript. Yozuv va matn mosligi offlayn nutq tanish bilan tekshirilgan, vaqtlar shu orqali aniqlangan
- **Articles & Podcasts**: 8 ta VOA maqolasi (audio + rasm), matn audio bilan birga yuradi (joriy gap belgilanadi, ▶ bilan shu joydan tinglash), so‘z bosilsa ma’no (maqola lug‘ati → ochiq lug‘at → AI tarjima), 10 ta lug‘at, 3 ta grammatika qoidasi va 8 ta savol; rasmlar Wikimedia Commons (CC0/PD/CC BY(-SA)), mualliflari `data/articles.json` da.
  Podkast RSS yoki maqola havolasini qo‘shish: audio AI bilan transkripsiya qilinadi (Groq Whisper → so‘z-so‘z karaoke; zaxira: Gemini), keyin “Tahlil qilish” lug‘at/grammatika/savollarni tuzadi. Transkriptlar serverda keshlanadi (`ielts_transcripts`).
- **Reading**: 3 ta Academic matn (39 savol; heads / T-F-NG / MCQ / gap to‘ldirish), 20 daqiqalik taymer, gapni belgilash, tushuntirishli natija, taxminiy band
- **Writing**: 30 ta Task 2 mavzu, taymer, so‘z hisoblagich, qoralama, o‘zini tekshirish ro‘yxati, 2 ta Band 8 namuna insho
- **Mock Test**: to‘liq (4 Listening + 3 Reading + Writing + Speaking) yoki tezkor rejim; bo‘limlar mavjud mashq ekranlari orqali topshiriladi, natijalar avtomatik yig‘iladi, umumiy band va eng zaif bo‘lim bo‘yicha maslahat.
- **Kitoblar (PDF)**: Tools → Kitoblar. PDF yuklash, Matn rejimi (so‘zni bossangiz tarjima + lug‘atga qo‘shish) va Sahifa rejimi (asl ko‘rinish, zoom), betni AI mashqqa aylantirish, kunlik reja (tugatish sanasi yoki kunlik bet), 7 kunlik statistika, Home’da “Bugungi reja”. Saqlash: qurilmada (IndexedDB) va/yoki bulutda (Supabase Storage `ielts-books`, shaxsiy papka, 50 MB gacha; boshqa qurilmada avtomatik yuklab olinadi). Kitob ichida qidiruv (indekslanadi, natija belgilanadi) va OCR (skaner PDF: tesseract.js, offline, `vendor/tesseract/`). PDF o‘qish kutubxonasi: pdf.js (Apache-2.0, `vendor/pdfjs/`).
- **Cambridge — kitobdan avtomatik**: Cambridge → “Kitobdan hammasini avtomatik”. Ilova kitob betlarining boshi/oxirini AI’ga (`cammap`) yuboradi → Test 1–4 uchun Listening part / Reading passage / audioscript / javoblar kaliti bet oralig‘i xaritasi (tahrirlash mumkin) → “Test N ni qo‘shish” 3 Reading + 4 Listening’ni ketma-ket `camimport` bilan tayyorlaydi (mavjudlari o‘tkazib yuboriladi) → 4 ta mp3 birdan tanlanib Section 1–4 ga biriktiriladi.
- **Imtihon tajribasi (v1.2)**: Cambridge Test sahifasida “Haqiqiy imtihon rejimi” (Listening 4 qism ketma-ket, audio bir marta → Reading 60 daqiqa umumiy vaqt → umumiy band) — qismlarni alohida topshirish (eski usul) ham saqlangan; **Scores** sahifasi (javoblar jadvali 1–40, dalil, urinishlar tarixi); **savollar paneli** + ‘keyinroq’ belgisi; **javoblar kaliti** va **dalil** (Reading’da matn parchasi, Listening’da audioscript + shu joydan tinglash); Reading’da erkin matn **belgilash** (3 rang), **izoh** daftari, matn o‘lchami; pleyer menyusi (tezlik, ovoz, A–B takrorlash, klaviatura: Space/←/→).
- **Kitob uslubidagi test ko‘rinishi** (Jumpinto/Cambridge): “Questions 1–10” sarlavhasi, KATTA HARFLI shartlar qalin, gap’lar matn ichida qutida (raqamli doira bilan), READING PASSAGE sarlavhasi; kompyuterda ≥960px — Reading’da matn va savollar yonma-yon, Listening’da plеyer/audioscript va savollar ikki ustunda. Audioscript ko‘rsat/yashir tugmasi (so‘z-so‘z vaqt bo‘lsa ijro bilan belgilanadi; imtihon rejimida audio tugagach ochiladi), +10s, har qism javoblari alohida saqlanadi. Cambridge testlarida pastda qismlar navigatori: Scores · L1–4 · R1–3.
- **Reja (kunlik/haftalik/oylik)**: Home’dagi “Bugungi reja” kartasi va `Reja` sahifasi (Bugun / Hafta / Oy). Vazifalar hafta kuni shabloni, kunlik vaqt (30–180 daq), eng zaif ko‘nikma, imtihongacha qolgan kun (poydevor → ko‘nikmalar → intensiv → oxirgi hafta), SRS kutayotgan so‘zlar va kitob rejalaridan tuziladi; bajarilganlik yozuvlardan avtomatik aniqlanadi (qo‘lda ham belgilash mumkin). Oy: faollik kalendari, oylik maqsadlar, yo‘l xaritasi. XP/daraja va nishonlar (`Yutuqlar`), “Kun so‘zi”.
- **Typing**: Tools → Typing — 1 daqiqalik test, Writing sprint (3 daq), IELTS so‘zlari, abzats ko‘chirish; WPM, aniqlik, eng ko‘p adashilgan belgilar, rekordlar va grafik (`typ` holat bilan sinxronlanadi).
- **Cambridge tartibi**: Cambridge sahifasida testlar kitob bo‘yicha guruhlanadi (masalan “Cambridge 18”) va Test 1–4 kartalari bo‘ladi: Listening / Reading (topshirilganda band), Writing / Speaking (tez orada). Karta → Test sahifasi: 4 Section + 3 Passage, natija, o‘chirish. Guruhlash test nomidan (“Kitob · Test n · Passage/Section k”) olinadi, qo‘lda/JSON bilan qo‘shilganlar ham shu nomda bo‘lsa guruhga tushadi.
- **Cambridge audio ZIP + vaqtli transkript**: “Kitobdan avtomatik” ichida audio arxivi (zip) tanlanadi — brauzerda oqim bilan ochiladi (fflate, `vendor/fflate/`), fayl nomidan Test/Section aniqlanadi (aniqlanmasa 16 ta fayl tartibi bo‘yicha, yoki qo‘lda tanlanadi); hali tuzilmagan Test uchun audio kutish omborida turadi va Test tuzilganda o‘zi biriktiriladi. “Vaqtli transkript (AI)” audioni mp3 bo‘laklariga bo‘lib `audiotr` (Whisper) ga yuboradi, kitobdagi audioscript abzatslari so‘z-so‘z (LCS) vaqtga moslanadi; natijada “shu joydan tinglash” va savol vaqtlari paydo bo‘ladi.
- **Cambridge (shaxsiy)**: Practice/Tools → Cambridge IELTS. Kitob PDF’idan (Kitoblar) Reading passage yoki Listening section tanlanadi: test sahifalari + javoblar kaliti (+ audioscript) matni AI’ga (`camimport`) yuboriladi, natija tekshiruvdan o‘tib qurilmada (IndexedDB) va — yoqilgan bo‘lsa (standart) — foydalanuvchining shaxsiy yopiq Storage papkasida (`ielts-books/<uid>/cam/`, RLS) saqlanadi; repoga tushmaydi. Boshqa qurilmada avtomatik tiklanadi (indeks id bo‘yicha qo‘shiladi, o‘chirish tombstone bilan), audio kerak bo‘lganda yuklab olinadi. Oddiy Reading/Listening dvigatelida yechiladi (Mock’ga qo‘shilmaydi). Audio mp3 qurilmadan tanlanadi. JSON yuklash ham bor (`{reading:[…], listening:[…]}`, AI chiqargan sxema).
- **Podkastlar**: alohida tab; 9 ta tayyor epizod (BBC 6 Minute English, VOA As It Is — `data/podcasts.json`) birinchi ochilganda qo‘shiladi; yangisini qo‘shganda sahifada qoladi va ro‘yxat tepasida chiqadi. Transkript birinchi ochilganda AI bilan tuziladi.
- **Yangilash tugmasi**: Home va Profilda; ilovadan chiqmasdan yangi versiyani tekshiradi va o‘rnatadi.
- **Speaking AI**: yozib olingan javob serverda matnga aylanadi (Groq Whisper → zaxira Gemini), so‘ng 4 IELTS mezoni bo‘yicha baholanadi (talaffuz ovozdan emas, matndan taxmin qilinadi), xatolar, namunaviy javob.
- **Ibora rejimi**: maqolada ketma-ket so‘zlarni bosib yoki matnni belgilab phrasal verb / collocation ma’nosini kontekst bilan olish.
- **Shadowing** va **Dictation**: VOA maqolalarining gap vaqtlari asosida (gapni tinglash, takrorlab yozib olish, so‘zma-so‘z tekshirish).
- **Speaking**: Part 1 (8 mavzu), Part 2 (8 cue card, 1 daq tayyorgarlik + 2 daq nutq), Part 3 savollari; mikrofon bilan yozib olish va qayta tinglash
- **So‘zlar**: 18 mavzu / 360 ta 8+ so‘z, flesh-karta (Leitner takrorlash), talaffuz (TTS)
- **Shaxsiy lug‘at**: foydalanuvchi o‘z `cambridge-sozlar.json` faylini yuklaydi — fayl faqat shu qurilmada (IndexedDB) saqlanadi, repoga/serverga tushmaydi
- **Strategiyalar**: 23 ta (qadamlar, tuzoqlar, Band 8+ maslahati)
- Profil: ism, maqsad band, daraja, imtihon sanasi, tungi rejim, parol, chiqish; natijalar `ielts_state` orqali qurilmalar o‘rtasida sinxronlanadi

- **AI** (Edge Function `ielts-ai`, `supabase/functions/ielts-ai/`): Speaking Chat (inglizcha suhbat + o‘zbekcha tuzatish, ovozdan matn), Writing Task 2 bahosi (4 mezon, xatolar, kuchaytirilgan variant), Dictionary (“Mening so‘zlarim”ga qo‘shish)

### AI ni yoqish
Supabase → Edge Functions → Secrets: `GEMINI_API_KEY` (aistudio.google.com/apikey) va/yoki `GROQ_API_KEY` (console.groq.com). Ixtiyoriy: `AI_DAILY_LIMIT` (standart 30 so‘rov/kun/foydalanuvchi; owner cheksiz), `GEMINI_MODEL`, `GROQ_MODEL`.
Kalit brauzerga hech qachon tushmaydi; funksiya faqat `can_ielts()` ruxsati bor foydalanuvchiga ishlaydi.

## Tez orada
Typing.

## Fayllar
`index.html`, `style.css`, `core.js` (holat/sinxron), `screens.js` (ekranlar), `app.js` (kirish/yo‘naltirish), `sw.js` (offline), `data/*.json` (matnlar, so‘zlar, strategiya, mavzular).
Ilova o‘zgargach `sw.js` dagi `VERSION` va `core.js` dagi `APP_VERSION` ni birga oshiring.

## Sinash
```bash
node tests/ielts.cjs        # Supabase soxtalashtirilgan, rasmlar: SHOTS=papka
```
