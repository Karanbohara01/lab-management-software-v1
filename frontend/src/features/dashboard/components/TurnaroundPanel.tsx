import { useNavigate } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { SectionHeader } from './SectionHeader';

/** Turnaround risk, built from the results actually in flight — no fabricated average-minute figures. */
export function TurnaroundPanel({ resultCounts }: { resultCounts: Record<string, number> }) {
  const navigate = useNavigate();
  const active = (resultCounts.PENDING ?? 0) + (resultCounts.ENTERED ?? 0) + (resultCounts.VERIFIED ?? 0);
  const overdue = resultCounts.OVERDUE ?? 0;
  const onTrack = Math.max(0, active - overdue);
  const overduePct = active > 0 ? Math.round((overdue / active) * 100) : 0;

  return (
    <Card className="p-5">
      <SectionHeader
        title="Turnaround risk"
        description="Results still in progress, against their due time."
        action={
          overdue > 0 ? (
            <Button size="sm" variant="ghost" onClick={() => navigate('/app/results?overdueOnly=true')}>
              View overdue
            </Button>
          ) : undefined
        }
      />
      {active === 0 ? (
        <div className="flex items-center gap-2 text-sm text-success">
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden />
          No results currently in progress.
        </div>
      ) : (
        <>
          <div className="flex h-2.5 overflow-hidden rounded-full bg-surface-muted">
            <div className="h-full bg-success" style={{ width: `${100 - overduePct}%` }} />
            {overdue > 0 && <div className="h-full bg-danger" style={{ width: `${overduePct}%` }} />}
          </div>
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-success" aria-hidden />
              {onTrack} on track
            </span>
            <span className="flex items-center gap-1.5 text-muted">
              <span className="h-2 w-2 rounded-full bg-danger" aria-hidden />
              {overdue} overdue
            </span>
            <span className="font-medium text-foreground">{active} in progress</span>
          </div>
        </>
      )}
    </Card>
  );
}
