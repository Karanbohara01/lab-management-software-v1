import { Info, Printer } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { branchesApi } from '@/features/branches/api';
import { formatMoney } from '@/lib/money';
import { LinkFrom } from '@/lib/navigation';
import { revenueApi } from './api';
import { useRevenueWindow } from './useRevenueWindow';
import { REVENUE_PRESET_LABEL } from './types';
import { RevenueFilters } from './components/RevenueFilters';
import { RevenueKpis } from './components/RevenueKpis';
import { BilledVsCollectedChart } from './components/BilledVsCollectedChart';
import { PaymentMethodPanel } from './components/PaymentMethodPanel';
import { BreakdownPanels } from './components/BreakdownPanels';
import { TransactionRegisters } from './components/TransactionRegisters';
import { formatDateRange } from '@/components/ui/DateRangePicker';
import { useT } from '@/i18n';

/** "4 Nov 2026" or "1 Nov – 30 Nov 2026", from the window the server actually resolved. */
function periodLabel(from: string, to: string): string {
  return formatDateRange({ from, to }) ?? `${from} – ${to}`;
}

/**
 * Revenue management: what the laboratory billed, what it collected, and what it is still owed —
 * for any day or date range, with every figure aggregated on the server from invoices, payments
 * and refunds.
 */
