import { motion } from 'framer-motion';
import { Card } from '@/components/ui/Card';
import {
  AnimatedNumber,
  SPRING_SMOOTH,
  isTestEnv,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/ui/motion';
import { SectionHeader } from './SectionHeader';
import type { AnalyticsPoint } from '@/features/analytics/api';
import { useT } from '@/i18n';

/** Share of test volume per department, over the selected period, with spring-animated bars. */
export function DepartmentWorkload({ points, days }: { points: AnalyticsPoint[]; days: number }) {
  const t = useT();
  const skipMotion = isTestEnv();
  const total = points.reduce((s, p) => s + p.value, 0) || 1;
  const top = [...points].sort((a, b) => b.value - a.value).slice(0, 6);

  return (
    <Card className="min-w-0 p-5">
      <SectionHeader title="Department workload" description={t('Share of tests ordered · last {days} day(s)', { days })} />
      {top.length === 0 ? (
        <p className="text-sm text-muted">{t('No tests ordered in this period.')}</p>
      ) : (
        <motion.ul
          key={days}
          variants={staggerContainerVariants}
          initial={skipMotion ? false : 'hidden'}
          animate="show"
          className="space-y-4"
        >
          {top.map((p, idx) => {
            const pct = Math.round((p.value / total) * 100);
            return (
              <motion.li key={p.label} variants={staggerItemVariants} className="group">
                <div className="flex items-baseline justify-between text-sm">
                  <span className="font-medium text-foreground transition-colors group-hover:text-primary">
                    {p.label}
                  </span>
                  <span className="text-xs tabular-nums text-muted">
                    <AnimatedNumber value={p.value} className="font-medium text-foreground" /> ·{' '}
                    <AnimatedNumber value={pct} format={(n) => `${Math.round(n)}%`} />
                  </span>
                </div>
                <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted">
                  <motion.div
                    className="h-2 rounded-full bg-primary transition-colors group-hover:bg-primary/85"
                    initial={skipMotion ? false : { width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{
                      ...SPRING_SMOOTH,
                      delay: skipMotion ? 0 : idx * 0.055,
                    }}
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
