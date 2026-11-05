import { useState } from 'react';
import { AlertTriangle, Info } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { useBackTarget, useNavigateFrom } from '@/lib/navigation';
import { useT } from '@/i18n';
import { formatDateTime } from '@/features/patients/format';
import { notificationsApi } from './api';

export function NotificationsPage() {
  const t = useT();
  const { back } = useBackTarget();
  const navigate = useNavigateFrom();
  const toast = useToast();
  const [unreadOnly, setUnreadOnly] = useState(false);
  const { data, loading, error, refetch } = useQuery(() => notificationsApi.list(unreadOnly, 100), [unreadOnly]);

  return (
    <>
      <PageHeader
        back={back}
        title={t('Notifications')}
        description={t('Operational alerts — critical results, failed submissions, stock and backlog.')}
        actions={
          <Button
            variant="secondary"
            onClick={async () => {
              await notificationsApi.markAllRead();
              toast.success(t('All marked read'));
              refetch();
            }}
          >
            {t('Mark all read')}
          </Button>
        }
      />

      <Card>
        <div className="flex items-center gap-4 border-b border-border p-4 text-sm">
          <label className="flex items-center gap-2 text-foreground">
            <input type="checkbox" className="h-4 w-4 rounded border-input" checked={unreadOnly} onChange={(e) => setUnreadOnly(e.target.checked)} />
            {t('Unread only')}
          </label>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : !data || data.length === 0 ? (
          <EmptyState title={t('No notifications')} message={t("You're all caught up.")} />
        ) : (
          <ul className="divide-y divide-border">
            {data.map((n) => {
              const Icon = n.severity === 'INFO' ? Info : AlertTriangle;
              return (
                <li key={n.id}>
                  <button
                    onClick={async () => {
                      if (!n.read) await notificationsApi.markRead(n.id);
                      if (n.linkPath) navigate(n.linkPath);
                      else refetch();
                    }}
                    className={`flex w-full gap-3 px-4 py-3 text-left hover:bg-surface-muted ${n.read ? 'opacity-60' : ''}`}
                  >
                    <Icon
                      className={`mt-0.5 h-4 w-4 shrink-0 ${n.severity === 'CRITICAL' ? 'text-critical' : n.severity === 'WARNING' ? 'text-warning' : 'text-primary'}`}
                      aria-hidden
                    />
                    <div>
                      <p className="text-sm font-medium text-foreground">{n.title}</p>
                      {n.message && <p className="text-sm text-muted">{n.message}</p>}
                      <p className="text-xs text-muted">{formatDateTime(n.createdAt)}</p>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </>
  );
}
