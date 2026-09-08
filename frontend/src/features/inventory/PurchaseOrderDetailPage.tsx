import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, PackageCheck, Pencil, Send } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/features/patients/format';
import { purchaseOrdersApi } from './api';
import { PurchaseOrderBuilderModal, ReceivePurchaseOrderModal } from './PurchaseOrderModals';
import { PO_STATUS_TONE } from './types';

export function PurchaseOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);

  const [editOpen, setEditOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: po, loading, error, refetch } = useQuery(() => purchaseOrdersApi.get(Number(id)), [id]);

  if (loading && !po) return <LoadingState label="Loading purchase order…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!po) return null;

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const canReceive = po.status === 'SUBMITTED' || po.status === 'PARTIALLY_RECEIVED';

  return (
    <>
      <Link to="/app/purchase-orders" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Purchase orders
      </Link>

      <PageHeader
        title={po.poNumber}
        description={`${po.supplierName}${po.expectedDate ? ` · expected ${formatDate(po.expectedDate)}` : ''}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={PO_STATUS_TONE[po.status]}>{po.status.replace(/_/g, ' ')}</Badge>
            {canWrite && po.status === 'DRAFT' && (
              <>
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </Button>
                <Button loading={busy} onClick={() => act(() => purchaseOrdersApi.submit(po.id), 'Purchase order submitted')}>
                  <Send className="h-4 w-4" aria-hidden />
                  Submit
                </Button>
              </>
            )}
            {canWrite && canReceive && (
              <Button onClick={() => setReceiveOpen(true)}>
                <PackageCheck className="h-4 w-4" aria-hidden />
                Receive
              </Button>
            )}
            {canWrite && po.status !== 'RECEIVED' && po.status !== 'CANCELLED' && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <Ban className="h-4 w-4" aria-hidden />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      {po.status === 'CANCELLED' && (
        <div className="mb-4">
          <Alert tone="danger" title="Cancelled">
            {po.cancelReason}
          </Alert>
        </div>
      )}

      <Card>
        <CardHeader title="Lines" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-2">Item</th>
                <th className="px-5 py-2 text-right">Ordered</th>
                <th className="px-5 py-2 text-right">Received</th>
                <th className="px-5 py-2 text-right">Est. cost</th>
              </tr>
            </thead>
            <tbody>
              {po.lines.map((l) => (
                <tr key={l.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-2">
                    <span className="font-medium text-foreground">{l.itemName}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{l.itemCode}</span>
                  </td>
                  <td className="px-5 py-2 text-right">{l.quantityOrdered} {l.unit}</td>
                  <td className="px-5 py-2 text-right">
                    <span className={l.quantityReceived >= l.quantityOrdered ? 'text-success' : ''}>
                      {l.quantityReceived} {l.unit}
                    </span>
                  </td>
                  <td className="px-5 py-2 text-right">{l.estimatedUnitCost != null ? l.estimatedUnitCost : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {po.notes && <CardBody className="text-sm text-muted">{po.notes}</CardBody>}
      </Card>

      <PurchaseOrderBuilderModal open={editOpen} onClose={() => setEditOpen(false)} po={po} onSaved={() => refetch()} />
      <ReceivePurchaseOrderModal open={receiveOpen} onClose={() => setReceiveOpen(false)} po={po} onDone={refetch} />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          await act(() => purchaseOrdersApi.cancel(po.id, reason), 'Purchase order cancelled');
          setCancelOpen(false);
        }}
        title="Cancel this purchase order?"
        message="Already-received stock stays in inventory. Outstanding lines are cancelled."
        confirmLabel="Cancel PO"
        tone="danger"
        reason="required"
      />
    </>
  );
}
