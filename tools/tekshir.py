#!/usr/bin/env python3
"""Savol banki (testlar-banki.json) tekshiruvchisi.
Ishlatish:  python3 -I tools/tekshir.py fayl.json [fayl2.json ...]
Format xatosi bo‘lsa 1 bilan chiqadi. Ogohlantirishlar (takroriy savol, izoh/manba yo‘qligi, javob joylashuvi, uzun to‘g‘ri javob) faqat ko‘rsatiladi."""
import json, sys, collections

def check(path):
    err, warn = [], []
    try:
        d = json.load(open(path, encoding='utf-8'))
    except Exception as e:
        return [f'JSON o‘qilmadi: {e}'], [], {}
    if not isinstance(d, dict) or d.get('v') != 1 or not isinstance(d.get('subjects'), list) or not d['subjects']:
        return ['format: {v:1, subjects:[…]} kerak'], [], {}
    sids, tids, qids = set(), set(), set(); longest = 0
    pos = collections.Counter(); texts = collections.defaultdict(list); stat = []
    for s in d['subjects']:
        if not isinstance(s.get('id'), str) or not isinstance(s.get('name'), str) or not isinstance(s.get('topics'), list):
            err.append(f"fan noto‘g‘ri: {s.get('id')}"); continue
        if s['id'] in sids: err.append(f"fan id takror: {s['id']}")
        sids.add(s['id'])
        for t in s['topics']:
            if not isinstance(t.get('id'), str) or not isinstance(t.get('name'), str) or not isinstance(t.get('q'), list):
                err.append(f"mavzu noto‘g‘ri: {t.get('id')}"); continue
            if t['id'] in tids: err.append(f"mavzu id takror: {t['id']}")
            tids.add(t['id']); stat.append((s['name'], t['name'], len(t['q'])))
            for i, q in enumerate(t['q'], 1):
                w = f"{t['id']}#{i}"
                o = q.get('o')
                if not (isinstance(q.get('id'), str) and isinstance(q.get('q'), str) and q['q'].strip() and isinstance(o, list) and len(o) == 4
                        and all(isinstance(x, str) and x.strip() for x in o) and isinstance(q.get('a'), int) and not isinstance(q.get('a'), bool) and 0 <= q['a'] < 4):
                    err.append(f'{w}: format xato'); continue
                if q['id'] in qids: err.append(f"{w}: id takror {q['id']}")
                qids.add(q['id']); pos[q['a']] += 1
                if len({x.strip().lower() for x in o}) < 4: warn.append(f'{w}: bir xil variantlar')
                if not q.get('e'): warn.append(f'{w}: izoh (e) yo‘q')
                if not q.get('r'): warn.append(f'{w}: manba (r) yo‘q')
                texts[q['q'].strip().lower()].append(w)
                lens = [len(x) for x in o]
                if lens[q['a']] == max(lens) and max(lens) > 1.6 * sorted(lens)[-2] and max(lens) > 25: longest += 1
    for k, v in texts.items():
        if len(v) > 1: warn.append('bir xil savol matni: ' + ', '.join(v))
    tot = sum(pos.values())
    if tot and longest / tot > 0.2: warn.append(f'{longest}/{tot} savolda to‘g‘ri javob boshqalardan ancha uzun (taxmin qilish oson) — noto‘g‘ri variantlarni ham shu uzunlikda qiling')
    if tot >= 20:
        for k in range(4):
            if pos[k] / tot < 0.15 or pos[k] / tot > 0.35: warn.append(f'to‘g‘ri javob joylashuvi nomutanosib: {"ABCD"[k]}={pos[k]}/{tot}')
    return err, warn, {'pos': dict(sorted(pos.items())), 'topics': stat, 'total': tot}

rc = 0
for p in sys.argv[1:] or ['data/testlar-banki.json']:
    err, warn, info = check(p)
    print(f'== {p}')
    for s, t, n in info.get('topics', []): print(f'   {s} › {t}: {n} savol')
    if info: print(f"   jami {info['total']} savol; to‘g‘ri javob indeksi taqsimoti (A,B,C,D) = {[info['pos'].get(i, 0) for i in range(4)]}")
    for e in err: print('   ❌', e)
    for w in warn[:40]: print('   ⚠️ ', w)
    if len(warn) > 40: print(f'   … yana {len(warn) - 40} ogohlantirish')
    print('   ' + ('✅ format to‘g‘ri' if not err else f'❌ {len(err)} ta xato'))
    rc |= bool(err)
sys.exit(rc)
