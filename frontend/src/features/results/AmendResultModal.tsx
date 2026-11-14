import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { resultsApi } from './api';
import type { ResultDetail, ValueInput } from './types';

export function AmendResultModal({
  open,
  onClose,
  result,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  result: ResultDetail;
  onDone: () => void;
}) {
  const toast = useToast();
  const t = useT();
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      result.values.map((v) => [v.parameterId, v.valueNumeric != null ? String(v.valueNumeric) : (v.valueText ?? '')]),
    ),
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Set only after the server refuses because this amendment newly blanks a previously-resulted
  // parameter — asked for separately from the amendment reason, since "why am I amending" and
  // "why is it OK to leave this blank" are different questions.
  const [incompleteReason, setIncompleteReason] = useState<string | null>(null);

  const submit = async () => {
    if (!reason.trim()) {
      setError(t('An amendment reason is required.'));
      return;
    }
    if (incompleteReason !== null && !incompleteReason.trim()) {
      setError(t('Enter a reason to leave this result partial, or restore the value(s).'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const payload: ValueInput[] = result.values.map((v) => {
        const raw = values[v.parameterId] ?? '';
        return v.dataType === 'NUMERIC'
          ? { parameterId: v.parameterId, valueNumeric: raw === '' ? null : Number(raw) }
          : { parameterId: v.parameterId, valueText: raw || null };
      });
      await resultsApi.amend(result.id, payload, reason.trim(), undefined, incompleteReason?.trim() || undefined);
      toast.success(t('Result amended'));
      onDone();
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.code === 'RESULT_INCOMPLETE' && incompleteReason === null) {
        // First refusal: reveal the second reason field rather than failing the whole dialog —
        // the person's edits and amendment reason stay exactly as they typed them.
        setIncompleteReason('');
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : t('Unable to amend result'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Amend approved result · {code}', { code: result.testCode })}
      description={t('Changes are recorded in the result history with your reason.')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button variant="danger" onClick={submit} loading={busy}>
            {t('Amend result')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <div className="space-y-3">
          {result.values.map((v) => (
            <div key={v.parameterId} className="grid grid-cols-[1fr,auto] items-center gap-3">
              <label className="text-sm text-foreground">
                {v.parameterName}
                {v.unit ? <span className="text-muted"> ({v.unit})</span> : null}
              </label>
              <Input
                className="w-40"
                type={v.dataType === 'NUMERIC' ? 'number' : 'text'}
                step="any"
                value={values[v.parameterId] ?? ''}
                onChange={(e) => setValues((prev) => ({ ...prev, [v.parameterId]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        <Textarea
          label={t('Reason for amendment')}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {incompleteReason !== null && (
          <Textarea
            label={t('Reason to leave this result partial')}
            value={incompleteReason}
            onChange={(e) => setIncompleteReason(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}
