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
  const H = 120;
  const padX = 4;
  const padBottom = 18;
  const barGap = 8;
  const barW = points.length > 0 ? (W - padX * 2) / points.length - barGap : 0;

  return (
    <Card className="p-5">
      <SectionHeader icon={TrendingUp} title="Clinics onboarded" description={`Last 6 months · ${total} total`} />
      {total === 0 ? (
        <p className="text-sm text-muted">No clinics onboarded in this period yet.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Clinics onboarded per month">
          {points.map((p, i) => {
            const h = Math.max(2, ((H - padBottom) * p.count) / max);
            const x = padX + i * (barW + barGap);
            const y = H - padBottom - h;
            return (
              <g key={p.month}>
                <rect x={x} y={y} width={Math.max(1, barW)} height={h} rx={3} className="fill-primary/70">
                  <title>
                    {monthLabel(p.month)}: {p.count}
                  </title>
                </rect>
                <text x={x + barW / 2} y={H - 4} textAnchor="middle" className="fill-muted" style={{ fontSize: 9 }}>
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
