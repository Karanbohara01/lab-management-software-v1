import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- features/admin/AuditPage.tsx ----------------------------------------------------
    'Every sensitive operation, who performed it and what changed.': 'हरेक संवेदनशील कार्य, कसले गरेको र के परिवर्तन भयो।',
    'Export Excel': 'Excel निर्यात',
    'Export XML': 'XML निर्यात',
    'Export failed': 'निर्यात असफल भयो',
    'Search summary': 'सारांश खोज्नुहोस्',
    'All modules': 'सबै मोड्युल',
    'Actor': 'कर्ता',
    'From date': 'सुरु मिति',
    'To date': 'अन्त्य मिति',
    'When': 'समय',
    'Module': 'मोड्युल',
    'Action': 'कार्य',
    'Summary': 'सारांश',
    'No entries': 'कुनै प्रविष्टि छैन',
    'No audit entries match these filters.': 'यी फिल्टरसँग मिल्ने अडिट प्रविष्टि भेटिएन।',
    'Audit entry': 'अडिट प्रविष्टि',
    'Module / action': 'मोड्युल / कार्य',
    'Entity': 'वस्तु',
    'IP': 'IP',
    'Before': 'पहिले',
    'After': 'पछि',

    # ---- features/admin/ControlCenterPage.tsx --------------------------------------------
    'Active tests': 'सक्रिय परीक्षणहरू',
    'Accounts, roles, enable/disable, reset password': 'खाता, भूमिका, सक्रिय/निष्क्रिय, पासवर्ड रिसेट',
    'Review permissions granted per role': 'प्रत्येक भूमिकालाई दिइएका अनुमतिहरू हेर्नुहोस्',
    'Locations, contact details, active status': 'स्थान, सम्पर्क विवरण, सक्रिय स्थिति',
    'Lab departments backing the test catalog': 'परीक्षण सूचीलाई समर्थन गर्ने प्रयोगशाला विभागहरू',
    'Analytes, profiles, reference ranges': 'एनालाइट, प्रोफाइल, सन्दर्भ दायरा',
    'Stock, suppliers, purchase orders': 'मौज्दात, आपूर्तिकर्ता, खरिद आदेश',
    'Every change, before/after, who and when': 'हरेक परिवर्तन, पहिले/पछि, कसले र कहिले',
    'Letterhead, fiscal year, tax, branding': 'लेटरहेड, आर्थिक वर्ष, कर, ब्रान्डिङ',
    'Run and download database backups': 'डाटाबेस ब्याकअप चलाउनुहोस् र डाउनलोड गर्नुहोस्',
    '{labName} · FY {fiscalYear}': '{labName} · आ.व. {fiscalYear}',
    'Integrations': 'एकीकरण',
    "Every external service this system can talk to, and whether it's actually wired in.": 'यो प्रणालीले सम्पर्क गर्न सक्ने हरेक बाह्य सेवा, र त्यो वास्तवमै जोडिएको छ वा छैन।',
    'IRD / CBMS e-billing': 'IRD / CBMS ई-बिलिङ',
    '{name} online payment': '{name} अनलाइन भुक्तानी',
    'SMS report delivery': 'SMS रिपोर्ट प्राप्ति',
    'WhatsApp report delivery': 'WhatsApp रिपोर्ट प्राप्ति',
    'Configured': 'कन्फिगर गरिएको',
    'Not configured': 'कन्फिगर नगरिएको',
    'Mandatory retention per the e-invoice procedure.': 'ई-बिल प्रक्रिया अनुसार अनिवार्य संरक्षण।',
    'Last backup': 'अन्तिम ब्याकअप',
    'No backups yet': 'अहिलेसम्म कुनै ब्याकअप छैन',
    'Open backups': 'ब्याकअप खोल्नुहोस्',
    'Administration': 'प्रशासन',
    'Everything a super admin manages, in one place.': 'सुपर एड्मिनले व्यवस्थापन गर्ने सबै कुरा एकै ठाउँमा।',
    'Loading system status…': 'प्रणाली स्थिति लोड हुँदैछ…',

    # ---- features/admin/RolesPage.tsx -----------------------------------------------------
    'The permission set for each role. Permissions are enforced on the backend for every request.':
        'हरेक भूमिकाको अनुमति सेट। अनुमतिहरू हरेक अनुरोधमा ब्याकएन्डमा लागू हुन्छन्।',
    '{count} permissions': '{count} अनुमति',

    # ---- features/admin/UsersPage.tsx ------------------------------------------------------
    'User disabled': 'प्रयोगकर्ता निष्क्रिय गरियो',
    'User enabled': 'प्रयोगकर्ता सक्रिय गरियो',
    'User updated': 'प्रयोगकर्ता अपडेट भयो',
    'User created': 'प्रयोगकर्ता सिर्जना भयो',
    'Unable to save user': 'प्रयोगकर्ता सुरक्षित गर्न सकिएन',
    'Password reset for {username}': '{username} को पासवर्ड रिसेट भयो',
    'Unable to reset password': 'पासवर्ड रिसेट गर्न सकिएन',
    'User': 'प्रयोगकर्ता',
    'Home branch': 'गृह शाखा',
    'Last login': 'पछिल्लो लगइन',
    'All branches': 'सबै शाखा',
    'Never': 'कहिल्यै होइन',
    'Disabled': 'निष्क्रिय',
    'Reset password': 'पासवर्ड रिसेट गर्नुहोस्',
    'Reset password for {username}': '{username} को लागि पासवर्ड रिसेट गर्नुहोस्',
    'Disable': 'निष्क्रिय गर्नुहोस्',
    'Enable': 'सक्रिय गर्नुहोस्',
    'Staff accounts and role assignments.': 'कर्मचारी खाता र भूमिका तोकिएका विवरण।',
    'New user': 'नयाँ प्रयोगकर्ता',
    'Search name, username or email': 'नाम, प्रयोगकर्ता नाम वा इमेलबाट खोज्नुहोस्',
    'No users': 'प्रयोगकर्ता छैनन्',
    'Adjust the search.': 'खोज बदल्नुहोस्।',
    'Edit user': 'प्रयोगकर्ता सम्पादन',
    'Create user': 'प्रयोगकर्ता सिर्जना गर्नुहोस्',
    'Initial password': 'सुरुवाती पासवर्ड',
    'At least 8 characters': 'कम्तीमा ८ अक्षर',
    'Leave blank for access to every branch (HQ / roaming staff).': 'सबै शाखामा पहुँचका लागि खाली राख्नुहोस् (HQ / घुम्ती कर्मचारी)।',
    'Required for the DOCTOR role — this login will only ever see orders and reports this doctor referred.':
        'DOCTOR भूमिकाका लागि अनिवार्य — यो लगइनले यही डाक्टरले रेफर गरेका अर्डर र रिपोर्ट मात्र देखाउँछ।',
    'Reset password · {username}': 'पासवर्ड रिसेट · {username}',
    'New password': 'नयाँ पासवर्ड',
    'Share the new password with the user through a secure channel.': 'नयाँ पासवर्ड प्रयोगकर्तालाई सुरक्षित माध्यमबाट पठाउनुहोस्।',

    # ---- features/settings/*CredentialsCard.tsx --------------------------------------------
    'Unable to save': 'सुरक्षित गर्न सकिएन',
    "Your own CBMS taxpayer login, if you're IRD-registered — otherwise this deployment's shared default (if any) is used.":
        'तपाईं IRD-दर्ता भएमा आफ्नै CBMS करदाता लगइन प्रयोग गर्नुहोस् — नभए यो डिप्लोइमेन्टको साझा डिफल्ट (यदि छ भने) प्रयोग हुन्छ।',
    'Use my own IRD credentials': 'आफ्नै IRD प्रवेश विवरण प्रयोग गर्नुहोस्',
    'IRD username': 'IRD प्रयोगकर्ता नाम',
    'Seller PAN': 'बिक्रेता PAN',
    'IRD password': 'IRD पासवर्ड',
    '•••••••• (leave blank to keep)': '•••••••• (अपरिवर्तित राख्न खाली छाड्नुहोस्)',
    'You have read-only access to settings.': 'तपाईंसँग सेटिङमा हेर्ने मात्र अनुमति छ।',
    'Save IRD settings': 'IRD सेटिङ सुरक्षित गर्नुहोस्',
    'IRD credentials saved': 'IRD प्रवेश विवरण सुरक्षित भयो',
    'Payment gateways': 'भुक्तानी गेटवे',
    "Your own eSewa/Khalti merchant credentials, if you have one — otherwise this deployment's shared default is used.":
        'तपाईंसँग भए आफ्नै eSewa/Khalti मर्चेन्ट प्रवेश विवरण प्रयोग गर्नुहोस् — नभए यो डिप्लोइमेन्टको साझा डिफल्ट प्रयोग हुन्छ।',
    'Use my own eSewa merchant account': 'आफ्नै eSewa मर्चेन्ट खाता प्रयोग गर्नुहोस्',
    'Use my own Khalti merchant account': 'आफ्नै Khalti मर्चेन्ट खाता प्रयोग गर्नुहोस्',
    'Use my own Fonepay merchant account': 'आफ्नै Fonepay मर्चेन्ट खाता प्रयोग गर्नुहोस्',
    'Merchant code': 'मर्चेन्ट कोड',
    'Secret key': 'गोप्य कुञ्जी',
    "Fonepay checkout isn't wired up yet — credentials are saved for when it is, but no payment can be taken through Fonepay from this system today.":
        'Fonepay चेकआउट अहिलेसम्म जोडिएको छैन — पछि प्रयोगका लागि प्रवेश विवरण सुरक्षित गरिन्छ, तर अहिले यो प्रणालीबाट Fonepay मार्फत भुक्तानी लिन सकिँदैन।',
    'Save payment settings': 'भुक्तानी सेटिङ सुरक्षित गर्नुहोस्',
    'Payment gateway settings saved': 'भुक्तानी गेटवे सेटिङ सुरक्षित भयो',
    'SMS delivery': 'SMS पठाउने सेवा',
    "Your own Sparrow SMS account for texting report links — otherwise this deployment's shared default (if any) is used.":
        'रिपोर्ट लिंक SMS मार्फत पठाउन आफ्नै Sparrow SMS खाता प्रयोग गर्नुहोस् — नभए यो डिप्लोइमेन्टको साझा डिफल्ट (यदि छ भने) प्रयोग हुन्छ।',
    'Use my own Sparrow SMS account': 'आफ्नै Sparrow SMS खाता प्रयोग गर्नुहोस्',
    'Sender identity': 'प्रेषक पहिचान',
    'API token': 'API टोकन',
    'Save SMS settings': 'SMS सेटिङ सुरक्षित गर्नुहोस्',
    'SMS settings saved': 'SMS सेटिङ सुरक्षित भयो',
    'WhatsApp delivery': 'WhatsApp पठाउने सेवा',
    "Your own WhatsApp Business Cloud API account for messaging report links — otherwise this deployment's shared default (if any) is used.":
        'रिपोर्ट लिंक पठाउन आफ्नै WhatsApp Business Cloud API खाता प्रयोग गर्नुहोस् — नभए यो डिप्लोइमेन्टको साझा डिफल्ट (यदि छ भने) प्रयोग हुन्छ।',
    'Use my own WhatsApp Business account': 'आफ्नै WhatsApp Business खाता प्रयोग गर्नुहोस्',
    'Phone number id': 'फोन नम्बर ID',
    'Access token': 'एक्सेस टोकन',
    'Save WhatsApp settings': 'WhatsApp सेटिङ सुरक्षित गर्नुहोस्',
    'WhatsApp settings saved': 'WhatsApp सेटिङ सुरक्षित भयो',

    # ---- features/settings/LaboratorySettingsPage.tsx --------------------------------------
    'Logo must be under 400 KB.': 'लोगो ४०० KB भन्दा सानो हुनुपर्छ।',
    'Laboratory profile saved': 'प्रयोगशाला प्रोफाइल सुरक्षित भयो',
    'Laboratory profile': 'प्रयोगशाला प्रोफाइल',
    'Identity and letterhead used on generated reports.': 'तयार हुने रिपोर्टमा प्रयोग हुने परिचय र लेटरहेड।',
    'Save profile': 'प्रोफाइल सुरक्षित गर्नुहोस्',
    'Report letterhead': 'रिपोर्ट लेटरहेड',
    'Laboratory name': 'प्रयोगशालाको नाम',
    'PAN / VAT number': 'PAN / VAT नम्बर',
    'Accreditation number': 'मान्यता नम्बर',
    'e.g. NABL / ISO 15189 certificate no.': 'जस्तै: NABL / ISO 15189 प्रमाणपत्र नं.',
    'Report footer / disclaimer': 'रिपोर्ट फुटर / अस्वीकरण',
    'Fiscal year': 'आर्थिक वर्ष',
    "Computed automatically from today's Bikram Sambat date": 'आजको विक्रम सम्बत मितिबाट स्वचालित रूपमा गणना गरिएको',
    'Invoice prefix': 'बिल प्रिफिक्स',
    'Default tax rate %': 'डिफल्ट कर दर %',
    'Expiry alert (days)': 'म्याद सूचना (दिन)',
    'Flag stock expiring within this many days': 'यति दिनभित्र म्याद सकिने मौज्दातलाई चिन्ह लगाउनुहोस्',
    'Invoice numbers are issued per fiscal year as {code}. The fiscal year rolls over automatically at the Shrawan 1 boundary — nothing to change by hand.':
        'बिल नम्बर प्रत्येक आर्थिक वर्षअनुसार {code} को रूपमा जारी हुन्छ। आर्थिक वर्ष श्रावण १ मा स्वचालित रूपमा बदलिन्छ — हातैले केही बदल्न आवश्यक छैन।',
    'Require payment before sample collection': 'नमूना सङ्कलनअघि भुक्तानी आवश्यक पार्नुहोस्',
    'Self-pay patients must have their order paid in full before a sample can be collected — collectors can still override with a documented reason. Insurance / SSF / corporate patients are always exempt (billed on account).':
        'आफैं भुक्तानी गर्ने बिरामीको अर्डर पूरै तिरेपछि मात्र नमूना सङ्कलन गर्न मिल्छ — सङ्कलन गर्नेले कारण लेखी अपवाद दिन सक्छ। बीमा / SSF / कर्पोरेट बिरामीलाई सधैं छुट हुन्छ (खातामा बिल गरिन्छ)।',
    'Print & letterhead': 'प्रिन्ट र लेटरहेड',
    "Turn off if you print on pre-printed letterhead stationery — the logo/name/address block above won't repeat digitally, but everything below it (bill number, patient details, line items) still prints.":
        'पहिले नै लेटरहेड छापिएको कागजमा प्रिन्ट गर्ने भए यो बन्द गर्नुहोस् — माथिको लोगो/नाम/ठेगाना डिजिटल रूपमा दोहोरिने छैन, तर तलका सबै (बिल नम्बर, बिरामी विवरण, लाइन आइटम) झैं प्रिन्ट हुन्छ।',
    'Print letterhead on reports': 'रिपोर्टमा लेटरहेड प्रिन्ट गर्नुहोस्',
    'Print letterhead on invoices': 'बिलमा लेटरहेड प्रिन्ट गर्नुहोस्',
    'Logo': 'लोगो',
    'No logo': 'लोगो छैन',
    'Current logo': 'हालको लोगो',
    'Upload': 'अपलोड गर्नुहोस्',
    'PNG, JPEG or SVG, under 400 KB. Shown on generated report letterheads.': 'PNG, JPEG वा SVG, ४०० KB भन्दा सानो। तयार हुने रिपोर्ट लेटरहेडमा देखिन्छ।',
    'Letterhead preview': 'लेटरहेड पूर्वावलोकन',
    'PAN: {pan}': 'PAN: {pan}',
    'Accreditation: {value}': 'मान्यता: {value}',
    'Subscription & billing': 'सदस्यता र बिलिङ',
    'View invoices and pay online.': 'बिल हेर्नुहोस् र अनलाइन तिर्नुहोस्।',
    'View subscription & billing': 'सदस्यता र बिलिङ हेर्नुहोस्',

    # ---- features/settings/billing/SubscriptionBillingPage.tsx -----------------------------
    'Trial': 'ट्रायल',
    'Past due': 'म्याद नाघेको',
    'Suspended': 'स्थगित',
    'Scheduled plan change cancelled.': 'तालिकाबद्ध योजना परिवर्तन रद्द गरियो।',
    'Plan change scheduled — it takes effect at the start of your next billing period.':
        'योजना परिवर्तन तालिकाबद्ध गरियो — यो तपाईंको अर्को बिलिङ अवधिको सुरुदेखि लागू हुनेछ।',
    'Unable to change plan': 'योजना परिवर्तन गर्न सकिएन',
    'Plan': 'योजना',
    'Changing plans takes effect at the start of your next billing period — no mid-period charge or credit.':
        'योजना परिवर्तन तपाईंको अर्को बिलिङ अवधिको सुरुदेखि लागू हुन्छ — अवधिको बीचमा कुनै शुल्क वा फिर्ता हुँदैन।',
    '{plan} · NPR {price}/mo': '{plan} · NPR {price}/महिना',
    'Up to {maxUsers} users, {maxBranches} branch(es)': '{maxUsers} प्रयोगकर्तासम्म, {maxBranches} शाखा(हरू)',
    'renews {date}': '{date} मा रिन्यु हुन्छ',
    'Switching to {plan} at the start of your next billing period.': 'अर्को बिलिङ अवधिको सुरुदेखि {plan} मा परिवर्तन हुनेछ।',
    'NPR {price}/mo · up to {maxUsers} users': 'NPR {price}/महिना · {maxUsers} प्रयोगकर्तासम्म',
    'Current plan': 'हालको योजना',
    'Switch to this plan': 'यो योजनामा सर्नुहोस्',
    'You have read-only access to billing.': 'तपाईंसँग बिलिङमा हेर्ने मात्र अनुमति छ।',
    "Invoices for this clinic's own LIMS subscription.": 'यो क्लिनिकको आफ्नै LIMS सदस्यताका बिलहरू।',
    'Confirming your payment…': 'भुक्तानी पुष्टि गर्दै…',
    'No invoices yet': 'अहिलेसम्म कुनै बिल छैन',
    'Your first subscription invoice will appear here once issued.': 'जारी भएपछि तपाईंको पहिलो सदस्यता बिल यहाँ देखिनेछ।',
    '{start} – {end} · due {due} · NPR {amount}': '{start} – {end} · {due} सम्म तिर्नुपर्ने · NPR {amount}',
    'Paid {date}': '{date} मा तिरिएको',
    'Pay now': 'अहिले तिर्नुहोस्',
    'Payment confirmed for {invoiceNumber}': '{invoiceNumber} को भुक्तानी पुष्टि भयो',
    'Payment could not be confirmed. If you completed checkout, it may take a moment — refresh shortly.':
        'भुक्तानी पुष्टि हुन सकेन। चेकआउट पूरा गर्नुभएको हो भने, केही समय लाग्न सक्छ — छिट्टै ताजा गर्नुहोस्।',
    'Unable to verify payment': 'भुक्तानी प्रमाणित गर्न सकिएन',
    'Unable to start checkout': 'चेकआउट सुरु गर्न सकिएन',
    'Payment due': 'भुक्तानी बाँकी',
    'Overdue': 'म्याद नाघेको',

    # ---- features/qc/LeveyJenningsChart.tsx ------------------------------------------------
    'Levey-Jennings chart': 'Levey-Jennings चार्ट',

    # ---- features/qc/QcMaterialModal.tsx ---------------------------------------------------
    'QC material saved': 'QC सामग्री सुरक्षित भयो',
    'Edit {name}': '{name} सम्पादन',
    'New QC material': 'नयाँ QC सामग्री',
    'Material name': 'सामग्रीको नाम',
    'Select…': 'छान्नुहोस्…',
    'Manufacturer': 'उत्पादक',
    'Lot number': 'लट नम्बर',
    'Level': 'स्तर',
    'Expiry': 'म्याद सकिने मिति',
    'Assigned targets': 'तोकिएका लक्ष्यहरू',
    'Select a test to load its numeric parameters.': 'यसका सङ्ख्यात्मक प्यारामिटर लोड गर्न परीक्षण छान्नुहोस्।',
    'Mean': 'औसत',
    'SD': 'SD',

    # ---- features/qc/QcPage.tsx -------------------------------------------------------------
    'QC REJECTED — {rules}': 'QC अस्वीकृत — {rules}',
    'QC warning — {rules}': 'QC चेतावनी — {rules}',
    'QC in control': 'QC नियन्त्रणमा छ',
    'Unable to record QC': 'QC रेकर्ड गर्न सकिएन',
    'Run accepted': 'रन स्वीकृत भयो',
    'Failed': 'असफल भयो',
    'Loading QC…': 'QC लोड हुँदैछ…',
    'QC materials, Westgard-rule evaluation and Levey-Jennings charts.': 'QC सामग्री, Westgard-नियम मूल्याङ्कन र Levey-Jennings चार्टहरू।',
    'New material': 'नयाँ सामग्री',
    'Materials': 'सामग्रीहरू',
    'No QC materials yet.': 'अहिलेसम्म कुनै QC सामग्री छैन।',
    'Analyzer': 'एनालाइजर',
    'Shift': 'शिफ्ट',
    'Record QC': 'QC रेकर्ड गर्नुहोस्',
    'Levey-Jennings': 'Levey-Jennings',
    'Recent QC runs': 'पछिल्लो QC रनहरू',
    'z': 'z',
    '(accepted)': '(स्वीकृत)',
    'Accept': 'स्वीकार गर्नुहोस्',
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
