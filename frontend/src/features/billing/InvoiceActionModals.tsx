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

function useSubmit(onDone: () => void, onClose: () => void) {
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
      setError(err instanceof ApiError ? err.message : 'Action failed');
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
  const { busy, error, run } = useSubmit(onDone, onClose);
  const [amount, setAmount] = useState(String(invoice.balance));
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Record payment"
      description={`Outstanding balance ${formatMoney(invoice.balance)}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            loading={busy}
            onClick={() =>
              run(
                () =>
                  invoicesApi.recordPayment(invoice.id, {
                    amount: Number(amount),
                    method,
                    reference: reference || undefined,
                    note: note || undefined,
                  }),
                'Payment recorded',
              )
            }
          >
            Record payment
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label="Amount (NPR)" type="number" step="any" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Select
          label="Method"
          options={Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label }))}
          value={method}
          onChange={(e) => setMethod(e.target.value as PaymentMethod)}
        />
        <Input label="Reference (optional)" value={reference} onChange={(e) => setReference(e.target.value)} />
        <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
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
  const { busy, error, run } = useSubmit(onDone, onClose);
  const [discountType, setDiscountType] = useState<DiscountType>(invoice.discountType);
  const [discountValue, setDiscountValue] = useState(String(invoice.discountValue));
  const [taxRate, setTaxRate] = useState(String(invoice.taxRate));
  const [notes, setNotes] = useState(invoice.notes ?? '');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Adjust invoice"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
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
                  }),
                'Invoice updated',
              )
            }
          >
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Select
          label="Discount type"
          options={[
            { value: 'NONE', label: 'No discount' },
            { value: 'PERCENT', label: 'Percentage (%)' },
            { value: 'AMOUNT', label: 'Flat amount (NPR)' },
          ]}
          value={discountType}
          onChange={(e) => setDiscountType(e.target.value as DiscountType)}
        />
        {discountType !== 'NONE' && (
          <Input label="Discount value" type="number" step="any" min={0} value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
        )}
        <Input label="Tax rate %" type="number" step="any" min={0} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />
        <Textarea label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
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
  const { busy, error, run } = useSubmit(onDone, onClose);
  const refundable = invoice.amountPaid - invoice.amountRefunded;
  const [amount, setAmount] = useState(String(refundable));
  const [reason, setReason] = useState('');

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Request refund"
      description={`Refundable amount ${formatMoney(refundable)}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            variant="danger"
            loading={busy}
            onClick={() =>
              run(
                () => invoicesApi.requestRefund(invoice.id, { amount: Number(amount), reason: reason.trim() }),
                'Refund requested — awaiting approval',
              )
            }
          >
            Submit request
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label="Amount (NPR)" type="number" step="any" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
        <Textarea label="Reason" value={reason} onChange={(e) => setReason(e.target.value)} />
        <p className="text-xs text-muted">A refund must be approved by an authorised user before it takes effect.</p>
      </div>
    </Modal>
  );
}
