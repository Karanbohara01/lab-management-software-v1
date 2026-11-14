import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useQuery } from '@/hooks/useQuery';
import { samplesApi } from '@/features/samples/api';
import { byPriorityThenAge, type SampleListItem } from '@/features/samples/types';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { formatDateTime } from '@/features/patients/format';
import { CollectSampleModal } from '@/features/samples/CollectSampleModal';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useNavigateFrom } from '@/lib/navigation';
import { QueueShell } from './QueueShell';
import { useT } from '@/i18n';

/** Sample-collection staff worklist: specimens ordered but not yet drawn from the patient. */
export function SamplesToCollect() {
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const t = useT();
  const [collecting, setCollecting] = useState<SampleListItem | null>(null);
  // Fetched deeper than the 8 shown so a STAT draw ordered seconds ago can still surface above
  // older routine ones once sorted — size:8 would never even see it if it landed on page 2.
  const { data, loading, error, refetch } = useQuery(
    () => samplesApi.list({ status: 'AWAITING_COLLECTION', size: 25 }),
    [],
  );
  const visible = [...(data?.content ?? [])].sort(byPriorityThenAge).slice(0, 8);

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
                  {s.patientName} <span className="font-mono text-xs text-muted">{s.patientMrn}</span>
                </p>
              </span>
              <p className="truncate text-xs text-muted">
                {t('{specimen} · {count} test(s) · ordered {time}', {
                  specimen: t(SPECIMEN_LABELS[s.specimenType]),
                  count: s.testCount,
                  time: formatDateTime(s.createdAt),
                })}
              </p>
            </button>
            {hasPermission(PERMISSIONS.SAMPLE_COLLECT) && (
              <Button size="sm" onClick={() => setCollecting(s)}>
                {t('Collect')}
              </Button>
            )}
          </li>
        ))}
      </ul>

      {collecting && (
        <CollectSampleModal
          key={collecting.id}
          open
          sample={collecting}
          onClose={() => setCollecting(null)}
          onDone={() => {
            setCollecting(null);
            refetch();
          }}
        />
      )}
    </QueueShell>
  );
}
