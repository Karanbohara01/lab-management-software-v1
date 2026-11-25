import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, Search, BookOpen } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select, type SelectOption } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';
import { inquiriesApi } from './api';
import { CreateTicketModal } from './CreateTicketModal';
import {
  CATEGORY_LABELS,
  PRIORITY_LABELS,
  PRIORITY_TONES,
  STATUS_LABELS,
  STATUS_TONES,
  type TicketStatus,
  type TicketCategory,
  type TicketSummary,
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

const STATUS_FILTERS: { label: string; value: TicketStatus | 'ALL' }[] = [
  { label: 'All Inquiries', value: 'ALL' },
  { label: 'Open', value: 'OPEN' },
  { label: 'In Progress', value: 'IN_PROGRESS' },
  { label: 'Waiting on Clinic', value: 'WAITING_ON_CLINIC' },
  { label: 'Resolved', value: 'RESOLVED' },
  { label: 'Closed', value: 'CLOSED' },
];

export function ClinicSupportPage() {
  const t = useT();
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState<TicketStatus | 'ALL'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [page, setPage] = useState(0);

  const statusParam = activeFilter === 'ALL' ? undefined : activeFilter;
  const categoryParam = categoryFilter === 'ALL' ? undefined : (categoryFilter as TicketCategory);

  const {
    data,
    loading,
    error,
    refetch,
  } = useQuery(
    () =>
      inquiriesApi.clinic.list({
        status: statusParam,
        category: categoryParam,
        query: searchQuery.trim() || undefined,
        page,
        size: 20,
      }),
    [statusParam, categoryParam, searchQuery, page],
  );

  const categoryOptions: SelectOption[] = [
    { value: 'ALL', label: t('All Categories') },
    ...(Object.keys(CATEGORY_LABELS) as TicketCategory[]).map((c) => ({
      value: c,
      label: t(CATEGORY_LABELS[c]),
    })),
  ];

  const columns: Column<TicketSummary>[] = [
    {
      key: 'ticketNumber',
      header: t('Ticket #'),
      cell: (tkt: TicketSummary) => (
        <div className="flex items-center gap-2">
          <span className="font-semibold text-primary">
            {tkt.ticketNumber}
          </span>
          {tkt.clinicHasUnread && (
            <Badge tone="info" variant="solid" size="sm">
              {t('New Reply')}
            </Badge>
          )}
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
            navigate(`/app/support/${tkt.id}`);
          }}
        >
          {t('View thread')}
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6 pb-16">
      <PageHeader
        title={t('Support & Inquiries')}
        description={t('Communicate directly with the software superadmin for technical assistance, bugs, device integration, and requests.')}
        actions={
          <Button variant="primary" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4" />
            {t('Raise Inquiry')}
          </Button>
        }
      />

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => {
                setActiveFilter(f.value);
                setPage(0);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                activeFilter === f.value
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'bg-surface text-muted border border-border hover:text-foreground hover:bg-surface-muted'
              }`}
            >
              {t(f.label)}
            </button>
          ))}
        </div>

        {/* Search & Category Filter */}
        <div className="flex items-center gap-2">
          <div className="w-48 sm:w-56">
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
              options={categoryOptions}
            />
          </div>

          <div className="relative w-48 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
              placeholder={t('Search tickets or subject...')}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-border bg-surface text-foreground placeholder:text-muted focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          <Link
            to="/app/help"
            className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-border bg-surface text-muted hover:text-foreground hover:bg-surface-muted transition-colors shrink-0"
            title={t('Read Help Documentation')}
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            <span>{t('Help Guide')}</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <TableSkeleton rows={6} columns={6} />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.content.length === 0 ? (
        <EmptyState
          title={t('No inquiries found')}
          message={
            activeFilter === 'ALL'
              ? t('Have a question, encountered an issue, or need help integrating an analyzer? Raise an inquiry ticket to our platform support team.')
              : t('No inquiries match the selected status filter.')
          }
          action={
            activeFilter === 'ALL' ? (
              <Button variant="primary" onClick={() => setCreateOpen(true)}>
                <Plus className="w-4 h-4" />
                {t('Submit New Inquiry')}
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Card>
          <DataTable
            columns={columns}
            rows={data.content}
            rowKey={(tkt) => tkt.id}
            onRowClick={(tkt) => navigate(`/app/support/${tkt.id}`)}
          />
        </Card>
      )}

      <CreateTicketModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(newTicket) => {
          refetch();
          navigate(`/app/support/${newTicket.id}`);
        }}
      />
    </div>
  );
}

export default ClinicSupportPage;
