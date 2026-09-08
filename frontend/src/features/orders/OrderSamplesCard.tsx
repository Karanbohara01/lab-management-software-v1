import { Link } from 'react-router-dom';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { samplesApi } from '@/features/samples/api';
import { SAMPLE_STATUS_LABEL, SAMPLE_STATUS_TONE } from '@/features/samples/types';

export function OrderSamplesCard({ orderId }: { orderId: number }) {
  const { data, loading, error, refetch } = useQuery(
    () => samplesApi.list({ orderId, size: 50 }),
    [orderId],
  );

  return (
    <Card>
      <CardHeader title="Samples" description="Generated when the order is confirmed." />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.content.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted">No samples yet.</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.content.map((s) => (
            <li key={s.id}>
              <Link
                to={`/app/samples/${s.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-surface-muted"
              >
                <span>
                  <span className="font-mono text-xs text-muted">{s.accessionNumber}</span>
                  <span className="ml-2 text-foreground">{SPECIMEN_LABELS[s.specimenType]}</span>
                  <span className="ml-2 text-muted">· {s.testCount} test(s)</span>
                </span>
                <Badge tone={SAMPLE_STATUS_TONE[s.status]}>{SAMPLE_STATUS_LABEL[s.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
