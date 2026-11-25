import { useState, useEffect } from 'react';
import { ExternalLink, Download, FileText, AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/i18n';
import { patientsApi } from '@/features/patients/api';
import type { OrderPrescriptionSummary } from './types';

interface PrescriptionViewerModalProps {
  open: boolean;
  patientId: number;
  prescription: OrderPrescriptionSummary | null;
  onClose: () => void;
}

export function PrescriptionViewerModal({
  open,
  patientId,
  prescription,
  onClose,
}: PrescriptionViewerModalProps) {
  const t = useT();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !prescription || !patientId) {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
        setBlobUrl(null);
      }
      return;
    }

    let active = true;
    setLoading(true);
    patientsApi.documents
      .getBlobUrl(patientId, prescription.id)
      .then((url) => {
        if (active) setBlobUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {
        if (active) setBlobUrl(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [open, prescription, patientId]);

  if (!prescription) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={prescription.title || t('Doctor Prescription')}
      footer={
        <div className="flex items-center justify-between w-full">
          <div className="text-xs text-muted font-mono truncate max-w-[200px] sm:max-w-xs">
            {prescription.fileName}
            {prescription.doctorOrFacility ? ` · ${prescription.doctorOrFacility}` : ''}
          </div>
          <div className="flex gap-2">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground hover:bg-surface-muted"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                <span>{t('Open in new tab')}</span>
              </a>
            )}
            <Button
              size="sm"
              variant="secondary"
              onClick={() => patientsApi.documents.download(patientId, prescription.id, prescription.fileName)}
            >
              <Download className="h-3.5 w-3.5" />
              <span>{t('Download')}</span>
            </Button>
            <Button size="sm" variant="secondary" onClick={onClose}>
              {t('Close')}
            </Button>
          </div>
        </div>
      }
    >
      <div className="max-h-[70vh] overflow-auto">
        {loading ? (
          <div className="flex h-56 items-center justify-center">
            <Spinner className="h-6 w-6 text-primary" label={t('Loading prescription preview...')} />
          </div>
        ) : blobUrl ? (
          prescription.fileType.startsWith('image/') ? (
            <div className="flex items-center justify-center bg-black/5 rounded-xl p-2">
              <img
                src={blobUrl}
                alt={prescription.title}
                className="max-h-[60vh] w-auto max-w-full rounded-lg object-contain"
              />
            </div>
          ) : prescription.fileType === 'application/pdf' ? (
            <iframe
              src={blobUrl}
              title={prescription.title}
              className="h-[60vh] w-full rounded-lg border border-border"
            />
          ) : (
            <div className="py-12 text-center text-sm text-muted">
              <FileText className="mx-auto h-12 w-12 text-muted mb-3" />
              <p>{t('Preview is not available directly for this file format.')}</p>
            </div>
          )
        ) : (
          <div className="py-12 text-center text-sm text-muted">
            <AlertTriangle className="mx-auto h-10 w-10 text-danger/80 mb-2" />
            <p>{t('Failed to load prescription document preview.')}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
