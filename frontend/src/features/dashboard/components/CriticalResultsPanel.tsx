import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { resultsApi } from '@/features/results/api';
import { SectionHeader } from './SectionHeader';

function timeAgo(iso: string): string {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.round(hrs / 24)} d ago`;
}

/** Critical values that still need a documented clinician callback — clinical priority, not decoration. */
export function CriticalResultsPanel() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(
    () => resultsApi.list({ criticalPendingOnly: true, size: 6, page: 0 }),
    [],
  );

  return (
    <Card className="p-5">
      <SectionHeader
        title="Critical results"
        description="Awaiting a documented callback to the treating clinician."
        action={
          <Button size="sm" variant="ghost" onClick={() => navigate('/app/results?criticalPendingOnly=true')}>
            View all
          </Button>
        }
      />
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.content.length === 0 ? (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          All critical results have been acknowledged.
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {data.content.map((r) => (
            <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {r.patientName} <span className="font-mono text-xs text-muted">{r.patientMrn}</span>
                </p>
                <p className="truncate text-xs text-muted">
                  {r.testName} · detected {timeAgo(r.createdAt)}
                </p>
              </div>
              <Badge tone="critical">Critical</Badge>
              <Button size="sm" variant="secondary" onClick={() => navigate(`/app/results/${r.id}`)}>
                Review
              </Button>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
