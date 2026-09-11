import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { ApiError } from '@/types/api';
import { samplesApi } from '@/features/samples/api';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { formatDateTime } from '@/features/patients/format';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { QueueShell } from './QueueShell';

/** Sample-collection staff worklist: specimens ordered but not yet drawn from the patient. */
export function SamplesToCollect() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useQuery(
    () => samplesApi.list({ status: 'AWAITING_COLLECTION', size: 8 }),
    [],
  );

  const collect = async (id: number) => {
    setBusyId(id);
    try {
      await samplesApi.collect(id, {});
      toast.success('Sample marked collected');
      refetch();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const reason = window.prompt(`${e.message}\n\nEnter a reason to collect without payment:`);
        if (reason && reason.trim()) {
          try {
            await samplesApi.collect(id, { paymentOverrideReason: reason.trim() });
            toast.success('Sample collected without payment');
            refetch();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Failed');
          }
        }
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Unable to collect sample');
      }
    } finally {
      setBusyId(null);
    }
  };

  return (
    <QueueShell
      title="Samples to collect"
      description="Ordered and waiting on a phlebotomy draw."
      count={data?.totalElements}
      viewAllTo="/app/samples?status=AWAITING_COLLECTION"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="Every ordered sample has been collected."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/samples/${s.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {s.patientName} <span className="font-mono text-xs text-muted">{s.patientMrn}</span>
              </p>
              <p className="truncate text-xs text-muted">
                {SPECIMEN_LABELS[s.specimenType]} · {s.testCount} test(s) · ordered {formatDateTime(s.createdAt)}
              </p>
            </button>
            {hasPermission(PERMISSIONS.SAMPLE_COLLECT) && (
              <Button size="sm" loading={busyId === s.id} onClick={() => collect(s.id)}>
                Collect
              </Button>
            )}
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
