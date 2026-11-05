import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { ApiError } from '@/types/api';
import { getLocale, LOCALE_TAG, useT } from '@/i18n';
import { commissionApi } from './api';
import { PAYMENT_METHOD_LABEL, type DoctorCommissionSummary, type PaymentMethod } from './types';

function dt(iso: string): string {
  return new Date(iso).toLocaleString(LOCALE_TAG[getLocale()], { dateStyle: 'medium', timeStyle: 'short' });
}

export function DoctorCommissionModal({
  summary,
  canManage,
  onClose,
  onPaid,
}: {
  summary: DoctorCommissionSummary;
  canManage: boolean;
  onClose: () => void;
  onPaid: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const entriesQ = useQuery(() => commissionApi.entries(summary.doctorId), [summary.doctorId]);
  const payoutsQ = useQuery(() => commissionApi.payouts(summary.doctorId), [summary.doctorId]);

  const [showPayoutForm, setShowPayoutForm] = useState(false);
  const [amount, setAmount] = useState(String(summary.outstanding));
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const numericAmount = Number(amount);
  const invalid = !amount || !Number.isFinite(numericAmount) || numericAmount <= 0 || numericAmount > summary.outstanding;

  const recordPayout = async () => {
    setSaving(true);
    setError(null);
    try {
      await commissionApi.recordPayout({
        doctorId: summary.doctorId,
        amount: numericAmount,
        method,
        reference: reference || undefined,
        note: note || undefined,
      });
      toast.success(t('Payout recorded'));
      setShowPayoutForm(false);
      payoutsQ.refetch();
      onPaid();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('Unable to record payout'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open onClose={onClose} title={summary.doctorName} size="lg">
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-3 text-sm">
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted">{t('Earned')}</p>
            <p className="text-lg font-semibold text-foreground">{formatMoney(summary.totalEarned)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted">{t('Paid')}</p>
            <p className="text-lg font-semibold text-foreground">{formatMoney(summary.totalPaid)}</p>
          </div>
          <div className="rounded-md border border-border p-3">
            <p className="text-xs text-muted">{t('Outstanding')}</p>
            <p className="text-lg font-semibold text-warning">{formatMoney(summary.outstanding)}</p>
          </div>
        </div>

        {canManage && summary.outstanding > 0 && (
          <div>
            {!showPayoutForm ? (
              <Button onClick={() => setShowPayoutForm(true)}>{t('Record payout')}</Button>
            ) : (
              <div className="space-y-3 rounded-md border border-border p-4">
                {error && <Alert tone="danger">{error}</Alert>}
                <Input
                  label={t('Amount (NPR)')}
                  type="number"
                  step="any"
                  min={0}
                  max={summary.outstanding}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {numericAmount > summary.outstanding && (
                  <Alert tone="warning">{t('Exceeds outstanding balance of {amount}.', { amount: formatMoney(summary.outstanding) })}</Alert>
                )}
                <Select
                  label={t('Method')}
                  options={Object.entries(PAYMENT_METHOD_LABEL).map(([value, label]) => ({ value, label: t(label) }))}
                  value={method}
                  onChange={(e) => setMethod(e.target.value as PaymentMethod)}
                />
                <Input label={t('Reference (optional)')} value={reference} onChange={(e) => setReference(e.target.value)} />
                <Textarea label={t('Note (optional)')} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => setShowPayoutForm(false)}>
                    {t('Cancel')}
                  </Button>
                  <Button onClick={recordPayout} loading={saving} disabled={invalid}>
                    {t('Record payout')}
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">{t('Earned entries')}</p>
          {entriesQ.loading && !entriesQ.data ? (
            <LoadingState />
          ) : entriesQ.data && entriesQ.data.length === 0 ? (
            <p className="text-sm text-muted">{t('No entries yet.')}</p>
          ) : (
            <div className="max-h-64 overflow-y-auto rounded-md border border-border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-surface">
                  <tr className="border-b border-border text-left uppercase tracking-wide text-muted">
                    <th className="px-3 py-1.5">{t('Invoice')}</th>
                    <th className="px-3 py-1.5">{t('Order')}</th>
                    <th className="px-3 py-1.5 text-right">{t('Base')}</th>
                    <th className="px-3 py-1.5 text-right">{t('Rate')}</th>
                    <th className="px-3 py-1.5 text-right">{t('Commission')}</th>
                    <th className="px-3 py-1.5">{t('Earned')}</th>
                  </tr>
                </thead>
                <tbody>
                  {entriesQ.data?.map((e) => (
                    <tr key={e.id} className="border-b border-border last:border-0">
                      <td className="px-3 py-1.5 font-mono">{e.invoiceNumber}</td>
                      <td className="px-3 py-1.5 font-mono">{e.orderNumber}</td>
                      <td className="px-3 py-1.5 text-right">{formatMoney(e.baseAmount)}</td>
                      <td className="px-3 py-1.5 text-right">{e.rate}%</td>
                      <td className="px-3 py-1.5 text-right font-medium">{formatMoney(e.commissionAmount)}</td>
                      <td className="px-3 py-1.5 text-muted">{dt(e.earnedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-foreground">{t('Payout history')}</p>
          {payoutsQ.loading && !payoutsQ.data ? (
            <LoadingState />
          ) : payoutsQ.data && payoutsQ.data.length === 0 ? (
            <p className="text-sm text-muted">{t('No payouts recorded yet.')}</p>
          ) : (
            <ul className="divide-y divide-border rounded-md border border-border text-sm">
              {payoutsQ.data?.map((p) => (
                <li key={p.id} className="flex items-center justify-between px-3 py-2">
                  <div>
                    <p className="font-medium text-foreground">{formatMoney(p.amount)}</p>
                    <p className="text-xs text-muted">
                      {dt(p.paidAt)} · {t(PAYMENT_METHOD_LABEL[p.method])} · {p.paidBy}
                      {p.reference ? ` · ${p.reference}` : ''}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Modal>
  );
}
