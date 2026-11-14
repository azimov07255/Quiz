# Kitob / PDF'dan test banki qanday olinadi

Ilovaning o‘zi savol *tuzmaydi* — savollarni **Claude Code** (shu sessiya) tuzadi, ilova esa tayyor `.json` bankni yuklab, mashq qildiradi. Ya’ni ish tartibi:

1. PDF/kitob/slaydni Claude'ga tashlaysan (shu chatga yoki repoga `kitoblar/` papkasiga).
2. Claude matnni o‘qib, **fan → mavzu → 4 variantli savollar** qilib `banklar/<fan>.json` yozadi va `tools/tekshir.py` bilan tekshiradi.
3. Faylni ilovada **⚙️ Sozlamalar → Fayl qo‘shish** orqali yuklaysan. Bir nechta fan/kitob bir-birining ustiga qo‘shiladi.

## So‘rov namunasi (Claude'ga)
> Mana “Ona tili 1-kitob.pdf”. Har bir bobdan 30 tadan 4 variantli savol tuz, har savolda izoh va sahifa raqami bo‘lsin. Fan id: `ona`, mavzu id: `ona1`, `ona2`… Faylga yoz va tekshir.

Oraliq uchun: *“Mana 5 ta mavzu PDF. Har mavzudan 25 ta savol + oxirida hammasidan aralash 30 ta ‘umumiy’ mavzu qo‘sh.”*

## Format
```json
{"v":1,"src":"izoh","subjects":[{"id":"ona","name":"Ona tili","topics":[
 {"id":"ona1","name":"Fonetika","src":"1-kitob, 2-bob","q":[
  {"id":"ona1.1","q":"Savol matni?","o":["A","B","C","D"],"a":2,"e":"Nima uchun to‘g‘ri","r":"15-bet"}
 ]}]}]}
```
- `a` — to‘g‘ri variantning indeksi (0–3), `e` — izoh, `r` — manba (bet/slayd) — ixtiyoriy, lekin tavsiya etiladi.
- `id`lar butun bank bo‘yicha noyob. Bir xil `id`li mavzu qayta yuklansa **yangilanadi** (qolganlar saqlanadi).

## Sifat qoidalari (Claude shunga amal qiladi)
- Savol faqat kitobdagi ma’lumotga tayanadi; taxmin yoki tashqi “bilim” emas. Har savolda `r` bor.
- To‘g‘ri javob A/B/C/D bo‘ylab teng tarqaladi; noto‘g‘ri variantlar ishonarli va **to‘g‘ri javob bilan bir xil uzunlikda** (uzun variant = to‘g‘ri deb topib olish oson bo‘lmasin).
- “Hammasi to‘g‘ri / Hech biri” variantlaridan qochiladi; savollar bir-birining javobini bermaydi.
- Tekshirish: `python3 -I tools/tekshir.py banklar/ona.json` — format xatosi, takroriy `id`/savol, izoh/manba yo‘qligi, javob joylashuvi va “uzun to‘g‘ri javob” ogohlantirishlarini chiqaradi.

## Cheklovlar (halol)
- **Skanerlangan (rasm) PDF** matnsiz bo‘ladi — OCR kerak, sifat pasayadi. Matnli PDF/DOCX/PPTX eng yaxshi.
- Juda katta kitobni bob-bob qilib beramiz (bir martada hamma bob emas) — shunda savollar sifatli va manbasi aniq bo‘ladi.
- Savollar sun’iy intellekt tuzgan: **imtihondan oldin ishonchsiz joylarni kitob bilan tekshir**. Ilovada shubhali savolni 🚩 bilan belgilab qo‘yish mumkin.
- Darslik/litsenziyali kontent faqat shaxsiy foydalanish uchun; banklarni ommaga tarqatma.

## Keyingi qadam (ixtiyoriy)
Ilovaning ichida to‘g‘ridan-to‘g‘ri PDF yuklab savol tuzish uchun Anthropic API kaliti va kichik backend (kalit qurilmada/serverda, kodda emas) kerak bo‘ladi. Hozircha Claude Code orqali tuzish — arzonroq va sifatliroq (bob bo‘yicha tekshirib boriladi).
