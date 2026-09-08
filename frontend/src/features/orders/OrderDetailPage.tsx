import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, CheckCircle2, Pencil } from 'lucide-react';
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
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/features/patients/format';
import { ordersApi } from './api';
import { ORDER_STATUS_TONE } from './types';
import { PricingSummary } from './PricingSummary';
import { OrderSamplesCard } from './OrderSamplesCard';
import { OrderReportCard } from './OrderReportCard';
import { OrderInvoiceCard } from './OrderInvoiceCard';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  const { data: order, loading, error, refetch } = useQuery(() => ordersApi.get(Number(id)), [id]);

  if (loading && !order) return <LoadingState label="Loading order…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!order) return null;

  const doConfirm = async () => {
    try {
      await ordersApi.confirm(order.id);
      toast.success('Order confirmed');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to confirm order');
      throw err;
    }
  };

  const doCancel = async (reason: string) => {
    try {
      await ordersApi.cancel(order.id, reason);
      toast.success('Order cancelled');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to cancel order');
      throw err;
    }
  };

  return (
    <>
      <Link
        to={`/app/patients/${order.patientId}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {order.patientName}
      </Link>

      <PageHeader
        title={`Order ${order.orderNumber}`}
        description={`Placed ${formatDate(order.orderedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{order.status}</Badge>
            {canWrite && order.status === 'DRAFT' && (
              <>
                <Button variant="secondary" onClick={() => navigate(`/app/orders/${order.id}/edit`)}>
                  <Pencil className="h-4 w-4" aria-hidden />
                  Edit
                </Button>
                <Button onClick={() => setConfirmOpen(true)}>
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Confirm
                </Button>
              </>
            )}
            {canWrite && order.status !== 'CANCELLED' && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <Ban className="h-4 w-4" aria-hidden />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      {order.status === 'CANCELLED' && (
        <div className="mb-4">
          <Alert tone="danger" title="Order cancelled">
            {order.cancelReason || 'No reason recorded.'} · {formatDate(order.cancelledAt)}
          </Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Tests" description={`${order.items.length} test(s)`} />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2">Test</th>
                  <th className="px-5 py-2">Dept.</th>
                  <th className="px-5 py-2 text-right">Rate</th>
                  <th className="px-5 py-2 text-center">Qty</th>
                  <th className="px-5 py-2 text-right">Discount</th>
                  <th className="px-5 py-2 text-right">Line total</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2">
                      <span className="font-medium text-foreground">{item.testName}</span>
                      <span className="ml-2 font-mono text-xs text-muted">{item.testCode}</span>
                    </td>
                    <td className="px-5 py-2 text-muted">{item.departmentName}</td>
                    <td className="px-5 py-2 text-right">{formatMoney(item.unitPrice)}</td>
                    <td className="px-5 py-2 text-center">{item.quantity}</td>
                    <td className="px-5 py-2 text-right">
                      {item.lineDiscount > 0 ? `− ${formatMoney(item.lineDiscount)}` : '—'}
                    </td>
                    <td className="px-5 py-2 text-right font-medium">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Patient & referral" />
            <CardBody className="space-y-2 text-sm">
              <div>
                <span className="text-muted">Patient</span>
                <p className="font-medium text-foreground">
                  {order.patientName} <span className="font-mono text-xs text-muted">{order.patientMrn}</span>
                </p>
              </div>
              <div>
                <span className="text-muted">Referring doctor</span>
                <p className="text-foreground">{order.referringDoctorName ?? '—'}</p>
              </div>
              {order.clinicalNotes && (
                <div>
                  <span className="text-muted">Clinical notes</span>
                  <p className="text-foreground">{order.clinicalNotes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Billing" />
            <CardBody>
              <PricingSummary pricing={order.pricing} />
              <p className="mt-3 text-xs text-muted">
                Invoicing and payments are handled in the billing module (Phase 4).
              </p>
            </CardBody>
          </Card>

          {order.status === 'CONFIRMED' && (
            <>
              <OrderInvoiceCard orderId={order.id} />
              <OrderSamplesCard orderId={order.id} />
              <OrderReportCard orderId={order.id} />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doConfirm}
        title="Confirm this order?"
        message="Once confirmed, the order is locked for editing and becomes available for sample collection."
        confirmLabel="Confirm order"
      />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={doCancel}
        title="Cancel this order?"
        message="This will cancel the whole order. This cannot be undone."
        confirmLabel="Cancel order"
        tone="danger"
        reason="required"
      />
    </>
  );
}
