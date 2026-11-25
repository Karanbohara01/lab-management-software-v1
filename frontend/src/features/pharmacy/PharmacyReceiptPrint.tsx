import { amountInWordsNpr } from '@/lib/numberToWords';
import type { SaleReceipt } from './types';

interface PharmacyReceiptPrintProps {
  receipt: SaleReceipt;
  hospitalName?: string;
  panNumber?: string;
  address?: string;
  phone?: string;
  isPrintDocument?: boolean;
}

export function PharmacyReceiptPrint({
  receipt,
  hospitalName = 'LIMS HOSPITAL PHARMACY',
  panNumber = '601234567',
  address = 'Hospital Road, Kathmandu, Nepal',
  phone = '01-4455660 / 9801234567',
  isPrintDocument = false,
}: PharmacyReceiptPrintProps) {
  const isTaxInvoice = receipt.vatAmount > 0;
  const invoiceTitle = isTaxInvoice ? 'TAX INVOICE' : 'ABBREVIATED TAX INVOICE / CASH RECEIPT';
  const hasTaxable = receipt.taxableAmount > 0;

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
        <div className="mt-1.5 inline-block rounded border border-black px-2 py-0.5 text-[10px] font-extrabold uppercase">
          {invoiceTitle}
        </div>
      </div>

      {/* Invoice & Patient Meta */}
      <div className="border-b border-dashed border-black py-2 text-[10px]">
        <div className="flex justify-between">
          <span>
            <strong className="font-semibold">Invoice No:</strong> {receipt.invoiceNumber}
          </span>
          <span>
            <strong className="font-semibold">Mode:</strong> {receipt.paymentMethod}
          </span>
        </div>
        <div className="flex justify-between">
          <span>
            <strong className="font-semibold">Date:</strong> {new Date(receipt.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="mt-1 border-t border-dotted border-gray-400 pt-1">
          <div>
            <strong className="font-semibold">Patient/Customer:</strong> {receipt.customerName}
          </div>
          {receipt.customerPhone && (
            <div>
              <strong className="font-semibold">Phone:</strong> {receipt.customerPhone}
            </div>
          )}
          {receipt.doctorName && (
            <div>
              <strong className="font-semibold">Doctor:</strong> {receipt.doctorName}
            </div>
          )}
        </div>
      </div>

      {/* Itemized Table */}
      <table className="w-full border-b-2 border-dashed border-black py-1 text-left text-[10px]">
        <thead>
          <tr className="border-b border-black text-[9px] uppercase">
            <th className="py-1">SN Particulars</th>
            <th className="text-center">Qty</th>
            <th className="text-right">Rate</th>
            <th className="text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {receipt.items.map((item, idx) => (
            <tr key={idx} className="border-b border-dotted border-gray-300">
              <td className="py-1 pr-1">
                <div className="font-bold">
                  {idx + 1}. {item.itemName} {item.isVatApplicable ? '*' : ''}
                </div>
                <div className="text-[9px] text-gray-600">
                  Batch: {item.batchNumber} | Exp: {item.expiryDate}
                </div>
                {item.dosageInstruction && (
                  <div className="text-[9px] italic text-gray-800">
                    Dosage: {item.dosageInstruction}
                  </div>
                )}
              </td>
              <td className="whitespace-nowrap text-center align-top py-1">
                {item.quantity} {item.unitType === 'PACK' ? 'Pack' : 'Tab/Pcs'}
              </td>
              <td className="whitespace-nowrap text-right align-top py-1">
                {item.unitPrice.toFixed(2)}
              </td>
              <td className="whitespace-nowrap text-right font-bold align-top py-1">
                {item.totalPrice.toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Calculation & Tax Summary */}
      <div className="border-b-2 border-dashed border-black py-2 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>Rs. {receipt.subtotal.toFixed(2)}</span>
        </div>

        {receipt.discountAmount > 0 && (
          <div className="flex justify-between text-gray-700">
            <span>Discount:</span>
            <span>- Rs. {receipt.discountAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="flex justify-between">
          <span>Non-Taxable (0% VAT):</span>
          <span>Rs. {receipt.nonTaxableAmount.toFixed(2)}</span>
        </div>

        {hasTaxable && (
          <div className="flex justify-between">
            <span>Taxable Amount (13% VAT items):</span>
            <span>Rs. {receipt.taxableAmount.toFixed(2)}</span>
          </div>
        )}

        {receipt.vatAmount > 0 && (
          <div className="flex justify-between font-semibold">
            <span>VAT (13%):</span>
            <span>Rs. {receipt.vatAmount.toFixed(2)}</span>
          </div>
        )}

        <div className="mt-1 flex justify-between border-t border-black pt-1 text-xs font-black">
          <span>GRAND TOTAL:</span>
          <span>Rs. {receipt.netTotal.toFixed(2)}</span>
        </div>

        {receipt.paidAmount > 0 && (
          <div className="mt-1 flex justify-between border-t border-dotted border-gray-400 pt-1 text-[10px]">
            <span>Paid: Rs. {receipt.paidAmount.toFixed(2)}</span>
            <span>Change: Rs. {receipt.changeAmount.toFixed(2)}</span>
          </div>
        )}
      </div>

      {/* Amount in words */}
      <div className="border-b border-dashed border-black py-1.5 text-[9px] italic">
        <strong>In Words:</strong> {amountInWordsNpr(Math.round(receipt.netTotal))}
      </div>

      {/* Refill notice */}
      {receipt.refillReminderDays && receipt.refillReminderDays > 0 && (
        <div className="mt-1 rounded border border-gray-400 bg-gray-50 p-1 text-[9px]">
          <strong>Notice:</strong> Refill scheduled in {receipt.refillReminderDays} days.
        </div>
      )}

      {/* Disclaimers & Footer */}
      <div className="pt-2 text-center text-[9px] text-gray-700">
        {hasTaxable && <p className="text-[8px]">* Indicates 13% Taxable Item (Cosmetics / Surgical)</p>}
        <p className="mt-0.5">Medicines once sold cannot be returned without original bill.</p>
        <p>Please check expiry & quantity before leaving counter.</p>
        <p className="mt-1 font-bold text-black">*** GET WELL SOON ***</p>
        <p className="mt-1 text-[8px] text-gray-400">Computer Generated Invoice · DDA Approved</p>
      </div>
    </div>
  );
}
