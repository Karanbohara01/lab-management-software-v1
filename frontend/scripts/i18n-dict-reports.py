import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # DeliverReportModal.tsx
    'SMS': 'SMS',
    'WhatsApp': 'WhatsApp',
    'Handed to patient': 'बिरामीलाई हातमा बुझाइयो',
    'Courier': 'कुरियर',
    'Patient portal': 'बिरामी पोर्टल',
    'Method': 'माध्यम',
    'Recipient (optional)': 'प्राप्तकर्ता (वैकल्पिक)',
    'Leave blank to use the phone on file': 'दर्ता भएको फोन प्रयोग गर्न खाली राख्नुहोस्',
    'e.g. email address, courier ref': 'जस्तै: इमेल ठेगाना, कुरियर सन्दर्भ नम्बर',
    'Send via {method}': '{method} मार्फत पठाउनुहोस्',
    'Sent via {method}': '{method} मार्फत पठाइयो',
    'Record delivery': 'पठाइएको दर्ता गर्नुहोस्',
    'Delivery recorded': 'पठाइएको दर्ता भयो',
    'Unable to record delivery': 'पठाइएको दर्ता गर्न सकिएन',
    'Sends a message with a link to this signed report, which the patient (or anyone with the link) can verify at {code}.':
        'यो हस्ताक्षर गरिएको रिपोर्टको लिंकसहित सन्देश पठाउँछ; बिरामी (वा लिंक पाएको कुनै पनि व्यक्ति) यसलाई {code} मा गएर प्रमाणित गर्न सक्छ।',
    'Requires an SMS gateway to be configured on the server.': 'सर्भरमा SMS गेटवे सेटअप भएको हुनुपर्छ।',
    'Requires a WhatsApp Business API connection to be configured on the server.':
        'सर्भरमा WhatsApp Business API जडान सेटअप भएको हुनुपर्छ।',

    # ReportsPage.tsx
    'Consolidated laboratory reports generated from approved results.':
        'स्वीकृत नतिजाबाट तयार गरिएका प्रयोगशाला रिपोर्टहरूको एकीकृत सूची।',
    'Search report no., patient or MRN': 'रिपोर्ट नम्बर, बिरामी वा MRN बाट खोज्नुहोस्',
    'No reports': 'रिपोर्टहरू छैनन्',
    'Generate a report from a lab order once its results are approved.':
        'नतिजा स्वीकृत भएपछि ल्याब अर्डरबाट रिपोर्ट तयार गर्नुहोस्।',

    # ReportViewPage.tsx
    'Loading report…': 'रिपोर्ट लोड हुँदैछ…',
    'Preliminary': 'प्रारम्भिक',
    'Signed': 'हस्ताक्षरित',
    'Order {number}': 'अर्डर {number}',
    'Regenerate (final)': 'फेरि तयार गर्नुहोस् (अन्तिम)',
    'Report regenerated': 'रिपोर्ट फेरि तयार भयो',
    'Update preliminary': 'प्रारम्भिक रिपोर्ट अपडेट गर्नुहोस्',
    'Preliminary report updated': 'प्रारम्भिक रिपोर्ट अपडेट भयो',
    'Signing credentials (e.g. MBBS, MD Pathology, NMC 12345) — optional:':
        'हस्ताक्षर गर्नेको योग्यता (जस्तै: MBBS, MD Pathology, NMC 12345) — वैकल्पिक:',
    'Report signed & released': 'रिपोर्ट हस्ताक्षर भई जारी भयो',
    'Sign & release': 'हस्ताक्षर गरी जारी गर्नुहोस्',

    # VerifyReportPage.tsx
    'Report verification': 'रिपोर्ट प्रमाणीकरण',
    "Confirm this report's authenticity.": 'यो रिपोर्ट साँचो हो भनी पुष्टि गर्नुहोस्।',
    'Checking…': 'जाँच गर्दै…',
    'Not found': 'भेटिएन',
    'No report matches this verification code. Treat the document as unverified.':
        'यो प्रमाणीकरण कोडसँग कुनै रिपोर्ट मिलेन। यो कागजातलाई अप्रमाणित मान्नुहोस्।',
    'Genuine LIMS report': 'वास्तविक LIMS रिपोर्ट',
    'Patient MRN': 'बिरामी MRN',
    'Signed by': 'हस्ताक्षर गर्ने',
    'Content hash': 'कन्टेन्ट ह्याश',
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
