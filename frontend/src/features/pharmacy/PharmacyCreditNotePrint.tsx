import { amountInWordsNpr } from '@/lib/numberToWords';
import type { SaleReturn } from './types';

interface PharmacyCreditNotePrintProps {
  creditNote: SaleReturn;
  hospitalName?: string;
  panNumber?: string;
  address?: string;
  phone?: string;
  isPrintDocument?: boolean;
}

/**
 * IRD Nepal Anusuchi-7 Compliant Credit Note (फिर्ता बिल)
 * Displays original invoice cross-reference, returned batch details,
 * tax breakdown adjustments, reason for return, and refund mode.
 */
export function PharmacyCreditNotePrint({
  creditNote,
  hospitalName = 'LIMS HOSPITAL PHARMACY',
  panNumber = '601234567',
  address = 'Hospital Road, Kathmandu, Nepal',
  phone = '01-4455660 / 9801234567',
  isPrintDocument = false,
}: PharmacyCreditNotePrintProps) {
  const words = amountInWordsNpr(creditNote.netRefundAmount);

  return (
    <div
      {...(isPrintDocument ? { id: 'pharmacy-receipt-print' } : {})}
      className="mx-auto w-full max-w-[360px] bg-white p-4 font-mono text-[11px] leading-tight text-black print:m-0 print:max-w-none print:p-2"
    >
      {/* Top Header */}
      <div className="border-b-2 border-dashed border-black pb-2 text-center">
        <h2 className="text-sm font-extrabold tracking-wider">{hospitalName}</h2>
        <p className="text-[10px] text-gray-700">{address}</p>
        <p className="text-[10px] text-gray-700">Tel: {phone}</p>
        <p className="mt-0.5 text-[10px] font-bold">PAN / VAT: {panNumber}</p>
        <div className="mt-1.5 inline-block rounded border border-red-600 bg-red-50 px-2 py-0.5 text-[10px] font-extrabold uppercase text-red-700">
          CREDIT NOTE (फिर्ता बिल / अनुसूची-७)
        </div>
      </div>

      {/* Credit Note & Patient Meta */}
      <div className="border-b border-dashed border-black py-2 text-[10px]">
        <div className="flex justify-between">
          <span>
            <strong className="font-semibold">Credit Note:</strong> {creditNote.creditNoteNumber}
          </span>
          <span>
            <strong className="font-semibold">Refund Mode:</strong> {creditNote.refundMethod}
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <strong className="font-semibold">Ref Invoice:</strong> {creditNote.originalInvoiceNumber}
          </span>
          <span>
            <strong className="font-semibold">Date:</strong> {new Date(creditNote.createdAt).toLocaleDateString()}
          </span>
        </div>
        <div className="mt-1 border-t border-dotted border-gray-400 pt-1">
          <div>
            <strong className="font-semibold">Customer:</strong> {creditNote.customerName}
          </div>
          {creditNote.customerPhone && (
            <div>
              <strong className="font-semibold">Contact:</strong> {creditNote.customerPhone}
            </div>
          )}
          <div>
            <strong className="font-semibold">Reason:</strong> {creditNote.returnReason}
          </div>
        </div>
      </div>

      {/* Returned Line Items */}
      <table className="w-full border-collapse border-b border-dashed border-black py-2 text-[10px]">
        <thead>
          <tr className="border-b border-black text-left">
            <th className="py-1">Item / Batch</th>
            <th className="py-1 text-center">Qty</th>
            <th className="py-1 text-right">Rate</th>
            <th className="py-1 text-right">Refund</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-dotted divide-gray-300">
          {creditNote.items.map((i, idx) => (
            <tr key={idx}>
              <td className="py-1 pr-1">
                <div className="font-bold">{i.itemName}</div>
                <div className="text-[9px] text-gray-600">
                  B: {i.batchNumber} | Exp: {i.expiryDate}
                </div>
              </td>
              <td className="py-1 text-center font-medium">
                {i.returnQuantity} {i.unitType}
              </td>
              <td className="py-1 text-right">Rs. {i.unitPrice.toFixed(2)}</td>
              <td className="py-1 text-right font-bold text-red-600">
                Rs. {i.totalRefund.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Tax & Total Summary */}
      <div className="space-y-0.5 border-b border-dashed border-black py-2 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal Refund:</span>
          <span>Rs. {creditNote.subtotalRefund.toFixed(2)}</span>
        </div>
        {creditNote.nonTaxableAmount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Non-Taxable Amount:</span>
            <span>Rs. {creditNote.nonTaxableAmount.toFixed(2)}</span>
          </div>
        )}
        {creditNote.taxableAmount > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Taxable Amount:</span>
            <span>Rs. {creditNote.taxableAmount.toFixed(2)}</span>
          </div>
        )}
        {creditNote.vatAmount > 0 && (
          <div className="flex justify-between font-medium text-amber-700">
            <span>VAT Reversal (13%):</span>
            <span>Rs. {creditNote.vatAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t border-black pt-1 text-xs font-extrabold text-red-700">
          <span>Total Refund Paid:</span>
          <span>Rs. {creditNote.netRefundAmount.toFixed(2)}</span>
        </div>
      </div>

      {/* Words */}
      <div className="border-b border-dashed border-black py-1.5 text-[9px] italic">
        <strong>In Words:</strong> {words}
      </div>

      {/* Footer Notes & Signatures */}
      <div className="pt-3 text-center text-[9px]">
        <div className="mb-4 flex justify-between px-2 pt-6">
          <div className="border-t border-black px-4 pt-1">Customer Sign</div>
          <div className="border-t border-black px-4 pt-1">Pharmacist Sign</div>
        </div>
        <p className="font-semibold text-gray-700">
          * Returned inventory restored to original batch records *
        </p>
        <p className="text-[8px] text-gray-500">
          Software: LIMS Clinical Suite · IRD Nepal Compliance
        </p>
      </div>
    </div>
  );
}
