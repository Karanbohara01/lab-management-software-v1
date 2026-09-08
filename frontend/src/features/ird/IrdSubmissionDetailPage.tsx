import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, RefreshCw, Send, ClipboardCheck } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { irdApi } from './api';
import { IrdConfigBanner } from './IrdConfigBanner';
import { IRD_STATUS_LABEL, IRD_STATUS_TONE } from './types';

export function IrdSubmissionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.IRD_SUBMISSION_MANAGE);

  const [manualOpen, setManualOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [manualRef, setManualRef] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [busy, setBusy] = useState(false);

  const { data: sub, loading, error, refetch } = useQuery(() => irdApi.get(Number(id)), [id]);

  if (loading && !sub) return <LoadingState label="Loading submission…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!sub) return null;

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

  const submitManual = async () => {
    if (!manualRef.trim()) return;
    await act(() => irdApi.markManual(sub.id, manualRef.trim(), manualNote || undefined), 'Recorded as manually filed');
    setManualOpen(false);
    setManualRef('');
    setManualNote('');
  };

  const canSubmit = sub.status === 'NOT_SUBMITTED';
  const canRetry = sub.status === 'FAILED';

  return (
    <>
      <Link
        to={`/app/invoices/${sub.invoiceId}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Invoice {sub.invoiceNumber}
      </Link>

      <PageHeader
        title={`IRD submission · ${sub.invoiceNumber}`}
        description={`${sub.patientName} · ${sub.patientMrn}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={IRD_STATUS_TONE[sub.status]}>{IRD_STATUS_LABEL[sub.status]}</Badge>
            {canManage && canSubmit && (
              <Button disabled={busy} onClick={() => act(() => irdApi.submit(sub.invoiceId), 'Submission attempted')}>
                <Send className="h-4 w-4" aria-hidden />
                Submit
              </Button>
            )}
            {canManage && canRetry && (
              <Button disabled={busy} onClick={() => act(() => irdApi.retry(sub.id), 'Retry attempted')}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Retry
              </Button>
            )}
            {canManage && sub.status !== 'ACCEPTED' && sub.status !== 'CANCELLED' && (
              <Button variant="secondary" disabled={busy} onClick={() => setManualOpen(true)}>
                <ClipboardCheck className="h-4 w-4" aria-hidden />
                Mark filed manually
              </Button>
            )}
            {canManage && sub.status !== 'CANCELLED' && (
              <Button variant="ghost" onClick={() => setCancelOpen(true)}>
                <Ban className="h-4 w-4" aria-hidden />
                Cancel
              </Button>
            )}
          </div>
        }
      />

      <IrdConfigBanner />

      {sub.lastErrorMessage && sub.status === 'FAILED' && (
        <div className="mb-4">
          <Alert tone="danger" title={`Submission failed${sub.lastErrorCode ? ` · ${sub.lastErrorCode}` : ''}`}>
            {sub.lastErrorMessage}
          </Alert>
        </div>
      )}
      {sub.manual && (
        <div className="mb-4">
          <Alert tone="info" title="Filed manually">
            Reference {sub.manualReference}. {sub.notes}
          </Alert>
        </div>
      )}

      <Card>
        <CardHeader title="Attempt log" description="Every submission, retry and manual action is recorded." />
        <CardBody>
          {sub.attempts.length === 0 ? (
            <p className="text-sm text-muted">No attempts yet.</p>
          ) : (
            <ol className="space-y-3">
              {sub.attempts.map((a) => (
                <li key={a.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      #{a.attemptNo} · {a.action}
                    </span>
                    <Badge tone={a.requestStatus === 'SENT' ? 'info' : 'neutral'}>{a.requestStatus}</Badge>
                    {a.responseStatus && a.responseStatus !== 'NOT_APPLICABLE' && (
                      <Badge tone={a.responseStatus === 'ACCEPTED' ? 'success' : a.responseStatus === 'DUPLICATE' ? 'warning' : 'danger'}>
                        {a.responseStatus}
                      </Badge>
                    )}
                  </div>
                  {a.errorMessage && <p className="mt-1 text-muted">{a.errorCode ? `${a.errorCode}: ` : ''}{a.errorMessage}</p>}
                  {a.providerReference && <p className="mt-1 text-muted">Reference: {a.providerReference}</p>}
                  <p className="mt-1 text-xs text-muted">
                    {new Date(a.occurredAt).toLocaleString()} · {a.actor}
                  </p>
                </li>
              ))}
            </ol>
          )}
        </CardBody>
      </Card>

      <Modal
        open={manualOpen}
        onClose={() => setManualOpen(false)}
        title="Record manual IRD filing"
        description="Use when the bill was filed directly on the IRD portal."
        footer={
          <>
            <Button variant="secondary" type="button" onClick={() => setManualOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={submitManual} loading={busy}>
              Record
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="IRD reference / bill number" value={manualRef} onChange={(e) => setManualRef(e.target.value)} />
          <Textarea label="Note" value={manualNote} onChange={(e) => setManualNote(e.target.value)} />
        </div>
      </Modal>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={async (reason) => {
          await act(() => irdApi.cancel(sub.id, reason), 'Submission cancelled');
          setCancelOpen(false);
        }}
        title="Cancel this IRD submission?"
        message="This only updates internal tracking. Any IRD-side cancellation must be handled per IRD procedure."
        confirmLabel="Cancel submission"
        tone="danger"
        reason="required"
      />
    </>
  );
}
