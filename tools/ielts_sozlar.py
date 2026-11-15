#!/usr/bin/env python3
"""banklar/ielts/sozlar8.txt (mavzu|so‘z|o‘zbekcha|misol gap) → Testlar test banki (fan: ielts8, 18 mavzu).
Har bir so‘zga ikkita savol: inglizcha → o‘zbekcha ma’no; o‘zbekcha ma’no → inglizcha.
Ishlatish:  python3 -I tools/ielts_sozlar.py [chiqish.json]"""
import json, random, sys, pathlib, collections
T = {'env': 'Atrof-muhit', 'edu': 'Ta’lim', 'tec': 'Texnologiya', 'hea': 'Salomatlik', 'wor': 'Ish va karyera', 'cri': 'Jinoyat va qonun', 'soc': 'Jamiyat va oila', 'urb': 'Shahar va uy-joy', 'eco': 'Iqtisod va biznes', 'med': 'OAV va reklama', 'tra': 'Sayohat va turizm', 'gov': 'Davlat va siyosat', 'sci': 'Fan va kosmos', 'art': 'San’at va til', 'spo': 'Sport va hordiq', 'idi': 'Speaking iboralari', 'lnk': 'Bog‘lovchi iboralar', 'pwr': 'Kuchli so‘zlar (Band 8)'}
root = pathlib.Path(__file__).resolve().parent.parent
rows = [l.rstrip('\n').split('|') for l in open(root / 'banklar/ielts/sozlar8.txt', encoding='utf-8') if l.strip()]
by = collections.OrderedDict((k, []) for k in T)
for k, w, uz, ex in rows: by[k].append((w, uz, ex))
topics = []
for k, L in by.items():
    rnd = random.Random('i8' + k); qs = []
    for i, (w, uz, ex) in enumerate(L, 1):
        oth = [x for x in L if x[0] != w]; e = f'{w} — {uz}. Misol: {ex}'
        for typ in 'ab':
            d = rnd.sample(oth, 3)
            if typ == 'a': q = f'“{w}” — qaysi ma’no to‘g‘ri?'; ans = uz; opts = [x[1] for x in d]
            else: q = f'“{uz}” ma’nosiga mos inglizcha so‘z/ibora qaysi?'; ans = w; opts = [x[0] for x in d]
            pos = (len(qs)) % 4; opts.insert(pos, ans)
            qs.append({'id': f'i8{k}.{i}{typ}', 'q': q, 'o': opts, 'a': pos, 'e': e, 'r': 'IELTS 8+ mavzuli so‘zlar'})
    topics.append({'id': 'i8' + k, 'name': T[k], 'src': 'IELTS 8+ mavzuli so‘zlar', 'q': qs})
bank = {'v': 1, 'src': 'IELTS 8+ mavzuli so‘zlar (ro‘yxat eski ilovadan, ma’no va misollar yozildi)', 'subjects': [{'id': 'ielts8', 'name': 'IELTS 8+ so‘zlar', 'topics': topics}]}
out = pathlib.Path(sys.argv[1]) if len(sys.argv) > 1 else root / 'banklar/ielts/sozlar8.json'
json.dump(bank, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('✅', out, len(topics), 'mavzu', sum(len(t['q']) for t in topics), 'savol')
