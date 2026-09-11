import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { formatMoney } from '@/lib/money';
import { paymentGatewaysApi, submitEsewaForm } from './api';
import { PROVIDER_LABEL, type PaymentProvider } from './types';

export function PayOnlineModal({
  open,
  onClose,
  invoiceId,
  balance,
}: {
  open: boolean;
  onClose: () => void;
  invoiceId: number;
  balance: number;
}) {
  const toast = useToast();
  const [provider, setProvider] = useState<PaymentProvider | null>(null);
  const [busy, setBusy] = useState(false);

  const { data: providers, loading } = useQuery(() => paymentGatewaysApi.providers(), [open]);
  const configured = (providers ?? []).filter((p) => p.configured);

  const pay = async () => {
    if (!provider) return;
    setBusy(true);
    try {
      const result = await paymentGatewaysApi.initiate(invoiceId, provider);
      if (result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else if (result.formAction && result.formFields) {
        submitEsewaForm(result.formAction, result.formFields);
      } else {
        toast.error('Gateway did not return a way to continue checkout');
        setBusy(false);
      }
      // page navigates away on success — no need to reset busy/close here
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to start checkout');
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Pay online"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={pay} loading={busy} disabled={!provider}>
            Continue to {provider ? PROVIDER_LABEL[provider] : 'gateway'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">
          Outstanding balance: <span className="font-semibold text-foreground">{formatMoney(balance)}</span>
        </p>
        {loading ? (
          <p className="text-sm text-muted">Loading available gateways…</p>
        ) : configured.length === 0 ? (
          <Alert tone="warning" title="No payment gateway configured">
            Neither eSewa nor Khalti is configured on this server. Ask an administrator to set up online payments, or
            collect payment manually.
          </Alert>
        ) : (
          <div className="space-y-2">
            {configured.map((p) => (
              <label
                key={p.provider}
                className="flex items-center gap-3 rounded-md border border-border p-3 text-sm hover:bg-surface-muted"
              >
                <input
                  type="radio"
                  name="provider"
                  checked={provider === p.provider}
                  onChange={() => setProvider(p.provider)}
                  className="h-4 w-4"
                />
                <span className="font-medium text-foreground">{PROVIDER_LABEL[p.provider]}</span>
              </label>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
