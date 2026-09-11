import { formatMoney } from '@/lib/money';
import { amountInWordsNpr } from '@/lib/numberToWords';
import { PAYMENT_METHOD_LABEL } from './types';
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
export function InvoicePrintDocument({ invoice }: { invoice: InvoiceDetail }) {
  const isVatRegistered = !!invoice.labPan;
  const isCancelled = invoice.status === 'CANCELLED';
  const title = !isVatRegistered ? 'Invoice' : invoice.taxAmount > 0 ? 'Tax Invoice' : 'Abbreviated Tax Invoice';
  const isReprint = invoice.printCount > 1;
  const lastPayment = invoice.payments[invoice.payments.length - 1];
  const paymentMethod = lastPayment ? PAYMENT_METHOD_LABEL[lastPayment.method] : '—';

  return (
    <div className="relative bg-white p-8 text-black">
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

      <div className="mb-4 flex items-start justify-between gap-4 border-b border-black pb-3">
        <div>
          {invoice.labLogoDataUri && <img src={invoice.labLogoDataUri} alt="" className="mb-2 h-12" />}
          <p className="text-lg font-bold">{invoice.labName ?? 'Laboratory'}</p>
          {invoice.labAddress && <p className="text-sm">{invoice.labAddress}</p>}
          <p className="text-sm">
            {invoice.labPhone ?? ''}
            {invoice.labPhone && invoice.labEmail ? ' · ' : ''}
            {invoice.labEmail ?? ''}
          </p>
          {invoice.labPan && <p className="text-sm">PAN: {invoice.labPan}</p>}
        </div>
        <div className="text-right">
          <p className="text-xl font-bold uppercase">{title}</p>
          {isCancelled && <p className="text-sm font-bold text-red-600">CANCELLED</p>}
          {!isCancelled && isReprint && (
            <p className="text-sm font-semibold">Copy of Original ({invoice.printCount})</p>
          )}
        </div>
      </div>

      {isCancelled && (
        <div className="mb-4 border border-red-600 p-2 text-sm">
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

      <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <div>
          <span className="font-semibold">Bill Number: </span>
          {invoice.invoiceNumber ?? '—'}
        </div>
        <div>
          <span className="font-semibold">Invoice Issue Date: </span>
          {dt(invoice.issuedAt)}
        </div>
        <div>
          <span className="font-semibold">Purchaser's Name: </span>
          {invoice.patientName}
        </div>
        <div>
          <span className="font-semibold">Method of payment: </span>
          {paymentMethod}
        </div>
        <div>
          <span className="font-semibold">Address: </span>
          {invoice.patientAddress ?? '—'}
        </div>
        <div>
          <span className="font-semibold">Purchaser's PAN: </span>
          {'—'}
        </div>
      </div>

      <table className="mb-4 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y border-black">
            <th className="py-1.5 text-left">S.No.</th>
            <th className="py-1.5 text-left">Details</th>
            <th className="py-1.5 text-center">Qty</th>
            <th className="py-1.5 text-right">Per Unit Amount</th>
            <th className="py-1.5 text-right">Total Amount</th>
          </tr>
        </thead>
        <tbody>
          {invoice.items.map((item, i) => (
            <tr key={item.id}>
              <td className="py-1">{i + 1}</td>
              <td className="py-1">
                {item.testName} <span className="text-xs">({item.testCode})</span>
              </td>
              <td className="py-1 text-center">{item.quantity}</td>
              <td className="py-1 text-right">{formatMoney(item.unitPrice)}</td>
              <td className="py-1 text-right">{formatMoney(item.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          {invoice.discountAmount > 0 && (
            <tr className="border-t border-black">
              <td colSpan={4} className="py-1 text-right font-medium">
                Discount
              </td>
              <td className="py-1 text-right">− {formatMoney(invoice.discountAmount)}</td>
            </tr>
          )}
          <tr>
            <td colSpan={4} className="py-1 text-right font-medium">
              Taxable Amount
            </td>
            <td className="py-1 text-right">{formatMoney(invoice.taxableAmount)}</td>
          </tr>
          {isVatRegistered && invoice.taxAmount > 0 && (
            <tr>
              <td colSpan={4} className="py-1 text-right font-medium">
                VAT ({invoice.taxRate}%)
              </td>
              <td className="py-1 text-right">{formatMoney(invoice.taxAmount)}</td>
            </tr>
          )}
          <tr className="border-t border-black">
            <td colSpan={4} className="py-1.5 text-right text-base font-bold">
              Total
            </td>
            <td className="py-1.5 text-right text-base font-bold">{formatMoney(invoice.totalAmount)}</td>
          </tr>
        </tfoot>
      </table>

      <p className="mb-8 text-sm italic">In words: {amountInWordsNpr(invoice.totalAmount)}</p>

      <div className="mt-16 flex justify-end">
        <div className="w-56 border-t border-black pt-1 text-center text-sm">Authorized Signature</div>
      </div>
    </div>
  );
}
