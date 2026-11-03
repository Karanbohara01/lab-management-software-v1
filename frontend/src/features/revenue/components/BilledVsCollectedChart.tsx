import { useId } from 'react';
import { formatMoney } from '@/lib/money';
import type { RevenueTrend } from '../types';

const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function bucketLabel(iso: string, granularity: RevenueTrend['granularity']): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  if (granularity === 'MONTH') return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
}

/**
 * Billed against collected over the period — two series on ONE value axis, since both are rupees;
 * a second axis would invite reading a crossover that isn't there. Plain SVG, matching the
 * existing revenue trend card: no charting dependency, and it prints as drawn.
 *
 * Bars are billed (what was sold that day), the line is collected (cash that day). They are not
 * expected to track each other — that gap is the point of the chart.
 */
export function BilledVsCollectedChart({ trend }: { trend: RevenueTrend }) {
  const points = trend.points;
  const gradientId = `collected-fill-${useId().replace(/:/g, '')}`;
  const max = Math.max(1, ...points.map((p) => Math.max(p.billed, p.collected)));

  const W = 920;
  const H = 240;
  const padLeft = 54;
  const padRight = 12;
  const padTop = 16;
  const padBottom = 30;
  const plotW = W - padLeft - padRight;
  const baseline = H - padBottom;
  const slot = points.length > 0 ? plotW / points.length : 0;
  const barW = Math.max(2, Math.min(26, slot * 0.55));
  const y = (v: number) => baseline - ((baseline - padTop) * v) / max;

  const coords = points.map((p, i) => ({ ...p, x: padLeft + slot * (i + 0.5), cy: y(p.collected) }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.cy.toFixed(1)}`).join(' ');
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = first && last ? `${line} L${last.x.toFixed(1)} ${baseline} L${first.x.toFixed(1)} ${baseline} Z` : '';

  const totals = points.reduce(
    (a, p) => ({ billed: a.billed + p.billed, collected: a.collected + p.collected }),
    { billed: 0, collected: 0 },
  );
  // Label every bucket while they fit, then thin them out so they never overlap.
  const labelEvery = Math.max(1, Math.ceil(points.length / 14));

  if (points.length === 0) {
    return <p className="px-5 py-8 text-center text-body-sm text-muted">No activity in this period.</p>;
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 px-5 pb-2 text-caption">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary/35" aria-hidden />
          <span className="text-muted">Billed</span>
          <span className="font-medium tabular-nums text-foreground">{formatMoney(totals.billed)}</span>
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-primary" aria-hidden />
          <span className="text-muted">Collected</span>
          <span className="font-medium tabular-nums text-foreground">{formatMoney(totals.collected)}</span>
        </span>
        <span className="text-muted">
          per {trend.granularity.toLowerCase()}
        </span>
      </div>

      <div className="overflow-x-auto px-2 pb-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[640px]"
          role="img"
          aria-label={`Billed and collected per ${trend.granularity.toLowerCase()} over the selected period`}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0.2} />
              <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0} />
            </linearGradient>
          </defs>

          {[0, 0.25, 0.5, 0.75, 1].map((f) => {
            const gy = baseline - (baseline - padTop) * f;
            return (
              <g key={f}>
                <line
                  x1={padLeft}
                  x2={W - padRight}
                  y1={gy}
                  y2={gy}
                  className="stroke-border"
                  strokeWidth={1}
                  strokeDasharray={f === 0 ? undefined : '3 4'}
                />
                <text x={padLeft - 8} y={gy + 3} textAnchor="end" className="fill-muted" style={{ fontSize: 10 }}>
                  {COMPACT.format(max * f)}
                </text>
              </g>
            );
          })}

          {coords.map((c) => (
            <g key={c.bucket}>
              <rect
                x={c.x - barW / 2}
                y={y(c.billed)}
                width={barW}
                height={Math.max(0, baseline - y(c.billed))}
                rx={2}
                className="fill-primary/30"
              >
                <title>
                  {bucketLabel(c.bucket, trend.granularity)} · billed {formatMoney(c.billed)}
                </title>
              </rect>
            </g>
          ))}

          <path d={area} fill={`url(#${gradientId})`} />
          <path d={line} fill="none" className="stroke-primary" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

          {coords.map((c, i) => (
            <g key={`c-${c.bucket}`}>
              {points.length <= 40 && (
                <circle cx={c.x} cy={c.cy} r={3} className="fill-surface stroke-primary" strokeWidth={2}>
                  <title>
                    {bucketLabel(c.bucket, trend.granularity)} · collected {formatMoney(c.collected)}
                    {c.refunded > 0 ? ` · refunded ${formatMoney(c.refunded)}` : ''}
                  </title>
                </circle>
              )}
              {i % labelEvery === 0 && (
                <text x={c.x} y={H - 10} textAnchor="middle" className="fill-muted" style={{ fontSize: 10 }}>
                  {bucketLabel(c.bucket, trend.granularity)}
                </text>
              )}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
