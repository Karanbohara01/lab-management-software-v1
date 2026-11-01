import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, CheckCircle2, AlertTriangle, Settings2, Download, X } from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { StatTileRow, type StatTileData } from '@/features/dashboard/components/StatTile';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { exportCsv } from '@/lib/exportData';
import { CREDIT_NOTE_STATUS_LABEL, CREDIT_NOTE_STATUS_TONE, IRD_STATUS_LABEL, IRD_STATUS_TONE, type IrdStatus } from '@/features/ird/types';
import { platformBillingApi } from './api';
import { IrdSubmissionModal } from './IrdSubmissionModal';
import { PlatformIrdCredentialsCard } from './PlatformIrdCredentialsCard';
import { SUBSCRIPTION_INVOICE_STATUS_LABEL, SUBSCRIPTION_INVOICE_STATUS_TONE, type PlatformInvoiceListItem } from './types';

const EXPORT_LIMIT = 10_000;

const PAGE_SIZE = 20;
const IRD_STATUSES: IrdStatus[] = ['NOT_SUBMITTED', 'PENDING', 'SUBMITTED', 'ACCEPTED', 'FAILED', 'DUPLICATE', 'CANCELLED'];

function dt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

/**
 * Platform-admin view of subscription invoices — what THIS deployment charges each clinic — and
 * their IRD/CBMS e-billing status. Distinct from each clinic's own "Plan & billing" settings
 * screen, which shows only that clinic's own invoices without any IRD detail.
 */
