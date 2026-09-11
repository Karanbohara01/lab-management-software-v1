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

/** Bench worklist: entered results ready for a second-check verification. */
export function ResultsToVerify() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useQuery(() => resultsApi.list({ status: 'ENTERED', size: 8 }), []);

  const verify = async (id: number) => {
    setBusyId(id);
    try {
      await resultsApi.verify(id);
      toast.success('Result verified');
      refetch();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const reason = window.prompt(`${e.message}\n\nEnter a documented reason to verify it yourself:`);
        if (reason && reason.trim()) {
          try {
            await resultsApi.verify(id, reason.trim());
            toast.success('Result verified with override');
            refetch();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Failed');
          }
        }
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Unable to verify');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <QueueShell
      title="Results to verify"
      description="Entered values ready for technician sign-off."
      count={data?.totalElements}
      viewAllTo="/app/results?status=ENTERED"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="Nothing is waiting on verification."
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
            {hasPermission(PERMISSIONS.RESULT_VERIFY) && (
              <Button size="sm" variant="secondary" loading={busyId === r.id} onClick={() => verify(r.id)}>
                Verify
              </Button>
            )}
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
