import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
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
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/features/patients/format';
import { branchesApi, type Branch } from '@/features/branches/api';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { exportCsv, exportExcel, exportXml } from '@/lib/exportData';
import { invoicesApi } from './api';
import {
  INVOICE_STATUS_TONE,
  PAYMENT_STATUS_TONE,
  type InvoiceListItem,
  type InvoiceStatus,
} from './types';
import { useT } from '@/i18n';

const EXPORT_COLUMNS: { key: keyof InvoiceListItem; header: string }[] = [
  { key: 'invoiceNumber', header: 'InvoiceNumber' },
  { key: 'orderNumber', header: 'OrderNumber' },
  { key: 'patientName', header: 'PatientName' },
  { key: 'patientMrn', header: 'PatientMrn' },
  { key: 'status', header: 'Status' },
  { key: 'paymentStatus', header: 'PaymentStatus' },
  { key: 'totalAmount', header: 'TotalAmount' },
  { key: 'balance', header: 'Balance' },
  { key: 'createdAt', header: 'CreatedAt' },
];

const PAGE_SIZE = 20;
/** Lives in the URL, so returning from an invoice lands on the same search, filters and page. */
const PARAMS = { q: '', status: '', unpaidOnly: false, branchId: '', page: 1 };

export function InvoicesPage() {
  const t = useT();
  const navigate = useNavigateFrom();
  const toast = useToast();
  const { user } = useAuth();
  const isHq = !user?.homeBranchId;
  const [branches, setBranches] = useState<Branch[]>([]);
  const [exporting, setExporting] = useState(false);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  useEffect(() => {
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  const { data, loading, error, refetch } = useQuery(
    () =>
      invoicesApi.list({
        status: (params.status as InvoiceStatus) || undefined,
        unpaidOnly: params.unpaidOnly || undefined,
        branchId: params.branchId ? Number(params.branchId) : undefined,
        query: params.q || undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.status, params.unpaidOnly, params.branchId, params.q, params.page],
    { cacheKey: `invoices:${params.q}:${params.status}:${params.unpaidOnly}:${params.branchId}:${params.page}` },
  );

  const exportAll = async (format: 'csv' | 'xls' | 'xml') => {
    setExporting(true);
    try {
      const rows = await invoicesApi.exportAll({
        status: (params.status as InvoiceStatus) || undefined,
        unpaidOnly: params.unpaidOnly || undefined,
        branchId: params.branchId ? Number(params.branchId) : undefined,
        query: params.q || undefined,
      });
      if (format === 'csv') {
        exportCsv(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'invoices.csv');
      } else if (format === 'xls') {
        exportExcel(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'Invoices', 'invoices.xls');
      } else {
        exportXml(
          rows as unknown as Record<string, unknown>[],
          EXPORT_COLUMNS as { key: string; header: string }[],
          'Invoices',
          'Invoice',
          'invoices.xml',
        );
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Export failed'));
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<InvoiceListItem>[] = [
    { key: 'no', header: t('Invoice'), cell: (i) => <span className="font-mono text-xs">{i.invoiceNumber ?? t('Draft')}</span> },
    {
      key: 'patient',
      header: t('Patient'),
      cell: (i) => (
        <span>
          <span className="font-medium">{i.patientName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{i.patientMrn}</span>
        </span>
      ),
    },
    { key: 'date', header: t('Date'), cell: (i) => formatDate(i.createdAt), hideOnMobile: true },
    { key: 'total', header: t('Total'), cell: (i) => formatMoney(i.totalAmount), className: 'text-right' },
    { key: 'balance', header: t('Balance'), cell: (i) => formatMoney(i.balance), className: 'text-right' },
    {
      key: 'status',
      header: t('Status'),
      cell: (i) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={INVOICE_STATUS_TONE[i.status]}>{i.status}</Badge>
          {i.status === 'ISSUED' && <Badge tone={PAYMENT_STATUS_TONE[i.paymentStatus]}>{i.paymentStatus}</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('Invoices')}
        description={t('Billing for lab orders — issue, collect payment and track balances.')}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('csv')}>
              <Download className="h-4 w-4" aria-hidden />
              {t('Export CSV')}
            </Button>
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('xls')}>
              <Download className="h-4 w-4" aria-hidden />
              {t('Export Excel')}
            </Button>
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('xml')}>
              <Download className="h-4 w-4" aria-hidden />
              {t('Export XML')}
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search invoice no., patient or MRN')}
            />
          </div>
          <div className="sm:w-44">
            <Select
              options={[
                { value: '', label: t('All statuses') },
                { value: 'DRAFT', label: t('Draft') },
                { value: 'ISSUED', label: t('Issued') },
                { value: 'CANCELLED', label: t('Cancelled') },
              ]}
              value={params.status}
              onChange={(e) => set({ status: e.target.value })}
            />
          </div>
          {isHq && (
            <div className="sm:w-56">
              <Select
                options={[{ value: '', label: t('All branches') }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))]}
                value={params.branchId}
                onChange={(e) => set({ branchId: e.target.value })}
              />
            </div>
          )}
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={params.unpaidOnly}
              onChange={(e) => set({ unpaidOnly: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            {t('Outstanding only')}
          </label>
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title={t('No invoices')} message={t('Raise an invoice from a confirmed lab order.')} />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(i) => i.id}
                rowHref={(i) => `/app/invoices/${i.id}`}
                onRowClick={(i) => navigate(`/app/invoices/${i.id}`)}
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
    </>
  );
}
