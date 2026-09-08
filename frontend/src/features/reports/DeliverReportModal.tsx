import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { reportsApi } from './api';

const METHODS = [
  { value: 'HAND', label: 'Handed to patient' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'SMS', label: 'SMS link' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'PORTAL', label: 'Patient portal' },
];

export function DeliverReportModal({
  open,
  onClose,
  reportId,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  reportId: number;
  onDone: () => void;
}) {
  const toast = useToast();
  const [method, setMethod] = useState('HAND');
  const [recipient, setRecipient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await reportsApi.deliver(reportId, method, recipient || undefined);
      toast.success('Delivery recorded');
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to record delivery');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record report delivery"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            Record delivery
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Select label="Method" options={METHODS} value={method} onChange={(e) => setMethod(e.target.value)} />
        <Input
          label="Recipient (optional)"
          placeholder="e.g. email address, phone, courier ref"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
      </div>
    </Modal>
  );
}
