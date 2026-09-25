import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Activity, ClipboardCheck, FileCheck2, FlaskConical, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { useAuth } from '@/features/auth/useAuth';
import type { DashboardSummary } from '../api';

interface Metric {
  label: string;
  value: string;
  isZero?: boolean;
  caption?: string;
  icon: LucideIcon;
  to?: string;
  permission?: string;
  tone?: 'neutral' | 'warning';
}

/** The dominant "today at a glance" row — one primary metric, four supporting ones. */
export function KpiHero({ summary }: { summary: DashboardSummary }) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  const secondary = ([
    {
      label: "Today's orders",
      value: String(summary.todayOrders),
      isZero: summary.todayOrders === 0,
      icon: ClipboardCheck,
      to: '/app/orders',
      permission: 'LAB_ORDER_READ',
    },
    {
      label: 'Samples in lab',
      value: String(summary.samplesInLab),
      isZero: summary.samplesInLab === 0,
      caption: summary.pendingCollection > 0 ? `${summary.pendingCollection} awaiting collection` : 'All collected',
      icon: FlaskConical,
      to: '/app/samples',
      permission: 'SAMPLE_READ',
      tone: summary.pendingCollection > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Reports issued',
      value: String(summary.reportsToday),
      isZero: summary.reportsToday === 0,
      icon: FileCheck2,
      to: '/app/reports',
      permission: 'REPORT_READ',
    },
    {
      label: "Today's revenue",
      value: formatMoney(summary.todayRevenue),
      isZero: summary.todayRevenue === 0,
      caption: summary.outstandingBalance > 0 ? `${formatMoney(summary.outstandingBalance)} outstanding` : 'Fully collected',
      icon: Wallet,
      to: '/app/invoices',
      permission: 'PAYMENT_READ',
      tone: summary.outstandingBalance > 0 ? 'warning' : 'neutral',
    },
  ] as Metric[]).filter((m) => !m.permission || hasPermission(m.permission));

  return (
    <div className="mb-5 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => navigate('/app/patients')}
        className="group flex min-h-[7.5rem] flex-[2_2_20rem] flex-col justify-between rounded-lg border-2 border-primary/30 shadow-card bg-primary/[0.07] p-5 text-left transition-colors hover:border-primary/50"
      >
        <div className="flex items-start justify-between">
          <span className="text-sm font-medium text-muted">Patients registered today</span>
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-5 w-5" aria-hidden />
          </span>
        </div>
        {/* A real zero shouldn't carry the same visual weight as a real count — it's the
            least-actionable number on the dashboard, not the most, so it's dimmed rather than
            rendered at full strength like every other value here. */}
        <p
          className={cn(
            'mt-3 text-4xl font-semibold tracking-tight',
            summary.todayPatients > 0 ? 'text-foreground' : 'text-muted-foreground/50',
          )}
        >
          {summary.todayPatients}
        </p>
        <p className="mt-1 text-xs text-muted">
          {summary.todayOrders} order{summary.todayOrders === 1 ? '' : 's'} placed so far today
        </p>
      </button>

      {secondary.map((m) => (
        <button
          key={m.label}
          type="button"
          onClick={m.to ? () => navigate(m.to!) : undefined}
          className={cn(
            'flex min-h-[7.5rem] flex-[1_1_11rem] flex-col justify-between rounded-lg border bg-surface p-4 text-left shadow-card transition-colors hover:border-primary/30',
            m.tone === 'warning' ? 'border-warning/30' : 'border-border',
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted">{m.label}</span>
            <m.icon className={cn('h-4 w-4', m.tone === 'warning' ? 'text-warning' : 'text-muted')} aria-hidden />
          </div>
          <p className={cn('mt-2 text-2xl font-semibold', m.isZero ? 'text-muted-foreground/50' : 'text-foreground')}>
            {m.value}
          </p>
          <p className={cn('mt-0.5 text-xs', m.tone === 'warning' ? 'text-warning' : 'text-muted')}>
            {m.caption ?? ' '}
          </p>
        </button>
      ))}
    </div>
  );
}
