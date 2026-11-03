import { Info } from 'lucide-react';
import { Tooltip } from '@/components/ui/Tooltip';
import { formatMoney } from '@/lib/money';
import { MoneyTable, type MoneyColumn } from './MoneyTable';
import { PAYMENT_METHOD_LABEL, type CashierTotal, type CollectionSummary, type MethodTotal } from '../types';

/** `system:ESEWA` is the gateway recording its own verified payment, not a person at a till. */
function cashierLabel(receivedBy: string): string {
  if (receivedBy.startsWith('system:')) return `${receivedBy.slice('system:'.length)} (online gateway)`;
  if (receivedBy === 'system') return 'System';
  return receivedBy;
}

const METHOD_COLUMNS: MoneyColumn<MethodTotal>[] = [
  { key: 'method', header: 'Payment method', cell: (r) => PAYMENT_METHOD_LABEL[r.method] ?? r.method, sortValue: (r) => r.method, align: 'left' },
  { key: 'transactions', header: 'Transactions', amount: (r) => r.transactions, total: true, format: 'count' },
  { key: 'amount', header: 'Amount collected', amount: (r) => r.amount, total: true },
];

const CASHIER_COLUMNS: MoneyColumn<CashierTotal>[] = [
  { key: 'receivedBy', header: 'Received by', cell: (r) => cashierLabel(r.receivedBy), sortValue: (r) => r.receivedBy, align: 'left' },
  { key: 'transactions', header: 'Transactions', amount: (r) => r.transactions, total: true, format: 'count' },
  { key: 'amount', header: 'Amount collected', amount: (r) => r.amount, total: true },
];

/**
 * Daily reconciliation: what came in, by tender and by who took it. The totals here are summed
 * from the same payment rows as the "Total collected" tile, so the two always agree.
 */
export function PaymentMethodPanel({ collections }: { collections: CollectionSummary }) {
  return (
    <div className="divide-y divide-border">
      <MoneyTable
        columns={METHOD_COLUMNS}
        rows={collections.byMethod}
        rowKey={(r) => r.method}
        initialSort={{ key: 'amount' }}
        emptyMessage="No payments were received in this period."
        footerLabel="All methods"
      />
      {collections.onAccount > 0 && (
        <div className="flex items-start gap-2 bg-surface-muted/50 px-3 py-2.5 text-caption text-muted">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            {formatMoney(collections.onAccount)} of this was booked on account as a credit settlement, not money
            through the till. Cash, card, bank, wallet and cheque together come to{' '}
            <span className="font-medium text-foreground">{formatMoney(collections.cashAndBank)}</span>.
          </span>
        </div>
      )}
      {collections.byCashier.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 px-3 pb-1 pt-3">
            <h3 className="text-label uppercase tracking-wide text-muted">By who received it</h3>
            <Tooltip content="Grouped by the username recorded on each payment. Gateway payments are attributed to the provider that verified them.">
              <Info className="h-3 w-3 cursor-help text-muted" aria-hidden />
            </Tooltip>
          </div>
          <MoneyTable
            columns={CASHIER_COLUMNS}
            rows={collections.byCashier}
            rowKey={(r) => r.receivedBy}
            initialSort={{ key: 'amount' }}
            footerLabel="Everyone"
          />
        </div>
      )}
    </div>
  );
}
