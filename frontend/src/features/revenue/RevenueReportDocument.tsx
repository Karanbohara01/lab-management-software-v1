import { formatAmount } from '@/lib/money';
import { PAYER_TYPE_LABEL, PATIENT_CATEGORY_LABEL, PAYMENT_METHOD_LABEL, type RevenueReport } from './types';

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
  return iso ? new Date(iso).toLocaleDateString(undefined, DATE) : '—';
}

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(undefined, DATETIME) : '—';
}

function periodText(from: string, to: string): string {
  return from === to ? d(from) : `${d(from)} to ${d(to)}`;
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
  const { summary, breakdown, payments, refunds, outstanding } = report;
  const { lab, period, billing, collections } = summary;
  const title = period.from === period.to ? 'Daily Revenue Report' : 'Revenue Report';

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
                  {[lab.phone && `Tel: ${lab.phone}`, lab.email, lab.panNumber && `PAN: ${lab.panNumber}`]
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
              {period.days} day{period.days === 1 ? '' : 's'} · days as they fall in {period.zone.replace('_', ' ')}
            </p>
            <p className="text-[7.5px] leading-snug text-gray-600">
              {branchName ? `Branch: ${branchName}` : 'All branches'}
            </p>
            <p className="text-[7.5px] leading-snug text-gray-600">
              Generated {dt(summary.generatedAt)} by {summary.generatedBy}
            </p>
          </div>
        </header>

        {/* ---------- B. Financial summary ---------- */}
        <Section title="A. Financial summary">
          <div className="grid gap-x-8 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">
                Billed — invoices issued in this period
              </p>
              <Line label="Gross test charges" value={formatAmount(billing.grossCharges)} note="Before any discount" />
              <Line label="Less line discounts" value={formatAmount(billing.lineDiscounts)} />
              <Line label="Less invoice discounts" value={formatAmount(billing.invoiceDiscounts)} />
              <Line label="Total discounts" value={formatAmount(billing.totalDiscounts)} />
              <Line label="Subtotal" value={formatAmount(billing.subtotal)} note="Net of discounts" />
              <Line label="Taxable amount" value={formatAmount(billing.taxableAmount)} />
              <Line label="VAT" value={formatAmount(billing.taxAmount)} note="Collected on the government's behalf" />
              <Line label="Total billed" value={formatAmount(billing.totalBilled)} strong rule />
              <Line label="Invoices issued" value={String(billing.invoiceCount)} />
              <Line label="Tests and packages billed" value={String(billing.testsOrdered)} />
              {summary.cancelled.issuedThenCancelledCount > 0 && (
                <Line
                  label="Of these, since cancelled"
                  value={formatAmount(summary.cancelled.issuedThenCancelledAmount)}
                  note={`${summary.cancelled.issuedThenCancelledCount} invoice(s). Billed as issued was ${formatAmount(summary.cancelled.billedAsIssued)}.`}
                />
              )}
            </div>
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">
                Collected — money received in this period
              </p>
              <Line label="Total collected" value={formatAmount(collections.grossCollected)} note="By the date each payment was taken" />
              {collections.onAccount > 0 && (
                <>
                  <Line label="Cash, card, bank, wallet, cheque" value={formatAmount(collections.cashAndBank)} />
                  <Line label="Booked on account (credit)" value={formatAmount(collections.onAccount)} note="A settlement on account, not money through the till" />
                </>
              )}
              <Line label="Less refunds approved" value={formatAmount(summary.refunds.amount)} note={`${summary.refunds.count} refund(s), by approval date`} />
              <Line label="Net collections" value={formatAmount(summary.netCollected)} strong rule />
              <Line label="Payment transactions" value={String(collections.paymentCount)} />
              <div className="mt-2.5">
                <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">Outstanding</p>
                <Line
                  label="On invoices issued in this period"
                  value={formatAmount(billing.outstanding)}
                  note={`${billing.outstandingInvoiceCount} of ${billing.invoiceCount} invoice(s) unpaid, as at generation`}
                />
                <Line
                  label="All unpaid invoices, all time"
                  value={formatAmount(summary.outstanding.amount)}
                  note={`${summary.outstanding.invoiceCount} invoice(s)`}
                />
                <Line label="Invoices cancelled in this period" value={formatAmount(summary.cancelled.amount)} note={`${summary.cancelled.count} invoice(s)`} />
              </div>
            </div>
          </div>
          <p className="mt-2 border border-gray-300 bg-gray-50 px-2 py-1 text-[7.5px] leading-snug text-gray-700">
            Billed counts invoices by the date they were issued; cancelled invoices are excluded. Collected counts
            payments by the date the money arrived, and refunds by the date they were approved. An invoice billed in
            one period may therefore be collected in another, and the two columns are not expected to agree. Net
            collections is the figure that reconciles against cash in hand.
          </p>
        </Section>

        {/* ---------- D. Payment method breakdown ---------- */}
        <Section title="B. Collections by payment method" subtitle="Reconcile these against the till, the bank and the gateway statements.">
          <Table>
            <thead>
              <tr>
                <th className={TH}>Payment method</th>
                <th className={THR}>Transactions</th>
                <th className={THR}>Amount collected</th>
              </tr>
            </thead>
            <tbody>
              {collections.byMethod.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={3}>No payments were received in this period.</td>
                </tr>
              ) : (
                collections.byMethod.map((m) => (
                  <tr key={m.method} style={{ breakInside: 'avoid' }}>
                    <td className={TD}>{PAYMENT_METHOD_LABEL[m.method] ?? m.method}</td>
                    <td className={TDR}>{m.transactions}</td>
                    <td className={TDR}>{formatAmount(m.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD}>Total collected</td>
                <td className={TDR}>{collections.paymentCount}</td>
                <td className={TDR}>{formatAmount(collections.grossCollected)}</td>
              </tr>
            </tfoot>
          </Table>

          {collections.byCashier.length > 0 && (
            <>
              <p className="mb-1 mt-3 text-[8px] font-bold uppercase tracking-wide text-gray-600">By who received it</p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>Received by</th>
                    <th className={THR}>Transactions</th>
                    <th className={THR}>Amount collected</th>
                  </tr>
                </thead>
                <tbody>
                  {collections.byCashier.map((c) => (
                    <tr key={c.receivedBy} style={{ breakInside: 'avoid' }}>
                      <td className={TD}>
                        {c.receivedBy.startsWith('system:')
                          ? `${c.receivedBy.slice(7)} (online gateway)`
                          : c.receivedBy}
                      </td>
                      <td className={TDR}>{c.transactions}</td>
                      <td className={TDR}>{formatAmount(c.amount)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className={TD}>Total</td>
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
          title="C. Revenue by test"
          subtitle="Over the invoices issued in this period. Billed is exact; collected and outstanding are each line's pro-rata share of its invoice."
          breakBefore
        >
          <Table>
            <thead>
              <tr>
                <th className={TH}>Code</th>
                <th className={TH}>Test / package</th>
                <th className={TH}>Department</th>
                <th className={THR}>Times</th>
                <th className={THR}>Gross</th>
                <th className={THR}>Discount</th>
                <th className={THR}>Billed</th>
                <th className={THR}>Collected</th>
                <th className={THR}>Outstanding</th>
              </tr>
            </thead>
            <tbody>
              {breakdown.byTest.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={9}>No tests were billed in this period.</td>
                </tr>
              ) : (
                breakdown.byTest.map((t) => (
                  <tr key={t.code} style={{ breakInside: 'avoid' }}>
                    <td className={`${TD} font-mono`}>{t.code}</td>
                    <td className={TD}>
                      {t.name}
                      {t.type === 'PROFILE' && <span className="ml-1 text-gray-500">(package)</span>}
                    </td>
                    <td className={TD}>{t.department ?? '—'}</td>
                    <td className={TDR}>{t.timesOrdered}</td>
                    <td className={TDR}>{formatAmount(t.gross)}</td>
                    <td className={TDR}>{formatAmount(t.discount)}</td>
                    <td className={TDR}>{formatAmount(t.netBilled)}</td>
                    <td className={TDR}>{formatAmount(t.collected)}</td>
                    <td className={TDR}>{formatAmount(t.outstanding)}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD} colSpan={3}>Total ({breakdown.byTest.length} test{breakdown.byTest.length === 1 ? '' : 's'})</td>
                <td className={TDR}>{breakdown.byTest.reduce((s, t) => s + t.timesOrdered, 0)}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, t) => s + t.gross, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, t) => s + t.discount, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, t) => s + t.netBilled, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, t) => s + t.collected, 0))}</td>
                <td className={TDR}>{formatAmount(breakdown.byTest.reduce((s, t) => s + t.outstanding, 0))}</td>
              </tr>
            </tfoot>
          </Table>
          <p className="mt-1 text-[7.5px] leading-snug text-gray-600">
            A package is billed once at its own price. The tests inside it are performed but never billed
            separately, so no revenue here is counted twice. These lines sum to the subtotal, not to total billed —
            whole-invoice discounts and VAT are not distributed across lines.
          </p>
        </Section>

        <Section title="D. Revenue by category and department">
          <div className="grid gap-4 sm:grid-cols-2">
            {([
              ['Category', breakdown.byCategory],
              ['Department', breakdown.byDepartment],
            ] as const).map(([heading, rows]) => (
              <div key={heading}>
                <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">By {heading.toLowerCase()}</p>
                <Table>
                  <thead>
                    <tr>
                      <th className={TH}>{heading}</th>
                      <th className={THR}>Times</th>
                      <th className={THR}>Billed</th>
                      <th className={THR}>Collected</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.length === 0 ? (
                      <tr>
                        <td className={TD} colSpan={4}>No revenue in this period.</td>
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
                      <td className={TD}>Total</td>
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
                Packages and health-checkup panels sold
              </p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>Package</th>
                    <th className={THR}>Sold</th>
                    <th className={THR}>Billed</th>
                    <th className={THR}>Collected</th>
                    <th className={THR}>Outstanding</th>
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
                    <td className={TD}>Total</td>
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
        <Section title="E. Revenue by patient type and payer" breakBefore>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-1 text-[8px] font-bold uppercase tracking-wide text-gray-600">By patient type</p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>Patient type</th>
                    <th className={THR}>Invoices</th>
                    <th className={THR}>Billed</th>
                    <th className={THR}>Collected</th>
                    <th className={THR}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.byPatientCategory.map((r) => (
                    <tr key={r.category} style={{ breakInside: 'avoid' }}>
                      <td className={TD}>{PATIENT_CATEGORY_LABEL[r.category] ?? r.category}</td>
                      <td className={TDR}>{r.invoices}</td>
                      <td className={TDR}>{formatAmount(r.billed)}</td>
                      <td className={TDR}>{formatAmount(r.collected)}</td>
                      <td className={TDR}>{formatAmount(r.outstanding)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="font-bold">
                    <td className={TD}>Total</td>
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
                By payer (corporate, insurance and schemes)
              </p>
              <Table>
                <thead>
                  <tr>
                    <th className={TH}>Payer</th>
                    <th className={THR}>Invoices</th>
                    <th className={THR}>Billed</th>
                    <th className={THR}>Collected</th>
                    <th className={THR}>Outstanding</th>
                  </tr>
                </thead>
                <tbody>
                  {breakdown.byPayer.map((r) => (
                    <tr key={`${r.payerType}:${r.payerName ?? ''}`} style={{ breakInside: 'avoid' }}>
                      <td className={TD}>
                        {r.payerName || PAYER_TYPE_LABEL[r.payerType] || r.payerType}
                        {r.payerName && (
                          <span className="block text-[7.5px] text-gray-500">
                            {PAYER_TYPE_LABEL[r.payerType] ?? r.payerType}
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
                    <td className={TD}>Total</td>
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
          title="F. Payment transaction register"
          subtitle={
            payments.truncated
              ? `Every payment received in this period. Showing the first ${payments.rows.length} of ${payments.total} — narrow the period for the complete register.`
              : `Every payment received in this period, ${payments.total} in total, oldest first.`
          }
          breakBefore
        >
          <Table>
            <thead>
              <tr>
                <th className={TH}>Receipt</th>
                <th className={TH}>Date &amp; time</th>
                <th className={TH}>Invoice</th>
                <th className={TH}>Patient ID</th>
                <th className={TH}>Patient</th>
                <th className={TH}>Method</th>
                <th className={TH}>Reference</th>
                <th className={TH}>Received by</th>
                <th className={THR}>Amount</th>
                <th className={THR}>Refunded</th>
                <th className={TH}>Status</th>
              </tr>
            </thead>
            <tbody>
              {payments.rows.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={11}>No payments were received in this period.</td>
                </tr>
              ) : (
                payments.rows.map((p) => (
                  <tr key={p.id} style={{ breakInside: 'avoid' }}>
                    <td className={`${TD} font-mono`}>#{p.id}</td>
                    <td className={TD}>{dt(p.receivedAt)}</td>
                    <td className={`${TD} font-mono`}>{p.invoiceNumber}</td>
                    <td className={`${TD} font-mono`}>{p.patientMrn}</td>
                    <td className={TD}>{p.patientName}</td>
                    <td className={TD}>{PAYMENT_METHOD_LABEL[p.method] ?? p.method}</td>
                    <td className={TD}>{p.reference ?? '—'}</td>
                    <td className={TD}>{p.receivedBy}</td>
                    <td className={TDR}>{formatAmount(p.amount)}</td>
                    <td className={TDR}>{p.refundedAmount > 0 ? formatAmount(p.refundedAmount) : '—'}</td>
                    <td className={TD}>
                      {p.invoiceStatus === 'CANCELLED' ? 'Invoice cancelled' : p.refundedAmount > 0 ? 'Refunded' : 'Settled'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD} colSpan={8}>Total ({payments.rows.length} transaction{payments.rows.length === 1 ? '' : 's'} listed)</td>
                <td className={TDR}>{formatAmount(payments.rows.reduce((s, p) => s + p.amount, 0))}</td>
                <td className={TDR}>{formatAmount(payments.rows.reduce((s, p) => s + p.refundedAmount, 0))}</td>
                <td className={TD} />
              </tr>
            </tfoot>
          </Table>
          <p className="mt-1 text-[7.5px] leading-snug text-gray-600">
            The Refunded column shows refunds raised against that specific receipt, whenever they were approved —
            which may be outside this period. The refunds deducted from net collections above are those approved
            within it, listed next.
          </p>
        </Section>

        {refunds.rows.length > 0 && (
          <Section title="G. Refunds approved in this period">
            <Table>
              <thead>
                <tr>
                  <th className={TH}>Date &amp; time</th>
                  <th className={TH}>Invoice</th>
                  <th className={TH}>Patient</th>
                  <th className={TH}>Reason</th>
                  <th className={TH}>Requested by</th>
                  <th className={TH}>Approved by</th>
                  <th className={THR}>Amount</th>
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
                  <td className={TD} colSpan={6}>Total refunds ({refunds.total})</td>
                  <td className={TDR}>{formatAmount(summary.refunds.amount)}</td>
                </tr>
              </tfoot>
            </Table>
          </Section>
        )}

        {/* ---------- F. Outstanding payment summary ---------- */}
        <Section
          title="H. Outstanding payment summary"
          subtitle={
            outstanding.truncated
              ? `Unpaid invoices issued in this period. Showing the first ${outstanding.rows.length} of ${outstanding.total}.`
              : 'Unpaid invoices issued in this period, as at the time of generation.'
          }
          breakBefore
        >
          <Table>
            <thead>
              <tr>
                <th className={TH}>Invoice</th>
                <th className={TH}>Issued</th>
                <th className={TH}>Patient ID</th>
                <th className={TH}>Patient</th>
                <th className={TH}>Payer</th>
                <th className={THR}>Invoice total</th>
                <th className={THR}>Paid</th>
                <th className={THR}>Balance</th>
                <th className={TH}>Status</th>
                <th className={THR}>Days</th>
              </tr>
            </thead>
            <tbody>
              {outstanding.rows.length === 0 ? (
                <tr>
                  <td className={TD} colSpan={10}>Every invoice issued in this period is settled.</td>
                </tr>
              ) : (
                outstanding.rows.map((o) => (
                  <tr key={o.invoiceId} style={{ breakInside: 'avoid' }}>
                    <td className={`${TD} font-mono`}>{o.invoiceNumber}</td>
                    <td className={TD}>{d(o.issuedAt)}</td>
                    <td className={`${TD} font-mono`}>{o.patientMrn}</td>
                    <td className={TD}>{o.patientName}</td>
                    <td className={TD}>{o.payerName || PAYER_TYPE_LABEL[o.payerType] || '—'}</td>
                    <td className={TDR}>{formatAmount(o.totalAmount)}</td>
                    <td className={TDR}>{formatAmount(o.netPaid)}</td>
                    <td className={TDR}>{formatAmount(o.balance)}</td>
                    <td className={TD}>{o.paymentStatus === 'PARTIAL' ? 'Part paid' : 'Unpaid'}</td>
                    <td className={TDR}>{o.daysOutstanding}</td>
                  </tr>
                ))
              )}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td className={TD} colSpan={5}>Total ({outstanding.rows.length} invoice{outstanding.rows.length === 1 ? '' : 's'} listed)</td>
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
                <p className="mt-1 text-[8px] font-semibold uppercase tracking-wide text-gray-700">{role}</p>
                <p className="text-[7.5px] leading-relaxed text-gray-500">Name / signature</p>
                <p className="text-[7.5px] leading-relaxed text-gray-500">Date</p>
              </div>
            ))}
          </div>
          <p className="mt-4 border-t border-gray-300 pt-1.5 text-[7px] leading-snug text-gray-500">
            Computer-generated from {lab.name}'s laboratory information system on {dt(summary.generatedAt)} by{' '}
            {summary.generatedBy}. Figures cover {periodText(period.from, period.to)} and are stated in NPR. This is
            a management report; the statutory sales register, master bill and corrections reports are produced
            separately and cut their months at a different hour of the day, so month totals may differ slightly.
          </p>
        </section>
      </div>
    </>
  );
}
