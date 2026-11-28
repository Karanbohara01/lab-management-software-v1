import type { PurchaseOrder } from './types';
import { amountInWordsNpr } from '@/lib/numberToWords';

interface PharmacyPoPrintSheetProps {
  po: PurchaseOrder;
  hospitalName?: string;
  panNumber?: string;
  address?: string;
  phone?: string;
  isPrintDocument?: boolean;
}

export function PharmacyPoPrintSheet({
  po,
  hospitalName = 'LIMS HOSPITAL PHARMACY',
  panNumber = '601234567',
  address = 'Hospital Road, Kathmandu, Nepal',
  phone = '01-4455660 / 9801234567',
  isPrintDocument = false,
}: PharmacyPoPrintSheetProps) {
  const items = po.items || [];
  const words = amountInWordsNpr(po.totalEstimatedAmount || 0);

  return (
    <div
      {...(isPrintDocument ? { id: 'pharmacy-po-print' } : {})}
      className="mx-auto w-full max-w-4xl bg-white p-6 font-sans text-xs leading-relaxed text-gray-900 print:m-0 print:max-w-none print:p-0 print:text-black"
    >
      {/* Letterhead Header */}
      <div className="border-b-2 border-gray-900 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-gray-950 print:text-black">
              {hospitalName}
            </h1>
            <p className="text-xs font-semibold text-gray-700">{address}</p>
            <p className="text-[11px] text-gray-600">Tel: {phone} · Email: pharmacy@hospital.edu.np</p>
            <p className="mt-0.5 text-xs font-bold text-gray-800">Hospital PAN / VAT: {panNumber}</p>
          </div>
          <div className="text-right">
            <div className="inline-block rounded-md border-2 border-blue-800 bg-blue-50 px-3 py-1 text-center dark:bg-blue-50 print:border-black print:bg-transparent">
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-blue-900 print:text-black">
                OFFICIAL PURCHASE ORDER
              </span>
              <span className="font-mono text-sm font-black text-blue-700 print:text-black">
                {po.poNumber}
              </span>
            </div>
            <div className="mt-2 space-y-0.5 text-[11px] text-gray-700">
              <p>
                <strong>PO Date:</strong> {po.orderDate}
              </p>
              <p>
                <strong>Expected By:</strong> {po.expectedDeliveryDate || 'Immediate'}
              </p>
              <p>
                <strong>Status:</strong> <span className="font-bold uppercase">{po.status}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Distributor and Delivery Meta Grid */}
      <div className="my-4 grid grid-cols-2 gap-4 text-xs">
        <div className="rounded-lg border border-gray-300 bg-gray-50/70 p-3 print:border-gray-400 print:bg-transparent">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
            VENDOR / DISTRIBUTOR:
          </span>
          <div className="mt-1 text-sm font-bold text-gray-950 print:text-black">{po.wholesalerName}</div>
          {po.wholesalerPhone && (
            <p className="text-gray-700">
              <strong>Phone / Tel:</strong> {po.wholesalerPhone}
            </p>
          )}
          {po.wholesalerPan && (
            <p className="text-gray-700">
              <strong>PAN / VAT No:</strong> {po.wholesalerPan}
            </p>
          )}
        </div>

        <div className="rounded-lg border border-gray-300 bg-gray-50/70 p-3 print:border-gray-400 print:bg-transparent">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500">
            DELIVER & BILL TO:
          </span>
          <div className="mt-1 text-sm font-bold text-gray-950 print:text-black">
            Hospital Dispensary & Inward Store
          </div>
          <p className="text-gray-700">
            <strong>Attention:</strong> Chief Store Pharmacist
          </p>
          <p className="text-gray-700">
            <strong>Authorized By:</strong> {po.createdBy || 'Authorized Pharmacist'}
          </p>
        </div>
      </div>

      {/* Order Line Items Table */}
      <div className="border border-gray-300 rounded-lg overflow-hidden print:border-gray-400">
        <table className="w-full text-left text-xs">
          <thead className="border-b-2 border-gray-900 bg-gray-100 font-bold text-gray-800 print:bg-gray-200 print:text-black">
            <tr>
              <th className="px-3 py-2.5 w-10 text-center">S.N.</th>
              <th className="px-3 py-2.5">Medicine Name & Formulation</th>
              <th className="px-3 py-2.5 text-center">Packaging</th>
              <th className="px-3 py-2.5 text-center">Ordered Pack Qty</th>
              <th className="px-3 py-2.5 text-right">Est. Rate/Pack</th>
              <th className="px-3 py-2.5 text-right">Est. Total Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 print:divide-gray-400">
            {items.map((item, idx) => (
              <tr key={item.id || idx} className="hover:bg-gray-50/50">
                <td className="px-3 py-2 text-center font-medium text-gray-600">{idx + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-bold text-gray-950 print:text-black">{item.itemName}</div>
                  {item.genericName && (
                    <div className="text-[11px] text-gray-600 print:text-gray-700">{item.genericName}</div>
                  )}
                  {item.remarks && (
                    <div className="text-[10px] text-gray-500 italic">{item.remarks}</div>
                  )}
                </td>
                <td className="px-3 py-2 text-center text-gray-700">
                  1 {item.packUnit} ({item.packSize} tabs)
                </td>
                <td className="px-3 py-2 text-center font-black text-gray-950 print:text-black text-sm">
                  {item.orderedPackQty} {item.packUnit}
                </td>
                <td className="px-3 py-2 text-right text-gray-700">
                  Rs. {item.estimatedRatePerPack.toFixed(2)}
                </td>
                <td className="px-3 py-2 text-right font-bold text-gray-950 print:text-black">
                  Rs. {item.estimatedTotalAmount.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t-2 border-gray-900 bg-gray-50 font-bold text-gray-900 print:bg-transparent">
            <tr>
              <td colSpan={5} className="px-3 py-2.5 text-right text-gray-800 uppercase tracking-wide">
                Total Estimated Procurement Value:
              </td>
              <td className="px-3 py-2.5 text-right font-black text-gray-950 text-sm">
                Rs. {po.totalEstimatedAmount.toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Amount In Words */}
      <div className="mt-3 rounded-md bg-gray-50 p-2.5 text-[11px] font-medium text-gray-800 print:border print:border-gray-300 print:bg-transparent">
        <strong>In Words:</strong> {words}
      </div>

      {/* Terms & Notes */}
      <div className="mt-4 space-y-1 text-[11px] text-gray-600">
        <p className="font-bold text-gray-800">Procurement & Acceptance Terms:</p>
        <p>1. Supplies must have minimum 18 months expiry remaining from delivery date.</p>
        <p>2. Inward delivery must include manufacturer batch analysis report and original VAT tax invoice.</p>
        <p>3. Damaged, unsealed, or temperature-deviated cold chain items will be returned at supplier cost.</p>
        {po.notes && (
          <p className="mt-1 font-semibold text-blue-900 print:text-black">
            <strong>Distributor Instructions:</strong> {po.notes}
          </p>
        )}
      </div>

      {/* Signatures */}
      <div className="mt-10 flex justify-between pt-4 text-xs text-gray-800 print:mt-16">
        <div className="w-48 border-t-2 border-gray-800 pt-1 text-center">
          <p className="font-bold">Hospital Pharmacist</p>
          <p className="text-[10px] text-gray-600">Prepared & Verified</p>
        </div>
        <div className="w-48 border-t-2 border-gray-800 pt-1 text-center">
          <p className="font-bold">Medical Director / Admin</p>
          <p className="text-[10px] text-gray-600">Authorized Signatory</p>
        </div>
        <div className="w-48 border-t-2 border-gray-800 pt-1 text-center">
          <p className="font-bold">Distributor Receipt</p>
          <p className="text-[10px] text-gray-600">Sign & Stamp</p>
        </div>
      </div>
    </div>
  );
}
export default PharmacyPoPrintSheet;
