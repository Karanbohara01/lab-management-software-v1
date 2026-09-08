import { useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { refundsApi } from './api';
import { REFUND_STATUS_TONE, type RefundEntry, type RefundStatus } from './types';

const PAGE_SIZE = 20;

export function RefundsPage() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canDecide = hasPermission(PERMISSIONS.REFUND_APPROVE);

  const [status, setStatus] = useState<'' | RefundStatus>('REQUESTED');
  const [page, setPage] = useState(0);
  const [reject, setReject] = useState<RefundEntry | null>(null);

  const { data, loading, error, refetch } = useQuery(
    () => refundsApi.list({ status: status || undefined, page, size: PAGE_SIZE }),
    [status, page],
  );

  const decide = async (fn: () => Promise<unknown>, msg: string) => {
    try {
      await fn();
      toast.success(msg);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
      throw err;
    }
  };

  return (
    <>
      <PageHeader title="Refunds" description="Review and approve refund requests raised against invoices." />

      <Card>
        <div className="border-b border-border p-4">
          <div className="sm:w-48">
            <Select
              options={[
                { value: '', label: 'All' },
                { value: 'REQUESTED', label: 'Awaiting decision' },
                { value: 'APPROVED', label: 'Approved' },
                { value: 'REJECTED', label: 'Rejected' },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | RefundStatus);
                setPage(0);
              }}
            />
          </div>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="Nothing here" message="No refund requests match this filter." />
        ) : (
          data && (
            <>
              <ul className="divide-y divide-border">
                {data.content.map((r) => (
                  <li key={r.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm">
                        <span className="font-semibold text-foreground">{formatMoney(r.amount)}</span>
                        <span className="mx-2 text-muted">·</span>
                        <Link to={`/app/invoices/${r.invoiceId}`} className="font-mono text-xs text-primary">
                          {r.invoiceNumber ?? 'invoice'}
                        </Link>
                        <span className="mx-2 text-muted">·</span>
                        {r.patientName}
                      </p>
                      <p className="text-sm text-muted">{r.reason}</p>
                      <p className="text-xs text-muted">
                        Requested by {r.requestedBy} · {new Date(r.requestedAt).toLocaleString()}
                        {r.decidedBy ? ` · ${r.status.toLowerCase()} by ${r.decidedBy}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge tone={REFUND_STATUS_TONE[r.status]}>{r.status}</Badge>
                      {canDecide && r.status === 'REQUESTED' && (
                        <>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => setReject(r)}
                          >
                            Reject
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => decide(() => refundsApi.approve(r.id), 'Refund approved')}
                          >
                            Approve
                          </Button>
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={setPage}
              />
            </>
          )
        )}
      </Card>

      <ConfirmDialog
        open={!!reject}
        onClose={() => setReject(null)}
        onConfirm={async (note) => {
          if (reject) await decide(() => refundsApi.reject(reject.id, note || undefined), 'Refund rejected');
        }}
        title="Reject refund request?"
        message="The requester will need to raise a new request if a refund is still required."
        confirmLabel="Reject"
        tone="danger"
        reason="optional"
      />
    </>
  );
}
