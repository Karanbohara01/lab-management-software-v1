import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { useToast } from '@/components/ui/toast';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { communicationApi } from './api';
import {
  SMS_CATEGORY_LABEL,
  SMS_MESSAGE_STATUS_LABEL,
  SMS_PROVIDER_LABEL,
  type SmsCategory,
  type SmsMessage,
  type SmsMessageStatus,
} from './types';
import { useT } from '@/i18n';

const PAGE_SIZE = 25;
const PARAMS = { phone: '', category: '', status: '', page: 1 };

const STATUS_TONE: Record<SmsMessageStatus, 'neutral' | 'success' | 'danger' | 'info'> = {
  QUEUED: 'neutral',
  SENT: 'info',
  DELIVERED: 'success',
  FAILED: 'danger',
};

export function SmsHistoryPage() {
  const t = useT();
  const { back } = useBackTarget();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canSend = hasPermission(PERMISSIONS.COMMUNICATION_SEND);
  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.phone, (phone) => set({ phone }, { replace: true }));
  const [resendingId, setResendingId] = useState<number | null>(null);

  const { data, loading, error, refetch } = useQuery(
    () =>
      communicationApi.messages.history({
        phone: params.phone || undefined,
        category: (params.category as SmsCategory) || undefined,
        status: (params.status as SmsMessageStatus) || undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.phone, params.category, params.status, params.page],
    { cacheKey: `sms-history:${params.phone}:${params.category}:${params.status}:${params.page}` },
  );

  const resend = async (m: SmsMessage) => {
    setResendingId(m.id);
    try {
      const result = await communicationApi.messages.resend(m.id);
      if (result.sent) toast.success(t('Message resent'));
      else toast.error(result.errorMessage ?? t('The resend could not be sent'));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to resend this message'));
    } finally {
      setResendingId(null);
    }
  };

  const columns: Column<SmsMessage>[] = [
    { key: 'date', header: t('Sent'), cell: (m) => new Date(m.createdAt).toLocaleString() },
    {
      key: 'recipient',
      header: t('Recipient'),
      cell: (m) => (
        <span>
          <span className="font-medium">{m.recipientName ?? '—'}</span>
          <span className="ml-2 font-mono text-xs text-muted">{m.recipientPhone}</span>
        </span>
      ),
    },
    { key: 'category', header: t('Category'), cell: (m) => t(SMS_CATEGORY_LABEL[m.category]), hideOnMobile: true },
    { key: 'provider', header: t('Provider'), cell: (m) => t(SMS_PROVIDER_LABEL[m.provider]), hideOnMobile: true },
    { key: 'segments', header: t('Segments'), cell: (m) => m.segmentCount, hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (m) => <Badge tone={STATUS_TONE[m.status]}>{t(SMS_MESSAGE_STATUS_LABEL[m.status])}</Badge>,
    },
    { key: 'source', header: t('Source'), cell: (m) => (m.campaignNumber ? m.campaignNumber : m.sentBy ?? t('Automated')), hideOnMobile: true },
    ...(canSend
      ? [
          {
            key: 'actions',
            header: '',
            cell: (m: SmsMessage) =>
              m.status === 'FAILED' ? (
                <Button variant="ghost" size="sm" onClick={() => resend(m)} loading={resendingId === m.id}>
                  {t('Resend')}
                </Button>
              ) : null,
          } as Column<SmsMessage>,
        ]
      : []),
  ];

  return (
    <>
      <PageHeader back={back} title={t('SMS history')} description={t('Every SMS attempt — manual, automated or campaign-sent — has a record here.')} />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search by phone number')} />
          </div>
          <div className="sm:w-48">
            <Select
              options={[{ value: '', label: t('All categories') }, ...Object.entries(SMS_CATEGORY_LABEL).map(([v, l]) => ({ value: v, label: t(l) }))]}
              value={params.category}
              onChange={(e) => set({ category: e.target.value })}
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[{ value: '', label: t('All statuses') }, ...Object.entries(SMS_MESSAGE_STATUS_LABEL).map(([v, l]) => ({ value: v, label: t(l) }))]}
              value={params.status}
              onChange={(e) => set({ status: e.target.value })}
            />
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title={t('No messages found')} message={t('Adjust the filters, or send your first SMS.')} />
        ) : (
          data && (
            <>
              <DataTable columns={columns} rows={data.content} rowKey={(m) => m.id} />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => set({ page: p + 1 })}
              />
            </>
          )
        )}
      </Card>
    </>
  );
}
