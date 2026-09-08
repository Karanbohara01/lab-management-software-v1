import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Minus, Pencil, PackagePlus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/features/patients/format';
import { inventoryApi } from './api';
import { ItemFormModal, IssueStockModal, ReceiveStockModal } from './InventoryModals';
import { CATEGORY_LABEL, STOCK_STATUS_LABEL, STOCK_STATUS_TONE, type InventoryBatch } from './types';

export function InventoryItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);

  const [editOpen, setEditOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [issueOpen, setIssueOpen] = useState(false);
  const [discard, setDiscard] = useState<InventoryBatch | null>(null);

  const { data: item, loading, error, refetch } = useQuery(() => inventoryApi.get(Number(id)), [id]);
  const txns = useQuery(() => inventoryApi.transactions(Number(id)), [id]);

  if (loading && !item) return <LoadingState label="Loading item…" />;
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
      toast.success('Batch discarded');
      refreshAll();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to discard');
      throw err;
    }
  };

  return (
    <>
      <Link to="/app/inventory" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Inventory
      </Link>

      <PageHeader
        title={item.name}
        description={`${item.code} · ${CATEGORY_LABEL[item.category]}${item.departmentName ? ` · ${item.departmentName}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={STOCK_STATUS_TONE[item.status]}>{STOCK_STATUS_LABEL[item.status]}</Badge>
            {canWrite && (
              <>
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </Button>
                <Button variant="secondary" onClick={() => setIssueOpen(true)} disabled={item.quantityOnHand <= 0}>
                  <Minus className="h-4 w-4" aria-hidden />
                  Issue
                </Button>
                <Button onClick={() => setReceiveOpen(true)}>
                  <PackagePlus className="h-4 w-4" aria-hidden />
                  Receive
                </Button>
              </>
            )}
          </div>
        }
      />

      <div className="mb-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="On hand" value={`${item.quantityOnHand} ${item.unit}`} />
        <Stat label="Minimum" value={`${item.minimumStock} ${item.unit}`} />
        <Stat label="Batches" value={String(item.batches.length)} />
        <Stat label="Status" value={STOCK_STATUS_LABEL[item.status]} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Batches" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2">Batch</th>
                  <th className="px-5 py-2">Expiry</th>
                  <th className="px-5 py-2 text-right">Remaining</th>
                  <th className="px-5 py-2" />
                </tr>
              </thead>
              <tbody>
                {item.batches.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-4 text-muted">
                      No batches — receive stock to add one.
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
                            aria-label={`Discard batch ${b.batchNumber}`}
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
          <CardHeader title="Stock movements" />
          <div className="max-h-96 overflow-y-auto">
            {txns.loading ? (
              <LoadingState />
            ) : !txns.data || txns.data.content.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">No movements yet.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {txns.data.content.map((t) => (
                  <li key={t.id} className="flex items-center justify-between px-5 py-2.5">
                    <div>
                      <span className="font-medium text-foreground">{t.type}</span>
                      {t.batchNumber && <span className="ml-1 text-xs text-muted">· {t.batchNumber}</span>}
                      {t.reason && <p className="text-xs text-muted">{t.reason}</p>}
                      <p className="text-xs text-muted">
                        {new Date(t.occurredAt).toLocaleString()} · {t.performedBy}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className={t.quantity < 0 ? 'text-danger' : 'text-success'}>
                        {t.quantity > 0 ? '+' : ''}
                        {t.quantity}
                      </span>
                      <p className="text-xs text-muted">bal {t.balanceAfter}</p>
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
        title={`Discard batch ${discard?.batchNumber ?? ''}?`}
        message="The full remaining quantity is written off as wastage. This cannot be undone."
        confirmLabel="Discard batch"
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
