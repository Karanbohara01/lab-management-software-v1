import { useMemo, useRef, useState } from 'react';
import { formatMoney } from '@/lib/money';
import type { AnalyticsPoint as Point } from './api';

const WIDTH = 640;
const HEIGHT = 160;
const PAD_LEFT = 44;
const PAD_RIGHT = 8;
const PAD_TOP = 12;
const PAD_BOTTOM = 24;

function compactMoney(value: number): string {
  if (value >= 100_000) return `${(value / 100_000).toFixed(1)}L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value >= 10_000 ? 0 : 1)}k`;
  return String(Math.round(value));
}

function shortDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * A real (if hand-rolled, no chart library — matching this codebase's existing convention)
 * line/area chart with a hover crosshair + tooltip, y-axis gridlines, and sparse x-axis date
 * labels — replaces a plain CSS bar strip with something an accountant can actually read
 * exact daily values from.
 */
export function RevenueTrendChart({ points }: { points: Point[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const max = Math.max(1, ...points.map((p) => p.value));
  const innerW = WIDTH - PAD_LEFT - PAD_RIGHT;
  const innerH = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const n = points.length;

  const xAt = (i: number) => PAD_LEFT + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (v: number) => PAD_TOP + innerH - (v / max) * innerH;

  const linePath = useMemo(
    () => points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(p.value)}`).join(' '),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [points, max],
  );
  const areaPath = useMemo(() => {
    if (points.length === 0) return '';
    return `${linePath} L ${xAt(n - 1)} ${PAD_TOP + innerH} L ${xAt(0)} ${PAD_TOP + innerH} Z`;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linePath, points]);

  const gridlines = [0, 0.5, 1].map((f) => ({ f, y: PAD_TOP + innerH - f * innerH }));

  // Show at most ~6 x-axis labels regardless of range length, evenly spaced.
  const tickCount = Math.min(6, n);
  const tickIndexes =
    tickCount <= 1 ? [0] : Array.from({ length: tickCount }, (_, i) => Math.round((i / (tickCount - 1)) * (n - 1)));

  const onMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg || n === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const ratio = n <= 1 ? 0 : (relX - PAD_LEFT) / innerW;
    const idx = Math.max(0, Math.min(n - 1, Math.round(ratio * (n - 1))));
    setHover(idx);
  };

  if (points.length === 0) {
    return <p className="px-5 py-4 text-sm text-muted">No data for this period.</p>;
  }

  const hovered = hover != null ? points[hover] : null;
  const total = points.reduce((s, p) => s + p.value, 0);

  return (
    <div className="px-5 py-4">
      <p className="mb-2 text-sm text-muted">
        Total collected: <span className="font-medium text-foreground">{formatMoney(total)}</span>
      </p>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label="Revenue collected per day"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        {gridlines.map(({ f, y }) => (
          <g key={f}>
            <line x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} className="stroke-border" strokeWidth={1} />
            <text x={PAD_LEFT - 6} y={y} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[9px]">
              {compactMoney(max * f)}
            </text>
          </g>
        ))}

        <path d={areaPath} className="fill-primary/10" />
        <path
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {tickIndexes.map((i) => {
          const point = points[i];
          if (!point) return null;
          return (
            <text key={i} x={xAt(i)} y={HEIGHT - 6} textAnchor="middle" className="fill-muted text-[9px]">
              {shortDate(point.label)}
            </text>
          );
        })}

        {hover != null && points[hover] && (
          <>
            <line
              x1={xAt(hover)}
              y1={PAD_TOP}
              x2={xAt(hover)}
              y2={PAD_TOP + innerH}
              className="stroke-muted"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <circle cx={xAt(hover)} cy={yAt(points[hover]!.value)} r={3.5} className="fill-primary" />
          </>
        )}
      </svg>

      {hovered && (
        <div className="mt-1 flex items-center justify-between rounded-md bg-surface-muted px-3 py-1.5 text-xs">
          <span className="font-medium text-foreground">{shortDate(hovered.label)}</span>
          <span className="text-muted">{formatMoney(hovered.value)}</span>
        </div>
      )}
    </div>
  );
}
