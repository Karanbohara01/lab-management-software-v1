import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Textarea } from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { samplesApi } from './api';
import { SPECIMEN_CONDITION_FLAGS, type SpecimenConditionInput } from './types';
import { useT } from '@/i18n';

const EMPTY: SpecimenConditionInput = {
  haemolysed: false,
  lipaemic: false,
  icteric: false,
  clotted: false,
  insufficientVolume: false,
  wrongContainer: false,
  note: '',
};

export function ReceiveSampleModal({
  open,
  onClose,
  sampleId,
  accession,
  onReceived,
  progress,
}: {
  open: boolean;
  onClose: () => void;
  sampleId: number;
  accession: string;
  onReceived: () => void;
  /** Shown in the title when this modal is one of a run over several samples. */
  progress?: { current: number; total: number };
}) {
  const t = useT();
  const toast = useToast();
  const [condition, setCondition] = useState<SpecimenConditionInput>(EMPTY);
  const [busy, setBusy] = useState(false);

  const anyFlag =
    SPECIMEN_CONDITION_FLAGS.some((f) => condition[f.key]) || !!condition.note?.trim();

  const submit = async () => {
    setBusy(true);
    try {
      await samplesApi.receive(sampleId, { condition: anyFlag ? condition : undefined });
      toast.success(t('{accession} received into the lab', { accession }));
      setCondition(EMPTY);
      onReceived();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to receive sample'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Receive {accession}', { accession }) + (progress ? ` ${t('({current} of {total})', progress)}` : '')}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button type="button" loading={busy} onClick={submit}>
            {t('Receive sample')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        <p className="text-sm text-muted">
          {t(
            'Record any problem with the specimen. Condition flags are carried onto the results and printed on the report.',
          )}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {SPECIMEN_CONDITION_FLAGS.map((f) => (
            <Checkbox
              key={f.key}
              label={t(f.label)}
              checked={condition[f.key] as boolean}
              onChange={(e) => setCondition((c) => ({ ...c, [f.key]: e.target.checked }))}
            />
          ))}
        </div>
        <Textarea
          label={t('Condition note (optional)')}
          rows={2}
          value={condition.note ?? ''}
          onChange={(e) => setCondition((c) => ({ ...c, note: e.target.value }))}
        />
      </div>
    </Modal>
  );
}
