import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Minus, Pencil, PackagePlus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useBackTarget } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/features/patients/format';
import { LOCALE_TAG, getLocale, useT } from '@/i18n';
import { inventoryApi } from './api';
import { ItemFormModal, IssueStockModal, ReceiveStockModal } from './InventoryModals';
import { CATEGORY_LABEL, STOCK_STATUS_LABEL, STOCK_STATUS_TONE, type InventoryBatch } from './types';

const TRANSACTION_TYPE_LABEL: Record<string, string> = {
  RECEIPT: 'Receipt',
  ISSUE: 'Issue',
  ADJUSTMENT: 'Adjustment',
  WASTAGE: 'Wastage',
  RETURN: 'Return',
};

export function InventoryItemDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const { back } = useBackTarget();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);

  const [editOpen, setEditOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [discard, setDiscard] = useState<InventoryBatch | null>(null);

  const { data: item, loading, error, refetch } = useQuery(() => inventoryApi.get(Number(id)), [id]);
  const txns = useQuery(() => inventoryApi.transactions(Number(id)), [id]);

  if (loading && !item) return <LoadingState label={t('Loading item…')} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!item) return null;

  const refreshAll = () => {
    refetch();
    txns.refetch();
  };

  const doDiscard = async (reason: string) => {
    if (!discard) return;
    try {
      await inventoryApi.discardBatch(discard.id, reason);
      toast.success(t('Batch discarded'));
      refreshAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to discard'));
      throw err;
    }
  };

  return (
    <>
      <PageHeader
        back={back}
        title={item.name}
        description={`${item.code} · ${t(CATEGORY_LABEL[item.category])}${item.departmentName ? ` · ${item.departmentName}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STOCK_STATUS_TONE[item.status]}>{t(STOCK_STATUS_LABEL[item.status])}</Badge>
            {canWrite && (
              <>
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  {t('Edit')}
                </Button>
                <Button variant="secondary" onClick={() => setIssueOpen(true)} disabled={item.quantityOnHand <= 0}>
                  <Minus className="h-4 w-4" aria-hidden />
                  {t('Issue')}
                </Button>
                <Button onClick={() => setReceiveOpen(true)}>
                  <PackagePlus className="h-4 w-4" aria-hidden />
                  {t('Receive')}
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label={t('On hand')} value={`${item.quantityOnHand} ${item.unit}`} />
        <Stat label={t('Minimum')} value={`${item.minimumStock} ${item.unit}`} />
        <Stat label={t('Batches')} value={String(item.batches.length)} />
        <Stat label={t('Status')} value={t(STOCK_STATUS_LABEL[item.status])} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader title={t('Batches')} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-label uppercase text-muted">
                  <th className="px-5 py-2">{t('Batch')}</th>
                  <th className="px-5 py-2">{t('Expiry')}</th>
                  <th className="px-5 py-2 text-right">{t('Remaining')}</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {item.batches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-muted">
                      {t('No batches — receive stock to add one.')}
                    </td>
                  </tr>
                ) : (
                  item.batches.map((b) => (
                    <tr key={b.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2">
                        <span className="font-medium text-foreground">{b.batchNumber}</span>
                        {b.supplierName && <span className="ml-1 text-xs text-muted">· {b.supplierName}</span>}
                      </td>
                      <td className="px-5 py-2">
                        {b.expiryDate ? (
                          <span className={b.expired ? 'font-medium text-critical' : b.expiringSoon ? 'font-medium text-warning' : ''}>
                            {formatDate(b.expiryDate)}
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-5 py-2 text-right">
                        {b.remainingQuantity} {item.unit}
                      </td>
                      <td className="px-5 py-2 text-right">
                        {canWrite && b.remainingQuantity > 0 && (
                          <button
                            onClick={() => setDiscard(b)}
                            className="text-muted hover:text-danger"
                            aria-label={t('Discard batch {batch}', { batch: b.batchNumber })}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>

        <Card>
          <CardHeader title={t('Stock movements')} />
          <div className="max-h-96 overflow-y-auto">
            {txns.loading ? (
              <LoadingState />
            ) : !txns.data || txns.data.content.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">{t('No movements yet.')}</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {txns.data.content.map((txn) => (
                  <li key={txn.id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <span className="font-medium text-foreground">{t(TRANSACTION_TYPE_LABEL[txn.type] ?? txn.type)}</span>
                      {txn.batchNumber && <span className="ml-1 text-xs text-muted">· {txn.batchNumber}</span>}
                      {txn.reason && <p className="text-xs text-muted">{txn.reason}</p>}
                      <p className="text-xs text-muted">
                        {new Date(txn.occurredAt).toLocaleString(LOCALE_TAG[getLocale()])} · {txn.performedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={txn.quantity < 0 ? 'text-danger' : 'text-success'}>
                        {txn.quantity > 0 ? '+' : ''}
                        {txn.quantity}
                      </span>
                      <p className="text-xs text-muted">{t('bal {balance}', { balance: txn.balanceAfter })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>

      <ItemFormModal open={editOpen} onClose={() => setEditOpen(false)} item={item} onSaved={refreshAll} />
      <ReceiveStockModal open={receiveOpen} onClose={() => setReceiveOpen(false)} item={item} onDone={refreshAll} />
      <IssueStockModal open={issueOpen} onClose={() => setIssueOpen(false)} item={item} onDone={refreshAll} />
      <ConfirmDialog
        open={!!discard}
        onClose={() => setDiscard(null)}
        onConfirm={doDiscard}
        title={t('Discard batch {batch}?', { batch: discard?.batchNumber ?? '' })}
        message={t('The full remaining quantity is written off as wastage. This cannot be undone.')}
        confirmLabel={t('Discard batch')}
        tone="danger"
        reason="required"
      />
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card px-4 py-3">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
    </div>
  );
}
