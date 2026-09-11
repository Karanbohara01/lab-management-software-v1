import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { ApiError } from '@/types/api';
import { reportsApi } from '@/features/reports/api';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { QueueShell } from './QueueShell';

/** Pathologist worklist: generated reports waiting on an electronic signature. */
export function ReportsToRelease() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useQuery(() => reportsApi.list({ status: 'GENERATED', size: 8 }), []);

  const release = async (id: number) => {
    const creds = window.prompt('Signing credentials (e.g. "MD Pathology, NMC-12345"):', '');
    if (creds === null) return;
    setBusyId(id);
    try {
      await reportsApi.release(id, creds.trim() || undefined);
      toast.success('Report signed & released');
      refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Unable to release report');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <QueueShell
      title="Reports to sign & release"
      description="Generated and waiting on your electronic signature."
      count={data?.totalElements}
      viewAllTo="/app/reports?status=GENERATED"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="No reports are waiting on release."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/reports/${r.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                {r.reportNumber}
                {r.reportType === 'PRELIMINARY' && <Badge tone="warning">Preliminary</Badge>}
              </p>
              <p className="truncate text-xs text-muted">
                {r.patientName} <span className="font-mono">{r.patientMrn}</span> · order {r.orderNumber}
              </p>
            </button>
            {hasPermission(PERMISSIONS.REPORT_GENERATE) && (
              <Button size="sm" loading={busyId === r.id} onClick={() => release(r.id)}>
                Sign &amp; release
              </Button>
            )}
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
