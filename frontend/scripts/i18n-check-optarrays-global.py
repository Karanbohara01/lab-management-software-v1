import re
import pathlib

ROOT = pathlib.Path('src')
ne_src = pathlib.Path('src/i18n/ne.ts').read_text(encoding='utf-8')

existing = set()
for m in re.finditer(r"^\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|([A-Za-z_$][A-Za-z0-9_$]*))\s*:", ne_src, re.M):
    if m.group(1) is not None:
        existing.add(m.group(1).replace("\\'", "'"))
    elif m.group(2) is not None:
        existing.add(m.group(2).replace('\\"', '"'))
    else:
        existing.add(m.group(3))

used = {}
for path in list(ROOT.rglob('*.tsx')) + list(ROOT.rglob('*.ts')):
    if 'i18n' in path.parts or path.name.endswith('.test.tsx') or path.name.endswith('.test.ts'):
        continue
    text = path.read_text(encoding='utf-8')
    # only consider files that call tOpts(...) -- a signal the file's option arrays feed through translation
    if 'tOpts(' not in text:
        continue
    for m in re.finditer(r"label:\s*'((?:[^'\\]|\\.)*)'", text):
        key = m.group(1).replace("\\'", "'")
        used.setdefault(key, []).append(str(path))
    for m in re.finditer(r'label:\s*"((?:[^"\\]|\\.)*)"', text):
        key = m.group(1)
        used.setdefault(key, []).append(str(path))

missing = {k: v for k, v in used.items() if k not in existing}
print(f'TOTAL label: KEYS IN tOpts()-USING FILES: {len(used)}')
print(f'MISSING: {len(missing)}')
for k in sorted(missing):
    print(f'  {k!r}  <- {missing[k][0]}')
