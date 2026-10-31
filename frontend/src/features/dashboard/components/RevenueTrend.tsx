import { useEffect, useId, useRef } from 'react';
import { Card } from '@/components/ui/Card';
import { formatMoney } from '@/lib/money';
import { SectionHeader } from './SectionHeader';
import type { AnalyticsPoint } from '@/features/analytics/api';

const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Revenue booked per day over the selected period — a plain SVG line graph, no charting library.
 * `detailed` is for a card about half the page wide: drawn to that width (so the text keeps its
 * size), taller, with the amount written above each point and a date under it.
 */
export function RevenueTrend({
  points,
  days,
  detailed = false,
}: {
  points: AnalyticsPoint[];
  days: number;
  detailed?: boolean;
}) {
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0);
  const W = detailed ? 480 : 560;
  const H = detailed ? 190 : 140;
  const padX = detailed ? 14 : 12;
  const padTop = detailed ? 26 : 10;
  const padBottom = detailed ? 24 : 18;
  const slot = points.length > 0 ? (W - padX * 2) / points.length : 0;
  const labelSize = detailed ? 10 : 8;
  const few = points.length <= 14; // dots and amounts only while they'd stay legible
  const baseline = H - padBottom;
  const gradientId = `revenue-fill-${useId().replace(/:/g, '')}`;

  const coords = points.map((p, i) => ({
    ...p,
    x: padX + slot * (i + 0.5),
    y: baseline - ((baseline - padTop) * p.value) / max,
  }));
  const line = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
  const first = coords[0];
  const last = coords[coords.length - 1];
  const area = first && last ? `${line} L${last.x.toFixed(1)} ${baseline} L${first.x.toFixed(1)} ${baseline} Z` : '';

  // In a narrow card the graph scrolls sideways; start at the right, where the latest day is.
  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [points]);

  return (
    <Card className="min-w-0 p-5">
      <SectionHeader
        title="Revenue trend"
        description={`Booked per day · last ${days} day${days === 1 ? '' : 's'} · total ${formatMoney(total)}`}
      />
      {points.length === 0 || total === 0 ? (
        <p className="text-sm text-muted">No billed revenue in this period yet.</p>
      ) : (
        <div ref={scroller} className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className={detailed ? 'w-full min-w-[360px]' : 'min-w-[420px]'}
            role="img"
            aria-label="Revenue by day"
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0.28} />
                <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0} />
              </linearGradient>
            </defs>

            {/* faint guides at the top, the middle and the bottom of the range */}
            {[0, 0.5, 1].map((f) => {
              const y = baseline - (baseline - padTop) * f;
              return (
                <line
                  key={f}
                  x1={padX}
                  x2={W - padX}
                  y1={y}
                  y2={y}
                  className="stroke-border"
                  strokeWidth={1}
                  strokeDasharray={f === 0 ? undefined : '3 4'}
                />
              );
            })}

            <path d={area} fill={`url(#${gradientId})`} />
            <path
              d={line}
              fill="none"
              className="stroke-primary"
              strokeWidth={detailed ? 2.5 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {coords.map((c, i) => {
              const isLast = i === coords.length - 1;
              const showLabel = points.length <= 14 || i % 5 === 0 || isLast;
              return (
                <g key={c.label}>
                  {few && (
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r={isLast ? 4.5 : 3.5}
                      className={isLast ? 'fill-primary stroke-surface' : 'fill-surface stroke-primary'}
                      strokeWidth={2}
                    >
                      <title>
                        {c.label}: {formatMoney(c.value)}
                      </title>
                    </circle>
                  )}
                  {detailed && few && c.value > 0 && (
                    <text
                      x={c.x}
                      y={c.y - 9}
                      textAnchor="middle"
                      className="fill-foreground stroke-surface"
                      strokeWidth={3}
                      strokeLinejoin="round"
                      style={{ fontSize: 10, fontWeight: 600, paintOrder: 'stroke' }}
                    >
                      {COMPACT.format(c.value)}
                    </text>
                  )}
                  {(points.length <= 14 || detailed) && showLabel && (
                    <text x={c.x} y={H - 7} textAnchor="middle" className="fill-muted" style={{ fontSize: labelSize }}>
                      {c.label.slice(5)}
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
