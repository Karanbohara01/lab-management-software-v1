import { useState, useEffect } from 'react';
import { ExternalLink, Copy, Check, MessageCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { reportsApi } from './api';
import { useT, useTRich, tOpts } from '@/i18n';

const METHODS = [
  { value: 'WHATSAPP_DIRECT', label: 'WhatsApp (Direct / wa.me)' },
  { value: 'SMS', label: 'SMS (Gateway)' },
  { value: 'WHATSAPP', label: 'WhatsApp (Cloud API gateway)' },
  { value: 'EMAIL', label: 'Email' },
  { value: 'HAND', label: 'Handed to patient' },
  { value: 'COURIER', label: 'Courier' },
  { value: 'PORTAL', label: 'Patient portal' },
];

const GATEWAY_MESSAGING_METHODS = new Set(['SMS', 'WHATSAPP']);

export interface DeliverReportModalProps {
  open: boolean;
  onClose: () => void;
  reportId: number;
  reportNumber?: string;
  patientName?: string;
  patientPhone?: string | null;
  verificationToken?: string | null;
  labName?: string | null;
  initialMethod?: string;
  onDone: () => void;
}

export function cleanNepalPhoneForWhatsApp(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 11) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    digits = `977${digits}`;
  }
  return digits;
}

export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanPhone = cleanNepalPhoneForWhatsApp(phone);
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

export function DeliverReportModal({
  open,
  onClose,
  reportId,
  reportNumber,
  patientName,
  patientPhone,
  verificationToken,
  labName,
  initialMethod = 'WHATSAPP_DIRECT',
  onDone,
}: DeliverReportModalProps) {
  const t = useT();
  const tRich = useTRich();
  const toast = useToast();
  const [method, setMethod] = useState(initialMethod);
  const [recipient, setRecipient] = useState(patientPhone ?? '');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setMethod(initialMethod);
      setRecipient(patientPhone ?? '');
      setCustomMessage('');
      setError(null);
      setCopied(false);
    }
  }, [open, initialMethod, patientPhone]);

  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const verifyUrl = verificationToken ? `${origin}/verify/${verificationToken}` : '';

  const defaultMessage = [
    `Namaste ${patientName || 'Patient'},`,
    ``,
    `Your diagnostic test report (${reportNumber || 'Report'}) from ${labName || 'our laboratory'} is ready.`,
    verifyUrl ? `You can view and verify your official report online at:\n${verifyUrl}` : '',
    ``,
    `Thank you for choosing ${labName || 'our laboratory'}.`,
  ]
    .filter((l, i, arr) => l !== '' || (i > 0 && arr[i - 1] !== ''))
    .join('\n');

  const activeMessage = customMessage || defaultMessage;
  const isDirectWhatsApp = method === 'WHATSAPP_DIRECT';
  const isGatewayMessaging = GATEWAY_MESSAGING_METHODS.has(method);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(activeMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success(t('Message copied to clipboard'));
    } catch {
      toast.error(t('Failed to copy to clipboard'));
    }
  };

  const handleRecordOnly = async () => {
    setBusy(true);
    setError(null);
    try {
      await reportsApi.deliver(reportId, method, recipient || undefined);
      toast.success(t('Delivery recorded'));
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Unable to record delivery'));
    } finally {
      setBusy(false);
    }
  };

  const handleSendWhatsAppDirect = async () => {
    if (!recipient.trim()) {
      setError(t('Please enter a phone number to open WhatsApp'));
      return;
    }
    const clean = cleanNepalPhoneForWhatsApp(recipient.trim());
    if (clean.length < 8) {
      setError(t('Please enter a valid phone number'));
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const waUrl = buildWhatsAppLink(clean, activeMessage);
      window.open(waUrl, '_blank');

      await reportsApi.deliver(reportId, 'WHATSAPP_DIRECT', recipient.trim());
      toast.success(t('Opened in WhatsApp and delivery recorded'));
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Unable to record delivery'));
    } finally {
      setBusy(false);
    }
  };

  const handleGatewaySend = async () => {
    setBusy(true);
    setError(null);
    try {
      await reportsApi.deliver(reportId, method, recipient || undefined);
      const methodLabel = method === 'SMS' ? t('SMS') : t('WhatsApp');
      toast.success(t('Sent via {method}', { method: methodLabel }));
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Unable to record delivery'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Deliver report')}
      size="md"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>

          {isDirectWhatsApp ? (
            <>
              <Button variant="secondary" onClick={handleRecordOnly} loading={busy}>
                {t('Record delivery only')}
              </Button>
              <Button
                onClick={handleSendWhatsAppDirect}
                loading={busy}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                <ExternalLink className="h-4 w-4" aria-hidden />
                {t('Open in WhatsApp')}
              </Button>
            </>
          ) : isGatewayMessaging ? (
            <Button onClick={handleGatewaySend} loading={busy}>
              {t('Send via {method}', { method: method === 'SMS' ? t('SMS') : t('WhatsApp') })}
            </Button>
          ) : (
            <Button onClick={handleRecordOnly} loading={busy}>
              {t('Record delivery')}
            </Button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}

        <Select
          label={t('Method')}
          options={tOpts(METHODS)}
          value={method}
          onChange={(e) => {
            setMethod(e.target.value);
            setError(null);
          }}
        />

        <Input
          label={
            isDirectWhatsApp
              ? t('WhatsApp phone number')
              : isGatewayMessaging
                ? t('Phone number')
                : t('Recipient (optional)')
          }
          placeholder={
            isDirectWhatsApp || isGatewayMessaging
              ? t('e.g. 98XXXXXXXX')
              : t('e.g. email address, courier ref')
          }
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
        />

        {isDirectWhatsApp && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">{t('Message preview')}</label>
              <button
                type="button"
                onClick={copyMessage}
                className="text-xs text-primary hover:underline flex items-center gap-1 font-medium"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" aria-hidden />
                    <span className="text-emerald-600">{t('Copied!')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" aria-hidden />
                    <span>{t('Copy message')}</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              className="w-full rounded-md border border-input bg-surface-muted/30 p-2.5 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              rows={6}
              value={activeMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
            />
            <div className="rounded-md bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 p-2.5 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
              <span>
                {t(
                  'Opens WhatsApp directly with the patient pre-filled. Does not require a paid Meta API gateway and works immediately from any browser or phone.',
                )}
              </span>
            </div>
          </div>
        )}

        {isGatewayMessaging && (
          <p className="text-xs text-muted">
            {tRich(
              'Sends a message with a link to this signed report, which the patient (or anyone with the link) can verify at {code}.',
              { code: <code className="font-mono">/verify/&lt;token&gt;</code> },
            )}{' '}
            {method === 'SMS'
              ? t('Requires an SMS gateway to be configured on the server.')
              : t('Requires a WhatsApp Business API connection to be configured on the server.')}
          </p>
        )}
      </div>
    </Modal>
  );
}
