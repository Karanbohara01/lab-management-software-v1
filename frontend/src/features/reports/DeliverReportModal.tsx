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
  { value: 'SMS', label: 'SMS' },
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'HAND', label: 'Handed to patient' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'PORTAL', label: 'Patient portal' },
];

const MESSAGING_METHODS = new Set(['SMS', 'WHATSAPP']);

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
  const [method, setMethod] = useState('SMS');
  const [recipient, setRecipient] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isMessaging = MESSAGING_METHODS.has(method);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await reportsApi.deliver(reportId, method, recipient || undefined);
      toast.success(isMessaging ? `Sent via ${method === 'SMS' ? 'SMS' : 'WhatsApp'}` : 'Delivery recorded');
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
      title="Deliver report"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            {isMessaging ? `Send via ${method === 'SMS' ? 'SMS' : 'WhatsApp'}` : 'Record delivery'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Select
          label="Method"
          options={METHODS}
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setError(null);
          }}
        />
        <Input
          label={isMessaging ? 'Phone number' : 'Recipient (optional)'}
          placeholder={isMessaging ? 'Leave blank to use the phone on file' : 'e.g. email address, courier ref'}
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />
        {isMessaging && (
          <p className="text-xs text-muted">
            Sends a message with a link to this signed report, which the patient (or anyone with
            the link) can verify at <code className="font-mono">/app/verify/&lt;token&gt;</code>.
            {method === 'SMS'
              ? ' Requires an SMS gateway to be configured on the server.'
              : ' Requires a WhatsApp Business API connection to be configured on the server.'}
          </p>
        )}
      </div>
    </Modal>
  );
}
