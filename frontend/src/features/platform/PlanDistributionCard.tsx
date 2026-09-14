import { PieChart } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/features/dashboard/components/SectionHeader';
import type { PlanDistributionPoint } from './types';

/** Fixed opacity steps for the primary hue, assigned by rank (most-subscribed plan first) — never
 * reassigned when the underlying counts change, so a plan doesn't repaint just because another
 * plan's count shifted around it. */
const SHADES = ['bg-primary', 'bg-primary/75', 'bg-primary/55', 'bg-primary/40', 'bg-primary/28', 'bg-primary/18'];

/** Share of clinics on each plan, by current subscription. */
export function PlanDistributionCard({ points }: { points: PlanDistributionPoint[] }) {
  const total = points.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <Card className="p-5">
      <SectionHeader icon={PieChart} title="Plan distribution" description="Clinics on each plan today" />
      {points.length === 0 ? (
        <p className="text-sm text-muted">No active subscriptions yet.</p>
      ) : (
        <ul className="space-y-3">
          {points.map((p, i) => {
            const pct = Math.round((p.count / total) * 100);
            const shade = SHADES[i % SHADES.length];
            return (
              <li key={p.planCode}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${shade}`} aria-hidden />
                    {p.planName}
                  </span>
                  <span className="text-xs text-muted">
                    <span className="font-medium text-foreground">{p.count}</span> · {pct}%
                  </span>
                </div>
                <div className="mt-1.5 h-2 rounded-full bg-surface-muted">
                  <div className={`h-2 rounded-full ${shade}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
