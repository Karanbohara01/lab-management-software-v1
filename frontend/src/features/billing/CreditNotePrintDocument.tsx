import { formatMoney } from '@/lib/money';
import { amountInWordsNpr } from '@/lib/numberToWords';
import type { InvoiceDetail } from './types';

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' }) : '—';
}

/**
 * Printable Credit Note, issued against an original bill that was already filed with IRD and was
 * later cancelled (दफा ६(ठ) of the e-invoice procedure). It carries its own credit note number
 * and date (from the IRD submission's credit-note filing) plus a full reference back to the
 * original invoice it reverses — the original's line items and total, unchanged, so the reader
 * can see exactly what is being reversed.
 */
export function CreditNotePrintDocument({
  invoice,
  creditNoteNumber,
  creditNoteDate,
}: {
  invoice: InvoiceDetail;
  creditNoteNumber: string | null;
  creditNoteDate: string | null;
}) {
  return (
    <div className="relative bg-white p-8 text-black">
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
          <p className="text-xl font-bold uppercase">Credit Note</p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-x-8 gap-y-1 text-sm">
        <div>
          <span className="font-semibold">Credit Note No.: </span>
          {creditNoteNumber ?? '—'}
        </div>
        <div>
          <span className="font-semibold">Credit Note Date: </span>
          {dt(creditNoteDate)}
        </div>
        <div>
          <span className="font-semibold">Original Bill No.: </span>
          {invoice.invoiceNumber ?? '—'}
        </div>
        <div>
          <span className="font-semibold">Original Bill Date: </span>
          {dt(invoice.issuedAt)}
        </div>
        <div>
          <span className="font-semibold">Purchaser's Name: </span>
          {invoice.patientName}
        </div>
        <div>
          <span className="font-semibold">Address: </span>
          {invoice.patientAddress ?? '—'}
        </div>
      </div>

      <div className="mb-4 border border-black p-2 text-sm">
        <p>
          <span className="font-semibold">Reason for cancellation: </span>
          {invoice.cancelReason ?? '—'}
        </p>
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
          {invoice.taxAmount > 0 && (
            <tr>
              <td colSpan={4} className="py-1 text-right font-medium">
                VAT ({invoice.taxRate}%)
              </td>
              <td className="py-1 text-right">{formatMoney(invoice.taxAmount)}</td>
            </tr>
          )}
          <tr className="border-t border-black">
            <td colSpan={4} className="py-1.5 text-right text-base font-bold">
              Total Reversed
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
