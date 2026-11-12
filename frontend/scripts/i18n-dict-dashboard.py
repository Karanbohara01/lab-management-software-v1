import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- ActionCenter.tsx ----
    'Attention required': 'ध्यान दिनुपर्ने कुराहरू',
    'Prioritised across your entire laboratory.': 'तपाईंको पूरै प्रयोगशालाभर प्राथमिकताका आधारमा मिलाइएको।',
    'Nothing needs attention right now — the laboratory is caught up.':
        'अहिले केहीमा ध्यान दिनु पर्दैन — प्रयोगशालाको सबै काम अद्यावधिक छ।',
    'Critical results awaiting acknowledgment': 'गम्भीर नतिजाहरू स्वीकृतिको पर्खाइमा',
    '{count} result(s) need a documented callback to the clinician.':
        '{count} नतिजाका लागि चिकित्सकलाई लिखित रूपमा फिर्ता सम्पर्क गर्नुपर्छ।',
    'Review critical results': 'गम्भीर नतिजाहरू हेर्नुहोस्',
    'Results awaiting verification': 'नतिजाहरू प्रमाणीकरणको पर्खाइमा',
    '{count} result(s) entered and ready for technician verification.':
        '{count} नतिजा प्रविष्ट भई प्राविधिक प्रमाणीकरणका लागि तयार छन्।',
    'Review results': 'नतिजाहरू हेर्नुहोस्',
    'Reports awaiting pathologist authorization': 'रिपोर्टहरू रोगविज्ञको स्वीकृतिको पर्खाइमा',
    '{count} verified result(s) ready for final sign-off.':
        '{count} प्रमाणित नतिजा अन्तिम स्वीकृतिका लागि तयार छन्।',
    'Review & authorize': 'हेरी स्वीकृत गर्नुहोस्',
    'Samples awaiting collection': 'नमूनाहरू सङ्कलनको पर्खाइमा',
    '{count} sample(s) not yet collected from the patient.':
        '{count} नमूना बिरामीबाट अझै सङ्कलन भएको छैन।',
    'View samples': 'नमूनाहरू हेर्नुहोस्',
    'Results past their turnaround target': 'नतिजाहरू तोकिएको समयावधिभन्दा ढिला',
    '{count} result(s) are running behind the expected turnaround time.':
        '{count} नतिजा अनुमानित समयावधिभन्दा ढिला भइरहेका छन्।',
    'View overdue results': 'ढिला भएका नतिजाहरू हेर्नुहोस्',
    'Failed IRD e-billing submissions': 'असफल भएका IRD ई-बिलिङ पेशहरू',
    '{count} submission(s) failed and need to be retried or filed manually.':
        '{count} पेश असफल भयो — पुनः प्रयास गर्नुपर्छ वा म्यानुअल तरिकाले दर्ता गर्नुपर्छ।',
    'Review submissions': 'पेशहरू हेर्नुहोस्',
    'Inventory needs attention': 'भण्डारमा ध्यान दिनुपर्छ',
    '{count} item(s) are low, expiring soon, or out of stock.':
        '{count} सामग्री कम छ, चाँडै मिति सकिनेछ, वा सकिसकेको छ।',
    'View inventory': 'भण्डार हेर्नुहोस्',

    # ---- CriticalResultsPanel.tsx ----
    'Awaiting a documented callback to the treating clinician.': 'उपचार गर्ने चिकित्सकलाई लिखित फिर्ता सम्पर्कको पर्खाइमा।',
    'All critical results have been acknowledged.': 'सबै गम्भीर नतिजाहरू स्वीकार गरिसकिएको छ।',
    '{test} · detected {time}': '{test} · {time} पत्ता लाग्यो',
    'Review': 'हेर्नुहोस्',

    # ---- DepartmentWorkload.tsx ----
    'Department workload': 'विभागीय कार्यभार',
    'Share of tests ordered · last {days} day(s)': 'अर्डर गरिएका परीक्षणको अंश · पछिल्लो {days} दिन',
    'No tests ordered in this period.': 'यो अवधिमा कुनै परीक्षण अर्डर गरिएको छैन।',

    # ---- InventoryHealthPanel.tsx (STOCK_STATUS_LABEL values already provided by i18n-dict-inventory.py) ----
    'Inventory health': 'भण्डारको अवस्था',
    'Reagents and consumables needing action.': 'कारबाही चाहिने रिएजेन्ट र उपभोग्य सामग्री।',
    'All stock levels are healthy.': 'सबै भण्डार मात्रा ठीक छ।',
    '{qty} {unit} on hand · min {min}': '{qty} {unit} उपलब्ध · न्यूनतम {min}',

    # ---- KpiHero.tsx ----
    "Today's orders": 'आजका अर्डरहरू',
    'Samples in lab': 'प्रयोगशालामा रहेका नमूनाहरू',
    '{count} awaiting collection': '{count} सङ्कलन पर्खँदै',
    'All collected': 'सबै सङ्कलन भयो',
    'Reports issued': 'जारी गरिएका रिपोर्टहरू',
    "Today's revenue": 'आजको आम्दानी',
    '{amount} outstanding': '{amount} बाँकी',
    'Fully collected': 'पूर्ण रूपमा असुल भयो',
    'Patients registered today': 'आज दर्ता भएका बिरामीहरू',
    '{count} order(s) placed so far today': 'आजसम्म {count} अर्डर भयो',

    # ---- RecentActivity.tsx ----
    'Latest actions across the laboratory.': 'प्रयोगशालाभरिका पछिल्ला गतिविधिहरू।',
    'View log': 'लग हेर्नुहोस्',
    'No recent activity.': 'हालैका कुनै गतिविधि छैन।',

    # ---- RevenueTrend.tsx ----
    'Revenue trend': 'आम्दानीको प्रवृत्ति',
    'Booked per day · last {days} day(s) · total {total}': 'दैनिक बिलिङ · पछिल्लो {days} दिन · कुल {total}',
    'No billed revenue in this period yet.': 'यो अवधिमा अझै कुनै बिलिङ आम्दानी छैन।',
    'Revenue by day': 'दैनिक आम्दानी',
    '{label}: {amount}': '{label}: {amount}',

    # ---- TurnaroundPanel.tsx ----
    'Turnaround risk': 'समयावधि जोखिम',
    'Results still in progress, against their due time.': 'तोकिएको समयको तुलनामा अझै प्रगतिमा रहेका नतिजाहरू।',
    'View overdue': 'ढिला भएका हेर्नुहोस्',
    'No results currently in progress.': 'अहिले कुनै नतिजा प्रगतिमा छैन।',
    '{count} on track': '{count} समयमै छन्',
    '{count} overdue': '{count} ढिला भए',
    '{count} in progress': '{count} प्रगतिमा छन्',

    # ---- WorkflowPipeline.tsx ----
    'Laboratory pipeline': 'प्रयोगशाला प्रक्रिया',
    "Where today's work currently stands, end to end.": 'आजको कामको अवस्था सुरुदेखि अन्त्यसम्म।',
    'Patients registered': 'बिरामी दर्ता भयो',
    'Ordered': 'अर्डर गरिएको',
    'In the lab': 'प्रयोगशालामा',
    'Result entry': 'नतिजा प्रविष्टि',
    'Verification': 'प्रमाणीकरण',
    'Result authorization': 'नतिजा स्वीकृति',
    'Reported': 'रिपोर्ट भयो',

    # ---- queues/DraftOrders.tsx ----
    'Started but not yet confirmed — nothing happens in the lab until they are.':
        'सुरु भयो तर अझै पुष्टि भएको छैन — पुष्टि नभएसम्म प्रयोगशालामा केही हुँदैन।',
    'No draft orders waiting to be confirmed.': 'पुष्टि गर्नुपर्ने कुनै मस्यौदा अर्डर छैन।',
    '{count} test(s) · {amount} · started {time}': '{count} परीक्षण · {amount} · {time} सुरु भयो',
    'Open': 'खोल्नुहोस्',

    # ---- queues/OutstandingInvoices.tsx ----
    'Issued invoices with a balance still owed.': 'जारी भएका बिलहरू जसमा रकम अझै बाँकी छ।',
    'Every issued invoice has been paid in full.': 'जारी भएका सबै बिल पूर्ण रूपमा भुक्तानी भइसकेको छ।',
    '{balance} outstanding of {total}': '{total} मध्ये {balance} बाँकी',

    # ---- queues/RefundsToApprove.tsx ----
    'Requested by another staff member — approval requires a second person.':
        'अन्य कर्मचारीले अनुरोध गरेको — स्वीकृतिका लागि दोस्रो व्यक्ति चाहिन्छ।',
    'No refund requests are waiting on approval.': 'स्वीकृतिको पर्खाइमा कुनै फिर्ता अनुरोध छैन।',
    'Approval note (optional):': 'स्वीकृतिको टिप्पणी (वैकल्पिक):',
    'Reason for rejecting this refund:': 'यो फिर्ता अस्वीकार गर्ने कारण:',
    'Refund approved': 'फिर्ता स्वीकृत भयो',
    'Refund rejected': 'फिर्ता अस्वीकृत भयो',
    'requested by {name}': '{name} द्वारा अनुरोध गरिएको',
    'Reject': 'अस्वीकार गर्नुहोस्',

    # ---- queues/ReportsToRelease.tsx ----
    'Reports to sign & release': 'हस्ताक्षर गरी जारी गर्नुपर्ने रिपोर्टहरू',
    'Generated and waiting on your electronic signature.': 'तयार भएको र तपाईंको इलेक्ट्रोनिक हस्ताक्षरको पर्खाइमा।',
    'No reports are waiting on release.': 'जारी गर्नुपर्ने कुनै रिपोर्ट छैन।',
    'Signing credentials (e.g. "MD Pathology, NMC-12345"):':
        'हस्ताक्षर गर्ने प्रमाण (जस्तै: "MD Pathology, NMC-12345"):',
    'Report signed & released': 'रिपोर्ट हस्ताक्षर गरी जारी गरियो',
    'Unable to release report': 'रिपोर्ट जारी गर्न सकिएन',
    'Sign & release': 'हस्ताक्षर गरी जारी गर्नुहोस्',
    'Preliminary': 'प्रारम्भिक',

    # ---- queues/ResultsToAuthorize.tsx ----
    'Verified and ready for your final sign-off.': 'प्रमाणित भई तपाईंको अन्तिम स्वीकृतिका लागि तयार छ।',
    'Nothing is waiting on authorization.': 'स्वीकृतिको पर्खाइमा केही छैन।',
    'Result authorized': 'नतिजा स्वीकृत भयो',
    'Enter a documented reason to authorize anyway:': 'जे भए पनि स्वीकृत गर्न लिखित कारण लेख्नुहोस्:',
    'Result authorized with override': 'ओभरराइड गरी नतिजा स्वीकृत गरियो',
    'Unable to authorize': 'स्वीकृत गर्न सकिएन',
    'Authorize': 'स्वीकृत गर्नुहोस्',

    # ---- queues/ResultsToEnter.tsx ----
    'Received samples waiting on values.': 'मान प्रविष्टिको पर्खाइमा रहेका प्राप्त नमूनाहरू।',
    'No results are waiting on entry.': 'प्रविष्टिको पर्खाइमा कुनै नतिजा छैन।',
    'Overdue': 'ढिलो',
    'Enter': 'प्रविष्ट गर्नुहोस्',

    # ---- queues/ResultsToVerify.tsx ----
    'Entered values ready for technician sign-off.': 'प्रविष्ट गरिएका मानहरू प्राविधिकको स्वीकृतिका लागि तयार छन्।',
    'Nothing is waiting on verification.': 'प्रमाणीकरणको पर्खाइमा केही छैन।',
    'Result verified': 'नतिजा प्रमाणित भयो',
    'Enter a documented reason to verify it yourself:': 'आफैं प्रमाणित गर्न लिखित कारण लेख्नुहोस्:',
    'Result verified with override': 'ओभरराइड गरी नतिजा प्रमाणित गरियो',
    'Unable to verify': 'प्रमाणित गर्न सकिएन',
    'Failed': 'असफल भयो',

    # ---- queues/SamplesToCollect.tsx (SPECIMEN_LABELS values already provided by i18n-dict-samples.py) ----
    'Ordered and waiting on a phlebotomy draw.': 'अर्डर भई नमूना संकलनको पर्खाइमा।',
    'Every ordered sample has been collected.': 'अर्डर गरिएका सबै नमूना सङ्कलन भइसकेको छ।',
    'Sample marked collected': 'नमूना सङ्कलन भएको चिन्ह लगाइयो',
    'Enter a reason to collect without payment:': 'भुक्तानी बिना सङ्कलन गर्ने कारण लेख्नुहोस्:',
    'Sample collected without payment': 'भुक्तानी बिना नमूना सङ्कलन गरियो',
    'Unable to collect sample': 'नमूना सङ्कलन गर्न सकिएन',
    '{specimen} · {count} test(s) · ordered {time}': '{specimen} · {count} परीक्षण · {time} अर्डर भयो',
    'Collect': 'सङ्कलन गर्नुहोस्',

    # ---- queues/SamplesToReceive.tsx ----
    'Collected and in transit — log them in to open the result worklist.':
        'सङ्कलन भई ढुवानीमा — नतिजा सूची खोल्न यिनलाई लग-इन गर्नुहोस्।',
    'No samples are waiting to be received.': 'प्राप्त गर्नुपर्ने कुनै नमूना छैन।',
    '{specimen} · {count} test(s) · collected {time}': '{specimen} · {count} परीक्षण · {time} सङ्कलन भयो',
    'Receive': 'प्राप्त गर्नुहोस्',

    # ---- queues/TodaysAppointments.tsx ----
    'Scheduled visits still waiting on check-in.': 'चेक-इनको पर्खाइमा रहेका तालिकाबद्ध भेटहरू।',
    'No appointments left to check in today.': 'आज चेक-इन गर्नुपर्ने कुनै अपोइन्टमेन्ट बाँकी छैन।',

    # ---- queues/QueueShell.tsx (default emptyMessage) ----
    'Nothing here right now.': 'अहिले यहाँ केही छैन।',

    # ---- role dashboards: subtitle / StatTileRow label / SectionHeader title strings ----
    'Invoices, refunds and e-billing at a glance.': 'बिल, फिर्ता र ई-बिलिङको झलक।',
    'Outstanding balance': 'बाँकी रकम',
    'Failed IRD submissions': 'असफल IRD पेशहरू',
    "Here's what needs attention across your laboratory today.": 'आज तपाईंको प्रयोगशालामा ध्यान दिनुपर्ने कुराहरू यहाँ छन्।',
    "Today's specimens to draw from patients.": 'आज बिरामीबाट सङ्कलन गर्नुपर्ने नमूनाहरू।',
    'Recent lab orders and reports.': 'हालैका ल्याब अर्डर र रिपोर्टहरू।',
    'Recent orders': 'हालैका अर्डरहरू',
    'Recent reports': 'हालैका रिपोर्टहरू',
    'Critical results, pending authorizations and reports to sign.': 'गम्भीर नतिजा, बाँकी स्वीकृति र हस्ताक्षर गर्नुपर्ने रिपोर्टहरू।',
    'Critical, unacknowledged': 'गम्भीर, अस्वीकृत बाँकी',
    'Awaiting authorization': 'स्वीकृतिको पर्खाइमा',
    'Reports today': 'आजका रिपोर्टहरू',
    'Registrations, draft orders and billing waiting on the front desk.': 'रिसेप्सनमा पर्खिरहेका दर्ता, मस्यौदा अर्डर र बिलिङ।',
    "Today's patients": 'आजका बिरामीहरू',
    'Samples to receive and results to enter or verify.': 'प्राप्त गर्नुपर्ने नमूना र प्रविष्ट वा प्रमाणित गर्नुपर्ने नतिजाहरू।',
    'Awaiting verification': 'प्रमाणीकरणको पर्खाइमा',
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
