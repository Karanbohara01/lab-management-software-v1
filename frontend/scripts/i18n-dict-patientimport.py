import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ImportStepper — the 6-step progress rail
    'Upload': 'अपलोड',
    'Map columns': 'स्तम्भ मिलान',
    'Review': 'समीक्षा',
    'Progress': 'प्रगति',
    'Summary': 'सारांश',
    'Import progress': 'आयात प्रगति',
    'Step {current} of {total}': 'चरण {current} / {total}',
    '(current step)': '(हालको चरण)',

    # ImportMappingStep — matching the clinic's columns to patient fields
    'Do not import this column': 'यो स्तम्भ आयात नगर्नुहोस्',
    '(required)': '(आवश्यक)',
    'Required fields still need a column': 'आवश्यक फिल्डहरूलाई अझै स्तम्भ चाहिन्छ',
    'Every patient needs at least a name and a gender.': 'हरेक बिरामीलाई कम्तीमा नाम र लिङ्ग चाहिन्छ।',
    'Map a date of birth or an age': 'जन्म मिति वा उमेर मिलाउनुहोस्',
    'A patient record needs one of the two. Point a column at whichever your file has.':
        'बिरामी अभिलेखलाई यी दुईमध्ये एक चाहिन्छ। तपाईंको फाइलमा जुन भएको छ, त्यसैमा स्तम्भ तोक्नुहोस्।',
    'Ready to check the file': 'फाइल जाँच गर्न तयार',
    '{count} column mapped.': '{count} स्तम्भ मिलान भयो।',
    '{count} columns mapped.': '{count} स्तम्भहरू मिलान भए।',
    '{count} column mapped, {ignored} will be ignored.': '{count} स्तम्भ मिलान भयो, {ignored} बेवास्ता गरिनेछ।',
    '{count} columns mapped, {ignored} will be ignored.': '{count} स्तम्भहरू मिलान भए, {ignored} बेवास्ता गरिनेछ।',
    'Column in your file': 'तपाईंको फाइलको स्तम्भ',
    'First few values': 'पहिलो केही मानहरू',
    'Import as': 'यसरी आयात गर्नुहोस्',
    '(no heading)': '(शीर्षक छैन)',
    'Column {number}': 'स्तम्भ {number}',
    'empty': 'खाली',
    'Import the column "{header}" as': 'स्तम्भ "{header}" लाई यसरी आयात गर्नुहोस्',
    'Matched automatically from the column heading': 'स्तम्भको शीर्षकबाट स्वचालित रूपमा मिलाइयो',
    'matched': 'मिलायो',
    'ignored': 'बेवास्ता गरियो',
    'Showing the first {count} row of your file. Nothing is imported until you have seen the full check in the next step.':
        'तपाईंको फाइलको पहिलो {count} पङ्क्ति देखाइएको छ। अर्को चरणमा पूरा जाँच नहेरेसम्म केही पनि आयात हुँदैन।',
    'Showing the first {count} rows of your file. Nothing is imported until you have seen the full check in the next step.':
        'तपाईंको फाइलका पहिलो {count} पङ्क्तिहरू देखाइएका छन्। अर्को चरणमा पूरा जाँच नहेरेसम्म केही पनि आयात हुँदैन।',

    # ImportRowsTable — the column-mapping dropdown's canonical field names, title-cased as the
    # server's /patient-imports/fields endpoint and the local FIELD_LABEL map spell them (the
    # sentence-case versions of these already exist in the dictionary for other screens)
    'Full Name': 'पूरा नाम',
    'Blood Group': 'रक्त समूह',
    'Marital Status': 'वैवाहिक स्थिति',
    'Patient Category': 'बिरामी वर्ग',
    'Existing Patient ID': 'पुरानो बिरामी नम्बर',
    'Row': 'पङ्क्ति',
    'Outcome': 'नतिजा',
    'Detail': 'विवरण',
    '(no name)': '(नाम छैन)',
    'View patient': 'बिरामी हेर्नुहोस्',

    # ImportPatientsPage — page header and step 1, choosing a file
    'Bring an existing patient list in from a spreadsheet, without registering each person by hand.':
        'प्रत्येक बिरामीलाई हातैले दर्ता नगरी, स्प्रेडसिटबाट पुरानो बिरामी सूची ल्याउनुहोस्।',
    'Download template': 'टेम्प्लेट डाउनलोड गर्नुहोस्',
    'Start again': 'फेरि सुरु गर्नुहोस्',
    'Upload the patient list': 'बिरामी सूची अपलोड गर्नुहोस्',
    'Excel (.xlsx) or CSV. Your own column layout is fine — you match the columns up next.':
        'Excel (.xlsx) वा CSV। तपाईंको आफ्नै स्तम्भ ढाँचा ठीक छ — स्तम्भहरू अर्को चरणमा मिलाउनुहुनेछ।',
    'Choose a file, or drag one here': 'फाइल छान्नुहोस्, वा यहाँ ड्र्याग गर्नुहोस्',
    'Nepali text is supported. Phone numbers and existing patient IDs are kept exactly as written.':
        'नेपाली पाठ समर्थित छ। फोन नम्बर र पुराना बिरामी नम्बरहरू लेखिएकै रूपमा राखिन्छन्।',
    'Uploading {percent}%': 'अपलोड हुँदै {percent}%',
    'Choose file': 'फाइल छान्नुहोस्',
    'What happens next': 'अब के हुन्छ',
    'The file is checked row by row before anything is created. You will see how many rows are ready, which have errors and which match patients already in the system — and you decide what to do about each before the import starts.':
        'केही सिर्जना हुनुअघि फाइलको हरेक पङ्क्ति जाँचिन्छ। कति पङ्क्ति तयार छन्, कतिमा त्रुटि छ, र कति प्रणालीमा भइसकेका बिरामीसँग मिल्छन् भन्ने तपाईंले देख्नुहुनेछ — र आयात सुरु हुनुअघि प्रत्येकको बारेमा के गर्ने तपाईंले नै तय गर्नुहुनेछ।',

    # step 2, mapping columns
    'Match the columns to patient fields': 'स्तम्भहरूलाई बिरामी फिल्डसँग मिलाउनुहोस्',
    '{count} columns': '{count} स्तम्भ',
    'Check the file': 'फाइल जाँच गर्नुहोस्',
    'This looks like a file imported before': 'यो फाइल पहिले नै आयात गरिएको जस्तो देखिन्छ',
    'The same file was uploaded on {date} and imported {count} patients. Carrying on is safe — anything already here is flagged as a match rather than duplicated — but check this is what you meant.':
        'यही फाइल {date} मा अपलोड गरिएको थियो र {count} बिरामी आयात भएका थिए। अगाडि बढ्न सुरक्षित छ — यहाँ भइसकेका कुरा नक्कल नभई मिलानको रूपमा देखाइनेछ — तर यो नै तपाईंले चाहनुभएको हो भनेर जाँच गर्नुहोस्।',

    # the job card: title, badge, buttons, alerts
    'Import #{id}': 'आयात #{id}',
    'started by {name}': '{name} द्वारा सुरु गरियो',
    'Stop': 'रोक्नुहोस्',
    'Import {count} patient': '{count} बिरामी आयात गर्नुहोस्',
    'Import {count} patients': '{count} बिरामीहरू आयात गर्नुहोस्',
    'Import a corrected file': 'सुधारिएको फाइल आयात गर्नुहोस्',
    'This import stopped': 'यो आयात रोकियो',
    'Stopping': 'रोकिँदै',
    'The import will stop after the batch it is working on. Patients already created are kept.':
        'आयात हाल काम गरिरहेको ब्याचपछि रोकिनेछ। पहिले नै सिर्जना भएका बिरामीहरू राखिनेछन्।',
    'Checking every row': 'हरेक पङ्क्ति जाँचिँदै',
    'Nothing has been created yet. You can leave this page and come back — the check carries on.':
        'अहिलेसम्म केही सिर्जना भएको छैन। तपाईं यो पृष्ठ छोडेर फर्किन सक्नुहुन्छ — जाँच जारी रहनेछ।',
    'Checking rows': 'पङ्क्ति जाँचिँदै',

    # progress readout
    '{processed} of {total} rows processed': '{total} मध्ये {processed} पङ्क्ति प्रशोधन भयो',
    'started {time}': 'सुरु {time}',
    'finished {time}': 'समाप्त {time}',

    # job/row status labels (JOB_STATUS_LABEL / ROW_STATUS_LABEL, defined in the out-of-scope
    # types.ts but rendered here through t(JOB_STATUS_LABEL[...]) / t(ROW_STATUS_LABEL[...]))
    'Awaiting mapping': 'मिलान पर्खँदै',
    'Ready to import': 'आयात गर्न तयार',
    'Importing': 'आयात हुँदै',
    'Not checked': 'जाँच नभएको',
    'Has an error': 'त्रुटि छ',
    'Matches a patient': 'बिरामीसँग मिल्यो',
    'Repeats a row': 'पङ्क्ति दोहोरियो',
    'Could not save': 'सेभ हुन सकेन',

    # the counter tiles
    'Total rows': 'कुल पङ्क्ति',
    'Ready': 'तयार',
    'With errors': 'त्रुटिसहित',
    'Already exist': 'पहिले नै अवस्थित',
    'Possible match': 'सम्भावित मिलान',
    'Imported': 'आयात भयो',
    'Updated': 'अपडेट भयो',
    'Skipped': 'बेवास्ता गरियो',
    'Failed': 'असफल',

    # report download buttons
    'Rows with problems': 'समस्या भएका पङ्क्तिहरू',
    'Skipped and matched': 'बेवास्ता र मिलान भएका',
    'Imported patients': 'आयात भएका बिरामीहरू',

    # step 4 — duplicates already in the system
    'Patients that already exist': 'पहिले नै अवस्थित बिरामीहरू',
    'No row firmly matches a patient already here by phone, ID, or name and date of birth.':
        'फोन, परिचय नम्बर, वा नाम र जन्म मितिका आधारमा कुनै पङ्क्ति यहाँ भएको बिरामीसँग पक्कै मिलेन।',
    'None of these rows matches a patient already in the system.':
        'यी पङ्क्तिहरूमध्ये कुनै पनि प्रणालीमा भइसकेको बिरामीसँग मिलेन।',
    '{count} row matches a patient already here by phone, ID, or name and date of birth, or repeats an earlier row of this file. Choose what should happen to them.':
        '{count} पङ्क्ति फोन, परिचय नम्बर, वा नाम र जन्म मितिका आधारमा यहाँ भएको बिरामीसँग मिल्छ, वा यही फाइलको अघिल्लो पङ्क्ति दोहोर्याउँछ। तिनीहरूलाई के गर्ने छान्नुहोस्।',
    '{count} rows match a patient already here by phone, ID, or name and date of birth, or repeats an earlier row of this file. Choose what should happen to them.':
        '{count} पङ्क्तिहरू फोन, परिचय नम्बर, वा नाम र जन्म मितिका आधारमा यहाँ भएका बिरामीसँग मिल्छन्, वा यही फाइलका अघिल्ला पङ्क्तिहरू दोहोर्याउँछन्। तिनीहरूलाई के गर्ने छान्नुहोस्।',
    'When a row matches an existing patient': 'पङ्क्ति अवस्थित बिरामीसँग मिलेमा',
    'Skip them': 'तिनलाई बेवास्ता गर्नुहोस्',
    'Leave the existing patient exactly as it is and import nothing for that row.':
        'अवस्थित बिरामीलाई जस्तो छ त्यस्तै राख्नुहोस् र त्यो पङ्क्तिको लागि केही पनि आयात नगर्नुहोस्।',
    'Fill in blanks only': 'खाली ठाउँ मात्र भर्नुहोस्',
    'Add details the existing patient is missing. Nothing already on the record is changed or replaced.':
        'अवस्थित बिरामीमा नभएका विवरण थप्नुहोस्। अभिलेखमा पहिले नै भएको कुनै पनि कुरा परिवर्तन वा प्रतिस्थापन हुँदैन।',
    'Import as new patients': 'नयाँ बिरामीको रूपमा आयात गर्नुहोस्',
    'Create a second record even though one matches. Use only when the old system really held two different people.':
        'मिलान भएता पनि दोस्रो अभिलेख सिर्जना गर्नुहोस्। पुरानो प्रणालीमा साँच्चै दुई फरक व्यक्ति भएको अवस्थामा मात्र प्रयोग गर्नुहोस्।',
    'Records are never merged automatically': 'अभिलेखहरू स्वचालित रूपमा कहिल्यै मर्ज हुँदैनन्',
    'No existing patient is overwritten or merged by an import. To combine two records, use the merge tool on the patient itself.':
        'आयातले कुनै पनि अवस्थित बिरामीलाई ओभरराइट वा मर्ज गर्दैन। दुई अभिलेख मिलाउनको लागि, बिरामीमा नै भएको मर्ज उपकरण प्रयोग गर्नुहोस्।',
    'No matches': 'कुनै मिलान छैन',
    'Nothing in this file matches a patient already in the system.':
        'यो फाइलमा कुनै पनि कुरा प्रणालीमा भइसकेको बिरामीसँग मिलेन।',
    'The possible matches below are the only resemblances found.':
        'तलका सम्भावित मिलानहरू मात्र भेटिएका समानता हुन्।',
    'Every row in this file looks like someone new.': 'यो फाइलको हरेक पङ्क्ति नयाँ व्यक्तिजस्तो देखिन्छ।',

    # step 4b — weak, name-only matches
    'Possible matches': 'सम्भावित मिलानहरू',
    '{count} row shares a name, gender and age with an existing patient but has no phone number or patient ID to confirm it.':
        '{count} पङ्क्तिले अवस्थित बिरामीसँग नाम, लिङ्ग र उमेर मात्र मिल्छ तर पुष्टि गर्न फोन नम्बर वा बिरामी नम्बर छैन।',
    '{count} rows share a name, gender and age with an existing patient but have no phone number or patient ID to confirm it.':
        '{count} पङ्क्तिहरूले अवस्थित बिरामीसँग नाम, लिङ्ग र उमेर मात्र मिल्छन् तर पुष्टि गर्न फोन नम्बर वा बिरामी नम्बर छैन।',
    'When a row only shares a name, gender and age': 'पङ्क्तिले नाम, लिङ्ग र उमेर मात्र मिलाएमा',
    'Treated as new unless you say otherwise': 'तपाईंले नभनेसम्म नयाँको रूपमा लिइनेछ',
    'Two people with the same common name and age are ordinary, so these are imported as new patients by default. Open the matched record if you want to be sure.':
        'उस्तै सामान्य नाम र उमेर भएका दुई व्यक्ति हुनु सामान्य कुरा हो, त्यसैले यिनलाई पूर्वनिर्धारित रूपमा नयाँ बिरामीको रूपमा आयात गरिन्छ। पक्का हुन चाहनुभयो भने मिलान भएको अभिलेख खोल्नुहोस्।',
    'No possible matches': 'कुनै सम्भावित मिलान छैन',
    'Nothing in this file resembles an existing patient.': 'यो फाइलमा कुनै पनि कुरा अवस्थित बिरामीसँग मिल्दैन।',

    # rows that could not be imported, and the final imported summary
    'Rows that could not be imported': 'आयात गर्न नसकिएका पङ्क्तिहरू',
    'Each one names the problem and the column it came from, so the file can be corrected and imported again.':
        'प्रत्येकले समस्या र त्यो आएको स्तम्भ देखाउँछ, जसले गर्दा फाइल सुधार गरी फेरि आयात गर्न सकिन्छ।',
    'Nothing wrong': 'केही गल्ती छैन',
    'Every row in this file could be read.': 'यो फाइलको हरेक पङ्क्ति पढ्न सकियो।',
    'Patients imported': 'बिरामी आयात भए',
    '{count} created.': '{count} सिर्जना भए।',
    '{count} created, {count2} existing records completed.': '{count} सिर्जना भए, {count2} अवस्थित अभिलेख पूरा भए।',
    'Nothing imported': 'केही आयात भएन',
    'No patients were created by this import.': 'यो आयातले कुनै बिरामी सिर्जना गरेन।',

    # import history
    'Previous imports': 'अघिल्ला आयातहरू',
    'Every import this clinic has run, and what came of it.': 'यो क्लिनिकले चलाएका हरेक आयात, र तिनको नतिजा।',
    'Loading history…': 'इतिहास लोड हुँदै…',
    'No patient list has been imported yet.': 'अहिलेसम्म कुनै बिरामी सूची आयात गरिएको छैन।',
    'File': 'फाइल',
    'Started': 'सुरु भयो',
    'By': 'द्वारा',
    'Rows': 'पङ्क्तिहरू',
    'Problems': 'समस्या',
    'retry of import #{id}': 'आयात #{id} को पुनःप्रयास',

    # cancel confirmation and toasts
    'Stop this import?': 'यो आयात रोक्ने हो?',
    'It will stop after the batch it is working on. Patients already created are kept — they are real records now — and the rest of the file is left untouched.':
        'यो हाल काम गरिरहेको ब्याचपछि रोकिनेछ। पहिले नै सिर्जना भएका बिरामीहरू राखिनेछन् — तिनीहरू अब साँचो अभिलेख हुन् — र फाइलको बाँकी भाग अपरिवर्तित रहनेछ।',
    'Stop the import': 'आयात रोक्नुहोस्',
    'That file could not be uploaded.': 'त्यो फाइल अपलोड गर्न सकिएन।',
    'That mapping could not be used.': 'त्यो मिलान प्रयोग गर्न सकिएन।',
    'The import could not be started.': 'आयात सुरु गर्न सकिएन।',
    'The import will stop after the batch it is on.': 'आयात हाल रहेको ब्याचपछि रोकिनेछ।',
    'The import could not be cancelled.': 'आयात रद्द गर्न सकिएन।',
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
