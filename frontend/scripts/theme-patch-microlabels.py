import pathlib

ROOT = pathlib.Path('src')
missing = []
patched = []


def rep(relpath, old, new):
    p = ROOT / relpath
    s = p.read_text(encoding='utf-8')
    if old not in s:
        missing.append((relpath, old[:90]))
        return
    s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    patched.append(relpath)


# --- genuine micro-label / small-uppercase-heading role -> text-label uppercase text-muted ---

rep(
    'components/layout/CommandSearch.tsx',
    '<p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">',
    '<p className="px-4 pb-1 text-label uppercase text-muted">',
)

rep(
    'components/layout/Sidebar.tsx',
    'className="group flex w-full items-center justify-between rounded-md px-3 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wider text-muted hover:text-muted-foreground"',
    'className="group flex w-full items-center justify-between rounded-md px-3 pb-1.5 pt-1 text-label uppercase text-muted hover:text-muted-foreground"',
)

rep(
    'features/signup/SignupPage.tsx',
    '<p className="text-xs font-semibold uppercase tracking-wide text-muted">{t(\'Your laboratory\')}</p>',
    '<p className="text-label uppercase text-muted">{t(\'Your laboratory\')}</p>',
)
rep(
    'features/signup/SignupPage.tsx',
    '<p className="text-xs font-semibold uppercase tracking-wide text-muted">{t(\'Plan\')}</p>',
    '<p className="text-label uppercase text-muted">{t(\'Plan\')}</p>',
)
rep(
    'features/signup/SignupPage.tsx',
    '<p className="text-xs font-semibold uppercase tracking-wide text-muted">{t(\'Your admin login\')}</p>',
    '<p className="text-label uppercase text-muted">{t(\'Your admin login\')}</p>',
)

rep(
    'components/layout/KeyboardShortcutsModal.tsx',
    '<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t(\'General\')}</h3>',
    '<h3 className="mb-2 text-label uppercase text-muted">{t(\'General\')}</h3>',
)
rep(
    'components/layout/KeyboardShortcutsModal.tsx',
    '<h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t(\'Go to\')}</h3>',
    '<h3 className="mb-2 text-label uppercase text-muted">{t(\'Go to\')}</h3>',
)

