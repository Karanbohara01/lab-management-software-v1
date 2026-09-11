import { ScrollText, Wallet } from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { analyticsApi } from '@/features/analytics/api';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatTileRow } from '../components/StatTile';
import { RevenueTrend } from '../components/RevenueTrend';
import { OutstandingInvoices } from '../components/queues/OutstandingInvoices';
import { RefundsToApprove } from '../components/queues/RefundsToApprove';
import type { RoleDashboardProps } from './types';

/** Accounts desk: billing, refunds and e-billing health — the money side of the pipeline. */
export function AccountantDashboard({ summary, lastUpdated, refreshing, onRefresh }: RoleDashboardProps) {
  const { hasPermission } = useAuth();
  const canSeeAnalytics = hasPermission(PERMISSIONS.REPORTING_READ);
  const analyticsQ = useQuery(() => (canSeeAnalytics ? analyticsApi.overview(14) : Promise.resolve(null)), [canSeeAnalytics]);

  return (
    <>
      <DashboardHeader
        subtitle="Invoices, refunds and e-billing at a glance."
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <StatTileRow
        stats={[
          { label: "Today's revenue", value: formatMoney(summary.todayRevenue), icon: Wallet },
          {
            label: 'Outstanding balance',
            value: formatMoney(summary.outstandingBalance),
            icon: Wallet,
            tone: summary.outstandingBalance > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Failed IRD submissions',
            value: summary.failedIrdSubmissions,
            icon: ScrollText,
            tone: summary.failedIrdSubmissions > 0 ? 'warning' : 'neutral',
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <OutstandingInvoices />
        <RefundsToApprove />
      </div>

      {canSeeAnalytics && analyticsQ.data && (
        <div className="mt-4">
          <RevenueTrend points={analyticsQ.data.revenueByDay} days={14} />
        </div>
      )}
    </>
  );
}
