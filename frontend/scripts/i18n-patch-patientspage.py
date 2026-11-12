import pathlib

p = pathlib.Path('src/features/patients/PatientsPage.tsx')
s = p.read_text(encoding='utf-8')

def rep(old, new):
    global s
    assert old in s, f"MISSING: {old[:90]!r}"
    s = s.replace(old, new, 1)

rep(
    "import { PATIENT_CATEGORIES, categoryLabel } from './constants';\nimport { formatAge } from './format';",
    "import { PATIENT_CATEGORIES, categoryLabel, tOpts } from './constants';\nimport { formatAge } from './format';\nimport { useT } from '@/i18n';",
)

rep(
    "export function PatientsPage() {\n  const navigate = useNavigateFrom();",
    "export function PatientsPage() {\n  const t = useT();\n  const navigate = useNavigateFrom();",
)

rep(
    "  const columns: Column<PatientListItem>[] = [\n"
    "    { key: 'mrn', header: 'MRN', cell: (p) => <span className=\"font-mono text-xs text-muted\">{p.mrn}</span> },",
    "  const columns: Column<PatientListItem>[] = [\n"
    "    { key: 'mrn', header: 'MRN', cell: (p) => <span className=\"font-mono text-xs text-muted\">{p.mrn}</span> },",
)

rep(
    "      header: 'Name',",
    "      header: t('Name'),",
)
rep(
    "    { key: 'demo', header: 'Age / Sex', cell: (p) => `${formatAge(p.ageYears)} · ${p.gender[0]}` },\n"
    "    { key: 'phone', header: 'Phone', cell: (p) => p.phone ?? '—', hideOnMobile: true },\n"
    "    {\n"
    "      key: 'category',\n"
    "      header: 'Category',\n"
    "      cell: (p) => <span className=\"text-sm text-muted\">{categoryLabel(p.category)}</span>,\n"
    "      hideOnMobile: true,\n"
    "    },\n"
    "    { key: 'doctor', header: 'Referred by', cell: (p) => p.referringDoctorName ?? '—', hideOnMobile: true },\n"
    "    {\n"
    "      key: 'status',\n"
    "      header: 'Status',\n"
    "      cell: (p) =>\n"
    "        p.deceased ? (\n"
    "          <Badge tone=\"neutral\">Deceased</Badge>\n"
    "        ) : (\n"
    "          <Badge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge>\n"
    "        ),\n"
    "    },\n"
    "  ];",
    "    { key: 'demo', header: t('Age / Sex'), cell: (p) => `${formatAge(p.ageYears)} · ${p.gender[0]}` },\n"
    "    { key: 'phone', header: t('Phone'), cell: (p) => p.phone ?? '—', hideOnMobile: true },\n"
    "    {\n"
    "      key: 'category',\n"
    "      header: t('Category'),\n"
    "      cell: (p) => <span className=\"text-sm text-muted\">{categoryLabel(p.category)}</span>,\n"
    "      hideOnMobile: true,\n"
    "    },\n"
    "    { key: 'doctor', header: t('Referred by'), cell: (p) => p.referringDoctorName ?? '—', hideOnMobile: true },\n"
    "    {\n"
    "      key: 'status',\n"
    "      header: t('Status'),\n"
    "      cell: (p) =>\n"
    "        p.deceased ? (\n"
    "          <Badge tone=\"neutral\">{t('Deceased')}</Badge>\n"
    "        ) : (\n"
    "          <Badge tone={p.active ? 'success' : 'neutral'}>{t(p.active ? 'Active' : 'Inactive')}</Badge>\n"
    "        ),\n"
    "    },\n"
    "  ];",
)

rep(
    '        title="Patients"\n'
    '        description="Register patients and open a longitudinal view of their orders, invoices and reports."',
    "        title={t('Patients')}\n"
    "        description={t('Register patients and open a longitudinal view of their orders, invoices and reports.')}",
)

rep(
    "                <Upload className=\"h-4 w-4\" aria-hidden />\n                Import patients\n              </Button>",
    "                <Upload className=\"h-4 w-4\" aria-hidden />\n                {t('Import patients')}\n              </Button>",
)
rep(
    "                <Plus className=\"h-4 w-4\" aria-hidden />\n                Register patient\n              </Button>",
    "                <Plus className=\"h-4 w-4\" aria-hidden />\n                {t('Register patient')}\n              </Button>",
)

rep(
    '              placeholder="Search by name, MRN, phone or email"',
    "              placeholder={t('Search by name, MRN, phone or email')}",
)
rep(
    '            aria-label="Filter by category"\n'
    '            className="sm:w-52"\n'
    "            options={[{ value: '', label: 'All categories' }, ...PATIENT_CATEGORIES]}",
    "            aria-label={t('Filter by category')}\n"
    "            className=\"sm:w-52\"\n"
    "            options={[{ value: '', label: t('All categories') }, ...tOpts(PATIENT_CATEGORIES)]}",
)

rep(
    '            title="No patients found"\n'
    "            message={\n"
    "              params.q || params.category ? 'Try a different search or filter.' : 'Register the first patient to get started.'\n"
    "            }\n"
    "            action={\n"
    "              canWrite && !params.q && !params.category ? (\n"
    '                <Button onClick={() => navigate(\'/app/patients/new\')}>Register patient</Button>\n'
    "              ) : undefined\n"
    "            }",
    "            title={t('No patients found')}\n"
    "            message={\n"
    "              params.q || params.category\n"
    "                ? t('Try a different search or filter.')\n"
    "                : t('Register the first patient to get started.')\n"
    "            }\n"
    "            action={\n"
    "              canWrite && !params.q && !params.category ? (\n"
    "                <Button onClick={() => navigate('/app/patients/new')}>{t('Register patient')}</Button>\n"
    "              ) : undefined\n"
    "            }",
)

p.write_text(s, encoding='utf-8')
print('PatientsPage.tsx patched')
