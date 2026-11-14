import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { samplesApi } from './api';
import type { SampleDetail } from './types';
import { useT } from '@/i18n';

/** The minimum a caller needs to supply — both SampleDetail and SampleListItem satisfy it. */
export type CollectableSample = Pick<SampleDetail, 'id' | 'accessionNumber' | 'patientName' | 'patientMrn'>;

/**
 * The one place a collection is recorded, from every screen that offers it. On success it calls
 * {@code onDone} only — the parent decides whether to close or move on to the next sample — and
 * {@code onClose} means the person dismissed it without collecting.
 */
export function CollectSampleModal({
  open,
  onClose,
  sample,
  onDone,
  progress,
}: {
  open: boolean;
  onClose: () => void;
  sample: CollectableSample;
  onDone: () => void;
  /** Shown in the title when this modal is one of a run over several samples. */
  progress?: { current: number; total: number };
}) {
  const t = useT();
  const toast = useToast();
  const [site, setSite] = useState('');
  const [container, setContainer] = useState('');
  const [note, setNote] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [paymentBlocked, setPaymentBlocked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      await samplesApi.collect(sample.id, {
        collectionSite: site || undefined,
        container: container || undefined,
        note: note || undefined,
        paymentOverrideReason: paymentBlocked ? overrideReason.trim() || undefined : undefined,
      });
      toast.success(t('Sample {accession} collected', { accession: sample.accessionNumber }));
      onDone();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setPaymentBlocked(true);
        setError(err.message);
      } else {
        setError(err instanceof ApiError ? err.message : t('Unable to record collection'));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        t('Collect {accession}', { accession: sample.accessionNumber }) +
        (progress ? ` ${t('({current} of {total})', progress)}` : '')
      }
      description={`${sample.patientName} · ${sample.patientMrn}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button
            onClick={submit}
            loading={busy}
            disabled={paymentBlocked && !overrideReason.trim()}
          >
            {t(paymentBlocked ? 'Collect anyway' : 'Mark collected')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        {paymentBlocked && (
          <Input
            label={t('Reason to collect without payment')}
            placeholder={t('e.g. Doctor authorised, payment to follow')}
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
          />
        )}
        <Input label={t('Collection site')} placeholder={t('e.g. Left antecubital vein')} value={site} onChange={(e) => setSite(e.target.value)} />
        <Input label={t('Container / tube')} placeholder={t('e.g. EDTA (lavender)')} value={container} onChange={(e) => setContainer(e.target.value)} />
        <Textarea label={t('Note (optional)')} value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
