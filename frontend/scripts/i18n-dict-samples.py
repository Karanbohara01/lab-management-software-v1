import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- BarcodeLabel.tsx ----
    'Barcode {value}': 'बारकोड {value}',

    # ---- CollectSampleModal.tsx ----
    'Sample {accession} collected': 'नमूना {accession} सङ्कलन भयो',
    'Unable to record collection': 'सङ्कलन दर्ता गर्न सकिएन',
    'Collect {accession}': '{accession} सङ्कलन गर्नुहोस्',
    'Collect anyway': 'जसरी पनि सङ्कलन गर्नुहोस्',
    'Reason to collect without payment': 'भुक्तानी बिना सङ्कलन गर्ने कारण',
    'e.g. Doctor authorised, payment to follow': 'जस्तै: डाक्टरले अनुमति दिएको, भुक्तानी पछि हुने',
    'Collection site': 'सङ्कलन स्थान',
    'e.g. Left antecubital vein': 'जस्तै: बायाँ एन्टिक्युबिटल भेन',
    'Container / tube': 'कन्टेनर / ट्युब',
    'e.g. EDTA (lavender)': 'जस्तै: EDTA (लेभेन्डर)',
    'Note (optional)': 'टिप्पणी (वैकल्पिक)',

    # ---- ReceiveSampleModal.tsx ----
    '{accession} received into the lab': '{accession} प्रयोगशालामा प्राप्त भयो',
    'Unable to receive sample': 'नमूना प्राप्त गर्न सकिएन',
    'Receive {accession}': '{accession} प्राप्त गर्नुहोस्',
    'Receive sample': 'नमूना प्राप्त गर्नुहोस्',
    'Record any problem with the specimen. Condition flags are carried onto the results and printed on the report.':
        'नमूनामा भएको कुनै समस्या दर्ता गर्नुहोस्। अवस्था चिन्हहरू नतिजामा लगिन्छ र रिपोर्टमा प्रिन्ट हुन्छ।',
    'Haemolysed': 'हेमोलाइसिस भएको',
    'Lipaemic': 'लिपेमिक',
    'Icteric': 'आइक्टेरिक',
    'Clotted': 'जमेको',
    'Insufficient volume': 'अपुरो मात्रा',
    'Wrong container': 'गलत कन्टेनर',
    'Condition note (optional)': 'अवस्था टिप्पणी (वैकल्पिक)',

    # ---- SampleDetailPage.tsx ----
    'Loading sample…': 'नमूना लोड हुँदैछ…',
    'Sample rejected': 'नमूना अस्वीकृत भयो',
    'Unable to reject sample': 'नमूना अस्वीकार गर्न सकिएन',
    'Recollection requested': 'पुनः सङ्कलन अनुरोध गरियो',
    'Unable to request recollection': 'पुनः सङ्कलन अनुरोध गर्न सकिएन',
    'Collect': 'सङ्कलन गर्नुहोस्',
    'Receive': 'प्राप्त गर्नुहोस्',
    'Reject': 'अस्वीकार गर्नुहोस्',
    'Request recollection': 'पुनः सङ्कलन अनुरोध गर्नुहोस्',
    'Tests on this sample': 'यो नमूनाका परीक्षणहरू',
    '{count} test(s)': '{count} परीक्षण',
    'Tracking timeline': 'ट्रयाकिङ समयरेखा',
    'Label': 'लेबल',
    'Collection': 'सङ्कलन',
    'Container': 'कन्टेनर',
    'Reject this sample?': 'यो नमूना अस्वीकार गर्ने?',
    'The sample will be marked rejected. A recollection can be requested afterwards.':
        'नमूना अस्वीकृत चिन्ह लाग्नेछ। पछि पुनः सङ्कलन अनुरोध गर्न सकिन्छ।',
    'Request recollection?': 'पुनः सङ्कलन अनुरोध गर्ने?',
    'This reopens the sample for collection with the same accession number.':
        'यो उही एक्सेसन नम्बरमा नमूना फेरि सङ्कलनका लागि खोल्छ।',

    # ---- SampleResultsCard.tsx ----
    'Opened when the sample is received.': 'नमूना प्राप्त भएपछि खुल्छ।',
    'No result worklist yet — receive the sample first.': 'अझै कुनै नतिजा वर्कलिस्ट छैन — पहिले नमूना प्राप्त गर्नुहोस्।',
    'Awaiting verification': 'प्रमाणीकरणको पर्खाइमा',
    'Awaiting approval': 'स्वीकृतिको पर्खाइमा',

    # ---- SampleTimeline.tsx ----
    'Created': 'सिर्जना भयो',

    # ---- SamplesPage.tsx ----
    'No sample with barcode {code}': 'बारकोड {code} सँग कुनै नमूना भेटिएन',
    'Lookup failed': 'खोज असफल भयो',
    'Accession': 'एक्सेसन',
    'Created (date)': 'सिर्जना मिति',
    'Track specimens from collection through receipt into the laboratory.':
        'सङ्कलनदेखि प्रयोगशालामा प्राप्तिसम्म नमूनाहरू ट्रयाक गर्नुहोस्।',
    'Scan or type a barcode / accession number': 'बारकोड / एक्सेसन नम्बर स्क्यान वा टाइप गर्नुहोस्',
    'Look up': 'खोज्नुहोस्',
    'Search accession, patient or MRN': 'एक्सेसन, बिरामी वा MRN बाट खोज्नुहोस्',
    'All branches': 'सबै शाखा',
    'No samples': 'कुनै नमूना छैन',
    'Samples are generated automatically when a lab order is confirmed.':
        'ल्याब अर्डर पुष्टि भएपछि नमूनाहरू स्वचालित रूपमा बनिन्छन्।',

    # ---- SPECIMEN_LABELS (catalog/types.ts) — shown on the samples list, detail page and label ----
    'Blood — EDTA (lavender)': 'रक्त — EDTA (लेभेन्डर)',
    'Blood — Serum (gel/red)': 'रक्त — सेरम (जेल/रातो)',
    'Blood — Citrate (blue)': 'रक्त — सिट्रेट (निलो)',
    'Blood — Fluoride (grey)': 'रक्त — फ्लोराइड (खैरो)',
    'Blood — Heparin (green)': 'रक्त — हेपारिन (हरियो)',
    'Whole blood': 'पूरा रक्त',
    'Urine': 'पिसाब',
    'Stool': 'दिसा',
    'Sputum': 'कफ',
    'Swab': 'स्वाब',
    'Body fluid': 'शरीर तरल',
    'Tissue': 'टिस्यु',
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
