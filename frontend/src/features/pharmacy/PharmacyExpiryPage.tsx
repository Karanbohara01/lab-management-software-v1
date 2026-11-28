import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import {
  FaBoxesStacked,
  FaTriangleExclamation,
  FaFileInvoiceDollar,
  FaSkullCrossbones,
  FaHourglassHalf,
  FaCalendarDays,
  FaMagnifyingGlass,
  FaCapsules,
  FaBarcode,
  FaLocationDot,
  FaBuilding,
  FaPrint,
  FaTrashCan,
  FaShieldHalved,
  FaCircleCheck,
  FaArrowRotateRight,
  FaTags,
  FaCircleExclamation,
  FaXmark,
} from 'react-icons/fa6';
import { PharmacyHeader } from './PharmacyHeader';
import { PharmacyThermalLabelModal } from './PharmacyThermalLabelModal';
import { PharmacyBatch } from './types';

export function PharmacyExpiryPage() {
  const t = useT();
  const toast = useToast();
  const [filterMode, setFilterMode] = useState<'30' | '60' | '90' | 'EXPIRED'>('60');
  const [search, setSearch] = useState('');
  const [labelModalOpen, setLabelModalOpen] = useState(false);
  const [selectedBatchForLabel, setSelectedBatchForLabel] = useState<PharmacyBatch | null>(null);

  const { data: batches, loading, refetch } = useQuery(
    () => (filterMode === 'EXPIRED' ? pharmacyApi.batches.expired() : pharmacyApi.batches.expiring(parseInt(filterMode))),
    [filterMode]
  );

  const batchList = batches ?? [];

  const filteredBatches = useMemo(() => {
    if (!search.trim()) return batchList;
    const q = search.toLowerCase();
    return batchList.filter(
      (b) =>
        b.itemName.toLowerCase().includes(q) ||
        b.batchNumber.toLowerCase().includes(q) ||
        (b.genericName && b.genericName.toLowerCase().includes(q)) ||
        (b.wholesalerName && b.wholesalerName.toLowerCase().includes(q)) ||
        (b.rackLocation && b.rackLocation.toLowerCase().includes(q))
    );
  }, [batchList, search]);

  // Comprehensive statistics calculation
  const stats = useMemo(() => {
    const totalCount = filteredBatches.length;
    const totalUnits = filteredBatches.reduce((acc, b) => acc + (b.remainingUnits || 0), 0);
    const estimatedValue = filteredBatches.reduce(
      (acc, b) => acc + (b.remainingUnits || 0) * (b.effectiveCostPerUnit || 0),
      0
    );
    const expiredCount = filteredBatches.filter((b) => b.isExpired).length;
    return { totalCount, totalUnits, estimatedValue, expiredCount };
  }, [filteredBatches]);

  const handleDiscard = async (id: number) => {
    if (!confirm(t('Discard/write-off remaining stock from this batch? This will deduct the remaining units from inventory.')))
      return;
    try {
      await pharmacyApi.batches.discard(id);
      toast.success(t('Batch stock written off successfully'));
      refetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to discard batch'));
    }
  };

  const handlePrintBatchLabel = (b: PharmacyBatch) => {
    setSelectedBatchForLabel(b);
    setLabelModalOpen(true);
  };

  const getDaysLabel = (expiryDateStr: string) => {
    try {
      const exp = new Date(expiryDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return {
          text: `${Math.abs(diffDays)} ${t('days ago')}`,
          isExpired: true,
          tone: 'danger' as const,
        };
      }
      if (diffDays === 0) {
        return {
          text: t('Expires Today!'),
          isExpired: true,
          tone: 'danger' as const,
        };
      }
      if (diffDays <= 30) {
        return {
          text: `${t('in')} ${diffDays} ${t('days')}`,
          isExpired: false,
          tone: 'warning' as const,
        };
      }
      return {
        text: `${t('in')} ${diffDays} ${t('days')}`,
        isExpired: false,
        tone: 'neutral' as const,
      };
    } catch {
      return { text: '', isExpired: false, tone: 'neutral' as const };
    }
  };

  return (
    <div className="space-y-4">
      {/* Shared Pharmacy Sub-Navigation */}
      <PharmacyHeader />

      {/* Critical Expired Alert Banner */}
      {filterMode === 'EXPIRED' && batchList.length > 0 && (
        <div className="flex items-start sm:items-center gap-3 rounded-2xl border border-red-300 bg-red-50/90 p-4 text-xs text-red-900 shadow-sm dark:border-red-900/60 dark:bg-red-950/50 dark:text-red-200">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white shadow-xs">
            <FaSkullCrossbones className="h-5 w-5" />
          </div>
          <div className="flex-1">
            <h4 className="font-extrabold text-sm text-red-900 dark:text-red-100 flex items-center gap-1.5">
              <span>{t('CRITICAL COMPLIANCE ALERT: Expired Inventory Detected!')}</span>
              <span className="rounded-full bg-red-200 px-2 py-0.5 text-[10px] font-black text-red-900 dark:bg-red-800 dark:text-red-100">
                {batchList.length} {t('Batches')}
              </span>
            </h4>
            <p className="mt-0.5 text-xs text-red-800 dark:text-red-300">
              {t(
                'These batches have passed their shelf life. Under hospital pharmacy SOPs, immediately quarantine them into the expired-drugs bin to prevent accidental patient dispensing.'
              )}
            </p>
          </div>
        </div>
      )}

      {/* Modern Flaticon KPI Cards */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {/* Card 1: Batches Monitored */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t('Batches Monitored')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-600 dark:bg-indigo-950/50 dark:border-indigo-800/50 dark:text-indigo-300 shadow-2xs">
              <FaBoxesStacked className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-foreground">
            {stats.totalCount}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <FaHourglassHalf className="h-3 w-3 text-indigo-500" />
            <span>
              {filterMode === 'EXPIRED'
                ? t('Already past expiry date')
                : t('Expiring within {days} days', { days: filterMode })}
            </span>
          </div>
        </div>

        {/* Card 2: Units at Risk */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t('Remaining Units at Risk')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 border border-amber-200/80 text-amber-600 dark:bg-amber-950/50 dark:border-amber-800/50 dark:text-amber-300 shadow-2xs">
              <FaTriangleExclamation className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-foreground">
            {stats.totalUnits.toLocaleString()}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
            {stats.totalUnits > 0 ? (
              <span className="inline-flex items-center gap-1 rounded bg-amber-100/70 px-1.5 py-0.5 text-[10px] dark:bg-amber-900/50">
                <FaCircleExclamation className="h-2.5 w-2.5" /> {t('Active Quarantine Needed')}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 dark:text-emerald-400">
                <FaCircleCheck className="h-3 w-3" /> {t('No units at risk')}
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Estimated Valuation */}
        <div className="relative overflow-hidden rounded-2xl border border-border/80 bg-surface p-4 shadow-2xs hover:shadow-xs transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t('Estimated Inventory Value')}
            </span>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 dark:bg-emerald-950/50 dark:border-emerald-800/50 dark:text-emerald-300 shadow-2xs">
              <FaFileInvoiceDollar className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-black tracking-tight text-foreground">
            Rs. {stats.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-muted">
            <span>{t('At effective purchase acquisition cost')}</span>
          </div>
        </div>
      </div>

      {/* Modern Filter Tabs & Live Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-border/80 bg-surface p-3 shadow-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          {/* Already Expired */}
          <button
            type="button"
            onClick={() => setFilterMode('EXPIRED')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition shadow-2xs cursor-pointer active:scale-95 ${
              filterMode === 'EXPIRED'
                ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400/40'
                : 'border border-red-200 bg-red-50/80 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            <FaSkullCrossbones className="h-3.5 w-3.5" />
            <span>{t('Already Expired')}</span>
          </button>

          {/* Within 30 Days */}
          <button
            type="button"
            onClick={() => setFilterMode('30')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition shadow-2xs cursor-pointer active:scale-95 ${
              filterMode === '30'
                ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-400/40'
                : 'border border-amber-200 bg-amber-50/80 text-amber-800 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            <FaTriangleExclamation className="h-3.5 w-3.5" />
            <span>{t('Within 30 Days')}</span>
          </button>

          {/* Within 60 Days */}
          <button
            type="button"
            onClick={() => setFilterMode('60')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition shadow-2xs cursor-pointer active:scale-95 ${
              filterMode === '60'
                ? 'bg-primary text-primary-foreground shadow-xs ring-2 ring-primary/40'
                : 'border border-border bg-surface-muted/60 text-muted hover:bg-surface-muted hover:text-foreground'
            }`}
          >
            <FaHourglassHalf className="h-3.5 w-3.5" />
            <span>{t('Within 60 Days')}</span>
          </button>

          {/* Within 90 Days */}
          <button
            type="button"
            onClick={() => setFilterMode('90')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-1.5 text-xs font-extrabold transition shadow-2xs cursor-pointer active:scale-95 ${
              filterMode === '90'
                ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-400/40'
                : 'border border-border bg-surface-muted/60 text-muted hover:bg-surface-muted hover:text-foreground'
            }`}
          >
            <FaCalendarDays className="h-3.5 w-3.5" />
            <span>{t('Within 90 Days')}</span>
          </button>
        </div>

        {/* Search Bar with Flaticon & Quick Clear */}
        <div className="flex items-center gap-2">
          <div className="relative sm:w-72">
            <FaMagnifyingGlass className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search batch, drug, rack...')}
              className="pl-9 pr-7 text-xs h-8 rounded-xl font-medium"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-muted hover:text-foreground"
              >
                <FaXmark className="h-3 w-3" />
              </button>
            )}
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={() => refetch()}
            className="h-8 rounded-xl gap-1.5 text-xs font-bold text-muted hover:text-foreground"
            title={t('Refresh inventory batches')}
          >
            <FaArrowRotateRight className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{t('Sync')}</span>
          </Button>
        </div>
      </div>

      {/* Batches Table with Flaticons & Direct Thermal Label Printing */}
      <div className="overflow-hidden rounded-2xl border border-border/80 bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border/80 bg-surface-muted/60 text-[11px] font-black uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FaCapsules className="h-3 w-3 text-primary" />
                    <span>{t('Medicine / Formulation')}</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FaBarcode className="h-3 w-3 text-muted" />
                    <span>{t('Batch Number')}</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FaHourglassHalf className="h-3 w-3 text-amber-500" />
                    <span>{t('Expiry Date & Window')}</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FaBoxesStacked className="h-3 w-3 text-muted" />
                    <span>{t('Remaining Stock')}</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FaBuilding className="h-3 w-3 text-muted" />
                    <span>{t('Supplier Wholesaler')}</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FaLocationDot className="h-3 w-3 text-muted" />
                    <span>{t('Rack Location')}</span>
                  </div>
                </th>
                <th className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <FaShieldHalved className="h-3 w-3 text-muted" />
                    <span>{t('FEFO Status')}</span>
                  </div>
                </th>
                <th className="px-4 py-3.5 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && !batches ? (
                <tr>
                  <td colSpan={8} className="py-14 text-center text-muted">
                    <div className="inline-block h-7 w-7 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                    <p className="mt-2 text-xs font-bold text-foreground">{t('Auditing formulary batches via FEFO rules...')}</p>
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                /* Enhanced Medical Flaticon Empty State */
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="mx-auto flex flex-col items-center justify-center max-w-md">
                      <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 shadow-sm dark:bg-emerald-950/40 dark:border-emerald-800/50 dark:text-emerald-300">
                        <FaShieldHalved className="h-8 w-8" />
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-white shadow-2xs">
                          <FaCircleCheck className="h-3.5 w-3.5" />
                        </div>
                      </div>
                      <h3 className="text-base font-extrabold text-foreground">
                        {t('Formulary is 100% FEFO Compliant')}
                      </h3>
                      <p className="mt-1 text-xs text-muted leading-relaxed">
                        {filterMode === 'EXPIRED'
                          ? t('Zero expired drugs found in dispensing racks. All medications are compliant with hospital safety standards.')
                          : t('No batches expiring within {days} days were found. Your hospital stock is safely within shelf-life thresholds.', { days: filterMode })}
                      </p>
                      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                        {filterMode !== '90' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setFilterMode('90')}
                            className="h-8 rounded-xl text-xs font-bold gap-1.5"
                          >
                            <FaCalendarDays className="h-3 w-3 text-indigo-500" />
                            {t('Expand Audit to 90 Days')}
                          </Button>
                        )}
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setSelectedBatchForLabel(null);
                            setLabelModalOpen(true);
                          }}
                          className="h-8 rounded-xl text-xs font-bold gap-1.5"
                        >
                          <FaTags className="h-3 w-3 text-amber-600" />
                          {t('Open Thermal Label Maker')}
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => {
                  const daysInfo = getDaysLabel(b.expiryDate);
                  return (
                    <tr key={b.id} className="hover:bg-surface-muted/40 transition">
                      {/* Medicine Name */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 border border-blue-200/60 text-blue-600 dark:bg-blue-950/40 dark:border-blue-800/40 dark:text-blue-300">
                            <FaCapsules className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="font-extrabold text-foreground text-xs leading-snug">{b.itemName}</div>
                            <div className="text-[11px] text-muted">{b.genericName || '—'}</div>
                          </div>
                        </div>
                      </td>

                      {/* Batch Number */}
                      <td className="px-4 py-3 font-mono font-bold text-xs text-foreground">
                        <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 border border-border/60">
                          <FaBarcode className="h-2.5 w-2.5 text-muted" />
                          {b.batchNumber}
                        </span>
                      </td>

                      {/* Expiry Date */}
                      <td className="px-4 py-3 text-xs">
                        <div
                          className={`font-extrabold ${
                            daysInfo.isExpired
                              ? 'text-red-600 dark:text-red-400'
                              : 'text-amber-600 dark:text-amber-400'
                          }`}
                        >
                          {b.expiryDate}
                        </div>
                        <div className="text-[10px] text-muted font-medium">
                          {daysInfo.text}
                        </div>
                      </td>

                      {/* Stock Remaining */}
                      <td className="px-4 py-3 text-xs">
                        <div className="font-extrabold text-foreground">
                          {b.remainingPacks} {t('Packs')}
                        </div>
                        <div className="text-[10px] text-muted font-medium">
                          ({b.remainingUnits} {t('loose units')})
                        </div>
                      </td>

                      {/* Wholesaler */}
                      <td className="px-4 py-3 text-xs text-muted">
                        <div className="flex items-center gap-1 font-medium">
                          <FaBuilding className="h-2.5 w-2.5 text-muted" />
                          <span>{b.wholesalerName || t('Direct')}</span>
                        </div>
                      </td>

                      {/* Rack Location */}
                      <td className="px-4 py-3 text-xs">
                        {b.rackLocation ? (
                          <span className="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 font-bold text-foreground border border-border/60">
                            <FaLocationDot className="h-2.5 w-2.5 text-primary" />
                            {b.rackLocation}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      {/* FEFO Status Badge */}
                      <td className="px-4 py-3">
                        {b.isExpired ? (
                          <Badge tone="danger" className="font-extrabold gap-1 text-[10px]">
                            <FaSkullCrossbones className="h-2.5 w-2.5" /> EXPIRED
                          </Badge>
                        ) : (
                          <Badge tone="warning" className="font-extrabold gap-1 text-[10px]">
                            <FaHourglassHalf className="h-2.5 w-2.5" /> EXPIRING SOON
                          </Badge>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Direct Thermal Print Label Button */}
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handlePrintBatchLabel(b)}
                            className="h-7 px-2 text-xs font-bold text-amber-900 border-amber-300 bg-amber-50 hover:bg-amber-100 hover:border-amber-400 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                            title={t('Print 5-rights barcode thermal label for quarantine rack or bottle')}
                          >
                            <FaPrint className="mr-1 h-3 w-3 text-amber-600" />
                            {t('Label')}
                          </Button>

                          {/* Write-off / Discard Button */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDiscard(b.id)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950/50 h-7 px-2 text-xs font-bold"
                            title={t('Write off remaining stock')}
                          >
                            <FaTrashCan className="mr-1 h-3 w-3" />
                            {t('Write-off')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Standalone Thermal Label Maker Modal with Pre-populated Batch Info */}
      {labelModalOpen && (
        <PharmacyThermalLabelModal
          open={labelModalOpen}
          onClose={() => {
            setLabelModalOpen(false);
            setSelectedBatchForLabel(null);
          }}
          defaultSize="100x50"
          initialItems={
            selectedBatchForLabel
              ? [
                  {
                    drugName: selectedBatchForLabel.itemName,
                    genericName: selectedBatchForLabel.genericName,
                    patientName: 'QUARANTINE / BEDSIDE WARD',
                    patientMrn: `BATCH-${selectedBatchForLabel.batchNumber}`,
                    batchNumber: selectedBatchForLabel.batchNumber,
                    expiryDate: selectedBatchForLabel.expiryDate,
                    dispensedQty: `${selectedBatchForLabel.remainingUnits} Units (${selectedBatchForLabel.remainingPacks} Packs)`,
                    instructionsEn: selectedBatchForLabel.isExpired
                      ? 'QUARANTINED - DO NOT DISPENSE TO PATIENTS'
                      : 'FEFO EXPIRING SOON - DISPENSE FIRST',
                    instructionsNp: selectedBatchForLabel.isExpired
                      ? 'म्याद सकिएको औषधि - बिरामीलाई नदिनुहोस्'
                      : 'पहिले प्रयोग गर्नुहोस् (FEFO Priority)',
                    advisoryNote: selectedBatchForLabel.isExpired
                      ? 'Quarantined / Expired Batch'
                      : 'Near Expiry Batch Audit',
                  },
                ]
              : []
          }
        />
      )}
    </div>
  );
}

export default PharmacyExpiryPage;
