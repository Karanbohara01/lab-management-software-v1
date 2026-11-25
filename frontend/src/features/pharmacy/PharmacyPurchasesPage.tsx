import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { CreatePurchaseRequest, PurchaseItemRequest } from './types';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { Plus, Truck, Trash2 } from 'lucide-react';

export function PharmacyPurchasesPage() {
  const t = useT();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { data: purchasesPage, loading, refetch } = useQuery(() => pharmacyApi.purchases.list({ size: 50 }), []);
  const { data: wholesalers } = useQuery(() => pharmacyApi.wholesalers.list(), []);
  const { data: itemsPage } = useQuery(() => pharmacyApi.items.list({ size: 200 }), []);

  const [wholesalerId, setWholesalerId] = useState<number>(0);
  const [wholesalerInvoiceNo, setWholesalerInvoiceNo] = useState('');
  const [invoiceDate, setInvoiceDate] = useState<string>(() => new Date().toISOString().split('T')[0] ?? '');
  const [carrierCharges, setCarrierCharges] = useState<number>(0);
  const [otherCharges, setOtherCharges] = useState<number>(0);
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<PurchaseItemRequest[]>([
    {
      itemId: 0,
      batchNumber: '',
      expiryDate: '',
      billedPackQty: 10,
      freePackQty: 0,
      purchaseRatePerPack: 100,
      discountPercentage: 0,
      mrpPerPack: 150,
      wholesaleRatePerPack: 120,
    },
  ]);

  const openCreateModal = () => {
    if (wholesalers && wholesalers.length > 0 && wholesalers[0]) {
      setWholesalerId(wholesalers[0].id);
    }
    setWholesalerInvoiceNo('');
    setCarrierCharges(0);
    setOtherCharges(0);
    setNotes('');
    const firstItemId = itemsPage?.content?.[0]?.id ?? 0;
    setItems([
      {
        itemId: firstItemId,
        batchNumber: '',
        expiryDate: '',
        billedPackQty: 10,
        freePackQty: 0,
        purchaseRatePerPack: 100,
        discountPercentage: 0,
        mrpPerPack: 150,
        wholesaleRatePerPack: 120,
      },
    ]);
    setIsModalOpen(true);
  };

  const addLineItem = () => {
    const firstItemId = itemsPage?.content?.[0]?.id ?? 0;
    setItems((prev) => [
      ...prev,
      {
        itemId: firstItemId,
        batchNumber: '',
        expiryDate: '',
        billedPackQty: 10,
        freePackQty: 0,
        purchaseRatePerPack: 100,
        discountPercentage: 0,
        mrpPerPack: 150,
        wholesaleRatePerPack: 120,
      },
    ]);
  };

  const updateItemLine = (idx: number, updates: Partial<PurchaseItemRequest>) => {
    setItems((prev) => prev.map((item, i) => (i === idx ? { ...item, ...updates } : item)));
  };

  const removeLineItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wholesalerId) {
      toast.error(t('Please select a wholesaler / distributor'));
      return;
    }
    if (!wholesalerInvoiceNo.trim()) {
      toast.error(t('Wholesaler invoice number is required'));
      return;
    }
    for (const line of items) {
      if (!line.itemId || !line.batchNumber.trim() || !line.expiryDate) {
        toast.error(t('Please fill medicine, batch number, and expiry date for all line items'));
        return;
      }
    }

    try {
      const payload: CreatePurchaseRequest = {
        wholesalerId,
        wholesalerInvoiceNo: wholesalerInvoiceNo.trim(),
        invoiceDate,
        carrierCharges: carrierCharges || 0,
        otherCharges: otherCharges || 0,
        notes,
        items,
      };

      await pharmacyApi.purchases.create(payload);
      toast.success(t('Inward stock receipt created and batches added to inventory!'));
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to save purchase'));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Wholesale Purchases & Stock Inward (GRN)')}
        description={t('MediPro/MIDAS style inward stock receipt: track bonus/free strips, carrier freight charges, wholesaler invoice verification, and automatic batch generation.')}
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t('New Stock Inward Entry (GRN)')}
          </Button>
        }
      />

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="border-b bg-gray-50 text-xs font-bold uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3">PO Number</th>
              <th className="px-4 py-3">Wholesaler / Supplier</th>
              <th className="px-4 py-3">Distributor Invoice #</th>
              <th className="px-4 py-3">Invoice Date</th>
              <th className="px-4 py-3">Carrier Charges</th>
              <th className="px-4 py-3">Items Count</th>
              <th className="px-4 py-3 text-right">Net Bill Amount</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && !purchasesPage ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  {t('Loading inward purchases...')}
                </td>
              </tr>
            ) : purchasesPage?.content.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-gray-400">
                  {t('No purchase records found.')}
                </td>
              </tr>
            ) : (
              purchasesPage?.content.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3 font-bold font-mono text-gray-900 dark:text-gray-100">
                    {p.purchaseNumber}
                  </td>
                  <td className="px-4 py-3 font-semibold text-gray-800 dark:text-gray-200">
                    {p.wholesalerName}
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">
                    {p.wholesalerInvoiceNo}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500">
                    {p.invoiceDate}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {p.carrierCharges > 0 ? `Rs. ${p.carrierCharges.toFixed(2)}` : '—'}
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="rounded bg-gray-100 px-2 py-0.5 font-bold text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {p.itemCount} {t('lines')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-extrabold text-primary-600 dark:text-primary-400">
                    Rs. {p.netTotal.toFixed(2)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* New Inward Modal */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t('New Purchase Stock Inward (GRN)')}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-sm max-h-[80vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('Wholesaler / Distributor *')}
                </label>
                <select
                  value={wholesalerId}
                  onChange={(e) => setWholesalerId(parseInt(e.target.value) || 0)}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                  required
                >
                  {wholesalers?.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name} {w.panVatNumber ? `(PAN: ${w.panVatNumber})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('Distributor Invoice # *')}
                </label>
                <Input
                  required
                  value={wholesalerInvoiceNo}
                  onChange={(e) => setWholesalerInvoiceNo(e.target.value)}
                  placeholder="e.g. INV-98214"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                  {t('Invoice Date *')}
                </label>
                <Input
                  type="date"
                  required
                  value={invoiceDate}
                  onChange={(e) => setInvoiceDate(e.target.value)}
                />
              </div>
            </div>

            {/* Carrier & Handling Charges */}
            <div className="grid grid-cols-2 gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-3 dark:border-blue-900/50 dark:bg-blue-950/20">
              <div>
                <label className="flex items-center gap-1 text-xs font-semibold text-blue-800 dark:text-blue-300">
                  <Truck className="h-3.5 w-3.5" />
                  {t('Carrier / Freight / Transport Charges (Rs.)')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={carrierCharges}
                  onChange={(e) => setCarrierCharges(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
                <span className="text-[10px] text-gray-400">Allocated across items to compute true landed cost</span>
              </div>
              <div>
                <label className="text-xs font-semibold text-blue-800 dark:text-blue-300">
                  {t('Other Delivery / Unloading Charges (Rs.)')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={otherCharges}
                  onChange={(e) => setOtherCharges(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="space-y-2 border-t pt-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-800 dark:text-gray-200">
                  {t('Medicines & Batches Inward')}
                </span>
                <Button type="button" size="sm" variant="secondary" onClick={addLineItem}>
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t('Add Item Line')}
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((line, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 space-y-2 dark:border-gray-700 dark:bg-gray-900"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primary-600">Line #{idx + 1}</span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLineItem(idx)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      <div className="col-span-2">
                        <label className="text-[11px] font-semibold text-gray-600">Medicine</label>
                        <select
                          value={line.itemId}
                          onChange={(e) => updateItemLine(idx, { itemId: parseInt(e.target.value) || 0 })}
                          className="w-full rounded border border-gray-300 bg-white p-1.5 text-xs dark:border-gray-700 dark:bg-gray-800"
                          required
                        >
                          {itemsPage?.content.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} ({item.dosageForm} - 1 {item.packUnit} = {item.packSize} {item.dispensingUnit}s)
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600">Batch Number *</label>
                        <Input
                          required
                          className="py-1 text-xs"
                          value={line.batchNumber}
                          onChange={(e) => updateItemLine(idx, { batchNumber: e.target.value.toUpperCase() })}
                          placeholder="e.g. AZ-99"
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600">Expiry Date *</label>
                        <Input
                          type="date"
                          required
                          className="py-1 text-xs"
                          value={line.expiryDate}
                          onChange={(e) => updateItemLine(idx, { expiryDate: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-5 gap-2">
                      <div>
                        <label className="text-[11px] font-semibold text-gray-600">Billed Packs *</label>
                        <Input
                          type="number"
                          min="1"
                          className="py-1 text-xs font-bold"
                          value={line.billedPackQty}
                          onChange={(e) => updateItemLine(idx, { billedPackQty: parseInt(e.target.value) || 1 })}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-green-700 dark:text-green-400">
                          Free / Bonus Packs
                        </label>
                        <Input
                          type="number"
                          min="0"
                          className="py-1 text-xs"
                          value={line.freePackQty || 0}
                          onChange={(e) => updateItemLine(idx, { freePackQty: parseInt(e.target.value) || 0 })}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600">Purchase Rate (Rs)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="py-1 text-xs"
                          value={line.purchaseRatePerPack}
                          onChange={(e) => updateItemLine(idx, { purchaseRatePerPack: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600">MRP per Pack (Rs)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="py-1 text-xs"
                          value={line.mrpPerPack}
                          onChange={(e) => updateItemLine(idx, { mrpPerPack: parseFloat(e.target.value) || 0 })}
                        />
                      </div>

                      <div>
                        <label className="text-[11px] font-semibold text-gray-600">Wholesale Rate (Rs)</label>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          className="py-1 text-xs"
                          value={line.wholesaleRatePerPack || 0}
                          onChange={(e) => updateItemLine(idx, { wholesaleRatePerPack: parseFloat(e.target.value) || 0 })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">
                {t('Receive & Post Inward Stock')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
export default PharmacyPurchasesPage;
