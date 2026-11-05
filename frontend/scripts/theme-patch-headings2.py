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


rep(
    'features/signup/SignupPage.tsx',
    "<h1 className=\"text-xl font-semibold text-foreground\">{t('Start your free trial')}</h1>\n"
    '            <p className="mt-1 text-sm text-muted">{t(\'Your own isolated LIMS workspace, ready in seconds.\')}</p>',
    "<h1 className=\"text-heading-3 text-foreground\">{t('Start your free trial')}</h1>\n"
    '            <p className="mt-1 text-caption text-muted">{t(\'Your own isolated LIMS workspace, ready in seconds.\')}</p>',
)

rep(
    'features/portal/PatientPortalPage.tsx',
    "<h1 className=\"text-xl font-semibold text-foreground\">{t('Your lab records')}</h1>",
    "<h1 className=\"text-heading-3 text-foreground\">{t('Your lab records')}</h1>",
)
rep(
    'features/portal/PatientPortalPage.tsx',
    '<p className="mt-1 text-sm text-muted">\n'
    "                {data.patientName} · <span className=\"font-mono\">{data.patientMrn}</span>\n"
    "              </p>",
    '<p className="mt-1 text-caption text-muted">\n'
    "                {data.patientName} · <span className=\"font-mono\">{data.patientMrn}</span>\n"
    "              </p>",
)

rep(
    'features/reports/ReportViewPage.tsx',
    '<h1 className="mr-2 text-xl font-semibold text-foreground">{report.reportNumber}</h1>',
    '<h1 className="mr-2 text-heading-3 text-foreground">{report.reportNumber}</h1>',
)

rep(
    'features/reports/VerifyReportPage.tsx',
    "<h1 className=\"text-xl font-semibold text-foreground\">{t('Report verification')}</h1>\n"
    '            <p className="mt-1 text-sm text-muted">{t("Confirm this report\'s authenticity.")}</p>',
    "<h1 className=\"text-heading-3 text-foreground\">{t('Report verification')}</h1>\n"
    '            <p className="mt-1 text-caption text-muted">{t("Confirm this report\'s authenticity.")}</p>',
)

# --- KPI / big-number displays: adopt the `price` token (a large emphasized number is exactly
# what it's for) instead of hand-rolled text-2xl/3xl font-semibold (+ ad-hoc tracking-tight). ---

rep(
    'features/dashboard/components/StatTile.tsx',
    '<p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>',
    '<p className="mt-2 text-price tabular-nums text-foreground">{s.value}</p>',
)

rep(
    'features/platform/PlansPage.tsx',
    '<span className="text-3xl font-bold text-foreground">NPR {p.priceMonthly.toLocaleString()}</span>',
    '<span className="text-price text-foreground">NPR {p.priceMonthly.toLocaleString()}</span>',
)

print(f'patched {len(patched)} occurrences across files: {sorted(set(patched))}')
if missing:
    print(f'MISSING {len(missing)}:')
    for relpath, snippet in missing:
        print(f'  {relpath}: {snippet}')
