import re
import pathlib
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

src = pathlib.Path('src/features/patients/constants.ts').read_text(encoding='utf-8')
ne_src = pathlib.Path('src/i18n/ne.ts').read_text(encoding='utf-8')

existing = set()
for m in re.finditer(r"^\s*(?:'((?:[^'\\]|\\.)*)'|\"((?:[^\"\\]|\\.)*)\"|([A-Za-z_$][A-Za-z0-9_$]*))\s*:", ne_src, re.M):
    if m.group(1) is not None:
        existing.add(m.group(1).replace("\\'", "'"))
    elif m.group(2) is not None:
        existing.add(m.group(2).replace('\\"', '"'))
    else:
        existing.add(m.group(3))

labels = set(re.findall(r"label:\s*'((?:[^'\\]|\\.)*)'", src))

# plain string arrays: RELATIONSHIPS, LANGUAGES
array_block = re.search(r"export const RELATIONSHIPS = \[(.*?)\];", src, re.S)
relationships = re.findall(r"'((?:[^'\\]|\\.)*)'", array_block.group(1)) if array_block else []

array_block2 = re.search(r"export const LANGUAGES = \[(.*?)\];", src, re.S)
languages = re.findall(r"'((?:[^'\\]|\\.)*)'", array_block2.group(1)) if array_block2 else []

all_keys = labels | set(relationships) | set(languages)
missing = sorted(k for k in all_keys if k not in existing)
print('TOTAL OPTION LABELS:', len(all_keys))
print('MISSING:', len(missing))
for k in missing:
    print(' ', repr(k))
