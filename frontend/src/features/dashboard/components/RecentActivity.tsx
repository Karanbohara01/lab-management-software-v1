import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { adminApi } from '@/features/admin/api';
import { SectionHeader } from './SectionHeader';

export function RecentActivity() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(() => adminApi.audit({ page: 0, size: 8 }), []);

  return (
    <Card className="p-5">
      <SectionHeader
        title="Recent activity"
        description="Latest actions across the laboratory."
        action={
          <Button size="sm" variant="ghost" onClick={() => navigate('/app/audit')}>
            View log
          </Button>
        }
      />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.content.length === 0 ? (
        <p className="text-sm text-muted">No recent activity.</p>
      ) : (
        <ol className="space-y-3">
          {data.content.map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="w-14 shrink-0 pt-0.5 text-xs tabular-nums text-muted">
                {new Date(a.createdAt).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
              </span>
              <div className="min-w-0 flex-1 border-l border-border pl-3">
                <p className="truncate text-foreground">
                  {a.summary ?? `${a.action} · ${a.entityType ?? a.module}`}
                </p>
                <p className="text-xs text-muted">{a.actor}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
