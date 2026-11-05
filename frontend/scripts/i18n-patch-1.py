import pathlib

def patch(path, pairs, label):
    p = pathlib.Path(path)
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f"{label}: MISSING {old[:90]!r}"
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('patched', label)

# ---- Modal: the close button, the cancel button default, and the inline discard strip ----
patch('src/components/ui/Modal.tsx', [
    (
        "import { X } from 'lucide-react';",
        "import { X } from 'lucide-react';\nimport { useT, translate, getLocale } from '@/i18n';",
    ),
    (
        "export function ModalCancelButton({ children = 'Cancel' }: { children?: ReactNode }) {\n"
        "  const requestClose = useModalRequestClose();\n"
        "  return (\n"
        "    <Button variant=\"secondary\" type=\"button\" onClick={requestClose}>\n"
        "      {children}\n"
        "    </Button>\n"
        "  );\n"
        "}",
        "export function ModalCancelButton({ children }: { children?: ReactNode }) {\n"
        "  const t = useT();\n"
        "  const requestClose = useModalRequestClose();\n"
        "  return (\n"
        "    <Button variant=\"secondary\" type=\"button\" onClick={requestClose}>\n"
        "      {children ?? t('Cancel')}\n"
        "    </Button>\n"
        "  );\n"
        "}",
    ),
    (
        '              aria-label="Close dialog"',
        "              aria-label={translate(getLocale(), 'Close dialog')}",
    ),
    (
        '              <p className="text-sm text-foreground">Discard your unsaved changes?</p>',
        "              <p className=\"text-sm text-foreground\">"
        "{translate(getLocale(), 'Discard your unsaved changes?')}</p>",
    ),
    (
        "                  Keep editing",
        "                  {translate(getLocale(), 'Keep editing')}",
    ),
    (
        "                  Discard\n"
        "                </Button>\n"
        "              </div>\n"
        "            </div>\n"
        "          ) : (",
        "                  {translate(getLocale(), 'Discard')}\n"
        "                </Button>\n"
        "              </div>\n"
        "            </div>\n"
        "          ) : (",
    ),
], 'Modal.tsx')

# ---- UnsavedChangesDialog ----
patch('src/components/UnsavedChangesDialog.tsx', [
    (
        "import { Button } from '@/components/ui/Button';",
        "import { Button } from '@/components/ui/Button';\nimport { useT } from '@/i18n';",
    ),
    (
        "}) {\n  return (\n    <Modal\n      open={open}\n      onClose={onStay}\n      title=\"Discard unsaved changes?\"",
        "}) {\n  const t = useT();\n  return (\n    <Modal\n      open={open}\n      onClose={onStay}\n      title={t('Discard unsaved changes?')}",
    ),
    (
        "          <Button variant=\"secondary\" type=\"button\" onClick={onStay}>\n"
        "            Stay on this page\n"
        "          </Button>\n"
        "          <Button variant=\"danger\" type=\"button\" onClick={onDiscard}>\n"
        "            Discard changes\n"
        "          </Button>",
        "          <Button variant=\"secondary\" type=\"button\" onClick={onStay}>\n"
        "            {t('Stay on this page')}\n"
        "          </Button>\n"
        "          <Button variant=\"danger\" type=\"button\" onClick={onDiscard}>\n"
        "            {t('Discard changes')}\n"
        "          </Button>",
    ),
    (
        "        You have changes that haven&apos;t been saved. If you leave now, they will be lost.",
        "        {t(\"You have changes that haven't been saved. If you leave now, they will be lost.\")}",
    ),
], 'UnsavedChangesDialog.tsx')

