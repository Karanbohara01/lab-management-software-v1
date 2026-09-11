import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/hooks/useQuery';
import { resultsApi } from '@/features/results/api';
import { QueueShell } from './QueueShell';

/** Bench worklist: results whose values haven't been entered yet. */
export function ResultsToEnter() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(() => resultsApi.list({ status: 'PENDING', size: 8 }), []);

  return (
    <QueueShell
      title="Results to enter"
      description="Received samples waiting on values."
      count={data?.totalElements}
      viewAllTo="/app/results?status=PENDING"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="No results are waiting on entry."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/results/${r.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="flex items-center gap-1.5 truncate text-sm font-medium text-foreground">
                {r.testName}
                {r.priority !== 'ROUTINE' && <Badge tone={r.priority === 'STAT' ? 'critical' : 'warning'}>{r.priority}</Badge>}
                {r.overdue && <Badge tone="danger">Overdue</Badge>}
              </p>
              <p className="truncate text-xs text-muted">
                {r.patientName} <span className="font-mono">{r.patientMrn}</span> · {r.departmentName}
              </p>
            </button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/app/results/${r.id}`)}>
              Enter
            </Button>
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
