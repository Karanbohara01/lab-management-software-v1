import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { formatDate } from './format';
import { invoicesApi } from '@/features/billing/api';
import { INVOICE_STATUS_TONE, PAYMENT_STATUS_TONE, type InvoiceListItem } from '@/features/billing/types';

export function PatientInvoicesTab({ patientId }: { patientId: number }) {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(
    () => invoicesApi.list({ patientId, size: 50 }),
    [patientId],
  );

  const columns: Column<InvoiceListItem>[] = [
    { key: 'no', header: 'Invoice', cell: (i) => <span className="font-mono text-xs">{i.invoiceNumber ?? 'Draft'}</span> },
    { key: 'date', header: 'Date', cell: (i) => formatDate(i.createdAt) },
    { key: 'total', header: 'Total', cell: (i) => formatMoney(i.totalAmount), className: 'text-right' },
    { key: 'balance', header: 'Balance', cell: (i) => formatMoney(i.balance), className: 'text-right' },
    {
      key: 'status',
      header: 'Status',
      cell: (i) => (
        <span className="flex gap-1.5">
          <Badge tone={INVOICE_STATUS_TONE[i.status]}>{i.status}</Badge>
          {i.status === 'ISSUED' && <Badge tone={PAYMENT_STATUS_TONE[i.paymentStatus]}>{i.paymentStatus}</Badge>}
        </span>
      ),
    },
  ];

  return (
    <Card>
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data && data.content.length === 0 ? (
        <EmptyState title="No invoices" message="Invoices raised for this patient will appear here." />
      ) : (
        data && (
          <DataTable
            columns={columns}
            rows={data.content}
            rowKey={(i) => i.id}
            onRowClick={(i) => navigate(`/app/invoices/${i.id}`)}
          />
        )
      )}
    </Card>
  );
}
