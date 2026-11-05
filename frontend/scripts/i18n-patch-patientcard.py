import pathlib

p = pathlib.Path('src/features/patients/PatientCard.tsx')
s = p.read_text(encoding='utf-8')
missing = []


def rep(old, new):
    global s
    if old not in s:
        missing.append(old[:100])
        return
    s = s.replace(old, new, 1)


rep(
    "import { bloodGroupLabel, categoryLabel } from './constants';",
    "import { bloodGroupLabel, categoryLabel } from './constants';\nimport { translate, getLocale } from '@/i18n';",
)

rep(
    "export function PatientCard({ patient, labName }: { patient: PatientDetail; labName?: string }) {\n"
    "  const [qrDataUri, setQrDataUri] = useState<string | null>(null);",
    "export function PatientCard({ patient, labName }: { patient: PatientDetail; labName?: string }) {\n"
    "  const [qrDataUri, setQrDataUri] = useState<string | null>(null);\n"
    "  const t = (key: string, vars?: Record<string, string | number>) => translate(getLocale(), key, vars);",
)

rep(
    "  const age =\n"
    "    patient.ageYears != null\n"
    "      ? `${patient.ageYears} yrs`\n"
    "      : patient.approximateAgeYears != null\n"
    "        ? `~${patient.approximateAgeYears} yrs`\n"
    "        : null;",
    "  const age =\n"
    "    patient.ageYears != null\n"
    "      ? t('{age} yrs', { age: patient.ageYears })\n"
    "      : patient.approximateAgeYears != null\n"
    "        ? t('~{age} yrs', { age: patient.approximateAgeYears })\n"
    "        : null;",
)

rep(
    '            <p className="text-sm font-bold uppercase tracking-wide text-white">{labName || \'Laboratory\'}</p>\n'
    '            <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-100">Patient card</span>',
    "            <p className=\"text-sm font-bold uppercase tracking-wide text-white\">{labName || t('Laboratory')}</p>\n"
    "            <span className=\"text-[10px] font-semibold uppercase tracking-wide text-sky-100\">{t('Patient card')}</span>",
)

rep(
    '            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">Patient</p>',
    "            <p className=\"text-[10px] font-semibold uppercase tracking-wide text-gray-500\">{t('Patient')}</p>",
)

rep(
    '                <p className="text-[10px] font-semibold uppercase tracking-wide text-sky-700">Medical record no.</p>',
    "                <p className=\"text-[10px] font-semibold uppercase tracking-wide text-sky-700\">{t('Medical record no.')}</p>",
)

rep(
    '            <p className="mt-1 text-right text-xs text-gray-500">Scan to view record</p>',
    "            <p className=\"mt-1 text-right text-xs text-gray-500\">{t('Scan to view record')}</p>",
)

rep(
    '              <LabelValue label="Phone" value={patient.phone || \'—\'} />\n'
    '              <LabelValue label="Category" value={categoryLabel(patient.category)} />\n'
    "              <LabelValue\n"
    '                label="Referred by"\n'
    "                value={patient.referringDoctorName || patient.referralSourceName || 'Self'}\n"
    "              />\n"
    '              <LabelValue label="Registered" value={formatDate(patient.createdAt)} />\n'
    '              <LabelValue label="Address" value={formatAddress(patient.address) || \'—\'} full />',
    "              <LabelValue label={t('Phone')} value={patient.phone || '—'} />\n"
    "              <LabelValue label={t('Category')} value={categoryLabel(patient.category)} />\n"
    "              <LabelValue\n"
    "                label={t('Referred by')}\n"
    "                value={patient.referringDoctorName || patient.referralSourceName || t('Self')}\n"
    "              />\n"
    "              <LabelValue label={t('Registered')} value={formatDate(patient.createdAt)} />\n"
    "              <LabelValue label={t('Address')} value={formatAddress(patient.address) || '—'} full />",
)

rep(
    '                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">\n'
    "                    Emergency contact\n"
    "                  </p>",
    '                  <p className="text-[10px] font-semibold uppercase tracking-wide text-amber-700">\n'
    "                    {t('Emergency contact')}\n"
    "                  </p>",
)

rep(
    '            <p className="mt-3 border-t border-gray-200 pt-2 text-xs leading-snug text-gray-500">\n'
    "              Please bring this card on every visit and quote the MRN above for all enquiries.\n"
    "            </p>",
    '            <p className="mt-3 border-t border-gray-200 pt-2 text-xs leading-snug text-gray-500">\n'
    "              {t('Please bring this card on every visit and quote the MRN above for all enquiries.')}\n"
    "            </p>",
)

if missing:
    print('MISSING', len(missing), 'anchors:')
    for m in missing:
        print('  -', m)
else:
    p.write_text(s, encoding='utf-8')
    print('PatientCard.tsx fully patched, no misses')
