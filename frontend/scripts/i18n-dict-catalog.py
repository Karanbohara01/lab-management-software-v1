import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- reflex rules ----------------------------------------------------------------------
    'Any abnormal (LOW/HIGH/ABNORMAL, critical included)': 'कुनै पनि असामान्य (LOW/HIGH/ABNORMAL, गम्भीर समेत)',
    'Reflex testing rules': 'रिफ्लेक्स परीक्षण नियमहरू',
    "When a test's result comes back abnormal or critical, suggest ordering a follow-up test. Suggestion only — nothing is ever auto-ordered or auto-billed; staff see it as a notification and add the test themselves if appropriate.":
        'कुनै परीक्षणको नतिजा असामान्य वा गम्भीर आउँदा, पछ्याउने परीक्षण गर्न सुझाव दिनुहोस्। यो केवल सुझाव मात्र हो — कुनै पनि परीक्षण आफैं अर्डर वा बिल हुँदैन; कर्मचारीले यो सूचनाको रूपमा देख्छन् र उपयुक्त भए आफैं परीक्षण थप्छन्।',
    'Add rule': 'नियम थप्नुहोस्',
    'New reflex rule': 'नयाँ रिफ्लेक्स नियम',
    'Source test (the one that was resulted)': 'स्रोत परीक्षण (नतिजा आएको परीक्षण)',
    'Trigger': 'ट्रिगर',
    'Suggested test': 'सुझाव गरिएको परीक्षण',
    'Note (optional)': 'नोट (वैकल्पिक)',
    'e.g. reflex to confirm thyroid status': 'जस्तै: थायरोइड स्थिति पुष्टि गर्न रिफ्लेक्स',
    'Save rule': 'नियम सुरक्षित गर्नुहोस्',
    'No reflex rules': 'कुनै रिफ्लेक्स नियम छैन',
    'Add a rule to start suggesting follow-up tests automatically.': 'पछ्याउने परीक्षण स्वतः सुझाव दिन सुरु गर्न नियम थप्नुहोस्।',
    'If this test': 'यदि यो परीक्षण',
    'Comes back': 'नतिजा आउँछ',
    'Suggest': 'सुझाव',
    'Delete rule': 'नियम मेटाउनुहोस्',
    'Reflex rule added': 'रिफ्लेक्स नियम थपियो',
    'Unable to save': 'सुरक्षित गर्न सकिएन',
    'Reflex rule removed': 'रिफ्लेक्स नियम हटाइयो',
    'Unable to update': 'अपडेट गर्न सकिएन',
    'Unable to delete': 'मेटाउन सकिएन',

    # ---- test catalog ------------------------------------------------------------------------
    'Code': 'कोड',
    'Params': 'प्यारामिटर',
    'Price': 'मूल्य',
    'Configure tests, their specimen requirements, pricing and result parameters.': 'परीक्षणहरू, तिनका नमूना आवश्यकता, मूल्य र नतिजा प्यारामिटर व्यवस्थित गर्नुहोस्।',
    'Import from master catalogue': 'मुख्य सूचीबाट आयात गर्नुहोस्',
    'New test': 'नयाँ परीक्षण',
    'Search by name or code': 'नाम वा कोडबाट खोज्नुहोस्',
    'No tests found': 'कुनै परीक्षण भेटिएन',
    'Adjust the filters.': 'फिल्टर बदल्नुहोस्।',
    'Add the first test to the catalog.': 'सूचीमा पहिलो परीक्षण थप्नुहोस्।',

    # ---- specimen types (shared across test / master catalog forms) -----------------------
    'Blood — EDTA (lavender)': 'रक्त — EDTA (बैजनी)',
    'Blood — Serum (gel/red)': 'रक्त — सिरम (जेल/रातो)',
    'Blood — Citrate (blue)': 'रक्त — साइट्रेट (निलो)',
    'Blood — Fluoride (grey)': 'रक्त — फ्लोराइड (खैरो)',
    'Blood — Heparin (green)': 'रक्त — हेपारिन (हरियो)',
    'Whole blood': 'पूरा रक्त',
    'Urine': 'पिसाब',
    'Stool': 'दिसा',
    'Sputum': 'कफ',
    'Swab': 'स्वाब',
    'CSF': 'CSF',
    'Body fluid': 'शरीरको तरल पदार्थ',
    'Tissue': 'तन्तु',

    # ---- parameter data types (shared) -----------------------------------------------------
    'Numeric': 'सङ्ख्यात्मक',
    'Free text': 'स्वतन्त्र लेख',
    'Categorical': 'श्रेणीगत',
    'Positive / Negative': 'पोजेटिभ / नेगेटिभ',
    'Reactive / Non-reactive': 'रिएक्टिभ / नन-रिएक्टिभ',
    'Text': 'लेख',
    'Categorical (picklist)': 'श्रेणीगत (पिकलिस्ट)',

    # ---- age units (shared) -----------------------------------------------------------------
    'months': 'महिना',
    'days': 'दिन',

    # ---- test form modal --------------------------------------------------------------------
    'All patients': 'सबै बिरामी',
    'Type or pick…': 'टाइप गर्नुहोस् वा छान्नुहोस्…',
    'Used in formulas': 'फर्मुलामा प्रयोग हुन्छ',
    'Calculated parameter — its value comes from the formula in Advanced; no manual entry or reference range.':
        'गणना गरिएको प्यारामिटर — यसको मान एडवान्सको फर्मुलाबाट आउँछ; म्यानुअल प्रविष्टि वा सन्दर्भ दायरा चाहिँदैन।',
    'Normal low': 'सामान्य न्यूनतम',
    'Normal high': 'सामान्य अधिकतम',
    'Applies to': 'लागू हुने',
    'Age from': 'उमेर देखि',
    'Age to': 'उमेर सम्म',
    'Age unit': 'उमेर एकाइ',
    '+ Age / sex-specific range': '+ उमेर / लिङ्ग अनुसार दायरा',
    'Allowed values': 'स्वीकृत मानहरू',
    'Separate the options with a vertical bar ( | )': 'विकल्पहरूलाई भर्टिकल बार ( | ) ले छुट्याउनुहोस्',
    'Normal / expected result': 'सामान्य / अपेक्षित नतिजा',
    'Culture & sensitivity test': 'कल्चर र सेन्सिटिविटी परीक्षण',
    'Results are entered as a growth outcome plus, when organisms are isolated, an antibiotic susceptibility panel per isolate — configured on the result screen, not here. No parameters are needed.':
        'नतिजा ग्रोथको नतिजा र, कीटाणु फेला परेमा, प्रत्येक आइसोलेटको एन्टिबायोटिक सेन्सिटिविटी प्यानलको रूपमा प्रविष्ट गरिन्छ — यो नतिजा स्क्रिनमा सेट हुन्छ, यहाँ होइन। यहाँ कुनै प्यारामिटर चाहिँदैन।',
    'Parameters': 'प्यारामिटरहरू',
    'A test can report a single value or several parameters.': 'एउटा परीक्षणले एउटै मान वा धेरै प्यारामिटर रिपोर्ट गर्न सक्छ।',
    '{count} parameter — click a row to expand.': '{count} प्यारामिटर — पङ्क्तिमा क्लिक गरी खोल्नुहोस्।',
    '{count} parameters — click a row to expand.': '{count} प्यारामिटरहरू — पङ्क्तिमा क्लिक गरी खोल्नुहोस्।',
    'Add parameter': 'प्यारामिटर थप्नुहोस्',
    '+ Add the first parameter': '+ पहिलो प्यारामिटर थप्नुहोस्',
    'Test details': 'परीक्षणको विवरण',
    'Test name': 'परीक्षणको नाम',
    'Analyte — measured test with parameters': 'एनालाइट — प्यारामिटरसहितको मापन गरिने परीक्षण',
    'Profile / panel — bundle of member tests': 'प्रोफाइल / प्यानल — सदस्य परीक्षणहरूको समूह',
    'Result entry': 'नतिजा प्रविष्टि',
    'Parametric — one value per parameter': 'प्यारामेट्रिक — प्रत्येक प्यारामिटरको एक मान',
    'Culture — microbiology growth + sensitivity': 'कल्चर — माइक्रोबायोलोजी ग्रोथ + सेन्सिटिविटी',
    'Select…': 'छान्नुहोस्…',
    'Method': 'विधि',
    'LOINC code': 'LOINC कोड',
    'Price (NPR)': 'मूल्य (NPR)',
    'Turnaround (hours)': 'समयावधि (घण्टा)',
    'Specimen & handling': 'नमूना र ह्यान्डलिङ',
    'Container / tube': 'कन्टेनर / ट्युब',
    'Min volume (mL)': 'न्यूनतम मात्रा (mL)',
    'Stability': 'स्थायित्व',
    'Fasting required': 'फास्टिङ आवश्यक',
    'Fasting hours': 'फास्टिङ घण्टा',
    'Send-away (referral) test': 'बाहिर पठाइने (रेफरल) परीक्षण',
    'Reference laboratory': 'सन्दर्भ प्रयोगशाला',
    'Specimen requirements / instructions': 'नमूना आवश्यकता / निर्देशन',
    'Auto-verify normal results': 'सामान्य नतिजा स्वतः प्रमाणित गर्नुहोस्',
    'A fully-normal, in-range result with no delta breach is verified automatically':
        'पूर्ण सामान्य, दायराभित्रको र डेल्टा उल्लङ्घन नभएको नतिजा स्वतः प्रमाणित हुन्छ',
    'Member tests': 'सदस्य परीक्षणहरू',
    'Remove {code}': '{code} हटाउनुहोस्',
    'No member tests yet.': 'अहिलेसम्म कुनै सदस्य परीक्षण छैन।',
    'Search tests to add…': 'थप्न परीक्षण खोज्नुहोस्…',
    'No matching analyte tests.': 'मिल्दो एनालाइट परीक्षण भेटिएन।',
    'Ordering this profile bills the price above and produces results for each member test.':
        'यो प्रोफाइल अर्डर गर्दा माथिको मूल्य बिल हुन्छ र प्रत्येक सदस्य परीक्षणको नतिजा तयार हुन्छ।',
    'Advanced — grouping, formula, plausibility, delta': 'एडवान्स — समूहीकरण, फर्मुला, सम्भाव्यता, डेल्टा',
    'Group heading': 'समूह शीर्षक',
    'Method / analyzer': 'विधि / एनालाइजर',
    'Decimal places': 'दशमलव स्थान',
    'Formula': 'फर्मुला',
    'Arithmetic over other parameter codes': 'अन्य प्यारामिटर कोडहरूमा आधारित गणित',
    'Plausible min': 'सम्भावित न्यूनतम',
    'Reject values below this': 'यो भन्दा कम मान अस्वीकार गर्नुहोस्',
    'Plausible max': 'सम्भावित अधिकतम',
    'Reject values above this': 'यो भन्दा बढी मान अस्वीकार गर्नुहोस्',
    'Delta check %': 'डेल्टा जाँच %',
    'Flag if change vs the previous result exceeds this': 'अघिल्लो नतिजासँग तुलना गर्दा परिवर्तन यो भन्दा बढी भए चिन्ह लगाउनुहोस्',
    'Edit test · {code}': 'परीक्षण सम्पादन · {code}',
    'Test updated': 'परीक्षण अपडेट भयो',
    'Test added to catalog': 'परीक्षण सूचीमा थपियो',
    'Add at least one member test to the profile.': 'प्रोफाइलमा कम्तीमा एक सदस्य परीक्षण थप्नुहोस्।',
    'Unable to save test': 'परीक्षण सुरक्षित गर्न सकिएन',
    'Remove parameter {n}': 'प्यारामिटर {n} हटाउनुहोस्',
    'Parameter {n}': 'प्यारामिटर {n}',
    'calculated': 'गणना गरिएको',

    # ---- test picker --------------------------------------------------------------------------
    'Search tests by name or code': 'नाम वा कोडबाट परीक्षण खोज्नुहोस्',
    'Added': 'थपियो',

    # ---- import from master catalogue ----------------------------------------------------------
    'Pick the tests you want — each becomes your own editable copy (price, ranges, etc.), not a live link.':
        'तपाईंलाई चाहिने परीक्षणहरू छान्नुहोस् — प्रत्येक तपाईंको आफ्नै सम्पादन गर्न मिल्ने प्रतिलिपि (मूल्य, दायरा आदि) बन्छ, लाइभ लिंक होइन।',
    'Import': 'आयात',
    'Nothing to import': 'आयात गर्न केही छैन',
    "The platform admin hasn't added any master tests yet.": 'प्लेटफर्म एडमिनले अहिलेसम्म कुनै मास्टर परीक्षण थपेका छैनन्।',
    'Select {name}': '{name} छान्नुहोस्',
    '{count} parameter': '{count} प्यारामिटर',
    '{count} parameters': '{count} प्यारामिटरहरू',
    'Imported {count} test': '{count} परीक्षण आयात भयो',
    'Imported {count} tests': '{count} परीक्षणहरू आयात भए',
    'Skipped {count} — already in your catalog: {names}': '{count} छोडियो — तपाईंको सूचीमा पहिले नै छ: {names}',
    'Import failed': 'आयात असफल भयो',

    # ---- master catalogue (platform admin) -----------------------------------------------------
    'Master lab catalogue': 'मुख्य प्रयोगशाला सूची',
    'Curate a shared library of common tests every clinic can import instead of building from scratch.':
        'हरेक क्लिनिकले सुरुदेखि नबनाई आयात गर्न सक्ने साझा सामान्य परीक्षण सूची तयार गर्नुहोस्।',
    'New master test': 'नयाँ मास्टर परीक्षण',
    'Total tests': 'जम्मा परीक्षण',
    'Active (visible to clinics)': 'सक्रिय (क्लिनिकलाई देखिने)',
    'Hidden from clinics': 'क्लिनिकबाट लुकाइयो',
    'Visible to clinics': 'क्लिनिकलाई देखिने गरियो',
    'Suggested price': 'सुझाव गरिएको मूल्य',
    'Hidden': 'लुकाइएको',
    'Clear filters': 'फिल्टर खाली गर्नुहोस्',
    'No master tests yet': 'अहिलेसम्म कुनै मास्टर परीक्षण छैन',
    'Add the first one for clinics to import.': 'क्लिनिकहरूले आयात गर्न पहिलो थप्नुहोस्।',
    'Showing {shown} of {total} tests': 'जम्मा {total} मध्ये {shown} देखाइँदै',
    'No tests match your filters': 'तपाईंको फिल्टरसँग कुनै परीक्षण मिल्दैन',
    'Try a different search term or department.': 'फरक खोज शब्द वा विभाग प्रयास गर्नुहोस्।',

    # ---- master test form modal ----------------------------------------------------------------
    'Edit {code}': '{code} सम्पादन',
    "Curated for every clinic to import — not tied to any one clinic's own catalog.":
        'हरेक क्लिनिकले आयात गर्नका लागि तयार पारिएको — कुनै एक क्लिनिकको आफ्नै सूचीसँग बाँधिएको छैन।',
    'Auto-created per clinic if missing': 'नभए क्लिनिकमा स्वतः बनाइन्छ',
    'Turnaround (hrs)': 'समयावधि (घण्टा)',
    'Display order': 'देखाउने क्रम',
    'Active (visible to clinics for import)': 'सक्रिय (आयातका लागि क्लिनिकलाई देखिने)',
    'Add from presets': 'प्रिसेटबाट थप्नुहोस्',
    'Blank parameter': 'खाली प्यारामिटर',
    'Click any analyte to add it with its typical unit and reference range pre-filled — everything stays editable afterward. Click several in a row to build up a multi-parameter test quickly.':
        'कुनै पनि एनालाइटमा क्लिक गर्दा यसको सामान्य एकाइ र सन्दर्भ दायरा पहिले नै भरिएर थपिन्छ — पछि सबै सम्पादन गर्न मिल्छ। धेरै प्यारामिटरको परीक्षण छिटो बनाउन लगातार धेरैमा क्लिक गर्नुहोस्।',
    'No parameters yet — add from presets above, or add a blank one.': 'अहिलेसम्म कुनै प्यारामिटर छैन — माथिको प्रिसेटबाट थप्नुहोस् वा खाली एउटा थप्नुहोस्।',
    'Remove parameter': 'प्यारामिटर हटाउनुहोस्',
    'Master test updated': 'मास्टर परीक्षण अपडेट भयो',
    'Master test created': 'मास्टर परीक्षण बनाइयो',

    # ---- parameter master (clinic's reusable analyte dictionary) --------------------------------
    'Edit parameter · {name}': 'प्यारामिटर सम्पादन · {name}',
    'New parameter': 'नयाँ प्यारामिटर',
    'Optional short code': 'वैकल्पिक छोटो कोड',
    'Typical adult reference range': 'वयस्कको सामान्य सन्दर्भ दायरा',
    'Values entered here are only defaults offered when adding a parameter to a test — editing this later does not change any test that already used it.':
        'यहाँ राखिएका मान त परीक्षणमा प्यारामिटर थप्दा सुझाव हुने डिफल्ट मात्र हो — पछि यो बदल्दा पहिले नै प्रयोग भइसकेको कुनै परीक्षण बदलिँदैन।',
    'Parameter updated': 'प्यारामिटर अपडेट भयो',
    'Parameter added to dictionary': 'प्यारामिटर शब्दकोशमा थपियो',
    'Unable to save parameter': 'प्यारामिटर सुरक्षित गर्न सकिएन',
    'Reusable analyte defaults offered when adding a parameter to a test.': 'परीक्षणमा प्यारामिटर थप्दा सुझाव हुने पुनः प्रयोग गर्न मिल्ने एनालाइट डिफल्ट।',
    'Search parameters…': 'प्यारामिटर खोज्नुहोस्…',
    'Typical range': 'सामान्य दायरा',
    'Parameter deactivated': 'प्यारामिटर निष्क्रिय गरियो',
    'Parameter activated': 'प्यारामिटर सक्रिय गरियो',
    'Unable to update parameter': 'प्यारामिटर अपडेट गर्न सकिएन',
    'No parameters yet': 'अहिलेसम्म कुनै प्यारामिटर छैन',
    'Add your first analyte to start building your reusable parameter dictionary.':
        'आफ्नो पुनः प्रयोग गर्न मिल्ने प्यारामिटर शब्दकोश बनाउन सुरु गर्न पहिलो एनालाइट थप्नुहोस्।',
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
