import { useEffect, useId, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { EASE_OUT_EXPO, SPRING_SNAPPY, isTestEnv } from '@/components/ui/motion';
import { formatMoney } from '@/lib/money';
import { SectionHeader } from './SectionHeader';
import type { AnalyticsPoint } from '@/features/analytics/api';
import { useT } from '@/i18n';

const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

export function RevenueTrend({
  points,
  days,
  detailed = false,
}: {
  points: AnalyticsPoint[];
  days: number;
  detailed?: boolean;
}) {
  const t = useT();
  const skipMotion = isTestEnv();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const max = Math.max(1, ...points.map((p) => p.value));
  const total = points.reduce((s, p) => s + p.value, 0);
  const W = detailed ? 480 : 560;
  const H = detailed ? 190 : 140;
  const padX = detailed ? 14 : 12;
  const padTop = detailed ? 26 : 10;
  const padBottom = detailed ? 24 : 18;
  const slot = points.length > 0 ? (W - padX * 2) / points.length : 0;
  const labelSize = detailed ? 10 : 8;
  const few = points.length <= 14;
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

  const scroller = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [points]);

  const seriesKey = `${days}-${points.length}-${total}`;
  const hovered = hoverIdx != null ? coords[hoverIdx] : null;

  return (
    <Card className="min-w-0 p-5">
      <SectionHeader
        title="Revenue trend"
        description={t('Booked per day · last {days} day(s) · total {total}', { days, total: formatMoney(total) })}
        action={
          <AnimatePresence mode="wait">
            {hovered && (
              <motion.span
                key={hovered.label}
                initial={{ opacity: 0, y: -3 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -3 }}
                transition={{ duration: 0.14 }}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.07] px-2.5 py-0.5 text-xs"
              >
                <span className="text-muted">{hovered.label.slice(5)}</span>
                <span className="font-semibold tabular-nums text-primary">{formatMoney(hovered.value)}</span>
              </motion.span>
            )}
          </AnimatePresence>
        }
      />
      {points.length === 0 || total === 0 ? (
        <p className="text-sm text-muted">{t('No billed revenue in this period yet.')}</p>
      ) : (
        <div ref={scroller} className="overflow-x-auto">
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className={detailed ? 'w-full min-w-[360px]' : 'min-w-[420px]'}
            role="img"
            aria-label={t('Revenue by day')}
            onMouseLeave={() => setHoverIdx(null)}
          >
            <defs>
              <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0.28} />
                <stop offset="100%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0} />
              </linearGradient>
            </defs>

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

            <motion.path
              key={`area-${seriesKey}`}
              d={area}
              fill={`url(#${gradientId})`}
              initial={skipMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.65, ease: 'easeOut' }}
            />
            <motion.path
              key={`line-${seriesKey}`}
              d={line}
              fill="none"
              className="stroke-primary"
              strokeWidth={detailed ? 2.5 : 2}
              strokeLinecap="round"
              strokeLinejoin="round"
              initial={skipMotion ? false : { pathLength: 0, opacity: 0.4 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={EASE_OUT_EXPO}
            />

            {hovered && (
              <motion.line
                initial={false}
                animate={{ x1: hovered.x, x2: hovered.x }}
                transition={SPRING_SNAPPY}
                y1={padTop}
                y2={baseline}
                className="stroke-primary/40"
                strokeWidth={1}
                strokeDasharray="3 3"
              />
            )}

            {coords.map((c, i) => {
              const isLast = i === coords.length - 1;
              const isHovered = hoverIdx === i;
              const showLabel = points.length <= 14 || i % 5 === 0 || isLast;
              return (
                <g key={c.label} onMouseEnter={() => setHoverIdx(i)} className="cursor-pointer">
                  <rect
                    x={c.x - slot / 2}
                    y={padTop}
                    width={Math.max(4, slot)}
                    height={baseline - padTop}
                    fill="transparent"
                  />
                  {(few || isHovered) && (
                    <motion.circle
                      cx={c.x}
                      cy={c.y}
                      r={isHovered ? 5 : isLast ? 4.5 : 3.5}
                      className={isLast || isHovered ? 'fill-primary stroke-surface' : 'fill-surface stroke-primary'}
                      strokeWidth={2}
                      initial={skipMotion ? false : { scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ ...SPRING_SNAPPY, delay: skipMotion ? 0 : Math.min(i * 0.03, 0.4) }}
                    >
                      <title>{t('{label}: {amount}', { label: c.label, amount: formatMoney(c.value) })}</title>
                    </motion.circle>
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
