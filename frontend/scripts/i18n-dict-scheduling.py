import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- appointments ----------------------------------------------------------------------
    'Booked time slots for a patient visit. Converting one into a lab order happens at arrival.':
        'बिरामीको भेटका लागि तय गरिएको समय। आइपुगेपछि यसलाई ल्याब अर्डरमा बदलिन्छ।',
    'Search by appointment no., patient or MRN': 'अपोइन्टमेन्ट नं., बिरामी वा MRN बाट खोज्नुहोस्',
    'Doctor': 'डाक्टर',
    'Checked in': 'चेक-इन भयो',
    'Converted': 'परिणत भयो',
    'All branches': 'सबै शाखा',
    'No appointments found': 'कुनै अपोइन्टमेन्ट भेटिएन',
    'Adjust the filters.': 'फिल्टर बदल्नुहोस्।',
    'Book the first appointment.': 'पहिलो अपोइन्टमेन्ट बुक गर्नुहोस्।',
    'Loading appointment…': 'अपोइन्टमेन्ट लोड हुँदैछ…',
    'Requested tests': 'अनुरोध गरिएका परीक्षणहरू',
    'Indicative only — the lab order sets the final price.':
        'यो अनुमानित मात्र हो — अन्तिम मूल्य ल्याब अर्डरले तय गर्छ।',
    'No tests chosen at booking.': 'बुकिङमा कुनै परीक्षण छानिएको छैन।',
    'Cancellation': 'रद्द',
    'Converted order': 'परिणत अर्डर',
    'Check in': 'चेक-इन गर्नुहोस्',
    'Convert to order': 'अर्डरमा परिणत गर्नुहोस्',
    'Reschedule': 'समय सार्नुहोस्',
    'Marked as no-show': 'आएनन् भनी चिन्ह लगाइयो',
    'Cancel {no} for {name}?': '{name} को {no} रद्द गर्ने?',
    'Appointment cancelled': 'अपोइन्टमेन्ट रद्द भयो',
    'Converted to order': 'अर्डरमा परिणत भयो',
    'Pick a patient.': 'बिरामी छान्नुहोस्।',
    'Pick a date and time.': 'मिति र समय छान्नुहोस्।',
    'Appointment rescheduled': 'अपोइन्टमेन्ट समय सारियो',
    'Appointment booked': 'अपोइन्टमेन्ट बुक भयो',
    'Unable to save the appointment': 'अपोइन्टमेन्ट सुरक्षित गर्न सकिएन',
    'Change': 'बदल्नुहोस्',
    'Choose what the visit is expected to need — an indicative total appears below.':
        'भेटका लागि आवश्यक पर्ने परीक्षण छान्नुहोस् — तल अनुमानित जम्मा देखिनेछ।',
    'Quantity for {name}': '{name} को सङ्ख्या',
    'Remove {name}': '{name} हटाउनुहोस्',
    'Referring doctor (optional)': 'रेफर गर्ने डाक्टर (वैकल्पिक)',
    'Default for your account': 'तपाईंको खाताको लागि पूर्वनिर्धारित',
    'e.g. Annual CBC panel, follow-up lipid profile': 'जस्तै: वार्षिक CBC प्यानल, फलोअप लिपिड प्रोफाइल',
    'Indicative estimate from current catalog prices — final pricing, discounts and tax are set on the lab order.':
        'हालको सूची मूल्यबाट अनुमानित रकम — अन्तिम मूल्य, छुट र कर ल्याब अर्डरमा तय हुन्छ।',

    # ---- referring doctors -------------------------------------------------------------------
    'Doctors who refer patients to the laboratory.': 'प्रयोगशालामा बिरामी रेफर गर्ने डाक्टरहरू।',
    'Add doctor': 'डाक्टर थप्नुहोस्',
    'Specialization': 'विशेषज्ञता',
    'NMC no.': 'NMC नं.',
    'Search by name or specialization': 'नाम वा विशेषज्ञताबाट खोज्नुहोस्',
    'No doctors found': 'डाक्टर भेटिएनन्',
    'Try a different search.': 'फरक खोज प्रयास गर्नुहोस्।',
    'Add the first referring doctor.': 'पहिलो रेफर गर्ने डाक्टर थप्नुहोस्।',
    'Doctor updated': 'डाक्टर अपडेट भयो',
    'Doctor added': 'डाक्टर थपियो',
    'Unable to save doctor': 'डाक्टर सुरक्षित गर्न सकिएन',
    'Edit referring doctor': 'रेफर गर्ने डाक्टर सम्पादन',
    'Add referring doctor': 'रेफर गर्ने डाक्टर थप्नुहोस्',
    'Qualification': 'योग्यता',
    'NMC number': 'NMC नम्बर',
    'Affiliated organization': 'सम्बद्ध संस्था',
    'Commission rate %': 'कमिसन दर %',
    '% of taxable invoice value earned on orders this doctor refers. Leave blank for no commission.':
        'यो डाक्टरले रेफर गरेको अर्डरको कर लाग्ने बिल रकमको कति % कमिसन पाउने। कमिसन नचाहिए खाली छोड्नुहोस्।',

    # ---- departments --------------------------------------------------------------------------
    'Laboratory departments group tests, staff and work queues.':
        'प्रयोगशाला विभागले परीक्षण, कर्मचारी र कामको लाइन समूहबद्ध गर्छ।',
    'New department': 'नयाँ विभाग',
    'Code': 'कोड',
    'Description': 'विवरण',
    'No departments yet': 'अहिलेसम्म कुनै विभाग छैन',
    'Create the first department to organise the catalog.': 'सूची मिलाउन पहिलो विभाग बनाउनुहोस्।',
    'Department updated': 'विभाग अपडेट भयो',
    'Department created': 'विभाग बनाइयो',
    'Unable to save department': 'विभाग सुरक्षित गर्न सकिएन',
    'Edit department': 'विभाग सम्पादन',
    'Short unique identifier, e.g. HAEM': 'छोटो र अनौठो परिचायक, जस्तै: HAEM',
    'Create department': 'विभाग बनाउनुहोस्',

    # ---- branches -----------------------------------------------------------------------------
    "Locations and collection centers. Staff with a home branch see only that branch's orders, samples and invoices.":
        'स्थानहरू र नमूना सङ्कलन केन्द्रहरू। आफ्नो शाखा तोकिएका कर्मचारीले त्यही शाखाका अर्डर, नमूना र बिल मात्र देख्छन्।',
    'New branch': 'नयाँ शाखा',
    'No branches yet': 'अहिलेसम्म कुनै शाखा छैन',
    'Create the first branch to enable branch-scoped operations.': 'शाखा-आधारित सञ्चालन सुरु गर्न पहिलो शाखा बनाउनुहोस्।',
    'Branch updated': 'शाखा अपडेट भयो',
    'Branch created': 'शाखा बनाइयो',
    'Unable to save branch': 'शाखा सुरक्षित गर्न सकिएन',
    'Edit branch': 'शाखा सम्पादन',
    'Short unique identifier, e.g. PKR': 'छोटो र अनौठो परिचायक, जस्तै: PKR',
    'Create branch': 'शाखा बनाउनुहोस्',
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
