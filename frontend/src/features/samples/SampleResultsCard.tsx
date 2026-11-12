import { AlertTriangle } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { LinkFrom } from '@/lib/navigation';
import { resultsApi } from '@/features/results/api';
import { RESULT_STATUS_LABEL, RESULT_STATUS_TONE } from '@/features/results/types';
import { useT } from '@/i18n';

export function SampleResultsCard({ sampleId }: { sampleId: number }) {
  const t = useT();
  const { data, loading, error, refetch } = useQuery(() => resultsApi.list({ sampleId, size: 50 }), [sampleId]);

  return (
    <Card>
      <CardHeader title={t('Results')} description={t('Opened when the sample is received.')} />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.content.length === 0 ? (
        <p className="px-5 py-4 text-sm text-muted">{t('No result worklist yet — receive the sample first.')}</p>
      ) : (
        <ul className="divide-y divide-border">
          {data.content.map((r) => (
            <li key={r.id}>
              <LinkFrom
                to={`/app/results/${r.id}`}
                className="flex items-center justify-between px-5 py-3 text-sm hover:bg-surface-muted"
              >
                <span className="flex items-center gap-2">
                  {r.hasCritical && <AlertTriangle className="h-4 w-4 text-critical" aria-label={t('Critical')} />}
                  <span className="font-medium text-foreground">{r.testName}</span>
                  <span className="font-mono text-xs text-muted">{r.testCode}</span>
                </span>
                <Badge tone={RESULT_STATUS_TONE[r.status]}>{t(RESULT_STATUS_LABEL[r.status])}</Badge>
              </LinkFrom>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