# ---- ErrorPages ----
patch('src/pages/ErrorPages.tsx', [
    (
        "import { Button } from '@/components/ui/Button';\nimport { useBackTarget } from '@/lib/navigation';",
        "import { Button } from '@/components/ui/Button';\nimport { useBackTarget } from '@/lib/navigation';\nimport { useT } from '@/i18n';",
    ),
    (
        "function Shell({ code, title, message }: { code: string; title: string; message: string }) {\n  const { back } = useBackTarget();",
        "function Shell({ code, title, message }: { code: string; title: string; message: string }) {\n  const t = useT();\n  const { back } = useBackTarget();",
    ),
    (
        '            <Button variant="secondary">Back to {back.label}</Button>',
        "            <Button variant=\"secondary\">{t('Back to {label}', { label: back.label })}</Button>",
    ),
    (
        '          <Button variant="secondary">Back to dashboard</Button>',
        "          <Button variant=\"secondary\">{t('Back to dashboard')}</Button>",
    ),
    (
        "export function ForbiddenPage() {\n"
        "  const attempted = (useLocation().state as ForbiddenState | null)?.attempted;\n"
        "  return (\n"
        "    <Shell\n"
        "      code=\"403\"\n"
        "      title=\"Access denied\"\n"
        "      message={\n"
        "        attempted\n"
        "          ? `Your account does not have permission to open ${attempted}. If you believe this is a mistake, contact your administrator.`\n"
        "          : 'You do not have permission to view this page. If you believe this is a mistake, contact your administrator.'\n"
        "      }\n"
        "    />\n"
        "  );\n"
        "}",
        "export function ForbiddenPage() {\n"
        "  const t = useT();\n"
        "  const attempted = (useLocation().state as ForbiddenState | null)?.attempted;\n"
        "  return (\n"
        "    <Shell\n"
        "      code=\"403\"\n"
        "      title={t('Access denied')}\n"
        "      message={\n"
        "        attempted\n"
        "          ? t('Your account does not have permission to open {path}. If you believe this is a mistake, contact your administrator.', { path: attempted })\n"
        "          : t('You do not have permission to view this page. If you believe this is a mistake, contact your administrator.')\n"
        "      }\n"
        "    />\n"
        "  );\n"
        "}",
    ),
    (
        "export function NotFoundPage() {\n"
        "  const { pathname } = useLocation();\n"
        "  return (\n"
        "    <Shell\n"
        "      code=\"404\"\n"
        "      title=\"Page not found\"\n"
        "      message={`There is nothing at ${pathname}. The link may be out of date, or the record may have been removed.`}\n"
        "    />\n"
        "  );\n"
        "}",
        "export function NotFoundPage() {\n"
        "  const t = useT();\n"
        "  const { pathname } = useLocation();\n"
        "  return (\n"
        "    <Shell\n"
        "      code=\"404\"\n"
        "      title={t('Page not found')}\n"
        "      message={t('There is nothing at {path}. The link may be out of date, or the record may have been removed.', { path: pathname })}\n"
        "    />\n"
        "  );\n"
        "}",
    ),
], 'ErrorPages.tsx')

# ---- LoginPage ----
patch('src/pages/LoginPage.tsx', [
    (
        "import { BrandMark } from '@/components/brand/BrandMark';",
        "import { BrandMark } from '@/components/brand/BrandMark';\nimport { useT } from '@/i18n';",
    ),
    (
        "export function LoginPage() {\n  const dispatch = useAppDispatch();",
        "export function LoginPage() {\n  const t = useT();\n  const dispatch = useAppDispatch();",
    ),
    (
        "      <BackLink to=\"/\" className=\"absolute left-4 top-4 mb-0 sm:left-6 sm:top-6\">\n"
        "        Back to home\n"
        "      </BackLink>",
        "      <BackLink to=\"/\" className=\"absolute left-4 top-4 mb-0 sm:left-6 sm:top-6\">\n"
        "        {t('Back to home')}\n"
        "      </BackLink>",
    ),
    ('            aria-label="LIMS home"', "            aria-label={t('LIMS home')}"),
    (
        "            <h1 className=\"text-xl font-semibold text-foreground\">Sign in to LIMS</h1>\n"
        "            <p className=\"mt-1 text-sm text-muted\">Pathology &amp; Laboratory Management</p>",
        "            <h1 className=\"text-xl font-semibold text-foreground\">{t('Sign in to LIMS')}</h1>\n"
        "            <p className=\"mt-1 text-sm text-muted\">{t('Pathology & Laboratory Management')}</p>",
    ),
    ('            label="Username"', "            label={t('Username')}"),
    (
        "              <label htmlFor=\"password\" className=\"text-sm font-medium text-foreground\">\n"
        "                Password\n"
        "              </label>\n"
        "              <Link to=\"/forgot-password\" className=\"text-xs font-medium text-primary hover:underline\">\n"
        "                Forgot password?\n"
        "              </Link>",
        "              <label htmlFor=\"password\" className=\"text-sm font-medium text-foreground\">\n"
        "                {t('Password')}\n"
        "              </label>\n"
        "              <Link to=\"/forgot-password\" className=\"text-xs font-medium text-primary hover:underline\">\n"
        "                {t('Forgot password?')}\n"
        "              </Link>",
    ),
    (
        "          <Button type=\"submit\" className=\"w-full\" loading={loginPending}>\n"
        "            Sign in\n"
        "          </Button>",
        "          <Button type=\"submit\" className=\"w-full\" loading={loginPending}>\n"
        "            {t('Sign in')}\n"
        "          </Button>",
    ),
    (
        "        <p className=\"mt-4 text-center text-xs text-muted\">\n"
        "          Trouble signing in? Contact your laboratory administrator.\n"
        "        </p>",
        "        <p className=\"mt-4 text-center text-xs text-muted\">\n"
        "          {t('Trouble signing in? Contact your laboratory administrator.')}\n"
        "        </p>",
    ),
], 'LoginPage.tsx')

print('ALL DONE')
