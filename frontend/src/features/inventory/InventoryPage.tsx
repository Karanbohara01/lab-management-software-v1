import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { inventoryApi } from './api';
import { ItemFormModal } from './InventoryModals';
import {
  CATEGORY_LABEL,
  STOCK_STATUS_LABEL,
  STOCK_STATUS_TONE,
  type InventoryItemListItem,
  type ItemCategory,
} from './types';

const PAGE_SIZE = 20;

export function InventoryPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const summary = useQuery(() => inventoryApi.summary(), []);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () =>
      inventoryApi.list({
        query: debouncedSearch || undefined,
        category: (category || undefined) as ItemCategory | undefined,
        activeOnly: true,
        page,
        size: PAGE_SIZE,
      }),
    [debouncedSearch, category, page],
  );

  const alertCount = (summary.data?.alerts ?? []).length;

  const columns: Column<InventoryItemListItem>[] = [
    { key: 'code', header: 'Code', cell: (i) => <span className="font-mono text-xs">{i.code}</span> },
    { key: 'name', header: 'Item', cell: (i) => <span className="font-medium">{i.name}</span> },
    { key: 'cat', header: 'Category', cell: (i) => CATEGORY_LABEL[i.category], hideOnMobile: true },
    {
      key: 'stock',
      header: 'On hand',
      cell: (i) => (
        <span>
          {i.quantityOnHand} {i.unit}
          {i.minimumStock > 0 && <span className="ml-1 text-xs text-muted">/ min {i.minimumStock}</span>}
        </span>
      ),
      className: 'text-right',
    },
    {
      key: 'status',
      header: 'Status',
      cell: (i) => <Badge tone={STOCK_STATUS_TONE[i.status]}>{STOCK_STATUS_LABEL[i.status]}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Reagents, kits and consumables — batches, stock levels and expiry."
        actions={
          canWrite ? (
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New item
            </Button>
          ) : undefined
        }
      />

      {alertCount > 0 && (
        <Card className="mb-4 border-warning/40">
          <CardBody>
            <div className="flex items-center gap-2 text-sm">
              <AlertTriangle className="h-4 w-4 text-warning" aria-hidden />
              <span className="font-medium text-foreground">{alertCount} item(s) need attention</span>
            </div>
            <ul className="mt-2 flex flex-wrap gap-2">
              {(summary.data?.alerts ?? []).slice(0, 12).map((a) => (
                <li key={a.id}>
                  <button
                    onClick={() => navigate(`/app/inventory/${a.id}`)}
                    className="rounded-full border border-border px-2 py-0.5 text-xs hover:bg-surface-muted"
                  >
                    {a.code} · {STOCK_STATUS_LABEL[a.status]}
                  </button>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or code"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: '', label: 'All categories' },
                ...Object.entries(CATEGORY_LABEL).map(([value, label]) => ({ value, label })),
              ]}
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
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
          <EmptyState
            title="No items"
            message={debouncedSearch || category ? 'Adjust the filters.' : 'Add your first inventory item.'}
            action={canWrite && !debouncedSearch && !category ? <Button onClick={() => setModalOpen(true)}>New item</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable columns={columns} rows={data.content} rowKey={(i) => i.id} onRowClick={(i) => navigate(`/app/inventory/${i.id}`)} />
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Card>

      <ItemFormModal open={modalOpen} onClose={() => setModalOpen(false)} item={null} onSaved={() => { refetch(); summary.refetch(); }} />
    </>
  );
}
