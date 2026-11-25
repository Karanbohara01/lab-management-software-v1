import { useState, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Plus,
  Eye,
  X,
  ExternalLink,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/i18n';
import { patientsApi } from '@/features/patients/api';
import type { PatientDocument } from '@/features/patients/types';
import { PATIENT_DOCUMENT_TYPE_LABEL } from '@/features/patients/types';
import { UploadPatientDocumentModal } from '@/features/patients/UploadPatientDocumentModal';

interface OrderPrescriptionPickerProps {
  patientId: number | null;
  selectedDocId: number | null;
  onSelectDocId: (id: number | null) => void;
}

export function OrderPrescriptionPicker({
  patientId,
  selectedDocId,
  onSelectDocId,
}: OrderPrescriptionPickerProps) {
  const t = useT();

  const [documents, setDocuments] = useState<PatientDocument[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Fetch patient documents whenever patientId changes
  useEffect(() => {
    if (!patientId) {
      setDocuments([]);
      return;
    }

    let active = true;
    setLoading(true);
    patientsApi.documents
      .list(patientId)
      .then((docs) => {
        if (active) setDocuments(docs);
      })
      .catch(() => {
        if (active) setDocuments([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [patientId]);

  // Load authenticated preview blob URL
  useEffect(() => {
    if (!previewDoc || !patientId) {
      if (previewBlobUrl) {
        URL.revokeObjectURL(previewBlobUrl);
        setPreviewBlobUrl(null);
      }
      return;
    }

    let active = true;
    setPreviewLoading(true);
    patientsApi.documents
      .getBlobUrl(patientId, previewDoc.id)
      .then((url) => {
        if (active) setPreviewBlobUrl(url);
        else URL.revokeObjectURL(url);
      })
      .catch(() => {
        if (active) setPreviewBlobUrl(null);
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });

    return () => {
      active = false;
    };
  }, [previewDoc, patientId]);

  if (!patientId) {
    return (
      <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted">
        {t('Select a patient above to attach a doctor prescription or clinical document.')}
      </div>
    );
  }

  const selectedDoc = documents.find((d) => d.id === selectedDocId) || null;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-foreground">
          {t('Prescription / Clinical document')}
        </label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-xs text-primary"
          onClick={() => setUploadOpen(true)}
        >
          <Plus className="h-3.5 w-3.5" />
          <span>{t('Upload new')}</span>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-2 text-xs text-muted">
          <Spinner className="h-3.5 w-3.5" />
          <span>{t('Checking patient records…')}</span>
        </div>
      ) : selectedDoc ? (
        /* Attached Document Card */
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-surface border border-border">
              {selectedDoc.fileType.startsWith('image/') ? (
                <ImageIcon className="h-4 w-4 text-primary" />
              ) : (
                <FileText className="h-4 w-4 text-destructive" />
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-xs font-semibold text-foreground" title={selectedDoc.title}>
                {selectedDoc.title}
              </p>
              <div className="flex items-center gap-2 text-[11px] text-muted">
                <span className="truncate font-mono">{selectedDoc.fileName}</span>
                {selectedDoc.doctorOrFacility && (
                  <>
                    <span>·</span>
                    <span className="truncate">{selectedDoc.doctorOrFacility}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 ml-2">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => setPreviewDoc(selectedDoc)}
              title={t('Preview')}
            >
              <Eye className="h-3.5 w-3.5" />
              <span>{t('View')}</span>
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-muted hover:text-danger"
              onClick={() => onSelectDocId(null)}
              title={t('Detach prescription')}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : documents.length > 0 ? (
        /* Select from existing patient documents */
        <div className="space-y-2">
          <select
            className="w-full rounded-md border border-input bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
            value={selectedDocId ?? ''}
            onChange={(e) => onSelectDocId(e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">{t('— None (or select a past prescription) —')}</option>
            {documents.map((doc) => (
              <option key={doc.id} value={doc.id}>
                {doc.title} ({doc.fileName}) · {t(PATIENT_DOCUMENT_TYPE_LABEL[doc.documentType] || doc.documentType)}
              </option>
            ))}
          </select>
        </div>
      ) : (
        /* No documents uploaded for this patient yet */
        <div className="flex items-center justify-between rounded-lg border border-dashed border-border p-3 text-xs text-muted">
          <span>{t('No prior prescriptions or documents recorded.')}</span>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setUploadOpen(true)}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{t('Attach prescription')}</span>
          </Button>
        </div>
      )}

      {/* Upload Modal */}
      {uploadOpen && (
        <UploadPatientDocumentModal
          open={uploadOpen}
          patientId={patientId}
          onClose={() => setUploadOpen(false)}
          onSuccess={(doc) => {
            setDocuments((prev) => [doc, ...prev]);
            onSelectDocId(doc.id);
            setUploadOpen(false);
          }}
        />
      )}

      {/* Preview Modal */}
      {previewDoc && (
        <Modal
          open={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted font-mono">{previewDoc.fileName}</span>
              <div className="flex gap-2">
                {previewBlobUrl && (
                  <a
                    href={previewBlobUrl}
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
                  onClick={() => patientsApi.documents.download(patientId, previewDoc.id, previewDoc.fileName)}
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>{t('Download')}</span>
                </Button>
                <Button size="sm" variant="secondary" onClick={() => setPreviewDoc(null)}>
                  {t('Close')}
                </Button>
              </div>
            </div>
          }
        >
          <div className="max-h-[70vh] overflow-auto">
            {previewLoading ? (
              <div className="flex h-56 items-center justify-center">
                <Spinner className="h-6 w-6 text-primary" label={t('Loading preview...')} />
              </div>
            ) : previewBlobUrl ? (
              previewDoc.fileType.startsWith('image/') ? (
                <div className="flex items-center justify-center bg-black/5 rounded-xl p-2">
                  <img
                    src={previewBlobUrl}
                    alt={previewDoc.title}
                    className="max-h-[60vh] w-auto max-w-full rounded-lg object-contain"
                  />
                </div>
              ) : previewDoc.fileType === 'application/pdf' ? (
                <iframe
                  src={previewBlobUrl}
                  title={previewDoc.title}
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
                <p>{t('Failed to load document preview.')}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
