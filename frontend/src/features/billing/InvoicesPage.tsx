import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download } from 'lucide-react';
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
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/features/patients/format';
import { branchesApi, type Branch } from '@/features/branches/api';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { exportCsv, exportXml } from '@/lib/exportData';
import { invoicesApi } from './api';
import {
  INVOICE_STATUS_TONE,
  PAYMENT_STATUS_TONE,
  type InvoiceListItem,
  type InvoiceStatus,
} from './types';

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

export function InvoicesPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const isHq = !user?.homeBranchId;
  const [status, setStatus] = useState<'' | InvoiceStatus>('');
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () =>
      invoicesApi.list({
        status: status || undefined,
        unpaidOnly: unpaidOnly || undefined,
        branchId: branchId ? Number(branchId) : undefined,
        query: debouncedSearch || undefined,
        page,
        size: PAGE_SIZE,
      }),
    [status, unpaidOnly, branchId, debouncedSearch, page],
  );

  const exportAll = async (format: 'csv' | 'xml') => {
    setExporting(true);
    try {
      const rows = await invoicesApi.exportAll({
        status: status || undefined,
        unpaidOnly: unpaidOnly || undefined,
        branchId: branchId ? Number(branchId) : undefined,
        query: debouncedSearch || undefined,
      });
      if (format === 'csv') {
        exportCsv(rows as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'invoices.csv');
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
      toast.error(err instanceof ApiError ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  const columns: Column<InvoiceListItem>[] = [
    { key: 'no', header: 'Invoice', cell: (i) => <span className="font-mono text-xs">{i.invoiceNumber ?? 'Draft'}</span> },
    {
      key: 'patient',
      header: 'Patient',
      cell: (i) => (
        <span>
          <span className="font-medium">{i.patientName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{i.patientMrn}</span>
        </span>
      ),
    },
    { key: 'date', header: 'Date', cell: (i) => formatDate(i.createdAt), hideOnMobile: true },
    { key: 'total', header: 'Total', cell: (i) => formatMoney(i.totalAmount), className: 'text-right' },
    { key: 'balance', header: 'Balance', cell: (i) => formatMoney(i.balance), className: 'text-right' },
    {
      key: 'status',
      header: 'Status',
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
        title="Invoices"
        description="Billing for lab orders — issue, collect payment and track balances."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('csv')}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
            <Button variant="secondary" loading={exporting} onClick={() => exportAll('xml')}>
              <Download className="h-4 w-4" aria-hidden />
              Export XML
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search invoice no., patient or MRN"
            />
          </div>
          <div className="sm:w-44">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'DRAFT', label: 'Draft' },
                { value: 'ISSUED', label: 'Issued' },
                { value: 'CANCELLED', label: 'Cancelled' },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | InvoiceStatus);
                setPage(0);
              }}
            />
          </div>
          {isHq && (
            <div className="sm:w-56">
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
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={unpaidOnly}
              onChange={(e) => {
                setUnpaidOnly(e.target.checked);
                setPage(0);
              }}
              className="h-4 w-4 rounded border-input"
            />
            Outstanding only
          </label>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="No invoices" message="Raise an invoice from a confirmed lab order." />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(i) => i.id}
                onRowClick={(i) => navigate(`/app/invoices/${i.id}`)}
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
