import { useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send, CheckCircle2, User, ShieldCheck, Paperclip, X, FileText, Image as ImageIcon } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Textarea } from '@/components/ui/Textarea';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';
import { ApiError } from '@/types/api';
import { inquiriesApi } from './api';
import { TicketAttachmentView } from './TicketAttachmentView';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  STATUS_LABELS,
  STATUS_TONES,
  type TicketMessage,
} from './types';

function formatDt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(LOCALE_TAG[getLocale()], {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ClinicTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const ticketId = Number(id);
  const t = useT();
  const toast = useToast();

  const [replyMessage, setReplyMessage] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [submitting, setSubmitting] = useState(false);
  const [closing, setClosing] = useState(false);

  const {
    data: ticket,
    loading,
    error,
    refetch,
  } = useQuery(
    () => (ticketId ? inquiriesApi.clinic.get(ticketId) : Promise.reject('Invalid ID')),
    [ticketId],
  );

  const handleFileChange = (selected: File | null) => {
    if (!selected) {
      setReplyFile(null);
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
        setFilePreviewUrl(null);
      }
      return;
    }

    if (selected.size > 15 * 1024 * 1024) {
      toast.error(t('Attachment size cannot exceed 15 MB'));
      return;
    }

    setReplyFile(selected);
    if (selected.type.startsWith('image/')) {
      const objUrl = URL.createObjectURL(selected);
      setFilePreviewUrl(objUrl);
    } else {
      if (filePreviewUrl) URL.revokeObjectURL(filePreviewUrl);
      setFilePreviewUrl(null);
    }
  };

  const removeReplyFile = () => {
    handleFileChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyMessage.trim()) return;

    setSubmitting(true);
    try {
      await inquiriesApi.clinic.addReply(ticketId, {
        message: replyMessage.trim(),
        file: replyFile || undefined,
      });
      setReplyMessage('');
      removeReplyFile();
      toast.success(t('Reply sent successfully'));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Failed to send reply'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm(t('Are you sure you want to close this ticket?'))) return;

    setClosing(true);
    try {
      await inquiriesApi.clinic.close(ticketId);
      toast.success(t('Ticket marked as closed'));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Failed to close ticket'));
    } finally {
      setClosing(false);
    }
  };

  if (loading) return <LoadingState />;
  if (error || !ticket) return <ErrorState onRetry={refetch} />;

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16">
      {/* Back button */}
      <div>
        <Link
          to="/app/support"
          className="inline-flex items-center text-sm font-medium text-muted hover:text-foreground transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1.5" />
          {t('Back to Inquiries')}
        </Link>
      </div>

      {/* Ticket Header Card */}
      <Card>
        <CardBody className="p-6">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xl font-bold tracking-tight text-primary font-sans">
                  {ticket.ticketNumber}
                </span>
                <Badge tone={STATUS_TONES[ticket.status]} variant="subtle" dot size="md">
                  {t(STATUS_LABELS[ticket.status] || ticket.status)}
                </Badge>
                <Badge tone={PRIORITY_TONES[ticket.priority]} variant="subtle" size="md">
                  {t(PRIORITY_LABELS[ticket.priority] || ticket.priority)}
                </Badge>
                <Badge tone="neutral" variant="subtle" size="md">
                  {t(CATEGORY_LABELS[ticket.category] || ticket.category)}
                </Badge>
              </div>
              <h1 className="text-heading-2 text-foreground pt-1">
                {ticket.subject}
              </h1>
              <div className="text-xs text-muted flex items-center gap-2.5 flex-wrap">
                <span>{t('Opened by')} <strong className="text-foreground">{ticket.createdByName}</strong></span>
                <span>•</span>
                <span>{t('Created')} {formatDt(ticket.createdAt)}</span>
                {ticket.assignedToName && (
                  <>
                    <span>•</span>
                    <span>{t('Assigned to')} <strong className="text-foreground">{ticket.assignedToName}</strong></span>
                  </>
                )}
              </div>
            </div>

            {ticket.status !== 'CLOSED' && (
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCloseTicket}
                loading={closing}
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {t('Close Ticket')}
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Thread Conversation */}
      <div className="space-y-4">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">
          {t('Conversation Thread')} ({ticket.messages.length})
        </h2>

        <div className="space-y-4">
          {ticket.messages.map((msg: TicketMessage) => {
            const isSuperadmin = msg.senderType === 'SUPERADMIN';
            return (
              <div
                key={msg.id}
                className={`rounded-lg border p-5 transition-all shadow-card ${
                  isSuperadmin
                    ? 'bg-primary/5 border-primary/25'
                    : 'bg-surface border-border'
                }`}
              >
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-border/60">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                        isSuperadmin
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-primary/10 text-primary border border-primary/20'
                      }`}
                    >
                      {isSuperadmin ? <ShieldCheck className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground flex items-center gap-2">
                        {msg.senderName}
                        {isSuperadmin ? (
                          <Badge tone="info" variant="subtle" size="sm">
                            {t('Support Team')}
                          </Badge>
                        ) : (
                          <Badge tone="neutral" variant="subtle" size="sm">
                            {t('Clinic Staff')}
                          </Badge>
                        )}
                      </div>
                      <div className="text-caption text-muted">
                        {formatDt(msg.createdAt)}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">
                  {msg.message}
                </div>

                {msg.hasAttachment && (
                  <TicketAttachmentView ticketId={ticket.id} message={msg} />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reply Box */}
      <Card>
        <CardHeader
          title={ticket.status === 'CLOSED' ? t('Ticket is Closed (Sending reply will reopen)') : t('Post a Reply')}
          description={t('Superadmin and support engineers will be notified of your reply.')}
        />
        <CardBody className="p-5">
          <form onSubmit={handleSendReply} className="space-y-4">
            <Textarea
              rows={4}
              value={replyMessage}
              onChange={(e) => setReplyMessage(e.target.value)}
              placeholder={t('Type your message or follow-up here...')}
              disabled={submitting}
              required
            />

            {/* Attachment preview / upload bar */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept="image/*,.pdf,.txt,.log,.csv,.json"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              {replyFile && (
                <div className="flex items-center justify-between p-2.5 mb-3 bg-surface-muted border border-border rounded-lg max-w-md">
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    {filePreviewUrl ? (
                      <img
                        src={filePreviewUrl}
                        alt="Preview"
                        className="w-10 h-10 rounded object-cover border border-border shrink-0"
                      />
                    ) : replyFile.type.startsWith('image/') ? (
                      <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <ImageIcon className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="w-8 h-8 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                    )}
                    <div className="truncate">
                      <div className="text-xs font-medium text-foreground truncate">{replyFile.name}</div>
                      <div className="text-[11px] text-muted">
                        {(replyFile.size / 1024 < 1024)
                          ? `${(replyFile.size / 1024).toFixed(1)} KB`
                          : `${(replyFile.size / (1024 * 1024)).toFixed(1)} MB`}
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    onClick={removeReplyFile}
                    className="text-muted hover:text-danger shrink-0 ml-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}

              <div className="flex justify-between items-center pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-muted hover:text-foreground"
                >
                  <Paperclip className="w-4 h-4 mr-1 text-primary" />
                  {replyFile ? t('Change attachment') : t('Attach screenshot or file')}
                </Button>

                <Button
                  variant="primary"
                  type="submit"
                  loading={submitting}
                  disabled={!replyMessage.trim()}
                >
                  <Send className="w-4 h-4" />
                  {t('Send Reply')}
                </Button>
              </div>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}

export default ClinicTicketDetailPage;
