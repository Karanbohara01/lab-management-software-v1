import { TrendingUp } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import { SPRING_SMOOTH, isTestEnv } from '@/components/ui/motion';
import { SectionHeader } from '@/features/dashboard/components/SectionHeader';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';
import type { SignupPoint } from './types';

function monthLabel(ym: string): string {
  const parts = ym.split('-').map(Number);
  const y = parts[0] ?? 0;
  const m = parts[1] ?? 1;
  return new Date(y, m - 1, 1).toLocaleDateString(LOCALE_TAG[getLocale()], { month: 'short' });
}

/** Real clinics onboarded per month — spring-animated SVG bar chart. */
export function SignupsTrend({ points }: { points: SignupPoint[] }) {
  const t = useT();
  const skipMotion = isTestEnv();
  const max = Math.max(1, ...points.map((p) => p.count));
  const total = points.reduce((s, p) => s + p.count, 0);
  const W = 360;
  const H = 120;
  const padX = 4;
  const padBottom = 18;
  const baseline = H - padBottom;
  const barGap = 8;
  const barW = points.length > 0 ? (W - padX * 2) / points.length - barGap : 0;

  return (
    <Card className="p-5">
      <SectionHeader icon={TrendingUp} title={t('Clinics onboarded')} description={t('Last 6 months · {total} total', { total })} />
      {total === 0 ? (
        <p className="text-sm text-muted">{t('No clinics onboarded in this period yet.')}</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={t('Clinics onboarded per month')}>
          {points.map((p, i) => {
            const h = Math.max(2, (baseline * p.count) / max);
            const x = padX + i * (barW + barGap);
            const y = baseline - h;
            return (
              <g key={p.month} className="group">
                <motion.rect
                  x={x}
                  width={Math.max(1, barW)}
                  rx={3}
                  className="fill-primary/70 transition-colors group-hover:fill-primary"
                  initial={skipMotion ? false : { y: baseline, height: 0 }}
                  animate={{ y, height: h }}
                  transition={{ ...SPRING_SMOOTH, delay: skipMotion ? 0 : i * 0.06 }}
                >
                  <title>
                    {monthLabel(p.month)}: {p.count}
                  </title>
                </motion.rect>
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
