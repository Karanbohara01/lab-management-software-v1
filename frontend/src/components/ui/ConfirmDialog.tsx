import { useState } from 'react';
import { Modal } from './Modal';
import { Button } from './Button';
import { Textarea } from './Textarea';

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => Promise<void> | void;
  title: string;
  message: string;
  confirmLabel?: string;
  tone?: 'primary' | 'danger';
  /** Show a required/optional reason field. */
  reason?: 'none' | 'optional' | 'required';
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  tone = 'primary',
  reason = 'none',
}: ConfirmDialogProps) {
  const [value, setValue] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (reason === 'required' && !value.trim()) {
      setError('Please give a reason.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onConfirm(value.trim());
      setValue('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={submit} loading={busy}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm text-foreground">{message}</p>
      {reason !== 'none' && (
        <div className="mt-4">
          <Textarea
            label={reason === 'required' ? 'Reason' : 'Reason (optional)'}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            error={error ?? undefined}
          />
        </div>
      )}
      {reason === 'none' && error && <p className="mt-2 text-sm text-danger">{error}</p>}
    </Modal>
  );
}
