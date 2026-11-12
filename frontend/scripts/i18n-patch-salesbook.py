import pathlib

p = pathlib.Path('src/features/billing/SalesBookPage.tsx')
s = p.read_text(encoding='utf-8')
missing = []


def rep(old, new):
    global s
    if old not in s:
        missing.append(old[:100])
        return
    s = s.replace(old, new, 1)


rep(
    "      <Card id=\"report-print\">\n"
    "        <div className=\"hidden p-4 print:block\">\n"
    "          <p className=\"text-lg font-bold\">\n"
    "            Sales Book — {MONTHS[month - 1]} {year}\n"
    "          </p>\n"
    "        </div>",
    "      <Card id=\"report-print\">\n"
    "        <div className=\"hidden p-4 print:block\">\n"
    "          <p className=\"text-lg font-bold\">\n"
    "            {t('Sales Book — {month} {year}', { month: t(MONTHS[month - 1]), year })}\n"
    "          </p>\n"
    "        </div>",
)

rep(
    '                    <th className="px-4 py-2">Date</th>\n'
    '                    <th className="px-4 py-2">Bill No</th>\n'
    '                    <th className="px-4 py-2">Buyer</th>\n'
    '                    <th className="px-4 py-2 text-right">Total sales</th>\n'
    '                    <th className="px-4 py-2 text-right">Discount</th>\n'
    '                    <th className="px-4 py-2 text-right">Taxable sales</th>\n'
    '                    <th className="px-4 py-2 text-right">Tax</th>',
    '                    <th className="px-4 py-2">{t(\'Date\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Bill No\')}</th>\n'
    '                    <th className="px-4 py-2">{t(\'Buyer\')}</th>\n'
    '                    <th className="px-4 py-2 text-right">{t(\'Total sales\')}</th>\n'
    '                    <th className="px-4 py-2 text-right">{t(\'Discount\')}</th>\n'
    '                    <th className="px-4 py-2 text-right">{t(\'Taxable sales\')}</th>\n'
    '                    <th className="px-4 py-2 text-right">{t(\'Tax\')}</th>',
)

rep(
    '                    <td className="px-4 py-2" colSpan={3}>\n'
    "                      Total ({data.length} bills)\n"
    "                    </td>",
    '                    <td className="px-4 py-2" colSpan={3}>\n'
    "                      {t('Total ({count} bills)', { count: data.length })}\n"
    "                    </td>",
)

if missing:
    print('MISSING', len(missing), 'anchors:')
    for m in missing:
        print('  -', m)
else:
    p.write_text(s, encoding='utf-8')
    print('SalesBookPage.tsx patched, no misses')
