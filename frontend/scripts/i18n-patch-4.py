import pathlib

def patch(path, pairs, label):
    p = pathlib.Path(path)
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f"{label}: MISSING {old[:90]!r}"
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('patched', label)

# ---- Breadcrumbs: ancestor labels and the fallback title come from the static route metadata
# in English; the current page's own title is already translated wherever it was published.
patch('src/components/layout/Breadcrumbs.tsx', [
    (
        "import { useCurrentPageTitle } from './PageTitleContext';",
        "import { useCurrentPageTitle } from './PageTitleContext';\nimport { useT } from '@/i18n';",
    ),
    (
        "export function Breadcrumbs() {\n  const leaf = useLeafHandle();\n  const title = useCurrentPageTitle();",
        "export function Breadcrumbs() {\n  const t = useT();\n  const leaf = useLeafHandle();\n  const title = useCurrentPageTitle();",
    ),
    (
        "    .map((h) => ({ href: resolvePattern(h.pattern, leaf.params), label: h.title }));\n"
        "  const current = title ?? leaf.handle.title;",
        "    .map((h) => ({ href: resolvePattern(h.pattern, leaf.params), label: t(h.title) }));\n"
        "  const current = title ?? t(leaf.handle.title);",
    ),
], 'Breadcrumbs.tsx')

# ---- KeyboardShortcutsModal ----
patch('src/components/layout/KeyboardShortcutsModal.tsx', [
    (
        "import { Modal } from '@/components/ui/Modal';",
        "import { Modal } from '@/components/ui/Modal';\nimport { useT } from '@/i18n';",
    ),
    (
        "export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {\n"
        "  const { hasAnyPermission } = useAuth();",
        "export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {\n"
        "  const t = useT();\n"
        "  const { hasAnyPermission } = useAuth();",
    ),
    (
        '    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="md">',
        "    <Modal open={open} onClose={onClose} title={t('Keyboard shortcuts')} size=\"md\">",
    ),
    (
        '          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">General</h3>\n'
        "          <ul className=\"space-y-2\">\n"
        "            {GENERAL_SHORTCUTS.map((s) => (\n"
        '              <li key={s.description} className="flex items-center justify-between text-sm">\n'
        '                <span className="text-foreground">{s.description}</span>',
        '          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t(\'General\')}</h3>\n'
        "          <ul className=\"space-y-2\">\n"
        "            {GENERAL_SHORTCUTS.map((s) => (\n"
        '              <li key={s.description} className="flex items-center justify-between text-sm">\n'
        '                <span className="text-foreground">{t(s.description)}</span>',
    ),
    (
        '          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Go to</h3>\n'
        '          <p className="mb-2 text-xs text-muted">Press "g", then the letter below.</p>\n'
        "          <ul className=\"grid grid-cols-2 gap-x-4 gap-y-2\">\n"
        "            {goTo.map((s) => (\n"
        '              <li key={s.to} className="flex items-center justify-between text-sm">\n'
        '                <span className="text-foreground">{s.label}</span>',
        '          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{t(\'Go to\')}</h3>\n'
        "          <p className=\"mb-2 text-xs text-muted\">{t('Press \"g\", then the letter below.')}</p>\n"
        "          <ul className=\"grid grid-cols-2 gap-x-4 gap-y-2\">\n"
        "            {goTo.map((s) => (\n"
        '              <li key={s.to} className="flex items-center justify-between text-sm">\n'
        '                <span className="text-foreground">{t(s.label)}</span>',
    ),
], 'KeyboardShortcutsModal.tsx')

print('ALL DONE')
