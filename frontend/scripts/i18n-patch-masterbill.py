import pathlib

p = pathlib.Path('src/features/billing/MasterBillPage.tsx')
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
    '                    <th className="px-4 py-2">Date</th>\n'
    '                    <th className="px-4 py-2">Customer</th>\n'
    '                    <th className="px-4 py-2 text-right">Total</th>\n'
    '                    <th className="px-4 py-2">Status</th>\n'
    '                    <th className="px-4 py-2">IRD sync</th>\n'
    '                    <th className="px-4 py-2">Printed</th>\n'
    '                    <th className="px-4 py-2">Entered by</th>',
    '                    <th className="px-4 py-2">{t(\'Bill No\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Date\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Customer\')}</th>\n'
    '                    <th className="px-4 py-2 text-right">{t(\'Total\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Status\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'IRD sync\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Printed\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Entered by\')}</th>',
)

rep(
    '                        <Badge tone={r.isBillActive ? \'success\' : \'neutral\'}>{r.isBillActive ? \'Active\' : \'Cancelled\'}</Badge>',
    '                        <Badge tone={r.isBillActive ? \'success\' : \'neutral\'}>{t(r.isBillActive ? \'Active\' : \'Cancelled\')}</Badge>',
)

rep(
    "                      <td className=\"px-4 py-2\">\n"
    "                        {r.isBillPrinted ? (\n"
    '                          <span title={r.printedBy ?? undefined}>Yes{r.printedBy ? ` (${r.printedBy})` : \'\'}</span>\n'
    "                        ) : (\n"
    "                          '—'\n"
    "                        )}\n"
    "                      </td>",
    "                      <td className=\"px-4 py-2\">\n"
    "                        {r.isBillPrinted ? (\n"
    "                          <span title={r.printedBy ?? undefined}>\n"
    "                            {r.printedBy ? t('Yes ({name})', { name: r.printedBy }) : t('Yes')}\n"
    "                          </span>\n"
    "                        ) : (\n"
    "                          '—'\n"
    "                        )}\n"
    "                      </td>",
)

if missing:
    print('MISSING', len(missing), 'anchors:')
    for m in missing:
        print('  -', m)
else:
    p.write_text(s, encoding='utf-8')
    print('MasterBillPage.tsx patched, no misses')
