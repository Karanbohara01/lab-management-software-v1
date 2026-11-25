import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { CreatePurchaseRequest, PurchaseItemRequest } from './types';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import {
  Plus,
  Truck,
  Trash2,
  FileText,
  Building2,
  Layers,
  Gift,
  Search,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { PharmacyHeader } from './PharmacyHeader';

export function PharmacyPurchasesPage() {
  const t = useT();
  const toast = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data: purchasesPage, loading, refetch } = useQuery(() => pharmacyApi.purchases.list({ size: 50 }), []);
  const { data: wholesalers } = useQuery(() => pharmacyApi.wholesalers.list(), []);
  const { data: itemsPage } = useQuery(() => pharmacyApi.items.list({ size: 300 }), []);

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

  const purchases = purchasesPage?.content ?? [];

  const filteredPurchases = useMemo(() => {
    if (!search.trim()) return purchases;
    const q = search.toLowerCase();
    return purchases.filter(
      (p) =>
        p.purchaseNumber.toLowerCase().includes(q) ||
        p.wholesalerName.toLowerCase().includes(q) ||
        p.wholesalerInvoiceNo.toLowerCase().includes(q)
    );
  }, [purchases, search]);

  // KPI statistics
  const stats = useMemo(() => {
    const totalPurchasesCount = purchases.length;
    const totalAmount = purchases.reduce((acc, p) => acc + p.netTotal, 0);
    const totalSuppliers = new Set(purchases.map((p) => p.wholesalerId)).size;
    return { totalPurchasesCount, totalAmount, totalSuppliers };
  }, [purchases]);

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
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  // Calculate live modal line totals
  const modalCalculations = useMemo(() => {
    let subtotal = 0;
    let totalFreePacks = 0;
    items.forEach((line) => {
      const discountedRate = line.purchaseRatePerPack * (1 - (line.discountPercentage || 0) / 100);
      const lineCost = line.billedPackQty * discountedRate;
      subtotal += lineCost;
      totalFreePacks += line.freePackQty || 0;
    });

    const grandInwardTotal = subtotal + (carrierCharges || 0) + (otherCharges || 0);
    return { subtotal, totalFreePacks, grandInwardTotal };
  }, [items, carrierCharges, otherCharges]);

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
      {/* Shared Pharmacy Sub-Navigation */}
      <PharmacyHeader />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Total Inward Receipts (GRN)')}</span>
            <FileText className="h-4 w-4 text-primary-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">
            {stats.totalPurchasesCount}
          </div>
          <div className="text-[11px] text-muted">{t('Verified inward entries')}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Total Procurement Spend')}</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">
            Rs. {stats.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
            {t('Stock received at purchase rates')}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Active Wholesaler Accounts')}</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{wholesalers?.length || 0}</div>
          <div className="text-[11px] text-muted">{t('DDA authorized distributors')}</div>
        </div>
      </div>

      {/* Main Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('Wholesale Purchases & Inward GRN')}
          description={t(
            'Procure stock from authorized distributors, record bonus/free strips, apportion freight charges, and generate inventory batches automatically.'
          )}
        />
        <Button onClick={openCreateModal} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {t('New Stock Inward Entry (GRN)')}
        </Button>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search by GRN number, wholesaler name, or distributor invoice #...')}
          className="pl-10 text-sm h-10 shadow-xs"
        />
      </div>

      {/* Inward Purchases Table */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border/80 bg-surface-muted/60 text-xs font-bold uppercase text-muted">
              <tr>
                <th className="px-4 py-3.5">{t('GRN / PO Number')}</th>
                <th className="px-4 py-3.5">{t('Wholesaler / Supplier')}</th>
                <th className="px-4 py-3.5">{t('Distributor Invoice #')}</th>
                <th className="px-4 py-3.5">{t('Invoice Date')}</th>
                <th className="px-4 py-3.5">{t('Freight / Carrier')}</th>
                <th className="px-4 py-3.5">{t('Items Received')}</th>
                <th className="px-4 py-3.5 text-right">{t('Total Inward Amount')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && !purchasesPage ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    <p className="mt-2 text-sm">{t('Loading inward stock records...')}</p>
                  </td>
                </tr>
              ) : filteredPurchases.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted">
                    <Truck className="mx-auto h-8 w-8 text-muted/50 mb-2" />
                    <p className="font-semibold text-foreground">{t('No purchase records found.')}</p>
                    <p className="text-xs">{t('Click "New Stock Inward Entry" to receive supplier delivery.')}</p>
                  </td>
                </tr>
              ) : (
                filteredPurchases.map((p) => (
                  <tr key={p.id} className="hover:bg-surface-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-foreground">{p.purchaseNumber}</div>
                      <span className="text-[10px] text-muted">{p.receivedDate || p.invoiceDate}</span>
                    </td>

                    <td className="px-4 py-3">
                      <div className="font-semibold text-foreground">{p.wholesalerName}</div>
                      <div className="text-[11px] text-muted">DDA Distributor</div>
                    </td>

                    <td className="px-4 py-3 font-mono text-xs text-muted">
                      {p.wholesalerInvoiceNo}
                    </td>

                    <td className="px-4 py-3 text-xs text-muted">
                      {p.invoiceDate}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {p.carrierCharges > 0 ? (
                        <span className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400">
                          <Truck className="h-3 w-3" />
                          Rs. {p.carrierCharges.toFixed(2)}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <span className="rounded bg-surface-muted px-2 py-0.5 font-bold text-foreground">
                        {p.itemCount} {t('batches')}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="font-extrabold text-foreground text-sm">
                        Rs. {p.netTotal.toFixed(2)}
                      </div>
                      <span className="text-[10px] text-emerald-600 font-semibold">Stock Inward Verified</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Inward Modal */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={t('New Purchase Stock Inward (GRN)')}
          description={t(
            'Record supplier invoice, track bonus/free strips, apportion freight charges, and generate inventory batches.'
          )}
          size="xl"
        >
          <form onSubmit={handleSubmit} className="space-y-4 p-2 text-xs max-h-[80vh] overflow-y-auto pr-1">
            {/* Wholesaler & Invoice Header */}
            <div className="rounded-lg border border-border p-3 bg-surface-muted/20 space-y-3">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-primary-600" />
                {t('1. Distributor & Invoice Information')}
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Wholesaler / Distributor *')}
                  </label>
                  <select
                    value={wholesalerId}
                    onChange={(e) => setWholesalerId(parseInt(e.target.value) || 0)}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
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
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Distributor Invoice # *')}
                  </label>
                  <Input
                    required
                    value={wholesalerInvoiceNo}
                    onChange={(e) => setWholesalerInvoiceNo(e.target.value)}
                    placeholder="e.g. INV-2081/098"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Invoice Date *')}
                  </label>
                  <Input
                    type="date"
                    required
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="text-xs"
                  />
                </div>
              </div>

              {/* Carrier Freight and Other Charges */}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 pt-1 border-t border-border/60">
                <div>
                  <label className="font-semibold text-foreground flex items-center gap-1 mb-1">
                    <Truck className="h-3 w-3 text-primary-600" />
                    {t('Carrier / Freight / Transport Charges (Rs.)')}
                  </label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={carrierCharges}
                    onChange={(e) => setCarrierCharges(parseFloat(e.target.value) || 0)}
                    placeholder="0.00"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Inward Notes / Courier Details')}
                  </label>
                  <Input
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. Received via Sagarmatha Transport, 2 Cartons"
                    className="text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-lg border border-border p-3 space-y-3 bg-surface-muted/20">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary-600" />
                  {t('2. Medicines & Batches Received')}
                </h4>
                <Button type="button" size="sm" variant="secondary" onClick={addLineItem} className="h-7 text-xs">
                  <Plus className="mr-1 h-3.5 w-3.5" />
                  {t('Add Medicine Line')}
                </Button>
              </div>

              <div className="space-y-3">
                {items.map((line, idx) => {
                  const selectedMedicine = itemsPage?.content?.find((i) => i.id === line.itemId);
                  const packSize = selectedMedicine?.packSize || 10;
                  const packUnit = selectedMedicine?.packUnit || 'STRIP';
                  const dispensingUnit = selectedMedicine?.dispensingUnit || 'TAB';

                  const totalPacksReceived = (line.billedPackQty || 0) + (line.freePackQty || 0);
                  const totalUnitsReceived = totalPacksReceived * packSize;
                  const lineCost = line.billedPackQty * line.purchaseRatePerPack * (1 - (line.discountPercentage || 0) / 100);
                  const effectiveUnitCost = totalUnitsReceived > 0 ? lineCost / totalUnitsReceived : 0;

                  return (
                    <div
                      key={idx}
                      className="rounded-lg border border-border bg-surface p-3 shadow-2xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary-100 text-[10px] font-bold text-primary-700 dark:bg-primary-950 dark:text-primary-300">
                            {idx + 1}
                          </span>
                          <select
                            value={line.itemId}
                            onChange={(e) => updateItemLine(idx, { itemId: parseInt(e.target.value) || 0 })}
                            className="w-full max-w-sm rounded border border-border bg-surface px-2 py-1 text-xs font-semibold text-foreground focus:outline-none"
                            required
                          >
                            {itemsPage?.content?.map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name} ({item.genericName || item.category})
                              </option>
                            ))}
                          </select>
                          <span className="text-[11px] text-muted">
                            1 {packUnit} = {packSize} {dispensingUnit}s
                          </span>
                        </div>

                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeLineItem(idx)}
                            className="text-muted hover:text-danger p-1 transition"
                            title={t('Remove Line')}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 sm:grid-cols-6">
                        <div>
                          <label className="text-[10px] font-semibold text-muted block">
                            {t('Batch # *')}
                          </label>
                          <Input
                            required
                            value={line.batchNumber}
                            onChange={(e) =>
                              updateItemLine(idx, { batchNumber: e.target.value.toUpperCase() })
                            }
                            placeholder="e.g. B982"
                            className="text-xs uppercase font-mono h-7"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-muted block">
                            {t('Expiry Date *')}
                          </label>
                          <Input
                            type="date"
                            required
                            value={line.expiryDate}
                            onChange={(e) => updateItemLine(idx, { expiryDate: e.target.value })}
                            className="text-xs h-7"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-muted block">
                            {t('Billed Packs *')}
                          </label>
                          <Input
                            type="number"
                            min="1"
                            required
                            value={line.billedPackQty}
                            onChange={(e) =>
                              updateItemLine(idx, { billedPackQty: parseInt(e.target.value) || 1 })
                            }
                            className="text-xs h-7"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-muted flex items-center gap-1">
                            <Gift className="h-3 w-3 text-emerald-600" />
                            {t('Bonus/Free')}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            value={line.freePackQty}
                            onChange={(e) =>
                              updateItemLine(idx, { freePackQty: parseInt(e.target.value) || 0 })
                            }
                            placeholder="0"
                            className="text-xs h-7"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-muted block">
                            {t('Rate/Pack (Rs.)')}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={line.purchaseRatePerPack}
                            onChange={(e) =>
                              updateItemLine(idx, { purchaseRatePerPack: parseFloat(e.target.value) || 0 })
                            }
                            className="text-xs h-7"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-semibold text-muted block">
                            {t('Selling MRP')}
                          </label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            required
                            value={line.mrpPerPack}
                            onChange={(e) =>
                              updateItemLine(idx, { mrpPerPack: parseFloat(e.target.value) || 0 })
                            }
                            className="text-xs h-7"
                          />
                        </div>
                      </div>

                      {/* Live Cost & Quantity preview */}
                      <div className="flex flex-wrap items-center justify-between border-t border-border/40 pt-1.5 text-[11px]">
                        <div className="flex items-center gap-2">
                          <span className="text-muted">
                            Total Received: <strong>{totalPacksReceived} Packs</strong> ({totalUnitsReceived} {dispensingUnit}s)
                          </span>
                          <span className="rounded bg-emerald-50 px-2 py-0.5 font-bold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                            Effective Cost: Rs. {effectiveUnitCost.toFixed(2)} / {dispensingUnit}
                          </span>
                        </div>

                        <div className="font-bold text-foreground">
                          Line Cost: Rs. {lineCost.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Inward Summary */}
            <div className="rounded-lg border border-border p-3 bg-surface space-y-1.5 text-xs">
              <div className="flex justify-between text-muted">
                <span>{t('Medicines Net Subtotal:')}</span>
                <span>Rs. {modalCalculations.subtotal.toFixed(2)}</span>
              </div>

              {modalCalculations.totalFreePacks > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>{t('Bonus / Free Stock Inward:')}</span>
                  <span>+ {modalCalculations.totalFreePacks} Packs Free</span>
                </div>
              )}

              {carrierCharges > 0 && (
                <div className="flex justify-between text-blue-600 font-semibold">
                  <span>{t('Freight & Transport Charges:')}</span>
                  <span>+ Rs. {carrierCharges.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black text-foreground border-t border-border pt-2">
                <span>{t('Total Inward Purchase Value:')}</span>
                <span className="text-primary-600 dark:text-primary-400">
                  Rs. {modalCalculations.grandInwardTotal.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                {t('Verify & Inward Stock to Inventory')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PharmacyPurchasesPage;
