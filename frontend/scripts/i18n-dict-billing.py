import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- InvoicesPage.tsx --------------------------------------------------------------
    'Billing for lab orders — issue, collect payment and track balances.':
        'ल्याब अर्डरका बिल — जारी, भुक्तानी सङ्कलन र बाँकी रकम हेर्नुहोस्।',
    'Export Excel': 'Excel निर्यात',
    'Export XML': 'XML निर्यात',
    'Search invoice no., patient or MRN': 'बिल नम्बर, बिरामी वा MRN खोज्नुहोस्',
    'All branches': 'सबै शाखा',
    'Outstanding only': 'बाँकी मात्र',
    'No invoices': 'कुनै बिल छैन',
    'Raise an invoice from a confirmed lab order.': 'पुष्टि भएको ल्याब अर्डरबाट बिल बनाउनुहोस्।',
    'Export failed': 'निर्यात असफल भयो',

    # ---- RefundsPage.tsx ----------------------------------------------------------------
    'Review and approve refund requests raised against invoices.':
        'बिलहरूमा उठाइएका फिर्ता अनुरोधहरू जाँच गरी स्वीकृत गर्नुहोस्।',
    'Awaiting decision': 'निर्णय बाँकी',
    'No refund requests match this filter.': 'यो फिल्टरसँग मिल्ने फिर्ता अनुरोध भेटिएन।',
    'Requested by {name}': '{name} द्वारा अनुरोध गरिएको',
    'Refund approved': 'फिर्ता स्वीकृत भयो',
    'Reject': 'अस्वीकार गर्नुहोस्',
    'Reject refund request?': 'फिर्ता अनुरोध अस्वीकार गर्ने?',
    'The requester will need to raise a new request if a refund is still required.':
        'फिर्ता अझै चाहिएमा अनुरोध गर्नेले नयाँ अनुरोध गर्नुपर्नेछ।',
    'Refund rejected': 'फिर्ता अस्वीकृत भयो',

    # ---- InvoiceDetailPage.tsx ------------------------------------------------------------
    'Payment confirmed via {provider}': '{provider} मार्फत भुक्तानी पुष्टि भयो',
    'Payment not confirmed: {reason}': 'भुक्तानी पुष्टि भएन: {reason}',
    'unknown reason': 'अज्ञात कारण',
    'Unable to verify payment': 'भुक्तानी प्रमाणित गर्न सकिएन',
    'Loading invoice…': 'बिल लोड हुँदैछ…',
    'Invoice {number} issued': 'बिल {number} जारी भयो',
    'Unable to issue invoice': 'बिल जारी गर्न सकिएन',
    'Unable to print': 'प्रिन्ट गर्न सकिएन',
    'Invoice cancelled': 'बिल रद्द भयो',
    'Unable to cancel': 'रद्द गर्न सकिएन',
    'Draft invoice': 'मस्यौदा बिल',
    'Reprint': 'पुनः प्रिन्ट',
    'Adjust': 'मिलाउनुहोस्',
    'Issue': 'जारी गर्नुहोस्',
    'Pay online': 'अनलाइन भुक्तानी',
    'Refund': 'फिर्ता',
    'Line items': 'वस्तु विवरण',
    'Order {number}': 'अर्डर {number}',
    'Rate': 'दर',
    'Qty': 'सङ्ख्या',
    'Disc.': 'छुट',
    'Tax ({rate}%)': 'कर ({rate}%)',
    'Refunded': 'फिर्ता भएको',
    'No payments recorded.': 'कुनै भुक्तानी दर्ता गरिएको छैन।',
    'Issue this invoice to enable recording a payment.': 'भुक्तानी दर्ता गर्नका लागि यो बिल जारी गर्नुहोस्।',
    'Requested {date}': '{date} मा अनुरोध गरिएको',
    'decided by {name}': '{name} द्वारा निर्णय गरिएको',
    'Cancel this invoice?': 'यो बिल रद्द गर्ने?',
    'The invoice will be voided. This is only possible before any payment is recorded.':
        'बिल खारेज हुनेछ। कुनै भुक्तानी दर्ता हुनुअघि मात्र यो सम्भव छ।',

    # ---- InvoiceIrdCard.tsx ---------------------------------------------------------------
    'Submission attempted': 'पेश गर्ने प्रयास भयो',
    'Unable to submit': 'पेश गर्न सकिएन',
    'Available once the invoice is issued.': 'बिल जारी भएपछि मात्र उपलब्ध हुन्छ।',
    'Manual': 'म्यानुअल',
    'Electronic submission is not configured — no data is transmitted. Bills can be recorded as filed manually.':
        'इलेक्ट्रोनिक पेश सेटअप गरिएको छैन — कुनै डाटा पठाइँदैन। बिलहरू म्यानुअल रूपमा फायल गरिएको रूपमा दर्ता गर्न सकिन्छ।',
    'Retry submission': 'पुनः पेश गर्नुहोस्',
    'Submit to IRD': 'IRD मा पेश गर्नुहोस्',
    'Not submitted': 'पेश गरिएको छैन',
    'In progress': 'भइरहेको',
    'Submitted': 'पेश भयो',
    'Accepted': 'स्वीकृत भयो',
    'Failed': 'असफल भयो',
    'Duplicate': 'दोहोरो',

    # ---- InvoiceVatRefundCard.tsx ----------------------------------------------------------
    'VAT refund reporting': 'VAT फिर्ता प्रतिवेदन',
    '10% of VAT on digital-wallet payments, reported to the provider per Anusuchi-8 of the e-invoice procedure.':
        'डिजिटल वालेट भुक्तानीमा VAT को 10%, ई-बिलिङ प्रक्रियाको अनुसूची-८ अनुसार प्रदायकलाई प्रतिवेदन गरिएको।',
    'Refund amount: {amount}': 'फिर्ता रकम: {amount}',
    'Reported': 'प्रतिवेदन गरियो',
    'Report failed': 'प्रतिवेदन असफल भयो',
    'Not supported by provider': 'प्रदायकले सहयोग गर्दैन',
    'Not applicable': 'लागू हुँदैन',

    # ---- InvoiceCommissionCard.tsx ---------------------------------------------------------
    'Referring doctor': 'रेफर गर्ने डाक्टर',
    'Commission ({rate}%)': 'कमिसन ({rate}%)',
    "Rate is {rate}%, but no commission was earned on this invoice — it was likely issued before the rate was set (rates aren't applied retroactively).":
        'दर {rate}% हो, तर यो बिलमा कुनै कमिसन कमाइएको छैन — दर तय गर्नुअघि नै यो बिल जारी भएको हुन सक्छ (दरहरू पुर्वप्रभावी रूपमा लागू हुँदैनन्)।',
    'No commission rate set for this doctor.': 'यो डाक्टरका लागि कमिसन दर तय गरिएको छैन।',
    'View commission ledger': 'कमिसन लेजर हेर्नुहोस्',

    # ---- InvoiceActionModals.tsx -----------------------------------------------------------
    'Outstanding balance {amount}': 'बाँकी रकम {amount}',
    'This exceeds the outstanding balance of {amount}. Reduce the amount, or use a refund/credit flow for anything genuinely owed back to the patient.':
        'यो बाँकी रकम {amount} भन्दा बढी छ। रकम घटाउनुहोस्, वा बिरामीलाई साँच्चै तिर्नुपर्ने भए फिर्ता/क्रेडिट प्रक्रिया प्रयोग गर्नुहोस्।',
    'Amount (NPR)': 'रकम (रु)',
    'Method': 'माध्यम',
    'Reference (optional)': 'सन्दर्भ (वैकल्पिक)',
    'Note (optional)': 'नोट (वैकल्पिक)',
    'Adjust invoice': 'बिल मिलाउनुहोस्',
    'Discount type': 'छुटको प्रकार',
    'No discount': 'छुट छैन',
    'Percentage (%)': 'प्रतिशत (%)',
    'Flat amount (NPR)': 'निश्चित रकम (रु)',
    'Discount value': 'छुटको रकम',
    'Tax rate %': 'करको दर %',
    "Buyer's PAN (optional)": 'खरिदकर्ताको PAN (वैकल्पिक)',
    'Shown on the printed bill and submitted to IRD when this buyer has their own PAN':
        'यो खरिदकर्ताको आफ्नै PAN भएमा प्रिन्ट हुने बिलमा देखिन्छ र IRD मा पेश गरिन्छ',
    'Refundable amount {amount}': 'फिर्ता हुन सक्ने रकम {amount}',
    'Submit request': 'अनुरोध पेश गर्नुहोस्',
    'A refund must be approved by an authorised user before it takes effect.':
        'फिर्ता लागू हुनअघि अधिकारप्राप्त प्रयोगकर्ताले स्वीकृत गर्नुपर्छ।',
    'Payment recorded': 'भुक्तानी दर्ता भयो',
    'Invoice updated': 'बिल अपडेट भयो',
    'Refund requested — awaiting approval': 'फिर्ता अनुरोध गरियो — स्वीकृति बाँकी',

    # ---- month names (MasterBillPage / SalesBookPage / CorrectionsReportPage pickers) -----
    'January': 'जनवरी',
    'February': 'फेब्रुअरी',
    'March': 'मार्च',
    'April': 'अप्रिल',
    'May': 'मे',
    'June': 'जून',
    'July': 'जुलाई',
    'August': 'अगस्ट',
    'September': 'सेप्टेम्बर',
    'October': 'अक्टोबर',
    'November': 'नोभेम्बर',
    'December': 'डिसेम्बर',

    # ---- MasterBillPage.tsx -----------------------------------------------------------------
    'Master bill report': 'मास्टर बिल प्रतिवेदन',
    "Every bill issued this month, including later-cancelled ones (Anusuchi-5 of the e-invoice procedure). Customer PAN is blank when the patient didn't supply one; VAT-refund amount is always blank — this system doesn't integrate a payment gateway to compute a refund.":
        'यस महिना जारी भएका सबै बिल, पछि रद्द भएकाहरू समेत (ई-बिलिङ प्रक्रियाको अनुसूची-५)। ग्राहकले PAN नदिएमा त्यो महल खाली रहन्छ; VAT-फिर्ता रकम सधैं खाली रहन्छ — यो प्रणालीले फिर्ता गणना गर्न कुनै पेमेन्ट गेटवे जोडेको छैन।',
    'Month': 'महिना',
    'Year': 'साल',
    'No bills': 'कुनै बिल छैन',
    'No invoices were issued in this period.': 'यो अवधिमा कुनै बिल जारी भएको छैन।',

    # ---- SalesBookPage.tsx ------------------------------------------------------------------
    'Sales book': 'बिक्री खाता',
    'Monthly sales register (Anusuchi-7 of the e-invoice procedure) — every issued invoice, taxable/non-taxable/export split, discount and tax.':
        'मासिक बिक्री खाता (ई-बिलिङ प्रक्रियाको अनुसूची-७) — जारी भएका सबै बिल, कर लाग्ने/नलाग्ने/निर्यात विभाजन, छुट र कर।',
    'No sales': 'कुनै बिक्री छैन',

    # ---- CorrectionsReportPage.tsx ----------------------------------------------------------
    'Corrections report': 'सच्याइ प्रतिवेदन',
    "Every bill cancelled this month — its validity ended and, if it had already been filed with IRD, whether it's been reversed with a credit note (दफा ६(ठ) of the e-invoice procedure). Distinct from the general audit log, which mixes every kind of action together.":
        'यस महिना रद्द भएका सबै बिल — तिनको मान्यता समाप्त भएको र, पहिले नै IRD मा फायल गरिएको भए, क्रेडिट नोटद्वारा उल्टाइएको छ कि छैन (ई-बिलिङ प्रक्रियाको दफा ६(ठ))। हरेक प्रकारका कार्य मिसिने सामान्य अडिट लगभन्दा फरक।',
    'No corrections': 'कुनै सच्याइ छैन',
    'No invoices were cancelled in this period.': 'यो अवधिमा कुनै बिल रद्द भएको छैन।',
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
