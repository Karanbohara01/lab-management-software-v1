import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, CheckCircle2, Save, ShieldCheck, Undo2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { Textarea } from '@/components/ui/Textarea';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatGender } from '@/features/patients/format';
import { resultsApi } from './api';
import {
  RESULT_STATUS_LABEL,
  RESULT_STATUS_TONE,
  flagLabel,
  flagTone,
  type CommentTemplate,
  type ResultValue,
  type ValueInput,
} from './types';
import { AmendResultModal } from './AmendResultModal';
import { CriticalCallbackModal } from './CriticalCallbackModal';
import { CultureEntryForm } from './CultureEntryForm';

const CHOICE_OPTIONS: Partial<Record<ResultValue['dataType'], string[]>> = {
  POSITIVE_NEGATIVE: ['Positive', 'Negative'],
  REACTIVE_NONREACTIVE: ['Reactive', 'Non-reactive'],
};

export function ResultEntryPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const fromOrder = searchParams.get('from')?.startsWith('order:')
    ? searchParams.get('from')!.slice('order:'.length)
    : null;
  const toast = useToast();
  const { hasPermission } = useAuth();

  const { data: result, loading, error, refetch } = useQuery(() => resultsApi.get(Number(id)), [id]);

  const [draft, setDraft] = useState<Record<number, string>>({});
  const [notes, setNotes] = useState<Record<number, string>>({});
  const [comment, setComment] = useState('');
  const [templates, setTemplates] = useState<CommentTemplate[]>([]);
  const [saving, setSaving] = useState(false);
  const [busyAction, setBusyAction] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [amendOpen, setAmendOpen] = useState(false);
  const [callbackOpen, setCallbackOpen] = useState(false);

  useEffect(() => {
    if (result) {
      setDraft(
        Object.fromEntries(
          result.values.map((v) => [
            v.parameterId,
            v.valueNumeric != null ? String(v.valueNumeric) : (v.valueText ?? ''),
          ]),
        ),
      );
      setNotes(Object.fromEntries(result.values.map((v) => [v.parameterId, v.comment ?? ''])));
      setComment(result.comment ?? '');
    }
  }, [result]);

  useEffect(() => {
    if (result?.testId) {
      resultsApi.commentTemplates(result.testId).then(setTemplates).catch(() => setTemplates([]));
    }
  }, [result?.testId]);

  const editable = useMemo(
    () => !!result && (result.status === 'PENDING' || result.status === 'ENTERED') && hasPermission(PERMISSIONS.RESULT_ENTER),
    [result, hasPermission],
  );

  if (loading && !result) return <LoadingState label="Loading result…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!result) return null;

  const buildPayload = (): ValueInput[] =>
    result.values
      .filter((v) => !v.calculated)
      .map((v) => {
        const raw = (draft[v.parameterId] ?? '').trim();
        const note = (notes[v.parameterId] ?? '').trim() || null;
        return v.dataType === 'NUMERIC'
          ? { parameterId: v.parameterId, valueNumeric: raw === '' ? null : Number(raw), comment: note }
          : { parameterId: v.parameterId, valueText: raw || null, comment: note };
      });

  const save = async () => {
    setSaving(true);
    try {
      await resultsApi.saveValues(result.id, buildPayload(), comment || undefined);
      toast.success('Results saved');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to save results');
    } finally {
      setSaving(false);
    }
  };

  const verifyResult = async () => {
    setBusyAction(true);
    try {
      await resultsApi.verify(result.id);
      toast.success('Result verified');
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const reason = window.prompt(
          `${err.message}\n\nEnter a documented reason to verify it yourself:`,
        );
        if (reason && reason.trim()) {
          try {
            await resultsApi.verify(result.id, reason.trim());
            toast.success('Result verified with override');
            refetch();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Action failed');
          }
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Action failed');
      }
    } finally {
      setBusyAction(false);
    }
  };

  const approveResult = async () => {
    setBusyAction(true);
    try {
      await resultsApi.approve(result.id);
      toast.success('Result approved');
      refetch();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        const reason = window.prompt(
          `${err.message}\n\nEnter a documented reason to approve despite the QC failure:`,
        );
        if (reason && reason.trim()) {
          try {
            await resultsApi.approve(result.id, reason.trim());
            toast.success('Result approved with QC override');
            refetch();
          } catch (e2) {
            toast.error(e2 instanceof ApiError ? e2.message : 'Action failed');
          }
        }
      } else {
        toast.error(err instanceof ApiError ? err.message : 'Action failed');
      }
    } finally {
      setBusyAction(false);
    }
  };

  const doReject = async (reason: string) => {
    try {
      await resultsApi.reject(result.id, reason);
      toast.success('Sent back for correction');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to send back');
      throw err;
    }
  };

  return (
    <>
      <Link
        to={fromOrder ? `/app/orders/${fromOrder}` : `/app/samples/${result.sampleId}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        {fromOrder ? `Order ${result.orderNumber}` : `Sample ${result.accessionNumber}`}
      </Link>

      <PageHeader
        title={result.testName}
        description={`${result.testCode} · ${result.departmentName} · Order ${result.orderNumber}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {result.priority !== 'ROUTINE' && (
              <Badge tone={result.priority === 'STAT' ? 'critical' : 'warning'}>{result.priority}</Badge>
            )}
            {result.overdue && <Badge tone="danger">Overdue</Badge>}
            <Badge tone={RESULT_STATUS_TONE[result.status]}>{RESULT_STATUS_LABEL[result.status]}</Badge>
          </div>
        }
      />

      {/* Identity banner — guards against entering results against the wrong patient/sample */}
      <div className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3">
        <p className="text-sm">
          <span className="font-semibold text-foreground">{result.patientName}</span>
          <span className="mx-2 font-mono text-xs text-muted">{result.patientMrn}</span>
          <span className="text-muted">
            {formatGender(result.patientGender as never)}
            {result.patientAgeYears != null ? ` · ${result.patientAgeYears}y` : ''}
          </span>
          <span className="mx-2 text-muted">·</span>
          <span className="font-mono text-xs text-muted">{result.accessionNumber}</span>
        </p>
      </div>

      {result.autoVerified && result.status !== 'PENDING' && (
        <div className="mb-4">
          <Alert tone="success" title="Auto-verified">
            All values were normal and in range with no delta breach, so this result was verified automatically.
            A pathologist still approves it.
          </Alert>
        </div>
      )}
      {result.sampleCondition && (
        <div className="mb-4">
          <Alert tone="warning" title="Specimen condition">
            {result.sampleCondition}. This is recorded and printed on the report.
          </Alert>
        </div>
      )}
      {result.values.some((v) => v.deltaBreach) && (
        <div className="mb-4">
          <Alert tone="warning" title="Delta check flagged">
            One or more values changed sharply from this patient's previous result. Review before verifying.
          </Alert>
        </div>
      )}

      {result.criticalAckRequired && (
        <div className="mb-4">
          <Alert tone="danger" title="Critical-value callback required">
            This approved result has a critical value that has not yet been communicated with read-back.
            <button
              type="button"
              onClick={() => setCallbackOpen(true)}
              className="ml-2 font-semibold underline"
            >
              Log the callback
            </button>
          </Alert>
        </div>
      )}
      {result.criticalCallbacks.length > 0 && (
        <div className="mb-4 rounded-lg border border-border bg-surface p-3 text-sm">
          <p className="font-semibold text-foreground">Critical-value callbacks</p>
          <ul className="mt-1 space-y-1 text-muted">
            {result.criticalCallbacks.map((c) => (
              <li key={c.id}>
                {c.waived
                  ? `Waived � ${c.waivedReason}`
                  : `Notified ${c.notifiedName}${c.notifiedRole ? ` (${c.notifiedRole})` : ''} via ${c.contactMethod}${c.readBackConfirmed ? ', read-back confirmed' : ''}`}
                <span className="ml-1 text-xs">� {new Date(c.notifiedAt).toLocaleString()} � {c.loggedBy}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      {result.hasCritical && (
        <div className="mb-4">
          <Alert tone="danger" title="Critical value present">
            One or more parameters are outside the critical range. Follow your laboratory's critical-value
            notification protocol.
          </Alert>
        </div>
      )}
      {result.rejectionReason && result.status !== 'APPROVED' && (
        <div className="mb-4">
          <Alert tone="warning" title="Returned for correction">
            {result.rejectionReason}
          </Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {result.resultMode === 'CULTURE' ? (
            <CultureEntryForm result={result} editable={editable} onSaved={refetch} />
          ) : (
          <Card>
            <CardHeader title="Parameters" />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-2">Parameter</th>
                    <th className="px-5 py-2">Result</th>
                    <th className="px-5 py-2">Reference</th>
                    <th className="px-5 py-2">Flag</th>
                  </tr>
                </thead>
                <tbody>
                  {result.values.map((v, i) => {
                    const choices = v.allowedValues.length ? v.allowedValues : CHOICE_OPTIONS[v.dataType];
                    const heading = v.groupHeading && v.groupHeading !== result.values[i - 1]?.groupHeading
                      ? v.groupHeading
                      : null;
                    return (
                      <Fragment key={v.parameterId}>
                        {heading && (
                          <tr className="bg-surface-muted/50">
                            <td colSpan={4} className="px-5 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">
                              {heading}
                            </td>
                          </tr>
                        )}
                      <tr className="border-b border-border last:border-0">
                        <td className="px-5 py-2">
                          <span className="font-medium text-foreground">{v.parameterName}</span>
                          {v.unit && <span className="ml-1 text-muted">({v.unit})</span>}
                          {v.calculated && (
                            <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                              calculated
                            </span>
                          )}
                          {v.method && <span className="ml-2 text-[11px] text-muted">· {v.method}</span>}
                        </td>
                        <td className="px-5 py-2">
                          {editable && !v.calculated ? (
                            choices ? (
                              <select
                                value={draft[v.parameterId] ?? ''}
                                onChange={(e) => setDraft((p) => ({ ...p, [v.parameterId]: e.target.value }))}
                                className="h-9 w-40 rounded-md border border-input bg-surface px-2"
                              >
                                <option value="">—</option>
                                {choices.map((c) => (
                                  <option key={c} value={c}>
                                    {c}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type={v.dataType === 'NUMERIC' ? 'number' : 'text'}
                                step="any"
                                inputMode={v.dataType === 'NUMERIC' ? 'decimal' : undefined}
                                value={draft[v.parameterId] ?? ''}
                                onChange={(e) => setDraft((p) => ({ ...p, [v.parameterId]: e.target.value }))}
                                className="h-9 w-40 rounded-md border border-input bg-surface px-2 text-base"
                                aria-label={v.parameterName}
                              />
                            )
                          ) : (
                            <span className={v.calculated ? 'font-medium text-muted' : 'font-medium text-foreground'}>
                              {v.valueNumeric != null ? v.valueNumeric : v.valueText || '—'}
                            </span>
                          )}
                          {editable && !v.calculated ? (
                            <input
                              type="text"
                              placeholder="note (optional)"
                              value={notes[v.parameterId] ?? ''}
                              onChange={(e) => setNotes((p) => ({ ...p, [v.parameterId]: e.target.value }))}
                              className="mt-1 block h-7 w-52 rounded border border-input bg-surface px-2 text-xs"
                            />
                          ) : (
                            v.comment && <p className="mt-0.5 text-xs italic text-muted">{v.comment}</p>
                          )}
                        </td>
                        <td className="px-5 py-2 text-muted">
                          {v.referenceText ?? '—'}
                          {v.previousValue != null && (
                            <span
                              className={`ml-2 text-xs ${v.deltaBreach ? 'font-semibold text-danger' : 'text-muted'}`}
                            >
                              (prev {v.previousValue}
                              {v.deltaPercent != null ? ` · Δ ${v.deltaPercent}%` : ''})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-2">
                          {v.flag !== 'NONE' && (
                            <span
                              className={
                                flagTone(v.flag) === 'critical'
                                  ? 'inline-flex items-center gap-1 rounded-full bg-critical/15 px-2 py-0.5 text-xs font-semibold text-critical'
                                  : flagTone(v.flag) === 'warning'
                                    ? 'inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs font-medium text-warning'
                                    : 'text-xs text-muted'
                              }
                            >
                              {flagTone(v.flag) === 'critical' && <AlertTriangle className="h-3 w-3" aria-hidden />}
                              {flagLabel(v.flag)}
                            </span>
                          )}
                        </td>
                      </tr>
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <CardBody className="space-y-2">
              {editable && templates.length > 0 && (
                <select
                  value=""
                  onChange={(e) => {
                    const t = templates.find((x) => String(x.id) === e.target.value);
                    if (t) setComment((c) => (c ? `${c}\n${t.body}` : t.body));
                  }}
                  className="h-9 w-full rounded-md border border-input bg-surface px-2 text-sm"
                >
                  <option value="">Insert a standard comment…</option>
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.category ? `${t.category} · ` : ''}
                      {t.title}
                    </option>
                  ))}
                </select>
              )}
              <Textarea
                label="Comment / interpretation"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                disabled={!editable}
                rows={3}
              />
            </CardBody>
          </Card>
          )}

          {result.history.length > 0 && (
            <Card>
              <CardHeader title="Result history" />
              <CardBody>
                <ul className="space-y-2 text-sm">
                  {result.history.map((h) => (
                    <li key={h.id} className="flex flex-wrap items-baseline gap-x-2">
                      <span className="font-medium text-foreground">{h.parameterName}</span>
                      {(h.oldValue || h.newValue) && (
                        <span className="text-muted">
                          {h.oldValue ?? '∅'} <span aria-hidden>→</span> {h.newValue ?? '∅'}
                        </span>
                      )}
                      {h.reason && <span className="text-muted">· {h.reason}</span>}
                      <span className="text-xs text-muted">
                        · {new Date(h.changedAt).toLocaleString()} · {h.changedBy}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Actions" />
            <CardBody className="space-y-2">
              {editable && result.resultMode !== 'CULTURE' && (
                <Button className="w-full" onClick={save} loading={saving}>
                  <Save className="h-4 w-4" aria-hidden />
                  Save results
                </Button>
              )}
              {result.resultMode === 'CULTURE' && (
                <p className="text-xs text-muted">Enter culture findings in the panel on the left, then verify.</p>
              )}
              {result.status === 'ENTERED' && hasPermission(PERMISSIONS.RESULT_VERIFY) && (
                <Button
                  className="w-full"
                  variant="secondary"
                  disabled={busyAction}
                  onClick={verifyResult}
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden />
                  Verify
                </Button>
              )}
              {result.status === 'VERIFIED' && hasPermission(PERMISSIONS.RESULT_APPROVE) && (
                <Button
                  className="w-full"
                  disabled={busyAction}
                  onClick={approveResult}
                >
                  <ShieldCheck className="h-4 w-4" aria-hidden />
                  Approve
                </Button>
              )}
              {(result.status === 'ENTERED' || result.status === 'VERIFIED') &&
                hasPermission(PERMISSIONS.RESULT_VERIFY) && (
                  <Button className="w-full" variant="ghost" onClick={() => setRejectOpen(true)}>
                    <Undo2 className="h-4 w-4" aria-hidden />
                    Send back for correction
                  </Button>
                )}
              {result.status === 'APPROVED' && hasPermission(PERMISSIONS.RESULT_AMEND) && (
                <Button className="w-full" variant="secondary" onClick={() => setAmendOpen(true)}>
                  Amend approved result
                </Button>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Workflow" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Entered" value={by(result.enteredAt, result.enteredBy)} />
              <Row label="Verified" value={by(result.verifiedAt, result.verifiedBy)} />
              <Row label="Approved" value={by(result.approvedAt, result.approvedBy)} />
              {result.amendedAt && <Row label="Amended" value={by(result.amendedAt, result.amendedBy)} />}
            </CardBody>
          </Card>
        </div>
      </div>

      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={doReject}
        title="Send back for correction?"
        message="The result returns to the technician for re-entry."
        confirmLabel="Send back"
        reason="required"
      />
      <CriticalCallbackModal
        open={callbackOpen}
        onClose={() => setCallbackOpen(false)}
        result={result}
        onLogged={refetch}
      />
      <AmendResultModal open={amendOpen} onClose={() => setAmendOpen(false)} result={result} onDone={refetch} />
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right text-foreground">{value ?? '—'}</span>
    </div>
  );
}

function by(iso: string | null, who: string | null): string | null {
  if (!iso) return null;
  return `${new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${who ? ` · ${who}` : ''}`;
}
