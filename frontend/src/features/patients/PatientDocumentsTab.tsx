import { useState, useMemo, useEffect } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Plus,
  Search,
  Eye,
  ExternalLink,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { Spinner } from '@/components/ui/Spinner';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { useT, LOCALE_TAG, getLocale } from '@/i18n';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { patientsApi } from './api';
import { UploadPatientDocumentModal } from './UploadPatientDocumentModal';
import {
  type PatientDocument,
  type PatientDocumentType,
  PATIENT_DOCUMENT_TYPE_LABEL,
} from './types';

interface PatientDocumentsTabProps {
  patientId: number;
}

export function PatientDocumentsTab({ patientId }: PatientDocumentsTabProps) {
  const t = useT();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.PATIENT_WRITE);

  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewDoc, setPreviewDoc] = useState<PatientDocument | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<PatientDocument | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (!previewDoc) {
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

  const { data, loading, error, refetch } = useQuery(
    () => patientsApi.documents.list(patientId),
    [patientId]
  );

  const documents = data || [];

  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      const matchesType = selectedType === 'ALL' || doc.documentType === selectedType;
      const q = searchQuery.trim().toLowerCase();
      const matchesQuery =
        !q ||
        doc.title.toLowerCase().includes(q) ||
        doc.fileName.toLowerCase().includes(q) ||
        (doc.doctorOrFacility && doc.doctorOrFacility.toLowerCase().includes(q)) ||
        (doc.notes && doc.notes.toLowerCase().includes(q));
      return matchesType && matchesQuery;
    });
  }, [documents, selectedType, searchQuery]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await patientsApi.documents.delete(patientId, deleteTarget.id);
      toast.success(t('Document removed'));
      setDeleteTarget(null);
      refetch();
    } catch {
      toast.error(t('Failed to delete document'));
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const getTypeTone = (type: PatientDocumentType): 'neutral' | 'info' | 'success' | 'warning' => {
    switch (type) {
      case 'PRESCRIPTION':
        return 'info';
      case 'PRIOR_REPORT':
        return 'success';
      case 'IMAGING':
        return 'warning';
      default:
        return 'neutral';
    }
  };

  const locale = getLocale();
  const localeTag = LOCALE_TAG[locale] || 'en-US';

  return (
    <div className="space-y-4">
      {/* Action Header & Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative w-full max-w-xs">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Search documents, doctors, notes…')}
              className="w-full rounded-lg border border-border bg-surface py-1.5 pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">{t('All Categories')} ({documents.length})</option>
            {Object.entries(PATIENT_DOCUMENT_TYPE_LABEL).map(([val, label]) => (
              <option key={val} value={val}>
                {t(label)}
              </option>
            ))}
          </select>
        </div>

        {canWrite && (
          <Button onClick={() => setUploadOpen(true)} size="sm">
            <Plus className="h-4 w-4" />
            <span>{t('Upload Document')}</span>
          </Button>
        )}
      </div>

      {/* Main Content Area */}
      {loading && !data ? (
        <LoadingState label={t('Loading medical documents…')} />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : filteredDocuments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-muted text-muted-foreground">
            <FolderOpen className="h-6 w-6" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-foreground">
            {documents.length === 0 ? t('No Medical Documents Uploaded') : t('No Matching Documents')}
          </h3>
          <p className="mt-1 max-w-sm text-xs text-muted-foreground">
            {documents.length === 0
              ? t(
                  'Keep prescriptions, prior lab results, hospital discharge summaries, and scan reports organized in one patient chart.'
                )
              : t('No uploaded documents matched your category and search criteria.')}
          </p>
          {canWrite && documents.length === 0 && (
            <Button className="mt-4" size="sm" onClick={() => setUploadOpen(true)}>
              <Plus className="h-4 w-4" />
              <span>{t('Upload First Document')}</span>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {filteredDocuments.map((doc) => {
            const isImage = doc.fileType.startsWith('image/');
            const isPdf = doc.fileType === 'application/pdf';

            return (
              <div
                key={doc.id}
                className="group relative flex flex-col justify-between overflow-hidden rounded-xl border border-border bg-surface p-4 shadow-xs transition-shadow hover:shadow-sm"
              >
                <div>
                  {/* Top Row: Icon + Type Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-muted border border-border/80">
                      {isImage ? (
                        <ImageIcon className="h-5 w-5 text-primary" />
                      ) : isPdf ? (
                        <FileText className="h-5 w-5 text-destructive" />
                      ) : (
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <Badge tone={getTypeTone(doc.documentType)}>
                      {t(PATIENT_DOCUMENT_TYPE_LABEL[doc.documentType] || doc.documentType)}
                    </Badge>
                  </div>

                  {/* Title & Filename */}
                  <div className="mt-3">
                    <h4 className="text-sm font-semibold text-foreground line-clamp-1" title={doc.title}>
                      {doc.title}
                    </h4>
                    <p className="mt-0.5 truncate text-[11px] text-muted-foreground font-mono" title={doc.fileName}>
                      {doc.fileName} · {formatFileSize(doc.fileSizeBytes)}
                    </p>
                  </div>

                  {/* Metadata Chips */}
                  <div className="mt-3 space-y-1.5 text-xs text-muted-foreground">
                    {doc.documentDate && (
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        <span>{doc.documentDate}</span>
                      </div>
                    )}
                    {doc.doctorOrFacility && (
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{doc.doctorOrFacility}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[11px] opacity-80">
                      <User className="h-3 w-3 shrink-0" />
                      <span>
                        {t('Uploaded by')} {doc.uploadedBy} ·{' '}
                        {new Date(doc.uploadedAt).toLocaleDateString(localeTag)}
                      </span>
                    </div>
                  </div>

                  {/* Clinical Notes excerpt */}
                  {doc.notes && (
                    <div className="mt-3 rounded-lg bg-surface-muted/60 p-2 text-[11px] text-foreground line-clamp-2">
                      {doc.notes}
                    </div>
                  )}
                </div>

                {/* Bottom Actions Toolbar */}
                <div className="mt-4 flex items-center justify-between border-t border-border/60 pt-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setPreviewDoc(doc)}
                      title={t('Preview Document')}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      <span>{t('View')}</span>
                    </Button>

                    <button
                      type="button"
                      onClick={() => patientsApi.documents.download(patientId, doc.id, doc.fileName)}
                      className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
                      title={t('Download')}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  {canWrite && (
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(doc)}
                      className="rounded-md p-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                      title={t('Delete Document')}
                      aria-label={t('Delete Document')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      <UploadPatientDocumentModal
        open={uploadOpen}
        patientId={patientId}
        onClose={() => setUploadOpen(false)}
        onSuccess={() => refetch()}
      />

      {/* Document Preview Modal */}
      {previewDoc && (
        <Modal
          open={Boolean(previewDoc)}
          onClose={() => setPreviewDoc(null)}
          title={previewDoc.title}
          footer={
            <div className="flex items-center justify-between w-full">
              <span className="text-xs text-muted-foreground font-mono">
                {previewDoc.fileName} ({formatFileSize(previewDoc.fileSizeBytes)})
              </span>
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
                <div className="py-12 text-center text-sm text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-3" />
                  <p>{t('Preview is not available directly for this file format.')}</p>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3 inline-flex items-center gap-1.5"
                    onClick={() => patientsApi.documents.download(patientId, previewDoc.id, previewDoc.fileName)}
                  >
                    <Download className="h-4 w-4" />
                    <span>{t('Download file')}</span>
                  </Button>
                </div>
              )
            ) : (
              <div className="py-12 text-center text-sm text-muted-foreground">
                <AlertTriangle className="mx-auto h-10 w-10 text-destructive/80 mb-2" />
                <p>{t('Failed to load document preview.')}</p>
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-3 inline-flex items-center gap-1.5"
                  onClick={() => patientsApi.documents.download(patientId, previewDoc.id, previewDoc.fileName)}
                >
                  <Download className="h-4 w-4" />
                  <span>{t('Download file directly')}</span>
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <Modal
          open={Boolean(deleteTarget)}
          onClose={() => setDeleteTarget(null)}
          title={t('Delete Medical Document')}
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeleteTarget(null)} disabled={isDeleting}>
                {t('Cancel')}
              </Button>
              <Button variant="danger" onClick={handleDelete} loading={isDeleting}>
                {t('Confirm Delete')}
              </Button>
            </>
          }
        >
          <div className="flex items-start gap-3 py-2 text-sm">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">
                {t('Are you sure you want to delete this document?')}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                &ldquo;{deleteTarget.title}&rdquo; ({deleteTarget.fileName}) {t('will be archived and removed from this patient chart.')}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
