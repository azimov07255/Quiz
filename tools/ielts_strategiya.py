#!/usr/bin/env python3
"""Eski ilovadagi `59-ielts-strategiya.js` (o‘zi yozgan strategiya materiali, KST) → Testlar uchun:
  1) banklar/ielts/strategiya.json  — test banki (fan: ielts, 6 mavzu = 6 ko‘nikma)
  2) banklar/konspekt/ielts/<mavzu>.md — har bir ko‘nikma uchun konspekt
Ishlatish:  python3 -I tools/ielts_strategiya.py <59-ielts-strategiya.js>"""
import json, subprocess, sys, random, os, pathlib
SK = {'R': ('ielts-r', 'Reading'), 'L': ('ielts-l', 'Listening'), 'W1': ('ielts-w1', 'Writing Task 1'), 'W2': ('ielts-w2', 'Writing Task 2'), 'S': ('ielts-s', 'Speaking'), 'G': ('ielts-g', 'Imtihon kuni va ball')}
def load(js):
    code = "const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');const m=/const KST=(\\[[\\s\\S]*?\\n\\]);/.exec(s)||/const KST=(\\[[\\s\\S]*\\])/.exec(s);console.log(JSON.stringify(eval(m[1])))"
    return json.loads(subprocess.check_output(['node', '-e', code, js]))
def main(js):
    K = load(js); root = pathlib.Path(__file__).resolve().parent.parent
    by = {}
    for k in K: by.setdefault(k['s'], []).append(k)
    topics = []
    for sk, (tid, name) in SK.items():
        L = by.get(sk, []); rnd = random.Random(tid); qs = []
        def others(key, k, n=3, same=True):
            pool = [x for x in (L if same else K) if x is not k]
            vals = [v for x in pool for v in (x[key] if isinstance(x[key], list) else [x[key]])]
            vals = [v for v in dict.fromkeys(vals) if v not in (k[key] if isinstance(k[key], list) else [k[key]])]
            rnd.shuffle(vals); return vals[:n]
        def add(q, c, w, e, r):
            if len(w) < 3 or c in w: return
            o = w[:3]; rnd.shuffle(o); pos = len(qs) % 4; o.insert(pos, c)
            qs.append({'id': f'{tid}.{len(qs) + 1}', 'q': q, 'o': o, 'a': pos, 'e': e, 'r': r})
        for k in L:
            src = 'Strategiya: ' + k['t']
            sts = k['st'][:]; rnd.shuffle(sts)
            for i, s in enumerate(sts[:3]):
                add(['«%s» savol turida qaysi harakat TO‘G‘RI?', '«%s» bo‘yicha qaysi maslahat to‘g‘ri?', '«%s» ustida ishlaganda nimani qilish kerak?'][i] % k['t'], s, others('tr', k) or others('tr', k, same=False), 'To‘g‘ri yondashuv. ' + k['w'], src)
            trs = k['tr'][:]; rnd.shuffle(trs)
            for i, t in enumerate(trs[:3]):
                add(['«%s» savol turida qaysi harakat XATO (odatiy tuzoq)?', '«%s» bo‘yicha qaysi xatoga yo‘l qo‘ymaslik kerak?', '«%s»da ko‘p uchraydigan xato qaysi?'][i] % k['t'], t, others('st', k) or others('st', k, same=False), 'Bu keng tarqalgan xato. To‘g‘ri yondashuv: ' + k['st'][0], src)
            if len(k['tm']) > 4: add('«%s» uchun tavsiya etilgan vaqt qaysi?' % k['t'], k['tm'], [v for v in others('tm', k, same=False, n=6) if len(v) > 4][:3], 'Tavsiya: ' + k['tm'], src)
            add('«%s» bo‘yicha Band 8+ uchun maslahat qaysi?' % k['t'], k['b8'], others('b8', k, same=False), k['b8'], src)
            add('Quyidagi ta’rif qaysi savol turiga tegishli? «%s»' % k['w'], k['t'], others('t', k, same=False), k['t'] + ': ' + k['w'], src)
        topics.append({'id': tid, 'name': name, 'src': 'IELTS strategiya', 'q': qs})
        md = [f'# {name}: savol turlari bo‘yicha strategiya']
        for k in L:
            md += ['', f"## {k['t']}", k['w'], '', '### Qadamlar'] + [f'{i}. {s}' for i, s in enumerate(k['st'], 1)] + ['', '### Odatiy xatolar'] + [f'- {t}' for t in k['tr']] + ['', ('> **Vaqt:** ' + k['tm'] + ' ' if len(k['tm']) > 4 else '> ') + f"**Band 8+ uchun:** {k['b8']}"]
        pathlib.Path(root / 'banklar/konspekt/ielts').mkdir(parents=True, exist_ok=True)
        (root / f'banklar/konspekt/ielts/{tid}.md').write_text('\n'.join(md) + '\n', encoding='utf-8')
    bank = {'v': 1, 'src': 'IELTS strategiyalar (o‘zi yozgan o‘quv materiali, eski ilovadan)', 'subjects': [{'id': 'ielts', 'name': 'IELTS strategiyalar', 'topics': topics}]}
    out = root / 'banklar/ielts/strategiya.json'; out.parent.mkdir(parents=True, exist_ok=True)
    json.dump(bank, open(out, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('✅', out, len(topics), 'mavzu', sum(len(t['q']) for t in topics), 'savol')
if __name__ == '__main__':
    if len(sys.argv) != 2: sys.exit(__doc__)
    main(sys.argv[1])
