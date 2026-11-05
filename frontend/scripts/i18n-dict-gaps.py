import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    'Current address is the same as permanent': 'हालको ठेगाना स्थायी ठेगाना जस्तै हो',
    'External / hospital MRN': 'बाह्य / अस्पताल MRN',
    'Internal notes': 'आन्तरिक टिप्पणी',
    'Patient category': 'बिरामी वर्ग',
    'Prev': 'अघिल्लो',
    'Registration channel': 'दर्ता माध्यम',
    "You have changes that haven't been saved. If you leave now, they will be lost.":
        'तपाईंका परिवर्तनहरू सुरक्षित गरिएका छैनन्। अहिले गए भने ती हराउनेछन्।',
}

existing_dupes = []
for k in additions:
    if f"  '{k}':" in s or f"  {k}:" in s:
        existing_dupes.append(k)
if existing_dupes:
    print('SKIPPING already-present keys:', existing_dupes)
    for k in existing_dupes:
        del additions[k]

lines = []
for k, v in additions.items():
    key_src = k.replace("'", "\\'")
    needs_quotes = not key_src.isidentifier()
    key_repr = f"'{key_src}'" if needs_quotes else key_src
    val_src = v.replace("'", "\\'")
    lines.append(f"  {key_repr}: '{val_src}',")

block = "\n".join(lines) + "\n"
s = s.rstrip()
assert s.endswith('};')
s = s[:-2] + block + "};\n"
p.write_text(s, encoding='utf-8')
print(f'added {len(additions)} keys')
