import { formatAmount } from '@/lib/money';
import { PAYER_TYPE_LABEL, PATIENT_CATEGORY_LABEL, PAYMENT_METHOD_LABEL, type RevenueReport } from './types';
import { getLocale, LOCALE_TAG, translate, useT } from '@/i18n';

/* ------------------------------------------------------------------------------------------------
 * A4 revenue report.
 *
 * Hard-coded black/white/grey rather than the app's theme tokens: a printed financial document has
 * to look the same whatever mode the viewer's screen is in, and has to stay legible on a
 * monochrome laser printer. Same decision, and the same reasoning, as the existing printed
 * laboratory report and invoice.
 *
 * Every table repeats its header on each page (`<thead>` plus the print rule in index.css) and no
 * row is allowed to split across a page break. The figures come from one `/revenue/report` call,
 * which is assembled by the same service methods the dashboard reads — so the paper and the screen
 * cannot drift apart.
 * ---------------------------------------------------------------------------------------------- */

const DATE = { dateStyle: 'medium' } as const;
const DATETIME = { dateStyle: 'medium', timeStyle: 'short' } as const;

function d(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(LOCALE_TAG[getLocale()], DATE) : '—';
}

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(LOCALE_TAG[getLocale()], DATETIME) : '—';
}

function periodText(from: string, to: string): string {
  return from === to ? d(from) : translate(getLocale(), '{from} to {to}', { from: d(from), to: d(to) });
}

/** A page-break boundary: each major section starts a new sheet after the first. */
function Section({
  title,
  subtitle,
  children,
  breakBefore,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  breakBefore?: boolean;
}) {
  return (
    <section className={breakBefore ? 'break-before-page pt-4' : 'mt-5'}>
      <h2 className="mb-0.5 border-b border-gray-400 pb-1 text-[12px] font-bold uppercase tracking-wide text-gray-900">
        {title}
      </h2>
      {subtitle && <p className="mb-1.5 text-[8.5px] leading-snug text-gray-600">{subtitle}</p>}
      {children}
    </section>
  );
}

const TH = 'border border-gray-400 bg-gray-100 px-1.5 py-1 text-left font-semibold';
const THR = `${TH} text-right`;
const TD = 'border border-gray-300 px-1.5 py-[3px] align-top';
const TDR = `${TD} text-right tabular-nums`;

function Table({ children }: { children: React.ReactNode }) {
  return (
    <table className="w-full border-collapse text-[8.5px] leading-tight">{children}</table>
  );
}

/** A labelled figure in the financial summary grid. */
function Line({ label, value, note, strong, rule }: { label: string; value: string; note?: string; strong?: boolean; rule?: boolean }) {
  return (
    <div
      className={`flex items-baseline justify-between gap-3 py-[3px] ${rule ? 'border-t border-gray-400 pt-1' : 'border-b border-dotted border-gray-300'}`}
      style={{ breakInside: 'avoid' }}
    >
      <span className={strong ? 'font-bold text-black' : 'text-gray-800'}>
        {label}
        {note && <span className="block text-[7.5px] font-normal leading-tight text-gray-500">{note}</span>}
      </span>
      <span className={`shrink-0 tabular-nums ${strong ? 'text-[11px] font-bold text-black' : ''}`}>{value}</span>
    </div>
  );
}

