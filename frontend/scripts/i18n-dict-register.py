import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # geography
    'Type the local level name': 'स्थानीय तहको नाम टाइप गर्नुहोस्',
    'Select district first': 'पहिले जिल्ला छान्नुहोस्',
    'Other / not listed…': 'अन्य / सूचीमा छैन…',
    'Choose from list instead': 'सूचीबाट छान्नुहोस्',

    # identity section
    'Title': 'सम्बोधन',
    'e.g. Anil Kumar Sharma': 'जस्तै: अनिल कुमार शर्मा',
    'Name in Devanagari (optional)': 'देवनागरीमा नाम (वैकल्पिक)',
    'Approx. age (yrs)': 'अनुमानित उमेर (वर्ष)',
    'If DOB unknown': 'जन्म मिति थाहा नभए',

    # contact
    'Contact name': 'सम्पर्क व्यक्तिको नाम',
    'Contact phone': 'सम्पर्क फोन',
    'This contact is the legal guardian': 'यो सम्पर्क कानुनी संरक्षक हो',
    'Emergency contact / guardian': 'आपतकालीन सम्पर्क / संरक्षक',
    'This patient is a minor — a guardian contact is strongly recommended.':
        'यो बिरामी नाबालक हो — संरक्षकको सम्पर्क राख्न जोड दिइन्छ।',

    # demographics
    'Additional demographics': 'थप जनसांख्यिकी विवरण',

    # registration & referral
    'Registration & referral': 'दर्ता र रेफरल',
    'Branch / counter': 'शाखा / काउन्टर',
    'Hospital / camp / organisation': 'अस्पताल / शिविर / संस्था',
    'Search doctors…': 'डाक्टर खोज्नुहोस्…',
    'Referral source name': 'रेफरलको स्रोत नाम',

    # identity documents
    'Identity documents': 'परिचयपत्र',
    'Citizenship, national ID, passport, PAN, insurance — used for lookup and billing.':
        'नागरिकता, राष्ट्रिय परिचयपत्र, राहदानी, PAN, बीमा — खोज र बिलिङका लागि प्रयोग हुन्छ।',
    'No documents recorded.': 'कुनै कागजात राखिएको छैन।',
    'Type': 'प्रकार',
    'Number': 'नम्बर',
    'Issued at / date': 'जारी स्थान / मिति',
    'Place': 'स्थान',
    'Primary': 'मुख्य',
    'Remove document': 'कागजात हटाउनुहोस्',
    'Add document': 'कागजात थप्नुहोस्',

    # billing party
    'Billing party': 'बिल तिर्ने पक्ष',
    "Who settles this patient's bills.": 'यो बिरामीको बिल कसले तिर्छ।',
    'Payer': 'भुक्तानीकर्ता',
    'Payer name': 'भुक्तानीकर्ताको नाम',
    'Company / insurer / scheme': 'कम्पनी / बीमा कम्पनी / योजना',
    'Scheme / plan': 'योजना',
    'Policy / member ID': 'पोलिसी / सदस्य नम्बर',
    'Authorization / claim ref': 'अनुमति / दाबी सन्दर्भ',
    'Coverage valid until': 'कभरेज मिति सम्म',

    # flags
    'Flags': 'चिन्हहरू',
    'Prioritised handling': 'प्राथमिकता सेवा',
    'Restrict who can view this record': 'यो रेकर्ड कसले हेर्न सक्ने सीमित गर्नुहोस्',
    'Test / training record': 'परीक्षण / तालिम रेकर्ड',
    'Date of death': 'मृत्युको मिति',

    # consent
    'Recorded with the staff member and time of capture.': 'कर्मचारी र समयसहित दर्ता गरिन्छ।',
    'Consent to store and process personal and health data':
        'व्यक्तिगत र स्वास्थ्य डाटा राख्न र प्रशोधन गर्न सहमति',
    'Consent to receive reports by SMS / email / messaging app':
        'SMS / इमेल / म्यासेजिङ एपबाट रिपोर्ट प्राप्त गर्न सहमति',
    'Consent to use anonymised data for quality and research':
        'गुणस्तर र अनुसन्धानका लागि नाम नखुलाई डाटा प्रयोग गर्न सहमति',

    # duplicate override
    'Duplicate override': 'नमूना दोहोरो उपेक्षा',
    'A very similar patient already exists. If this really is a different person, record why.':
        'धेरै मिल्दो बिरामी पहिले नै छ। यो साँच्चै फरक व्यक्ति हो भने, कारण लेख्नुहोस्।',
    'Reason for registering a new record': 'नयाँ रेकर्ड दर्ता गर्ने कारण',
    'This looks like an existing patient. Give a reason to register a new record, or open the existing one.':
        'यो पहिले नै भएको बिरामी जस्तो देखिन्छ। नयाँ रेकर्ड दर्ता गर्ने कारण दिनुहोस्, वा पहिलेको रेकर्ड खोल्नुहोस्।',

    # page-level
    'Edit patient · {mrn}': 'बिरामी सम्पादन · {mrn}',
    'Update demographics, contact, referral and consent.':
        'जनसांख्यिकी, सम्पर्क, रेफरल र सहमति अपडेट गर्नुहोस्।',
    'Search first — check the possible-duplicate panel before creating a new record.':
        'पहिले खोज्नुहोस् — नयाँ रेकर्ड बनाउनुअघि सम्भावित दोहोरो प्यानल जाँच गर्नुहोस्।',
    'Quick register': 'छिटो दर्ता',
    'Name, contact & category only': 'नाम, सम्पर्क र वर्ग मात्र',
    'Patient updated': 'बिरामी अपडेट भयो',
    'Patient registered · {mrn}': 'बिरामी दर्ता भयो · {mrn}',
    'Unable to save patient': 'बिरामी सुरक्षित गर्न सकिएन',

    # relationships (RELATIONSHIPS array)
    'Spouse': 'पति/पत्नी',
    'Parent': 'अभिभावक',
    'Father': 'बाबा',
    'Mother': 'आमा',
    'Son': 'छोरा',
    'Daughter': 'छोरी',
    'Sibling': 'दाजुभाई/दिदीबहिनी',
    'Brother': 'भाई',
    'Sister': 'दिदी/बहिनी',
    'Guardian': 'संरक्षक',
    'Grandparent': 'हजुरबुवा/हजुरआमा',
    'Relative': 'नातेदार',
    'Friend': 'साथी',

    # languages (LANGUAGES array) — Nepali and English already exist as general-purpose keys
    'Maithili': 'मैथिली',
    'Bhojpuri': 'भोजपुरी',
    'Tharu': 'थारू',
    'Tamang': 'तामाङ',
    'Newari': 'नेवारी',
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
