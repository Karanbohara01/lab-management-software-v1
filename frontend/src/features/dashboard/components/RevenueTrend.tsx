import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/money';
import { SectionHeader } from './SectionHeader';
import type { AnalyticsPoint } from '@/features/analytics/api';

/** Revenue booked per day over the selected period — a plain SVG bar chart, no charting library. */
export function RevenueTrend({ points, days }: { points: AnalyticsPoint[]; days: number }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0);
  const W = 560;
  const H = 140;
  const padX = 4;
  const padBottom = 18;
  const barGap = 4;
  const barW = points.length > 0 ? (W - padX * 2) / points.length - barGap : 0;

  return (
    <Card className="p-5">
      <SectionHeader
        title="Revenue trend"
        description={`Booked per day · last ${days} day${days === 1 ? '' : 's'} · total ${formatMoney(total)}`}
      />
      {points.length === 0 || total === 0 ? (
        <p className="text-sm text-muted">No billed revenue in this period yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <svg viewBox={`0 0 ${W} ${H}`} className="min-w-[420px]" role="img" aria-label="Revenue by day">
            {points.map((p, i) => {
              const h = Math.max(2, ((H - padBottom) * p.value) / max);
              const x = padX + i * (barW + barGap);
              const y = H - padBottom - h;
              return (
                <g key={p.label}>
                  <rect x={x} y={y} width={Math.max(1, barW)} height={h} rx={2} className="fill-primary/70">
                    <title>
                      {p.label}: {formatMoney(p.value)}
                    </title>
                  </rect>
                  {points.length <= 14 && (
                    <text
                      x={x + barW / 2}
                      y={H - 4}
                      textAnchor="middle"
                      className="fill-muted"
                      style={{ fontSize: 8 }}
                    >
                      {p.label.slice(5)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </Card>
  );
}
