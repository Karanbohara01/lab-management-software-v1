import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useQuery } from '@/hooks/useQuery';
import { samplesApi } from '@/features/samples/api';
import { byPriorityThenAge, type SampleListItem } from '@/features/samples/types';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { formatDateTime } from '@/features/patients/format';
import { ReceiveSampleModal } from '@/features/samples/ReceiveSampleModal';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useNavigateFrom } from '@/lib/navigation';
import { QueueShell } from './QueueShell';
import { useT } from '@/i18n';

/** Bench worklist: samples collected in the field but not yet logged into the lab. */
export function SamplesToReceive() {
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const t = useT();
  const [receiving, setReceiving] = useState<SampleListItem | null>(null);
  // Fetched deeper than the 8 shown so a STAT sample collected seconds ago can still surface
  // above older routine ones once sorted — size:8 would never even see it if it landed on page 2.
  const { data, loading, error, refetch } = useQuery(() => samplesApi.list({ status: 'COLLECTED', size: 25 }), []);
  const visible = [...(data?.content ?? [])].sort(byPriorityThenAge).slice(0, 8);

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
        {visible.map((s) => (
          <li key={s.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/samples/${s.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                {s.priority !== 'ROUTINE' && (
                  <Badge tone={s.priority === 'STAT' ? 'critical' : 'warning'}>{s.priority}</Badge>
                )}
                <p className="min-w-0 truncate text-sm font-medium text-foreground">
                  {s.patientName} <span className="font-mono text-xs text-muted">{s.accessionNumber}</span>
                </p>
              </span>
              <p className="truncate text-xs text-muted">
                {t('{specimen} · {count} test(s) · collected {time}', {
                  specimen: t(SPECIMEN_LABELS[s.specimenType]),
                  count: s.testCount,
                  time: formatDateTime(s.createdAt),
                })}
              </p>
            </button>
            {hasPermission(PERMISSIONS.SAMPLE_RECEIVE) && (
              <Button size="sm" onClick={() => setReceiving(s)}>
                {t('Receive')}
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
