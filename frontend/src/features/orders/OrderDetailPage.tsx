import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ban, Pencil } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { LinkFrom, useBackTarget, useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { formatDate } from '@/features/patients/format';
import { samplesApi } from '@/features/samples/api';
import type { SampleListItem } from '@/features/samples/types';
import { CollectSampleModal } from '@/features/samples/CollectSampleModal';
import { ReceiveSampleModal } from '@/features/samples/ReceiveSampleModal';
import { resultsApi } from '@/features/results/api';
import { approveWithPrompts, verifyWithPrompts } from '@/features/results/overrides';
import { reportsApi } from '@/features/reports/api';
import { DeliverReportModal } from '@/features/reports/DeliverReportModal';
import { useT } from '@/i18n';
import { ordersApi } from './api';
import { ORDER_STATUS_TONE, type OrderStatus } from './types';
import { PricingSummary } from './PricingSummary';
import { OrderSamplesCard } from './OrderSamplesCard';
import { OrderResultsCard } from './OrderResultsCard';
import { OrderReportCard } from './OrderReportCard';
import { OrderInvoiceCard } from './OrderInvoiceCard';
import { OrderWorkflow, computeStage, type WorkflowAction } from './OrderWorkflow';

/** OrderStatus has no shared label map (just a tone map) — the raw value doubles as the label. */
const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  DRAFT: 'Draft',
  CONFIRMED: 'Confirmed',
  CANCELLED: 'Cancelled',
};

