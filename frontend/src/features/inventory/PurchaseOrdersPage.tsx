import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatDate } from '@/features/patients/format';
import { purchaseOrdersApi } from './api';
import { PurchaseOrderBuilderModal } from './PurchaseOrderModals';
import { PO_STATUS_TONE, type PurchaseOrderListItem, type PurchaseOrderStatus } from './types';

const PAGE_SIZE = 20;
/** Lives in the URL, so returning from a PO lands on the same search, filter and page. */
const PARAMS = { q: '', status: '', page: 1 };

export function PurchaseOrdersPage() {
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);

  const [open, setOpen] = useState(false);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  const { data, loading, error, refetch } = useQuery(
    () =>
      purchaseOrdersApi.list({
        status: (params.status as PurchaseOrderStatus) || undefined,
        query: params.q || undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.status, params.q, params.page],
    { cacheKey: `purchase-orders:${params.q}:${params.status}:${params.page}` },
  );

  const columns: Column<PurchaseOrderListItem>[] = [
    { key: 'no', header: 'PO', cell: (p) => <span className="font-mono text-xs">{p.poNumber}</span> },
    { key: 'supplier', header: 'Supplier', cell: (p) => p.supplierName },
    { key: 'lines', header: 'Lines', cell: (p) => p.lineCount, hideOnMobile: true },
    { key: 'expected', header: 'Expected', cell: (p) => (p.expectedDate ? formatDate(p.expectedDate) : '—'), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (p) => <Badge tone={PO_STATUS_TONE[p.status]}>{p.status.replace(/_/g, ' ')}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Purchase orders"
        description="Order stock from suppliers and receive it into inventory."
        actions={canWrite ? <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4" aria-hidden /> New PO</Button> : undefined}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search PO no. or supplier" />
          </div>
          <div className="sm:w-52">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'SUBMITTED', label: 'Submitted' },
                { value: 'PARTIALLY_RECEIVED', label: 'Partially received' },
                { value: 'RECEIVED', label: 'Received' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              value={params.status}
              onChange={(e) => set({ status: e.target.value })}
            />
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="No purchase orders" message="Create a PO to order stock." />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(p) => p.id}
                rowHref={(p) => `/app/purchase-orders/${p.id}`}
                onRowClick={(p) => navigate(`/app/purchase-orders/${p.id}`)}
              />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => set({ page: p + 1 })}
              />
            </>
          )
        )}
      </Card>

      <PurchaseOrderBuilderModal open={open} onClose={() => setOpen(false)} po={null} onSaved={(id) => navigate(`/app/purchase-orders/${id}`)} />
    </>
  );
}
