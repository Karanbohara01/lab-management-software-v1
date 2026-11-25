import { useId, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatMoney } from '@/lib/money';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';
import { AnimatedNumber, EASE_OUT_EXPO, SPRING_SNAPPY, isTestEnv } from '@/components/ui/motion';
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
  return d.toLocaleDateString(LOCALE_TAG[getLocale()], { month: 'short', day: 'numeric' });
}

/**
 * Interactive line/area chart with Framer Motion path-drawing choreography, gradient area fade,
 * spring-tracked hover crosshair, and animated currency counter.
 */
export function RevenueTrendChart({ points }: { points: Point[] }) {
  const t = useT();
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const skipMotion = isTestEnv();
  const gradientId = `analytics-rev-fill-${useId().replace(/:/g, '')}`;

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
    return <p className="px-5 py-4 text-sm text-muted">{t('No data for this period.')}</p>;
  }

  const hovered = hover != null ? points[hover] : null;
  const total = points.reduce((s, p) => s + p.value, 0);
  const seriesKey = `${points.length}-${points[0]?.label ?? ''}-${points[points.length - 1]?.label ?? ''}`;

  return (
    <div className="px-5 py-4">
      <div className="mb-2 flex items-center justify-between text-sm">
        <p className="text-muted">
          {t('Total collected')}:{' '}
          <AnimatedNumber
            value={total}
            format={formatMoney}
            className="font-semibold tabular-nums text-foreground"
          />
        </p>
        <AnimatePresence mode="wait">
          {hovered && (
            <motion.div
              key={hovered.label}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.15 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-2.5 py-0.5 text-xs"
            >
              <span className="font-medium text-foreground">{shortDate(hovered.label)}</span>
              <span className="font-semibold tabular-nums text-primary">{formatMoney(hovered.value)}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <svg
        ref={svgRef}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="w-full touch-none"
        role="img"
        aria-label={t('Revenue collected per day')}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0.26} />
            <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0.01} />
          </linearGradient>
        </defs>

        {gridlines.map(({ f, y }) => (
          <g key={f}>
            <line x1={PAD_LEFT} y1={y} x2={WIDTH - PAD_RIGHT} y2={y} className="stroke-border" strokeWidth={1} />
            <text x={PAD_LEFT - 6} y={y} textAnchor="end" dominantBaseline="middle" className="fill-muted text-[9px]">
              {compactMoney(max * f)}
            </text>
          </g>
        ))}

        <motion.path
          key={`area-${seriesKey}`}
          d={areaPath}
          fill={`url(#${gradientId})`}
          initial={skipMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
        <motion.path
          key={`line-${seriesKey}`}
          d={linePath}
          fill="none"
          className="stroke-primary"
          strokeWidth={2.25}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={skipMotion ? false : { pathLength: 0, opacity: 0.4 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={EASE_OUT_EXPO}
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
          <g>
            <motion.line
              initial={false}
              animate={{ x1: xAt(hover), x2: xAt(hover) }}
              transition={SPRING_SNAPPY}
              y1={PAD_TOP}
              y2={PAD_TOP + innerH}
              className="stroke-primary/50"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
            <motion.circle
              initial={false}
              animate={{ cx: xAt(hover), cy: yAt(points[hover]!.value) }}
              transition={SPRING_SNAPPY}
              r={6}
              className="fill-primary/20"
            />
            <motion.circle
              initial={false}
              animate={{ cx: xAt(hover), cy: yAt(points[hover]!.value) }}
              transition={SPRING_SNAPPY}
              r={3.5}
              className="fill-primary stroke-surface"
              strokeWidth={1.5}
            />
          </g>
        )}
      </svg>
    </div>
  );
}