rep(
    'features/orders/OrderBuilderPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/orders/OrderDetailPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)

rep(
    'features/platform/OrganizationDetailModal.tsx',
    '<span className="w-full text-xs font-medium uppercase tracking-wide text-muted">{t(\'Clinic status\')}</span>',
    '<span className="w-full text-label uppercase text-muted">{t(\'Clinic status\')}</span>',
)
rep(
    'features/platform/OrganizationDetailModal.tsx',
    '<span className="text-xs font-medium uppercase tracking-wide text-muted">{t(\'Change subscription\')}</span>',
    '<span className="text-label uppercase text-muted">{t(\'Change subscription\')}</span>',
)
rep(
    'features/platform/OrganizationDetailModal.tsx',
    '<span className="text-xs font-medium uppercase tracking-wide text-muted">{t(\'History\')}</span>',
    '<span className="text-label uppercase text-muted">{t(\'History\')}</span>',
)

rep(
    'features/platform/OrganizationFormModal.tsx',
    '<p className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">{t(\'First admin login\')}</p>',
    '<p className="mb-3 text-label uppercase text-muted">{t(\'First admin login\')}</p>',
)

rep(
    'features/billing/SalesBookPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/billing/MasterBillPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/billing/CorrectionsReportPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/billing/InvoiceDetailPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)

rep(
    'features/inventory/PurchaseOrderDetailPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/inventory/InventoryItemDetailPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)

rep(
    'features/commission/DoctorCommissionModal.tsx',
    '<tr className="border-b border-border text-left uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/commission/CommissionPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)

rep(
    'features/samples/SampleDetailPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/catalog/ReflexRulesPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)

rep(
    'features/catalog/parameterMaster/ParameterMasterFormModal.tsx',
    '<legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">',
    '<legend className="px-1 text-label uppercase text-muted">',
)
rep(
    'features/catalog/TestFormModal.tsx',
    '<legend className="px-1 text-xs font-semibold uppercase tracking-wide text-muted">',
    '<legend className="px-1 text-label uppercase text-muted">',
)
rep(
    'features/catalog/TestFormModal.tsx',
    '<summary className="cursor-pointer list-none text-xs font-semibold uppercase tracking-wide text-muted">',
    '<summary className="cursor-pointer list-none text-label uppercase text-muted">',
)
rep(
    'features/catalog/TestFormModal.tsx',
    "<h3 className=\"text-xs font-semibold uppercase tracking-wide text-muted\">{t('Test details')}</h3>",
    "<h3 className=\"text-label uppercase text-muted\">{t('Test details')}</h3>",
)
rep(
    'features/catalog/TestFormModal.tsx',
    "<h3 className=\"text-xs font-semibold uppercase tracking-wide text-muted\">{t('Parameters')}</h3>",
    "<h3 className=\"text-label uppercase text-muted\">{t('Parameters')}</h3>",
)

rep(
    'features/results/CultureEntryForm.tsx',
    "<span className=\"text-xs font-semibold uppercase tracking-wide text-muted\">{t('Isolate {n}', { n: idx + 1 })}</span>",
    "<span className=\"text-label uppercase text-muted\">{t('Isolate {n}', { n: idx + 1 })}</span>",
)
rep(
    'features/results/CultureEntryForm.tsx',
    '<p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-muted">',
    '<p className="mb-1.5 mt-3 text-label uppercase text-muted">',
)

rep(
    'features/dashboard/components/WorkflowPipeline.tsx',
    '<span className="text-[11px] font-medium uppercase tracking-wide text-muted">{t(s.label)}</span>',
    '<span className="text-label uppercase text-muted">{t(s.label)}</span>',
)

rep(
    'features/patients/PatientDetailPage.tsx',
    '<dt className="text-xs font-medium uppercase tracking-wide text-muted">{label}</dt>',
    '<dt className="text-label uppercase text-muted">{label}</dt>',
)
rep(
    'features/patients/PatientDetailPage.tsx',
    "<span className=\"font-medium uppercase tracking-wide text-muted\">{translate(getLocale(), 'Record completeness')}</span>",
    "<span className=\"text-label uppercase text-muted\">{translate(getLocale(), 'Record completeness')}</span>",
)

rep(
    'features/patients/MergePatientModal.tsx',
    '<p className="text-xs uppercase tracking-wide text-muted">Duplicate (retired)</p>',
    "<p className=\"text-label uppercase text-muted\">{t('Duplicate (retired)')}</p>",
)
rep(
    'features/patients/MergePatientModal.tsx',
    '<p className="text-xs uppercase tracking-wide text-muted">Survivor</p>',
    "<p className=\"text-label uppercase text-muted\">{t('Survivor')}</p>",
)

rep(
    'features/results/ResultEntryPage.tsx',
    '<tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">',
    '<tr className="border-b border-border text-left text-label uppercase text-muted">',
)
rep(
    'features/results/ResultEntryPage.tsx',
    "<td colSpan={4} className=\"px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted\">",
    '<td colSpan={4} className="px-5 py-1.5 text-label uppercase text-muted">',
)

# --- fix the redundant double-tracking on the two files that already adopted text-label ---
rep(
    'features/revenue/components/MoneyTable.tsx',
    "'px-3 py-2 text-label uppercase tracking-wide text-muted',",
    "'px-3 py-2 text-label uppercase text-muted',",
)
rep(
    'features/revenue/components/PaymentMethodPanel.tsx',
    "<h3 className=\"text-label uppercase tracking-wide text-muted\">{t('By who received it')}</h3>",
    "<h3 className=\"text-label uppercase text-muted\">{t('By who received it')}</h3>",
)

print(f'patched {len(patched)} occurrences across files: {sorted(set(patched))}')
if missing:
    print(f'MISSING {len(missing)}:')
    for relpath, snippet in missing:
        print(f'  {relpath}: {snippet}')
