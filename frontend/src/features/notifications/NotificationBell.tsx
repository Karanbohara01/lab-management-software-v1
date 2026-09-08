import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Bell, Info } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { notificationsApi, type AppNotification } from './api';

const POLL_MS = 45_000;

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function NotificationBell() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const enabled = hasPermission(PERMISSIONS.NOTIFICATION_READ);

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<AppNotification[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  const refreshCount = useCallback(() => {
    if (!enabled) return;
    notificationsApi.unreadCount().then(setCount).catch(() => undefined);
  }, [enabled]);

  useEffect(() => {
    refreshCount();
    const timer = setInterval(refreshCount, POLL_MS);
    return () => clearInterval(timer);
  }, [refreshCount]);

  useEffect(() => {
    if (open) notificationsApi.list(false, 20).then(setItems).catch(() => undefined);
  }, [open]);

  if (!enabled) return null;

  const openItem = async (n: AppNotification) => {
    if (!n.read) {
      await notificationsApi.markRead(n.id).catch(() => undefined);
      refreshCount();
    }
    setOpen(false);
    if (n.linkPath) navigate(n.linkPath);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-md p-2 text-muted-foreground hover:bg-surface-muted"
        aria-label={`Notifications${count > 0 ? `, ${count} unread` : ''}`}
      >
        <Bell className="h-5 w-5" aria-hidden />
        {count > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-semibold text-danger-foreground">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
          <div
            ref={panelRef}
            className="absolute right-0 z-20 mt-2 w-80 rounded-md border border-border bg-surface shadow-popover"
          >
            <div className="flex items-center justify-between border-b border-border px-3 py-2">
              <span className="text-sm font-semibold text-foreground">Notifications</span>
              <button
                className="text-xs text-primary hover:underline"
                onClick={async () => {
                  await notificationsApi.markAllRead();
                  setCount(0);
                  setItems((prev) => prev.map((i) => ({ ...i, read: true })));
                }}
              >
                Mark all read
              </button>
            </div>
            <ul className="max-h-96 overflow-y-auto">
              {items.length === 0 ? (
                <li className="px-3 py-6 text-center text-sm text-muted">Nothing here</li>
              ) : (
                items.map((n) => {
                  const Icon = n.severity === 'CRITICAL' ? AlertTriangle : n.severity === 'WARNING' ? AlertTriangle : Info;
                  return (
                    <li key={n.id}>
                      <button
                        onClick={() => openItem(n)}
                        className={`flex w-full gap-2 px-3 py-2.5 text-left text-sm hover:bg-surface-muted ${n.read ? 'opacity-60' : ''}`}
                      >
                        <Icon
                          className={`mt-0.5 h-4 w-4 shrink-0 ${n.severity === 'CRITICAL' ? 'text-critical' : n.severity === 'WARNING' ? 'text-warning' : 'text-primary'}`}
                          aria-hidden
                        />
                        <span className="min-w-0">
                          <span className="block font-medium text-foreground">{n.title}</span>
                          {n.message && <span className="block truncate text-xs text-muted">{n.message}</span>}
                          <span className="block text-xs text-muted">{timeAgo(n.createdAt)}</span>
                        </span>
                      </button>
                    </li>
                  );
                })
              )}
            </ul>
            <div className="border-t border-border px-3 py-2 text-center">
              <button className="text-xs text-primary hover:underline" onClick={() => { setOpen(false); navigate('/app/notifications'); }}>
                View all
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
