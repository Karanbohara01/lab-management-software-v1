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
  const netRefund = creditNote.netRefundAmount || 0;
  const words = amountInWordsNpr(netRefund);
  const items = creditNote.items || [];

  return (
    <div
      {...(isPrintDocument ? { id: 'pharmacy-receipt-print' } : {})}
      className="mx-auto w-full max-w-[460px] rounded-xl border border-gray-200/80 bg-white p-5 sm:p-6 font-mono text-[12px] leading-relaxed text-gray-950 shadow-md print:m-0 print:max-w-none print:border-none print:p-2 print:shadow-none"
    >
      {/* Top Header */}
      <div className="border-b-2 border-dashed border-gray-800 pb-3 text-center">
        <h2 className="text-base font-black tracking-wide text-gray-900 uppercase">{hospitalName}</h2>
        <p className="text-[11px] text-gray-600">{address}</p>
        <p className="text-[11px] text-gray-600">Tel: {phone}</p>
        <p className="mt-1 text-[11px] font-bold">PAN / VAT: {panNumber}</p>
        <div className="mt-2 inline-block rounded-md border-2 border-red-600 bg-red-50/80 px-3 py-1 text-[11px] font-black uppercase text-red-700 tracking-wider">
          CREDIT NOTE (फिर्ता बिल / अनुसूची-७)
        </div>
      </div>

      {/* Credit Note & Patient Meta */}
      <div className="border-b border-dashed border-gray-400 py-3 text-[11px] space-y-1">
        <div className="flex justify-between">
          <span>
            <strong className="font-bold text-gray-900">Credit Note No:</strong>{' '}
            <span className="font-black text-red-700">{creditNote.creditNoteNumber}</span>
          </span>
          <span>
            <strong className="font-bold text-gray-900">Mode:</strong> {creditNote.refundMethod}
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <strong className="font-bold text-gray-900">Ref Invoice:</strong>{' '}
            <span className="font-mono">{creditNote.originalInvoiceNumber}</span>
          </span>
          <span>
            <strong className="font-bold text-gray-900">Date:</strong>{' '}
            {creditNote.createdAt ? new Date(creditNote.createdAt).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <div className="mt-2 border-t border-dotted border-gray-300 pt-2 space-y-0.5">
          <div>
            <strong className="font-bold text-gray-900">Customer Name:</strong> {creditNote.customerName}
          </div>
          {creditNote.customerPhone && (
            <div>
              <strong className="font-bold text-gray-900">Contact No:</strong> {creditNote.customerPhone}
            </div>
          )}
          <div>
            <strong className="font-bold text-gray-900">Return Reason:</strong>{' '}
            <span className="text-gray-800">{creditNote.returnReason}</span>
          </div>
        </div>
      </div>

      {/* Returned Line Items */}
      <div className="py-2">
        <table className="w-full border-collapse border-b border-dashed border-gray-800 text-[11px]">
          <thead>
            <tr className="border-b-2 border-gray-800 text-left bg-gray-50/50">
              <th className="py-1.5 px-1 font-bold">Item & Batch</th>
              <th className="py-1.5 px-1 text-center font-bold">Qty</th>
              <th className="py-1.5 px-1 text-right font-bold">Rate</th>
              <th className="py-1.5 px-1 text-right font-bold">Refund</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dotted divide-gray-300">
            {items.map((i, idx) => (
              <tr key={idx}>
                <td className="py-2 px-1">
                  <div className="font-extrabold text-gray-900">{i.itemName}</div>
                  <div className="text-[10px] text-gray-600">
                    Batch: <span className="font-mono">{i.batchNumber}</span>
                    {i.expiryDate ? ` · Exp: ${i.expiryDate}` : ''}
                  </div>
                </td>
                <td className="py-2 px-1 text-center font-bold whitespace-nowrap">
                  {i.returnQuantity} {i.unitType}
                </td>
                <td className="py-2 px-1 text-right font-mono">Rs. {(i.unitPrice || 0).toFixed(2)}</td>
                <td className="py-2 px-1 text-right font-black text-red-600 font-mono">
                  Rs. {(i.totalRefund || 0).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Tax & Total Summary */}
      <div className="space-y-1 border-b-2 border-dashed border-gray-800 py-3 text-[11px]">
        <div className="flex justify-between">
          <span className="text-gray-700">Subtotal Refund:</span>
          <span className="font-mono font-medium">Rs. {(creditNote.subtotalRefund || 0).toFixed(2)}</span>
        </div>
        {(creditNote.nonTaxableAmount || 0) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Non-Taxable Amount:</span>
            <span className="font-mono">Rs. {(creditNote.nonTaxableAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(creditNote.taxableAmount || 0) > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Taxable Amount:</span>
            <span className="font-mono">Rs. {(creditNote.taxableAmount || 0).toFixed(2)}</span>
          </div>
        )}
        {(creditNote.vatAmount || 0) > 0 && (
          <div className="flex justify-between font-bold text-amber-800">
            <span>VAT Reversal (13%):</span>
            <span className="font-mono">Rs. {(creditNote.vatAmount || 0).toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between border-t-2 border-gray-900 pt-2 text-sm font-black text-red-700">
          <span>TOTAL REFUND PAID:</span>
          <span className="font-mono text-base">Rs. {netRefund.toFixed(2)}</span>
        </div>
      </div>

      {/* Words */}
      <div className="border-b border-dashed border-gray-400 py-2 text-[10px] leading-snug">
        <strong className="font-bold text-gray-900">In Words:</strong>{' '}
        <span className="italic text-gray-800">{words}</span>
      </div>

      {/* Footer Notes & Signatures */}
      <div className="pt-3 text-center text-[10px]">
        <div className="mb-4 flex justify-between px-4 pt-6">
          <div className="w-28 border-t border-black pt-1 font-semibold text-gray-800">Customer Sign</div>
          <div className="w-28 border-t border-black pt-1 font-semibold text-gray-800">Pharmacist Sign</div>
        </div>
        <p className="font-bold text-gray-700">
          * Returned inventory restored to original batch records *
        </p>
        <p className="text-[9px] text-gray-500">
          Software: LIMS Clinical Suite · IRD Nepal Compliance
        </p>
      </div>
    </div>
  );
}
