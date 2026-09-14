import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { CREDIT_NOTE_STATUS_LABEL, CREDIT_NOTE_STATUS_TONE, IRD_STATUS_LABEL, IRD_STATUS_TONE } from '@/features/ird/types';
import { platformBillingApi } from './api';
import { SUBSCRIPTION_INVOICE_STATUS_LABEL, SUBSCRIPTION_INVOICE_STATUS_TONE } from './types';

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

export function IrdSubmissionModal({
  open,
  onClose,
  invoiceId,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  invoiceId: number | null;
  onChanged: () => void;
}) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [manualOpen, setManualOpen] = useState<'bill' | 'creditNote' | null>(null);
  const [manualRef, setManualRef] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const { data: submission, loading, error, refetch } = useQuery(
    () => (invoiceId ? platformBillingApi.getByInvoice(invoiceId) : Promise.resolve(null)),
    [invoiceId],
  );

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      refetch();
      onChanged();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const submitManual = () => {
    if (!submission || !manualRef.trim()) return;
    const fn =
      manualOpen === 'creditNote'
        ? () => platformBillingApi.markCreditNoteManual(submission.id, manualRef.trim(), manualNote.trim() || undefined)
        : () => platformBillingApi.markManual(submission.id, manualRef.trim(), manualNote.trim() || undefined);
    act(fn, manualOpen === 'creditNote' ? 'Credit note recorded as manually filed' : 'Recorded as manually filed').then(() => {
      setManualOpen(null);
      setManualRef('');
      setManualNote('');
    });
  };

  const submitCancel = () => {
    if (!submission || !cancelReason.trim()) return;
    act(() => platformBillingApi.cancelInvoice(submission.subscriptionInvoiceId, cancelReason.trim()), 'Invoice cancelled').then(
      () => {
        setCancelOpen(false);
        setCancelReason('');
      },
    );
  };

  const canCancelInvoice = submission && (submission.invoiceStatus === 'PENDING' || submission.invoiceStatus === 'OVERDUE');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={submission ? submission.invoiceNumber : 'Subscription invoice'}
      description={submission ? `${submission.organizationName ?? 'Unknown clinic'} · ${submission.planName}` : undefined}
      size="lg"
    >
      {loading && !submission ? (
        <LoadingState label="Loading…" />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : submission ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={SUBSCRIPTION_INVOICE_STATUS_TONE[submission.invoiceStatus]}>
              {SUBSCRIPTION_INVOICE_STATUS_LABEL[submission.invoiceStatus]}
            </Badge>
            <Badge tone={IRD_STATUS_TONE[submission.status]}>IRD: {IRD_STATUS_LABEL[submission.status]}</Badge>
            {submission.manual && <Badge tone="neutral">Filed manually</Badge>}
            {submission.creditNoteStatus !== 'NOT_NEEDED' && (
              <Badge tone={CREDIT_NOTE_STATUS_TONE[submission.creditNoteStatus]}>
                Credit note: {CREDIT_NOTE_STATUS_LABEL[submission.creditNoteStatus]}
              </Badge>
            )}
          </div>

          <div className="grid gap-2 text-sm sm:grid-cols-2">
            <Row label="Taxable amount" value={formatMoney(submission.taxableAmount)} />
            <Row label="VAT (13%)" value={formatMoney(submission.taxAmount)} />
            <Row label="Total" value={formatMoney(submission.totalAmount)} />
            <Row label="Attempts" value={String(submission.attemptCount)} />
            <Row label="Submitted" value={dt(submission.submittedAt)} />
            <Row label="Accepted" value={dt(submission.acceptedAt)} />
          </div>

          {submission.providerReference && <Row label="Provider reference" value={submission.providerReference} />}
          {submission.lastErrorMessage && (
            <Alert tone="danger">
              {submission.lastErrorCode ? `[${submission.lastErrorCode}] ` : ''}
              {submission.lastErrorMessage}
            </Alert>
          )}
          {submission.manual && submission.manualReference && (
            <p className="text-sm text-muted">
              Manual reference: <span className="font-medium text-foreground">{submission.manualReference}</span>
              {submission.notes ? ` — ${submission.notes}` : ''}
            </p>
          )}

          {submission.invoiceStatus === 'CANCELLED' && submission.cancelReason && (
            <Alert tone="info">Cancelled — {submission.cancelReason}</Alert>
          )}

          {submission.creditNoteStatus === 'NEEDED' && (
            <Alert tone="warning">
              This bill was already filed with IRD before the invoice was cancelled — a credit note must be
              filed to reverse it.
            </Alert>
          )}
          {submission.creditNoteStatus === 'FAILED' && submission.creditNoteErrorMessage && (
            <Alert tone="danger">Credit note failed: {submission.creditNoteErrorMessage}</Alert>
          )}
          {submission.creditNoteStatus === 'FILED' && (
            <Row label="Credit note" value={`${submission.creditNoteNumber ?? '—'} · filed ${dt(submission.creditNoteFiledAt)}`} />
          )}

          {manualOpen ? (
            <div className="space-y-3 rounded-md border border-border p-4">
              <Input
                label={manualOpen === 'creditNote' ? 'Manual credit note reference' : 'Manual filing reference'}
                placeholder="e.g. IRD portal receipt number"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
              />
              <Textarea label="Note (optional)" value={manualNote} onChange={(e) => setManualNote(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setManualOpen(null)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!manualRef.trim() || busy} onClick={submitManual}>
                  Save
                </Button>
              </div>
            </div>
          ) : cancelOpen ? (
            <div className="space-y-3 rounded-md border border-danger/30 p-4">
              <Textarea
                label="Reason for cancelling this invoice"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setCancelOpen(false)}>
                  Back
                </Button>
                <Button variant="danger" size="sm" disabled={!cancelReason.trim() || busy} onClick={submitCancel}>
                  Confirm cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              {submission.creditNoteStatus === 'NEEDED' && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => act(() => platformBillingApi.submitCreditNote(submission.id), 'Credit note filed')}
                >
                  File credit note
                </Button>
              )}
              {submission.creditNoteStatus === 'FAILED' && (
                <Button
                  variant="danger"
                  disabled={busy}
                  onClick={() => act(() => platformBillingApi.retryCreditNote(submission.id), 'Retried credit note')}
                >
                  Retry credit note
                </Button>
              )}
              {(submission.creditNoteStatus === 'NEEDED' || submission.creditNoteStatus === 'FAILED') && (
                <Button variant="secondary" disabled={busy} onClick={() => setManualOpen('creditNote')}>
                  Record manual credit note
                </Button>
              )}
              {canCancelInvoice && (
                <Button variant="danger" disabled={busy} onClick={() => setCancelOpen(true)}>
                  Cancel invoice
                </Button>
              )}
              {submission.status !== 'ACCEPTED' && submission.status !== 'DUPLICATE' && (
                <Button variant="secondary" disabled={busy} onClick={() => setManualOpen('bill')}>
                  Record manual filing
                </Button>
              )}
              {submission.status === 'FAILED' ? (
                <Button disabled={busy} onClick={() => act(() => platformBillingApi.retry(submission.id), 'Retried')}>
                  Retry submission
                </Button>
              ) : submission.status === 'NOT_SUBMITTED' ? (
                <Button disabled={busy} onClick={() => act(() => platformBillingApi.submit(submission.id), 'Submitted to IRD')}>
                  Submit to IRD
                </Button>
              ) : null}
            </div>
          )}
        </div>
      ) : null}
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
