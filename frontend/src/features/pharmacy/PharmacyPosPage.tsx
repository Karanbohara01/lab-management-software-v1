import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { PharmacyItem, SaleReceipt, DispenseItemRequest } from './types';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { Search, ShoppingCart, Trash2, Printer, Pill } from 'lucide-react';

interface CartLine {
  item: PharmacyItem;
  unitType: 'PACK' | 'UNIT';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  dosageInstruction: string;
}

const DOSAGE_PRESETS = [
  '1-0-1 After Food',
  '1-1-1 After Food',
  '1-0-0 Before Food',
  '0-0-1 At Bedtime',
  'SOS (As Needed)',
  'Apply Twice Daily',
];

export function PharmacyPosPage() {
  const t = useT();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const { data: itemsPage, loading, refetch: refetchItems } = useQuery(
    () => pharmacyApi.items.list({ query: search, size: 60 }),
    [search]
  );

  const [cart, setCart] = useState<CartLine[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'QR_FONEPAY' | 'CARD' | 'CREDIT'>('CASH');
  const [refillDays, setRefillDays] = useState<number>(0);
  const [enableRefillReminder, setEnableRefillReminder] = useState(false);
  const [receipt, setReceipt] = useState<SaleReceipt | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filteredItems = useMemo(() => {
    if (!itemsPage?.content) return [];
    if (selectedCategory === 'ALL') return itemsPage.content;
    return itemsPage.content.filter((item) => item.category === selectedCategory);
  }, [itemsPage, selectedCategory]);

  const addToCart = (item: PharmacyItem) => {
    if (item.totalStockUnits <= 0) {
      toast.error(t('Item is out of stock!'));
      return;
    }

    setCart((prev) => {
      const existing = prev.find((c) => c.item.id === item.id);
      if (existing) {
        const nextQty = existing.quantity + 1;
        const lineTotal = nextQty * existing.unitPrice;
        return prev.map((c) => (c.item.id === item.id ? { ...c, quantity: nextQty, totalPrice: lineTotal } : c));
      }

      const unitType: 'PACK' | 'UNIT' = item.packSize > 1 && item.totalStockPacks > 0 ? 'PACK' : 'UNIT';
      const unitPrice = unitType === 'PACK' ? (item.latestMrpPerPack || 0) : (item.latestUnitMrp || 0);

      return [
        ...prev,
        {
          item,
          unitType,
          quantity: 1,
          unitPrice,
          totalPrice: unitPrice,
          dosageInstruction: '1-0-1 After Food',
        },
      ];
    });
  };

  const updateLineUnit = (itemId: number, unitType: 'PACK' | 'UNIT') => {
    setCart((prev) =>
      prev.map((line) => {
        if (line.item.id !== itemId) return line;
        const unitPrice = unitType === 'PACK' ? (line.item.latestMrpPerPack || 0) : (line.item.latestUnitMrp || 0);
        return {
          ...line,
          unitType,
          unitPrice,
          totalPrice: unitPrice * line.quantity,
        };
      })
    );
  };

  const updateLineQty = (itemId: number, qty: number) => {
    if (qty <= 0) return;
    setCart((prev) =>
      prev.map((line) => (line.item.id === itemId ? { ...line, quantity: qty, totalPrice: line.unitPrice * qty } : line))
    );
  };

  const updateLineDosage = (itemId: number, dosage: string) => {
    setCart((prev) => prev.map((line) => (line.item.id === itemId ? { ...line, dosageInstruction: dosage } : line)));
  };

  const removeFromCart = (itemId: number) => {
    setCart((prev) => prev.filter((c) => c.item.id !== itemId));
  };

  const subtotal = useMemo(() => cart.reduce((acc, c) => acc + c.totalPrice, 0), [cart]);

  const vatTotal = useMemo(() => {
    return cart.reduce((acc, c) => {
      if (c.item.isVatApplicable && c.item.vatPercentage > 0) {
        return acc + (c.totalPrice * c.item.vatPercentage) / 100;
      }
      return acc;
    }, 0);
  }, [cart]);

  const grandTotal = subtotal + vatTotal;

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error(t('Cart is empty'));
      return;
    }

    try {
      setIsSubmitting(true);
      const itemsPayload: DispenseItemRequest[] = cart.map((c) => ({
        itemId: c.item.id,
        unitType: c.unitType,
        quantity: c.quantity,
        dosageInstruction: c.dosageInstruction,
      }));

      const res = await pharmacyApi.dispense.checkout({
        saleType: 'RETAIL',
        customerName: customerName || 'Walk-in Customer',
        customerPhone: customerPhone || undefined,
        doctorName: doctorName || undefined,
        paymentMethod,
        paidAmount: grandTotal,
        refillReminderDays: enableRefillReminder && refillDays > 0 ? refillDays : undefined,
        items: itemsPayload,
      });

      setReceipt(res);
      setCart([]);
      toast.success(t('Dispensing complete! Invoice: {inv}', { inv: res.invoiceNumber }));
      refetchItems();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to complete sale'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Pharmacy Counter (POS)')}
        description={t('High-speed dispensing counter: live drug & skincare search, loose tabs conversion, FEFO auto-batching, and receipt printing.')}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Side: Product Catalog (7 Cols) */}
        <div className="space-y-4 lg:col-span-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('Search medicine, generic name, skincare, barcode...')}
                className="pl-9 text-base"
                autoFocus
              />
            </div>
            <div className="flex flex-wrap gap-1">
              {['ALL', 'ALLOPATHIC', 'SKINCARE', 'SURGICAL'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    selectedCategory === cat
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading && !itemsPage ? (
            <div className="p-8 text-center text-gray-500">{t('Loading medicines...')}</div>
          ) : filteredItems.length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-gray-500 dark:border-gray-700">
              {t('No matching medicines found')}
            </div>
          ) : (
            <div className="grid max-h-[600px] grid-cols-1 gap-3 overflow-y-auto sm:grid-cols-2">
              {filteredItems.map((item) => {
                const outOfStock = item.totalStockUnits <= 0;
                return (
                  <div
                    key={item.id}
                    onClick={() => !outOfStock && addToCart(item)}
                    className={`flex flex-col justify-between rounded-xl border p-3 shadow-sm transition ${
                      outOfStock
                        ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900'
                        : 'cursor-pointer border-gray-200 bg-white hover:border-primary-400 hover:shadow-md dark:border-gray-700 dark:bg-gray-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{item.name}</span>
                        {item.isVatApplicable && (
                          <Badge tone="warning">
                            13% VAT
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 line-clamp-1">{item.genericName || item.manufacturer}</div>
                      <div className="mt-1 flex items-center gap-2 text-xs">
                        <span className="rounded bg-gray-100 px-1.5 py-0.5 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                          {item.dosageForm}
                        </span>
                        {item.rackLocation && (
                          <span className="text-gray-400">📍 {item.rackLocation}</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between border-t pt-2 dark:border-gray-700">
                      <div>
                        <div className="text-sm font-bold text-primary-600 dark:text-primary-400">
                          Rs. {item.latestMrpPerPack.toFixed(2)}
                          <span className="text-[11px] font-normal text-gray-400">/{item.packUnit}</span>
                        </div>
                        {item.packSize > 1 && (
                          <div className="text-[11px] text-gray-500">
                            (Rs. {item.latestUnitMrp.toFixed(2)} / {item.dispensingUnit})
                          </div>
                        )}
                      </div>

                      <div className="text-right">
                        <span
                          className={`text-xs font-semibold ${
                            outOfStock ? 'text-red-500' : 'text-green-600 dark:text-green-400'
                          }`}
                        >
                          {outOfStock
                            ? t('Out of Stock')
                            : `${item.totalStockPacks} ${item.packUnit}s (${item.totalStockUnits} ${item.dispensingUnit}s)`}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Dispensing Counter Cart (5 Cols) */}
        <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-5">
          <div className="flex items-center justify-between border-b pb-3 dark:border-gray-700">
            <div className="flex items-center gap-2 font-bold text-gray-900 dark:text-gray-100">
              <ShoppingCart className="h-5 w-5 text-primary-600" />
              <span>{t('Patient Bill')}</span>
              <span className="rounded-full bg-primary-100 px-2 py-0.5 text-xs text-primary-700 dark:bg-primary-900 dark:text-primary-300">
                {cart.length} {t('items')}
              </span>
            </div>
            {cart.length > 0 && (
              <button
                onClick={() => setCart([])}
                className="text-xs text-red-500 hover:underline"
              >
                {t('Clear all')}
              </button>
            )}
          </div>

          {/* Customer / Patient details */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-gray-500">{t('Customer / Patient')}</label>
              <Input
                className="py-1 text-xs"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Patient Name"
              />
            </div>
            <div>
              <label className="text-gray-500">{t('Mobile No.')}</label>
              <Input
                className="py-1 text-xs"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="98XXXXXXXX"
              />
            </div>
          </div>

          {/* Cart item rows */}
          <div className="max-h-[280px] space-y-2 overflow-y-auto pr-1">
            {cart.length === 0 ? (
              <div className="py-12 text-center text-sm text-gray-400">
                <Pill className="mx-auto mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
                {t('Click medicines on the left to add to bill')}
              </div>
            ) : (
              cart.map((line) => (
                <div
                  key={line.item.id}
                  className="rounded-lg border border-gray-100 bg-gray-50 p-2.5 dark:border-gray-700 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-semibold text-gray-900 dark:text-gray-100">{line.item.name}</span>
                      <div className="text-[11px] text-gray-500">
                        Rs. {line.unitPrice.toFixed(2)} per {line.unitType === 'PACK' ? line.item.packUnit : line.item.dispensingUnit}
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(line.item.id)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Pack vs Tab Switcher + Quantity */}
                  <div className="mt-2 flex items-center justify-between gap-2">
                    {line.item.packSize > 1 ? (
                      <div className="flex rounded-md border border-gray-300 dark:border-gray-600">
                        <button
                          type="button"
                          onClick={() => updateLineUnit(line.item.id, 'PACK')}
                          className={`px-2 py-1 text-xs font-medium rounded-l-md ${
                            line.unitType === 'PACK'
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {line.item.packUnit} ({line.item.packSize})
                        </button>
                        <button
                          type="button"
                          onClick={() => updateLineUnit(line.item.id, 'UNIT')}
                          className={`px-2 py-1 text-xs font-medium rounded-r-md ${
                            line.unitType === 'UNIT'
                              ? 'bg-primary-600 text-white'
                              : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                          }`}
                        >
                          {line.item.dispensingUnit} (Loose)
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-500">{line.item.packUnit}</span>
                    )}

                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min="1"
                        className="w-16 text-center font-bold py-1 text-xs"
                        value={line.quantity}
                        onChange={(e) => updateLineQty(line.item.id, parseInt(e.target.value) || 1)}
                      />
                      <span className="font-bold text-gray-900 dark:text-gray-100">
                        Rs. {line.totalPrice.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  {/* Dosage instructions */}
                  <div className="mt-2 flex items-center gap-1">
                    <select
                      value={line.dosageInstruction}
                      onChange={(e) => updateLineDosage(line.item.id, e.target.value)}
                      className="w-full rounded border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
                    >
                      {DOSAGE_PRESETS.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Bill Summary */}
          <div className="space-y-1.5 border-t pt-3 text-sm dark:border-gray-700">
            <div className="flex justify-between text-gray-500">
              <span>{t('Subtotal')}</span>
              <span>Rs. {subtotal.toFixed(2)}</span>
            </div>
            {vatTotal > 0 && (
              <div className="flex justify-between text-amber-600">
                <span>{t('VAT (13% on Taxable Items)')}</span>
                <span>+ Rs. {vatTotal.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-base font-extrabold text-gray-900 dark:text-gray-100">
              <span>{t('Net Payable')}</span>
              <span className="text-primary-600 dark:text-primary-400">Rs. {grandTotal.toFixed(2)}</span>
            </div>
          </div>

          {/* Refill reminder checkbox */}
          <div className="rounded-lg border border-primary-100 bg-primary-50/50 p-2 text-xs dark:border-primary-900/50 dark:bg-primary-950/20">
            <label className="flex items-center gap-2 cursor-pointer font-medium text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={enableRefillReminder}
                onChange={(e) => setEnableRefillReminder(e.target.checked)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span>{t('Send SMS Refill Reminder when course ends')}</span>
            </label>
            {enableRefillReminder && (
              <div className="mt-2 flex items-center gap-2">
                <span>{t('Course duration:')}</span>
                <Input
                  type="number"
                  min="1"
                  className="w-16 text-center py-1 text-xs"
                  value={refillDays}
                  onChange={(e) => setRefillDays(parseInt(e.target.value) || 0)}
                />
                <span>{t('days')}</span>
              </div>
            )}
          </div>

          {/* Tender Type Selector */}
          <div className="grid grid-cols-4 gap-1 text-xs">
            {(['CASH', 'QR_FONEPAY', 'CARD', 'CREDIT'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPaymentMethod(mode)}
                className={`rounded py-1.5 font-bold transition ${
                  paymentMethod === mode
                    ? 'bg-primary-600 text-white shadow'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200'
                }`}
              >
                {mode === 'QR_FONEPAY' ? 'Fonepay' : mode}
              </button>
            ))}
          </div>

          <Button
            onClick={handleCheckout}
            disabled={cart.length === 0 || isSubmitting}
            className="w-full text-base font-bold py-3"
          >
            {isSubmitting ? t('Processing...') : `${t('Dispense & Print Bill')} — Rs. ${grandTotal.toFixed(2)}`}
          </Button>
        </div>
      </div>

      {/* Thermal / A4 Print Receipt Modal */}
      {receipt && (
        <Modal
          open={true}
          onClose={() => setReceipt(null)}
          title={t('Dispense Receipt #{inv}', { inv: receipt.invoiceNumber })}
        >
          <div className="space-y-4 p-4 text-sm font-mono bg-white dark:bg-gray-900 dark:text-gray-100 rounded-lg border">
            <div className="text-center border-b pb-2">
              <h3 className="font-extrabold text-base">HOSPITAL PHARMACY</h3>
              <p className="text-xs text-gray-500">Tax Invoice / Cash Receipt</p>
              <p className="text-xs">Invoice: {receipt.invoiceNumber}</p>
              <p className="text-xs text-gray-400">{new Date(receipt.createdAt).toLocaleString()}</p>
            </div>

            <div className="text-xs space-y-0.5">
              <div><span className="text-gray-500">Customer:</span> {receipt.customerName}</div>
              {receipt.customerPhone && <div><span className="text-gray-500">Phone:</span> {receipt.customerPhone}</div>}
              <div><span className="text-gray-500">Payment:</span> {receipt.paymentMethod}</div>
            </div>

            <table className="w-full text-xs border-t border-b py-2">
              <thead>
                <tr className="border-b text-gray-500">
                  <th className="text-left py-1">Item</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {receipt.items.map((i, idx) => (
                  <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                    <td className="py-1">
                      <div className="font-bold">{i.itemName}</div>
                      <div className="text-[10px] text-gray-400">Batch: {i.batchNumber} | {i.dosageInstruction}</div>
                    </td>
                    <td className="text-center">{i.quantity} {i.unitType}</td>
                    <td className="text-right">Rs. {i.unitPrice.toFixed(2)}</td>
                    <td className="text-right font-bold">Rs. {i.totalPrice.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>Rs. {receipt.subtotal.toFixed(2)}</span>
              </div>
              {receipt.vatAmount > 0 && (
                <div className="flex justify-between text-amber-600">
                  <span>VAT (13%):</span>
                  <span>Rs. {receipt.vatAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between font-extrabold text-sm border-t pt-1">
                <span>Grand Total:</span>
                <span>Rs. {receipt.netTotal.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Receipt')}
              </Button>
              <Button className="flex-1" onClick={() => setReceipt(null)}>
                {t('Done (Next Customer)')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
export default PharmacyPosPage;