export function PlatformBillingPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const orgId = searchParams.get('orgId');
  const orgIdNum = orgId ? Number(orgId) : undefined;
  const [irdStatus, setIrdStatus] = useState<IrdStatus | ''>('');
  const [page, setPage] = useState(0);
  const [openInvoiceId, setOpenInvoiceId] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const clearOrgFilter = () => {
    const next = new URLSearchParams(searchParams);
    next.delete('orgId');
    setSearchParams(next);
  };

  const configQ = useQuery(() => platformBillingApi.config(), []);
  const { data, loading, error, refetch } = useQuery(
    () => platformBillingApi.list({ irdStatus: irdStatus || undefined, organizationId: orgIdNum, page, size: PAGE_SIZE }),
    [irdStatus, orgIdNum, page],
  );

  const exportAll = async () => {
    setExporting(true);
    try {
      const all = await platformBillingApi.list({ irdStatus: irdStatus || undefined, organizationId: orgIdNum, page: 0, size: EXPORT_LIMIT });
      exportCsv(
        all.content.map((i) => ({
          invoiceNumber: i.invoiceNumber,
          clinic: i.organizationName ?? '',
          plan: i.planName,
          taxableAmount: i.totalAmount - i.taxAmount,
          vat: i.taxAmount,
          total: i.totalAmount,
          dueAt: i.dueAt,
          paymentStatus: i.status,
          paidAt: i.paidAt ?? '',
          irdStatus: i.irdStatus,
          creditNoteStatus: i.creditNoteStatus,
        })),
        [
          { key: 'invoiceNumber', header: 'Invoice' },
          { key: 'clinic', header: 'Clinic' },
          { key: 'plan', header: 'Plan' },
          { key: 'taxableAmount', header: 'Taxable amount' },
          { key: 'vat', header: 'VAT' },
          { key: 'total', header: 'Total' },
          { key: 'dueAt', header: 'Due' },
          { key: 'paymentStatus', header: 'Payment status' },
          { key: 'paidAt', header: 'Paid at' },
          { key: 'irdStatus', header: 'IRD status' },
          { key: 'creditNoteStatus', header: 'Credit note status' },
        ],
        `subscription-invoices-${new Date().toISOString().slice(0, 10)}.csv`,
      );
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const stats: StatTileData[] = data
    ? [
        { label: 'Subscription invoices', value: data.totalElements, icon: FileText },
        {
          label: 'Needs filing',
          value: data.content.filter((i) => i.irdStatus === 'NOT_SUBMITTED' || i.irdStatus === 'FAILED').length,
          icon: AlertTriangle,
          tone: data.content.some((i) => i.irdStatus === 'FAILED') ? 'warning' : 'neutral',
        },
        {
          label: 'Filed with IRD',
          value: data.content.filter((i) => i.irdStatus === 'ACCEPTED' || i.irdStatus === 'DUPLICATE' || i.irdStatus === 'SUBMITTED').length,
          icon: CheckCircle2,
        },
      ]
    : [];

  const columns: Column<PlatformInvoiceListItem>[] = [
    { key: 'invoiceNumber', header: 'Invoice', cell: (i) => <span className="font-mono text-xs">{i.invoiceNumber}</span> },
    { key: 'org', header: 'Clinic', cell: (i) => <span className="font-medium">{i.organizationName ?? '—'}</span> },
    { key: 'plan', header: 'Plan', cell: (i) => i.planName, hideOnMobile: true },
    { key: 'total', header: 'Total', cell: (i) => formatMoney(i.totalAmount), className: 'text-right' },
    { key: 'due', header: 'Due', cell: (i) => dt(i.dueAt), hideOnMobile: true },
    {
      key: 'status',
      header: 'Payment',
      cell: (i) => <Badge tone={SUBSCRIPTION_INVOICE_STATUS_TONE[i.status]}>{SUBSCRIPTION_INVOICE_STATUS_LABEL[i.status]}</Badge>,
    },
    {
      key: 'ird',
      header: 'IRD e-billing',
      cell: (i) => (
        <div className="flex flex-wrap items-center gap-1.5">
          <Badge tone={IRD_STATUS_TONE[i.irdStatus]}>{IRD_STATUS_LABEL[i.irdStatus]}</Badge>
          {i.creditNoteStatus !== 'NOT_NEEDED' && (
            <Badge tone={CREDIT_NOTE_STATUS_TONE[i.creditNoteStatus]}>CN: {CREDIT_NOTE_STATUS_LABEL[i.creditNoteStatus]}</Badge>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <BackLink to="/app/platform">Back to platform</BackLink>
      <PageHeader
        title="Subscription billing"
        description={
          orgIdNum
            ? `Invoices for ${data?.content[0]?.organizationName ?? 'this clinic'} — its IRD/CBMS e-billing status.`
            : "What this deployment charges each clinic, and its IRD/CBMS e-billing status — distinct from a clinic's own patient billing."
        }
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" loading={exporting} onClick={exportAll}>
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
            <Button variant="secondary" onClick={() => setSettingsOpen((v) => !v)}>
              <Settings2 className="h-4 w-4" aria-hidden />
              IRD settings
            </Button>
          </div>
        }
      />

      {configQ.data && !configQ.data.configured && (
        <div className="mb-4">
          <Alert tone="warning">{configQ.data.message}</Alert>
        </div>
      )}

      {settingsOpen && (
        <div className="mb-5">
          <PlatformIrdCredentialsCard onSaved={() => configQ.refetch()} />
        </div>
      )}

      {data && data.totalElements > 0 && <StatTileRow stats={stats} />}

      <Card>
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="sm:w-56">
            <Select
              options={[{ value: '', label: 'All IRD statuses' }, ...IRD_STATUSES.map((s) => ({ value: s, label: IRD_STATUS_LABEL[s] }))]}
              value={irdStatus}
              onChange={(e) => {
                setIrdStatus(e.target.value as IrdStatus | '');
                setPage(0);
              }}
            />
          </div>
          {orgIdNum && (
            <button
              type="button"
              onClick={clearOrgFilter}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/15"
            >
              Filtered to {data?.content[0]?.organizationName ?? 'this clinic'}
              <X className="h-3 w-3" aria-hidden />
            </button>
          )}
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No subscription invoices"
            message={irdStatus ? 'Adjust the filter.' : 'Invoices are issued automatically each billing period.'}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(i) => i.id}
                onRowClick={(i) => setOpenInvoiceId(i.id)}
              />
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Card>

      <IrdSubmissionModal
        open={openInvoiceId !== null}
        onClose={() => setOpenInvoiceId(null)}
        invoiceId={openInvoiceId}
        onChanged={refetch}
      />
    </>
  );
}