export function RevenueDashboardPage() {
  const t = useT();
  const { hasPermission } = useAuth();
  const canReadPatients = hasPermission(PERMISSIONS.PATIENT_READ);
  const window = useRevenueWindow();
  const key = JSON.stringify(window.query);

  const branches = useQuery(() => branchesApi.list(true), [], { cacheKey: 'revenue:branches' });
  const summary = useQuery(() => revenueApi.summary(window.query), [key], { cacheKey: `revenue-summary:${key}` });
  const trend = useQuery(() => revenueApi.trend(window.query), [key], { cacheKey: `revenue-trend:${key}` });
  const breakdown = useQuery(() => revenueApi.breakdown(window.query), [key], { cacheKey: `revenue-breakdown:${key}` });

  const period = summary.data?.period;
  const label = period ? periodLabel(period.from, period.to) : null;

  return (
    <>
      <PageHeader
        title={t('Revenue')}
        description={t('Billed, collected and outstanding — aggregated from invoices, payments and refunds.')}
        actions={
          <LinkFrom to={`/app/revenue/report${window.search}`} target="_blank" rel="noopener">
            <Button>
              <Printer className="h-4 w-4" aria-hidden />
              {t('Print revenue report')}
            </Button>
          </LinkFrom>
        }
      />

      <Card className="mb-4 min-w-0">
        <RevenueFilters
          window={window}
          branches={branches.data ?? []}
          showBranch={(branches.data?.length ?? 0) > 1}
        />
        {label && (
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 px-4 py-2.5 text-body-sm">
            <span className="text-muted">{t('Showing')}</span>
            <span className="font-semibold text-foreground">{label}</span>
            <span className="text-muted">
              · {t(period!.days === 1 ? '{count} day' : '{count} days', { count: period!.days })}
              {window.preset ? ` · ${t(REVENUE_PRESET_LABEL[window.preset])}` : ''} · {t('days as they fall in')}{' '}
              {period!.zone.replace('_', ' ')}
            </span>
          </div>
        )}
      </Card>

      {summary.loading && !summary.data ? (
        <LoadingState label={t('Totalling the period…')} />
      ) : summary.error ? (
        <ErrorState message={summary.error} onRetry={summary.refetch} />
      ) : summary.data ? (
        <div className="grid min-w-0 gap-4">
          <RevenueKpis summary={summary.data} />

          {summary.data.cancelled.issuedThenCancelledCount > 0 && (
            <Alert tone="info">
              {t(
                summary.data.cancelled.issuedThenCancelledCount === 1
                  ? '{count} invoice issued in this period has since been cancelled, for {amount}. Billed at the time was {billedAmount}; the figures above exclude the cancelled invoice.'
                  : '{count} invoices issued in this period have since been cancelled, for {amount}. Billed at the time was {billedAmount}; the figures above exclude the cancelled invoices.',
                {
                  count: summary.data.cancelled.issuedThenCancelledCount,
                  amount: formatMoney(summary.data.cancelled.issuedThenCancelledAmount),
                  billedAmount: formatMoney(summary.data.cancelled.billedAsIssued),
                },
              )}
            </Alert>
          )}

          <div className="grid min-w-0 gap-4 xl:grid-cols-[2fr_1fr]">
            <Card className="min-w-0">
              <CardHeader
                title={t('Billed against collected')}
                description={t('Bars are what was invoiced; the line is cash received. They are not meant to match.')}
              />
              {trend.loading && !trend.data ? (
                <LoadingState />
              ) : trend.error ? (
                <ErrorState message={trend.error} onRetry={trend.refetch} />
              ) : trend.data ? (
                <BilledVsCollectedChart trend={trend.data} />
              ) : null}
            </Card>

            <Card className="min-w-0">
              <CardHeader title={t('Cash reconciliation')} description={t('What came in, by tender and by who took it.')} />
              <PaymentMethodPanel collections={summary.data.collections} />
            </Card>
          </div>

          <Card className="min-w-0">
            <CardHeader
              title={t('How the period adds up')}
              description={t('Each line is a separate measurement, not a step in one calculation.')}
            />
            <dl className="grid gap-x-8 gap-y-2 px-5 py-4 text-body-sm sm:grid-cols-2">
              {[
                ['Gross test charges', summary.data.billing.grossCharges, 'Every billed line at its full price, before any discount.'],
                ['Less discounts', summary.data.billing.totalDiscounts, 'Per-line plus whole-invoice discounts.'],
                ['Net of discounts (subtotal)', summary.data.billing.subtotal, 'What the invoice lines came to.'],
                ['Taxable amount', summary.data.billing.taxableAmount, 'The VAT-exclusive base the laboratory earns on.'],
                ['VAT', summary.data.billing.taxAmount, 'Collected on the government’s behalf, not laboratory income.'],
                ['Total billed', summary.data.billing.totalBilled, 'Taxable amount plus VAT — the invoice face value.'],
                ['Collected in period', summary.data.collections.grossCollected, 'All payments taken during the period.'],
                ['Less refunds approved', summary.data.refunds.amount, 'Refunds approved during the period.'],
                ['Net collections', summary.data.netCollected, 'What the laboratory actually kept this period.'],
                ['Outstanding on these invoices', summary.data.billing.outstanding, 'Still unpaid, as things stand today.'],
              ].map(([name, value, hint]) => (
                <div key={name as string} className="flex items-baseline justify-between gap-4 border-b border-border/60 pb-1.5">
                  <dt className="min-w-0">
                    <span className="text-foreground">{t(name as string)}</span>
                    <span className="block text-caption text-muted">{t(hint as string)}</span>
                  </dt>
                  <dd className="shrink-0 font-medium tabular-nums text-foreground">{formatMoney(value as number)}</dd>
                </div>
              ))}
            </dl>
            <p className="flex items-start gap-2 border-t border-border bg-surface-muted/50 px-5 py-3 text-caption text-muted">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              <span>
                {t(
                  'Billed figures count invoices by the date they were issued. Collections count payments by the date the money arrived, and refunds by the date they were approved — so an invoice billed in one period can be collected in another.',
                )}{' '}
                {t(
                  summary.data.outstanding.invoiceCount === 1
                    ? 'All-time outstanding across every unpaid invoice is {amount} over {count} invoice.'
                    : 'All-time outstanding across every unpaid invoice is {amount} over {count} invoices.',
                  { amount: formatMoney(summary.data.outstanding.amount), count: summary.data.outstanding.invoiceCount },
                )}
              </span>
            </p>
          </Card>

          {breakdown.loading && !breakdown.data ? (
            <LoadingState />
          ) : breakdown.error ? (
            <ErrorState message={breakdown.error} onRetry={breakdown.refetch} />
          ) : breakdown.data ? (
            <BreakdownPanels breakdown={breakdown.data} canReadPatients={canReadPatients} />
          ) : null}

          <TransactionRegisters
            window={window.query}
            windowLabel={period ? `${period.from}_${period.to}` : 'period'}
          />
        </div>
      ) : null}
    </>
  );
}
