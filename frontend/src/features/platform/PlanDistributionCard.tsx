import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/features/dashboard/components/SectionHeader';
import type { PlanDistributionPoint } from './types';

/** Share of clinics on each plan, by current subscription. */
export function PlanDistributionCard({ points }: { points: PlanDistributionPoint[] }) {
  const total = points.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <Card className="p-5">
      <SectionHeader title="Plan distribution" description="Clinics on each plan today" />
      {points.length === 0 ? (
        <p className="text-sm text-muted">No active subscriptions yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {points.map((p) => {
            const pct = Math.round((p.count / total) * 100);
            return (
              <li key={p.planCode}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-foreground">{p.planName}</span>
                  <span className="text-xs text-muted">
                    {p.count} · {pct}%
                  </span>
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-surface-muted">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
