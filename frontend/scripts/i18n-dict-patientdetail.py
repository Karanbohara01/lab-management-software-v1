import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    'Authorization': 'अनुमति',
    'Captured by': 'दर्ता गर्नेको नाम',
    'Captured': 'दर्ता गरिएको समय',
    'Channel': 'माध्यम',
    'Contact & address': 'सम्पर्क र ठेगाना',
    'Current address': 'हालको ठेगाना',
    'Data processing': 'डाटा प्रशोधन',
    'Demographics': 'जनसांख्यिकी विवरण',
    'External MRN': 'बाह्य MRN',
    'Given': 'दिइएको',
    'It is kept only as an MRN alias.': 'यो केवल MRN उपनामको रूपमा राखिएको छ।',
    'Legal guardian': 'कानुनी संरक्षक',
    'MRN': 'MRN',
    'Merge': 'मर्ज गर्नुहोस्',
    'None recorded': 'केही राखिएको छैन',
    'None recorded.': 'केही राखिएको छैन।',
    'Note': 'नोट',
    'Permanent address': 'स्थायी ठेगाना',
    'Portal link copied — share it with the patient': 'पोर्टल लिंक प्रतिलिपि भयो — बिरामीलाई पठाउनुहोस्',
    'Portal link': 'पोर्टल लिंक',
    'Preferred language': 'रुचाइने भाषा',
    'Referral & registration': 'रेफरल र दर्ता',
    'Referral source': 'रेफरलको स्रोत',
    'Registered': 'दर्ता भएको मिति',
    'Report delivery': 'रिपोर्ट प्राप्ति',
    'Research use': 'अनुसन्धान प्रयोग',
    'This record was merged into': 'यो रेकर्ड मर्ज गरिएको थियो',
    'Unable to get portal link': 'पोर्टल लिंक प्राप्त गर्न सकिएन',
    'Valid until': 'मिति सम्म मान्य',
    'by {name}': '{name} द्वारा',
    'on {date}': '{date} मा',
    'patient #{id}': 'बिरामी #{id}',
    '~{age} years': '~{age} वर्ष',
    '{age} years (minor)': '{age} वर्ष (नाबालक)',
    '{age} years': '{age} वर्ष',
    'Record completeness': 'रेकर्ड पूर्णता',
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
