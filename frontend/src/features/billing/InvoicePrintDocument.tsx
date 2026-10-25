import { formatMoney } from '@/lib/money';
import { amountInWordsNpr } from '@/lib/numberToWords';
import type { InvoiceDetail } from './types';

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

/**
 * Printed invoice, formatted to match the e-invoice procedure's Anusuchi-6 layout: a "Tax
 * Invoice" (VAT-registered lab, tax > 0), an "Abbreviated Tax Invoice" (VAT-registered, no tax
 * on this bill), or a plain "Invoice" (no PAN on file — not VAT-registered) — seller/buyer
 * details, payment method, line items, discount/taxable/VAT breakdown, amount in words, and an
 * authorized-signature line. A reprint (printCount > 1) is watermarked "COPY OF ORIGINAL" per
 * दफा ६(च) of the procedure. A cancelled bill stays printable per दफा ६(ज) — it is instead
 * watermarked "CANCELLED" and carries a cancellation-details block (who, when, why) so the
 * printed copy can never be mistaken for a live, payable invoice.
 */
/**
 * Anusuchi-6 prescribes exactly four payment-method categories on the printed bill — actual
 * method labels here (CARD, BANK_TRANSFER, DIGITAL_WALLET) map onto "Other", and an invoice with
 * no payment yet recorded is honestly a "Creditor" (an unpaid receivable), not a blank dash.
 */
function anusuchi6PaymentMethod(invoice: InvoiceDetail): string {
  const lastPayment = invoice.payments[invoice.payments.length - 1];
  if (!lastPayment) return invoice.balance > 0 ? 'Creditor' : 'Cash';
  switch (lastPayment.method) {
    case 'CASH':
      return 'Cash';
    case 'CHEQUE':
      return 'Cheque';
    case 'CREDIT':
      return 'Creditor';
    default:
      return 'Other';
  }
}

/** Anusuchi-6's line-item table column is literally "Discount %" — always a rate, never a raw rupee amount. */
function discountPercent(invoice: InvoiceDetail): number {
  if (invoice.discountType === 'PERCENT') return invoice.discountValue;
  if (invoice.subtotal <= 0) return 0;
  return Math.round((invoice.discountAmount / invoice.subtotal) * 10000) / 100;
}

