import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    '{age} yrs': '{age} वर्ष',
    '~{age} yrs': '~{age} वर्ष',
    'Medical record no.': 'चिकित्सा अभिलेख नं.',
    'Scan to view record': 'रेकर्ड हेर्न स्क्यान गर्नुहोस्',
    'Self': 'आफैं',
    'Please bring this card on every visit and quote the MRN above for all enquiries.':
        'कृपया हरेक पटक आउँदा यो कार्ड साथमा ल्याउनुहोस् र सबै सोधपुछका लागि माथिको MRN उल्लेख गर्नुहोस्।',
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
