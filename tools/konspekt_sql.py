#!/usr/bin/env python3
"""banklar/konspekt/<fan>/<mavzu>.md fayllaridan catalog_notes uchun SQL (upsert) yaratadi.
Ishlatish: python3 -I tools/konspekt_sql.py [fan/mavzu ...]   (argumentsiz — hammasi)
Fayl: birinchi qator `# Sarlavha`, qolgani matn (## sarlavha, - ro‘yxat, | jadval |, > eslatma, !! imtihonda tushadi, **qalin**, ==muhim==)."""
import sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent / 'banklar' / 'konspekt'
sel = set(sys.argv[1:])
rows = []
for i, p in enumerate(sorted(root.glob('*/*.md'))):
    key = f'{p.parent.name}/{p.stem}'
    if sel and key not in sel: continue
    lines = p.read_text(encoding='utf-8').split('\n')
    assert lines[0].startswith('# '), p
    title, body = lines[0][2:].strip(), '\n'.join(lines[1:]).strip()
    assert '$k$' not in body
    rows.append(f"('{p.parent.name}', '{p.stem}', $k${title}$k$, $k${body}$k$, {i * 10})")
print('insert into public.catalog_notes (subject_id, topic_id, title, body, sort) values\n' + ',\n'.join(rows) +
      '\non conflict (subject_id, topic_id) do update set title = excluded.title, body = excluded.body, sort = excluded.sort, updated_at = now();')
