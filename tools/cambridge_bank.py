#!/usr/bin/env python3
"""Shaxsiy `cambridge-sozlar.json` (Cambridge Thematic IELTS Reading Words) → Testlar test banki (format v:1).
FAYL SHAXSIY: litsenziyali kontent, REPOGA TUSHMASIN. Chiqish banklar/_private/ ichiga yoziladi (gitignore'da).
Ishlatish:  python3 -I tools/cambridge_bank.py <cambridge-sozlar.json> [chiqish.json]
Har bir kitob = bitta fan, har bir maqola = bitta mavzu. Har bir so‘zga bitta savol:
  • so‘z → o‘zbekcha ma’no (4 variant), yoki
  • inglizcha ta’rif → mos so‘z (4 variant).
Noto‘g‘ri variantlar shu maqoladan (kerak bo‘lsa kitobdan) olinadi, imkon qadar shu so‘z turkumidan."""
import json, sys, re, random, os, collections

def low1(t):
    t = t.strip(); return t[0].lower() + t[1:] if len(t) > 1 and t[0].isupper() and not t[1].isupper() else t
def clean(w): return re.sub(r'\s+', ' ', re.sub(r'\([^)]*\)', ' ', w)).strip()
def alts(w): return [a.strip() for a in re.split(r'[/,;]| or ', clean(w), flags=re.I) if a.strip()]
def stem(t): t = t.lower(); return t[:max(3, len(t) - 2)] if len(t) > 4 else t
def find_blank(word, ex):
    for a in alts(word):
        toks = re.findall(r"[A-Za-z]+(?:['’][A-Za-z]+)*", a)
        if not toks: continue
        pat = r"(?<![A-Za-z])" + r"\W+".join(re.escape(stem(t)) + r"[A-Za-z]*" for t in toks) + r"(?![A-Za-z])"
        m = re.search(pat, ex, flags=re.I)
        if m and len(m.group(0)) <= len(a) + 5 + 2 * len(toks): return ex[:m.start()] + '_____' + ex[m.end():]
    return None

def main(src, out):
    d = json.load(open(src, encoding='utf-8'))
    def fix(r):
        r = list(r); r[3] = re.sub(r'\s*:\s*$', '', r[3]).strip(); r[6] = re.sub(r'\.{2,}', '.', r[6]).strip().replace("'", '’'); r[5] = r[5].strip(); r[7] = r[7].strip(); return r
    d['w'] = [fix(r) for r in d['w'] if not (r[6].startswith('#') or r[3].startswith('#') or re.search('[А-Яа-я]', r[3] + r[6]))]
    P = {p['i']: p for p in d['p']}; W = d['w']; X = {int(k): v for k, v in (d.get('x') or {}).items()}
    byT = collections.defaultdict(list)
    for r in W: byT[r[1]].append(r)
    books = collections.OrderedDict(); used = 0
    for p in d['p']:
        seen, rows = set(), []
        for t in p['ts']:
            for q in (t, X.get(t)):
                if q is None: continue
                for r in byT.get(q, []):
                    k = (r[3].lower(), r[4])
                    if k in seen: continue
                    seen.add(k); rows.append(r)
        if len(rows) < 3: continue
        books.setdefault(p.get('s') or 'Manba noma’lum', []).append((p, rows))
    subjects = []; total = 0
    groups = collections.OrderedDict()   # fan kaliti -> (id, nomi, [(book, p, rows)])
    for book, plist in books.items():
        m = re.fullmatch(r'Cambridge IELTS Academic (\d+)', book)
        if m: key, name = 'cba' + m.group(1), 'Cambridge: IELTS Academic ' + m.group(1)
        elif book == 'The Official Cambridge Guide To IELTS': key, name = 'cbog', 'Cambridge: Official Guide to IELTS'
        else: key, name = 'cbx', 'Cambridge: boshqa kitoblar'
        groups.setdefault(key, (name, []))[1].extend((book, p, rows) for p, rows in plist)
    for key, (name, items) in groups.items():
        bpool = [r for _, _, rows in items for r in rows]; topics = []
        for book, p, rows in items:
            tid = f"cb{p['i']}"; rnd = random.Random(tid); qs = []
            for n, r in enumerate(rows, 1):
                _, _, idx, w, pos, df, uz, ex = r
                wc = clean(w); usedef = rnd.random() < .5 and not re.search(re.escape(wc.split('/')[0].strip()[:max(3, len(wc.split('/')[0].strip()) - 2)]), df, flags=re.I)
                same = [x for x in rows if x is not r and (x[4] == pos or not pos)] or [x for x in rows if x is not r]
                def pick(k):
                    cands = []; seen_v = {k(r).lower()}
                    for grp in (same, [x for x in rows if x is not r], [x for x in bpool if x is not r]):
                        g = grp[:]; rnd.shuffle(g)
                        for x in g:
                            v = k(x)
                            if not v.strip() or v.lower() in seen_v: continue
                            seen_v.add(v.lower()); cands.append(v)
                            if len(cands) == 3: return cands
                    return cands
                if usedef: dis = pick(lambda z: clean(z[3])); ans = clean(w); q = f"Ta’rifga mos so‘z/ibora qaysi? “{df}”"
                else: dis = pick(lambda z: low1(z[6])); ans = low1(uz); q = f"“{clean(w)}”{' (' + pos + ')' if pos else ''} — qaysi ma’no to‘g‘ri?"
                if len(dis) < 3: continue
                o = dis + [ans]; rnd.shuffle(o)
                qs.append({'id': f"{tid}.{n}", 'q': q, 'o': o, 'a': o.index(ans), 'e': f"{clean(w)}: {df.rstrip('. ')} — {uz.rstrip('. ')}. Misol: {ex}", 'r': book})
            if qs:
                tname = p['t'] if key != 'cbx' else f"{book.replace('Cambridge ', '')}: {p['t']}"
                topics.append({'id': tid, 'name': tname, 'src': book, 'q': qs}); total += len(qs)
        subjects.append({'id': key, 'name': name, 'topics': topics})
    bank = {'v': 1, 'src': 'Shaxsiy fayldan (cambridge-sozlar.json) tuzildi — tarqatilmasin', 'subjects': subjects}
    os.makedirs(os.path.dirname(out) or '.', exist_ok=True)
    json.dump(bank, open(out, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'✅ {out}: {len(subjects)} fan, {sum(len(s["topics"]) for s in subjects)} mavzu, {total} savol, {os.path.getsize(out)//1024} KB')

if __name__ == '__main__':
    if len(sys.argv) < 2: sys.exit(__doc__)
    main(sys.argv[1], sys.argv[2] if len(sys.argv) > 2 else 'banklar/_private/cambridge-sozlar-bank.json')
