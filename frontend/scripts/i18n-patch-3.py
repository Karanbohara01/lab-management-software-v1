import pathlib

def patch(path, pairs, label):
    p = pathlib.Path(path)
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f"{label}: MISSING {old[:90]!r}"
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('patched', label)

patch('src/components/layout/CommandSearch.tsx', [
    (
        "import { useNavigateFrom } from '@/lib/navigation';",
        "import { useNavigateFrom } from '@/lib/navigation';\nimport { useT } from '@/i18n';",
    ),
    (
        "export function CommandSearch() {\n  const navigate = useNavigateFrom();",
        "export function CommandSearch() {\n  const t = useT();\n  const navigate = useNavigateFrom();",
    ),
    (
        '          placeholder="Search patients, orders, samples…"\n'
        '          aria-label="Global search"',
        "          placeholder={t('Search patients, orders, samples…')}\n"
        "          aria-label={t('Global search')}",
    ),
    (
        '            aria-label="Clear search"',
        "            aria-label={t('Clear search')}",
    ),
    (
        '            <p className="px-4 py-3 text-sm text-muted">Searching…</p>\n'
        '          ) : hits.length === 0 ? (\n'
        '            <p className="px-4 py-3 text-sm text-muted">No matches for "{query}".</p>',
        "            <p className=\"px-4 py-3 text-sm text-muted\">{t('Searching…')}</p>\n"
        "          ) : hits.length === 0 ? (\n"
        "            <p className=\"px-4 py-3 text-sm text-muted\">{t('No matches for \"{query}\".', { query })}</p>",
    ),
    (
        '                  <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</p>',
        "                  <p className=\"px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted\">\n"
        "                    {t(g)}\n"
        "                  </p>",
    ),
], 'CommandSearch.tsx')

print('ALL DONE')
