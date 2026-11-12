import pathlib

p = pathlib.Path('src/i18n/ne.ts')
s = p.read_text(encoding='utf-8')
assert s.rstrip().endswith('};')

additions = {
    'Loading purchase order…': 'खरिद आदेश लोड हुँदैछ…',
    'Refresh dashboard data': 'ड्यासबोर्ड डाटा ताजा गर्नुहोस्',
    'Updated {time}': '{time} मा अपडेट भयो',
    "The shared taxpayer login used to file subscription invoices (what this deployment charges each clinic) with IRD — separate from any clinic's own patient-billing credentials.":
        'यो डिप्लोइमेन्टले हरेक क्लिनिकसँग लिने सदस्यता बिल IRD मा पेश गर्न प्रयोग हुने साझा करदाता लगइन — कुनै पनि क्लिनिकको आफ्नै बिरामी-बिलिङ क्रेडेन्शियलभन्दा फरक।',
    'This bill was already filed with IRD before the invoice was cancelled — a credit note must be filed to reverse it.':
        'बिल रद्द हुनुअघि नै यो IRD मा पेश भइसकेको थियो — यसलाई उल्टाउन क्रेडिट नोट पेश गर्नुपर्छ।',
    "This clinic's billing period has never been started — no subscription invoice will ever be issued until one is. Onboarding via the admin dashboard deliberately leaves this open-ended (for negotiated/sales-assisted signups); set a period end below, or use the quick action.":
        'यो क्लिनिकको बिलिङ अवधि कहिल्यै सुरु भएको छैन — नसुरु नभएसम्म कुनै सदस्यता बिल जारी हुँदैन। प्रशासक ड्यासबोर्डबाट अनबोर्डिङ जानाजानी यसलाई खुला राख्छ (वार्ता/सेल्स-सहयोगी साइनअपका लागि); तल अवधि अन्त्य मिति सेट गर्नुहोस्, वा छिटो कार्य प्रयोग गर्नुहोस्।',
    'This registers the clinic, starts a subscription, and gives it its own isolated data, default letterhead settings, and a first Lab Administrator login — share those credentials with them, or have them reset the password after their first sign-in.':
        'यसले क्लिनिक दर्ता गर्छ, सदस्यता सुरु गर्छ, र यसलाई आफ्नै अलग डाटा, पूर्वनिर्धारित लेटरहेड सेटिङ, र पहिलो प्रयोगशाला प्रशासक लगइन दिन्छ — ती क्रेडेन्शियल उनीहरूसँग साझा गर्नुहोस्, वा पहिलो पटक साइन-इन गरेपछि पासवर्ड रिसेट गर्न लगाउनुहोस्।',
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
