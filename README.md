# Testlar — mustaqil PWA

Har xil fanlar (univer, madrasa va h.k.) bo‘yicha 4 variantli testlar: **fan → mavzu → savollar**. Telefonda (iPhone Safari) “Ekranga qo‘shish” bilan o‘rnatiladi, **internetsiz ishlaydi**. Server, hisob, kalit kerak emas.

## Imkoniyatlar
- **Rejimlar:** ✍️ Mashq (har javobdan keyin izoh) · ⏱ Imtihon (taymer, savollar ro‘yxati) · 🧠 Ochiq (o‘zing o‘ylab, keyin baholaysan)
- Mavzu / butun fan / **bir nechta mavzu tanlab** / hamma fanlardan umumiy test; 10-20-30-50-hammasi
- **Xatolar banki** va takrorlash (xato → ertasi, to‘g‘ri → 3 kundan keyin; 2 marta ketma-ket to‘g‘ri bo‘lsa banklardan chiqadi)
- 📅 **Imtihon sanasi** → “kuniga N ta yangi savol” rejasi
- 🚩 Shubhali savollarni belgilash, 📊 statistika (zaif mavzular), zaxira/tiklash
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
| `tools/tekshir.py` | bank tekshiruvchi |
| `tests/smoke.cjs` | Playwright sinovi: `node tests/smoke.cjs` |
| `KITOBDAN_TEST.md` | kitob/PDF’dan savol tuzish tartibi va format |

## Ma’lumot qayerda saqlanadi
Savol banki — IndexedDB, natijalar/xatolar/sozlamalar — localStorage (faqat shu qurilmada). **⚙️ Sozlamalar → Zaxira** bilan fayl qilib saqlab, boshqa qurilmada tiklash mumkin. Safari uzoq foydalanilmagan sayt ma’lumotini o‘chirib yuborishi mumkin — shuning uchun vaqti-vaqti bilan zaxira ol.
