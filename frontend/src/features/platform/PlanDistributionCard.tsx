import { PieChart } from 'lucide-react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import {
  AnimatedNumber,
  SPRING_SMOOTH,
  isTestEnv,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/ui/motion';
import { SectionHeader } from '@/features/dashboard/components/SectionHeader';
import { useT } from '@/i18n';
import type { PlanDistributionPoint } from './types';

const SHADES = ['bg-primary', 'bg-primary/75', 'bg-primary/55', 'bg-primary/40', 'bg-primary/28', 'bg-primary/18'];

/** Share of clinics on each plan, by current subscription, with spring-animated bars. */
export function PlanDistributionCard({ points }: { points: PlanDistributionPoint[] }) {
  const t = useT();
  const skipMotion = isTestEnv();
  const total = points.reduce((s, p) => s + p.count, 0) || 1;

  return (
    <Card className="p-5">
      <SectionHeader icon={PieChart} title={t('Plan distribution')} description={t('Clinics on each plan today')} />
      {points.length === 0 ? (
        <p className="text-sm text-muted">{t('No active subscriptions yet.')}</p>
      ) : (
        <motion.ul
          variants={staggerContainerVariants}
          initial={skipMotion ? false : 'hidden'}
          animate="show"
          className="space-y-3"
        >
          {points.map((p, i) => {
            const pct = Math.round((p.count / total) * 100);
            const shade = SHADES[i % SHADES.length];
            return (
              <motion.li key={p.planCode} variants={staggerItemVariants}>
                <div className="flex items-baseline justify-between text-sm">
                  <span className="flex items-center gap-2 text-foreground">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-sm ${shade}`} aria-hidden />
                    {p.planName}
                  </span>
                  <span className="text-xs tabular-nums text-muted">
                    <AnimatedNumber value={p.count} className="font-medium text-foreground" /> ·{' '}
                    <AnimatedNumber value={pct} format={(n) => `${Math.round(n)}%`} />
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <motion.div
                    className={`h-2 rounded-full ${shade}`}
                    initial={skipMotion ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ ...SPRING_SMOOTH, delay: skipMotion ? 0 : i * 0.06 }}
                  />
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
    </Card>
  );
}
