import { useState, useRef } from 'react';
import {
  ShieldCheck,
  User,
  Send,
  Lock,
  Phone,
  Mail,
  Building,
  Paperclip,
  X,
  FileText,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState, LoadingState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';
import { ApiError } from '@/types/api';
import { platformApi } from '@/features/platform/api';
import { inquiriesApi } from './api';
import { TicketAttachmentView } from './TicketAttachmentView';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  STATUS_LABELS,
  STATUS_TONES,
  type TicketStatus,
  type TicketPriority,
  type TicketSummary,
  type TicketMessage,
} from './types';

function formatDt(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(LOCALE_TAG[getLocale()], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const CANNED_RESPONSES = [
  {
    label: 'Analyzer Serial Settings',
    text: 'Please verify the analyzer serial port configuration:\n- Baud rate: 9600 (or machine manual spec)\n- Data bits: 8\n- Parity: None\n- Stop bits: 1\n- Flow control: None\nAlso check that the USB-to-RS232 adapter driver is up to date in Device Manager.',
  },
  {
    label: 'Request Log/Screenshot',
    text: 'Could you please attach the analyzer transmission log or a screenshot of the error message displayed on screen so our engineering team can diagnose the issue?',
  },
  {
    label: 'Issue Resolved',
    text: 'A fix for this issue has been applied to your instance. Please refresh your browser (Ctrl+F5) and verify. Feel free to reply if you notice any remaining anomalies.',
  },
  {
    label: 'Billing & Invoice',
    text: 'Your monthly subscription tax invoice has been generated according to IRD requirements and is available under Platform Billing. Let us know if you require any adjustments.',
  },
  {
    label: 'Feature Feedback',
    text: 'Thank you for this valuable feedback! We have logged this request with our product engineering team for the upcoming platform milestone.',
  },
];

export function PlatformInquiriesPage() {
  const t = useT();
  const toast = useToast();

  const [selectedOrgId, setSelectedOrgId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedPriority, setSelectedPriority] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page] = useState(0);

  // Selected ticket for modal view
  const [detailTicketId, setDetailTicketId] = useState<number | null>(null);

  // Stats query
  const { data: stats, refetch: refetchStats } = useQuery(
    () => inquiriesApi.platform.getStats(),
    [],
  );

  // Clinics dropdown list
  const { data: orgsData } = useQuery(
    () => platformApi.organizations({ size: 100 }),
    [],
  );

  // Tickets query
  const {
    data: ticketsData,
    loading,
    error,
    refetch: refetchTickets,
  } = useQuery(
    () =>
      inquiriesApi.platform.search({
        organizationId: selectedOrgId ? Number(selectedOrgId) : undefined,
        status: (selectedStatus as TicketStatus) || undefined,
        priority: (selectedPriority as TicketPriority) || undefined,
        query: searchQuery || undefined,
        page,
        size: 20,
      }),
    [selectedOrgId, selectedStatus, selectedPriority, searchQuery, page],
  );

  // Ticket Detail Query (when modal is open)
  const {
    data: ticketDetail,
    loading: detailLoading,
    refetch: refetchDetail,
  } = useQuery(
    () => (detailTicketId ? inquiriesApi.platform.get(detailTicketId) : Promise.resolve(null)),
    [detailTicketId],
  );

  // Composer state inside modal
  const [replyMessage, setReplyMessage] = useState('');
  const [replyFile, setReplyFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isInternalNote, setIsInternalNote] = useState(false);
  const [replySubmitting, setReplySubmitting] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);

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

  const orgOptions: SelectOption[] = [
    { value: '', label: t('All Clinics') },
    ...(orgsData?.content.map((org) => ({
      value: String(org.id),
      label: org.name,
    })) || []),
  ];

  const statusFilterOptions: SelectOption[] = [
    { value: '', label: t('All Statuses') },
    ...(Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => ({
      value: s,
      label: t(STATUS_LABELS[s]),
    })),
  ];

  const priorityFilterOptions: SelectOption[] = [
    { value: '', label: t('All Priorities') },
    ...(Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => ({
      value: p,
      label: t(PRIORITY_LABELS[p]),
    })),
  ];

  const statusEditOptions: SelectOption[] = (Object.keys(STATUS_LABELS) as TicketStatus[]).map((s) => ({
    value: s,
    label: t(STATUS_LABELS[s]),
  }));

  const priorityEditOptions: SelectOption[] = (Object.keys(PRIORITY_LABELS) as TicketPriority[]).map((p) => ({
    value: p,
    label: t(PRIORITY_LABELS[p]),
  }));

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!detailTicketId || !replyMessage.trim()) return;

    setReplySubmitting(true);
    try {
      await inquiriesApi.platform.addReply(detailTicketId, {
        message: replyMessage.trim(),
        internalNote: isInternalNote,
        file: replyFile || undefined,
      });
      toast.success(
        isInternalNote ? t('Internal note saved') : t('Reply sent to clinic'),
      );
      setReplyMessage('');
      removeReplyFile();
      refetchDetail();
      refetchTickets();
      refetchStats();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Failed to post reply'));
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!detailTicketId) return;
    setStatusUpdating(true);
    try {
      await inquiriesApi.platform.updateStatus(detailTicketId, {
        status: newStatus,
      });
      toast.success(t('Ticket status updated'));
      refetchDetail();
      refetchTickets();
      refetchStats();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Failed to update status'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleUpdatePriority = async (newPriority: TicketPriority) => {
    if (!detailTicketId || !ticketDetail) return;
    setStatusUpdating(true);
    try {
      await inquiriesApi.platform.updateStatus(detailTicketId, {
        status: ticketDetail.status,
        priority: newPriority,
      });
      toast.success(t('Ticket priority updated'));
      refetchDetail();
      refetchTickets();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Failed to update priority'));
    } finally {
      setStatusUpdating(false);
    }
  };

  const columns: Column<TicketSummary>[] = [
    {
      key: 'ticketNumber',
      header: t('Ticket #'),
      cell: (tkt: TicketSummary) => (
        <span className="font-semibold text-primary">
          {tkt.ticketNumber}
        </span>
      ),
    },
    {
      key: 'organization',
      header: t('Clinic / Organization'),
      cell: (tkt: TicketSummary) => (
        <div className="font-medium text-foreground">
          {tkt.organizationName || `Org #${tkt.organizationId}`}
        </div>
      ),
    },
    {
      key: 'subject',
      header: t('Subject & Category'),
      cell: (tkt: TicketSummary) => (
        <div className="space-y-1">
          <div className="font-medium text-foreground hover:text-primary cursor-pointer">
            {tkt.subject}
          </div>
          <div className="text-xs text-muted flex items-center gap-2">
            <Badge tone="neutral" variant="subtle" size="sm">
              {t(CATEGORY_LABELS[tkt.category] || tkt.category)}
            </Badge>
            <span>•</span>
            <span>{tkt.messageCount} {tkt.messageCount === 1 ? t('message') : t('messages')}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: t('Priority'),
      cell: (tkt: TicketSummary) => (
        <Badge tone={PRIORITY_TONES[tkt.priority]} variant="subtle" size="sm">
          {t(PRIORITY_LABELS[tkt.priority] || tkt.priority)}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: t('Status'),
      cell: (tkt: TicketSummary) => (
        <Badge tone={STATUS_TONES[tkt.status]} variant="subtle" dot size="sm">
          {t(STATUS_LABELS[tkt.status] || tkt.status)}
        </Badge>
      ),
    },
    {
      key: 'lastReplyAt',
      header: t('Last Activity'),
      cell: (tkt: TicketSummary) => (
        <div className="text-xs text-muted">
          {formatDt(tkt.lastReplyAt)}
        </div>
      ),
    },
    {
      key: 'actions',
      header: t('Actions'),
      cell: (tkt: TicketSummary) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setDetailTicketId(tkt.id);
          }}
        >
          {t('Manage')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={t('Clinic Inquiries & Helpdesk')}
        description={t('Manage support requests, technical issues, analyzer integrations, and feedback from all onboarded clinics.')}
      />

      {/* Metric Stat Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="p-4">
          <div className="text-caption uppercase text-muted font-medium">{t('Open')}</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{stats?.openTickets ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-caption uppercase text-muted font-medium">{t('In Progress')}</div>
          <div className="text-2xl font-bold text-blue-600 mt-1">{stats?.inProgressTickets ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-caption uppercase text-muted font-medium">{t('Urgent')}</div>
          <div className="text-2xl font-bold text-rose-600 mt-1">{stats?.urgentTickets ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-caption uppercase text-muted font-medium">{t('Resolved')}</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{stats?.resolvedTickets ?? 0}</div>
        </Card>
        <Card className="p-4">
          <div className="text-caption uppercase text-muted font-medium">{t('Total Inquiries')}</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.totalTickets ?? 0}</div>
        </Card>
      </div>

      {/* Filter Row */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted mb-1.5">{t('Search')}</label>
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('Ticket # or keyword...')}
            />
          </div>

          <Select
            label={t('Filter by Clinic')}
            value={selectedOrgId}
            onChange={(e) => setSelectedOrgId(e.target.value)}
            options={orgOptions}
          />

          <Select
            label={t('Status')}
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            options={statusFilterOptions}
          />

          <Select
            label={t('Priority')}
            value={selectedPriority}
            onChange={(e) => setSelectedPriority(e.target.value)}
            options={priorityFilterOptions}
          />
        </div>
      </Card>

      {/* Table */}
      {loading ? (
        <TableSkeleton rows={8} columns={6} />
      ) : error ? (
        <ErrorState onRetry={refetchTickets} />
      ) : !ticketsData || ticketsData.content.length === 0 ? (
        <EmptyState
          title={t('No inquiries match filter')}
          message={t('No clinic inquiries found with the current filter criteria.')}
        />
      ) : (
        <Card>
          <DataTable
            columns={columns}
            rows={ticketsData.content}
            rowKey={(tkt) => tkt.id}
            onRowClick={(tkt) => setDetailTicketId(tkt.id)}
          />
        </Card>
      )}

      {/* Ticket Manage Modal */}
      <Modal
        open={detailTicketId !== null}
        onClose={() => setDetailTicketId(null)}
        title={ticketDetail ? `${ticketDetail.ticketNumber}: ${ticketDetail.subject}` : t('Inquiry Detail')}
        size="xl"
      >
        {detailLoading || !ticketDetail ? (
          <LoadingState />
        ) : (
          <div className="space-y-5">
            {/* Clinic Info Bar */}
            <div className="p-3 bg-surface-muted rounded-lg border border-border flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-primary" />
                <strong className="text-foreground">{ticketDetail.organizationName || `Org #${ticketDetail.organizationId}`}</strong>
              </div>
              {ticketDetail.organizationPhone && (
                <div className="flex items-center gap-1 text-muted">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{ticketDetail.organizationPhone}</span>
                </div>
              )}
              {ticketDetail.organizationEmail && (
                <div className="flex items-center gap-1 text-muted">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{ticketDetail.organizationEmail}</span>
                </div>
              )}
              <div className="text-muted">
                {t('Opened by')} <strong className="text-foreground">{ticketDetail.createdByName}</strong>
              </div>
            </div>

            {/* Quick Status / Priority Management */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-surface rounded-lg border border-border">
              <Select
                label={t('Ticket Status')}
                value={ticketDetail.status}
                onChange={(e) => handleUpdateStatus(e.target.value as TicketStatus)}
                options={statusEditOptions}
                disabled={statusUpdating}
              />

              <Select
                label={t('Priority')}
                value={ticketDetail.priority}
                onChange={(e) => handleUpdatePriority(e.target.value as TicketPriority)}
                options={priorityEditOptions}
                disabled={statusUpdating}
              />
            </div>

            {/* Conversation Thread */}
            <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted">
                {t('Message Thread')} ({ticketDetail.messages.length})
              </div>

              {ticketDetail.messages.map((msg: TicketMessage) => {
                const isSuperadmin = msg.senderType === 'SUPERADMIN';
                const isInternal = msg.internalNote;

                return (
                  <div
                    key={msg.id}
                    className={`rounded-lg border p-4 ${
                      isInternal
                        ? 'bg-amber-500/10 border-amber-500/30'
                        : isSuperadmin
                        ? 'bg-primary/5 border-primary/20'
                        : 'bg-surface border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-semibold ${
                            isInternal
                              ? 'bg-amber-600 text-white'
                              : isSuperadmin
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-primary/10 text-primary border border-primary/20'
                          }`}
                        >
                          {isInternal ? (
                            <Lock className="w-3.5 h-3.5" />
                          ) : isSuperadmin ? (
                            <ShieldCheck className="w-3.5 h-3.5" />
                          ) : (
                            <User className="w-3.5 h-3.5" />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-foreground flex items-center gap-2">
                            {msg.senderName}
                            {isInternal && (
                              <Badge tone="warning" variant="subtle" size="sm">
                                {t('Internal Note — Hidden from Clinic')}
                              </Badge>
                            )}
                            {isSuperadmin && !isInternal && (
                              <Badge tone="info" variant="subtle" size="sm">
                                {t('Superadmin Reply')}
                              </Badge>
                            )}
                            {!isSuperadmin && (
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

                    <div className="text-sm text-foreground whitespace-pre-wrap pl-9 leading-relaxed">
                      {msg.message}
                    </div>

                    {msg.hasAttachment && (
                      <div className="pl-9">
                        <TicketAttachmentView
                          ticketId={ticketDetail.id}
                          message={msg}
                          isPlatform
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Reply Composer */}
            <form onSubmit={handleSendReply} className="space-y-3 pt-3 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="noteType"
                      checked={!isInternalNote}
                      onChange={() => setIsInternalNote(false)}
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-foreground">{t('Reply to Clinic')}</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-medium cursor-pointer">
                    <input
                      type="radio"
                      name="noteType"
                      checked={isInternalNote}
                      onChange={() => setIsInternalNote(true)}
                      className="text-amber-600 focus:ring-amber-500"
                    />
                    <span className="text-amber-700 flex items-center gap-1 font-semibold">
                      <Lock className="w-3.5 h-3.5" />
                      {t('Internal Note (Hidden from Clinic)')}
                    </span>
                  </label>
                </div>

                {/* Quick Canned Response Chips */}
                {!isInternalNote && (
                  <div className="hidden sm:flex items-center gap-1.5 flex-wrap">
                    <span className="text-[11px] text-muted flex items-center gap-1 font-medium">
                      <Sparkles className="w-3 h-3 text-primary" />
                      {t('Templates:')}
                    </span>
                    {CANNED_RESPONSES.map((tmpl) => (
                      <button
                        key={tmpl.label}
                        type="button"
                        onClick={() => setReplyMessage((prev) => (prev ? `${prev}\n\n${tmpl.text}` : tmpl.text))}
                        className="text-[11px] px-2 py-0.5 rounded border border-border bg-surface-muted text-muted hover:text-foreground hover:border-primary/40 transition-colors"
                        title={tmpl.text}
                      >
                        {tmpl.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Textarea
                rows={3}
                value={replyMessage}
                onChange={(e) => setReplyMessage(e.target.value)}
                placeholder={
                  isInternalNote
                    ? t('Write an internal engineering note (only visible to platform superadmins)...')
                    : t('Type a message or solution to the clinic staff...')
                }
                disabled={replySubmitting}
                required
              />

              {/* Attachment Picker */}
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
                  <div className="flex items-center justify-between p-2.5 mb-2 bg-surface-muted border border-border rounded-lg max-w-md">
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

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" type="button" onClick={() => setDetailTicketId(null)}>
                      {t('Close')}
                    </Button>
                    <Button
                      variant={isInternalNote ? 'secondary' : 'primary'}
                      type="submit"
                      loading={replySubmitting}
                      disabled={!replyMessage.trim()}
                    >
                      <Send className="w-4 h-4" />
                      {isInternalNote ? t('Save Internal Note') : t('Send Reply to Clinic')}
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default PlatformInquiriesPage;
