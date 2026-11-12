import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    'Customer': 'ग्राहक',
    'Bill No': 'बिल नं.',
    'Buyer': 'ग्राहक',
    'Entered by': 'प्रविष्ट गर्ने',
    'Printed': 'प्रिन्ट भयो',
    'Filed': 'पेश भयो',
    'IRD sync': 'IRD सिंक',
    'Total sales': 'जम्मा बिक्री',
    'Taxable sales': 'कर लाग्ने बिक्री',
    'Yes ({name})': 'भयो ({name})',
    'Total ({count} bills)': 'जम्मा ({count} बिल)',
    'Sales Book — {month} {year}': 'बिक्री खाता — {month} {year}',
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
