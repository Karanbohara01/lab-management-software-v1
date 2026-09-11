import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { ordersApi } from '@/features/orders/api';
import { reportsApi } from '@/features/reports/api';
import { ORDER_STATUS_TONE } from '@/features/orders/types';
import { REPORT_STATUS_TONE } from '@/features/reports/types';
import { formatDateTime } from '@/features/patients/format';
import { DashboardHeader } from '../components/DashboardHeader';
import { SectionHeader } from '../components/SectionHeader';
import type { RoleDashboardProps } from './types';

/** Read-only view for external referrers: recent lab activity, no operational actions. */
export function DoctorDashboard({ lastUpdated, refreshing, onRefresh }: RoleDashboardProps) {
  const navigate = useNavigate();
  const ordersQ = useQuery(() => ordersApi.list({ size: 8 }), []);
  const reportsQ = useQuery(() => reportsApi.list({ size: 8 }), []);

  return (
    <>
      <DashboardHeader
        subtitle="Recent lab orders and reports."
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <SectionHeader title="Recent orders" />
          {ordersQ.loading && !ordersQ.data ? (
            <LoadingState />
          ) : ordersQ.error ? (
            <ErrorState message={ordersQ.error} onRetry={ordersQ.refetch} />
          ) : (
            <ul className="divide-y divide-border">
              {ordersQ.data?.content.map((o) => (
                <li key={o.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/orders/${o.id}`)}
                    className="flex w-full items-center gap-3 py-2.5 text-left first:pt-0 last:pb-0 hover:underline"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {o.patientName} <span className="font-mono text-xs text-muted">{o.orderNumber}</span>
                      </p>
                      <p className="text-xs text-muted">{formatDateTime(o.orderedAt)}</p>
                    </div>
                    <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <SectionHeader title="Recent reports" />
          {reportsQ.loading && !reportsQ.data ? (
            <LoadingState />
          ) : reportsQ.error ? (
            <ErrorState message={reportsQ.error} onRetry={reportsQ.refetch} />
          ) : (
            <ul className="divide-y divide-border">
              {reportsQ.data?.content.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => navigate(`/app/reports/${r.id}`)}
                    className="flex w-full items-center gap-3 py-2.5 text-left first:pt-0 last:pb-0 hover:underline"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">
                        {r.patientName} <span className="font-mono text-xs text-muted">{r.reportNumber}</span>
                      </p>
                    </div>
                    <Badge tone={REPORT_STATUS_TONE[r.status]}>{r.status}</Badge>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
