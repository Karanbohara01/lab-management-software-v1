import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
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
  const [values, setValues] = useState<Record<number, string>>(() =>
    Object.fromEntries(
      result.values.map((v) => [v.parameterId, v.valueNumeric != null ? String(v.valueNumeric) : (v.valueText ?? '')]),
    ),
  );
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!reason.trim()) {
      setError('An amendment reason is required.');
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
      await resultsApi.amend(result.id, payload, reason.trim());
      toast.success('Result amended');
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to amend result');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Amend approved result · ${result.testCode}`}
      description="Changes are recorded in the result history with your reason."
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant="danger" onClick={submit} loading={busy}>
            Amend result
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
          label="Reason for amendment"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>
    </Modal>
  );
}
