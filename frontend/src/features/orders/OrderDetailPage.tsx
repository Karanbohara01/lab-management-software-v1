import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Pencil } from 'lucide-react';
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
import { samplesApi } from '@/features/samples/api';
import { resultsApi } from '@/features/results/api';
import { reportsApi } from '@/features/reports/api';
import { ordersApi } from './api';
import { ORDER_STATUS_TONE } from './types';
import { PricingSummary } from './PricingSummary';
import { OrderSamplesCard } from './OrderSamplesCard';
import { OrderResultsCard } from './OrderResultsCard';
import { OrderReportCard } from './OrderReportCard';
import { OrderInvoiceCard } from './OrderInvoiceCard';
import { OrderWorkflow, computeStage, type WorkflowAction } from './OrderWorkflow';

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<number | null>(null);

  const { data: order, loading, error, refetch } = useQuery(() => ordersApi.get(Number(id)), [id]);
  const confirmed = !!order && order.status === 'CONFIRMED';

  const samplesQ = useQuery(
    () => (confirmed ? samplesApi.list({ orderId: Number(id), size: 100 }) : Promise.resolve(null)),
    [id, confirmed],
  );
  const resultsQ = useQuery(
    () => (confirmed ? resultsApi.list({ orderId: Number(id), size: 100 }) : Promise.resolve(null)),
    [id, confirmed],
  );
  const reportQ = useQuery(
    () =>
      confirmed
        ? reportsApi
            .getByOrder(Number(id))
            .catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e)))
        : Promise.resolve(null),
    [id, confirmed],
  );

  if (loading && !order) return <LoadingState label="Loading order…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!order) return null;

  const samples = samplesQ.data?.content ?? [];
  const results = resultsQ.data?.content ?? [];
  const report = reportQ.data ?? null;

  const reload = () => {
    refetch();
    samplesQ.refetch();
    resultsQ.refetch();
    reportQ.refetch();
  };

  const stage = computeStage(order, samples, results, report);

  const bulk = async (label: string, work: Promise<unknown>[]) => {
    setBusy(true);
    try {
      const outcomes = await Promise.allSettled(work);
      const failed = outcomes.filter((o) => o.status === 'rejected');
      if (failed.length) {
        const first = failed[0] as PromiseRejectedResult;
        toast.error(first.reason instanceof ApiError ? first.reason.message : `${failed.length} item(s) failed`);
      } else {
        toast.success(label);
      }
      reload();
    } finally {
      setBusy(false);
    }
  };

  const runAction = (action: WorkflowAction) => {
    switch (action) {
      case 'confirm':
        return setConfirmOpen(true);
      case 'collect':
        return bulk(
          'Samples collected',
          samples.filter((s) => s.status === 'AWAITING_COLLECTION').map((s) => samplesApi.collect(s.id, {})),
        );
      case 'receive':
        return bulk(
          'Samples received into the lab',
          samples.filter((s) => s.status === 'COLLECTED').map((s) => samplesApi.receive(s.id)),
        );
      case 'enter': {
        const first = results.find((r) => r.status === 'PENDING');
        if (first) navigate(`/app/results/${first.id}?from=order:${order.id}`);
        return;
      }
      case 'verify':
        return bulk(
          'Results verified',
          results.filter((r) => r.status === 'ENTERED').map((r) => resultsApi.verify(r.id)),
        );
      case 'approve':
        return bulk(
          'Results authorized',
          results.filter((r) => r.status === 'VERIFIED').map((r) => resultsApi.approve(r.id)),
        );
      case 'report':
        return bulk('Report generated', [reportsApi.generate(order.id, false)]);
      case 'release': {
        const creds = window.prompt('Signing credentials (e.g. "MD Pathology, NMC-12345"):', '');
        if (creds === null || !report) return;
        return bulk('Report signed & released', [reportsApi.release(report.id, creds.trim() || undefined)]);
      }
      case 'deliver': {
        if (!report) return;
        // Delivery needs a method + recipient — hand off to the report page's proper dialog
        // (SMS/WhatsApp there surface a clear error if no gateway is configured) instead of a prompt.
        navigate(`/app/reports/${report.id}`);
        return;
      }
    }
  };

  const rowCollect = async (sid: number) => {
    setBusyRow(sid);
    try {
      await samplesApi.collect(sid, {});
      toast.success('Sample collected');
      reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const reason = window.prompt(`${e.message}\n\nEnter a reason to collect without payment:`);
        if (reason && reason.trim()) {
          try {
            await samplesApi.collect(sid, { paymentOverrideReason: reason.trim() });
            toast.success('Sample collected without payment');
            reload();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Failed');
          }
        }
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Unable to collect sample');
      }
    } finally {
      setBusyRow(null);
    }
  };

  const rowVerify = async (rid: number) => {
    setBusyRow(rid);
    try {
      await resultsApi.verify(rid);
      toast.success('Result verified');
      reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const reason = window.prompt(`${e.message}\n\nEnter a documented reason to verify it yourself:`);
        if (reason && reason.trim()) {
          try {
            await resultsApi.verify(rid, reason.trim());
            toast.success('Result verified with override');
            reload();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Failed');
          }
        }
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Unable to verify');
      }
    } finally {
      setBusyRow(null);
    }
  };

  const rowApprove = async (rid: number) => {
    setBusyRow(rid);
    try {
      await resultsApi.approve(rid);
      toast.success('Result authorized');
      reload();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        const reason = window.prompt(`${e.message}\n\nEnter a documented reason to authorize anyway:`);
        if (reason && reason.trim()) {
          try {
            await resultsApi.approve(rid, reason.trim());
            toast.success('Result authorized with override');
            reload();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Failed');
          }
        }
      } else {
        toast.error(e instanceof ApiError ? e.message : 'Unable to authorize');
      }
    } finally {
      setBusyRow(null);
    }
  };

  const doConfirm = async () => {
    try {
      await ordersApi.confirm(order.id);
      toast.success('Order confirmed');
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to confirm order');
      throw err;
    }
  };

  const doCancel = async (reason: string) => {
    try {
      await ordersApi.cancel(order.id, reason);
      toast.success('Order cancelled');
      reload();
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
        description={`${order.patientName} · ${order.patientMrn} · placed ${formatDate(order.orderedAt)}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{order.status}</Badge>
            {canWrite && order.status === 'DRAFT' && (
              <Button variant="secondary" onClick={() => navigate(`/app/orders/${order.id}/edit`)}>
                <Pencil className="h-4 w-4" aria-hidden />
                Edit
              </Button>
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

      {order.status === 'CANCELLED' ? (
        <div className="mb-4">
          <Alert tone="danger" title="Order cancelled">
            {order.cancelReason || 'No reason recorded.'} · {formatDate(order.cancelledAt)}
          </Alert>
        </div>
      ) : (
        <OrderWorkflow stage={stage} busy={busy} onAction={runAction} />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
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

          {confirmed && (
            <>
              <OrderSamplesCard
                samples={samples}
                busyId={busyRow}
                onCollect={rowCollect}
                onReload={reload}
              />
              <OrderResultsCard
                orderId={order.id}
                results={results}
                busyId={busyRow}
                onVerify={rowVerify}
                onApprove={rowApprove}
              />
            </>
          )}
        </div>

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
            </CardBody>
          </Card>

          {confirmed && (
            <>
              <OrderInvoiceCard orderId={order.id} />
              <OrderReportCard orderId={order.id} onChange={reload} />
            </>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doConfirm}
        title="Confirm this order?"
        message="Once confirmed, the order is locked for editing and samples are generated for collection."
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
