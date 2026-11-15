# IELTS · BY AZIMOV

IELTS **Academic** tayyorgarligi uchun alohida PWA (Testlar ilovasi bilan bir repoda, `/ielts/` papkasida).
Hisob, parol va Supabase loyihasi **Testlar bilan umumiy** — alohida repo yoki loyiha kerak emas.

## Kirish huquqi
Foydalanuvchida `ielts` **guruhi** bo‘lishi (yoki owner bo‘lishi) kerak. Owner Testlar ilovasida
Egasi → Foydalanuvchilar → Guruhlar bo‘limida `ielts` guruhini qo‘shadi. Guruhsiz foydalanuvchi “Ruxsat kerak” ekranini ko‘radi.
Server tomonida ham `can_ielts()` va `ielts_state` jadvalidagi RLS shuni tekshiradi
(`supabase/migrations/20261116_ielts_state.sql`).

## Hozir ishlaydi (v1.2.0)
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
