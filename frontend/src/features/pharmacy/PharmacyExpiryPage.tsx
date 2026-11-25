import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Trash2,
  CheckCircle2,
  Layers,
  MapPin,
  ShieldAlert,
  Search,
} from 'lucide-react';
import { PharmacyHeader } from './PharmacyHeader';

export function PharmacyExpiryPage() {
  const t = useT();
  const toast = useToast();
  const [filterMode, setFilterMode] = useState<'30' | '60' | '90' | 'EXPIRED'>('60');
  const [search, setSearch] = useState('');

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

  // Statistics
  const stats = useMemo(() => {
    const totalCount = filteredBatches.length;
    const totalUnits = filteredBatches.reduce((acc, b) => acc + (b.remainingUnits || 0), 0);
    const estimatedValue = filteredBatches.reduce(
      (acc, b) => acc + (b.remainingUnits || 0) * (b.effectiveCostPerUnit || 0),
      0
    );
    return { totalCount, totalUnits, estimatedValue };
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

  const getDaysLabel = (expiryDateStr: string) => {
    try {
      const exp = new Date(expiryDateStr);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffMs = exp.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return `${Math.abs(diffDays)} ${t('days ago')}`;
      }
      if (diffDays === 0) {
        return t('Expires Today!');
      }
      return `${t('in')} ${diffDays} ${t('days')}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="space-y-4">
      {/* Shared Pharmacy Sub-Navigation */}
      <PharmacyHeader />

      {/* Critical Expired Alert Banner */}
      {filterMode === 'EXPIRED' && batchList.length > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-300 bg-red-50 p-4 text-xs text-red-900 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
          <ShieldAlert className="h-6 w-6 shrink-0 text-red-600" />
          <div className="flex-1">
            <h4 className="font-bold text-sm text-red-800 dark:text-red-200">
              {t('CRITICAL WARNING: Expired Inventory Detected!')}
            </h4>
            <p className="mt-0.5">
              {t(
                'These {count} batches have passed their expiry date. Remove them immediately from dispensing shelves to prevent dispensing to patients.',
                { count: batchList.length }
              )}
            </p>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Batches Monitored')}</span>
            <Layers className="h-4 w-4 text-primary-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{stats.totalCount}</div>
          <div className="text-[11px] text-muted">{t('Matching current FEFO filter')}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Remaining Units at Risk')}</span>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{stats.totalUnits.toLocaleString()}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {t('Units in shelves / racks')}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Estimated Cost Valuation')}</span>
            <Clock className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">
            Rs. {stats.estimatedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-muted">{t('At effective purchase rates')}</div>
        </div>
      </div>

      {/* Main Header */}
      <PageHeader
        title={t('Expiry Tracker & Batch Returns (FEFO)')}
        description={t(
          'First-Expiry-First-Out compliance: audit near-expiry batches, quarantine expired drugs, and issue wholesaler returns.'
        )}
      />

      {/* Filter Tabs & Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-surface p-3 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setFilterMode('EXPIRED')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              filterMode === 'EXPIRED'
                ? 'bg-red-600 text-white shadow-xs'
                : 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-300'
            }`}
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            <span>{t('Already Expired')}</span>
          </button>

          <button
            onClick={() => setFilterMode('30')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              filterMode === '30'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:border-amber-900/40 dark:bg-amber-950/40 dark:text-amber-300'
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            <span>{t('Within 30 Days')}</span>
          </button>

          <button
            onClick={() => setFilterMode('60')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              filterMode === '60'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'border border-border bg-surface-muted/50 text-muted hover:bg-surface-muted hover:text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{t('Within 60 Days')}</span>
          </button>

          <button
            onClick={() => setFilterMode('90')}
            className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition ${
              filterMode === '90'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'border border-border bg-surface-muted/50 text-muted hover:bg-surface-muted hover:text-foreground'
            }`}
          >
            <Clock className="h-3.5 w-3.5" />
            <span>{t('Within 90 Days')}</span>
          </button>
        </div>

        <div className="relative sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search batch, drug, rack...')}
            className="pl-9 text-xs h-8"
          />
        </div>
      </div>

      {/* Batches Table */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border/80 bg-surface-muted/60 text-xs font-bold uppercase text-muted">
              <tr>
                <th className="px-4 py-3.5">{t('Medicine / Formulation')}</th>
                <th className="px-4 py-3.5">{t('Batch Number')}</th>
                <th className="px-4 py-3.5">{t('Expiry Date & Window')}</th>
                <th className="px-4 py-3.5">{t('Remaining Stock')}</th>
                <th className="px-4 py-3.5">{t('Supplier Wholesaler')}</th>
                <th className="px-4 py-3.5">{t('Rack Location')}</th>
                <th className="px-4 py-3.5">{t('FEFO Status')}</th>
                <th className="px-4 py-3.5 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && !batches ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    <p className="mt-2 text-sm">{t('Scanning inventory batches...')}</p>
                  </td>
                </tr>
              ) : filteredBatches.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-emerald-500" />
                    <p className="font-semibold text-foreground">
                      {t('No batches matching this filter criteria.')}
                    </p>
                    <p className="text-xs text-muted">{t('All inventory within this range is currently compliant.')}</p>
                  </td>
                </tr>
              ) : (
                filteredBatches.map((b) => (
                  <tr key={b.id} className="hover:bg-surface-muted/40 transition">
                    <td className="px-4 py-3">
                      <div className="font-bold text-foreground">{b.itemName}</div>
                      <div className="text-xs text-muted">{b.genericName || '—'}</div>
                    </td>

                    <td className="px-4 py-3 font-mono font-bold text-xs text-foreground">
                      <span className="rounded bg-surface-muted px-2 py-0.5">
                        {b.batchNumber}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <div
                        className={`font-bold ${
                          b.isExpired
                            ? 'text-danger'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        {b.expiryDate}
                      </div>
                      <div className="text-[10px] text-muted">
                        {getDaysLabel(b.expiryDate)}
                      </div>
                    </td>

                    <td className="px-4 py-3 text-xs">
                      <span className="font-bold text-foreground">
                        {b.remainingPacks} Packs
                      </span>{' '}
                      <span className="text-muted">({b.remainingUnits} units)</span>
                    </td>

                    <td className="px-4 py-3 text-xs text-muted">
                      {b.wholesalerName || t('Direct')}
                    </td>

                    <td className="px-4 py-3 text-xs">
                      {b.rackLocation ? (
                        <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 font-medium text-foreground">
                          <MapPin className="h-3 w-3 text-muted" />
                          {b.rackLocation}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {b.isExpired ? (
                        <Badge tone="danger">EXPIRED</Badge>
                      ) : (
                        <Badge tone="warning">EXPIRING SOON</Badge>
                      )}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDiscard(b.id)}
                        className="text-danger hover:bg-danger/10 hover:text-danger h-7 text-xs"
                      >
                        <Trash2 className="mr-1 h-3.5 w-3.5" />
                        {t('Write-off Stock')}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default PharmacyExpiryPage;
