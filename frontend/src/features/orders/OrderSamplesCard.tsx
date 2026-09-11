import { useState } from 'react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { SAMPLE_STATUS_LABEL, SAMPLE_STATUS_TONE, type SampleListItem } from '@/features/samples/types';
import { ReceiveSampleModal } from '@/features/samples/ReceiveSampleModal';

export function OrderSamplesCard({
  samples,
  busyId,
  onCollect,
  onReload,
}: {
  samples: SampleListItem[];
  busyId: number | null;
  onCollect: (id: number) => void;
  onReload: () => void;
}) {
  const { hasPermission } = useAuth();
  const [receiving, setReceiving] = useState<SampleListItem | null>(null);

  if (samples.length === 0) return null;

  return (
    <Card>
      <CardHeader
        title="Samples"
        description={`${samples.filter((s) => s.status === 'RECEIVED').length}/${samples.length} received`}
      />
      <ul className="divide-y divide-border">
        {samples.map((s) => (
          <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm">
            <div className="min-w-0">
              <span className="font-mono text-xs text-muted">{s.accessionNumber}</span>
              <span className="ml-2 text-foreground">{SPECIMEN_LABELS[s.specimenType]}</span>
              <span className="ml-2 text-muted">· {s.testCount} test(s)</span>
              {s.conditionSummary && (
                <span className="ml-2 text-xs text-warning">· {s.conditionSummary}</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge tone={SAMPLE_STATUS_TONE[s.status]}>{SAMPLE_STATUS_LABEL[s.status]}</Badge>
              {s.status === 'AWAITING_COLLECTION' && hasPermission(PERMISSIONS.SAMPLE_COLLECT) && (
                <Button size="sm" variant="secondary" loading={busyId === s.id} onClick={() => onCollect(s.id)}>
                  Collect
                </Button>
              )}
              {s.status === 'COLLECTED' && hasPermission(PERMISSIONS.SAMPLE_RECEIVE) && (
                <Button size="sm" onClick={() => setReceiving(s)}>
                  Receive
                </Button>
              )}
            </div>
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
            onReload();
          }}
        />
      )}
    </Card>
  );
}
