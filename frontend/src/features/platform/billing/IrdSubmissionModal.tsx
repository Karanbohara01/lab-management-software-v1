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
import { IRD_STATUS_LABEL, IRD_STATUS_TONE } from '@/features/ird/types';
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
  const [manualOpen, setManualOpen] = useState(false);
  const [manualRef, setManualRef] = useState('');
  const [manualNote, setManualNote] = useState('');

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
    act(
      () => platformBillingApi.markManual(submission.id, manualRef.trim(), manualNote.trim() || undefined),
      'Recorded as manually filed',
    ).then(() => {
      setManualOpen(false);
      setManualRef('');
      setManualNote('');
    });
  };

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

          {manualOpen ? (
            <div className="space-y-3 rounded-md border border-border p-4">
              <Input
                label="Manual filing reference"
                placeholder="e.g. IRD portal receipt number"
                value={manualRef}
                onChange={(e) => setManualRef(e.target.value)}
              />
              <Textarea label="Note (optional)" value={manualNote} onChange={(e) => setManualNote(e.target.value)} />
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" onClick={() => setManualOpen(false)}>
                  Cancel
                </Button>
                <Button size="sm" disabled={!manualRef.trim() || busy} onClick={submitManual}>
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
              <Button variant="secondary" disabled={busy} onClick={() => setManualOpen(true)}>
                Record manual filing
              </Button>
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
