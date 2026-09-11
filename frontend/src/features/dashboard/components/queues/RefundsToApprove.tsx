import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { ApiError } from '@/types/api';
import { refundsApi } from '@/features/billing/api';
import { formatMoney } from '@/lib/money';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { QueueShell } from './QueueShell';

/** Accounts worklist: refund requests awaiting the segregated approval step. */
export function RefundsToApprove() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const toast = useToast();
  const [busyId, setBusyId] = useState<number | null>(null);
  const { data, loading, error, refetch } = useQuery(
    () => refundsApi.list({ status: 'REQUESTED', size: 8 }),
    [],
  );

  const decide = async (id: number, approve: boolean) => {
    const note = window.prompt(approve ? 'Approval note (optional):' : 'Reason for rejecting this refund:', '');
    if (note === null || (!approve && !note.trim())) return;
    setBusyId(id);
    try {
      if (approve) await refundsApi.approve(id, note.trim() || undefined);
      else await refundsApi.reject(id, note.trim());
      toast.success(approve ? 'Refund approved' : 'Refund rejected');
      refetch();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Action failed');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <QueueShell
      title="Refunds to approve"
      description="Requested by another staff member — approval requires a second person."
      count={data?.totalElements}
      viewAllTo="/app/refunds"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="No refund requests are waiting on approval."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((r) => (
          <li key={r.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/invoices/${r.invoiceId}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {r.patientName} <span className="font-mono text-xs text-muted">{formatMoney(r.amount)}</span>
              </p>
              <p className="truncate text-xs text-muted">
                {r.reason} · requested by {r.requestedBy}
              </p>
            </button>
            {hasPermission(PERMISSIONS.REFUND_APPROVE) && (
              <>
                <Button size="sm" variant="secondary" loading={busyId === r.id} onClick={() => decide(r.id, false)}>
                  Reject
                </Button>
                <Button size="sm" loading={busyId === r.id} onClick={() => decide(r.id, true)}>
                  Approve
                </Button>
              </>
            )}
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
