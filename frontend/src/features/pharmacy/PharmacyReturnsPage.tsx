import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { SaleReceipt, SaleReturn, PharmacyBatch } from './types';
import { PharmacyHeader } from './PharmacyHeader';
import { PharmacyCreditNotePrint } from './PharmacyCreditNotePrint';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import {
  Search,
  RotateCcw,
  Printer,
  FileText,
  TrendingDown,
  Building,
} from 'lucide-react';

interface ReturnCartLine {
  saleItemId: number;
  itemName: string;
  batchNumber: string;
  expiryDate: string;
  unitType: string;
  dispensedQuantity: number;
  alreadyReturned: number;
  maxReturnable: number;
  returnQuantity: number;
  unitPrice: number;
  isVatApplicable: boolean;
  totalRefund: number;
}

export function PharmacyReturnsPage() {
  const t = useT();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'SALES_RETURN' | 'SUPPLIER_RETURN'>('SALES_RETURN');

  // Customer Return (Sales Return) State
  const [invoiceQuery, setInvoiceQuery] = useState('');
  const [loadedReceipt, setLoadedReceipt] = useState<SaleReceipt | null>(null);
  const [searchingInvoice, setSearchingInvoice] = useState(false);
  const [returnCart, setReturnCart] = useState<ReturnCartLine[]>([]);
  const [refundMethod, setRefundMethod] = useState<'CASH' | 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'IPD_LEDGER'>('CASH');
  const [returnReason, setReturnReason] = useState('Patient Discharged / Excess Prescription');
  const [returnNotes, setReturnNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [creditNoteReceipt, setCreditNoteReceipt] = useState<SaleReturn | null>(null);

  // Wholesaler Debit Note State
  const [wholesalerId, setWholesalerId] = useState<number | ''>('');
  const [supplierBillNo, setSupplierBillNo] = useState('');
  const [supplierReason, setSupplierReason] = useState('Near Expiry Drug Return to Wholesaler');
  const [supplierNotes, setSupplierNotes] = useState('');
  const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
  const [supplierReturnPacks, setSupplierReturnPacks] = useState<number>(1);
  const [supplierReturnItems, setSupplierReturnItems] = useState<
    { batch: PharmacyBatch; returnPacks: number; reason: string }[]
  >([]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_supplierDebitReceipt, setSupplierDebitReceipt] = useState<import('./types').SupplierReturn | null>(null);

  // Fetch Return Logs
  const { data: salesReturnPage, refetch: refetchSaleReturns } = useQuery(
    () => pharmacyApi.returns.listSaleReturns({ size: 15 }),
    []
  );

  const { data: supplierReturnPage, refetch: refetchSupplierReturns } = useQuery(
    () => pharmacyApi.returns.listSupplierReturns({ size: 15 }),
    []
  );

  const { data: wholesalers } = useQuery(() => pharmacyApi.wholesalers.list(), []);
  const { data: batches } = useQuery(() => pharmacyApi.batches.list(), []);

  // Handle Invoice Lookup
  const handleLookupInvoice = async () => {
    if (!invoiceQuery.trim()) {
      toast.error(t('Please enter invoice number'));
      return;
    }

    try {
      setSearchingInvoice(true);
      const sale = await pharmacyApi.dispense.getByInvoice(invoiceQuery.trim());
      setLoadedReceipt(sale);

      // Prepopulate return lines
      const lines: ReturnCartLine[] = sale.items.map((item) => {
        const already = item.returnedQuantity || 0;
        const max = Math.max(0, item.quantity - already);
        return {
          saleItemId: item.id || 0,
          itemName: item.itemName,
          batchNumber: item.batchNumber,
          expiryDate: item.expiryDate,
          unitType: item.unitType,
          dispensedQuantity: item.quantity,
          alreadyReturned: already,
          maxReturnable: max,
          returnQuantity: 0,
          unitPrice: item.unitPrice,
          isVatApplicable: item.isVatApplicable,
          totalRefund: 0,
        };
      });

      setReturnCart(lines);
      toast.success(t('Loaded Invoice #{inv}', { inv: sale.invoiceNumber }));
    } catch (err: unknown) {
      toast.error(t('Invoice not found or failed to load.'));
    } finally {
      setSearchingInvoice(false);
    }
  };

  // Adjust return quantity
  const handleQtyChange = (saleItemId: number, qty: number) => {
    setReturnCart((prev) =>
      prev.map((line) => {
        if (line.saleItemId !== saleItemId) return line;
        const clamped = Math.max(0, Math.min(qty, line.maxReturnable));
        return {
          ...line,
          returnQuantity: clamped,
          totalRefund: clamped * line.unitPrice,
        };
      })
    );
  };

  // Totals for sales return
  const totalReturnUnits = returnCart.reduce((acc, c) => acc + c.returnQuantity, 0);
  const totalRefundAmount = returnCart.reduce((acc, c) => acc + c.totalRefund, 0);

  // Submit Sales Return
  const handleSubmitSaleReturn = async () => {
    if (!loadedReceipt) return;
    const itemsToReturn = returnCart.filter((c) => c.returnQuantity > 0);

    if (itemsToReturn.length === 0) {
      toast.error(t('Please specify at least one item quantity to return'));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await pharmacyApi.returns.createSaleReturn({
        saleId: loadedReceipt.id,
        refundMethod,
        returnReason,
        notes: returnNotes,
        items: itemsToReturn.map((i) => ({
          saleItemId: i.saleItemId,
          returnQuantity: i.returnQuantity,
        })),
      });

      setCreditNoteReceipt(res);
      toast.success(t('Credit Note {num} generated and stock restored!', { num: res.creditNoteNumber }));
      setLoadedReceipt(null);
      setReturnCart([]);
      setInvoiceQuery('');
      refetchSaleReturns();
    } catch (err: unknown) {
      toast.error(t('Failed to process sales return.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add batch to supplier debit note
  const handleAddSupplierBatch = () => {
    if (!selectedBatchId || supplierReturnPacks <= 0) {
      toast.error(t('Please select a batch and valid quantity'));
      return;
    }
    const batch = batches?.find((b) => b.id === Number(selectedBatchId));
    if (!batch) return;

    if (supplierReturnPacks > batch.remainingPacks) {
      toast.error(t('Return packs exceed available batch stock ({stock} packs)', { stock: batch.remainingPacks }));
      return;
    }

    if (supplierReturnItems.some((s) => s.batch.id === batch.id)) {
      toast.error(t('Batch already added to return list'));
      return;
    }

    setSupplierReturnItems((prev) => [
      ...prev,
      { batch, returnPacks: supplierReturnPacks, reason: supplierReason },
    ]);
    setSelectedBatchId('');
    setSupplierReturnPacks(1);
  };

  // Submit Supplier Debit Note
  const handleSubmitSupplierReturn = async () => {
    if (!wholesalerId || supplierReturnItems.length === 0) {
      toast.error(t('Select distributor and at least one batch item'));
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await pharmacyApi.returns.createSupplierReturn({
        wholesalerId: Number(wholesalerId),
        originalBillNumber: supplierBillNo,
        returnReason: supplierReason,
        notes: supplierNotes,
        items: supplierReturnItems.map((item) => ({
          batchId: item.batch.id,
          returnPacks: item.returnPacks,
        })),
      });

      setSupplierDebitReceipt(res);
      toast.success(t('Debit Note {num} recorded successfully!', { num: res.debitNoteNumber }));
      setSupplierReturnItems([]);
      setWholesalerId('');
      setSupplierBillNo('');
      refetchSupplierReturns();
    } catch (err: unknown) {
      toast.error(t('Failed to create supplier debit note.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PharmacyHeader />

      {/* Hero Banner & KPI Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface p-5 shadow-xs" data-print-hide>
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
            <RotateCcw className="h-6 w-6 text-red-500" />
            {t('Returns & IRD Credit Notes (फिर्ता बिल)')}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t('Hospital pharmacy inventory reconciliation, Anusuchi-7 VAT credit adjustments, and wholesaler debit notes.')}
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex rounded-lg border border-border bg-gray-100 p-1 dark:bg-gray-800">
          <button
            onClick={() => setActiveTab('SALES_RETURN')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition ${
              activeTab === 'SALES_RETURN'
                ? 'bg-white text-red-600 shadow-sm dark:bg-gray-900 dark:text-red-400'
                : 'text-gray-600 hover:text-foreground dark:text-gray-400'
            }`}
          >
            <FileText className="h-4 w-4" />
            {t('Customer Credit Note (Sales Return)')}
          </button>
          <button
            onClick={() => setActiveTab('SUPPLIER_RETURN')}
            className={`flex items-center gap-2 rounded-md px-4 py-2 text-xs font-bold transition ${
              activeTab === 'SUPPLIER_RETURN'
                ? 'bg-white text-blue-600 shadow-sm dark:bg-gray-900 dark:text-blue-400'
                : 'text-gray-600 hover:text-foreground dark:text-gray-400'
            }`}
          >
            <Building className="h-4 w-4" />
            {t('Wholesaler Debit Note (Drug Return)')}
          </button>
        </div>
      </div>

      {activeTab === 'SALES_RETURN' ? (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-print-hide>
          {/* Left Column: Invoice Lookup & Return Table */}
          <div className="space-y-6 lg:col-span-8">
            {/* Invoice Finder Card */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs">
              <h3 className="text-sm font-bold text-foreground mb-3 flex items-center gap-2">
                <Search className="h-4 w-4 text-primary-500" />
                {t('1. Lookup Original Dispense Invoice')}
              </h3>
              <div className="flex gap-2">
                <Input
                  placeholder={t('Enter Invoice Number (e.g. PH-20261125-0001)')}
                  value={invoiceQuery}
                  onChange={(e) => setInvoiceQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupInvoice()}
                  className="flex-1 font-mono uppercase"
                />
                <Button onClick={handleLookupInvoice} loading={searchingInvoice}>
                  <Search className="mr-2 h-4 w-4" />
                  {t('Find Invoice')}
                </Button>
              </div>

              {loadedReceipt && (
                <div className="mt-4 rounded-lg bg-gray-50 p-4 border border-border text-xs dark:bg-gray-900/50">
                  <div className="flex flex-wrap justify-between gap-2 border-b border-border pb-2">
                    <div>
                      <span className="text-muted">{t('Customer')}: </span>
                      <strong className="text-foreground">{loadedReceipt.customerName}</strong>
                      {loadedReceipt.customerPhone && <span className="text-muted"> ({loadedReceipt.customerPhone})</span>}
                    </div>
                    <div>
                      <span className="text-muted">{t('Original Total')}: </span>
                      <strong className="text-foreground">Rs. {loadedReceipt.netTotal.toFixed(2)}</strong>
                    </div>
                    <div>
                      <span className="text-muted">{t('Status')}: </span>
                      <Badge tone={loadedReceipt.returnStatus === 'FULL' ? 'danger' : loadedReceipt.returnStatus === 'PARTIAL' ? 'warning' : 'success'}>
                        {loadedReceipt.returnStatus || 'ACTIVE'}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Returnable Items Table */}
            {loadedReceipt && (
              <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-foreground">
                    {t('2. Select Quantities to Restore & Refund')}
                  </h3>
                  <span className="text-xs text-muted">
                    {t('Returned drugs immediately return to active batch stock')}
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-border bg-gray-50/50 text-muted dark:bg-gray-800/50">
                        <th className="py-2.5 px-3">{t('Item / Batch')}</th>
                        <th className="py-2.5 px-3 text-center">{t('Dispensed')}</th>
                        <th className="py-2.5 px-3 text-center">{t('Already Returned')}</th>
                        <th className="py-2.5 px-3 text-center">{t('Unit Price')}</th>
                        <th className="py-2.5 px-3 text-center w-36">{t('Qty to Return')}</th>
                        <th className="py-2.5 px-3 text-right">{t('Line Refund')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {returnCart.map((line) => (
                        <tr key={line.saleItemId} className={line.returnQuantity > 0 ? 'bg-red-50/30 dark:bg-red-950/10' : ''}>
                          <td className="py-3 px-3">
                            <div className="font-bold text-foreground">{line.itemName}</div>
                            <div className="text-[10px] text-muted">
                              Batch: {line.batchNumber} · Exp: {line.expiryDate}
                            </div>
                          </td>
                          <td className="py-3 px-3 text-center text-muted">
                            {line.dispensedQuantity} {line.unitType}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {line.alreadyReturned > 0 ? (
                              <Badge tone="warning">{line.alreadyReturned} {line.unitType}</Badge>
                            ) : (
                              '0'
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            Rs. {line.unitPrice.toFixed(2)}
                          </td>
                          <td className="py-3 px-3">
                            {line.maxReturnable > 0 ? (
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="secondary"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleQtyChange(line.saleItemId, line.returnQuantity - 1)}
                                  disabled={line.returnQuantity <= 0}
                                >
                                  -
                                </Button>
                                <Input
                                  type="number"
                                  min={0}
                                  max={line.maxReturnable}
                                  value={line.returnQuantity}
                                  onChange={(e) => handleQtyChange(line.saleItemId, parseInt(e.target.value) || 0)}
                                  className="h-7 w-14 text-center p-1 text-xs font-bold"
                                />
                                <Button
                                  variant="secondary"
                                  className="h-7 w-7 p-0"
                                  onClick={() => handleQtyChange(line.saleItemId, line.returnQuantity + 1)}
                                  disabled={line.returnQuantity >= line.maxReturnable}
                                >
                                  +
                                </Button>
                              </div>
                            ) : (
                              <span className="text-center block text-muted italic">{t('Fully Returned')}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right font-extrabold text-red-600">
                            Rs. {line.totalRefund.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Recent Sales Return Audit Log */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted" />
                {t('Recent Credit Notes (फिर्ता बिल सूची)')}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50 text-muted dark:bg-gray-800/50">
                      <th className="py-2 px-3">{t('Credit Note')}</th>
                      <th className="py-2 px-3">{t('Ref Invoice')}</th>
                      <th className="py-2 px-3">{t('Customer')}</th>
                      <th className="py-2 px-3">{t('Refund Mode')}</th>
                      <th className="py-2 px-3 text-right">{t('Refund Total')}</th>
                      <th className="py-2 px-3 text-right">{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {salesReturnPage?.content && salesReturnPage.content.length > 0 ? (
                      salesReturnPage.content.map((cn) => (
                        <tr key={cn.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50">
                          <td className="py-2.5 px-3 font-mono font-bold text-red-600">{cn.creditNoteNumber}</td>
                          <td className="py-2.5 px-3 font-mono text-muted">{cn.originalInvoiceNumber}</td>
                          <td className="py-2.5 px-3 font-medium">{cn.customerName}</td>
                          <td className="py-2.5 px-3">
                            <Badge tone="neutral">{cn.refundMethod}</Badge>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-red-600">
                            Rs. {cn.netRefundAmount.toFixed(2)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <Button
                              variant="secondary"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => setCreditNoteReceipt(cn)}
                            >
                              <Printer className="mr-1 h-3 w-3" />
                              {t('Print')}
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-muted">
                          {t('No customer credit notes recorded yet.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Column: Refund Checkout Summary */}
          <div className="space-y-6 lg:col-span-4">
            <div className="sticky top-20 rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-2">
                {t('3. Credit Note Details')}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted block mb-1 font-semibold">{t('Refund Payout Method')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs font-semibold"
                    value={refundMethod}
                    onChange={(e: any) => setRefundMethod(e.target.value)}
                  >
                    <option value="CASH">Cash Refund (नगद फिर्ता)</option>
                    <option value="ORIGINAL_PAYMENT">Original Payment Reversal</option>
                    <option value="STORE_CREDIT">Store Pharmacy Credit</option>
                    <option value="IPD_LEDGER">Adjust to Patient IPD Ledger</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1 font-semibold">{t('Reason for Return')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                  >
                    <option value="Patient Discharged / Excess Prescription">Patient Discharged / Excess Prescription</option>
                    <option value="Doctor Changed Prescription">Doctor Changed Prescription</option>
                    <option value="Adverse Drug Reaction / Discontinued">Adverse Drug Reaction / Discontinued</option>
                    <option value="Dispensing Error / Incorrect Drug">Dispensing Error / Incorrect Drug</option>
                    <option value="Defective / Damaged Packaging">Defective / Damaged Packaging</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1 font-semibold">{t('Clinical Notes')}</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    placeholder={t('Enter optional remarks or authorization details')}
                    value={returnNotes}
                    onChange={(e) => setReturnNotes(e.target.value)}
                  />
                </div>
              </div>

              {/* Financial Refund Breakdown */}
              <div className="space-y-2 border-t border-border pt-4 text-xs">
                <div className="flex justify-between text-muted">
                  <span>{t('Total Units Returning')}:</span>
                  <span className="font-semibold text-foreground">{totalReturnUnits}</span>
                </div>
                <div className="flex justify-between text-muted">
                  <span>{t('Subtotal Refund')}:</span>
                  <span className="font-semibold text-foreground">Rs. {totalRefundAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 text-base font-extrabold text-red-600">
                  <span>{t('Net Refund Amount')}:</span>
                  <span>Rs. {totalRefundAmount.toFixed(2)}</span>
                </div>
              </div>

              <Button
                variant="danger"
                className="w-full py-3 text-sm font-extrabold shadow-md"
                disabled={!loadedReceipt || totalReturnUnits <= 0 || isSubmitting}
                onClick={handleSubmitSaleReturn}
              >
                <RotateCcw className="mr-2 h-4 w-4" />
                {isSubmitting ? t('Processing Return...') : t('Issue Credit Note & Restock')}
              </Button>
            </div>
          </div>
        </div>
      ) : (
        /* Wholesaler Debit Note / Supplier Return Tab */
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12" data-print-hide>
          <div className="space-y-6 lg:col-span-8">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <Building className="h-4 w-4 text-blue-500" />
                {t('Wholesaler Return & Debit Note Details')}
              </h3>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-muted block mb-1 text-xs font-semibold">{t('Select Wholesaler / Distributor')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    value={wholesalerId}
                    onChange={(e) => setWholesalerId(e.target.value ? Number(e.target.value) : '')}
                  >
                    <option value="">{t('-- Choose Distributor --')}</option>
                    {wholesalers?.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} (PAN: {w.panVatNumber || 'N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1 text-xs font-semibold">{t('Original Supplier Invoice / GRN Ref')}</label>
                  <Input
                    placeholder="e.g. GRN-2026-089 or INV-9912"
                    value={supplierBillNo}
                    onChange={(e) => setSupplierBillNo(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Add Batch to Return Form */}
              <div className="rounded-lg border border-dashed border-border bg-gray-50/50 p-4 space-y-3 dark:bg-gray-800/30">
                <h4 className="text-xs font-bold text-foreground">{t('Add Inventory Batch to Return')}</h4>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
                  <div className="sm:col-span-6">
                    <select
                      className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                      value={selectedBatchId}
                      onChange={(e) => setSelectedBatchId(e.target.value ? Number(e.target.value) : '')}
                    >
                      <option value="">{t('-- Select Stock Batch --')}</option>
                      {batches?.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.itemName} (Batch: {b.batchNumber} | Exp: {b.expiryDate} | Avail: {b.remainingPacks} packs)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      type="number"
                      min={1}
                      placeholder={t('Packs')}
                      value={supplierReturnPacks}
                      onChange={(e) => setSupplierReturnPacks(parseInt(e.target.value) || 1)}
                      className="text-xs"
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Button variant="secondary" className="w-full text-xs" onClick={handleAddSupplierBatch}>
                      {t('Add Batch')}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Selected Batches Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50 text-muted dark:bg-gray-800/50">
                      <th className="py-2 px-3">{t('Item & Batch')}</th>
                      <th className="py-2 px-3 text-center">{t('Return Packs')}</th>
                      <th className="py-2 px-3 text-right">{t('Purchase Cost/Pack')}</th>
                      <th className="py-2 px-3 text-right">{t('Debit Total')}</th>
                      <th className="py-2 px-3 text-right">{t('Action')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {supplierReturnItems.map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-foreground">{item.batch.itemName}</div>
                          <div className="text-[10px] text-muted">
                            Batch: {item.batch.batchNumber} · Exp: {item.batch.expiryDate}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          {item.returnPacks} packs
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          Rs. {item.batch.purchaseRatePerPack.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                          Rs. {(item.returnPacks * item.batch.purchaseRatePerPack).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Button
                            variant="secondary"
                            className="h-6 px-2 text-[10px] text-red-600"
                            onClick={() =>
                              setSupplierReturnItems((prev) => prev.filter((_, i) => i !== idx))
                            }
                          >
                            {t('Remove')}
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {supplierReturnItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-muted">
                          {t('No batches selected for supplier return yet.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Supplier Debit Notes List */}
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <FileText className="h-4 w-4 text-muted" />
                {t('Recent Wholesaler Debit Notes')}
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-border bg-gray-50/50 text-muted dark:bg-gray-800/50">
                      <th className="py-2 px-3">{t('Debit Note')}</th>
                      <th className="py-2 px-3">{t('Distributor')}</th>
                      <th className="py-2 px-3">{t('Reason')}</th>
                      <th className="py-2 px-3 text-right">{t('Debit Amount')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {supplierReturnPage?.content && supplierReturnPage.content.length > 0 ? (
                      supplierReturnPage.content.map((dn) => (
                        <tr key={dn.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-600">{dn.debitNoteNumber}</td>
                          <td className="py-2.5 px-3 font-medium">{dn.wholesalerName}</td>
                          <td className="py-2.5 px-3 text-muted">{dn.returnReason}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-600">
                            Rs. {dn.netRefundAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-muted">
                          {t('No supplier debit notes recorded yet.')}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="space-y-6 lg:col-span-4">
            <div className="rounded-xl border border-border bg-surface p-5 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-foreground border-b border-border pb-2">
                {t('Debit Note Summary')}
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="text-muted block mb-1 font-semibold">{t('Reason for Drug Return')}</label>
                  <select
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    value={supplierReason}
                    onChange={(e) => setSupplierReason(e.target.value)}
                  >
                    <option value="Near Expiry Drug Return to Wholesaler">Near Expiry Drug Return to Wholesaler</option>
                    <option value="Slow Moving / Recall Stock">Slow Moving / Recall Stock</option>
                    <option value="Damaged / Broken Transit Seal">Damaged / Broken Transit Seal</option>
                    <option value="Wrong Drug Supplied by Distributor">Wrong Drug Supplied by Distributor</option>
                  </select>
                </div>

                <div>
                  <label className="text-muted block mb-1 font-semibold">{t('Notes')}</label>
                  <textarea
                    rows={2}
                    className="w-full rounded-md border border-border bg-surface p-2 text-xs"
                    placeholder={t('Optional distributor credit adjustment reference')}
                    value={supplierNotes}
                    onChange={(e) => setSupplierNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex justify-between text-base font-extrabold text-blue-600">
                  <span>{t('Total Debit Claim')}:</span>
                  <span>
                    Rs.{' '}
                    {supplierReturnItems
                      .reduce((acc, c) => acc + c.returnPacks * c.batch.purchaseRatePerPack, 0)
                      .toFixed(2)}
                  </span>
                </div>
              </div>

              <Button
                className="w-full py-3 text-sm font-extrabold shadow-md"
                disabled={!wholesalerId || supplierReturnItems.length === 0 || isSubmitting}
                onClick={handleSubmitSupplierReturn}
              >
                <TrendingDown className="mr-2 h-4 w-4" />
                {isSubmitting ? t('Saving Debit Note...') : t('Issue Wholesaler Debit Note')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Credit Note Print Preview Modal */}
      {creditNoteReceipt && (
        <Modal
          open={true}
          onClose={() => setCreditNoteReceipt(null)}
          title={t('IRD Credit Note #{num}', { num: creditNoteReceipt.creditNoteNumber })}
          size="lg"
        >
          <div className="space-y-4">
            <div className="max-h-[75vh] overflow-y-auto rounded-xl border border-border/80 bg-slate-100 p-6 shadow-inner dark:bg-slate-900/60 scrollbar-thin">
              <PharmacyCreditNotePrint creditNote={creditNoteReceipt} />
            </div>

            <div className="flex gap-3 pt-1" data-print-hide>
              <Button
                variant="secondary"
                className="flex-1 py-2.5 text-sm font-semibold"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Credit Note (अनुसूची-७)')}
              </Button>
              <Button className="flex-1 py-2.5 text-sm font-semibold" onClick={() => setCreditNoteReceipt(null)}>
                {t('Done')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dedicated Printable Receipt for Browser window.print() */}
      {creditNoteReceipt && (
        <div className="hidden print:block">
          <PharmacyCreditNotePrint creditNote={creditNoteReceipt} isPrintDocument={true} />
        </div>
      )}
    </div>
  );
}

export default PharmacyReturnsPage;
