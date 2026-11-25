import type { LucideIcon } from 'lucide-react';
import type { IconType } from 'react-icons';
import { motion } from 'framer-motion';
import {
  AnimatedNumber,
  SPRING_SNAPPY,
  isTestEnv,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import { useNavigateFrom } from '@/lib/navigation';
import { useT } from '@/i18n';

export interface StatTileData {
  label: string;
  value: string | number;
  icon: LucideIcon | IconType;
  to?: string;
  tone?: 'neutral' | 'warning';
}

/** A row of compact, click-through stat tiles — the lightweight KPI strip used on role dashboards. */
export function StatTileRow({ stats }: { stats: StatTileData[] }) {
  const navigate = useNavigateFrom();
  const t = useT();
  const skipMotion = isTestEnv();
  if (stats.length === 0) return null;
  return (
    <motion.div
      variants={staggerContainerVariants}
      initial={skipMotion ? false : 'hidden'}
      animate="show"
      className="mb-5 flex flex-wrap gap-3"
    >
      {stats.map((s) => (
        <motion.button
          key={s.label}
          variants={staggerItemVariants}
          whileHover={!skipMotion && s.to ? { y: -3 } : undefined}
          whileTap={!skipMotion && s.to ? { scale: 0.985 } : undefined}
          transition={SPRING_SNAPPY}
          type="button"
          onClick={s.to ? () => navigate(s.to!) : undefined}
          className={cn(
            'group flex min-h-[6rem] flex-[1_1_11rem] flex-col justify-between rounded-lg border bg-surface p-4 text-left shadow-card transition-colors',
            s.to && 'hover:border-primary/30 hover:shadow-md',
            s.tone === 'warning' ? 'border-warning/30' : 'border-border',
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted">{t(s.label)}</span>
            <s.icon
              className={cn(
                'h-8 w-8 shrink-0 transition-transform duration-200 group-hover:scale-105',
                s.tone === 'warning' ? 'text-warning' : 'text-primary',
              )}
              aria-hidden
            />
          </div>
          <p className="mt-2 text-price tabular-nums text-foreground">
            {typeof s.value === 'number' ? <AnimatedNumber value={s.value} /> : s.value}
          </p>
        </motion.button>
      ))}
    </motion.div>
  );
}
