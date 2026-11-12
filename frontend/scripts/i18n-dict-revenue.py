import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- RevenueDashboardPage.tsx -------------------------------------------------------
    'Billed, collected and outstanding — aggregated from invoices, payments and refunds.':
        'बिल, असुली र बाँकी रकम — बिल, भुक्तानी र फिर्ताबाट निकालिएको।',
    'Print revenue report': 'आम्दानी रिपोर्ट प्रिन्ट गर्नुहोस्',
    'Showing': 'देखाइँदै',
    '{count} day': '{count} दिन',
    '{count} days': '{count} दिन',
    'days as they fall in': 'दिन गणना हुने समय क्षेत्र',
    'Totalling the period…': 'अवधिको जोड गर्दै…',
    '{count} invoice issued in this period has since been cancelled, for {amount}. Billed at the time was {billedAmount}; the figures above exclude the cancelled invoice.':
        'यो अवधिमा जारी गरिएको {count} बिल पछि रद्द गरियो, जसको रकम {amount} थियो। जारी हुँदाको बिल रकम {billedAmount} थियो; माथिका तथ्याङ्कले रद्द भएको बिल समावेश गर्दैन।',
    '{count} invoices issued in this period have since been cancelled, for {amount}. Billed at the time was {billedAmount}; the figures above exclude the cancelled invoices.':
        'यो अवधिमा जारी गरिएका {count} बिलहरू पछि रद्द गरियो, जसको रकम {amount} थियो। जारी हुँदाको बिल रकम {billedAmount} थियो; माथिका तथ्याङ्कले रद्द भएका बिलहरू समावेश गर्दैन।',
    'Billed against collected': 'बिल बनाम असुली',
    'Bars are what was invoiced; the line is cash received. They are not meant to match.':
        'बारले बिल गरिएको रकम देखाउँछ; लाइनले प्राप्त नगद देखाउँछ। यी दुई मिल्नुपर्छ भन्ने होइन।',
    'Cash reconciliation': 'नगद मिलान',
    'What came in, by tender and by who took it.': 'कुन भुक्तानी माध्यमबाट र कसले लियो भन्ने विवरण।',
    'How the period adds up': 'अवधिको हिसाब कसरी जोडिन्छ',
    'Each line is a separate measurement, not a step in one calculation.':
        'हरेक लाइन छुट्टै नाप हो, एउटै गणनाको चरण होइन।',
    'Gross test charges': 'कुल परीक्षण शुल्क',
    'Every billed line at its full price, before any discount.':
        'कुनै छुट नगरी, हरेक बिल लाइनको पूरा मूल्य।',
    'Less discounts': 'छुट घटाएर',
    'Per-line plus whole-invoice discounts.': 'प्रति-लाइन र सम्पूर्ण-बिल छुट दुवै।',
    'Net of discounts (subtotal)': 'छुट घटाएपछिको रकम (उप-जम्मा)',
    'What the invoice lines came to.': 'बिल लाइनहरूको जम्मा रकम।',
    'The VAT-exclusive base the laboratory earns on.':
        'VAT बाहेकको आधार रकम, जसमा प्रयोगशालाले आम्दानी गर्छ।',
    'Collected on the government’s behalf, not laboratory income.':
        'सरकारको तर्फबाट सङ्कलन गरिएको, प्रयोगशालाको आम्दानी होइन।',
    'Total billed': 'कुल बिल रकम',
    'Taxable amount plus VAT — the invoice face value.':
        'कर लाग्ने रकम र VAT जोड — बिलमा उल्लेखित कुल रकम।',
    'Collected in period': 'अवधिमा सङ्कलन भएको',
    'All payments taken during the period.': 'अवधिभरमा लिइएका सबै भुक्तानी।',
    'Less refunds approved': 'स्वीकृत फिर्ता घटाएर',
    'Refunds approved during the period.': 'अवधिभरमा स्वीकृत भएका फिर्ताहरू।',
    'Net collections': 'खुद सङ्कलन',
    'What the laboratory actually kept this period.': 'यो अवधिमा प्रयोगशालाले साँच्चै राखेको रकम।',
    'Outstanding on these invoices': 'यी बिलहरूमा बाँकी रकम',
    'Still unpaid, as things stand today.': 'आजसम्म अझै तिर्न बाँकी।',
    'Billed figures count invoices by the date they were issued. Collections count payments by the date the money arrived, and refunds by the date they were approved — so an invoice billed in one period can be collected in another.':
        'बिल रकम बिल जारी भएको मितिअनुसार गणना गरिन्छ। सङ्कलन रकम पैसा आएको मितिअनुसार, र फिर्ता स्वीकृत भएको मितिअनुसार गणना गरिन्छ — त्यसैले एक अवधिमा जारी भएको बिल अर्को अवधिमा असुल हुन सक्छ।',
    'All-time outstanding across every unpaid invoice is {amount} over {count} invoice.':
        'हालसम्मको कुल बाँकी रकम {amount} हो, जम्मा {count} बिलमा।',
    'All-time outstanding across every unpaid invoice is {amount} over {count} invoices.':
        'हालसम्मको कुल बाँकी रकम {amount} हो, जम्मा {count} बिलहरूमा।',

    # ---- revenue preset chips (types.ts REVENUE_PRESET_LABEL) ---------------------------
    'Yesterday': 'हिजो',
    'Last 7 days': 'पछिल्लो ७ दिन',
    'Last 30 days': 'पछिल्लो ३० दिन',
    'Last week': 'अघिल्लो हप्ता',
    'Last month': 'अघिल्लो महिना',
    'This year': 'यो वर्ष',

    # ---- RevenueFilters.tsx --------------------------------------------------------------
    'Reporting period': 'रिपोर्टिङ अवधि',
    'Custom range': 'आफ्नै दायरा',
    'Pick any two dates': 'कुनै दुई मिति छान्नुहोस्',
    'All branches': 'सबै शाखा',

    # ---- RevenueKpis.tsx ------------------------------------------------------------------
    'no prior figure': 'अघिल्लो अङ्क छैन',
    'vs previous': 'अघिल्लोको तुलनामा',
    'Invoices issued in this period, VAT included. Cancelled invoices are excluded. This is what was sold, not what was received.':
        'यो अवधिमा जारी बिलहरू, VAT सहित। रद्द भएका बिल समावेश छैनन्। यो बिक्री भएको रकम हो, प्राप्त भएको होइन।',
    'Total collected': 'कुल सङ्कलन',
    'Every payment received in this period, by the date it was taken — whatever invoice it settles. Refunds are not deducted here.':
        'यो अवधिमा प्राप्त सबै भुक्तानी, लिइएको मितिअनुसार — जुनसुकै बिल मिलान गरे पनि। यहाँ फिर्ता घटाइएको छैन।',
    'Collected less refunds approved in this period. This is the figure that should reconcile against the cash actually in hand.':
        'यो अवधिमा स्वीकृत फिर्ता घटाएपछिको सङ्कलन। यो अङ्कले हातमा भएको नगदसँग मिलान हुनुपर्छ।',
    'Outstanding': 'बाँकी रकम',
    'What the invoices issued in this period are still owed, as they stand today. Not a historical balance — it moves as those invoices get paid.':
        'यो अवधिमा जारी बिलहरूमा आजसम्म बाँकी रकम। यो विगतको स्थिर रकम होइन — ती बिल तिरिँदै जाँदा यो बदलिन्छ।',
    '{outstandingCount} of {totalCount} invoice unpaid': '{totalCount} मध्ये {outstandingCount} बिल बाँकी',
    '{outstandingCount} of {totalCount} invoices unpaid': '{totalCount} मध्ये {outstandingCount} बिलहरू बाँकी',
    'Total discounts': 'कुल छुट',
    'Per-test discounts plus whole-invoice discounts on the invoices issued in this period.':
        'यो अवधिमा जारी बिलहरूमा प्रति-परीक्षण छुट र सम्पूर्ण-बिल छुट दुवै।',
    '{lineAmount} on lines · {invoiceAmount} on invoices': 'लाइनमा {lineAmount} · बिलमा {invoiceAmount}',
    'Total refunds': 'कुल फिर्ता',
    'Refunds approved in this period, by their approval date. Requested and rejected refunds move no money and are not counted.':
        'यो अवधिमा स्वीकृत फिर्ताहरू, स्वीकृति मितिअनुसार। अनुरोध गरिएका र अस्वीकृत फिर्ताले पैसा चलाउँदैन र गणना गरिँदैन।',
    'Invoices issued': 'जारी बिलहरू',
    'Invoices issued in this period, excluding cancelled ones. Drafts are not invoices and are never counted.':
        'यो अवधिमा जारी बिलहरू, रद्द भएका बाहेक। मस्यौदा बिल होइन र कहिल्यै गणना गरिँदैन।',
    '{count} test billed': '{count} परीक्षण बिल भयो',
    '{count} tests billed': '{count} परीक्षणहरू बिल भए',
    'Payment transactions': 'भुक्तानी कारोबार',
    'Individual payments received in this period. One invoice can be settled by several, so this is usually higher than the invoice count.':
        'यो अवधिमा प्राप्त व्यक्तिगत भुक्तानीहरू। एउटा बिल धेरै भुक्तानीले मिलान हुन सक्छ, त्यसैले यो सामान्यतया बिल सङ्ख्याभन्दा बढी हुन्छ।',
    '{count} invoice cancelled ({amount})': '{count} बिल रद्द भयो ({amount})',
    '{count} invoices cancelled ({amount})': '{count} बिलहरू रद्द भए ({amount})',
    'no cancellations in this period': 'यो अवधिमा कुनै रद्द भएन',

    # ---- BilledVsCollectedChart.tsx -------------------------------------------------------
    'No activity in this period.': 'यो अवधिमा कुनै गतिविधि भएन।',
    'day': 'दिन',
    'week': 'हप्ता',
    'month': 'महिना',
    'per {unit}': 'प्रति {unit}',
    'Billed and collected per {unit} over the selected period':
        'छानिएको अवधिमा प्रति {unit} बिल र सङ्कलन',
    '{date} · billed {amount}': '{date} · बिल {amount}',
    '{date} · collected {amount}': '{date} · सङ्कलन {amount}',
    '· refunded {amount}': '· फिर्ता {amount}',

    # ---- BreakdownPanels.tsx ---------------------------------------------------------------
    'Times billed': 'बिल भएको पटक',
    'Unpaid invoices': 'तिर्न बाँकी बिलहरू',
    'An invoice is paid as a whole, so cash is split across its lines in proportion to each line’s share of the invoice. Billed figures are exact; collected and outstanding are allocations.':
        'बिल सम्पूर्ण रूपमा तिरिन्छ, त्यसैले नगद प्रत्येक लाइनको बिलमा भएको अंशअनुसार बाँडिन्छ। बिल रकम ठीक हो; सङ्कलन र बाँकी रकम बाँडफाँड मात्र हो।',
    'Revenue by test': 'परीक्षणअनुसार आम्दानी',
    'Every test and package billed in this period, highest first.':
        'यो अवधिमा बिल भएका सबै परीक्षण र प्याकेज, सबैभन्दा बढीबाट।',
    'No tests were billed in this period.': 'यो अवधिमा कुनै परीक्षण बिल गरिएन।',
    'All tests': 'सबै परीक्षण',
    'Revenue by category': 'वर्गअनुसार आम्दानी',
    "Using each test's current catalogue category.": 'हरेक परीक्षणको हालको सूची वर्ग प्रयोग गरेर।',
    'Categories come from the test catalogue as it stands now, not as it stood when the invoice was raised — recategorising a test changes how past periods group, though never the totals.':
        'वर्गहरू परीक्षण सूचीको हालको अवस्थाबाट आउँछन्, बिल बनाउँदाको अवस्थाबाट होइन — परीक्षणको वर्ग बदल्दा विगतका अवधिको समूहीकरण बदलिन्छ, तर कुल रकम कहिल्यै बदलिँदैन।',
    'No categorised revenue in this period.': 'यो अवधिमा कुनै वर्गीकृत आम्दानी भएन।',
    'All categories': 'सबै वर्ग',
    'Revenue by department': 'विभागअनुसार आम्दानी',
    'The laboratory section each test belongs to.': 'हरेक परीक्षण सम्बन्धित प्रयोगशाला शाखा।',
    'No departmental revenue in this period.': 'यो अवधिमा कुनै विभागीय आम्दानी भएन।',
    'All departments': 'सबै विभाग',
    'Revenue by package': 'प्याकेजअनुसार आम्दानी',
    'Profiles and health-checkup panels sold as a single billed item.':
        'प्रोफाइल र स्वास्थ्य जाँच प्यानलहरू एकल बिल वस्तुको रूपमा बिक्री भएको।',
    'A package is billed once at its own price; the member tests it contains are performed but never billed separately, so nothing here is double-counted against the test table.':
        'एक प्याकेज आफ्नै मूल्यमा एकपटक बिल गरिन्छ; यसभित्रका परीक्षणहरू गरिन्छ तर छुट्टै बिल गरिँदैन, त्यसैले यहाँ परीक्षण तालिकासँग दोहोरो गणना हुँदैन।',
    'No packages were sold in this period.': 'यो अवधिमा कुनै प्याकेज बिक्री भएन।',
    'All packages': 'सबै प्याकेज',
    'Revenue by patient type': 'बिरामी प्रकारअनुसार आम्दानी',
    'How the patient reached the laboratory.': 'बिरामी प्रयोगशालासम्म कसरी पुगे।',
    'No revenue in this period.': 'यो अवधिमा कुनै आम्दानी भएन।',
    'All patient types': 'सबै बिरामी प्रकार',
    'Revenue by payer': 'भुक्तानी गर्नेअनुसार आम्दानी',
    'Who settles the bill — corporate accounts, insurers and schemes.':
        'बिल कसले तिर्छ — कर्पोरेट खाता, बीमा कम्पनी र योजनाहरू।',
    "Grouped by the payer recorded on each patient's registration. The payer name is free text, so two spellings of the same company appear as two rows.":
        'हरेक बिरामीको दर्तामा उल्लेखित भुक्तानीकर्ताअनुसार समूहीकृत। भुक्तानीकर्ताको नाम स्वतन्त्र पाठ हो, त्यसैले एउटै कम्पनीको दुई फरक हिज्जे दुई छुट्टै पंक्तिमा देखिन सक्छ।',
    'All payers': 'सबै भुक्तानीकर्ता',
    'Revenue by referrer': 'रेफर गर्नेअनुसार आम्दानी',
    'Which referring doctors brought in the work.': 'कुन रेफर गर्ने डाक्टरले काम ल्याए।',
    'No referrals in this period.': 'यो अवधिमा कुनै रेफरल भएन।',
    'All referrers': 'सबै रेफर गर्ने',
    'Patients with the largest outstanding balances': 'सबैभन्दा बढी बाँकी भएका बिरामीहरू',
    'From the invoices issued in this period.': 'यो अवधिमा जारी बिलहरूबाट।',
    'Every invoice issued in this period is settled.':
        'यो अवधिमा जारी गरिएका सबै बिल भुक्तानी भइसकेका छन्।',
    'These patients': 'यी बिरामीहरू',

    # ---- MoneyTable.tsx --------------------------------------------------------------------
    'No data': 'डाटा छैन',
    'Nothing in this period.': 'यो अवधिमा केही छैन।',
    '(all {count})': '(सबै {count})',
    'Showing the top {shown} of {total}. The total above covers all of them.':
        'जम्मा {total} मध्ये उच्च {shown} देखाइँदैछ। माथिको जम्माले सबैलाई समेट्छ।',

    # ---- PaymentMethodPanel.tsx ------------------------------------------------------------
    '{provider} (online gateway)': '{provider} (अनलाइन गेटवे)',
    'Transactions': 'कारोबारहरू',
    'Amount collected': 'सङ्कलन भएको रकम',
    'No payments were received in this period.': 'यो अवधिमा कुनै भुक्तानी प्राप्त भएन।',
    'All methods': 'सबै माध्यम',
    '{amount} of this was booked on account as a credit settlement, not money through the till. Cash, card, bank, wallet and cheque together come to':
        '{amount} उधारो मिलानको रूपमा दर्ता गरिएको हो, काउन्टरबाट आएको नगद होइन। नगद, कार्ड, बैंक, वालेट र चेक जोड्दा',
    'By who received it': 'कसले लियो अनुसार',
    'Grouped by the username recorded on each payment. Gateway payments are attributed to the provider that verified them.':
        'हरेक भुक्तानीमा दर्ता भएको प्रयोगकर्ता नामअनुसार समूहीकृत। गेटवे भुक्तानी प्रमाणित गर्ने प्रदायकलाई जिम्मा दिइन्छ।',
    'Everyone': 'सबैजना',

    # ---- RevenueReportDocument.tsx ---------------------------------------------------------
    '{from} to {to}': '{from} देखि {to} सम्म',
    'Daily Revenue Report': 'दैनिक आम्दानी रिपोर्ट',
    'Revenue Report': 'आम्दानी रिपोर्ट',
    'Tel: {phone}': 'फोन: {phone}',
    'PAN: {pan}': 'PAN: {pan}',
    'Branch: {branch}': 'शाखा: {branch}',
    'Generated {time} by {user}': '{user} द्वारा {time} मा तयार गरिएको',
    'A. Financial summary': 'A. वित्तीय सारांश',
    'Billed — invoices issued in this period': 'बिल — यो अवधिमा जारी गरिएका बिलहरू',
    'Before any discount': 'कुनै छुट अघि',
    'Less line discounts': 'लाइन छुट घटाएर',
    'Less invoice discounts': 'बिल छुट घटाएर',
    'Net of discounts': 'छुट घटाएपछि',
    "Collected on the government's behalf": 'सरकारको तर्फबाट सङ्कलन गरिएको',
    'Tests and packages billed': 'परीक्षण र प्याकेज बिल भएको',
    'Of these, since cancelled': 'यीमध्ये, पछि रद्द गरिएको',
    '{count} invoice(s). Billed as issued was {amount}.': '{count} बिल। जारी हुँदाको बिल रकम {amount} थियो।',
    'Collected — money received in this period': 'सङ्कलन — यो अवधिमा प्राप्त भएको रकम',
    'By the date each payment was taken': 'हरेक भुक्तानी लिइएको मितिअनुसार',
    'Cash, card, bank, wallet, cheque': 'नगद, कार्ड, बैंक, वालेट, चेक',
    'Booked on account (credit)': 'उधारोमा दर्ता गरिएको',
    'A settlement on account, not money through the till': 'उधारो मिलान हो, काउन्टरबाट आएको नगद होइन',
    '{count} refund(s), by approval date': '{count} फिर्ता, स्वीकृति मितिअनुसार',
    'On invoices issued in this period': 'यो अवधिमा जारी बिलहरूमा',
    '{outstandingCount} of {totalCount} invoice(s) unpaid, as at generation':
        '{totalCount} मध्ये {outstandingCount} बिल तिर्न बाँकी, तयार गर्दाको अवस्थामा',
    'All unpaid invoices, all time': 'हालसम्मका सबै तिर्न बाँकी बिलहरू',
    '{count} invoice(s)': '{count} बिल',
    'Invoices cancelled in this period': 'यो अवधिमा रद्द गरिएका बिलहरू',
    'Billed counts invoices by the date they were issued; cancelled invoices are excluded. Collected counts payments by the date the money arrived, and refunds by the date they were approved. An invoice billed in one period may therefore be collected in another, and the two columns are not expected to agree. Net collections is the figure that reconciles against cash in hand.':
        'बिल रकम बिल जारी भएको मितिअनुसार गणना गरिन्छ; रद्द भएका बिल समावेश हुँदैनन्। सङ्कलन रकम पैसा आएको मितिअनुसार, र फिर्ता स्वीकृत भएको मितिअनुसार गणना गरिन्छ। त्यसैले एक अवधिमा जारी बिल अर्को अवधिमा असुल हुन सक्छ, र यी दुई स्तम्भ मिल्नैपर्छ भन्ने छैन। खुद सङ्कलन नै नगदसँग मिलान हुने अङ्क हो।',
    'B. Collections by payment method': 'B. भुक्तानी माध्यमअनुसार सङ्कलन',
    'Reconcile these against the till, the bank and the gateway statements.':
        'यिनलाई काउन्टर, बैंक र गेटवे विवरणसँग मिलान गर्नुहोस्।',
    'C. Revenue by test': 'C. परीक्षणअनुसार आम्दानी',
    "Over the invoices issued in this period. Billed is exact; collected and outstanding are each line's pro-rata share of its invoice.":
        'यो अवधिमा जारी बिलहरूमा आधारित। बिल रकम ठीक हो; सङ्कलन र बाँकी रकम प्रत्येक लाइनको बिलमा रहेको अंशअनुसार हो।',
    'Code': 'कोड',
    'Test / package': 'परीक्षण / प्याकेज',
    'Times': 'पटक',
    'Gross': 'कुल रकम',
    'Billed': 'बिल भएको',
    'Collected': 'सङ्कलन भएको',
    '(package)': '(प्याकेज)',
    'Total ({count} test)': 'जम्मा ({count} परीक्षण)',
    'Total ({count} tests)': 'जम्मा ({count} परीक्षणहरू)',
    'A package is billed once at its own price. The tests inside it are performed but never billed separately, so no revenue here is counted twice. These lines sum to the subtotal, not to total billed — whole-invoice discounts and VAT are not distributed across lines.':
        'एक प्याकेज आफ्नै मूल्यमा एकपटक मात्र बिल गरिन्छ। भित्रका परीक्षणहरू गरिन्छ तर छुट्टै बिल गरिँदैन, त्यसैले यहाँ कुनै आम्दानी दोहोरो गणना हुँदैन। यी लाइनहरू उप-जम्मासम्म जोडिन्छ, कुल बिलसम्म होइन — सम्पूर्ण-बिल छुट र VAT लाइनहरूमा बाँडिँदैन।',
    'D. Revenue by category and department': 'D. वर्ग र विभागअनुसार आम्दानी',
    'By category': 'वर्गअनुसार',
    'By department': 'विभागअनुसार',
    'Packages and health-checkup panels sold': 'बिक्री भएका प्याकेज र स्वास्थ्य जाँच प्यानलहरू',
    'Package': 'प्याकेज',
    'Sold': 'बिक्री भएको',
    'E. Revenue by patient type and payer': 'E. बिरामी प्रकार र भुक्तानी गर्नेअनुसार आम्दानी',
    'By patient type': 'बिरामी प्रकारअनुसार',
    'Patient type': 'बिरामी प्रकार',
    'By payer (corporate, insurance and schemes)': 'भुक्तानी गर्नेअनुसार (कर्पोरेट, बीमा र योजना)',
    'F. Payment transaction register': 'F. भुक्तानी कारोबार खाता',
    'Every payment received in this period. Showing the first {shown} of {total} — narrow the period for the complete register.':
        'यो अवधिमा प्राप्त सबै भुक्तानी। जम्मा {total} मध्ये पहिलो {shown} देखाइँदैछ — पूरा खाता हेर्न अवधि साँघुरो बनाउनुहोस्।',
    'Every payment received in this period, {total} in total, oldest first.':
        'यो अवधिमा प्राप्त सबै भुक्तानी, जम्मा {total}, पुरानो पहिले।',
    'Receipt': 'रसिद',
    'Date & time': 'मिति र समय',
    'Patient ID': 'बिरामी नम्बर',
    'Method': 'माध्यम',
    'Refunded': 'फिर्ता भएको',
    'Invoice cancelled': 'बिल रद्द भयो',
    'Settled': 'भुक्तानी भयो',
    'Total ({count} transaction listed)': 'जम्मा ({count} कारोबार सूचीकृत)',
    'Total ({count} transactions listed)': 'जम्मा ({count} कारोबारहरू सूचीकृत)',
    'The Refunded column shows refunds raised against that specific receipt, whenever they were approved — which may be outside this period. The refunds deducted from net collections above are those approved within it, listed next.':
        'फिर्ता भएको स्तम्भले त्यो रसिदमा उठाइएका फिर्ताहरू देखाउँछ, जुनसुकै बेला स्वीकृत भए पनि — जो यो अवधिभन्दा बाहिरको हुन सक्छ। माथिको खुद सङ्कलनबाट घटाइएका फिर्ताहरू यही अवधिभित्र स्वीकृत भएका हुन्, जो तल सूचीकृत छन्।',
    'G. Refunds approved in this period': 'G. यो अवधिमा स्वीकृत फिर्ताहरू',
    'Requested by': 'अनुरोध गर्ने',
    'Approved by': 'स्वीकृत गर्ने',
    'Total refunds ({count})': 'कुल फिर्ता ({count})',
    'H. Outstanding payment summary': 'H. बाँकी भुक्तानी सारांश',
    'Unpaid invoices issued in this period. Showing the first {shown} of {total}.':
        'यो अवधिमा जारी तिर्न बाँकी बिलहरू। जम्मा {total} मध्ये पहिलो {shown} देखाइँदैछ।',
    'Unpaid invoices issued in this period, as at the time of generation.':
        'यो अवधिमा जारी तिर्न बाँकी बिलहरू, तयार गर्दाको अवस्थामा।',
    'Invoice total': 'बिलको कुल रकम',
    'Paid': 'तिरेको',
    'Days': 'दिन',
    'Part paid': 'आंशिक भुक्तानी',
    'Total ({count} invoice listed)': 'जम्मा ({count} बिल सूचीकृत)',
    'Total ({count} invoices listed)': 'जम्मा ({count} बिलहरू सूचीकृत)',
    'Prepared by': 'तयार गर्ने',
    'Verified by': 'प्रमाणित गर्ने',
    'Name / signature': 'नाम / सही',
    "Computer-generated from {labName}'s laboratory information system on {time} by {user}. Figures cover {period} and are stated in NPR. This is a management report; the statutory sales register, master bill and corrections reports are produced separately and cut their months at a different hour of the day, so month totals may differ slightly.":
        '{labName} को प्रयोगशाला सूचना प्रणालीबाट {user} द्वारा {time} मा कम्प्युटर-तयार। तथ्याङ्कले {period} समेट्छ र NPR मा उल्लेख गरिएको छ। यो व्यवस्थापकीय रिपोर्ट हो; कानुनी बिक्री खाता, मास्टर बिल र सच्याइ रिपोर्टहरू छुट्टै तयार हुन्छन् र महिना फरक घडीमा काट्छन्, त्यसैले महिनाको जम्मा अलिकति फरक पर्न सक्छ।',

    # ---- revenue & commission PAYMENT_METHOD_LABEL / PAYER_TYPE_LABEL / PATIENT_CATEGORY_LABEL values ----
    'On account (credit)': 'उधारोमा',
    'Self-paying': 'आफैं भुक्तानी गर्ने',
    'Corporate': 'कर्पोरेट',
    'NGO': 'गैरसरकारी संस्था',
    'Government': 'सरकार',
    'In-patient': 'भर्ना बिरामी',

    # ---- TransactionRegisters.tsx ----------------------------------------------------------
    'Received': 'प्राप्त भएको',
    'Refunded {amount}': 'फिर्ता {amount}',
    'Approved': 'स्वीकृत भएको',
    'Original method': 'पुरानो माध्यम',
    '{days}d': '{days} दिन',
    'Received at': 'प्राप्त भएको मिति',
    'Approved at': 'स्वीकृत भएको मिति',
    'Issued at': 'जारी भएको मिति',
    'Days outstanding': 'बाँकी दिन',
    'Export page': 'पृष्ठ निर्यात गर्नुहोस्',
    'Filter by payment method': 'भुक्तानी माध्यमअनुसार छान्नुहोस्',
    'All payment methods': 'सबै भुक्तानी माध्यम',
    'Filter by who received it': 'कसले लियो अनुसार छान्नुहोस्',
    'Which unpaid invoices to list': 'कुन तिर्न बाँकी बिल देखाउने',
    'Issued in this period': 'यो अवधिमा जारी',
    'Every unpaid invoice, all time': 'हालसम्मका सबै तिर्न बाँकी बिल',
    'No payments': 'कुनै भुक्तानी छैन',
    'No money was received in this period under these filters.':
        'यी फिल्टरअनुसार यो अवधिमा कुनै पैसा प्राप्त भएन।',
    'No refunds': 'कुनै फिर्ता छैन',
    'No refunds were approved in this period.': 'यो अवधिमा कुनै फिर्ता स्वीकृत भएन।',
    'Nothing outstanding': 'कुनै बाँकी छैन',
    'Every invoice in this view is settled.': 'यो दृश्यका सबै बिल भुक्तानी भइसकेका छन्।',

    # ---- RevenueReportPage.tsx --------------------------------------------------------------
    'Revenue {period}': 'आम्दानी {period}',
    'Revenue report': 'आम्दानी रिपोर्ट',
    'Back to Revenue': 'आम्दानीमा फर्कनुहोस्',
    'Branch {id}': 'शाखा {id}',
    'Print preview. Use your browser\'s "Save as PDF" destination to keep a copy.':
        'प्रिन्ट पूर्वावलोकन। प्रतिलिपि राख्न आफ्नो ब्राउजरको "Save as PDF" विकल्प प्रयोग गर्नुहोस्।',
    'Building the report…': 'रिपोर्ट तयार गर्दै…',
    'This period has more transactions than one report can list. The registers show the first {rows} rows and the summary totals still cover everything — print a shorter period for a complete register.':
        'यो अवधिमा एक रिपोर्टले देखाउन सक्नेभन्दा धेरै कारोबार छन्। खाताले पहिलो {rows} पंक्ति देखाउँछ तर सारांशको जम्माले सबैलाई समेट्छ — पूरा खाता हेर्न छोटो अवधि प्रिन्ट गर्नुहोस्।',

    # ---- CommissionPage.tsx -----------------------------------------------------------------
    'Referring doctor commission': 'रेफर गर्ने डाक्टर कमिसन',
    'Commission earned automatically when an invoice from a referred order is issued, as a % of the taxable amount. Payouts are recorded separately as a running balance, not matched invoice-by-invoice.':
        'रेफर गरिएको अर्डरबाट बिल जारी हुँदा कमिसन कर लाग्ने रकमको % अनुसार स्वचालित रूपमा आर्जन हुन्छ। भुक्तानी छुट्टै चलिरहेको बाँकीको रूपमा दर्ता हुन्छ, बिल-बिल मिलान गरिँदैन।',
    'No commission earned yet': 'अहिलेसम्म कुनै कमिसन आर्जन भएको छैन',
    "Set a commission rate on a referring doctor's profile, then issue an invoice from an order they referred.":
        'रेफर गर्ने डाक्टरको प्रोफाइलमा कमिसन दर सेट गर्नुहोस्, त्यसपछि उनले रेफर गरेको अर्डरबाट बिल जारी गर्नुहोस्।',
    'Doctor': 'डाक्टर',
    'Rate': 'दर',
    'Earned': 'आर्जन',
    'View / Pay': 'हेर्नुहोस् / तिर्नुहोस्',
    'View': 'हेर्नुहोस्',
    'Total ({count} doctor)': 'जम्मा ({count} डाक्टर)',
    'Total ({count} doctors)': 'जम्मा ({count} डाक्टरहरू)',

    # ---- DoctorCommissionModal.tsx ----------------------------------------------------------
    'Payout recorded': 'भुक्तानी दर्ता भयो',
    'Unable to record payout': 'भुक्तानी दर्ता गर्न सकिएन',
    'Record payout': 'भुक्तानी दर्ता गर्नुहोस्',
    'Amount (NPR)': 'रकम (NPR)',
    'Exceeds outstanding balance of {amount}.': 'बाँकी रकम {amount} भन्दा बढी छ।',
    'Reference (optional)': 'सन्दर्भ (वैकल्पिक)',
    'Note (optional)': 'नोट (वैकल्पिक)',
    'Earned entries': 'आर्जन प्रविष्टिहरू',
    'No entries yet.': 'अहिलेसम्म कुनै प्रविष्टि छैन।',
    'Base': 'आधार रकम',
    'Payout history': 'भुक्तानी इतिहास',
    'No payouts recorded yet.': 'अहिलेसम्म कुनै भुक्तानी दर्ता भएको छैन।',
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
