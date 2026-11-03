import { ArrowDownRight, ArrowUpRight, Ban, Banknote, FileText, Minus, Percent, Receipt, Undo2, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import type { RevenueSummary } from '../types';

const PERCENT = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 });

/** Change against the previous window of equal length. Null when there is no base to compare to. */
function delta(current: number, previous: number): { pct: number; up: boolean } | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return { pct, up: pct >= 0 };
}

function Trend({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  const d = delta(current, previous);
  if (!d) {
    return (
      <span className="inline-flex items-center gap-1 text-caption text-muted">
        <Minus className="h-3 w-3" aria-hidden />
        no prior figure
      </span>
    );
  }
  // "Good" is usually up, but not for refunds or outstanding balances.
  const good = invert ? !d.up : d.up;
  const Icon = d.up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn('inline-flex items-center gap-1 text-caption font-medium', good ? 'text-success' : 'text-danger')}>
      <Icon className="h-3 w-3" aria-hidden />
      {PERCENT.format(Math.abs(d.pct))}%
      <span className="font-normal text-muted">vs previous</span>
    </span>
  );
}

function Kpi({
  label,
  value,
  icon: Icon,
  hint,
  footer,
  emphasis,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  hint: string;
  footer?: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <Card className={cn('min-w-0 p-4', emphasis && 'border-primary/40 bg-primary/[0.03]')}>
      <div className="flex items-start justify-between gap-2">
        <Tooltip content={hint}>
          <span className="cursor-help text-label text-muted underline decoration-dotted decoration-from-font underline-offset-2">
            {label}
          </span>
        </Tooltip>
        <span
          className={cn(
            'flex h-7 w-7 shrink-0 items-center justify-center rounded-full',
            emphasis ? 'bg-primary/15' : 'bg-surface-muted',
          )}
        >
          <Icon className={cn('h-3.5 w-3.5', emphasis ? 'text-primary' : 'text-muted')} aria-hidden />
        </span>
      </div>
      <p className="mt-1.5 truncate text-price tabular-nums text-foreground" title={value}>
        {value}
      </p>
      {footer && <div className="mt-1">{footer}</div>}
    </Card>
  );
}

/**
 * The eight headline figures. Billed and collected are deliberately separate tiles with their own
 * explanations: this system records a sale when an invoice is issued and cash when a payment is
 * taken, and the two will never be the same number for the same days. Net collections is the one
 * figure that reconciles to the cash drawer.
 */
export function RevenueKpis({ summary }: { summary: RevenueSummary }) {
  const { billing, collections, refunds, previous, cancelled } = summary;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label="Total billed"
        value={formatMoney(billing.totalBilled)}
        icon={Receipt}
        hint="Invoices issued in this period, VAT included. Cancelled invoices are excluded. This is what was sold, not what was received."
        footer={<Trend current={billing.totalBilled} previous={previous.totalBilled} />}
      />
      <Kpi
        label="Total collected"
        value={formatMoney(collections.grossCollected)}
        icon={Banknote}
        hint="Every payment received in this period, by the date it was taken — whatever invoice it settles. Refunds are not deducted here."
        footer={<Trend current={collections.grossCollected} previous={previous.grossCollected} />}
      />
      <Kpi
        label="Net collections"
        value={formatMoney(summary.netCollected)}
        icon={Wallet}
        emphasis
        hint="Collected less refunds approved in this period. This is the figure that should reconcile against the cash actually in hand."
        footer={<Trend current={summary.netCollected} previous={previous.netCollected} />}
      />
      <Kpi
        label="Outstanding"
        value={formatMoney(billing.outstanding)}
        icon={FileText}
        hint="What the invoices issued in this period are still owed, as they stand today. Not a historical balance — it moves as those invoices get paid."
        footer={
          <span className="text-caption text-muted">
            {billing.outstandingInvoiceCount} of {billing.invoiceCount} invoice
            {billing.invoiceCount === 1 ? '' : 's'} unpaid
          </span>
        }
      />
      <Kpi
        label="Total discounts"
        value={formatMoney(billing.totalDiscounts)}
        icon={Percent}
        hint="Per-test discounts plus whole-invoice discounts on the invoices issued in this period."
        footer={
          <span className="text-caption text-muted">
            {formatMoney(billing.lineDiscounts)} on lines · {formatMoney(billing.invoiceDiscounts)} on invoices
          </span>
        }
      />
      <Kpi
        label="Total refunds"
        value={formatMoney(refunds.amount)}
        icon={Undo2}
        hint="Refunds approved in this period, by their approval date. Requested and rejected refunds move no money and are not counted."
        footer={<Trend current={refunds.amount} previous={previous.refunds} invert />}
      />
      <Kpi
        label="Invoices issued"
        value={String(billing.invoiceCount)}
        icon={Receipt}
        hint="Invoices issued in this period, excluding cancelled ones. Drafts are not invoices and are never counted."
        footer={
          <span className="text-caption text-muted">
            {billing.testsOrdered} test{billing.testsOrdered === 1 ? '' : 's'} billed
          </span>
        }
      />
      <Kpi
        label="Payment transactions"
        value={String(collections.paymentCount)}
        icon={Banknote}
        hint="Individual payments received in this period. One invoice can be settled by several, so this is usually higher than the invoice count."
        footer={
          cancelled.count > 0 ? (
            <span className="inline-flex items-center gap-1 text-caption text-warning">
              <Ban className="h-3 w-3" aria-hidden />
              {cancelled.count} invoice{cancelled.count === 1 ? '' : 's'} cancelled ({formatMoney(cancelled.amount)})
            </span>
          ) : (
            <span className="text-caption text-muted">no cancellations in this period</span>
          )
        }
      />
    </div>
  );
}
