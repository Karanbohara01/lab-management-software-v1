import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatMoney } from '@/lib/money';
import { ordersApi } from '@/features/orders/api';
import { ORDER_STATUS_TONE, type OrderListItem } from '@/features/orders/types';
import { formatDate } from './format';

export function PatientOrdersTab({ patientId }: { patientId: number }) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canOrder = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);

  const { data, loading, error, refetch } = useQuery(
    () => ordersApi.list({ patientId, size: 50 }),
    [patientId],
  );

  const columns: Column<OrderListItem>[] = [
    { key: 'no', header: 'Order', cell: (o) => <span className="font-mono text-xs">{o.orderNumber}</span> },
    { key: 'date', header: 'Ordered', cell: (o) => formatDate(o.orderedAt) },
    { key: 'items', header: 'Tests', cell: (o) => o.itemCount, hideOnMobile: true },
    { key: 'total', header: 'Total', cell: (o) => formatMoney(o.totalAmount), className: 'text-right' },
    { key: 'status', header: 'Status', cell: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge> },
  ];

  return (
    <Card>
      <div className="flex items-center justify-between border-b border-border p-4">
        <p className="text-sm text-muted">{data ? `${data.totalElements} order(s)` : 'Lab orders'}</p>
        {canOrder && (
          <Button size="sm" onClick={() => navigate(`/app/orders/new?patientId=${patientId}`)}>
            <Plus className="h-4 w-4" aria-hidden />
            New order
          </Button>
        )}
      </div>

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data && data.content.length === 0 ? (
        <EmptyState
          title="No orders yet"
          message="This patient has no lab orders."
          action={canOrder ? <Button onClick={() => navigate(`/app/orders/new?patientId=${patientId}`)}>New order</Button> : undefined}
        />
      ) : (
        data && (
          <DataTable
            columns={columns}
            rows={data.content}
            rowKey={(o) => o.id}
            onRowClick={(o) => navigate(`/app/orders/${o.id}`)}
          />
        )
      )}
    </Card>
  );
}
