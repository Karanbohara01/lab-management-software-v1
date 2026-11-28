import { useState, useMemo, useEffect, useCallback } from 'react';
import {
  PackageSearch,
  AlertOctagon,
  AlertTriangle,
  TrendingDown,
  CheckCircle2,
  DollarSign,
  Plus,
  RefreshCw,
  Search,
  FileText,
  Printer,
  Pill,
  Send,
  X,
  Check,
} from 'lucide-react';
import { PharmacyHeader } from './PharmacyHeader';
import { PharmacyPoPrintSheet } from './PharmacyPoPrintSheet';
import { pharmacyApi } from './api';
import type {
  ReorderRecommendation,
  ReorderIntelligenceSummary,
  PurchaseOrder,
  CreatePurchaseOrderRequest,
} from './types';
import { useT } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/toast';

export function PharmacyReorderPage() {
  const t = useT();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'RECOMMENDATIONS' | 'PURCHASE_ORDERS'>('RECOMMENDATIONS');
  const [recommendations, setRecommendations] = useState<ReorderRecommendation[]>([]);
  const [summary, setSummary] = useState<ReorderIntelligenceSummary>({
    totalMonitoredItems: 0,
    outOfStockCount: 0,
    criticalUrgentCount: 0,
    reorderRecommendedCount: 0,
    optimalCount: 0,
    estimatedTotalProcurementCost: 0,
  });
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [wholesalers, setWholesalers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Filters
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');
  const [selectedWholesalerId, setSelectedWholesalerId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected items for PO batch generation
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  // PO Creation Modal
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poWholesalerId, setPoWholesalerId] = useState<number>(0);
  const [poExpectedDate, setPoExpectedDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0] ?? '';
  });
  const [poNotes, setPoNotes] = useState<string>('Urgent hospital pharmacy stock replenishment');
  const [poLines, setPoLines] = useState<{
    itemId: number;
    itemName: string;
    genericName?: string;
    packUnit: string;
    packSize: number;
    recommendedPackQty: number;
    orderedPackQty: number;
    estimatedRatePerPack: number;
    remarks?: string;
  }[]>([]);

  // PO View/Print Modal
  const [viewPo, setViewPo] = useState<PurchaseOrder | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [recsData, sumData, posData, whData] = await Promise.all([
        pharmacyApi.reorder.recommendations({
          urgency: urgencyFilter === 'ALL' ? undefined : urgencyFilter,
          wholesalerId: selectedWholesalerId === 'ALL' ? undefined : Number(selectedWholesalerId),
          query: searchQuery || undefined,
        }),
        pharmacyApi.reorder.summary(),
        pharmacyApi.purchaseOrders.list({ size: 50 }),
        pharmacyApi.wholesalers.list(),
      ]);
      setRecommendations(recsData || []);
      setSummary(sumData);
      setPurchaseOrders(posData.content || []);
      setWholesalers(whData || []);
    } catch {
      toast.error(t('Failed to load reorder intelligence data'));
    } finally {
      setIsLoading(false);
    }
  }, [urgencyFilter, selectedWholesalerId, searchQuery, t, toast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Toggle selection
  const toggleSelect = (id: number) => {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAllNeedingReorder = () => {
    const needing = recommendations.filter((r) => r.urgency !== 'OPTIMAL');
    setSelectedItemIds(new Set(needing.map((r) => r.itemId)));
  };

  const clearSelection = () => {
    setSelectedItemIds(new Set());
  };

  // Open PO modal prefilled
  const openPoModal = (itemsToOrder?: ReorderRecommendation[]) => {
    const targets = itemsToOrder || recommendations.filter((r) => selectedItemIds.has(r.itemId));
    if (targets.length === 0) {
      toast.error(t('Please select at least one item to generate a purchase order'));
      return;
    }

    // Default wholesaler to first item's preferred wholesaler or first wholesaler in list
    const firstWh = targets.find((t) => t.preferredWholesalerId)?.preferredWholesalerId || wholesalers[0]?.id || 1;
    setPoWholesalerId(firstWh);

    setPoLines(
      targets.map((item) => ({
        itemId: item.itemId,
        itemName: item.itemName,
        genericName: item.genericName,
        packUnit: item.packUnit,
        packSize: item.packSize,
        recommendedPackQty: item.recommendedReorderPacks,
        orderedPackQty: item.recommendedReorderPacks,
        estimatedRatePerPack: item.estimatedRatePerPack,
        remarks: `Auto-reorder: ${item.urgency.replace('_', ' ')} (${item.daysOfStockRemaining} days stock left)`,
      }))
    );
    setIsPoModalOpen(true);
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poWholesalerId) {
      toast.error(t('Please select a distributor / wholesaler'));
      return;
    }
    if (poLines.length === 0) {
      toast.error(t('Purchase order must have items'));
      return;
    }

    try {
      const payload: CreatePurchaseOrderRequest = {
        wholesalerId: poWholesalerId,
        expectedDeliveryDate: poExpectedDate,
        notes: poNotes,
        items: poLines.map((l) => ({
          itemId: l.itemId,
          packUnit: l.packUnit,
          packSize: l.packSize,
          recommendedPackQty: l.recommendedPackQty,
          orderedPackQty: l.orderedPackQty,
          estimatedRatePerPack: l.estimatedRatePerPack,
          remarks: l.remarks,
        })),
      };

      const created = await pharmacyApi.purchaseOrders.create(payload);
      toast.success(t('Purchase Order #{po} generated successfully!', { po: created.poNumber }));
      setIsPoModalOpen(false);
      clearSelection();
      loadData();
      setViewPo(created);
    } catch {
      toast.error(t('Failed to create purchase order'));
    }
  };

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      const updated = await pharmacyApi.purchaseOrders.updateStatus(id, status);
      toast.success(t('Status updated to {status}', { status }));
      loadData();
      if (viewPo?.id === id) {
        setViewPo(updated);
      }
    } catch {
      toast.error(t('Failed to update status'));
    }
  };

  // Grand total calculation for PO modal
  const poTotalEstimate = useMemo(() => {
    return poLines.reduce((acc, line) => acc + line.orderedPackQty * line.estimatedRatePerPack, 0);
  }, [poLines]);

  return (
    <div className="space-y-6">
      <PharmacyHeader />

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-6">
        <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium uppercase tracking-wider">{t('Monitored Drugs')}</span>
            <PackageSearch className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-bold text-foreground">{summary.totalMonitoredItems}</div>
          <p className="text-[11px] text-muted">{t('Active formulary catalogue')}</p>
        </div>

        <div className="rounded-xl border border-red-300/80 bg-red-50/60 p-4 shadow-xs dark:border-red-900/40 dark:bg-red-950/20">
          <div className="flex items-center justify-between text-red-700 dark:text-red-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('Out of Stock')}</span>
            <AlertOctagon className="h-4 w-4 animate-pulse" />
          </div>
          <div className="mt-2 text-2xl font-black text-red-750 dark:text-red-300">{summary.outOfStockCount}</div>
          <p className="text-[11px] text-red-700/80 dark:text-red-400/80">{t('Zero units in inventory')}</p>
        </div>

        <div className="rounded-xl border border-amber-300/80 bg-amber-50/60 p-4 shadow-xs dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
            <span className="text-xs font-bold uppercase tracking-wider">{t('Critical (≤ 3 Days)')}</span>
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-black text-amber-750 dark:text-amber-300">{summary.criticalUrgentCount}</div>
          <p className="text-[11px] text-amber-700/80 dark:text-amber-400/80">{t('Imminent stockout risk')}</p>
        </div>

        <div className="rounded-xl border border-purple-200/60 bg-purple-50/50 p-4 shadow-xs dark:border-purple-900/40 dark:bg-purple-950/20">
          <div className="flex items-center justify-between text-purple-700 dark:text-purple-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('Below ROP')}</span>
            <TrendingDown className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-purple-750 dark:text-purple-300">{summary.reorderRecommendedCount}</div>
          <p className="text-[11px] text-purple-700/80 dark:text-purple-400/80">{t('Reorder point reached')}</p>
        </div>

        <div className="rounded-xl border border-emerald-200/60 bg-emerald-50/50 p-4 shadow-xs dark:border-emerald-900/40 dark:bg-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('Optimal Stock')}</span>
            <CheckCircle2 className="h-4 w-4" />
          </div>
          <div className="mt-2 text-2xl font-bold text-emerald-750 dark:text-emerald-300">{summary.optimalCount}</div>
          <p className="text-[11px] text-emerald-700/80 dark:text-emerald-400/80">{t('Healthy inventory levels')}</p>
        </div>

        <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4 shadow-xs dark:border-blue-900/40 dark:bg-blue-950/20">
          <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
            <span className="text-xs font-semibold uppercase tracking-wider">{t('Est. Reorder Budget')}</span>
            <DollarSign className="h-4 w-4" />
          </div>
          <div className="mt-2 text-xl font-black text-blue-750 dark:text-blue-300">
            Rs. {summary.estimatedTotalProcurementCost.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-blue-700/80 dark:text-blue-400/80">{t('To restore 30-day buffer')}</p>
        </div>
      </div>

      {/* Main Section Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <PackageSearch className="h-5 w-5 text-primary" />
            {t('Smart Re-Order Intelligence & Purchase Order Generator')}
          </h2>
          <p className="text-xs text-muted">
            {t('AI-assisted consumption velocity tracking, run-out forecasting, automated Re-Order Point (ROP) calculation, and 1-click supplier PO creation.')}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Subview Toggle */}
          <div className="flex rounded-lg border border-border bg-surface-muted p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('RECOMMENDATIONS')}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                activeTab === 'RECOMMENDATIONS'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {t('Reorder Intelligence ({count})', { count: recommendations.filter((r) => r.urgency !== 'OPTIMAL').length })}
            </button>
            <button
              onClick={() => setActiveTab('PURCHASE_ORDERS')}
              className={`rounded-md px-3 py-1 font-semibold transition ${
                activeTab === 'PURCHASE_ORDERS'
                  ? 'bg-surface text-foreground shadow-xs'
                  : 'text-muted hover:text-foreground'
              }`}
            >
              {t('Purchase Orders ({count})', { count: purchaseOrders.length })}
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={loadData}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            {t('Refresh')}
          </Button>

          {activeTab === 'RECOMMENDATIONS' && (
            <Button
              size="sm"
              onClick={() => openPoModal()}
              disabled={selectedItemIds.size === 0}
              className="gap-1.5 text-xs font-semibold"
            >
              <Plus className="h-3.5 w-3.5" />
              {t('Generate PO ({n})', { n: selectedItemIds.size })}
            </Button>
          )}
        </div>
      </div>

      {/* View 1: Reorder Recommendations */}
      {activeTab === 'RECOMMENDATIONS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col gap-3 rounded-xl border border-border/80 bg-surface p-3 sm:flex-row sm:items-center sm:justify-between shadow-xs">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted" />
              <Input
                placeholder={t('Search medicine, generic formula, or supplier...')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Wholesaler selector */}
              <select
                value={selectedWholesalerId}
                onChange={(e) => setSelectedWholesalerId(e.target.value)}
                className="h-8 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground focus:border-primary focus:outline-none"
              >
                <option value="ALL">{t('All Wholesalers & Distributors')}</option>
                {wholesalers.map((wh) => (
                  <option key={wh.id} value={wh.id}>
                    {wh.name}
                  </option>
                ))}
              </select>

              {/* Urgency tabs */}
              <div className="flex items-center gap-1">
                {[
                  { id: 'ALL', label: t('All') },
                  { id: 'OUT_OF_STOCK', label: t('Out of Stock') },
                  { id: 'CRITICAL_URGENT', label: t('Critical (≤3d)') },
                  { id: 'REORDER_RECOMMENDED', label: t('Below ROP') },
                  { id: 'OPTIMAL', label: t('Optimal') },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setUrgencyFilter(tab.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-medium transition ${
                      urgencyFilter === tab.id
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'bg-surface-muted text-muted hover:bg-surface-muted/80 hover:text-foreground'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Selection Helper Bar */}
          <div className="flex items-center justify-between px-1 text-xs text-muted">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={selectAllNeedingReorder}
                className="font-semibold text-primary hover:underline"
              >
                {t('Select All Deficit / Below ROP Items')}
              </button>
              <span>·</span>
              <button
                type="button"
                onClick={clearSelection}
                className="text-muted hover:text-foreground"
              >
                {t('Clear Selection')}
              </button>
            </div>
            <span>
              {t('{selected} of {total} items selected for Purchase Order', {
                selected: selectedItemIds.size,
                total: recommendations.length,
              })}
            </span>
          </div>

          {/* Recommendations Table */}
          <div className="rounded-xl border border-border/80 bg-surface shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-muted/70 text-muted font-semibold border-b border-border/80">
                  <tr>
                    <th className="px-3 py-3 w-8 text-center">
                      <input
                        type="checkbox"
                        checked={selectedItemIds.size > 0 && selectedItemIds.size === recommendations.length}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItemIds(new Set(recommendations.map((r) => r.itemId)));
                          } else {
                            clearSelection();
                          }
                        }}
                        className="rounded border-border"
                      />
                    </th>
                    <th className="px-4 py-3">{t('Medicine & Generic')}</th>
                    <th className="px-4 py-3">{t('Current Stock')}</th>
                    <th className="px-4 py-3">{t('Velocity (30D / ADC)')}</th>
                    <th className="px-4 py-3">{t('Runout Forecast')}</th>
                    <th className="px-4 py-3">{t('Reorder Point (ROP)')}</th>
                    <th className="px-4 py-3">{t('Recommended Order')}</th>
                    <th className="px-4 py-3">{t('Distributor & Est. Cost')}</th>
                    <th className="px-4 py-3 text-right">{t('Action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {isLoading ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin text-primary mb-2" />
                        {t('Analyzing consumption rates and stock levels...')}
                      </td>
                    </tr>
                  ) : recommendations.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-muted">
                        <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-500 mb-2" />
                        <p className="font-semibold text-foreground text-sm">{t('All stock levels are optimal!')}</p>
                        <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                          {t('No drugs currently breach their Re-Order Point. Inventory velocity is balanced.')}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    recommendations.map((item) => {
                      const isSelected = selectedItemIds.has(item.itemId);
                      return (
                        <tr
                          key={item.itemId}
                          className={`transition-colors ${
                            isSelected
                              ? 'bg-primary/5 hover:bg-primary/10'
                              : 'hover:bg-surface-muted/40'
                          }`}
                        >
                          <td className="px-3 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.itemId)}
                              className="rounded border-border"
                            />
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground flex items-center gap-1.5">
                              <Pill className="h-3.5 w-3.5 text-primary" />
                              {item.itemName}
                            </div>
                            <div className="text-[11px] text-muted truncate max-w-xs">
                              {item.genericName || 'Formula not specified'}
                            </div>
                            {item.rackLocation && (
                              <span className="text-[10px] text-muted">Rack: {item.rackLocation}</span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-bold text-foreground">
                              {item.currentPacks} {item.packUnit} ({item.currentUnits} {item.dispensingUnit})
                            </div>
                            {item.currentUnits === 0 ? (
                              <Badge tone="danger" variant="subtle" className="text-[10px] mt-0.5">
                                {t('OUT OF STOCK')}
                              </Badge>
                            ) : item.currentUnits <= item.minStockLevel ? (
                              <span className="text-[10px] text-amber-600 font-semibold">
                                {t('Below Min Buffer ({n})', { n: item.minStockLevel })}
                              </span>
                            ) : (
                              <span className="text-[10px] text-emerald-600">
                                {t('Min Buffer: {n}', { n: item.minStockLevel })}
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-medium text-foreground">
                              {item.last30DaysDispensedUnits} {item.dispensingUnit} / 30d
                            </div>
                            <div className="text-[10px] text-muted">
                              ADC: {item.averageDailyConsumption} {item.dispensingUnit}/day
                            </div>
                          </td>

                          <td className="px-4 py-3">
                            {item.daysOfStockRemaining === 0 ? (
                              <Badge tone="danger" variant="subtle" className="font-bold">
                                {t('0 Days (Empty)')}
                              </Badge>
                            ) : item.daysOfStockRemaining <= 3 ? (
                              <Badge tone="danger" variant="subtle" className="font-bold">
                                {item.daysOfStockRemaining} {t('days left')}
                              </Badge>
                            ) : item.daysOfStockRemaining <= 10 ? (
                              <Badge tone="warning" variant="subtle" className="font-semibold">
                                {item.daysOfStockRemaining} {t('days left')}
                              </Badge>
                            ) : (
                              <Badge tone="success" variant="subtle">
                                {item.daysOfStockRemaining > 90 ? '90+ days' : `${item.daysOfStockRemaining} days`}
                              </Badge>
                            )}
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground">
                              {item.reorderPointUnits} {item.dispensingUnit}
                            </div>
                            <span className="text-[10px] text-muted">
                              ~{Math.ceil(item.reorderPointUnits / item.packSize)} {item.packUnit}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-black text-primary text-sm">
                              {item.recommendedReorderPacks} {item.packUnit}
                            </div>
                            <span className="text-[10px] text-muted">
                              +{item.recommendedReorderPacks * item.packSize} {item.dispensingUnit}
                            </span>
                          </td>

                          <td className="px-4 py-3">
                            <div className="font-semibold text-foreground truncate max-w-[140px]">
                              {item.preferredWholesalerName}
                            </div>
                            <div className="text-[10px] text-muted">
                              @ Rs. {item.estimatedRatePerPack.toFixed(2)} ={' '}
                              <span className="font-bold text-foreground">
                                Rs. {item.estimatedTotalAmount.toFixed(0)}
                              </span>
                            </div>
                          </td>

                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="secondary"
                              className="h-7 text-[11px] gap-1"
                              onClick={() => openPoModal([item])}
                            >
                              <Plus className="h-3 w-3" />
                              {t('Order')}
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* View 2: Purchase Orders History */}
      {activeTab === 'PURCHASE_ORDERS' && (
        <div className="rounded-xl border border-border/80 bg-surface shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-muted/70 text-muted font-semibold border-b border-border/80">
                <tr>
                  <th className="px-4 py-3">{t('PO Number')}</th>
                  <th className="px-4 py-3">{t('Distributor / Wholesaler')}</th>
                  <th className="px-4 py-3">{t('Order Date')}</th>
                  <th className="px-4 py-3">{t('Expected Delivery')}</th>
                  <th className="px-4 py-3">{t('Status')}</th>
                  <th className="px-4 py-3">{t('Total Amount')}</th>
                  <th className="px-4 py-3 text-right">{t('Actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {purchaseOrders.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-muted">
                      <FileText className="mx-auto h-8 w-8 text-muted mb-2" />
                      <p className="font-semibold text-foreground">{t('No purchase orders yet')}</p>
                      <p className="text-xs text-muted max-w-sm mx-auto mt-1">
                        {t('Switch to the Reorder Intelligence tab and click "Generate PO" to create distributor purchase orders.')}
                      </p>
                    </td>
                  </tr>
                ) : (
                  purchaseOrders.map((po) => (
                    <tr key={po.id} className="hover:bg-surface-muted/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-mono font-bold text-foreground">{po.poNumber}</div>
                        <div className="text-[10px] text-muted">{po.items?.length || 0} line items</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{po.wholesalerName}</div>
                        {po.wholesalerPhone && (
                          <div className="text-[10px] text-muted">Tel: {po.wholesalerPhone}</div>
                        )}
                      </td>

                      <td className="px-4 py-3">{po.orderDate}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{po.expectedDeliveryDate || 'N/A'}</td>

                      <td className="px-4 py-3">
                        {po.status === 'ISSUED' && (
                          <Badge tone="info" variant="subtle">
                            {t('ISSUED / SENT')}
                          </Badge>
                        )}
                        {po.status === 'COMPLETED' && (
                          <Badge tone="success" variant="subtle">
                            {t('COMPLETED / GRN RECEIVED')}
                          </Badge>
                        )}
                        {po.status === 'DRAFT' && (
                          <Badge tone="neutral" variant="subtle">
                            {t('DRAFT')}
                          </Badge>
                        )}
                        {po.status === 'CANCELLED' && (
                          <Badge tone="danger" variant="subtle">
                            {t('CANCELLED')}
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-extrabold text-foreground">
                          Rs. {po.totalEstimatedAmount.toFixed(2)}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            className="h-7 text-[11px] gap-1"
                            onClick={() => setViewPo(po)}
                          >
                            <Printer className="h-3 w-3" />
                            {t('View & Print PO')}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Generate Purchase Order Dialog */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border/70">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <PackageSearch className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">{t('Generate Supplier Purchase Order (PO)')}</h3>
                  <p className="text-xs text-muted">{t('Review medicines, adjust order quantities, and issue formal PO to distributor')}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPoModalOpen(false)}
                className="rounded-lg p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseOrder} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('Distributor / Wholesaler *')}</label>
                  <select
                    required
                    value={poWholesalerId}
                    onChange={(e) => setPoWholesalerId(Number(e.target.value))}
                    className="mt-1 w-full h-9 rounded-lg border border-border bg-surface px-3 text-xs text-foreground focus:border-primary focus:outline-none"
                  >
                    {wholesalers.map((wh) => (
                      <option key={wh.id} value={wh.id}>
                        {wh.name} {wh.phone ? `(${wh.phone})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground">{t('Expected Delivery Date')}</label>
                  <Input
                    type="date"
                    value={poExpectedDate}
                    onChange={(e) => setPoExpectedDate(e.target.value)}
                    className="mt-1 h-9 text-xs"
                  />
                </div>
              </div>

              {/* Items Table */}
              <div className="rounded-xl border border-border/80 overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-muted/80 text-muted font-semibold border-b border-border/80">
                    <tr>
                      <th className="px-3 py-2">{t('Drug / Medicine')}</th>
                      <th className="px-3 py-2 text-center">{t('Order Pack Qty')}</th>
                      <th className="px-3 py-2 text-right">{t('Est. Rate/Pack')}</th>
                      <th className="px-3 py-2 text-right">{t('Line Total')}</th>
                      <th className="px-2 py-2 text-center w-8"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {poLines.map((line, idx) => (
                      <tr key={line.itemId} className="hover:bg-surface-muted/30">
                        <td className="px-3 py-2">
                          <div className="font-semibold text-foreground">{line.itemName}</div>
                          <div className="text-[10px] text-muted">
                            1 {line.packUnit} = {line.packSize} units · Rec: {line.recommendedPackQty}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-center w-28">
                          <Input
                            type="number"
                            min="1"
                            value={line.orderedPackQty}
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              const updated = [...poLines];
                              updated[idx] = { ...line, orderedPackQty: val };
                              setPoLines(updated);
                            }}
                            className="h-7 w-20 text-center text-xs mx-auto"
                          />
                        </td>
                        <td className="px-3 py-2 text-right">
                          Rs. {line.estimatedRatePerPack.toFixed(2)}
                        </td>
                        <td className="px-3 py-2 text-right font-bold text-foreground">
                          Rs. {(line.orderedPackQty * line.estimatedRatePerPack).toFixed(2)}
                        </td>
                        <td className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => setPoLines(poLines.filter((_, i) => i !== idx))}
                            className="text-muted hover:text-red-600"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Total & Notes */}
              <div className="flex items-center justify-between rounded-lg bg-surface-muted/50 p-3 text-xs">
                <span className="font-medium text-muted">{t('Total Estimated Order Amount:')}</span>
                <span className="text-base font-black text-primary">
                  Rs. {poTotalEstimate.toFixed(2)}
                </span>
              </div>

              <div>
                <label className="text-xs font-semibold text-foreground">{t('Special Instructions / Notes')}</label>
                <Input
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="e.g. Please supply batches expiring after 2027 only"
                  className="mt-1 h-9 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border/70">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsPoModalOpen(false)}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" size="sm" className="gap-1.5 font-bold">
                  <Send className="h-3.5 w-3.5" />
                  {t('Confirm & Issue Purchase Order')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: View & Print Purchase Order Sheet */}
      {viewPo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border/80 bg-surface p-6 shadow-2xl animate-in fade-in-50 zoom-in-95 space-y-4">
            {/* Action Bar */}
            <div className="flex items-center justify-between pb-3 border-b border-border/70" data-print-hide>
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm text-foreground">{viewPo.poNumber}</span>
                <Badge tone="info" variant="subtle">
                  {viewPo.status}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => window.print()}
                  className="gap-1.5 text-xs"
                >
                  <Printer className="h-3.5 w-3.5" />
                  {t('Print PO')}
                </Button>
                {viewPo.status !== 'COMPLETED' && (
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs font-semibold"
                    onClick={() => handleUpdateStatus(viewPo.id, 'COMPLETED')}
                  >
                    <Check className="h-3.5 w-3.5" />
                    {t('Mark Completed')}
                  </Button>
                )}
                <button
                  type="button"
                  onClick={() => setViewPo(null)}
                  className="rounded-lg p-1 text-muted hover:bg-surface-muted hover:text-foreground"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Purchase Order Preview */}
            <div className="rounded-xl border border-border/80 bg-white shadow-xs overflow-hidden">
              <PharmacyPoPrintSheet po={viewPo} isPrintDocument={false} />
            </div>
          </div>
        </div>
      )}

      {/* Dedicated Printable Purchase Order Sheet (Rendered exclusively during print via #pharmacy-po-print) */}
      {viewPo && (
        <div className="hidden print:block">
          <PharmacyPoPrintSheet po={viewPo} isPrintDocument={true} />
        </div>
      )}
    </div>
  );
}

export default PharmacyReorderPage;
