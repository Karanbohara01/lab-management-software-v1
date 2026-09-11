import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/hooks/useQuery';
import { ordersApi } from '@/features/orders/api';
import { formatMoney } from '@/lib/money';
import { formatDateTime } from '@/features/patients/format';
import { QueueShell } from './QueueShell';

/** Front-desk worklist: orders started but not yet confirmed (and so not yet sent to the lab). */
export function DraftOrders() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(() => ordersApi.list({ status: 'DRAFT', size: 8 }), []);

  return (
    <QueueShell
      title="Draft orders"
      description="Started but not yet confirmed — nothing happens in the lab until they are."
      count={data?.totalElements}
      viewAllTo="/app/orders?status=DRAFT"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="No draft orders waiting to be confirmed."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((o) => (
          <li key={o.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/orders/${o.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {o.patientName} <span className="font-mono text-xs text-muted">{o.orderNumber}</span>
              </p>
              <p className="truncate text-xs text-muted">
                {o.itemCount} test(s) · {formatMoney(o.totalAmount)} · started {formatDateTime(o.orderedAt)}
              </p>
            </button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/app/orders/${o.id}`)}>
              Open
            </Button>
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
