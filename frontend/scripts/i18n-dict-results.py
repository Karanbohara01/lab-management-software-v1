import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # ---- results queue / entry chrome -----------------------------------------------------
    'Accession': 'एक्सेसन',
    'Department worklist — enter, verify and approve test results.': 'विभागीय कार्यसूची — परीक्षण नतिजा प्रविष्ट, प्रमाणित र स्वीकृत गर्नुहोस्।',
    'Search test, patient or MRN': 'परीक्षण, बिरामी वा MRN खोज्नुहोस्',
    'Overdue': 'ढिलो',
    'Overdue only': 'ढिलो मात्र',
    'Callback due': 'कलब्याक बाँकी',
    'Callback pending': 'कलब्याक पर्खिरहेको',
    'Auto': 'स्वयं',
    'Abn': 'असामान्य',
    'Culture': 'कल्चर',
    'Nothing in this queue': 'यो लाइनमा केही छैन',
    'Results appear here once a sample is received into the lab.': 'प्रयोगशालामा नमूना प्राप्त भएपछि नतिजा यहाँ देखिन्छ।',
    'Loading result…': 'नतिजा लोड हुँदैछ…',
    '{code} · {department} · Order {order}': '{code} · {department} · अर्डर {order}',
    'Critical value': 'गम्भीर मान',

    # ---- result entry page: alerts & status -----------------------------------------------
    'Auto-verified': 'स्वयं प्रमाणित',
    'All values were normal and in range with no delta breach, so this result was verified automatically. A pathologist still approves it.':
      'सबै मान सामान्य र दायरा भित्र थिए, डेल्टा उल्लङ्घन पनि भएन, त्यसैले यो नतिजा स्वचालित रूपमा प्रमाणित भयो। पेथोलोजिस्टले अझै स्वीकृत गर्नुपर्छ।',
    'Specimen condition': 'नमूनाको अवस्था',
    'This is recorded and printed on the report.': 'यो रेकर्ड गरिन्छ र रिपोर्टमा प्रिन्ट हुन्छ।',
    'Delta check flagged': 'डेल्टा जाँचमा सङ्केत देखियो',
    "One or more values changed sharply from this patient's previous result. Review before verifying.":
      'यो बिरामीको अघिल्लो नतिजाभन्दा एक वा बढी मानमा ठूलो फरक देखियो। प्रमाणित गर्नुअघि जाँच्नुहोस्।',
    'Critical-value callback required': 'गम्भीर मान कलब्याक आवश्यक',
    'This approved result has a critical value that has not yet been communicated with read-back.':
      'यो स्वीकृत नतिजामा गम्भीर मान छ जो अझै रीड-ब्याकसहित सूचित गरिएको छैन।',
    'Log the callback': 'कलब्याक लग गर्नुहोस्',
    'Critical-value callbacks': 'गम्भीर मान कलब्याकहरू',
    'Waived — {reason}': 'छोडियो — {reason}',
    'Notified {name} via {method}': '{method} मार्फत {name} लाई सूचित गरियो',
    'read-back confirmed': 'रीड-ब्याक पुष्टि भयो',
    'Critical value present': 'गम्भीर मान विद्यमान',
    "One or more parameters are outside the critical range. Follow your laboratory's critical-value notification protocol.":
      'एक वा बढी प्यारामिटर गम्भीर दायराभन्दा बाहिर छन्। आफ्नो प्रयोगशालाको गम्भीर-मान सूचना प्रक्रिया पछ्याउनुहोस्।',
    'Returned for correction': 'सुधारका लागि फिर्ता गरियो',

    # ---- result entry page: parameters table -----------------------------------------------
    'Parameters': 'प्यारामिटरहरू',
    'calculated': 'गणना गरिएको',
    'note (optional)': 'नोट (वैकल्पिक)',
    'Add note for {name}': '{name} का लागि नोट थप्नुहोस्',
    'Insert a standard comment…': 'स्ट्यान्डर्ड टिप्पणी थप्नुहोस्…',
    'Comment / interpretation': 'टिप्पणी / व्याख्या',
    'Result history': 'नतिजाको इतिहास',

    # ---- result entry page: actions / workflow ---------------------------------------------
    'Save results': 'नतिजाहरू सुरक्षित गर्नुहोस्',
    'Results saved': 'नतिजाहरू सुरक्षित भयो',
    'Unable to save results': 'नतिजा सुरक्षित गर्न सकिएन',
    'Enter culture findings in the panel on the left, then verify.': 'देब्रेतिरको प्यानलमा कल्चर नतिजा प्रविष्ट गरी प्रमाणित गर्नुहोस्।',
    'Result verified': 'नतिजा प्रमाणित भयो',
    'Result verified with override': 'ओभरराइडसहित नतिजा प्रमाणित भयो',
    'Enter a documented reason to verify it yourself:': 'आफैं प्रमाणित गर्न अभिलिखित कारण लेख्नुहोस्:',
    'Result approved': 'नतिजा स्वीकृत भयो',
    'Result approved with QC override': 'QC ओभरराइडसहित नतिजा स्वीकृत भयो',
    'Enter a documented reason to approve despite the QC failure:': 'QC असफल भए पनि स्वीकृत गर्न अभिलिखित कारण लेख्नुहोस्:',
    'Action failed': 'कार्य असफल भयो',
    'Sent back for correction': 'सुधार्न फिर्ता पठाइयो',
    'Unable to send back': 'फिर्ता पठाउन सकिएन',
    'Amend approved result': 'स्वीकृत नतिजा संशोधन गर्नुहोस्',
    'Workflow': 'कार्यप्रवाह',
    'Amended': 'संशोधन गरिएको',
    'Send back for correction?': 'सुधार्न फिर्ता पठाउने?',
    'The result returns to the technician for re-entry.': 'नतिजा पुनः प्रविष्टिका लागि प्राविधिककहाँ फिर्ता जान्छ।',
    'Send back': 'फिर्ता पठाउनुहोस्',

    # ---- amend result modal -----------------------------------------------------------------
    'Amend approved result · {code}': 'स्वीकृत नतिजा संशोधन · {code}',
    'Changes are recorded in the result history with your reason.': 'परिवर्तनहरू तपाईंको कारणसहित नतिजाको इतिहासमा दर्ता हुन्छन्।',
    'Amend result': 'नतिजा संशोधन गर्नुहोस्',
    'Reason for amendment': 'संशोधनको कारण',
    'An amendment reason is required.': 'संशोधनको कारण आवश्यक छ।',
    'Result amended': 'नतिजा संशोधन भयो',
    'Unable to amend result': 'नतिजा संशोधन गर्न सकिएन',

    # ---- critical callback modal ------------------------------------------------------------
    'Critical-value callback · {code}': 'गम्भीर मान कलब्याक · {code}',
    'A critical value must be communicated to the treating clinician / ward with read-back confirmation.':
      'गम्भीर मान उपचार गर्ने चिकित्सक / वार्डलाई रीड-ब्याक पुष्टिसहित जानकारी गराउनुपर्छ।',
    'Log callback': 'कलब्याक लग',
    'Waive': 'छोड्नुहोस्',
    'Notified person': 'सूचित गरिएको व्यक्ति',
    'Role / designation': 'भूमिका / पद',
    'e.g. Ward nurse, Dr on call': 'जस्तै: वार्ड नर्स, ड्युटीमा रहेका डाक्टर',
    'Contact method': 'सम्पर्क माध्यम',
    'Read-back confirmed': 'रीड-ब्याक पुष्टि भयो',
    'Remarks (optional)': 'टिप्पणी (वैकल्पिक)',
    'Reason for waiving the callback': 'कलब्याक छोड्ने कारण',
    'Record callback': 'कलब्याक दर्ता गर्नुहोस्',
    'Waive requirement': 'आवश्यकता छोड्नुहोस्',
    'Callback requirement waived': 'कलब्याक आवश्यकता छोडियो',
    'Critical-value callback recorded': 'गम्भीर मान कलब्याक दर्ता भयो',
    'Unable to record callback': 'कलब्याक दर्ता गर्न सकिएन',
    'Phone call': 'फोन कल',
    'In person': 'व्यक्तिगत रूपमा',
    'SMS': 'SMS',

    # ---- culture entry form (UI chrome only — see code comments for the clinical carve-out) -
    'Culture & sensitivity': 'कल्चर तथा सेन्सिटिभिटी',
    'No culture result entered yet.': 'अहिलेसम्म कल्चर नतिजा प्रविष्ट गरिएको छैन।',
    'Growth outcome': 'वृद्धि नतिजा',
    'No growth': 'वृद्धि भएन',
    'Normal flora': 'सामान्य फ्लोरा',
    'Mixed flora (contamination)': 'मिश्रित फ्लोरा (दूषण)',
    'Significant growth': 'उल्लेखनीय वृद्धि',
    'Add the organism(s) isolated from this specimen.': 'यो नमूनाबाट फेला परेको जीवाणु(हरू) थप्नुहोस्।',
    'Isolate {n}': 'आइसोलेट {n}',
    'Remove isolate {n}': 'आइसोलेट {n} हटाउनुहोस्',
    'Organism': 'जीवाणु',
    'Colony count': 'कलोनी सङ्ख्या',
    'Significance': 'महत्व',
    'Antibiotic susceptibility': 'एन्टिबायोटिक सेन्सिटिभिटी',
    'Antibiotic': 'एन्टिबायोटिक',
    'Zone (mm)': 'जोन (mm)',
    'zone {value} mm': 'जोन {value} mm',
    'MIC {value}': 'MIC {value}',
    'Remove antibiotic': 'एन्टिबायोटिक हटाउनुहोस्',
    'Add antibiotic': 'एन्टिबायोटिक थप्नुहोस्',
    'Isolate note': 'आइसोलेट नोट',
    'Add isolate': 'आइसोलेट थप्नुहोस्',
    'Save culture result': 'कल्चर नतिजा सुरक्षित गर्नुहोस्',
    'Culture result saved': 'कल्चर नतिजा सुरक्षित भयो',
    'Unable to save culture result': 'कल्चर नतिजा सुरक्षित गर्न सकिएन',
    'Select antibiotic…': 'एन्टिबायोटिक छान्नुहोस्…',

    # ---- status labels looked up dynamically (RESULT_STATUS_LABEL in types.ts) -------------
    'Awaiting verification': 'प्रमाणीकरण पर्खँदै',
    'Awaiting approval': 'स्वीकृति पर्खँदै',
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