export function OrderDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigateFrom();
  const { back } = useBackTarget();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  // Owned here, not by OrderReportCard, so the workflow bar's "Deliver report" and the card's own
  // button open the exact same modal instead of one of them navigating away to a different screen.
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [busyRow, setBusyRow] = useState<number | null>(null);
  // Collecting and receiving go through the same capture modals the Sample page uses — never a
  // bare API call — so container, collection site and specimen condition are actually recorded.
  // Held as a run (remaining items + original total) so the workflow bar's "Collect samples" /
  // "Receive into lab" walk every eligible sample one modal at a time; cancelling stops the run.
  const [collectRun, setCollectRun] = useState<SampleListItem[]>([]);
  const [receiveRun, setReceiveRun] = useState<SampleListItem[]>([]);
  const [runTotal, setRunTotal] = useState(0);
  const startRun = (setter: typeof setCollectRun, items: SampleListItem[]) => {
    setRunTotal(items.length);
    setter(items);
  };
  const progressOf = (remaining: SampleListItem[]) =>
    runTotal > 1 ? { current: runTotal - remaining.length + 1, total: runTotal } : undefined;

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

  if (loading && !order) return <LoadingState label={t('Loading order…')} />;
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
        toast.error(
          first.reason instanceof ApiError ? first.reason.message : t('{count} item(s) failed', { count: failed.length }),
        );
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
        return startRun(setCollectRun, samples.filter((s) => s.status === 'AWAITING_COLLECTION'));
      case 'receive':
        return startRun(setReceiveRun, samples.filter((s) => s.status === 'COLLECTED'));
      case 'enter': {
        const first = results.find((r) => r.status === 'PENDING');
        if (first) navigate(`/app/results/${first.id}`);
        return;
      }
      // Bulk never overrides: an incomplete panel needs a documented reason, given one result at
      // a time on its own page, so those are skipped here and said so rather than failing the lot.
      case 'verify': {
        const ready = results.filter((r) => r.status === 'ENTERED');
        const complete = ready.filter((r) => r.complete);
        if (complete.length < ready.length) {
          toast.info(t('{count} incomplete result(s) skipped — open each to verify it as partial.', { count: ready.length - complete.length }));
        }
        if (complete.length === 0) return;
        return bulk(t('Results verified'), complete.map((r) => resultsApi.verify(r.id)));
      }
      case 'approve': {
        const ready = results.filter((r) => r.status === 'VERIFIED');
        const complete = ready.filter((r) => r.complete);
        if (complete.length < ready.length) {
          toast.info(t('{count} incomplete result(s) skipped — open each to approve it as partial.', { count: ready.length - complete.length }));
        }
        if (complete.length === 0) return;
        return bulk(t('Results approved'), complete.map((r) => resultsApi.approve(r.id)));
      }
      case 'report':
        return bulk(t('Report generated'), [reportsApi.generate(order.id, false)]);
      case 'release': {
        const creds = window.prompt(t('Signing credentials (e.g. "MD Pathology, NMC-12345"):'), '');
        if (creds === null || !report) return;
        return bulk(t('Report signed & released'), [reportsApi.release(report.id, creds.trim() || undefined)]);
      }
      case 'deliver':
        if (!report) return;
        return setDeliverOpen(true);
    }
  };

  const rowVerify = async (rid: number) => {
    setBusyRow(rid);
    try {
      const outcome = await verifyWithPrompts(rid, {
        incomplete: t('Enter a documented reason to verify this result as partial:'),
        other: t('Enter a documented reason to verify it yourself:'),
      });
      if (outcome.ok) {
        toast.success(outcome.overridden ? t('Result verified with override') : t('Result verified'));
        reload();
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('Unable to verify'));
    } finally {
      setBusyRow(null);
    }
  };

  const rowApprove = async (rid: number) => {
    setBusyRow(rid);
    try {
      const outcome = await approveWithPrompts(rid, {
        incomplete: t('Enter a documented reason to approve this result as partial:'),
        other: t('Enter a documented reason to approve despite the QC failure:'),
      });
      if (outcome.ok) {
        toast.success(outcome.overridden ? t('Result approved with override') : t('Result approved'));
        reload();
      }
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('Unable to approve'));
    } finally {
      setBusyRow(null);
    }
  };

  const doConfirm = async () => {
    try {
      await ordersApi.confirm(order.id);
      toast.success(t('Order confirmed'));
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to confirm order'));
      throw err;
    }
  };

  const doCancel = async (reason: string) => {
    try {
      await ordersApi.cancel(order.id, reason);
      toast.success(t('Order cancelled'));
      reload();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to cancel order'));
      throw err;
    }
  };

  return (
    <>
      <PageHeader
        back={back}
        title={t('Order {number}', { number: order.orderNumber })}
        description={t('{patient} · {mrn} · placed {date}', {
          patient: order.patientName,
          mrn: order.patientMrn,
          date: formatDate(order.orderedAt),
        })}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {order.priority !== 'ROUTINE' && (
              <Badge tone={order.priority === 'STAT' ? 'critical' : 'warning'}>{order.priority}</Badge>
            )}
            <Badge tone={ORDER_STATUS_TONE[order.status]}>{t(ORDER_STATUS_LABEL[order.status])}</Badge>
            {canWrite && order.status === 'DRAFT' && (
              <Button variant="secondary" onClick={() => navigate(`/app/orders/${order.id}/edit`)}>
                <Pencil className="h-4 w-4" aria-hidden />
                {t('Edit')}
              </Button>
            )}
            {canWrite && order.status !== 'CANCELLED' && (
              <Button variant="danger" onClick={() => setCancelOpen(true)}>
                <Ban className="h-4 w-4" aria-hidden />
                {t('Cancel')}
              </Button>
            )}
          </div>
        }
      />

      {order.status === 'CANCELLED' ? (
        <div className="mb-4">
          <Alert tone="danger" title={t('Order cancelled')}>
            {order.cancelReason || t('No reason recorded.')} · {formatDate(order.cancelledAt)}
          </Alert>
        </div>
      ) : (
        <OrderWorkflow stage={stage} busy={busy} onAction={runAction} />
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title={t('Tests')} description={t('{count} test(s)', { count: order.items.length })} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-label uppercase text-muted">
                    <th className="px-5 py-2">{t('Test')}</th>
                    <th className="px-5 py-2">{t('Dept.')}</th>
                    <th className="px-5 py-2 text-right">{t('Rate')}</th>
                    <th className="px-5 py-2 text-center">{t('Qty')}</th>
                    <th className="px-5 py-2 text-right">{t('Discount')}</th>
                    <th className="px-5 py-2 text-right">{t('Line total')}</th>
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
                onCollect={(s) => startRun(setCollectRun, [s])}
                onReceive={(s) => startRun(setReceiveRun, [s])}
              />
              <OrderResultsCard
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
            <CardHeader title={t('Patient & referral')} />
            <CardBody className="space-y-2 text-sm">
              <div>
                <span className="text-muted">{t('Patient')}</span>
                <p className="font-medium text-foreground">
                  <LinkFrom to={`/app/patients/${order.patientId}`} className="hover:underline">
                    {order.patientName}
                  </LinkFrom>{' '}
                  <span className="font-mono text-xs text-muted">{order.patientMrn}</span>
                </p>
              </div>
              <div>
                <span className="text-muted">{t('Referring doctor')}</span>
                <p className="text-foreground">{order.referringDoctorName ?? '—'}</p>
              </div>
              {order.clinicalNotes && (
                <div>
                  <span className="text-muted">{t('Clinical notes')}</span>
                  <p className="text-foreground">{order.clinicalNotes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Billing')} />
            <CardBody>
              <PricingSummary pricing={order.pricing} />
            </CardBody>
          </Card>

          {confirmed && (
            <>
              <OrderInvoiceCard orderId={order.id} />
              <OrderReportCard
                orderId={order.id}
                report={report}
                loading={reportQ.loading && !reportQ.data}
                hasApprovedResults={results.some((r) => r.status === 'APPROVED')}
                onChange={reload}
                onDeliver={() => setDeliverOpen(true)}
              />
            </>
          )}
        </div>
      </div>

      {collectRun[0] && (
        <CollectSampleModal
          key={collectRun[0].id}
          open
          sample={collectRun[0]}
          progress={progressOf(collectRun)}
          onClose={() => setCollectRun([])}
          onDone={() => {
            reload();
            setCollectRun((r) => r.slice(1));
          }}
        />
      )}
      {receiveRun[0] && (
        <ReceiveSampleModal
          key={receiveRun[0].id}
          open
          sampleId={receiveRun[0].id}
          accession={receiveRun[0].accessionNumber}
          progress={progressOf(receiveRun)}
          onClose={() => setReceiveRun([])}
          onReceived={() => {
            reload();
            setReceiveRun((r) => r.slice(1));
          }}
        />
      )}
      {report && (
        <DeliverReportModal open={deliverOpen} onClose={() => setDeliverOpen(false)} reportId={report.id} onDone={reload} />
      )}
      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={doConfirm}
        title={t('Confirm this order?')}
        message={t('Once confirmed, the order is locked for editing and samples are generated for collection.')}
        confirmLabel={t('Confirm order')}
      />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={doCancel}
        title={t('Cancel this order?')}
        message={t('This will cancel the whole order. This cannot be undone.')}
        confirmLabel={t('Cancel order')}
        tone="danger"
        reason="required"
      />
    </>
  );
}
