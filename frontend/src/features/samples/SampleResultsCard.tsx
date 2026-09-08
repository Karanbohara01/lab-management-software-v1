import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { resultsApi } from '@/features/results/api';
import { RESULT_STATUS_LABEL, RESULT_STATUS_TONE } from '@/features/results/types';

export function SampleResultsCard({ sampleId }: { sampleId: number }) {
  const { data, loading, error, refetch } = useQuery(() => resultsApi.list({ sampleId, size: 50 }), [sampleId]);

  return (
    <Card>
      <CardHeader title="Results" description="Opened when the sample is received." />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.content.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted">No result worklist yet — receive the sample first.</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.content.map((r) => (
            <li key={r.id}>
              <Link
                to={`/app/results/${r.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-surface-muted"
              >
                <span className="flex items-center gap-2">
                  {r.hasCritical && <AlertTriangle className="h-4 w-4 text-critical" aria-label="Critical" />}
                  <span className="font-medium text-foreground">{r.testName}</span>
                  <span className="font-mono text-xs text-muted">{r.testCode}</span>
                </span>
                <Badge tone={RESULT_STATUS_TONE[r.status]}>{RESULT_STATUS_LABEL[r.status]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
