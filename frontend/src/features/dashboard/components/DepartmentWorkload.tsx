import { Card } from '@/components/ui/Card';
import { SectionHeader } from './SectionHeader';
import type { AnalyticsPoint } from '@/features/analytics/api';

/** Share of test volume per department, over the selected period. */
export function DepartmentWorkload({ points, days }: { points: AnalyticsPoint[]; days: number }) {
  const total = points.reduce((s, p) => s + p.value, 0) || 1;
  const top = [...points].sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <Card className="p-5">
      <SectionHeader title="Department workload" description={`Share of tests ordered · last ${days} day${days === 1 ? '' : 's'}`} />
      {top.length === 0 ? (
        <p className="text-sm text-muted">No tests ordered in this period.</p>
      ) : (
        <ul className="space-y-2.5">
          {top.map((p) => {
            const pct = Math.round((p.value / total) * 100);
            return (
              <li key={p.label}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="text-foreground">{p.label}</span>
                  <span className="text-xs text-muted">
                    {p.value} · {pct}%
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
