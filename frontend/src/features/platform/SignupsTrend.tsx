import { TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { SectionHeader } from '@/features/dashboard/components/SectionHeader';
import type { SignupPoint } from './types';

function monthLabel(ym: string): string {
  const parts = ym.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'short' });
}

/** Real clinics onboarded per month — no fabricated trend, a young deployment will just look sparse. */
export function SignupsTrend({ points }: { points: SignupPoint[] }) {
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((s, p) => s + p.count, 0);
  const W = 360;
  const H = 140;
  const padX = 4;
  const padTop = 10;
  const padBottom = 20;
  const plotH = H - padTop - padBottom;
  const barGap = 10;
  const barW = points.length > 0 ? (W - padX * 2) / points.length - barGap : 0;
  const gridLines = [0.25, 0.5, 0.75, 1];

  return (
    <Card className="p-5">
      <SectionHeader icon={TrendingUp} title="Clinics onboarded" description={`Last 6 months · ${total} total`} />
      {total === 0 ? (
        <p className="text-sm text-muted">No clinics onboarded in this period yet.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Clinics onboarded per month">
          {gridLines.map((f) => {
            const y = padTop + plotH * (1 - f);
            return <line key={f} x1={padX} x2={W - padX} y1={y} y2={y} className="stroke-border" strokeWidth={1} />;
          })}
          <line x1={padX} x2={W - padX} y1={padTop + plotH} y2={padTop + plotH} className="stroke-border" strokeWidth={1} />
          {points.map((p, i) => {
            const h = Math.max(2, (plotH * p.count) / max);
            const x = padX + i * (barW + barGap);
            const y = padTop + plotH - h;
            const isLast = i === points.length - 1;
            return (
              <g key={p.month}>
                <rect
                  x={x}
                  y={y}
                  width={Math.max(1, barW)}
                  height={h}
                  rx={4}
                  className={isLast ? 'fill-primary' : 'fill-primary/45'}
                >
                  <title>
                    {monthLabel(p.month)}: {p.count} clinic{p.count === 1 ? '' : 's'}
                  </title>
                </rect>
                {p.count > 0 && (
                  <text
                    x={x + barW / 2}
                    y={y - 4}
                    textAnchor="middle"
                    className={isLast ? 'fill-foreground font-semibold' : 'fill-muted'}
                    style={{ fontSize: 9 }}
                  >
                    {p.count}
                  </text>
                )}
                <text
                  x={x + barW / 2}
                  y={H - 5}
                  textAnchor="middle"
                  className={isLast ? 'fill-foreground font-medium' : 'fill-muted'}
                  style={{ fontSize: 9 }}
                >
                  {monthLabel(p.month)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </Card>
  );
}
