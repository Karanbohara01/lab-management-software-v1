import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/features/patients/format';
import { branchesApi, type Branch } from '@/features/branches/api';
import { ordersApi } from './api';
import { ORDER_STATUS_TONE, type OrderListItem, type OrderStatus } from './types';

const PAGE_SIZE = 20;

export function OrdersPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);
  const isHq = !user?.homeBranchId;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | OrderStatus>('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () =>
      ordersApi.list({
        query: debouncedSearch || undefined,
        status: status || undefined,
        branchId: branchId ? Number(branchId) : undefined,
        page,
        size: PAGE_SIZE,
      }),
    [debouncedSearch, status, branchId, page],
  );

  const columns: Column<OrderListItem>[] = [
    { key: 'no', header: 'Order', cell: (o) => <span className="font-mono text-xs">{o.orderNumber}</span> },
    {
      key: 'patient',
      header: 'Patient',
      cell: (o) => (
        <span>
          <span className="font-medium">{o.patientName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{o.patientMrn}</span>
        </span>
      ),
    },
    { key: 'items', header: 'Tests', cell: (o) => o.itemCount, hideOnMobile: true },
    { key: 'date', header: 'Ordered', cell: (o) => formatDate(o.orderedAt), hideOnMobile: true },
    { key: 'total', header: 'Total', cell: (o) => formatMoney(o.totalAmount), className: 'text-right' },
    {
      key: 'status',
      header: 'Status',
      cell: (o) => <Badge tone={ORDER_STATUS_TONE[o.status]}>{o.status}</Badge>,
    },
    ...(isHq
      ? [{ key: 'branch', header: 'Branch', cell: (o: OrderListItem) => o.branchName, hideOnMobile: true } as Column<OrderListItem>]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Lab orders"
        description="Test orders raised for patients. Confirming an order makes it ready for sample collection."
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/app/orders/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              New order
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by order no., patient or MRN"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'CONFIRMED', label: 'Confirmed' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | OrderStatus);
                setPage(0);
              }}
            />
          </div>
          {isHq && (
            <div className="sm:w-48">
              <Select
                options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))]}
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setPage(0);
                }}
              />
            </div>
          )}
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No orders found"
            message={debouncedSearch || status ? 'Adjust the filters.' : 'Create the first lab order.'}
            action={canWrite && !debouncedSearch && !status ? <Button onClick={() => navigate('/app/orders/new')}>New order</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(o) => o.id}
                onRowClick={(o) => navigate(`/app/orders/${o.id}`)}
              />
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
    </>
  );
}
