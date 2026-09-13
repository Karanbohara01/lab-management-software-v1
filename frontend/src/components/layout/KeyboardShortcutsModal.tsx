import { Modal } from '@/components/ui/Modal';
import { useAuth } from '@/features/auth/useAuth';
import { NAV_SECTIONS } from './navigation';
import { GENERAL_SHORTCUTS, GO_TO_SHORTCUTS } from './shortcuts';

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);

function Key({ children }: { children: string }) {
  const label = children === 'Mod' ? (isMac ? '⌘' : 'Ctrl') : children;
  return (
    <kbd className="inline-flex min-w-[1.5rem] items-center justify-center rounded border border-border bg-surface-muted px-1.5 py-0.5 text-[11px] font-medium text-foreground">
      {label}
    </kbd>
  );
}

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { hasAnyPermission } = useAuth();
  const items = NAV_SECTIONS.flatMap((s) => s.items);

  const goTo = GO_TO_SHORTCUTS.map((s) => {
    const item = items.find((i) => i.to === s.to);
    return item ? { ...s, label: item.label, anyPermission: item.anyPermission } : null;
  }).filter((s): s is NonNullable<typeof s> => s !== null && (s.anyPermission.length === 0 || hasAnyPermission(s.anyPermission)));

  return (
    <Modal open={open} onClose={onClose} title="Keyboard shortcuts" size="md">
      <div className="space-y-5">
        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">General</h3>
          <ul className="space-y-2">
            {GENERAL_SHORTCUTS.map((s) => (
              <li key={s.description} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{s.description}</span>
                <span className="flex items-center gap-1">
                  {s.keys.map((k) => (
                    <Key key={k}>{k}</Key>
                  ))}
                </span>
              </li>
            ))}
          </ul>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Go to</h3>
          <p className="mb-2 text-xs text-muted">Press "g", then the letter below.</p>
          <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
            {goTo.map((s) => (
              <li key={s.to} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{s.label}</span>
                <span className="flex items-center gap-1">
                  <Key>g</Key>
                  <Key>{s.key}</Key>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </Modal>
  );
}
