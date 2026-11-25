import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { AlertOctagon, AlertTriangle, Clock, Trash2, CheckCircle2 } from 'lucide-react';

export function PharmacyExpiryPage() {
  const t = useT();
  const toast = useToast();
  const [filterMode, setFilterMode] = useState<'30' | '60' | '90' | 'EXPIRED'>('60');

  const { data: batches, loading, refetch } = useQuery(
    () => (filterMode === 'EXPIRED' ? pharmacyApi.batches.expired() : pharmacyApi.batches.expiring(parseInt(filterMode))),
    [filterMode]
  );

  const handleDiscard = async (id: number) => {
    if (!confirm(t('Discard/write-off remaining stock from this batch?'))) return;
    try {
      await pharmacyApi.batches.discard(id);
      toast.success(t('Batch stock written off'));
      refetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to discard batch'));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Expiry Tracker & Batch Returns')}
        description={t('FEFO compliance: monitor near-expiry batches (30/60/90 days), write off damaged or expired stock, and generate wholesaler return notes.')}
      />

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilterMode('EXPIRED')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            filterMode === 'EXPIRED'
              ? 'bg-red-600 text-white shadow'
              : 'bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-950/30 dark:text-red-400'
          }`}
        >
          <AlertOctagon className="h-4 w-4" />
          {t('Already Expired')}
        </button>

        <button
          onClick={() => setFilterMode('30')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            filterMode === '30'
              ? 'bg-amber-600 text-white shadow'
              : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          {t('Expiring within 30 Days')}
        </button>

        <button
          onClick={() => setFilterMode('60')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            filterMode === '60'
              ? 'bg-primary-600 text-white shadow'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          <Clock className="h-4 w-4" />
          {t('Expiring within 60 Days')}
        </button>

        <button
          onClick={() => setFilterMode('90')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition ${
            filterMode === '90'
              ? 'bg-primary-600 text-white shadow'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300'
          }`}
        >
          <Clock className="h-4 w-4" />
          {t('Expiring within 90 Days')}
        </button>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="border-b bg-gray-50 text-xs font-bold uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3">Medicine / Product</th>
              <th className="px-4 py-3">Batch Number</th>
              <th className="px-4 py-3">Expiry Date</th>
              <th className="px-4 py-3">Remaining Stock</th>
              <th className="px-4 py-3">Wholesaler</th>
              <th className="px-4 py-3">Rack Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && !batches ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  {t('Scanning batches...')}
                </td>
              </tr>
            ) : batches?.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  <CheckCircle2 className="mx-auto mb-2 h-6 w-6 text-green-500" />
                  {t('No batches matching this filter criteria. Inventory is safe!')}
                </td>
              </tr>
            ) : (
              batches?.map((b) => (
                <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="px-4 py-3">
                    <div className="font-bold text-gray-900 dark:text-gray-100">{b.itemName}</div>
                    <div className="text-xs text-gray-400">{b.genericName}</div>
                  </td>
                  <td className="px-4 py-3 font-mono font-bold text-xs text-gray-700 dark:text-gray-300">
                    {b.batchNumber}
                  </td>
                  <td className="px-4 py-3 font-bold text-xs">
                    <span className={b.isExpired ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'}>
                      {b.expiryDate}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    <span className="font-bold text-gray-900 dark:text-gray-100">
                      {b.remainingPacks} Packs
                    </span>{' '}
                    <span className="text-gray-400">({b.remainingUnits} units)</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {b.wholesalerName || 'Direct'}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 dark:text-gray-400">
                    {b.rackLocation || '—'}
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
                      className="text-red-500 hover:text-red-700"
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
  );
}
export default PharmacyExpiryPage;