export function RevenueReportDocument({ report, branchName }: { report: RevenueReport; branchName?: string | null }) {
  const t = useT();
  const { summary, breakdown, payments, refunds, outstanding } = report;
  const { lab, period, billing, collections } = summary;
  const title = t(period.from === period.to ? 'Daily Revenue Report' : 'Revenue Report');

  return (
    <>
      {/* Route-scoped: A4 with running page numbers in the bottom margin box, the same mechanism
          the laboratory report uses. This page is only ever opened on its own tab, so no other
          @page rule competes with it. */}
      <style>
        {'@media print { @page { size: A4; margin: 14mm 12mm 16mm; ' +
          '@bottom-right { content: "Page " counter(page) " of " counter(pages); font-size: 8px; color: #666; } ' +
          '@bottom-left { content: "' +
          title.replace(/"/g, '') +
          ' · ' +
          periodText(period.from, period.to).replace(/"/g, '') +
          '"; font-size: 8px; color: #666; } } }'}
      </style>

      <div id="report-print" className="mx-auto max-w-[800px] bg-white p-6 text-[9px] text-black">
        {/* ---------- A. Laboratory information ---------- */}
        <header className={`flex items-start gap-4 border-b-2 border-gray-800 pb-2 ${lab.printLetterhead ? 'justify-between' : 'justify-end'}`}>
          {lab.printLetterhead && (
            <div className="flex items-start gap-3">
              {lab.logoDataUri && <img src={lab.logoDataUri} alt="" className="h-12 w-12 object-contain" />}
              <div>
                <h1 className="text-[15px] font-bold uppercase leading-tight tracking-wide text-black">{lab.name}</h1>
                <p className="text-[8.5px] leading-snug text-gray-700">
                  {[lab.addressLine, lab.city].filter(Boolean).join(', ')}
                </p>
                <p className="text-[8.5px] leading-snug text-gray-700">
                  {[
                    lab.phone && t('Tel: {phone}', { phone: lab.phone }),
                    lab.email,
                    lab.panNumber && t('PAN: {pan}', { pan: lab.panNumber }),
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </p>
              </div>
            </div>
          )}
          <div className="text-right">
            <p className="inline-block border border-gray-800 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-black">
              {title}
            </p>
            <p className="mt-1 text-[8.5px] font-semibold text-black">{periodText(period.from, period.to)}</p>
            <p className="text-[7.5px] leading-snug text-gray-600">
              {t(period.days === 1 ? '{count} day' : '{count} days', { count: period.days })} ·{' '}
              {t('days as they fall in')} {period.zone.replace('_', ' ')}
            </p>
            <p className="text-[7.5px] leading-snug text-gray-600">
              {branchName ? t('Branch: {branch}', { branch: branchName }) : t('All branches')}
            </p>
            <p className="text-[7.5px] leading-snug text-gray-600">
              {t('Generated {time} by {user}', { time: dt(summary.generatedAt), user: summary.generatedBy })}
            </p>
          </div>
        </header>

        {/* ---------- B. Financial summary ---------- */}
        <Section title={t('A. Financial summary')}>
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">
                {t('Billed — invoices issued in this period')}
              </p>
              <Line label={t('Gross test charges')} value={formatAmount(billing.grossCharges)} note={t('Before any discount')} />
              <Line label={t('Less line discounts')} value={formatAmount(billing.lineDiscounts)} />
              <Line label={t('Less invoice discounts')} value={formatAmount(billing.invoiceDiscounts)} />
              <Line label={t('Total discounts')} value={formatAmount(billing.totalDiscounts)} />
              <Line label={t('Subtotal')} value={formatAmount(billing.subtotal)} note={t('Net of discounts')} />
              <Line label={t('Taxable amount')} value={formatAmount(billing.taxableAmount)} />
              <Line label={t('VAT')} value={formatAmount(billing.taxAmount)} note={t("Collected on the government's behalf")} />
              <Line label={t('Total billed')} value={formatAmount(billing.totalBilled)} strong rule />
              <Line label={t('Invoices issued')} value={String(billing.invoiceCount)} />
              <Line label={t('Tests and packages billed')} value={String(billing.testsOrdered)} />
              {summary.cancelled.issuedThenCancelledCount > 0 && (
                <Line
                  label={t('Of these, since cancelled')}
                  value={formatAmount(summary.cancelled.issuedThenCancelledAmount)}
                  note={t('{count} invoice(s). Billed as issued was {amount}.', {
                    count: summary.cancelled.issuedThenCancelledCount,
                    amount: formatAmount(summary.cancelled.billedAsIssued),
                  })}
                />
              )}
            </div>
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">
                {t('Collected — money received in this period')}
              </p>
              <Line label={t('Total collected')} value={formatAmount(collections.grossCollected)} note={t('By the date each payment was taken')} />
              {collections.onAccount > 0 && (
                <>
                  <Line label={t('Cash, card, bank, wallet, cheque')} value={formatAmount(collections.cashAndBank)} />
                  <Line label={t('Booked on account (credit)')} value={formatAmount(collections.onAccount)} note={t('A settlement on account, not money through the till')} />
                </>
              )}
              <Line label={t('Less refunds approved')} value={formatAmount(summary.refunds.amount)} note={t('{count} refund(s), by approval date', { count: summary.refunds.count })} />
              <Line label={t('Net collections')} value={formatAmount(summary.netCollected)} strong rule />
              <Line label={t('Payment transactions')} value={String(collections.paymentCount)} />
              <div className="mt-2.5">
                <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">{t('Outstanding')}</p>
                <Line
                  label={t('On invoices issued in this period')}
                  value={formatAmount(billing.outstanding)}
                  note={t('{outstandingCount} of {totalCount} invoice(s) unpaid, as at generation', {
                    outstandingCount: billing.outstandingInvoiceCount,
                    totalCount: billing.invoiceCount,
                  })}
                />
                <Line
                  label={t('All unpaid invoices, all time')}
                  value={formatAmount(summary.outstanding.amount)}
                  note={t('{count} invoice(s)', { count: summary.outstanding.invoiceCount })}
                />
                <Line
                  label={t('Invoices cancelled in this period')}
                  value={formatAmount(summary.cancelled.amount)}
                  note={t('{count} invoice(s)', { count: summary.cancelled.count })}
                />
              </div>
            </div>
          </div>
          <p className="mt-2 border border-gray-300 bg-gray-50 px-2 py-1 text-[7.5px] leading-snug text-gray-700">
            {t(
              'Billed counts invoices by the date they were issued; cancelled invoices are excluded. Collected counts payments by the date the money arrived, and refunds by the date they were approved. An invoice billed in one period may therefore be collected in another, and the two columns are not expected to agree. Net collections is the figure that reconciles against cash in hand.',
            )}
          </p>
        </Section>

        {/* ---------- D. Payment method breakdown ---------- */}
        <Section title={t('B. Collections by payment method')} subtitle={t('Reconcile these against the till, the bank and the gateway statements.')}>
          <Table>
            <thead>
              <tr>
                <th className={TH}>{t('Payment method')}</th>
                <th className={THR}>{t('Transactions')}</th>
                <th className={THR}>{t('Amount collected')}</th>
              </tr>
            </thead>
            <tbody>
              {collections.byMethod.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={3}>{t('No payments were received in this period.')}</td>
                </tr>
              ) : (
                collections.byMethod.map((m) => (
                  <tr key={m.method} style={{ breakInside: 'avoid' }}>
                    <td className={TD}>{t(PAYMENT_METHOD_LABEL[m.method] ?? m.method)}</td>
                    <td className={TDR}>{m.transactions}</td>
                    <td className={TDR}>{formatAmount(m.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD}>{t('Total collected')}</td>
                <td className={TDR}>{collections.paymentCount}</td>
                <td className={TDR}>{formatAmount(collections.grossCollected)}</td>
              </tr>
            </tfoot>
          </Table>

          {collections.byCashier.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-[8px] font-bold uppercase tracking-wide text-gray-600">{t('By who received it')}</p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>{t('Received by')}</th>
                    <th className={THR}>{t('Transactions')}</th>
                    <th className={THR}>{t('Amount collected')}</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.byCashier.map((c) => (
                    <tr key={c.receivedBy} style={{ breakInside: 'avoid' }}>
                      <td className={TD}>
                        {c.receivedBy.startsWith('system:')
                          ? t('{provider} (online gateway)', { provider: c.receivedBy.slice(7) })
                          : c.receivedBy}
                      </td>
                      <td className={TDR}>{c.transactions}</td>
                      <td className={TDR}>{formatAmount(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className={TD}>{t('Total')}</td>
                    <td className={TDR}>{collections.paymentCount}</td>
                    <td className={TDR}>{formatAmount(collections.grossCollected)}</td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Section>

        {/* ---------- C. Test, category and package breakdown ---------- */}
        <Section
          title={t('C. Revenue by test')}
          subtitle={t(
            "Over the invoices issued in this period. Billed is exact; collected and outstanding are each line's pro-rata share of its invoice.",
          )}
          breakBefore
        >
          <Table>
            <thead>
              <tr>
                <th className={TH}>{t('Code')}</th>
                <th className={TH}>{t('Test / package')}</th>
                <th className={TH}>{t('Department')}</th>
                <th className={THR}>{t('Times')}</th>
                <th className={THR}>{t('Gross')}</th>
                <th className={THR}>{t('Discount')}</th>
                <th className={THR}>{t('Billed')}</th>
                <th className={THR}>{t('Collected')}</th>
                <th className={THR}>{t('Outstanding')}</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.byTest.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={9}>{t('No tests were billed in this period.')}</td>
                </tr>
              ) : (
                breakdown.byTest.map((row) => (
                  <tr key={row.code} style={{ breakInside: 'avoid' }}>
                    <td className={`${TD} font-mono`}>{row.code}</td>
                    <td className={TD}>
                      {row.name}
                      {row.type === 'PROFILE' && <span className="ml-1 text-gray-500">{t('(package)')}</span>}
                    </td>
                    <td className={TD}>{row.department ?? '—'}</td>
                    <td className={TDR}>{row.timesOrdered}</td>
                    <td className={TDR}>{formatAmount(row.gross)}</td>
                    <td className={TDR}>{formatAmount(row.discount)}</td>
                    <td className={TDR}>{formatAmount(row.netBilled)}</td>
                    <td className={TDR}>{formatAmount(row.collected)}</td>
                    <td className={TDR}>{formatAmount(row.outstanding)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD} colSpan={3}>
                  {t(breakdown.byTest.length === 1 ? 'Total ({count} test)' : 'Total ({count} tests)', { count: breakdown.byTest.length })}
                </td>
                <td className={TDR}>{breakdown.byTest.reduce((s, row) => s + row.timesOrdered, 0)}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, row) => s + row.gross, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, row) => s + row.discount, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, row) => s + row.netBilled, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, row) => s + row.collected, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, row) => s + row.outstanding, 0))}</td>
              </tr>
            </tfoot>
          </Table>
          <p className="mt-1 text-[7.5px] leading-snug text-gray-600">
            {t(
              'A package is billed once at its own price. The tests inside it are performed but never billed separately, so no revenue here is counted twice. These lines sum to the subtotal, not to total billed — whole-invoice discounts and VAT are not distributed across lines.',
            )}
          </p>
        </Section>

        <Section title={t('D. Revenue by category and department')}>
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['Category', breakdown.byCategory],
              ['Department', breakdown.byDepartment],
            ] as const).map(([heading, rows]) => (
              <div key={heading}>
                <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">
                  {t(heading === 'Category' ? 'By category' : 'By department')}
                </p>
                <Table>
                  <thead>
                    <tr>
                      <th className={TH}>{t(heading)}</th>
                      <th className={THR}>{t('Times')}</th>
                      <th className={THR}>{t('Billed')}</th>
                      <th className={THR}>{t('Collected')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td className={TD} colSpan={4}>{t('No revenue in this period.')}</td>
                      </tr>
                    ) : (
                      rows.map((g) => (
                        <tr key={g.label} style={{ breakInside: 'avoid' }}>
                          <td className={TD}>{g.label}</td>
                          <td className={TDR}>{g.timesOrdered}</td>
                          <td className={TDR}>{formatAmount(g.netBilled)}</td>
                          <td className={TDR}>{formatAmount(g.collected)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="font-bold">
                      <td className={TD}>{t('Total')}</td>
                      <td className={TDR}>{rows.reduce((s, g) => s + g.timesOrdered, 0)}</td>
                      <td className={TDR}>{formatAmount(rows.reduce((s, g) => s + g.netBilled, 0))}</td>
                      <td className={TDR}>{formatAmount(rows.reduce((s, g) => s + g.collected, 0))}</td>
                    </tr>
                  </tfoot>
                </Table>
              </div>
            ))}
          </div>

          {breakdown.byPackage.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-[8px] font-bold uppercase tracking-wide text-gray-600">
                {t('Packages and health-checkup panels sold')}
              </p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>{t('Package')}</th>
                    <th className={THR}>{t('Sold')}</th>
                    <th className={THR}>{t('Billed')}</th>
                    <th className={THR}>{t('Collected')}</th>
                    <th className={THR}>{t('Outstanding')}</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.byPackage.map((g) => (
                    <tr key={g.label} style={{ breakInside: 'avoid' }}>
                      <td className={TD}>{g.label}</td>
                      <td className={TDR}>{g.timesOrdered}</td>
                      <td className={TDR}>{formatAmount(g.netBilled)}</td>
                      <td className={TDR}>{formatAmount(g.collected)}</td>
                      <td className={TDR}>{formatAmount(g.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className={TD}>{t('Total')}</td>
                    <td className={TDR}>{breakdown.byPackage.reduce((s, g) => s + g.timesOrdered, 0)}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPackage.reduce((s, g) => s + g.netBilled, 0))}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPackage.reduce((s, g) => s + g.collected, 0))}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPackage.reduce((s, g) => s + g.outstanding, 0))}</td>
                  </tr>
                </tfoot>
              </Table>
            </>
          )}
        </Section>

        {/* ---------- Patient and payer ---------- */}
        <Section title={t('E. Revenue by patient type and payer')} breakBefore>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">{t('By patient type')}</p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>{t('Patient type')}</th>
                    <th className={THR}>{t('Invoices')}</th>
                    <th className={THR}>{t('Billed')}</th>
                    <th className={THR}>{t('Collected')}</th>
                    <th className={THR}>{t('Outstanding')}</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.byPatientCategory.map((r) => (
                    <tr key={r.category} style={{ breakInside: 'avoid' }}>
                      <td className={TD}>{t(PATIENT_CATEGORY_LABEL[r.category] ?? r.category)}</td>
                      <td className={TDR}>{r.invoices}</td>
                      <td className={TDR}>{formatAmount(r.billed)}</td>
                      <td className={TDR}>{formatAmount(r.collected)}</td>
                      <td className={TDR}>{formatAmount(r.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className={TD}>{t('Total')}</td>
                    <td className={TDR}>{breakdown.byPatientCategory.reduce((s, r) => s + r.invoices, 0)}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPatientCategory.reduce((s, r) => s + r.billed, 0))}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPatientCategory.reduce((s, r) => s + r.collected, 0))}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPatientCategory.reduce((s, r) => s + r.outstanding, 0))}</td>
                  </tr>
                </tfoot>
              </Table>
            </div>
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">
                {t('By payer (corporate, insurance and schemes)')}
              </p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>{t('Payer')}</th>
                    <th className={THR}>{t('Invoices')}</th>
                    <th className={THR}>{t('Billed')}</th>
                    <th className={THR}>{t('Collected')}</th>
                    <th className={THR}>{t('Outstanding')}</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.byPayer.map((r) => (
                    <tr key={`${r.payerType}:${r.payerName ?? ''}`} style={{ breakInside: 'avoid' }}>
                      <td className={TD}>
                        {r.payerName || t(PAYER_TYPE_LABEL[r.payerType] ?? r.payerType)}
                        {r.payerName && (
                          <span className="block text-[7.5px] text-gray-500">
                            {t(PAYER_TYPE_LABEL[r.payerType] ?? r.payerType)}
                          </span>
                        )}
                      </td>
                      <td className={TDR}>{r.invoices}</td>
                      <td className={TDR}>{formatAmount(r.billed)}</td>
                      <td className={TDR}>{formatAmount(r.collected)}</td>
                      <td className={TDR}>{formatAmount(r.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className={TD}>{t('Total')}</td>
                    <td className={TDR}>{breakdown.byPayer.reduce((s, r) => s + r.invoices, 0)}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPayer.reduce((s, r) => s + r.billed, 0))}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPayer.reduce((s, r) => s + r.collected, 0))}</td>
                    <td className={TDR}>{formatAmount(breakdown.byPayer.reduce((s, r) => s + r.outstanding, 0))}</td>
                  </tr>
                </tfoot>
              </Table>
            </div>
          </div>
        </Section>

        {/* ---------- E. Payment transaction register ---------- */}
        <Section
          title={t('F. Payment transaction register')}
          subtitle={
            payments.truncated
              ? t('Every payment received in this period. Showing the first {shown} of {total} — narrow the period for the complete register.', {
                  shown: payments.rows.length,
                  total: payments.total,
                })
              : t('Every payment received in this period, {total} in total, oldest first.', { total: payments.total })
          }
          breakBefore
        >
          <Table>
            <thead>
              <tr>
                <th className={TH}>{t('Receipt')}</th>
                <th className={TH}>{t('Date & time')}</th>
                <th className={TH}>{t('Invoice')}</th>
                <th className={TH}>{t('Patient ID')}</th>
                <th className={TH}>{t('Patient')}</th>
                <th className={TH}>{t('Method')}</th>
                <th className={TH}>{t('Reference')}</th>
                <th className={TH}>{t('Received by')}</th>
                <th className={THR}>{t('Amount')}</th>
                <th className={THR}>{t('Refunded')}</th>
                <th className={TH}>{t('Status')}</th>
              </tr>
            </thead>
            <tbody>
              {payments.rows.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={11}>{t('No payments were received in this period.')}</td>
                </tr>
              ) : (
                payments.rows.map((p) => (
                  <tr key={p.id} style={{ breakInside: 'avoid' }}>
                    <td className={`${TD} font-mono`}>#{p.id}</td>
                    <td className={TD}>{dt(p.receivedAt)}</td>
                    <td className={`${TD} font-mono`}>{p.invoiceNumber}</td>
                    <td className={`${TD} font-mono`}>{p.patientMrn}</td>
                    <td className={TD}>{p.patientName}</td>
                    <td className={TD}>{t(PAYMENT_METHOD_LABEL[p.method] ?? p.method)}</td>
                    <td className={TD}>{p.reference ?? '—'}</td>
                    <td className={TD}>{p.receivedBy}</td>
                    <td className={TDR}>{formatAmount(p.amount)}</td>
                    <td className={TDR}>{p.refundedAmount > 0 ? formatAmount(p.refundedAmount) : '—'}</td>
                    <td className={TD}>
                      {t(p.invoiceStatus === 'CANCELLED' ? 'Invoice cancelled' : p.refundedAmount > 0 ? 'Refunded' : 'Settled')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD} colSpan={8}>
                  {t(payments.rows.length === 1 ? 'Total ({count} transaction listed)' : 'Total ({count} transactions listed)', {
                    count: payments.rows.length,
                  })}
                </td>
                <td className={TDR}>{formatAmount(payments.rows.reduce((s, p) => s + p.amount, 0))}</td>
                <td className={TDR}>{formatAmount(payments.rows.reduce((s, p) => s + p.refundedAmount, 0))}</td>
                <td className={TD} />
              </tr>
            </tfoot>
          </Table>
          <p className="mt-1 text-[7.5px] leading-snug text-gray-600">
            {t(
              'The Refunded column shows refunds raised against that specific receipt, whenever they were approved — which may be outside this period. The refunds deducted from net collections above are those approved within it, listed next.',
            )}
          </p>
        </Section>

        {refunds.rows.length > 0 && (
          <Section title={t('G. Refunds approved in this period')}>
            <Table>
              <thead>
                <tr>
                  <th className={TH}>{t('Date & time')}</th>
                  <th className={TH}>{t('Invoice')}</th>
                  <th className={TH}>{t('Patient')}</th>
                  <th className={TH}>{t('Reason')}</th>
                  <th className={TH}>{t('Requested by')}</th>
                  <th className={TH}>{t('Approved by')}</th>
                  <th className={THR}>{t('Amount')}</th>
                </tr>
              </thead>
              <tbody>
                {refunds.rows.map((r) => (
                  <tr key={r.id} style={{ breakInside: 'avoid' }}>
                    <td className={TD}>{dt(r.decidedAt)}</td>
                    <td className={`${TD} font-mono`}>{r.invoiceNumber}</td>
                    <td className={TD}>{r.patientName}</td>
                    <td className={TD}>{r.reason}</td>
                    <td className={TD}>{r.requestedBy}</td>
                    <td className={TD}>{r.decidedBy ?? '—'}</td>
                    <td className={TDR}>{formatAmount(r.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-bold">
                  <td className={TD} colSpan={6}>{t('Total refunds ({count})', { count: refunds.total })}</td>
                  <td className={TDR}>{formatAmount(summary.refunds.amount)}</td>
                </tr>
              </tfoot>
            </Table>
          </Section>
        )}

        {/* ---------- F. Outstanding payment summary ---------- */}
        <Section
          title={t('H. Outstanding payment summary')}
          subtitle={
            outstanding.truncated
              ? t('Unpaid invoices issued in this period. Showing the first {shown} of {total}.', {
                  shown: outstanding.rows.length,
                  total: outstanding.total,
                })
              : t('Unpaid invoices issued in this period, as at the time of generation.')
          }
          breakBefore
        >
          <Table>
            <thead>
              <tr>
                <th className={TH}>{t('Invoice')}</th>
                <th className={TH}>{t('Issued')}</th>
                <th className={TH}>{t('Patient ID')}</th>
                <th className={TH}>{t('Patient')}</th>
                <th className={TH}>{t('Payer')}</th>
                <th className={THR}>{t('Invoice total')}</th>
                <th className={THR}>{t('Paid')}</th>
                <th className={THR}>{t('Balance')}</th>
                <th className={TH}>{t('Status')}</th>
                <th className={THR}>{t('Days')}</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.rows.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={10}>{t('Every invoice issued in this period is settled.')}</td>
                </tr>
              ) : (
                outstanding.rows.map((o) => {
                  const payerTypeLabel = PAYER_TYPE_LABEL[o.payerType];
                  return (
                  <tr key={o.invoiceId} style={{ breakInside: 'avoid' }}>
                    <td className={`${TD} font-mono`}>{o.invoiceNumber}</td>
                    <td className={TD}>{d(o.issuedAt)}</td>
                    <td className={`${TD} font-mono`}>{o.patientMrn}</td>
                    <td className={TD}>{o.patientName}</td>
                    <td className={TD}>{o.payerName || (payerTypeLabel ? t(payerTypeLabel) : '—')}</td>
                    <td className={TDR}>{formatAmount(o.totalAmount)}</td>
                    <td className={TDR}>{formatAmount(o.netPaid)}</td>
                    <td className={TDR}>{formatAmount(o.balance)}</td>
                    <td className={TD}>{t(o.paymentStatus === 'PARTIAL' ? 'Part paid' : 'Unpaid')}</td>
                    <td className={TDR}>{o.daysOutstanding}</td>
                  </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD} colSpan={5}>
                  {t(outstanding.rows.length === 1 ? 'Total ({count} invoice listed)' : 'Total ({count} invoices listed)', {
                    count: outstanding.rows.length,
                  })}
                </td>
                <td className={TDR}>{formatAmount(outstanding.rows.reduce((s, o) => s + o.totalAmount, 0))}</td>
                <td className={TDR}>{formatAmount(outstanding.rows.reduce((s, o) => s + o.netPaid, 0))}</td>
                <td className={TDR}>{formatAmount(outstanding.rows.reduce((s, o) => s + o.balance, 0))}</td>
                <td className={TD} colSpan={2} />
              </tr>
            </tfoot>
          </Table>
        </Section>

        {/* ---------- Signatures ---------- */}
        <section className="mt-8" style={{ breakInside: 'avoid' }}>
          <div className="grid grid-cols-3 gap-8 pt-6">
            {['Prepared by', 'Verified by', 'Approved by'].map((role) => (
              <div key={role}>
                <div className="h-10 border-b border-gray-700" />
                <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-gray-700">{t(role)}</p>
                <p className="text-[7.5px] leading-relaxed text-gray-500">{t('Name / signature')}</p>
                <p className="text-[7.5px] leading-relaxed text-gray-500">{t('Date')}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-gray-300 pt-1.5 text-[7px] leading-snug text-gray-500">
            {t(
              "Computer-generated from {labName}'s laboratory information system on {time} by {user}. Figures cover {period} and are stated in NPR. This is a management report; the statutory sales register, master bill and corrections reports are produced separately and cut their months at a different hour of the day, so month totals may differ slightly.",
              {
                labName: lab.name,
                time: dt(summary.generatedAt),
                user: summary.generatedBy,
                period: periodText(period.from, period.to),
              },
            )}
          </p>
        </section>
      </div>
    </>
  );
}
