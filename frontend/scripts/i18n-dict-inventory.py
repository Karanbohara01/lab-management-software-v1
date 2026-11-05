import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    # types.ts label maps (CATEGORY_LABEL / STOCK_STATUS_LABEL) — out of scope to edit directly,
    # but their English values are now wrapped in t() at each call site, so need entries here.
    'Reagent': 'रिएजेन्ट',
    'Test kit': 'परीक्षण किट',
    'Chemical': 'रासायनिक पदार्थ',
    'Control': 'कन्ट्रोल',
    'Calibrator': 'क्यालिब्रेटर',
    'Consumable': 'उपभोग्य सामग्री',
    'Glassware': 'गिलास सामान',
    'Expired stock': 'म्याद सकिएको स्टक',
    'Out of stock': 'स्टक सकियो',
    'Low stock': 'कम स्टक',
    'Expiring soon': 'म्याद सकिन लागेको',
    'In stock': 'स्टकमा छ',

    # InventoryItemDetailPage.tsx
    'Loading item…': 'सामग्री लोड हुँदैछ…',
    'Batch discarded': 'ब्याच खारेज भयो',
    'Unable to discard': 'खारेज गर्न सकिएन',
    'Issue': 'निकासा',
    'Receive': 'प्राप्त गर्नुहोस्',
    'On hand': 'मौज्दात',
    'Minimum': 'न्यूनतम',
    'Batches': 'ब्याचहरू',
    'Batch': 'ब्याच',
    'Expiry': 'म्याद',
    'Remaining': 'बाँकी',
    'No batches — receive stock to add one.': 'कुनै ब्याच छैन — थप्न स्टक प्राप्त गर्नुहोस्।',
    'Stock movements': 'स्टक चालहरू',
    'No movements yet.': 'अहिलेसम्म कुनै चाल भएको छैन।',
    'bal {balance}': 'बाँकी {balance}',
    'Discard batch {batch}': 'ब्याच {batch} खारेज गर्नुहोस्',
    'Discard batch {batch}?': 'ब्याच {batch} खारेज गर्ने?',
    'Discard batch': 'ब्याच खारेज गर्नुहोस्',
    'The full remaining quantity is written off as wastage. This cannot be undone.':
        'बाँकी रहेको पूरै मात्रा बर्बादीको रूपमा मेटाइनेछ। यो फिर्ता हुन सक्दैन।',
    # stock transaction type labels
    'Receipt': 'प्राप्ति',
    'Adjustment': 'समायोजन',
    'Wastage': 'बर्बादी',
    'Return': 'फिर्ता',

    # InventoryModals.tsx
    'Edit {code}': '{code} सम्पादन गर्नुहोस्',
    'New inventory item': 'नयाँ भण्डार सामग्री',
    'Create item': 'सामग्री बनाउनुहोस्',
    'Item updated': 'सामग्री अपडेट भयो',
    'Item created': 'सामग्री बनाइयो',
    'Code': 'कोड',
    'mL, tests, pcs, box': 'mL, परीक्षण, pcs, बक्स',
    'Minimum stock': 'न्यूनतम स्टक',
    'Receive stock · {code}': 'स्टक प्राप्ति · {code}',
    'Stock received': 'स्टक प्राप्त भयो',
    'Batch / lot number': 'ब्याच / लट नम्बर',
    'Supplier': 'आपूर्तिकर्ता',
    'Not specified': 'उल्लेख नभएको',
    'Received date': 'प्राप्त मिति',
    'Expiry date': 'म्याद सकिने मिति',
    'Quantity ({unit})': 'सङ्ख्या ({unit})',
    'Unit cost (NPR)': 'एकाइ मूल्य (NPR)',
    'Reference (invoice / GRN no.)': 'सन्दर्भ (बिल / GRN नं.)',
    'Issue stock · {code}': 'स्टक निकासा · {code}',
    '{qty} {unit} on hand · consumed first-expiry-first-out': '{qty} {unit} मौज्दात · पहिले म्याद सकिने पहिले निकासा (FEFO)',
    'Stock issued': 'स्टक निकासा भयो',
    'Reason / purpose': 'कारण / उद्देश्य',

    # InventoryPage.tsx
    'Item': 'सामग्री',
    '/ min {min}': '/ न्यून {min}',
    'Reagents, kits and consumables — batches, stock levels and expiry.':
        'रिएजेन्ट, किट र उपभोग्य सामग्री — ब्याच, स्टक स्तर र म्याद।',
    'New item': 'नयाँ सामग्री',
    '{count} item(s) need attention': '{count} सामग्रीमा ध्यान दिनुपर्छ',
    'Search by name or code': 'नाम वा कोडबाट खोज्नुहोस्',
    'No items': 'कुनै सामग्री छैन',
    'Adjust the filters.': 'फिल्टर मिलाउनुहोस्।',
    'Add your first inventory item.': 'पहिलो भण्डार सामग्री थप्नुहोस्।',

    # PurchaseOrderDetailPage.tsx (and shared with PurchaseOrdersPage.tsx: status labels below)
    'expected {date}': 'अनुमानित {date}',
    'Submit': 'पेश गर्नुहोस्',
    'Purchase order submitted': 'खरिद आदेश पेश भयो',
    'Lines': 'लाइनहरू',
    'Ordered': 'अर्डर गरिएको',
    'Est. cost': 'अनुमानित मूल्य',
    'Cancel this purchase order?': 'यो खरिद आदेश रद्द गर्ने?',
    'Already-received stock stays in inventory. Outstanding lines are cancelled.':
        'पहिले नै प्राप्त भएको स्टक भण्डारमा रहिरहन्छ। बाँकी लाइनहरू रद्द हुनेछन्।',
    'Cancel PO': 'PO रद्द गर्नुहोस्',
    'Purchase order cancelled': 'खरिद आदेश रद्द भयो',
    # PO status labels (local maps in PurchaseOrderDetailPage.tsx and PurchaseOrdersPage.tsx)
    'Submitted': 'पेश गरिएको',
    'Partially received': 'आंशिक प्राप्त',

    # PurchaseOrderModals.tsx
    'Select a supplier.': 'आपूर्तिकर्ता छान्नुहोस्।',
    'Add at least one line.': 'कम्तीमा एक लाइन थप्नुहोस्।',
    'Purchase order updated': 'खरिद आदेश अपडेट भयो',
    'Draft {po} created': 'मस्यौदा {po} बनाइयो',
    'Unable to save': 'सुरक्षित गर्न सकिएन',
    'New purchase order': 'नयाँ खरिद आदेश',
    'Create draft': 'मस्यौदा बनाउनुहोस्',
    'Select…': 'छान्नुहोस्…',
    'Expected date': 'अनुमानित मिति',
    'Items': 'सामग्रीहरू',
    'Search inventory items to add': 'थप्न भण्डार सामग्री खोज्नुहोस्',
    'Added': 'थपियो',
    'Qty ({unit})': 'मात्रा ({unit})',
    'Remove {name}': '{name} हटाउनुहोस्',
    'Enter a batch number and quantity for at least one line.':
        'कम्तीमा एक लाइनमा ब्याच नम्बर र मात्रा लेख्नुहोस्।',
    'Unable to receive': 'प्राप्त गर्न सकिएन',
    'Receive against {number}': '{number} अन्तर्गत प्राप्त गर्नुहोस्',
    'Receive stock': 'स्टक प्राप्त गर्नुहोस्',
    'Ordered {qty} {unit} · received {received}': 'अर्डर {qty} {unit} · प्राप्त {received}',
    'Batch no.': 'ब्याच नं.',
    'Unit cost': 'एकाइ मूल्य',

    # PurchaseOrdersPage.tsx
    'Order stock from suppliers and receive it into inventory.':
        'आपूर्तिकर्ताबाट स्टक अर्डर गर्नुहोस् र भण्डारमा प्राप्त गर्नुहोस्।',
    'New PO': 'नयाँ PO',
    'PO': 'PO',
    'Expected': 'अनुमानित मिति',
    'Search PO no. or supplier': 'PO नं. वा आपूर्तिकर्ताबाट खोज्नुहोस्',
    'No purchase orders': 'कुनै खरिद आदेश छैन',
    'Create a PO to order stock.': 'स्टक अर्डर गर्न PO बनाउनुहोस्।',

    # SuppliersPage.tsx
    'Vendors that supply reagents, kits and consumables.':
        'रिएजेन्ट, किट र उपभोग्य सामग्री आपूर्ति गर्ने विक्रेताहरू।',
    'New supplier': 'नयाँ आपूर्तिकर्ता',
    'Search suppliers': 'आपूर्तिकर्ता खोज्नुहोस्',
    'No suppliers': 'कुनै आपूर्तिकर्ता छैन',
    'Add a supplier to record purchases.': 'खरिद दर्ता गर्न आपूर्तिकर्ता थप्नुहोस्।',
    'Edit supplier': 'आपूर्तिकर्ता सम्पादन',
    'Add supplier': 'आपूर्तिकर्ता थप्नुहोस्',
    'Supplier updated': 'आपूर्तिकर्ता अपडेट भयो',
    'Supplier added': 'आपूर्तिकर्ता थपियो',
    'Contact person': 'सम्पर्क व्यक्ति',
    'PAN number': 'PAN नम्बर',
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
