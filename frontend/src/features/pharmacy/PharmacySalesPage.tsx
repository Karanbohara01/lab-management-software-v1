import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { SaleReceipt } from './types';
import { PharmacyHeader } from './PharmacyHeader';
import { PharmacyReceiptPrint } from './PharmacyReceiptPrint';
import { PharmacyThermalLabelModal } from './PharmacyThermalLabelModal';
import type { PharmacyThermalLabelData } from './PharmacyThermalLabel';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useT } from '@/i18n';
import {
  Receipt,
  Search,
  Printer,
  Calendar,
  CreditCard,
  User,
  Phone,
  Stethoscope,
  Filter,
  Tag,
} from 'lucide-react';

export function PharmacySalesPage() {
  const t = useT();

  const [search, setSearch] = useState('');
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>('ALL');
  const [activeReceipt, setActiveReceipt] = useState<SaleReceipt | null>(null);
  const [labelModalItems, setLabelModalItems] = useState<PharmacyThermalLabelData[] | null>(null);

  const handlePrintInvoiceLabels = (receipt: SaleReceipt) => {
    if (!receipt.items || receipt.items.length === 0) return;
    const items: PharmacyThermalLabelData[] = receipt.items.map((it) => ({
      patientName: receipt.customerName || 'Walk-in Patient',
      patientMrn: receipt.patientId ? `MRN-${receipt.patientId}` : 'WALKIN',
      doctorName: receipt.doctorName || undefined,
      drugName: it.itemName,
      genericName: it.genericName || undefined,
      dispensedQty: it.quantity,
      batchNumber: it.batchNumber || 'NA',
      expiryDate: it.expiryDate || 'NA',
      dispenseDate: (receipt.createdAt || new Date().toISOString()).split('T')[0],
      instructionsEn: it.dosageInstruction || '1 Tablet Twice Daily After Meals',
      instructionsNp: 'बिहान-बेलुका १-१ चक्की खानापछि',
    }));
    setLabelModalItems(items);
  };

  // Load Sales Data
  const { data: salesPage, loading, refetch } = useQuery(
    () => pharmacyApi.dispense.listSales({ size: 50 }),
    []
  );

  // Client-side filtering for fast interactive searching
  const filteredSales = (salesPage?.content || []).filter((sale) => {
    const matchesSearch =
      sale.invoiceNumber.toLowerCase().includes(search.toLowerCase()) ||
      sale.customerName.toLowerCase().includes(search.toLowerCase()) ||
      (sale.customerPhone && sale.customerPhone.includes(search)) ||
      (sale.doctorName && sale.doctorName.toLowerCase().includes(search.toLowerCase()));

    const matchesMode =
      selectedPaymentMode === 'ALL' || sale.paymentMethod === selectedPaymentMode;

    return matchesSearch && matchesMode;
  });

  const totalSalesCount = filteredSales.length;
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.netTotal, 0);
  const totalVatCollected = filteredSales.reduce((acc, s) => acc + s.vatAmount, 0);

  return (
    <div className="space-y-6">
      <PharmacyHeader />

      {/* Header & KPI Summary */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/80 bg-surface p-5 shadow-xs"
        data-print-hide
      >
        <div>
          <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-foreground">
            <Receipt className="h-6 w-6 text-primary-500" />
            {t('Pharmacy Sales & Invoices')}
          </h2>
          <p className="mt-1 text-sm text-muted">
            {t('Audit recent dispense receipts, print history, customer billing, and tax invoices.')}
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="rounded-lg border border-border bg-gray-50/50 px-3 py-2 text-right dark:bg-gray-800/40">
            <span className="block text-[10px] font-semibold text-muted">{t('Total Invoices')}</span>
            <span className="text-sm font-extrabold text-foreground">{totalSalesCount}</span>
          </div>
          <div className="rounded-lg border border-border bg-gray-50/50 px-3 py-2 text-right dark:bg-gray-800/40">
            <span className="block text-[10px] font-semibold text-muted">{t('Total Revenue')}</span>
            <span className="text-sm font-extrabold text-primary-600">
              Rs. {totalRevenue.toFixed(2)}
            </span>
          </div>
          <div className="rounded-lg border border-border bg-gray-50/50 px-3 py-2 text-right dark:bg-gray-800/40">
            <span className="block text-[10px] font-semibold text-muted">{t('VAT Collected')}</span>
            <span className="text-sm font-extrabold text-amber-600">
              Rs. {totalVatCollected.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-xs"
        data-print-hide
      >
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
            <Input
              placeholder={t('Search by invoice no, customer name, phone, or doctor...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-1">
            <Filter className="h-3.5 w-3.5 text-muted ml-2" />
            <span className="text-xs text-muted font-medium">{t('Mode')}:</span>
            {(['ALL', 'CASH', 'QR_FONEPAY', 'CARD', 'CREDIT'] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => setSelectedPaymentMode(mode)}
                className={`rounded px-2.5 py-1 text-xs font-semibold transition ${
                  selectedPaymentMode === mode
                    ? 'bg-primary-600 text-white shadow-xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {mode === 'ALL' ? t('All') : mode === 'QR_FONEPAY' ? 'Fonepay' : mode}
              </button>
            ))}
          </div>
        </div>

        <Button variant="secondary" onClick={() => refetch()} loading={loading} className="text-xs">
          {t('Refresh List')}
        </Button>
      </div>

      {/* Invoices List Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs" data-print-hide>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-border bg-gray-50/70 text-muted dark:bg-gray-800/60 font-semibold">
                <th className="py-3 px-4">{t('Invoice No.')}</th>
                <th className="py-3 px-4">{t('Date & Time')}</th>
                <th className="py-3 px-4">{t('Customer / Patient')}</th>
                <th className="py-3 px-4">{t('Doctor Prescriber')}</th>
                <th className="py-3 px-4 text-center">{t('Items')}</th>
                <th className="py-3 px-4">{t('Payment Mode')}</th>
                <th className="py-3 px-4">{t('Return Status')}</th>
                <th className="py-3 px-4 text-right">{t('Net Total')}</th>
                <th className="py-3 px-4 text-right">{t('Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredSales.map((sale) => (
                <tr
                  key={sale.id}
                  className="hover:bg-gray-50/50 transition dark:hover:bg-gray-800/40"
                >
                  <td className="py-3 px-4 font-mono font-bold text-primary-600 dark:text-primary-400">
                    {sale.invoiceNumber}
                  </td>
                  <td className="py-3 px-4 text-muted whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(sale.createdAt).toLocaleDateString()}</span>
                      <span className="text-[10px] text-gray-400">
                        {new Date(sale.createdAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-1.5 font-medium text-foreground">
                      <User className="h-3.5 w-3.5 text-muted" />
                      <span>{sale.customerName}</span>
                    </div>
                    {sale.customerPhone && (
                      <div className="flex items-center gap-1 text-[11px] text-muted">
                        <Phone className="h-2.5 w-2.5" />
                        <span>{sale.customerPhone}</span>
                      </div>
                    )}
                  </td>
                  <td className="py-3 px-4 text-muted">
                    {sale.doctorName ? (
                      <div className="flex items-center gap-1 text-foreground">
                        <Stethoscope className="h-3 w-3 text-muted" />
                        <span>{sale.doctorName}</span>
                      </div>
                    ) : (
                      <span className="italic text-gray-400">{t('Direct OTC')}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {sale.items.length} {sale.items.length === 1 ? 'item' : 'items'}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Badge
                      tone={
                        sale.paymentMethod === 'CASH'
                          ? 'success'
                          : sale.paymentMethod === 'QR_FONEPAY'
                          ? 'info'
                          : sale.paymentMethod === 'CARD'
                          ? 'neutral'
                          : 'warning'
                      }
                    >
                      <CreditCard className="mr-1 h-3 w-3 inline" />
                      {sale.paymentMethod}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    {sale.returnStatus === 'FULL' ? (
                      <Badge tone="danger">{t('Fully Returned')}</Badge>
                    ) : sale.returnStatus === 'PARTIAL' ? (
                      <Badge tone="warning">{t('Partial Return')}</Badge>
                    ) : (
                      <Badge tone="neutral">{t('Dispensed')}</Badge>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right font-extrabold text-foreground">
                    Rs. {sale.netTotal.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        variant="secondary"
                        className="h-7 px-2 text-xs font-semibold"
                        title={t('Print Thermal Medication Labels')}
                        onClick={() => handlePrintInvoiceLabels(sale)}
                      >
                        <Tag className="h-3.5 w-3.5 text-primary" />
                        <span className="hidden sm:inline ml-1">{t('Labels')}</span>
                      </Button>
                      <Button
                        variant="secondary"
                        className="h-7 px-2.5 text-xs font-semibold"
                        onClick={() => setActiveReceipt(sale)}
                      >
                        <Printer className="mr-1.5 h-3.5 w-3.5" />
                        {t('Receipt')}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && !loading && (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-muted">
                    <Receipt className="mx-auto h-8 w-8 text-gray-400 mb-2" />
                    <p className="font-semibold text-sm">{t('No pharmacy sales found')}</p>
                    <p className="text-xs text-gray-400">
                      {search
                        ? t('Try adjusting your search criteria.')
                        : t('Dispense medicines at the POS counter to generate invoices.')}
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Detail / Print Modal */}
      {activeReceipt && (
        <Modal
          open={true}
          onClose={() => setActiveReceipt(null)}
          title={t('Invoice #{inv}', { inv: activeReceipt.invoiceNumber })}
          size="md"
        >
          <div className="space-y-4">
            <div className="max-h-[65vh] overflow-y-auto rounded-lg border border-border bg-gray-50 p-3 shadow-inner dark:bg-gray-900">
              <PharmacyReceiptPrint receipt={activeReceipt} />
            </div>

            <div className="flex gap-2 pt-2" data-print-hide>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => window.print()}
              >
                <Printer className="mr-2 h-4 w-4" />
                {t('Print Invoice')}
              </Button>
              <Button
                variant="secondary"
                className="flex-1 font-semibold"
                onClick={() => handlePrintInvoiceLabels(activeReceipt)}
              >
                <Tag className="mr-2 h-4 w-4 text-primary" />
                {t('Print Labels')}
              </Button>
              <Button className="flex-1" onClick={() => setActiveReceipt(null)}>
                {t('Close')}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Dedicated Printable Receipt for Browser window.print() */}
      {activeReceipt && (
        <div className="hidden print:block">
          <PharmacyReceiptPrint receipt={activeReceipt} isPrintDocument={true} />
        </div>
      )}

      {/* Bedside Thermal Medication Label Generator Modal */}
      {labelModalItems && (
        <PharmacyThermalLabelModal
          open={Boolean(labelModalItems)}
          onClose={() => setLabelModalItems(null)}
          initialItems={labelModalItems}
        />
      )}
    </div>
  );
}

export default PharmacySalesPage;
