import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Activity, ClipboardCheck, FileCheck2, FlaskConical, Wallet } from 'lucide-react';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { useAuth } from '@/features/auth/useAuth';
import type { DashboardSummary } from '../api';

/**
 * Illustrations for the headline cards — `frontend/public/dashboard-icons/` (160 x 160
 * transparent PNGs). Until a file exists the card shows its plain line icon instead.
 */
const ART = {
  patients: '/dashboard-icons/patients.png',
  orders: '/dashboard-icons/orders.png',
  samples: '/dashboard-icons/samples.png',
  reports: '/dashboard-icons/reports.png',
  revenue: '/dashboard-icons/revenue.png',
} as const;

interface Metric {
  label: string;
  value: string;
  isZero?: boolean;
  caption?: string;
  icon: LucideIcon;
  art?: string;
  to?: string;
  permission?: string;
  tone?: 'neutral' | 'warning';
}

/** A card's picture: the illustration if its file exists, otherwise the plain icon on a soft tile. */
function MetricIcon({ art, icon: Icon, warning }: { art?: string; icon: LucideIcon; warning?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (!art || failed) {
    return (
      <span
        className={cn(
          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg',
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
      className="h-12 w-12 shrink-0 select-none object-contain"
    />
  );
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
      art: ART.orders,
      to: '/app/orders',
      permission: 'LAB_ORDER_READ',
    },
    {
      label: 'Samples in lab',
      value: String(summary.samplesInLab),
      isZero: summary.samplesInLab === 0,
      caption: summary.pendingCollection > 0 ? `${summary.pendingCollection} awaiting collection` : 'All collected',
      icon: FlaskConical,
      art: ART.samples,
      to: '/app/samples',
      permission: 'SAMPLE_READ',
      tone: summary.pendingCollection > 0 ? 'warning' : 'neutral',
    },
    {
      label: 'Reports issued',
      value: String(summary.reportsToday),
      isZero: summary.reportsToday === 0,
      icon: FileCheck2,
      art: ART.reports,
      to: '/app/reports',
      permission: 'REPORT_READ',
    },
    {
      label: "Today's revenue",
      value: formatMoney(summary.todayRevenue),
      isZero: summary.todayRevenue === 0,
      caption: summary.outstandingBalance > 0 ? `${formatMoney(summary.outstandingBalance)} outstanding` : 'Fully collected',
      icon: Wallet,
      art: ART.revenue,
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
        className="group flex flex-[2_2_20rem] items-center gap-4 rounded-lg border-2 border-primary/30 bg-primary/[0.07] px-4 py-3 text-left shadow-card transition-colors hover:border-primary/50"
      >
        <MetricIcon art={ART.patients} icon={Activity} />
        <div className="min-w-0">
          <span className="block text-sm font-medium text-muted">Patients registered today</span>
          {/* A real zero shouldn't carry the same visual weight as a real count — it's the
              least-actionable number on the dashboard, not the most, so it's dimmed rather than
              rendered at full strength like every other value here. */}
          <p
            className={cn(
              'my-0.5 text-3xl font-semibold leading-none tracking-tight',
              summary.todayPatients > 0 ? 'text-foreground' : 'text-muted-foreground/50',
            )}
          >
            {summary.todayPatients}
          </p>
          <p className="text-xs text-muted">
            {summary.todayOrders} order{summary.todayOrders === 1 ? '' : 's'} placed so far today
          </p>
        </div>
      </button>

      {secondary.map((m) => (
        <button
          key={m.label}
          type="button"
          onClick={m.to ? () => navigate(m.to!) : undefined}
          className={cn(
            'flex flex-[1_1_11rem] items-center gap-3 rounded-lg border bg-surface px-3.5 py-3 text-left shadow-card transition-colors hover:border-primary/30',
            m.tone === 'warning' ? 'border-warning/30' : 'border-border',
          )}
        >
          <MetricIcon art={m.art} icon={m.icon} warning={m.tone === 'warning'} />
          <div className="min-w-0">
            <span className="block text-xs font-medium text-muted">{m.label}</span>
            <p className={cn('my-0.5 text-2xl font-semibold leading-none', m.isZero ? 'text-muted-foreground/50' : 'text-foreground')}>
              {m.value}
            </p>
            {m.caption && (
              <p className={cn('text-xs', m.tone === 'warning' ? 'text-warning' : 'text-muted')}>{m.caption}</p>
            )}
          </div>
        </button>
      ))}
    </div>
  );
}