export function InvoicePrintDocument({ invoice }: { invoice: InvoiceDetail }) {
  const isVatRegistered = !!invoice.labPan;
  const isCancelled = invoice.status === 'CANCELLED';
  const title = !isVatRegistered ? 'Invoice' : invoice.taxAmount > 0 ? 'Tax Invoice' : 'Abbreviated Tax Invoice';
  const isReprint = invoice.printCount > 1;
  const paymentMethod = anusuchi6PaymentMethod(invoice);

  return (
    <div className="relative bg-white text-black">
      {/* A fixed brand-colored top bar, not the app's theme-variable `primary` token — this prints
          on paper and must look identical regardless of the viewer's light/dark mode setting, so
          every accent color below is a literal Tailwind shade (sky-*), never a CSS-variable color. */}
      <div className="h-2 bg-sky-600" aria-hidden />
      <div className="p-6">
      {isCancelled ? (
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
          aria-hidden
        >
          <span className="rotate-[-30deg] select-none text-7xl font-bold uppercase tracking-widest text-red-600/20">
            Cancelled
          </span>
        </div>
      ) : (
        isReprint && (
          <div
            className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
            aria-hidden
          >
            <span className="rotate-[-30deg] select-none text-6xl font-bold uppercase tracking-widest text-black/10">
              Copy of Original
            </span>
          </div>
        )
      )}

      <div
        className={`mb-3 flex items-start gap-4 border-b-2 border-sky-700 pb-3 ${invoice.printLetterhead ? 'justify-between' : 'justify-end'}`}
      >
        {invoice.printLetterhead && (
          <div>
            {invoice.labLogoDataUri && <img src={invoice.labLogoDataUri} alt="" className="mb-1.5 h-11" />}
            <p className="text-lg font-bold leading-tight tracking-tight text-sky-900">{invoice.labName ?? 'Laboratory'}</p>
            {invoice.labAddress && <p className="text-xs leading-snug text-gray-600">{invoice.labAddress}</p>}
            <p className="text-xs leading-snug text-gray-600">
              {invoice.labPhone ?? ''}
              {invoice.labPhone && invoice.labEmail ? ' · ' : ''}
              {invoice.labEmail ?? ''}
            </p>
            {invoice.labPan && <p className="text-xs leading-snug text-gray-600">PAN: {invoice.labPan}</p>}
          </div>
        )}
        <div className="text-right">
          <p className="inline-block rounded bg-sky-700 px-2.5 py-1 text-base font-bold uppercase tracking-wide text-white">
            {title}
          </p>
          {isCancelled && <p className="mt-1 text-sm font-bold text-red-600">CANCELLED</p>}
          {!isCancelled && isReprint && (
            <p className="mt-1 text-sm font-semibold text-gray-600">Copy of Original ({invoice.printCount})</p>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="mb-3 border border-red-600 p-2 text-sm">
          <p className="font-bold text-red-600">This bill has been cancelled and is no longer valid.</p>
          <p>
            <span className="font-semibold">Cancelled on: </span>
            {dt(invoice.cancelledAt)}
            {invoice.cancelledBy && (
              <>
                {' · '}
                <span className="font-semibold">By: </span>
                {invoice.cancelledBy}
              </>
            )}
          </p>
          {invoice.cancelReason && (
            <p>
              <span className="font-semibold">Reason: </span>
              {invoice.cancelReason}
            </p>
          )}
        </div>
      )}

      {/* Every field Anusuchi-6 names is present and explicitly labeled here regardless of the
          letterhead toggle above (which is decorative branding, not a substitute for the
          prescribed Seller's Name/PAN/Address fields) — Bill Number pairs with Transactions Date,
          Seller's PAN pairs with Invoice Issue Date, exactly matching the schedule's own layout. */}
      <div className="mb-3 grid grid-cols-2 gap-x-6 gap-y-0.5 rounded-md border border-gray-200 bg-gray-50 p-2.5 text-sm">
        <div className="truncate">
          <span className="font-semibold text-gray-700">Bill Number: </span>
          {invoice.invoiceNumber ?? '—'}
        </div>
        <div className="whitespace-nowrap">
          <span className="font-semibold text-gray-700">Transactions Date: </span>
          {dt(invoice.transactionDate)}
          {invoice.transactionDateBs && ` (${invoice.transactionDateBs} BS)`}
        </div>
        <div className="truncate">
          <span className="font-semibold text-gray-700">Seller's PAN: </span>
          {invoice.labPan ?? '—'}
        </div>
        <div className="whitespace-nowrap">
          <span className="font-semibold text-gray-700">Invoice Issue Date: </span>
          {dt(invoice.issuedAt)}
          {invoice.issuedAtBs && ` (${invoice.issuedAtBs} BS)`}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Seller's Name: </span>
          {invoice.labName ?? '—'}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Address: </span>
          {invoice.labAddress ?? '—'}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Purchaser's Name: </span>
          {invoice.patientName}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Method of payment: </span>
          {paymentMethod}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Address: </span>
          {invoice.patientAddress ?? '—'}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Purchaser's PAN: </span>
          {invoice.buyerPan ?? '—'}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Patient MRN: </span>
          {invoice.patientMrn}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Phone: </span>
          {invoice.patientPhone ?? '—'}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Fiscal Year: </span>
          {invoice.fiscalYear}
        </div>
        <div>
          <span className="font-semibold text-gray-700">Order No.: </span>
          {invoice.orderNumber}
        </div>
      </div>

      <table className="mb-3 w-full border-collapse text-sm">
        <thead>
          <tr className="bg-sky-700 text-white">
            <th className="rounded-l py-1.5 pl-2 text-left">S.No.</th>
            {/* Anusuchi-5's table always carries an H.S. Code column — filled in only when the
                line item is an imported good per its customs declaration. A lab test is a
                service, never an imported good, so the column stays blank, but the column
                itself is still part of the prescribed layout and must be present. */}
            <th className="py-1.5 text-left">H.S. Code</th>
            <th className="py-1.5 text-left">Details</th>
            <th className="py-1.5 text-center">Qty</th>
            <th className="py-1.5 text-right">Per Unit Amount</th>
            <th className="rounded-r py-1.5 pr-2 text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={item.id} className="border-b border-gray-200 even:bg-gray-50/70">
              <td className="py-1.5 pl-2">{i + 1}</td>
              <td className="py-1.5">—</td>
              <td className="py-1.5">
                {item.testName} <span className="text-xs text-gray-500">({item.testCode})</span>
              </td>
              <td className="py-1.5 text-center">{item.quantity}</td>
              <td className="py-1.5 text-right">{formatMoney(item.unitPrice)}</td>
              <td className="py-1.5 pr-2 text-right">{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {invoice.discountAmount > 0 && (
            <tr className="border-t border-gray-300">
              {/* Anusuchi-6's column header is literally "Discount %" — a rate, not a raw rupee
                  figure — so this shows the percentage; the actual rupee amount is still implied
                  by Subtotal minus Taxable Amount for anyone reconciling the two. */}
              <td colSpan={5} className="py-1 text-right font-medium text-gray-700">
                Discount %
              </td>
              <td className="py-1 pr-2 text-right">{discountPercent(invoice)}%</td>
            </tr>
          )}
          <tr>
            <td colSpan={5} className="py-1 text-right font-medium text-gray-700">
              Taxable Amount
            </td>
            <td className="py-1 pr-2 text-right">{formatMoney(invoice.taxableAmount)}</td>
          </tr>
          {isVatRegistered && invoice.taxAmount > 0 && (
            <tr>
              <td colSpan={5} className="py-1 text-right font-medium text-gray-700">
                VAT ({invoice.taxRate}%)
              </td>
              <td className="py-1 pr-2 text-right">{formatMoney(invoice.taxAmount)}</td>
            </tr>
          )}
          <tr className="border-t-2 border-sky-700 bg-sky-50">
            <td colSpan={5} className="py-1.5 text-right text-base font-bold text-sky-900">
              Total
            </td>
            <td className="py-1.5 pr-2 text-right text-base font-bold text-sky-900">{formatMoney(invoice.totalAmount)}</td>
          </tr>
          {!isCancelled && (
            <>
              <tr>
                <td colSpan={5} className="py-1 text-right text-gray-700">
                  Amount Paid
                </td>
                <td className="py-1 pr-2 text-right">{formatMoney(invoice.amountPaid)}</td>
              </tr>
              {invoice.amountRefunded > 0 && (
                <tr>
                  <td colSpan={5} className="py-1 text-right text-gray-700">
                    Refunded
                  </td>
                  <td className="py-1 pr-2 text-right">− {formatMoney(invoice.amountRefunded)}</td>
                </tr>
              )}
              <tr className={`border-t border-gray-300 ${invoice.balance > 0 ? 'bg-amber-50' : ''}`}>
                <td
                  className={`py-1.5 text-right font-bold ${invoice.balance > 0 ? 'text-amber-800' : 'text-gray-700'}`}
                  colSpan={5}
                >
                  Balance Due
                </td>
                <td
                  className={`py-1.5 pr-2 text-right font-bold ${invoice.balance > 0 ? 'text-amber-800' : 'text-gray-700'}`}
                >
                  {formatMoney(invoice.balance)}
                </td>
              </tr>
            </>
          )}
        </tfoot>
      </table>

      <p className="mb-6 rounded border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm italic text-gray-700">
        In words: {amountInWordsNpr(invoice.totalAmount)}
      </p>

      <div className="mt-8 flex justify-end">
        <div className="w-56 border-t border-black pt-1 text-center text-sm">Authorized Signature</div>
      </div>
      </div>
    </div>
  );
}
