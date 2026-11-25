import { useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import { Activity, ClipboardCheck, FileCheck2, FlaskConical, Wallet } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import {
  AnimatedNumber,
  SPRING_SNAPPY,
  isTestEnv,
  staggerContainerVariants,
  staggerItemVariants,
} from '@/components/ui/motion';
import { useAuth } from '@/features/auth/useAuth';
import type { DashboardSummary } from '../api';
import { useNavigateFrom } from '@/lib/navigation';
import { useT } from '@/i18n';

const ART = {
  patients: '/dashboard-icons/patients.png',
  orders: '/dashboard-icons/orders.png',
  samples: '/dashboard-icons/samples.png',
  reports: '/dashboard-icons/reports.png',
  revenue: '/dashboard-icons/revenue.png',
} as const;

interface Metric {
  label: string;
  rawValue: number;
  format?: (n: number) => string;
  isZero?: boolean;
  caption?: string;
  icon: LucideIcon;
  art?: string;
  to?: string;
  permission?: string;
  tone?: 'neutral' | 'warning';
}

function MetricIcon({ art, icon: Icon, warning }: { art?: string; icon: LucideIcon; warning?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!art || failed) {
    return (
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-105',
          warning ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary',
        )}
      >
        <Icon className="h-5 w-5" aria-hidden />
      </span>
    );
  }
  return (
    <img
      src={art}
      width={160}
      height={160}
      alt=""
      draggable={false}
      onError={() => setFailed(true)}
      className="h-12 w-12 shrink-0 select-none object-contain transition-transform duration-200 group-hover:scale-105"
    />
  );
}

/** The dominant "today at a glance" row — one primary metric, four supporting ones, with spring entrances and animated counters. */
export function KpiHero({ summary }: { summary: DashboardSummary }) {
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const t = useT();
  const skipMotion = isTestEnv();

  const secondary = ([
    {
      label: t("Today's orders"),
      rawValue: summary.todayOrders,
      isZero: summary.todayOrders === 0,
      icon: ClipboardCheck,
      art: ART.orders,
      to: '/app/orders',
      permission: 'LAB_ORDER_READ',
    },
    {
      label: t('Samples in lab'),
      rawValue: summary.samplesInLab,
      isZero: summary.samplesInLab === 0,
      caption:
        summary.pendingCollection > 0
          ? t('{count} awaiting collection', { count: summary.pendingCollection })
          : t('All collected'),
      icon: FlaskConical,
      art: ART.samples,
      to: '/app/samples',
      permission: 'SAMPLE_READ',
      tone: summary.pendingCollection > 0 ? 'warning' : 'neutral',
    },
    {
      label: t('Reports issued'),
      rawValue: summary.reportsToday,
      isZero: summary.reportsToday === 0,
      icon: FileCheck2,
      art: ART.reports,
      to: '/app/reports',
      permission: 'REPORT_READ',
    },
    {
      label: t("Today's revenue"),
      rawValue: summary.todayRevenue,
      format: formatMoney,
      isZero: summary.todayRevenue === 0,
      caption:
        summary.outstandingBalance > 0
          ? t('{amount} outstanding', { amount: formatMoney(summary.outstandingBalance) })
          : t('Fully collected'),
      icon: Wallet,
      art: ART.revenue,
      to: '/app/invoices',
      permission: 'PAYMENT_READ',
      tone: summary.outstandingBalance > 0 ? 'warning' : 'neutral',
    },
  ] as Metric[]).filter((m) => !m.permission || hasPermission(m.permission));

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial={skipMotion ? false : 'hidden'}
      animate="show"
      className="mb-5 flex flex-wrap gap-3"
    >
      <motion.button
        variants={staggerItemVariants}
        whileHover={skipMotion ? undefined : { y: -3 }}
        whileTap={skipMotion ? undefined : { scale: 0.985 }}
        transition={SPRING_SNAPPY}
        type="button"
        onClick={() => navigate('/app/patients')}
        className="group flex flex-[2_2_20rem] items-center gap-4 rounded-lg border-2 border-primary/30 bg-primary/[0.07] px-4 py-3 text-left shadow-card transition-colors hover:border-primary/50"
      >
        <MetricIcon art={ART.patients} icon={Activity} />
        <div className="min-w-0">
          <span className="block text-sm font-medium text-muted">{t('Patients registered today')}</span>
          <p
            className={cn(
              'my-0.5 text-price tabular-nums',
              summary.todayPatients > 0 ? 'text-foreground' : 'text-muted-foreground/50',
            )}
          >
            <AnimatedNumber value={summary.todayPatients} />
          </p>
          <p className="text-xs text-muted">
            {t('{count} order(s) placed so far today', { count: summary.todayOrders })}
          </p>
        </div>
      </motion.button>

      {secondary.map((m) => (
        <motion.button
          key={m.label}
          variants={staggerItemVariants}
          whileHover={skipMotion ? undefined : { y: -3 }}
          whileTap={skipMotion ? undefined : { scale: 0.985 }}
          transition={SPRING_SNAPPY}
          type="button"
          onClick={m.to ? () => navigate(m.to!) : undefined}
          className={cn(
            'group flex flex-[1_1_11rem] items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left shadow-card transition-colors hover:border-primary/30',
            m.tone === 'warning' ? 'border-warning/30' : 'border-border',
          )}
        >
          <MetricIcon art={m.art} icon={m.icon} warning={m.tone === 'warning'} />
          <div className="min-w-0">
            <span className="block text-xs font-medium text-muted">{m.label}</span>
            <p
              className={cn(
                'my-0.5 text-2xl font-semibold leading-none tracking-tight tabular-nums',
                m.isZero ? 'text-muted-foreground/50' : 'text-foreground',
              )}
            >
              <AnimatedNumber value={m.rawValue} format={m.format} />
            </p>
            {m.caption && (
              <p className={cn('text-xs', m.tone === 'warning' ? 'text-warning' : 'text-muted')}>{m.caption}</p>
            )}
          </div>
        </motion.button>
      ))}
    </motion.div>
  );
}
