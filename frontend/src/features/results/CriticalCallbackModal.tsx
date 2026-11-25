import { useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { useT, tOpts } from '@/i18n';
import { resultsApi } from './api';
import { flagTone, type ContactMethod, type ResultDetail } from './types';

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
  const t = useT();
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
        toast.success(t('Callback requirement waived'));
      } else {
        if (name.trim().length < 2) return;
        await resultsApi.logCriticalCallback(result.id, {
          notifiedName: name.trim(),
          notifiedRole: role.trim() || undefined,
          contactMethod: method,
          readBackConfirmed: readBack,
          remarks: remarks.trim() || undefined,
        });
        toast.success(t('Critical-value callback recorded'));
      }
      onLogged();
      onClose();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : t('Unable to record callback'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Critical-value callback · {code}', { code: result.testCode })}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="button" loading={busy} onClick={submit}>
            {mode === 'waive' ? t('Waive requirement') : t('Record callback')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {/* Critical Values Summary Readout for the phone call */}
        <div className="rounded-lg border border-critical/30 bg-critical/5 p-3.5 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-critical">
            <span className="flex items-center gap-1.5 uppercase tracking-wider">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
              {t('Values to Read Back')}
            </span>
            <span className="font-mono text-muted text-[11px]">
              {result.patientName} · {result.patientMrn}
            </span>
          </div>
          <div className="divide-y divide-critical/10 text-sm">
            {result.values
              .filter((v) => flagTone(v.flag) === 'critical')
              .map((v) => (
                <div key={v.parameterId} className="flex justify-between items-center py-1.5 first:pt-0 last:pb-0">
                  <span className="font-medium text-foreground">{v.parameterName}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-critical tabular-nums text-base">
                      {v.valueNumeric != null ? v.valueNumeric : v.valueText} {v.unit ?? ''}
                    </span>
                    <span className="text-xs text-muted font-mono tabular-nums">
                      ({t('Ref')}: {v.referenceText ?? '—'})
                    </span>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <Alert tone="danger">
          {t('A critical value must be communicated to the treating clinician / ward with read-back confirmation.')}
        </Alert>
        <div className="flex gap-1 text-sm border-b border-border pb-2">
          <button
            type="button"
            onClick={() => setMode('log')}
            className={mode === 'log' ? 'rounded-md bg-primary/10 px-3 py-1 font-medium text-primary' : 'px-3 py-1 text-muted hover:text-foreground'}
          >
            {t('Log callback')}
          </button>
          <button
            type="button"
            onClick={() => setMode('waive')}
            className={mode === 'waive' ? 'rounded-md bg-primary/10 px-3 py-1 font-medium text-primary' : 'px-3 py-1 text-muted hover:text-foreground'}
          >
            {t('Waive')}
          </button>
        </div>

        {mode === 'log' ? (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                label={t('Notified person')}
                placeholder={t('e.g. Dr. Sharma')}
                value={name}
                onChange={(e) => setName(e.target.value)}
                autoFocus
              />
              <div>
                <Input
                  label={t('Role / designation')}
                  placeholder={t('e.g. Ward nurse, Dr on call')}
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                />
                <div className="mt-1 flex flex-wrap gap-1">
                  {['Treating Doctor', 'Ward Nurse', 'Resident on Duty', 'ICU In-charge'].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      onClick={() => setRole(chip)}
                      className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] text-muted hover:text-foreground hover:bg-surface-muted/80 transition-colors"
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
              <Select
                label={t('Contact method')}
                options={tOpts(METHODS)}
                value={method}
                onChange={(e) => setMethod(e.target.value as ContactMethod)}
              />
              <div className="flex items-center pt-6">
                <Checkbox
                  label={t('Read-back confirmed')}
                  checked={readBack}
                  onChange={(e) => setReadBack(e.target.checked)}
                />
              </div>
            </div>
            {!readBack && (
              <p className="text-xs text-danger font-medium">
                {t('Warning: Accreditation requires read-back confirmation whenever verbal critical communication occurs.')}
              </p>
            )}
            <Textarea label={t('Remarks (optional)')} rows={2} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
          </>
        ) : (
          <Textarea
            label={t('Reason for waiving the callback')}
            placeholder={t('Document clinical rationale for waiving immediate verbal notification…')}
            rows={3}
            value={waiveReason}
            onChange={(e) => setWaiveReason(e.target.value)}
          />
        )}
      </div>
    </Modal>
  );
}
