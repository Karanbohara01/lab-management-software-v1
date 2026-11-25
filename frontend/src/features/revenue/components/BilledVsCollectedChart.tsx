import { useId, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AnimatedNumber,
  EASE_OUT_EXPO,
  SPRING_SMOOTH,
  SPRING_SNAPPY,
  isTestEnv,
} from '@/components/ui/motion';
import { formatMoney } from '@/lib/money';
import { getLocale, LOCALE_TAG, useT } from '@/i18n';
import type { RevenueTrend } from '../types';

const COMPACT = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

function bucketLabel(iso: string, granularity: RevenueTrend['granularity']): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1);
  if (granularity === 'MONTH') return date.toLocaleDateString(LOCALE_TAG[getLocale()], { month: 'short', year: '2-digit' });
  return date.toLocaleDateString(LOCALE_TAG[getLocale()], { day: 'numeric', month: 'short' });
}

const GRANULARITY_UNIT: Record<RevenueTrend['granularity'], string> = { DAY: 'day', WEEK: 'week', MONTH: 'month' };

export function BilledVsCollectedChart({ trend }: { trend: RevenueTrend }) {
  const t = useT();
  const skipMotion = isTestEnv();
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
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
  const labelEvery = Math.max(1, Math.ceil(points.length / 14));

  if (points.length === 0) {
    return <p className="px-5 py-8 text-center text-body-sm text-muted">{t('No activity in this period.')}</p>;
  }

  const unit = t(GRANULARITY_UNIT[trend.granularity]);
  const seriesKey = `${trend.period.from}-${trend.period.to}-${trend.granularity}`;
  const hovered = hoverIdx != null ? coords[hoverIdx] : null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-x-5 gap-y-1 px-5 pb-2 text-caption">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-primary/35" aria-hidden />
            <span className="text-muted">{t('Billed')}</span>
            <AnimatedNumber
              value={totals.billed}
              format={formatMoney}
              className="font-medium tabular-nums text-foreground"
            />
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full bg-primary" aria-hidden />
            <span className="text-muted">{t('Collected')}</span>
            <AnimatedNumber
              value={totals.collected}
              format={formatMoney}
              className="font-medium tabular-nums text-foreground"
            />
          </span>
          <span className="text-muted">{t('per {unit}', { unit })}</span>
        </div>

        <AnimatePresence mode="wait">
          {hovered && (
            <motion.div
              key={hovered.bucket}
              initial={{ opacity: 0, y: -3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.14 }}
              className="inline-flex flex-wrap items-center gap-3 rounded-full border border-primary/25 bg-primary/[0.06] px-3 py-0.5 text-xs"
            >
              <span className="font-semibold text-foreground">{bucketLabel(hovered.bucket, trend.granularity)}</span>
              <span className="tabular-nums text-muted">
                {t('Billed')} <strong className="font-semibold text-foreground">{formatMoney(hovered.billed)}</strong>
              </span>
              <span className="tabular-nums text-muted">
                {t('Collected')} <strong className="font-semibold text-primary">{formatMoney(hovered.collected)}</strong>
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="overflow-x-auto px-2 pb-2">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full min-w-[640px]"
          role="img"
          aria-label={t('Billed and collected per {unit} over the selected period', { unit })}
          onMouseLeave={() => setHoverIdx(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" className="[stop-color:hsl(var(--primary))]" stopOpacity={0.22} />
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

          {coords.map((c, i) => {
            const targetY = y(c.billed);
            const targetH = Math.max(0, baseline - targetY);
            const isHovered = hoverIdx === i;
            return (
              <g key={c.bucket} onMouseEnter={() => setHoverIdx(i)} className="cursor-pointer">
                <rect
                  x={c.x - slot / 2}
                  y={padTop}
                  width={Math.max(4, slot)}
                  height={baseline - padTop}
                  fill="transparent"
                />
                <motion.rect
                  x={c.x - barW / 2}
                  width={barW}
                  rx={2}
                  className={isHovered ? 'fill-primary/55' : 'fill-primary/30'}
                  initial={skipMotion ? false : { y: baseline, height: 0 }}
                  animate={{ y: targetY, height: targetH }}
                  transition={{
                    ...SPRING_SMOOTH,
                    delay: skipMotion ? 0 : Math.min(i * 0.015, 0.4),
                  }}
                >
                  <title>
                    {t('{date} · billed {amount}', { date: bucketLabel(c.bucket, trend.granularity), amount: formatMoney(c.billed) })}
                  </title>
                </motion.rect>
              </g>
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
            strokeWidth={2.25}
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
              className="stroke-primary/45 pointer-events-none"
              strokeWidth={1}
              strokeDasharray="3 3"
            />
          )}

          {coords.map((c, i) => {
            const isHovered = hoverIdx === i;
            return (
              <g key={`c-${c.bucket}`} onMouseEnter={() => setHoverIdx(i)} className="cursor-pointer">
                {(points.length <= 40 || isHovered) && (
                  <motion.circle
                    cx={c.x}
                    cy={c.cy}
                    r={isHovered ? 4.5 : 3}
                    className={isHovered ? 'fill-primary stroke-surface' : 'fill-surface stroke-primary'}
                    strokeWidth={2}
                    initial={skipMotion ? false : { scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ ...SPRING_SNAPPY, delay: skipMotion ? 0 : Math.min(i * 0.015, 0.4) }}
                  >
                    <title>
                      {t('{date} · collected {amount}', { date: bucketLabel(c.bucket, trend.granularity), amount: formatMoney(c.collected) })}
                      {c.refunded > 0 ? ` ${t('· refunded {amount}', { amount: formatMoney(c.refunded) })}` : ''}
                    </title>
                  </motion.circle>
                )}
                {i % labelEvery === 0 && (
                  <text x={c.x} y={H - 10} textAnchor="middle" className="fill-muted" style={{ fontSize: 10 }}>
                    {bucketLabel(c.bucket, trend.granularity)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
