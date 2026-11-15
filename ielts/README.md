# IELTS · BY AZIMOV

IELTS **Academic** tayyorgarligi uchun alohida PWA (Testlar ilovasi bilan bir repoda, `/ielts/` papkasida).
Hisob, parol va Supabase loyihasi **Testlar bilan umumiy** — alohida repo yoki loyiha kerak emas.

## Kirish huquqi
Foydalanuvchida `ielts` **guruhi** bo‘lishi (yoki owner bo‘lishi) kerak. Owner Testlar ilovasida
Egasi → Foydalanuvchilar → Guruhlar bo‘limida `ielts` guruhini qo‘shadi. Guruhsiz foydalanuvchi “Ruxsat kerak” ekranini ko‘radi.
Server tomonida ham `can_ielts()` va `ielts_state` jadvalidagi RLS shuni tekshiradi
(`supabase/migrations/20261116_ielts_state.sql`).

## Hozir ishlaydi (v0.6.0)
- **Home**: target band, overall, seriya, imtihongacha kun, tezkor mashq, so‘nggi natijalar
- **Listening**: 8 ta haqiqiy diktor yozuvi (VOA Learning English, ommaviy mulk; `audio/`), 80 savol, imtihon rejimi (bir marta, to‘xtatib bo‘lmaydi) va mashq rejimi (to‘xtatish, 10 s orqaga, tezlik), natijada har savol uchun “shu joydan tinglash” va bosiladigan transkript. Yozuv va matn mosligi offlayn nutq tanish bilan tekshirilgan, vaqtlar shu orqali aniqlangan
- **Articles & Podcasts**: 8 ta VOA maqolasi (audio + rasm), matn audio bilan birga yuradi (joriy gap belgilanadi, ▶ bilan shu joydan tinglash), so‘z bosilsa ma’no (maqola lug‘ati → ochiq lug‘at → AI tarjima), 10 ta lug‘at, 3 ta grammatika qoidasi va 8 ta savol; rasmlar Wikimedia Commons (CC0/PD/CC BY(-SA)), mualliflari `data/articles.json` da.
  Podkast RSS yoki maqola havolasini qo‘shish: audio AI bilan transkripsiya qilinadi (Groq Whisper → so‘z-so‘z karaoke; zaxira: Gemini), keyin “Tahlil qilish” lug‘at/grammatika/savollarni tuzadi. Transkriptlar serverda keshlanadi (`ielts_transcripts`).
- **Reading**: 3 ta Academic matn (39 savol; heads / T-F-NG / MCQ / gap to‘ldirish), 20 daqiqalik taymer, gapni belgilash, tushuntirishli natija, taxminiy band
- **Writing**: 30 ta Task 2 mavzu, taymer, so‘z hisoblagich, qoralama, o‘zini tekshirish ro‘yxati, 2 ta Band 8 namuna insho
- **Mock Test**: to‘liq (4 Listening + 3 Reading + Writing + Speaking) yoki tezkor rejim; bo‘limlar mavjud mashq ekranlari orqali topshiriladi, natijalar avtomatik yig‘iladi, umumiy band va eng zaif bo‘lim bo‘yicha maslahat.
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
