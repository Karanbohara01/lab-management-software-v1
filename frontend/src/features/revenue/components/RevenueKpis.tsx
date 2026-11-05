import { ArrowDownRight, ArrowUpRight, Ban, Banknote, FileText, Minus, Percent, Receipt, Undo2, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Tooltip } from '@/components/ui/Tooltip';
import { cn } from '@/lib/cn';
import { formatMoney } from '@/lib/money';
import { getLocale, LOCALE_TAG, useT } from '@/i18n';
import type { RevenueSummary } from '../types';

/** Change against the previous window of equal length. Null when there is no base to compare to. */
function delta(current: number, previous: number): { pct: number; up: boolean } | null {
  if (previous === 0) return null;
  const pct = ((current - previous) / Math.abs(previous)) * 100;
  return { pct, up: pct >= 0 };
}

function Trend({ current, previous, invert }: { current: number; previous: number; invert?: boolean }) {
  const t = useT();
  const d = delta(current, previous);
  if (!d) {
    return (
      <span className="inline-flex items-center gap-1 text-caption text-muted">
        <Minus className="h-3 w-3" aria-hidden />
        {t('no prior figure')}
      </span>
    );
  }
  // "Good" is usually up, but not for refunds or outstanding balances.
  const good = invert ? !d.up : d.up;
  const Icon = d.up ? ArrowUpRight : ArrowDownRight;
  const percent = new Intl.NumberFormat(LOCALE_TAG[getLocale()], { maximumFractionDigits: 1 });
  return (
    <span className={cn('inline-flex items-center gap-1 text-caption font-medium', good ? 'text-success' : 'text-danger')}>
      <Icon className="h-3 w-3" aria-hidden />
      {percent.format(Math.abs(d.pct))}%
      <span className="font-normal text-muted">{t('vs previous')}</span>
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
  const t = useT();
  const { billing, collections, refunds, previous, cancelled } = summary;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Kpi
        label={t('Total billed')}
        value={formatMoney(billing.totalBilled)}
        icon={Receipt}
        hint={t('Invoices issued in this period, VAT included. Cancelled invoices are excluded. This is what was sold, not what was received.')}
        footer={<Trend current={billing.totalBilled} previous={previous.totalBilled} />}
      />
      <Kpi
        label={t('Total collected')}
        value={formatMoney(collections.grossCollected)}
        icon={Banknote}
        hint={t('Every payment received in this period, by the date it was taken — whatever invoice it settles. Refunds are not deducted here.')}
        footer={<Trend current={collections.grossCollected} previous={previous.grossCollected} />}
      />
      <Kpi
        label={t('Net collections')}
        value={formatMoney(summary.netCollected)}
        icon={Wallet}
        emphasis
        hint={t('Collected less refunds approved in this period. This is the figure that should reconcile against the cash actually in hand.')}
        footer={<Trend current={summary.netCollected} previous={previous.netCollected} />}
      />
      <Kpi
        label={t('Outstanding')}
        value={formatMoney(billing.outstanding)}
        icon={FileText}
        hint={t('What the invoices issued in this period are still owed, as they stand today. Not a historical balance — it moves as those invoices get paid.')}
        footer={
          <span className="text-caption text-muted">
            {t(billing.invoiceCount === 1 ? '{outstandingCount} of {totalCount} invoice unpaid' : '{outstandingCount} of {totalCount} invoices unpaid', {
              outstandingCount: billing.outstandingInvoiceCount,
              totalCount: billing.invoiceCount,
            })}
          </span>
        }
      />
      <Kpi
        label={t('Total discounts')}
        value={formatMoney(billing.totalDiscounts)}
        icon={Percent}
        hint={t('Per-test discounts plus whole-invoice discounts on the invoices issued in this period.')}
        footer={
          <span className="text-caption text-muted">
            {t('{lineAmount} on lines · {invoiceAmount} on invoices', {
              lineAmount: formatMoney(billing.lineDiscounts),
              invoiceAmount: formatMoney(billing.invoiceDiscounts),
            })}
          </span>
        }
      />
      <Kpi
        label={t('Total refunds')}
        value={formatMoney(refunds.amount)}
        icon={Undo2}
        hint={t('Refunds approved in this period, by their approval date. Requested and rejected refunds move no money and are not counted.')}
        footer={<Trend current={refunds.amount} previous={previous.refunds} invert />}
      />
      <Kpi
        label={t('Invoices issued')}
        value={String(billing.invoiceCount)}
        icon={Receipt}
        hint={t('Invoices issued in this period, excluding cancelled ones. Drafts are not invoices and are never counted.')}
        footer={
          <span className="text-caption text-muted">
            {t(billing.testsOrdered === 1 ? '{count} test billed' : '{count} tests billed', { count: billing.testsOrdered })}
          </span>
        }
      />
      <Kpi
        label={t('Payment transactions')}
        value={String(collections.paymentCount)}
        icon={Banknote}
        hint={t('Individual payments received in this period. One invoice can be settled by several, so this is usually higher than the invoice count.')}
        footer={
          cancelled.count > 0 ? (
            <span className="inline-flex items-center gap-1 text-caption text-warning">
              <Ban className="h-3 w-3" aria-hidden />
              {t(cancelled.count === 1 ? '{count} invoice cancelled ({amount})' : '{count} invoices cancelled ({amount})', {
                count: cancelled.count,
                amount: formatMoney(cancelled.amount),
              })}
            </span>
          ) : (
            <span className="text-caption text-muted">{t('no cancellations in this period')}</span>
          )
        }
      />
    </div>
  );
}
