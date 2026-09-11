import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/hooks/useQuery';
import { samplesApi } from '@/features/samples/api';
import type { SampleListItem } from '@/features/samples/types';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { formatDateTime } from '@/features/patients/format';
import { ReceiveSampleModal } from '@/features/samples/ReceiveSampleModal';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { QueueShell } from './QueueShell';

/** Bench worklist: samples collected in the field but not yet logged into the lab. */
export function SamplesToReceive() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [receiving, setReceiving] = useState<SampleListItem | null>(null);
  const { data, loading, error, refetch } = useQuery(() => samplesApi.list({ status: 'COLLECTED', size: 8 }), []);

  return (
    <QueueShell
      title="Samples to receive"
      description="Collected and in transit — log them in to open the result worklist."
      count={data?.totalElements}
      viewAllTo="/app/samples?status=COLLECTED"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="No samples are waiting to be received."
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
                {s.patientName} <span className="font-mono text-xs text-muted">{s.accessionNumber}</span>
              </p>
              <p className="truncate text-xs text-muted">
                {SPECIMEN_LABELS[s.specimenType]} · {s.testCount} test(s) · collected {formatDateTime(s.createdAt)}
              </p>
            </button>
            {hasPermission(PERMISSIONS.SAMPLE_RECEIVE) && (
              <Button size="sm" onClick={() => setReceiving(s)}>
                Receive
              </Button>
            )}
          </li>
        ))}
      </ul>

      {receiving && (
        <ReceiveSampleModal
          open
          onClose={() => setReceiving(null)}
          sampleId={receiving.id}
          accession={receiving.accessionNumber}
          onReceived={() => {
            setReceiving(null);
            refetch();
          }}
        />
      )}
    </QueueShell>
  );
}
