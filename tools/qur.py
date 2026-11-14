#!/usr/bin/env python3
"""Savol banki quruvchi.  Ishlatish:  python3 -I tools/qur.py banklar/manba/<kitob> banklar/<chiqish>.json "<fan id>" "<fan nomi>" "<kitob manbasi>"
Manba papkasidagi har bir *.json — bitta mavzu:
  {"id":"qd01","name":"…","pages":"7–16","items":[{"q":"savol","c":"to‘g‘ri javob","w":["xato1","xato2","xato3"],"e":"izoh","r":"1-§, 8-bet"}, …]}
Quruvchi variantlarni aralashtiradi (to‘g‘ri javob A/B/C/D bo‘ylab teng taqsimlanadi) va tayyor bank (format v:1) yozadi."""
import json, sys, glob, random, os

def main(src, out, sid, sname, book):
    topics, errs = [], []
    for f in sorted(glob.glob(os.path.join(src, '*.json'))):
        t = json.load(open(f, encoding='utf-8')); rnd = random.Random(t['id']); items = t['items']; n = len(items); pos = []
        while len(pos) < n:
            b = [0, 1, 2, 3]; rnd.shuffle(b); pos += b
        qs = []; seen = set()
        for i, it in enumerate(items, 1):
            w = list(it['w']); c = it['c']; where = f"{t['id']}#{i}"
            if len(w) != 3: errs.append(f'{where}: 3 ta noto‘g‘ri variant kerak')
            if c in w or len(set(w)) != len(w): errs.append(f'{where}: variantlar takrorlanadi')
            if it['q'] in seen: errs.append(f'{where}: savol takror')
            seen.add(it['q'])
            rnd.shuffle(w); o = w[:]; o.insert(pos[i - 1], c)
            qs.append({'id': f"{t['id']}.{i}", 'q': it['q'], 'o': o, 'a': pos[i - 1], 'e': it['e'], 'r': it['r']})
        topics.append({'id': t['id'], 'name': t['name'], 'src': f"{book} · {t['pages']}-betlar", 'q': qs})
    if errs: print('\n'.join(errs)); sys.exit(1)
    bank = {'v': 1, 'src': f'Tuzildi: {book} asosida (shaxsiy foydalanish uchun)', 'subjects': [{'id': sid, 'name': sname, 'topics': topics}]}
    json.dump(bank, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print(f'✅ {out}: {len(topics)} mavzu, {sum(len(t["q"]) for t in topics)} savol')

if __name__ == '__main__':
    if len(sys.argv) != 6: sys.exit(__doc__)
    main(*sys.argv[1:])
