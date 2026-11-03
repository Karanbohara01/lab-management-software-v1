import { useState } from 'react';
import { Download } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { Tabs } from '@/components/ui/Tabs';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatAmount } from '@/lib/money';
import { exportCsv } from '@/lib/exportData';
import type { PaymentMethod } from '@/features/billing/types';
import { revenueApi, type RevenueWindow } from '../api';
import {
  PAYMENT_METHOD_LABEL,
  type OutstandingRow,
  type OutstandingScope,
  type PaymentRow,
  type RefundRow,
} from '../types';

const PAGE_SIZE = 25;
const METHODS: PaymentMethod[] = ['CASH', 'CARD', 'BANK_TRANSFER', 'DIGITAL_WALLET', 'CHEQUE', 'CREDIT'];

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

function d(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

type RegisterTab = 'payments' | 'refunds' | 'outstanding';

/**
 * The transaction-level detail behind the figures: every receipt, every approved refund and every
 * open balance. Paged and sorted on the server, so the figures stay the server's and a large
 * period never ships a whole table to the browser.
 */
export function TransactionRegisters({ window, windowLabel }: { window: RevenueWindow; windowLabel: string }) {
  const [tab, setTab] = useState<RegisterTab>('payments');
  const [page, setPage] = useState(0);
  const [method, setMethod] = useState<PaymentMethod | ''>('');
  const [cashier, setCashier] = useState('');
  const [scope, setScope] = useState<OutstandingScope>('PERIOD');
  const debouncedCashier = useDebouncedValue(cashier, 300);

  const key = JSON.stringify(window);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(0);
  };

  const payments = useQuery(
    () => revenueApi.payments(window, { page, size: PAGE_SIZE, method, receivedBy: debouncedCashier }),
    [key, page, method, debouncedCashier, tab],
    { cacheKey: `revenue-payments:${key}:${page}:${method}:${debouncedCashier}` },
  );
  const refunds = useQuery(
    () => revenueApi.refunds(window, { page, size: PAGE_SIZE }),
    [key, page, tab],
    { cacheKey: `revenue-refunds:${key}:${page}` },
  );
  const outstanding = useQuery(
    () => revenueApi.outstanding(window, { page, size: PAGE_SIZE, scope }),
    [key, page, scope, tab],
    { cacheKey: `revenue-outstanding:${key}:${page}:${scope}` },
  );

  const paymentColumns: Column<PaymentRow>[] = [
    { key: 'receivedAt', header: 'Received', cell: (r) => dt(r.receivedAt) },
    { key: 'receipt', header: 'Receipt', cell: (r) => <span className="font-mono text-xs">#{r.id}</span> },
    { key: 'invoice', header: 'Invoice', cell: (r) => <span className="font-mono text-xs">{r.invoiceNumber}</span> },
    {
      key: 'patient',
      header: 'Patient',
      cell: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{r.patientName}</span>
          <span className="font-mono text-xs text-muted">{r.patientMrn}</span>
        </span>
      ),
    },
    { key: 'method', header: 'Method', cell: (r) => PAYMENT_METHOD_LABEL[r.method] ?? r.method, hideOnMobile: true },
    { key: 'reference', header: 'Reference', cell: (r) => r.reference ?? <span className="text-muted">—</span>, hideOnMobile: true },
    { key: 'receivedBy', header: 'Received by', cell: (r) => r.receivedBy, hideOnMobile: true },
    { key: 'amount', header: 'Amount', cell: (r) => formatAmount(r.amount), className: 'text-right tabular-nums' },
    {
      key: 'status',
      header: 'Status',
      cell: (r) =>
        r.refundedAmount > 0 ? (
          <Badge tone="warning">Refunded {formatAmount(r.refundedAmount)}</Badge>
        ) : (
          <Badge tone="success">Settled</Badge>
        ),
    },
  ];

  const refundColumns: Column<RefundRow>[] = [
    { key: 'decidedAt', header: 'Approved', cell: (r) => dt(r.decidedAt) },
    { key: 'invoice', header: 'Invoice', cell: (r) => <span className="font-mono text-xs">{r.invoiceNumber}</span> },
    { key: 'patient', header: 'Patient', cell: (r) => r.patientName },
    { key: 'reason', header: 'Reason', cell: (r) => r.reason, hideOnMobile: true },
    { key: 'method', header: 'Original method', cell: (r) => (r.paymentMethod ? PAYMENT_METHOD_LABEL[r.paymentMethod] : '—'), hideOnMobile: true },
    { key: 'requestedBy', header: 'Requested by', cell: (r) => r.requestedBy, hideOnMobile: true },
    { key: 'decidedBy', header: 'Approved by', cell: (r) => r.decidedBy ?? '—', hideOnMobile: true },
    { key: 'amount', header: 'Amount', cell: (r) => formatAmount(r.amount), className: 'text-right tabular-nums' },
  ];

  const outstandingColumns: Column<OutstandingRow>[] = [
    { key: 'invoice', header: 'Invoice', cell: (r) => <span className="font-mono text-xs">{r.invoiceNumber}</span> },
    { key: 'issuedAt', header: 'Issued', cell: (r) => d(r.issuedAt) },
    {
      key: 'patient',
      header: 'Patient',
      cell: (r) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate">{r.patientName}</span>
          <span className="font-mono text-xs text-muted">{r.patientMrn}</span>
        </span>
      ),
    },
    { key: 'payer', header: 'Payer', cell: (r) => r.payerName ?? <span className="text-muted">Self</span>, hideOnMobile: true },
    { key: 'total', header: 'Invoice total', cell: (r) => formatAmount(r.totalAmount), className: 'text-right tabular-nums', hideOnMobile: true },
    { key: 'paid', header: 'Paid', cell: (r) => formatAmount(r.netPaid), className: 'text-right tabular-nums', hideOnMobile: true },
    { key: 'balance', header: 'Balance', cell: (r) => formatAmount(r.balance), className: 'text-right tabular-nums' },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span className="flex flex-col gap-0.5">
          <Badge tone={r.paymentStatus === 'PARTIAL' ? 'warning' : 'neutral'}>
            {r.paymentStatus === 'PARTIAL' ? 'Part paid' : 'Unpaid'}
          </Badge>
          <span className="text-xs text-muted">{r.daysOutstanding}d</span>
        </span>
      ),
    },
  ];

  const active =
    tab === 'payments' ? payments : tab === 'refunds' ? refunds : outstanding;

  const exportCurrent = () => {
    if (tab === 'payments' && payments.data) {
      exportCsv(
        payments.data.content as unknown as Record<string, unknown>[],
        [
          { key: 'id', header: 'Receipt' },
          { key: 'receivedAt', header: 'Received at' },
          { key: 'invoiceNumber', header: 'Invoice' },
          { key: 'patientMrn', header: 'Patient ID' },
          { key: 'patientName', header: 'Patient' },
          { key: 'method', header: 'Method' },
          { key: 'reference', header: 'Reference' },
          { key: 'receivedBy', header: 'Received by' },
          { key: 'amount', header: 'Amount' },
          { key: 'refundedAmount', header: 'Refunded' },
        ],
        `revenue-payments-${windowLabel}.csv`,
      );
    } else if (tab === 'refunds' && refunds.data) {
      exportCsv(
        refunds.data.content as unknown as Record<string, unknown>[],
        [
          { key: 'decidedAt', header: 'Approved at' },
          { key: 'invoiceNumber', header: 'Invoice' },
          { key: 'patientName', header: 'Patient' },
          { key: 'amount', header: 'Amount' },
          { key: 'reason', header: 'Reason' },
          { key: 'requestedBy', header: 'Requested by' },
          { key: 'decidedBy', header: 'Approved by' },
        ],
        `revenue-refunds-${windowLabel}.csv`,
      );
    } else if (tab === 'outstanding' && outstanding.data) {
      exportCsv(
        outstanding.data.content as unknown as Record<string, unknown>[],
        [
          { key: 'invoiceNumber', header: 'Invoice' },
          { key: 'issuedAt', header: 'Issued at' },
          { key: 'patientMrn', header: 'Patient ID' },
          { key: 'patientName', header: 'Patient' },
          { key: 'payerName', header: 'Payer' },
          { key: 'totalAmount', header: 'Invoice total' },
          { key: 'netPaid', header: 'Paid' },
          { key: 'balance', header: 'Balance' },
          { key: 'daysOutstanding', header: 'Days outstanding' },
        ],
        `revenue-outstanding-${windowLabel}.csv`,
      );
    }
  };

  return (
    <Card className="min-w-0">
      <div className="flex flex-col gap-3 border-b border-border px-4 pt-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs
          className="border-b-0"
          value={tab}
          onChange={(t) => {
            setTab(t);
            setPage(0);
          }}
          tabs={[
            { id: 'payments', label: `Payments${payments.data ? ` (${payments.data.totalElements})` : ''}` },
            { id: 'refunds', label: `Refunds${refunds.data ? ` (${refunds.data.totalElements})` : ''}` },
            { id: 'outstanding', label: `Outstanding${outstanding.data ? ` (${outstanding.data.totalElements})` : ''}` },
          ]}
        />
        <Button variant="secondary" size="sm" className="mb-3" onClick={exportCurrent} disabled={!active.data || active.data.content.length === 0}>
          <Download className="h-4 w-4" aria-hidden />
          Export page
        </Button>
      </div>

      {tab === 'payments' && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="w-52">
            <Select
              aria-label="Filter by payment method"
              value={method}
              onChange={(e) => reset(setMethod)(e.target.value as PaymentMethod | '')}
              options={[
                { value: '', label: 'All payment methods' },
                ...METHODS.map((m) => ({ value: m, label: PAYMENT_METHOD_LABEL[m] })),
              ]}
            />
          </div>
          <div className="w-56">
            <SearchInput
              value={cashier}
              onChange={(e) => reset(setCashier)(e.target.value)}
              placeholder="Filter by who received it"
            />
          </div>
        </div>
      )}

      {tab === 'outstanding' && (
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4">
          <div className="w-64">
            <Select
              aria-label="Which unpaid invoices to list"
              value={scope}
              onChange={(e) => reset(setScope)(e.target.value as OutstandingScope)}
              options={[
                { value: 'PERIOD', label: 'Issued in this period' },
                { value: 'ALL', label: 'Every unpaid invoice, all time' },
              ]}
            />
          </div>
        </div>
      )}

      {active.loading && !active.data ? (
        <TableSkeleton columns={6} />
      ) : active.error ? (
        <ErrorState message={active.error} onRetry={active.refetch} />
      ) : tab === 'payments' && payments.data ? (
        payments.data.content.length === 0 ? (
          <EmptyState title="No payments" message="No money was received in this period under these filters." />
        ) : (
          <>
            <DataTable columns={paymentColumns} rows={payments.data.content} rowKey={(r) => r.id} rowHref={(r) => `/app/invoices/${r.invoiceId}`} />
            <Pagination page={payments.data.page} totalPages={payments.data.totalPages} totalElements={payments.data.totalElements} onPageChange={setPage} />
          </>
        )
      ) : tab === 'refunds' && refunds.data ? (
        refunds.data.content.length === 0 ? (
          <EmptyState title="No refunds" message="No refunds were approved in this period." />
        ) : (
          <>
            <DataTable columns={refundColumns} rows={refunds.data.content} rowKey={(r) => r.id} rowHref={(r) => `/app/invoices/${r.invoiceId}`} />
            <Pagination page={refunds.data.page} totalPages={refunds.data.totalPages} totalElements={refunds.data.totalElements} onPageChange={setPage} />
          </>
        )
      ) : outstanding.data ? (
        outstanding.data.content.length === 0 ? (
          <EmptyState title="Nothing outstanding" message="Every invoice in this view is settled." />
        ) : (
          <>
            <DataTable columns={outstandingColumns} rows={outstanding.data.content} rowKey={(r) => r.invoiceId} rowHref={(r) => `/app/invoices/${r.invoiceId}`} />
            <Pagination page={outstanding.data.page} totalPages={outstanding.data.totalPages} totalElements={outstanding.data.totalElements} onPageChange={setPage} />
          </>
        )
      ) : null}
    </Card>
  );
}
