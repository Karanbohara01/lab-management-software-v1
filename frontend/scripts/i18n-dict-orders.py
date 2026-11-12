import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- PricingSummary.tsx ----------------------------------------------------------------
    'Discount ({percent}%)': 'छुट ({percent}%)',
    'Tax ({rate}%)': 'कर ({rate}%)',
    'Total payable': 'तिर्नुपर्ने कुल रकम',

    # ---- OrderWorkflow.tsx (stepper note/labels, computeStage) -----------------------------
    'Order cancelled.': 'अर्डर रद्द भयो।',
    'Confirm to lock the order and generate samples.': 'अर्डर लक गर्न र नमूना तयार गर्न पुष्टि गर्नुहोस्।',
    'Generating samples…': 'नमूना तयार हुँदैछ…',
    'Collect samples': 'नमूना सङ्कलन गर्नुहोस्',
    'Receive into lab': 'ल्याबमा प्राप्त गर्नुहोस्',
    'Opening result worklist…': 'नतिजा कार्यसूची खुल्दैछ…',
    'Enter results ({count} pending)': 'नतिजा प्रविष्ट गर्नुहोस् ({count} बाँकी)',
    'Verify results ({count})': 'नतिजा प्रमाणित गर्नुहोस् ({count})',
    'Authorize results ({count})': 'नतिजा स्वीकृत गर्नुहोस् ({count})',
    'Sign & release report': 'रिपोर्ट हस्ताक्षर गरी जारी गर्नुहोस्',
    'Report delivered — this order is complete.': 'रिपोर्ट पठाइयो — यो अर्डर सम्पन्न भयो।',
    'Next step:': 'अर्को चरण:',

    # ---- OrderInvoiceCard.tsx ---------------------------------------------------------------
    'Draft invoice created': 'मस्यौदा बिल बनाइयो',
    'Unable to create invoice': 'बिल बनाउन सकिएन',
    'Total {total} · Balance': 'कुल {total} · बाँकी',
    'Open invoice': 'बिल खोल्नुहोस्',
    'Create invoice': 'बिल बनाउनुहोस्',
    'No invoice raised yet.': 'अहिलेसम्म बिल बनाइएको छैन।',

    # ---- OrderSamplesCard.tsx ---------------------------------------------------------------
    '{received}/{total} received': '{received}/{total} प्राप्त भयो',
    '{count} test(s)': '{count} परीक्षण',
    'Collect': 'सङ्कलन गर्नुहोस्',
    'Receive': 'प्राप्त गर्नुहोस्',

    # ---- OrderBuilderPage.tsx ---------------------------------------------------------------
    'Unable to load the order builder': 'अर्डर बिल्डर लोड गर्न सकिएन',
    'Select a patient.': 'बिरामी छान्नुहोस्।',
    'Add at least one test.': 'कम्तीमा एक परीक्षण थप्नुहोस्।',
    'Order {number} confirmed': 'अर्डर {number} पुष्टि भयो',
    'Draft {number} saved': 'मस्यौदा {number} सुरक्षित भयो',
    'Order created, but the appointment could not be marked as converted': 'अर्डर बन्यो, तर अपोइन्टमेन्टलाई रूपान्तरित चिन्ह लगाउन सकिएन',
    'Unable to save the order': 'अर्डर सुरक्षित गर्न सकिएन',
    'Edit draft order': 'मस्यौदा अर्डर सम्पादन',
    'Change': 'बदल्नुहोस्',
    'Search the catalog and add the tests to order.': 'सूचीमा खोजी गरी परीक्षण अर्डरमा थप्नुहोस्।',
    'No tests added yet.': 'अहिलेसम्म कुनै परीक्षण थपिएको छैन।',
    'Rate': 'दर',
    'Qty': 'सङ्ख्या',
    'Line disc.': 'लाइन छुट',
    'Quantity for {test}': '{test} को सङ्ख्या',
    'Line discount for {test}': '{test} को लाइन छुट',
    'Remove {test}': '{test} हटाउनुहोस्',
    'Referral & notes': 'रेफरल र टिप्पणी',
    'Default branch': 'पूर्वनिर्धारित शाखा',
    'No referring doctor': 'रेफर गर्ने डाक्टर छैन',
    'STAT — jumps the queue, tighter turnaround': 'STAT — लाइन उछिनेर जान्छ, छिटो समयावधि',
    'Discount & tax': 'छुट र कर',
    'Discount type': 'छुटको प्रकार',
    'No discount': 'छुट छैन',
    'Percentage (%)': 'प्रतिशत (%)',
    'Flat amount (NPR)': 'निश्चित रकम (NPR)',
    'Discount %': 'छुट %',
    'Discount amount': 'छुट रकम',
    'Tax rate %': 'कर दर %',
    'Most diagnostic services in Nepal are VAT-exempt — leave at 0 unless advised.':
        'नेपालमा अधिकांश डायग्नोस्टिक सेवा VAT मुक्त छन् — सल्लाह नभएसम्म 0 मा राख्नुहोस्।',
    'Order summary': 'अर्डर सारांश',
    'Save & confirm': 'सुरक्षित गरी पुष्टि गर्नुहोस्',
    'Save as draft': 'मस्यौदाको रूपमा सुरक्षित गर्नुहोस्',
    'Totals are recalculated and finalised by the server on save.':
        'सुरक्षित गर्दा जम्मा रकम सर्भरले पुन: गणना गरी अन्तिम रूप दिन्छ।',

    # ---- OrdersPage.tsx ---------------------------------------------------------------------
    'Ordered': 'अर्डर गरिएको मिति',
    'Test orders raised for patients. Confirming an order makes it ready for sample collection.':
        'बिरामीका लागि राखिएका परीक्षण अर्डरहरू। अर्डर पुष्टि गर्दा नमूना सङ्कलनका लागि तयार हुन्छ।',
    'Search by order no., patient or MRN': 'अर्डर नम्बर, बिरामी वा MRN बाट खोज्नुहोस्',
    'All branches': 'सबै शाखा',
    'No orders found': 'अर्डर भेटिएन',
    'Adjust the filters.': 'फिल्टर बदल्नुहोस्।',
    'Create the first lab order.': 'पहिलो ल्याब अर्डर बनाउनुहोस्।',

    # ---- OrderReportCard.tsx ----------------------------------------------------------------
    'Signing credentials (e.g. "MD Pathology, NMC-12345"):': 'हस्ताक्षर विवरण (जस्तै: "MD Pathology, NMC-12345"):',
    'Report signed & released': 'रिपोर्ट हस्ताक्षर गरी जारी भयो',
    'Sign & release': 'हस्ताक्षर गरी जारी गर्नुहोस्',
    'Open report': 'रिपोर्ट खोल्नुहोस्',
    'Report regenerated': 'रिपोर्ट पुन: तयार भयो',
    'Regenerate': 'पुन: तयार गर्नुहोस्',
    'A report can be generated once results are authorized.': 'नतिजा स्वीकृत भएपछि रिपोर्ट तयार गर्न सकिन्छ।',
    'Report generated': 'रिपोर्ट तयार भयो',
    'Generate final report': 'अन्तिम रिपोर्ट तयार गर्नुहोस्',
    'Preliminary report generated': 'प्रारम्भिक रिपोर्ट तयार भयो',
    'Generate preliminary report': 'प्रारम्भिक रिपोर्ट तयार गर्नुहोस्',
    'Results are authorized — a pathologist can generate the report.':
        'नतिजा स्वीकृत भइसक्यो — प्याथोलोजिस्टले रिपोर्ट तयार गर्न सक्छन्।',

    # ---- OrderDetailPage.tsx ----------------------------------------------------------------
    'Loading order…': 'अर्डर लोड हुँदैछ…',
    '{count} item(s) failed': '{count} वस्तु असफल भयो',
    'Samples collected': 'नमूना सङ्कलन भयो',
    'Samples received into the lab': 'नमूना ल्याबमा प्राप्त भयो',
    'Results verified': 'नतिजा प्रमाणित भयो',
    'Results authorized': 'नतिजा स्वीकृत भयो',
    'Sample collected': 'नमूना सङ्कलन भयो',
    '{message}\n\nEnter a reason to collect without payment:': '{message}\n\nभुक्तानी बिना सङ्कलन गर्ने कारण लेख्नुहोस्:',
    'Sample collected without payment': 'भुक्तानी बिना नमूना सङ्कलन भयो',
    'Failed': 'असफल भयो',
    'Unable to collect sample': 'नमूना सङ्कलन गर्न सकिएन',
    'Result verified': 'नतिजा प्रमाणित भयो',
    '{message}\n\nEnter a documented reason to verify it yourself:':
        '{message}\n\nआफैं प्रमाणित गर्ने लिखित कारण लेख्नुहोस्:',
    'Result verified with override': 'ओभरराइड गरी नतिजा प्रमाणित भयो',
    'Unable to verify': 'प्रमाणित गर्न सकिएन',
    'Result authorized': 'नतिजा स्वीकृत भयो',
    '{message}\n\nEnter a documented reason to authorize anyway:':
        '{message}\n\nजसरी पनि स्वीकृत गर्ने लिखित कारण लेख्नुहोस्:',
    'Result authorized with override': 'ओभरराइड गरी नतिजा स्वीकृत भयो',
    'Unable to authorize': 'स्वीकृत गर्न सकिएन',
    'Order confirmed': 'अर्डर पुष्टि भयो',
    'Unable to confirm order': 'अर्डर पुष्टि गर्न सकिएन',
    'Order cancelled': 'अर्डर रद्द भयो',
    'Unable to cancel order': 'अर्डर रद्द गर्न सकिएन',
    'Order {number}': 'अर्डर {number}',
    '{patient} · {mrn} · placed {date}': '{patient} · {mrn} · {date} मा राखिएको',
    'No reason recorded.': 'कुनै कारण उल्लेख छैन।',
    'Dept.': 'विभाग',
    'Patient & referral': 'बिरामी र रेफरल',
    'Confirm this order?': 'यो अर्डर पुष्टि गर्ने?',
    'Once confirmed, the order is locked for editing and samples are generated for collection.':
        'पुष्टि भएपछि, अर्डर सम्पादनका लागि लक हुन्छ र नमूना सङ्कलनका लागि तयार हुन्छ।',
    'Cancel this order?': 'यो अर्डर रद्द गर्ने?',
    'This will cancel the whole order. This cannot be undone.': 'यसले सम्पूर्ण अर्डर रद्द गर्नेछ। यो फिर्ता हुन सक्दैन।',

    # ---- OrderResultsCard.tsx ---------------------------------------------------------------
    '{approved}/{total} authorized': '{approved}/{total} स्वीकृत भयो',
    'Culture': 'कल्चर',
    'Enter': 'प्रविष्ट गर्नुहोस्',
    'Authorize': 'स्वीकृत गर्नुहोस्',

    # ---- indirect lookups: RESULT_STATUS_LABEL additions not already in ne.ts -------------
    'Awaiting verification': 'प्रमाणीकरण पर्खँदै',
    'Awaiting approval': 'स्वीकृति पर्खँदै',

    # ---- indirect lookups: SPECIMEN_LABELS (catalog/types.ts), read via OrderSamplesCard ---
    'Blood — EDTA (lavender)': 'रक्त — EDTA (बैजनी)',
    'Blood — Serum (gel/red)': 'रक्त — सेरम (जेल/रातो)',
    'Blood — Citrate (blue)': 'रक्त — साइट्रेट (निलो)',
    'Blood — Fluoride (grey)': 'रक्त — फ्लोराइड (खैरो)',
    'Blood — Heparin (green)': 'रक्त — हेपारिन (हरियो)',
    'Whole blood': 'पूरा रक्त',
    'Urine': 'पिसाब',
    'Stool': 'दिसा',
    'Sputum': 'कफ',
    'Swab': 'स्वाब',
    'CSF': 'CSF',
    'Body fluid': 'शारीरिक तरल',
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
