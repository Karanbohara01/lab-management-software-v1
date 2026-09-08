import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatDate } from '@/features/patients/format';
import { purchaseOrdersApi } from './api';
import { PurchaseOrderBuilderModal } from './PurchaseOrderModals';
import { PO_STATUS_TONE, type PurchaseOrderListItem, type PurchaseOrderStatus } from './types';

const PAGE_SIZE = 20;

export function PurchaseOrdersPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);

  const [status, setStatus] = useState<'' | PurchaseOrderStatus>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () => purchaseOrdersApi.list({ status: status || undefined, query: debouncedSearch || undefined, page, size: PAGE_SIZE }),
    [status, debouncedSearch, page],
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
            <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search PO no. or supplier" />
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
              value={status}
              onChange={(e) => { setStatus(e.target.value as '' | PurchaseOrderStatus); setPage(0); }}
            />
          </div>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="No purchase orders" message="Create a PO to order stock." />
        ) : (
          data && (
            <>
              <DataTable columns={columns} rows={data.content} rowKey={(p) => p.id} onRowClick={(p) => navigate(`/app/purchase-orders/${p.id}`)} />
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Card>

      <PurchaseOrderBuilderModal open={open} onClose={() => setOpen(false)} po={null} onSaved={(id) => navigate(`/app/purchase-orders/${id}`)} />
    </>
  );
}
