import pathlib

def patch(path, pairs, label):
    p = pathlib.Path(path)
    s = p.read_text(encoding='utf-8')
    for old, new in pairs:
        assert old in s, f"{label}: MISSING {old[:90]!r}"
        s = s.replace(old, new, 1)
    p.write_text(s, encoding='utf-8')
    print('patched', label)

# ---- NotificationBell ----
patch('src/features/notifications/NotificationBell.tsx', [
    (
        "import { Tooltip } from '@/components/ui/Tooltip';",
        "import { Tooltip } from '@/components/ui/Tooltip';\nimport { useT, translate, getLocale } from '@/i18n';",
    ),
    (
        "function timeAgo(iso: string): string {\n"
        "  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);\n"
        "  if (s < 60) return 'just now';\n"
        "  if (s < 3600) return `${Math.floor(s / 60)}m ago`;\n"
        "  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;\n"
        "  return `${Math.floor(s / 86400)}d ago`;\n"
        "}",
        "function timeAgo(iso: string): string {\n"
        "  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);\n"
        "  const t = (key: string, vars?: Record<string, number>) => translate(getLocale(), key, vars);\n"
        "  if (s < 60) return t('just now');\n"
        "  if (s < 3600) return t('{n}m ago', { n: Math.floor(s / 60) });\n"
        "  if (s < 86400) return t('{n}h ago', { n: Math.floor(s / 3600) });\n"
        "  return t('{n}d ago', { n: Math.floor(s / 86400) });\n"
        "}",
    ),
    (
        "export function NotificationBell() {\n  const navigate = useNavigateFrom();",
        "export function NotificationBell() {\n  const t = useT();\n  const navigate = useNavigateFrom();",
    ),
    (
        "      <Tooltip content={count > 0 ? `${count} unread notification${count === 1 ? '' : 's'}` : 'Notifications'}>",
        "      <Tooltip\n"
        "        content={\n"
        "          count > 0\n"
        "            ? t(count === 1 ? '{count} unread notification' : '{count} unread notifications', { count })\n"
        "            : t('Notifications')\n"
        "        }\n"
        "      >",
    ),
    (
        "          aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}",
        "          aria-label={`${t('Notifications')}${count > 0 ? `, ${count} unread` : ''}`}",
    ),
    (
        '              <span className="text-sm font-semibold text-foreground">Notifications</span>',
        "              <span className=\"text-sm font-semibold text-foreground\">{t('Notifications')}</span>",
    ),
    (
        "                Mark all read\n              </button>",
        "                {t('Mark all read')}\n              </button>",
    ),
    (
        '                <li className="px-3 py-6 text-center text-sm text-muted">Nothing here</li>',
        "                <li className=\"px-3 py-6 text-center text-sm text-muted\">{t('Nothing here')}</li>",
    ),
    (
        "                View all\n              </button>",
        "                {t('View all')}\n              </button>",
    ),
], 'NotificationBell.tsx')

print('ALL DONE')
