import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # IrdConfigBanner.tsx
    'IRD / e-Billing — {environment}': 'IRD / ई-बिलिङ — {environment}',
    'This system is not IRD-registered or certified. Electronic submission is an integration-ready capability only.':
        'यो प्रणाली IRD मा दर्ता वा प्रमाणित छैन। इलेक्ट्रोनिक पेश गर्ने सुविधा एकीकरणका लागि तयार मात्र हो।',

    # IrdSubmissionDetailPage.tsx
    'Loading submission…': 'पेश लोड हुँदैछ…',
    'Recorded as manually filed': 'म्यानुअल रूपमा फायल भएको रेकर्ड गरियो',
    'Unable to print credit note': 'क्रेडिट नोट प्रिन्ट गर्न सकिएन',
    'IRD submission · {invoiceNumber}': 'IRD पेश · {invoiceNumber}',
    'Print credit note': 'क्रेडिट नोट प्रिन्ट गर्नुहोस्',
    'Credit note filed': 'क्रेडिट नोट फायल भयो',
    'File credit note': 'क्रेडिट नोट फायल गर्नुहोस्',
    'Credit note retry attempted': 'क्रेडिट नोट पुनः प्रयास गरियो',
    'Retry credit note': 'क्रेडिट नोट पुनः प्रयास गर्नुहोस्',
    'Submission attempted': 'पेश गर्ने प्रयास भयो',
    'Submit': 'पेश गर्नुहोस्',
    'Retry attempted': 'पुनः प्रयास भयो',
    'Retry': 'पुनः प्रयास गर्नुहोस्',
    'Mark filed manually': 'म्यानुअल फायल चिन्ह लगाउनुहोस्',
    'Submission failed': 'पेश असफल भयो',
    'Filed manually': 'म्यानुअल रूपमा फायल भयो',
    'Credit note required': 'क्रेडिट नोट आवश्यक छ',
    'This bill was successfully filed with IRD, and the invoice has since been cancelled. IRD still has the original bill on record — file a credit note to reverse it.':
        'यो बिल IRD मा सफलतापूर्वक फायल भइसकेको थियो, र त्यसपछि बिल रद्द गरियो। IRD सँग अझै पनि मूल बिलको रेकर्ड छ — त्यसलाई उल्टाउन क्रेडिट नोट फायल गर्नुहोस्।',
    'Credit note failed': 'क्रेडिट नोट असफल भयो',
    'Attempt log': 'प्रयास लग',
    'Every submission, retry and manual action is recorded.': 'हरेक पेश, पुनः प्रयास र म्यानुअल कार्य दर्ता गरिन्छ।',
    'No attempts yet.': 'अहिलेसम्म कुनै प्रयास भएको छैन।',
    'Record manual IRD filing': 'म्यानुअल IRD फायलिङ दर्ता गर्नुहोस्',
    'Use when the bill was filed directly on the IRD portal.': 'बिल सिधै IRD पोर्टलमा फायल गरिएको भए प्रयोग गर्नुहोस्।',
    'Record': 'दर्ता गर्नुहोस्',
    'IRD reference / bill number': 'IRD सन्दर्भ / बिल नम्बर',
    'Submission cancelled': 'पेश रद्द भयो',
    'Cancel this IRD submission?': 'यो IRD पेश रद्द गर्ने?',
    'This only updates internal tracking. Any IRD-side cancellation must be handled per IRD procedure.':
        'यसले केवल आन्तरिक ट्र्याकिङ मात्र अपडेट गर्छ। IRD तर्फको कुनै पनि रद्दीकरण IRD प्रक्रियाअनुसार नै गर्नुपर्छ।',
    'Cancel submission': 'पेश रद्द गर्नुहोस्',
    'Filed for {link}': '{link} का लागि पेश गरिएको',

    # IrdSubmissionsPage.tsx
    'No failed submissions were eligible for retry right now.': 'अहिले पुनः प्रयासका लागि योग्य कुनै असफल पेश छैन।',
    'Retried {retried} failed submission.': '{retried} असफल पेश पुनः प्रयास गरियो।',
    'Retried {retried} failed submissions.': '{retried} असफल पेशहरू पुनः प्रयास गरियो।',
    'Unable to run the retry sweep': 'पुनः प्रयास चलाउन सकिएन',
    'Attempts': 'प्रयासहरू',
    'Updated': 'अपडेट भएको',
    'Manual': 'म्यानुअल',
    'Track electronic submission of issued invoices to IRD / CBMS.': 'जारी बिलहरूको IRD / CBMS मा इलेक्ट्रोनिक पेश ट्र्याक गर्नुहोस्।',
    'Retry failed now': 'अहिले नै असफलहरू पुनः प्रयास गर्नुहोस्',
    'Search invoice no. or patient': 'बिल नम्बर वा बिरामी खोज्नुहोस्',
    'A tracking record is created when an invoice is issued.': 'बिल जारी हुँदा ट्र्याकिङ रेकर्ड बनाइन्छ।',

    # ird/types.ts status labels, referenced by t(IRD_STATUS_LABEL[...]) / t(CREDIT_NOTE_STATUS_LABEL[...])
    'Not submitted': 'पेश नभएको',
    'In progress': 'प्रक्रियामा',
    'Submitted': 'पेश भयो',
    'Accepted': 'स्वीकृत भयो',
    'Failed': 'असफल',
    'Duplicate': 'दोहोरो',
    'Credit note needed': 'क्रेडिट नोट चाहिन्छ',

    # NotificationsPage.tsx
    'Operational alerts — critical results, failed submissions, stock and backlog.':
        'सञ्चालन सम्बन्धी सूचना — गम्भीर नतिजा, असफल पेश, स्टक र बाँकी काम।',
    'All marked read': 'सबैलाई पढिएको चिन्ह लगाइयो',
    'Unread only': 'नपढिएको मात्र',
    'No notifications': 'कुनै सूचना छैन',
    "You're all caught up.": 'तपाईं सबै हेर्नुभयो।',

    # PayOnlineModal.tsx
    'Gateway did not return a way to continue checkout': 'गेटवेले चेकआउट जारी राख्ने तरिका फिर्ता गरेन',
    'Unable to start checkout': 'चेकआउट सुरु गर्न सकिएन',
    'Pay online': 'अनलाइन भुक्तानी गर्नुहोस्',
    'Continue to {gateway}': '{gateway} मा जारी राख्नुहोस्',
    'gateway': 'गेटवे',
    'Outstanding balance': 'बाँकी रकम',
    'Loading available gateways…': 'उपलब्ध गेटवे लोड हुँदैछ…',
    'No payment gateway configured': 'कुनै भुक्तानी गेटवे कन्फिगर गरिएको छैन',
    'Neither eSewa nor Khalti is configured on this server. Ask an administrator to set up online payments, or collect payment manually.':
        'यस सर्भरमा eSewa वा Khalti कन्फिगर गरिएको छैन। अनलाइन भुक्तानी मिलाउन प्रशासकलाई भन्नुहोस्, वा म्यानुअल रूपमा भुक्तानी लिनुहोस्।',

    # BackupsPage.tsx
    'Backup completed — {tables} tables, {rows} rows': 'ब्याकअप सम्पन्न — {tables} टेबल, {rows} पङ्क्ति',
    'Backup failed: {reason}': 'ब्याकअप असफल: {reason}',
    'unknown error': 'अज्ञात त्रुटि',
    'Unable to run backup': 'ब्याकअप चलाउन सकिएन',
    'Started': 'सुरु भएको',
    'Completed': 'सम्पन्न भएको',
    'Tables': 'टेबलहरू',
    'Rows': 'पङ्क्तिहरू',
    'Size': 'साइज',
    'Triggered by': 'सुरु गर्ने',
    'Scheduled': 'तालिकाबद्ध',
    'Download backup {id}': 'ब्याकअप {id} डाउनलोड गर्नुहोस्',
    "Database backup history — mandatory per the e-invoice procedure (every fiscal year's database and log must be backed up). Runs automatically overnight; old files are kept until you remove them from the server's disk. Each file holds data only, not the schema — restoring means letting the app recreate the schema (its migrations) on a fresh database first, then loading this file into it.":
        'डाटाबेस ब्याकअप इतिहास — e-invoice प्रक्रियाअनुसार अनिवार्य (हरेक आर्थिक वर्षको डाटाबेस र लग ब्याकअप हुनैपर्छ)। यो हरेक राती स्वचालित रूपमा चल्छ; पुराना फाइलहरू तपाईंले सर्भरबाट नहटाउँदासम्म राखिन्छ। हरेक फाइलमा डाटा मात्र हुन्छ, स्किमा होइन — रिस्टोर गर्नु भनेको पहिले नयाँ डाटाबेसमा सफ्टवेयरलाई आफ्नो स्किमा (माइग्रेसन) बनाउन दिने, त्यसपछि यो फाइल त्यसमा लोड गर्ने हो।',
    'Run backup now': 'अहिले नै ब्याकअप चलाउनुहोस्',
    'Backup in progress': 'ब्याकअप प्रक्रियामा',
    'This runs synchronously and can take a while on a large database — the page will update when it finishes.':
        'यो सिंक्रोनस रूपमा चल्छ र ठूलो डाटाबेसमा समय लाग्न सक्छ — सकिएपछि पृष्ठ आफै अपडेट हुनेछ।',
    'No backups yet': 'अहिलेसम्म कुनै ब्याकअप छैन',
    'A backup runs automatically overnight, or trigger one now.': 'ब्याकअप राती स्वचालित रूपमा चल्छ, वा अहिले नै एक चलाउनुहोस्।',

    # AnalyticsPage.tsx / RevenueTrendChart.tsx
    'No data for this period.': 'यो अवधिको लागि डाटा छैन।',
    'Revenue, workload and referral trends.': 'आम्दानी, कामको चाप र रेफरलको प्रवृत्ति।',
    'Revenue collected': 'सङ्कलन भएको आम्दानी',
    'Tests by department': 'विभागअनुसार परीक्षण',
    'Most ordered tests': 'सबैभन्दा धेरै अर्डर भएका परीक्षण',
    'Top referring doctors': 'सबैभन्दा धेरै रेफर गर्ने डाक्टर',
    'Last 7 days': 'पछिल्लो 7 दिन',
    'Last 30 days': 'पछिल्लो 30 दिन',
    'Last 90 days': 'पछिल्लो 90 दिन',
    'Total collected': 'जम्मा सङ्कलन',
    'Revenue collected per day': 'दैनिक सङ्कलन भएको आम्दानी',

    # HelpPage.tsx — section titles
    'Getting started': 'सुरुवात',
    'Patient registration': 'बिरामी दर्ता',
    'Sample collection & receiving': 'नमूना सङ्कलन र प्राप्ति',
    'Results — entry, verification, authorization': 'नतिजा — प्रविष्टि, प्रमाणीकरण, स्वीकृति',
    'Billing & invoices': 'बिलिङ र बिलहरू',
    'IRD e-billing (CBMS)': 'IRD ई-बिलिङ (CBMS)',
    'Platform administration': 'प्लेटफर्म प्रशासन',
    'Inventory & purchasing': 'सामग्री भण्डार र खरिद',
    'Multi-branch': 'बहु-शाखा',
    'Roles, permissions & audit': 'भूमिका, अनुमति र अडिट',
    "A guide to how LIMS's workflow fits together, screen by screen.": 'LIMS को कार्यप्रणाली स्क्रिन-स्क्रिन गरी कसरी मिल्छ भन्ने गाइड।',

    # HelpPage.tsx — "Getting started" and "Patient registration" body prose (fully translated;
    # the other 11 sections' prose is left in English — see the comment in HelpPage.tsx)
    'role': 'भूमिका',
    "LIMS organizes work around the lab's real pipeline: a patient is registered, a doctor or the patient orders tests, a sample is collected and received, results are entered and verified, a report is generated and released, and the visit is billed. Each stage has its own screen, and an order's detail page ties every stage together with a single status stepper and a \"Next step\" button that advances it.":
        'LIMS ले प्रयोगशालाको वास्तविक प्रक्रियाअनुसार काम मिलाउँछ: बिरामी दर्ता हुन्छ, डाक्टर वा बिरामीले परीक्षण अर्डर गर्छ, नमूना सङ्कलन र प्राप्त हुन्छ, नतिजा प्रविष्ट र प्रमाणित हुन्छ, रिपोर्ट तयार र जारी हुन्छ, र भ्रमणको बिल बनाइन्छ। हरेक चरणको आफ्नै स्क्रिन छ, र अर्डरको विवरण पृष्ठमा एउटै स्थिति स्टेपर र "Next step" बटनले सबै चरणलाई अघि बढाउँछ।',
    "What you can see and do is controlled by your {role} (Receptionist, Sample Collection Staff, Lab Technician, Pathologist, Accountant, Doctor, Lab Administrator, or Super Admin). Your dashboard after signing in is tailored to your role — a receptionist sees draft orders and outstanding invoices; a pathologist sees results awaiting authorization and critical results. If a button or page you expect isn't visible, you likely need a different permission — ask your lab administrator.":
        'तपाईं के देख्न र गर्न सक्नुहुन्छ भन्ने कुरा तपाईंको {role} ले निर्धारण गर्छ (Receptionist, Sample Collection Staff, Lab Technician, Pathologist, Accountant, Doctor, Lab Administrator, वा Super Admin)। साइन इन गरेपछि तपाईंको ड्यासबोर्ड तपाईंको भूमिकाअनुसार हुन्छ — रिसेप्सनिस्टले मस्यौदा अर्डर र भुक्तानी बाँकी बिलहरू देख्छ; प्याथोलोजिस्टले स्वीकृतिका लागि बाँकी नतिजा र गम्भीर नतिजा देख्छ। कुनै बटन वा पृष्ठ देखिएन भने, तपाईंलाई फरक अनुमति चाहिन्छ हुन सक्छ — आफ्नो प्रयोगशाला प्रशासकलाई सोध्नुहोस्।',
    "Two more roles sit above all of this: {superAdmin} has full access to everything, including a clinic's own patient data, and has historically doubled as this deployment's own \"primary\" clinic admin. {platformAdmin} is narrower and deliberately has no access to any clinic's patients, orders, results, or billing — it can only onboard/manage clinics, plans, the master test catalogue, and this deployment's own subscription billing (see {platformAdministration}). Give the Platform Admin role to someone who should never see clinical data at all.":
        'यसभन्दा माथि दुई थप भूमिका छन्: {superAdmin} लाई सबैथोकमा, क्लिनिकको आफ्नै बिरामी डाटा सहित, पूर्ण पहुँच हुन्छ, र यो ऐतिहासिक रूपमा यस डिप्लोइमेन्टको आफ्नै "मुख्य" क्लिनिक एडमिनको रूपमा पनि प्रयोग हुँदै आएको छ। {platformAdmin} साँघुरो हो र जानाजानी कुनै पनि क्लिनिकको बिरामी, अर्डर, नतिजा वा बिलिङमा पहुँच राख्दैन — यसले क्लिनिक, योजना, मुख्य परीक्षण सूची, र यस डिप्लोइमेन्टको आफ्नै सदस्यता बिलिङ मात्र व्यवस्थापन गर्न सक्छ ({platformAdministration} हेर्नुहोस्)। क्लिनिकल डाटा कहिल्यै नदेख्नुपर्ने व्यक्तिलाई मात्र Platform Admin भूमिका दिनुहोस्।',
    '{patientsNewPatient} registers a patient with demographics, address, and an optional referring doctor. Each patient gets a sequential MRN (e.g. P000123). Marking a patient {confidential} restricts who can view their record; marking a patient {vip} is a visual flag only.':
        '{patientsNewPatient} ले जनसांख्यिकी, ठेगाना, र वैकल्पिक रेफर गर्ने डाक्टरसहित बिरामी दर्ता गर्छ। हरेक बिरामीलाई क्रमिक MRN (जस्तै P000123) दिइन्छ। बिरामीलाई {confidential} चिन्ह लगाउँदा रेकर्ड कसले हेर्न सक्ने सीमित हुन्छ; {vip} चिन्ह लगाउनु भने केवल देखाउने चिन्ह मात्र हो।',
    'Patients are shared across branches — a patient registered at one branch is visible at all of them.':
        'बिरामीहरू सबै शाखामा साझा हुन्छन् — एक शाखामा दर्ता भएको बिरामी सबै शाखामा देखिन्छ।',
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
