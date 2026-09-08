import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, Banknote, Pencil, Printer, RotateCcw, Send } from 'lucide-react';
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
import { invoicesApi } from './api';
import {
  INVOICE_STATUS_TONE,
  PAYMENT_METHOD_LABEL,
  PAYMENT_STATUS_TONE,
  REFUND_STATUS_TONE,
} from './types';
import { AdjustInvoiceModal, RecordPaymentModal, RequestRefundModal } from './InvoiceActionModals';
import { InvoiceIrdCard } from './InvoiceIrdCard';

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export function InvoiceDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { hasPermission } = useAuth();

  const [payOpen, setPayOpen] = useState(false);
  const [adjustOpen, setAdjustOpen] = useState(false);
  const [refundOpen, setRefundOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: inv, loading, error, refetch } = useQuery(() => invoicesApi.get(Number(id)), [id]);

  if (loading && !inv) return <LoadingState label="Loading invoice…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!inv) return null;

  const canWrite = hasPermission(PERMISSIONS.INVOICE_WRITE);
  const canCancel = hasPermission(PERMISSIONS.INVOICE_CANCEL);
  const canPay = hasPermission(PERMISSIONS.PAYMENT_WRITE);
  const canRefund = hasPermission(PERMISSIONS.REFUND_REQUEST);

  const issue = async () => {
    setBusy(true);
    try {
      const updated = await invoicesApi.issue(inv.id);
      toast.success(`Invoice ${updated.invoiceNumber} issued`);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to issue invoice');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (reason: string) => {
    try {
      await invoicesApi.cancel(inv.id, reason);
      toast.success('Invoice cancelled');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to cancel');
      throw err;
    }
  };

  return (
    <>
      <div data-print-hide>
        <Link
          to={`/app/orders/${inv.orderId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Order {inv.orderNumber}
        </Link>
        <PageHeader
          title={inv.invoiceNumber ?? 'Draft invoice'}
          description={`${inv.patientName} · ${inv.patientMrn}`}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={INVOICE_STATUS_TONE[inv.status]}>{inv.status}</Badge>
              <Badge tone={PAYMENT_STATUS_TONE[inv.paymentStatus]}>{inv.paymentStatus}</Badge>
              {inv.status === 'ISSUED' && (
                <Button variant="secondary" onClick={() => window.print()}>
                  <Printer className="h-4 w-4" aria-hidden />
                  Print
                </Button>
              )}
              {canWrite && inv.status === 'DRAFT' && (
                <>
                  <Button variant="secondary" onClick={() => setAdjustOpen(true)}>
                    <Pencil className="h-4 w-4" aria-hidden />
                    Adjust
                  </Button>
                  <Button loading={busy} onClick={issue}>
                    <Send className="h-4 w-4" aria-hidden />
                    Issue
                  </Button>
                </>
              )}
              {canPay && inv.status === 'ISSUED' && inv.balance > 0 && (
                <Button onClick={() => setPayOpen(true)}>
                  <Banknote className="h-4 w-4" aria-hidden />
                  Record payment
                </Button>
              )}
              {canRefund && inv.amountPaid - inv.amountRefunded > 0 && (
                <Button variant="secondary" onClick={() => setRefundOpen(true)}>
                  <RotateCcw className="h-4 w-4" aria-hidden />
                  Refund
                </Button>
              )}
              {canCancel && inv.status !== 'CANCELLED' && inv.amountPaid === 0 && (
                <Button variant="danger" onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" aria-hidden />
                  Cancel
                </Button>
              )}
            </div>
          }
        />
      </div>

      {inv.status === 'CANCELLED' && (
        <div className="mb-4" data-print-hide>
          <Alert tone="danger" title="Invoice cancelled">
            {inv.cancelReason}
          </Alert>
        </div>
      )}

      <div id="report-print" className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Line items" />
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                  <th className="px-5 py-2">Test</th>
                  <th className="px-5 py-2 text-right">Rate</th>
                  <th className="px-5 py-2 text-center">Qty</th>
                  <th className="px-5 py-2 text-right">Disc.</th>
                  <th className="px-5 py-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {inv.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-2">
                      <span className="font-medium text-foreground">{item.testName}</span>
                      <span className="ml-2 font-mono text-xs text-muted">{item.testCode}</span>
                    </td>
                    <td className="px-5 py-2 text-right">{formatMoney(item.unitPrice)}</td>
                    <td className="px-5 py-2 text-center">{item.quantity}</td>
                    <td className="px-5 py-2 text-right">{item.lineDiscount > 0 ? `− ${formatMoney(item.lineDiscount)}` : '—'}</td>
                    <td className="px-5 py-2 text-right font-medium">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <CardBody>
            <div className="ml-auto max-w-xs space-y-1 text-sm">
              <Row label="Subtotal" value={formatMoney(inv.subtotal)} />
              {inv.discountAmount > 0 && <Row label="Discount" value={`− ${formatMoney(inv.discountAmount)}`} />}
              {inv.taxRate > 0 && <Row label={`Tax (${inv.taxRate}%)`} value={formatMoney(inv.taxAmount)} />}
              <div className="border-t border-border pt-1">
                <Row label="Total" value={formatMoney(inv.totalAmount)} strong />
              </div>
              <Row label="Paid" value={formatMoney(inv.amountPaid)} />
              {inv.amountRefunded > 0 && <Row label="Refunded" value={`− ${formatMoney(inv.amountRefunded)}`} />}
              <Row label="Balance" value={formatMoney(inv.balance)} strong />
            </div>
          </CardBody>
        </Card>

        <div className="space-y-4">
          <Card data-print-hide>
            <CardHeader title="Payments" />
            {inv.payments.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted">No payments recorded.</p>
            ) : (
              <ul className="divide-y divide-border text-sm">
                {inv.payments.map((p) => (
                  <li key={p.id} className="px-5 py-3">
                    <div className="flex justify-between">
                      <span className={p.reversed ? 'text-muted line-through' : 'font-medium text-foreground'}>
                        {formatMoney(p.amount)}
                      </span>
                      <span className="text-muted">{PAYMENT_METHOD_LABEL[p.method]}</span>
                    </div>
                    <p className="text-xs text-muted">
                      {dt(p.receivedAt)} · {p.receivedBy}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {inv.status === 'ISSUED' && <div data-print-hide><InvoiceIrdCard invoiceId={inv.id} /></div>}

          {inv.refunds.length > 0 && (
            <Card data-print-hide>
              <CardHeader title="Refunds" />
              <ul className="divide-y divide-border text-sm">
                {inv.refunds.map((r) => (
                  <li key={r.id} className="px-5 py-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-foreground">{formatMoney(r.amount)}</span>
                      <Badge tone={REFUND_STATUS_TONE[r.status]}>{r.status}</Badge>
                    </div>
                    <p className="text-xs text-muted">{r.reason}</p>
                    <p className="text-xs text-muted">
                      Requested {dt(r.requestedAt)} · {r.requestedBy}
                      {r.decidedBy ? ` · decided by ${r.decidedBy}` : ''}
                    </p>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>
      </div>

      <RecordPaymentModal open={payOpen} onClose={() => setPayOpen(false)} invoice={inv} onDone={refetch} />
      <AdjustInvoiceModal open={adjustOpen} onClose={() => setAdjustOpen(false)} invoice={inv} onDone={refetch} />
      <RequestRefundModal open={refundOpen} onClose={() => setRefundOpen(false)} invoice={inv} onDone={refetch} />
      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancel}
        title="Cancel this invoice?"
        message="The invoice will be voided. This is only possible before any payment is recorded."
        confirmLabel="Cancel invoice"
        tone="danger"
        reason="required"
      />
    </>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-semibold text-foreground' : 'text-muted'}`}>
      <span>{label}</span>
      <span className={strong ? '' : 'text-foreground'}>{value}</span>
    </div>
  );
}
