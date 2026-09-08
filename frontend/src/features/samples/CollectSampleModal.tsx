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

export function CollectSampleModal({
  open,
  onClose,
  sample,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  sample: SampleDetail;
  onDone: () => void;
}) {
  const toast = useToast();
  const [site, setSite] = useState('');
  const [container, setContainer] = useState('');
  const [note, setNote] = useState('');
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
      });
      toast.success(`Sample ${sample.accessionNumber} collected`);
      onDone();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Unable to record collection');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Collect ${sample.accessionNumber}`}
      description={`${sample.patientName} · ${sample.patientMrn}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            Mark collected
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <Alert tone="danger">{error}</Alert>}
        <Input label="Collection site" placeholder="e.g. Left antecubital vein" value={site} onChange={(e) => setSite(e.target.value)} />
        <Input label="Container / tube" placeholder="e.g. EDTA (lavender)" value={container} onChange={(e) => setContainer(e.target.value)} />
        <Textarea label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
    </Modal>
  );
}
