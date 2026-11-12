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

# Find t('...') and t("...") calls across src, excluding the i18n module itself
pattern = re.compile(r"\bt\(\s*'((?:[^'\\]|\\.)*)'", re.M)
pattern2 = re.compile(r'\bt\(\s*"((?:[^"\\]|\\.)*)"', re.M)

used = {}
for path in ROOT.rglob('*.tsx'):
    if 'i18n' in path.parts:
        continue
    text = path.read_text(encoding='utf-8')
    for m in pattern.finditer(text):
        key = m.group(1).replace("\\'", "'")
        used.setdefault(key, []).append(str(path))
    for m in pattern2.finditer(text):
        key = m.group(1)
        used.setdefault(key, []).append(str(path))

for path in ROOT.rglob('*.ts'):
    if 'i18n' in path.parts:
        continue
    text = path.read_text(encoding='utf-8')
    for m in pattern.finditer(text):
        key = m.group(1).replace("\\'", "'")
        used.setdefault(key, []).append(str(path))
    for m in pattern2.finditer(text):
        key = m.group(1)
        used.setdefault(key, []).append(str(path))

missing = {k: v for k, v in used.items() if k not in existing}
print(f'TOTAL USED KEYS: {len(used)}')
print(f'MISSING: {len(missing)}')
for k in sorted(missing):
    print(f'  {k!r}  <- {missing[k][0]}')
