import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatMoney } from '@/lib/money';
import { commissionApi } from './api';
import type { DoctorCommissionSummary } from './types';
import { DoctorCommissionModal } from './DoctorCommissionModal';

export function CommissionPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.COMMISSION_MANAGE);
  const { data, loading, error, refetch } = useQuery(() => commissionApi.summary(), []);
  const [selected, setSelected] = useState<DoctorCommissionSummary | null>(null);

  const totals = (data ?? []).reduce(
    (acc, d) => ({
      earned: acc.earned + d.totalEarned,
      paid: acc.paid + d.totalPaid,
      outstanding: acc.outstanding + d.outstanding,
    }),
    { earned: 0, paid: 0, outstanding: 0 },
  );

  return (
    <>
      <PageHeader
        title="Referring doctor commission"
        description="Commission earned automatically when an invoice from a referred order is issued, as a % of the taxable amount. Payouts are recorded separately as a running balance, not matched invoice-by-invoice."
      />

      <Card>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState
            title="No commission earned yet"
            message="Set a commission rate on a referring doctor's profile, then issue an invoice from an order they referred."
          />
        ) : (
          data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-2">Doctor</th>
                    <th className="px-4 py-2">Rate</th>
                    <th className="px-4 py-2 text-right">Earned</th>
                    <th className="px-4 py-2 text-right">Paid</th>
                    <th className="px-4 py-2 text-right">Outstanding</th>
                    <th className="px-4 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {data.map((d) => (
                    <tr key={d.doctorId} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-medium text-foreground">{d.doctorName}</td>
                      <td className="px-4 py-2 text-muted">{d.commissionRate != null ? `${d.commissionRate}%` : '—'}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(d.totalEarned)}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(d.totalPaid)}</td>
                      <td className="px-4 py-2 text-right">
                        {d.outstanding > 0 ? (
                          <Badge tone="warning">{formatMoney(d.outstanding)}</Badge>
                        ) : (
                          <span className="text-muted">{formatMoney(d.outstanding)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Button variant="secondary" size="sm" onClick={() => setSelected(d)}>
                          {canManage ? 'View / Pay' : 'View'}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="px-4 py-2" colSpan={2}>
                      Total ({data.length} doctor{data.length === 1 ? '' : 's'})
                    </td>
                    <td className="px-4 py-2 text-right">{formatMoney(totals.earned)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(totals.paid)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(totals.outstanding)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        )}
      </Card>

      {selected && (
        <DoctorCommissionModal
          summary={selected}
          canManage={canManage}
          onClose={() => setSelected(null)}
          onPaid={() => {
            refetch();
          }}
        />
      )}
    </>
  );
}
