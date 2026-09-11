import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/hooks/useQuery';
import { invoicesApi } from '@/features/billing/api';
import { formatMoney } from '@/lib/money';
import { QueueShell } from './QueueShell';

/** Front-desk / accounts worklist: invoices with a balance still owed. */
export function OutstandingInvoices() {
  const navigate = useNavigate();
  const { data, loading, error, refetch } = useQuery(
    () => invoicesApi.list({ unpaidOnly: true, size: 8 }),
    [],
  );

  return (
    <QueueShell
      title="Outstanding invoices"
      description="Issued invoices with a balance still owed."
      count={data?.totalElements}
      viewAllTo="/app/invoices?unpaidOnly=true"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="Every issued invoice has been paid in full."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((inv) => (
          <li key={inv.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/invoices/${inv.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {inv.patientName} <span className="font-mono text-xs text-muted">{inv.invoiceNumber ?? inv.orderNumber}</span>
              </p>
              <p className="truncate text-xs text-muted">
                {formatMoney(inv.balance)} outstanding of {formatMoney(inv.totalAmount)}
              </p>
            </button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/app/invoices/${inv.id}`)}>
              Record payment
            </Button>
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
