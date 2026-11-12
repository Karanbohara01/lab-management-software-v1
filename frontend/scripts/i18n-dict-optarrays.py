import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # Blood group symbols — kept as-is, a universal medical convention (same call as SALUTATIONS).
    'A+': 'A+',
    'AB+': 'AB+',
    'AB−': 'AB−',
    'A−': 'A−',
    'B+': 'B+',
    'B−': 'B−',
    'O+': 'O+',
    'O−': 'O−',
    'PAN': 'PAN',

    'Birth certificate': 'जन्म दर्ता प्रमाणपत्र',
    'Camp': 'शिविर',
    'Citizenship no.': 'नागरिकता नं.',
    'Corporate / employer': 'कर्पोरेट / रोजगारदाता',
    'Corporate / organisation': 'कर्पोरेट / संस्था',
    'Driving licence': 'सवारी चालक अनुमतिपत्र',
    'Embassy': 'दूतावास',
    'Embassy ID': 'दूतावास परिचयपत्र',
    'English': 'अङ्ग्रेजी',
    'Government scheme': 'सरकारी योजना',
    'Health insurance': 'स्वास्थ्य बीमा',
    'Health insurance (NHIS)': 'स्वास्थ्य बीमा (NHIS)',
    'Home collection': 'घरमै नमूना संकलन',
    'Minor ID': 'नाबालक परिचयपत्र',
    'NGO / INGO': 'गैरसरकारी / अन्तर्राष्ट्रिय गैरसरकारी संस्था',
    'National ID': 'राष्ट्रिय परिचयपत्र',
    'Nepali': 'नेपाली',
    'Online booking': 'अनलाइन बुकिङ',
    'Partner': 'साझेदार',
    'Passport': 'राहदानी',
    'Refugee ID': 'शरणार्थी परिचयपत्र',
    'SSF no.': 'SSF नं.',
    'Self-pay': 'आफैं भुक्तानी',
    'Social Security Fund': 'सामाजिक सुरक्षा कोष',
    'Voter ID': 'मतदाता परिचयपत्र',
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
