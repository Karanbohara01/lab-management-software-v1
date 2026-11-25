import { useState, useEffect } from 'react';
import { Download, FileText, Image as ImageIcon, Eye, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { useT } from '@/i18n';
import { inquiriesApi } from './api';
import type { TicketMessage } from './types';

interface TicketAttachmentViewProps {
  ticketId: number;
  message: TicketMessage;
  isPlatform?: boolean;
}

function formatBytes(bytes?: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function TicketAttachmentView({ ticketId, message, isPlatform = false }: TicketAttachmentViewProps) {
  const t = useT();
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const isImage = message.fileType?.startsWith('image/') ||
    /\.(png|jpe?g|webp|gif|svg)$/i.test(message.fileName || '');

  useEffect(() => {
    let active = true;
    setLoading(true);

    const fetcher = isPlatform
      ? inquiriesApi.platform.getAttachmentBlobUrl(ticketId, message.id)
      : inquiriesApi.clinic.getAttachmentBlobUrl(ticketId, message.id);

    fetcher
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
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [ticketId, message.id, isPlatform]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      if (isPlatform) {
        await inquiriesApi.platform.downloadAttachment(ticketId, message.id, message.fileName || 'attachment');
      } else {
        await inquiriesApi.clinic.downloadAttachment(ticketId, message.id, message.fileName || 'attachment');
      }
    } finally {
      setDownloading(false);
    }
  };

  if (!message.hasAttachment) return null;

  return (
    <div className="mt-3 pt-3 border-t border-border/70">
      <div className="text-xs font-semibold text-muted mb-2 flex items-center gap-1.5">
        {isImage ? <ImageIcon className="w-3.5 h-3.5 text-primary" /> : <FileText className="w-3.5 h-3.5 text-primary" />}
        <span>{t('Attachment')}</span>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-xs text-muted py-2">
          <Spinner className="w-4 h-4 text-primary" />
          <span>{t('Loading attachment...')}</span>
        </div>
      ) : isImage && blobUrl ? (
        <div className="space-y-2">
          <div
            onClick={() => setModalOpen(true)}
            className="group relative max-w-sm rounded-lg overflow-hidden border border-border bg-surface-muted cursor-pointer shadow-sm hover:shadow transition-all"
          >
            <img
              src={blobUrl}
              alt={message.fileName || 'Ticket attachment'}
              className="w-full max-h-56 object-cover object-top transition-transform duration-200 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-medium">
              <Eye className="w-4 h-4" />
              <span>{t('Click to enlarge')}</span>
            </div>
          </div>
          <div className="flex items-center justify-between max-w-sm text-xs text-muted">
            <span className="truncate pr-2">{message.fileName} ({formatBytes(message.fileSizeBytes)})</span>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="inline-flex items-center gap-1 text-primary hover:underline font-medium shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{t('Download')}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-surface-muted max-w-md">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div className="truncate">
              <div className="text-sm font-medium text-foreground truncate">{message.fileName || t('Document')}</div>
              <div className="text-xs text-muted">{formatBytes(message.fileSizeBytes)}</div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-3">
            {blobUrl && (
              <a
                href={blobUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs text-muted hover:text-foreground p-1.5 rounded hover:bg-surface"
                title={t('Open in new tab')}
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            )}
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownload}
              loading={downloading}
            >
              <Download className="w-3.5 h-3.5" />
              {t('Download')}
            </Button>
          </div>
        </div>
      )}

      {/* Modal for enlarging images */}
      {isImage && blobUrl && (
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title={message.fileName || t('Attachment Preview')}
          size="xl"
        >
          <div className="space-y-4">
            <div className="max-h-[75vh] flex items-center justify-center bg-black/5 dark:bg-black/40 rounded-lg p-2 overflow-auto">
              <img
                src={blobUrl}
                alt={message.fileName || 'Attachment preview'}
                className="max-h-[70vh] w-auto max-w-full rounded object-contain"
              />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-border">
              <div className="text-xs text-muted">
                {message.fileName} • {formatBytes(message.fileSizeBytes)}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="secondary" onClick={() => setModalOpen(false)}>
                  {t('Close')}
                </Button>
                <Button variant="primary" onClick={handleDownload} loading={downloading}>
                  <Download className="w-4 h-4" />
                  {t('Download')}
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
