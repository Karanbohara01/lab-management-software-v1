import { useEffect, useState } from 'react';
import { Plus, FileText } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/features/patients/format';
import { adToBs } from '@/lib/nepaliDate';
import { branchesApi, type Branch } from '@/features/branches/api';
import { useT } from '@/i18n';
import { ordersApi } from './api';
import { ORDER_STATUS_TONE, type OrderListItem, type OrderStatus } from './types';

const PAGE_SIZE = 20;
/** Lives in the URL, so returning from an order lands on the same search, filters and page. */
const PARAMS = { q: '', status: '', branchId: '', page: 1 };

/** OrderStatus has no shared label map (just a tone map) — the raw value doubles as the label. */
const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

export function OrdersPage() {
  const t = useT();
  const navigate = useNavigateFrom();
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);
  const isHq = !user?.homeBranchId;

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  const { data, loading, error, refetch } = useQuery(
    () =>
      ordersApi.list({
        query: params.q || undefined,
        status: (params.status as OrderStatus) || undefined,
        branchId: params.branchId ? Number(params.branchId) : undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.q, params.status, params.branchId, params.page],
    { cacheKey: `orders:${params.q}:${params.status}:${params.branchId}:${params.page}` },
  );

  const columns: Column<OrderListItem>[] = [
    {
      key: 'no',
      header: t('Order number'),
      cell: (o) => (
        <span className="flex items-center gap-2">
          {o.priority !== 'ROUTINE' && (
            <Badge tone={o.priority === 'STAT' ? 'critical' : 'warning'}>{o.priority}</Badge>
          )}
          <span className="font-mono text-xs">{o.orderNumber}</span>
          {o.hasPrescription && (
            <span title={t('Prescription attached')} className="text-primary inline-flex items-center">
              <FileText className="h-3.5 w-3.5" />
            </span>
          )}
        </span>
      ),
    },
    {
      key: 'patient',
      header: t('Patient'),
      cell: (o) => (
        <span>
          <span className="font-medium">{o.patientName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{o.patientMrn}</span>
        </span>
      ),
    },
    { key: 'items', header: t('Tests'), cell: (o) => o.itemCount, hideOnMobile: true, numeric: true },
    {
      key: 'date',
      header: t('Ordered'),
      cell: (o) => (
        <span className="flex flex-col">
          <span>{formatDate(o.orderedAt)}</span>
          {adToBs(o.orderedAt) && (
            <span className="font-mono text-xs text-muted">
              {adToBs(o.orderedAt)!.formatted} BS
            </span>
          )}
        </span>
      ),
      hideOnMobile: true,
    },
    { key: 'total', header: t('Total'), cell: (o) => formatMoney(o.totalAmount), numeric: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (o) => (
        <Badge
          tone={ORDER_STATUS_TONE[o.status]}
          variant="subtle"
          dot={o.status === 'CONFIRMED'}
        >
          {t(ORDER_STATUS_LABEL[o.status])}
        </Badge>
      ),
    },
    ...(isHq
      ? [{ key: 'branch', header: t('Branch'), cell: (o: OrderListItem) => o.branchName, hideOnMobile: true } as Column<OrderListItem>]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={t('Lab orders')}
        description={t('Test orders raised for patients. Confirming an order makes it ready for sample collection.')}
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/app/orders/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('New order')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search by order no., patient or MRN')}
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: '', label: t('All statuses') },
                { value: 'DRAFT', label: t('Draft') },
                { value: 'CONFIRMED', label: t('Confirmed') },
                { value: 'CANCELLED', label: t('Cancelled') },
              ]}
              value={params.status}
              onChange={(e) => set({ status: e.target.value })}
            />
          </div>
          {isHq && (
            <div className="sm:w-48">
              <Select
                options={[{ value: '', label: t('All branches') }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))]}
                value={params.branchId}
                onChange={(e) => set({ branchId: e.target.value })}
              />
            </div>
          )}
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.content ?? []}
              rowKey={(o) => o.id}
              loading={loading && !data}
              emptyState={
                <EmptyState
                  title={t('No orders found')}
                  message={params.q || params.status ? t('Adjust the filters.') : t('Create the first lab order.')}
                  action={canWrite && !params.q && !params.status ? <Button onClick={() => navigate('/app/orders/new')}>{t('New order')}</Button> : undefined}
                />
              }
              rowHref={(o) => `/app/orders/${o.id}`}
              onRowClick={(o) => navigate(`/app/orders/${o.id}`)}
            />
            {data && data.totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => set({ page: p + 1 })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
