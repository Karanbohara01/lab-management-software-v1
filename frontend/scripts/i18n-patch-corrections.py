import pathlib

p = pathlib.Path('src/features/billing/CorrectionsReportPage.tsx')
s = p.read_text(encoding='utf-8')
missing = []


def rep(old, new):
    global s
    if old not in s:
        missing.append(old[:100])
        return
    s = s.replace(old, new, 1)


rep(
    '                    <th className="px-4 py-2">Bill no</th>\n'
    '                    <th className="px-4 py-2">Customer</th>\n'
    '                    <th className="px-4 py-2 text-right">Amount</th>\n'
    '                    <th className="px-4 py-2">Cancelled</th>\n'
    '                    <th className="px-4 py-2">Reason</th>\n'
    '                    <th className="px-4 py-2">Credit note</th>',
    '                    <th className="px-4 py-2">{t(\'Bill No\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Customer\')}</th>\n'
    '                    <th className="px-4 py-2 text-right">{t(\'Amount\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Cancelled\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Reason\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Credit note\')}</th>',
)

rep(
    "                        {dt(r.cancelledAt)}\n"
    "                        {r.cancelledBy ? <span className=\"block text-xs text-muted\">by {r.cancelledBy}</span> : null}",
    "                        {dt(r.cancelledAt)}\n"
    "                        {r.cancelledBy ? (\n"
    "                          <span className=\"block text-xs text-muted\">{t('by {name}', { name: r.cancelledBy })}</span>\n"
    "                        ) : null}",
)

rep(
    "                          <Badge tone={r.creditNoteStatus === 'FILED' ? 'success' : r.creditNoteStatus === 'FAILED' ? 'danger' : 'warning'}>\n"
    "                            {r.creditNoteStatus === 'FILED' ? r.creditNoteNumber ?? 'Filed' : r.creditNoteStatus}\n"
    "                          </Badge>",
    "                          <Badge tone={r.creditNoteStatus === 'FILED' ? 'success' : r.creditNoteStatus === 'FAILED' ? 'danger' : 'warning'}>\n"
    "                            {r.creditNoteStatus === 'FILED' ? r.creditNoteNumber ?? t('Filed') : r.creditNoteStatus}\n"
    "                          </Badge>",
)

if missing:
    print('MISSING', len(missing), 'anchors:')
    for m in missing:
        print('  -', m)
else:
    p.write_text(s, encoding='utf-8')
    print('CorrectionsReportPage.tsx patched, no misses')
