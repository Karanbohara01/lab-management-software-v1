import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import type { DiscountType } from '@/features/orders/types';
import { invoicesApi } from './api';
import { PAYMENT_METHOD_LABEL, type InvoiceDetail, type PaymentMethod } from './types';
import { useT, translate, getLocale } from '@/i18n';

function useSubmit(onDone: () => void, onClose: () => void) {
  const t = useT();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const run = async (fn: () => Promise<unknown>, successMsg: string) => {
    setBusy(true);
    setError(null);
    try {
      await fn();
      toast.success(successMsg);
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Action failed'));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, run };
}

export function RecordPaymentModal({
  open,
  onClose,
  invoice,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceDetail;
  onDone: () => void;
}) {
  const t = useT();
  const { busy, error, run } = useSubmit(onDone, onClose);
  const [amount, setAmount] = useState(String(invoice.balance));
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  const numericAmount = Number(amount);
  const exceedsBalance = Number.isFinite(numericAmount) && numericAmount > invoice.balance;
  const invalidAmount = !amount || !Number.isFinite(numericAmount) || numericAmount <= 0 || exceedsBalance;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Record payment')}
      description={t('Outstanding balance {amount}', { amount: formatMoney(invoice.balance) })}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button
            loading={busy}
            disabled={invalidAmount}
            onClick={() =>
              run(
                () =>
                  invoicesApi.recordPayment(invoice.id, {
                    amount: numericAmount,
                    method,
                    reference: reference || undefined,
                    note: note || undefined,
                  }),
                t('Payment recorded'),
              )
            }
          >
            {t('Record payment')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        {/* Caught client-side now, before a round-trip to the server — the backend still rejects
            an overpayment too (defense in depth), but the user shouldn't have to submit to find
            out something this form already knows. */}
        {exceedsBalance && (
          <Alert tone="warning">
            {t('This exceeds the outstanding balance of {amount}. Reduce the amount, or use a refund/credit flow for anything genuinely owed back to the patient.', { amount: formatMoney(invoice.balance) })}
          </Alert>
        )}
        <Input label={t('Amount (NPR)')} type="number" step="any" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select
          label={t('Method')}
          options={Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label: translate(getLocale(), label) }))}
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        />
        <Input label={t('Reference (optional)')} value={reference} onChange={(e) => setReference(e.target.value)} />
        <Textarea label={t('Note (optional)')} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}

export function AdjustInvoiceModal({
  open,
  onClose,
  invoice,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceDetail;
  onDone: () => void;
}) {
  const t = useT();
  const { busy, error, run } = useSubmit(onDone, onClose);
  const [discountType, setDiscountType] = useState<DiscountType>(invoice.discountType);
  const [discountValue, setDiscountValue] = useState(String(invoice.discountValue));
  const [taxRate, setTaxRate] = useState(String(invoice.taxRate));
  const [notes, setNotes] = useState(invoice.notes ?? '');
  const [buyerPan, setBuyerPan] = useState(invoice.buyerPan ?? '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Adjust invoice')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button
            loading={busy}
            onClick={() =>
              run(
                () =>
                  invoicesApi.adjust(invoice.id, {
                    discountType,
                    discountValue: Number(discountValue) || 0,
                    taxRate: Number(taxRate) || 0,
                    notes: notes || undefined,
                    buyerPan: buyerPan || undefined,
                  }),
                t('Invoice updated'),
              )
            }
          >
            {t('Save')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Select
          label={t('Discount type')}
          options={[
            { value: 'NONE', label: t('No discount') },
            { value: 'PERCENT', label: t('Percentage (%)') },
            { value: 'AMOUNT', label: t('Flat amount (NPR)') },
          ]}
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as DiscountType)}
        />
        {discountType !== 'NONE' && (
          <Input label={t('Discount value')} type="number" step="any" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        )}
        <Input label={t('Tax rate %')} type="number" step="any" min={0} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        <Input
          label={t("Buyer's PAN (optional)")}
          hint={t('Shown on the printed bill and submitted to IRD when this buyer has their own PAN')}
          value={buyerPan}
          onChange={(e) => setBuyerPan(e.target.value)}
        />
        <Textarea label={t('Notes')} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
    </Modal>
  );
}

export function RequestRefundModal({
  open,
  onClose,
  invoice,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  invoice: InvoiceDetail;
  onDone: () => void;
}) {
  const t = useT();
  const { busy, error, run } = useSubmit(onDone, onClose);
  const refundable = invoice.amountPaid - invoice.amountRefunded;
  const [amount, setAmount] = useState(String(refundable));
  const [reason, setReason] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Request refund')}
      description={t('Refundable amount {amount}', { amount: formatMoney(refundable) })}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={() =>
              run(
                () => invoicesApi.requestRefund(invoice.id, { amount: Number(amount), reason: reason.trim() }),
                t('Refund requested — awaiting approval'),
              )
            }
          >
            {t('Submit request')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label={t('Amount (NPR)')} type="number" step="any" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Textarea label={t('Reason')} value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="text-xs text-muted">{t('A refund must be approved by an authorised user before it takes effect.')}</p>
      </div>
    </Modal>
  );
}
