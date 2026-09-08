import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { resultsApi } from './api';
import type { ContactMethod, ResultDetail } from './types';

const METHODS: { value: ContactMethod; label: string }[] = [
  { value: 'PHONE', label: 'Phone call' },
  { value: 'IN_PERSON', label: 'In person' },
  { value: 'SMS', label: 'SMS' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'OTHER', label: 'Other' },
];

export function CriticalCallbackModal({
  open,
  onClose,
  result,
  onLogged,
}: {
  open: boolean;
  onClose: () => void;
  result: ResultDetail;
  onLogged: () => void;
}) {
  const toast = useToast();
  const [mode, setMode] = useState<'log' | 'waive'>('log');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [method, setMethod] = useState<ContactMethod>('PHONE');
  const [readBack, setReadBack] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [waiveReason, setWaiveReason] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      if (mode === 'waive') {
        if (waiveReason.trim().length < 4) return;
        await resultsApi.waiveCriticalCallback(result.id, waiveReason.trim());
        toast.success('Callback requirement waived');
      } else {
        if (name.trim().length < 2) return;
        await resultsApi.logCriticalCallback(result.id, {
          notifiedName: name.trim(),
          notifiedRole: role.trim() || undefined,
          contactMethod: method,
          readBackConfirmed: readBack,
          remarks: remarks.trim() || undefined,
        });
        toast.success('Critical-value callback recorded');
      }
      onLogged();
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Unable to record callback');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Critical-value callback · ${result.testCode}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" loading={busy} onClick={submit}>
            {mode === 'waive' ? 'Waive requirement' : 'Record callback'}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <Alert tone="danger">
          A critical value must be communicated to the treating clinician / ward with read-back confirmation.
        </Alert>
        <div className="flex gap-1 text-sm">
          <button
            type="button"
            onClick={() => setMode('log')}
            className={mode === 'log' ? 'rounded-md bg-primary/10 px-3 py-1 font-medium text-primary' : 'px-3 py-1 text-muted'}
          >
            Log callback
          </button>
          <button
            type="button"
            onClick={() => setMode('waive')}
            className={mode === 'waive' ? 'rounded-md bg-primary/10 px-3 py-1 font-medium text-primary' : 'px-3 py-1 text-muted'}
          >
            Waive
          </button>
        </div>

        {mode === 'log' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input label="Notified person" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Role / designation" placeholder="e.g. Ward nurse, Dr on call" value={role} onChange={(e) => setRole(e.target.value)} />
              <Select label="Contact method" options={METHODS} value={method} onChange={(e) => setMethod(e.target.value as ContactMethod)} />
              <div className="flex items-end pb-1">
                <Checkbox label="Read-back confirmed" checked={readBack} onChange={(e) => setReadBack(e.target.checked)} />
              </div>
            </div>
            <Textarea label="Remarks (optional)" rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </>
        ) : (
          <Textarea
            label="Reason for waiving the callback"
            rows={3}
            value={waiveReason}
            onChange={(e) => setWaiveReason(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}
