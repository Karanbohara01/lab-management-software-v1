import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { ApiError } from '@/types/api';
import { resultsApi } from '@/features/results/api';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { QueueShell } from './QueueShell';

/** Pathologist worklist: verified results ready for final authorization. */
export function ResultsToAuthorize() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useQuery(() => resultsApi.list({ status: 'VERIFIED', size: 8 }), []);

  const authorize = async (id: number) => {
    setBusyId(id);
    try {
      await resultsApi.approve(id);
      toast.success('Result authorized');
      refetch();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const reason = window.prompt(`${e.message}\n\nEnter a documented reason to authorize anyway:`);
        if (reason && reason.trim()) {
          try {
            await resultsApi.approve(id, reason.trim());
            toast.success('Result authorized with override');
            refetch();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Failed');
          }
        }
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Unable to authorize');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <QueueShell
      title="Results to authorize"
      description="Verified and ready for your final sign-off."
      count={data?.totalElements}
      viewAllTo="/app/results?status=VERIFIED"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="Nothing is waiting on authorization."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/results/${r.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                {r.testName}
                {r.hasCritical && <Badge tone="critical">Critical</Badge>}
                {r.hasAbnormal && !r.hasCritical && <Badge tone="warning">Abnormal</Badge>}
              </p>
              <p className="truncate text-xs text-muted">
                {r.patientName} <span className="font-mono">{r.patientMrn}</span> · {r.departmentName}
              </p>
            </button>
            {hasPermission(PERMISSIONS.RESULT_APPROVE) && (
              <Button size="sm" loading={busyId === r.id} onClick={() => authorize(r.id)}>
                Authorize
              </Button>
            )}
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
