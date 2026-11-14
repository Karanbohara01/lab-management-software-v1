import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { communicationApi } from './api';
import { SMS_CAMPAIGN_STATUS_LABEL, type Campaign, type SmsCampaignStatus } from './types';
import { useT } from '@/i18n';

const PAGE_SIZE = 20;
const PARAMS = { page: 1 };

const STATUS_TONE: Record<SmsCampaignStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  DRAFT: 'neutral',
  SCHEDULED: 'info',
  QUEUED: 'info',
  PROCESSING: 'warning',
  COMPLETED: 'success',
  PARTIALLY_COMPLETED: 'warning',
  FAILED: 'danger',
  CANCELLED: 'neutral',
};

export function SmsCampaignsPage() {
  const t = useT();
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.COMMUNICATION_CAMPAIGN_MANAGE);
  const { params, set } = useListParams(PARAMS);

  const { data, loading, error, refetch } = useQuery(
    () => communicationApi.campaigns.list(params.page - 1, PAGE_SIZE),
    [params.page],
    { cacheKey: `sms-campaigns:${params.page}` },
  );

  const columns: Column<Campaign>[] = [
    { key: 'no', header: t('Campaign'), cell: (c) => <span className="font-mono text-xs">{c.campaignNumber}</span> },
    { key: 'name', header: t('Name'), cell: (c) => <span className="font-medium">{c.name}</span> },
    {
      key: 'status',
      header: t('Status'),
      cell: (c) => <Badge tone={STATUS_TONE[c.status]}>{t(SMS_CAMPAIGN_STATUS_LABEL[c.status])}</Badge>,
    },
    {
      key: 'progress',
      header: t('Progress'),
      cell: (c) =>
        c.totalRecipients === 0
          ? '—'
          : t('{sent} sent, {failed} failed / {total}', { sent: c.sentCount, failed: c.failedCount, total: c.totalRecipients }),
      hideOnMobile: true,
    },
    {
      key: 'scheduled',
      header: t('Scheduled'),
      cell: (c) => (c.scheduledAt ? new Date(c.scheduledAt).toLocaleString() : t('Immediately')),
      hideOnMobile: true,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('Bulk SMS campaigns')}
        description={t('Message many patients at once, sent in the background in rate-limited batches.')}
        actions={
          canManage ? (
            <Button onClick={() => navigate('/app/communication/campaigns/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('New campaign')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title={t('No campaigns yet')}
            message={t('Create a campaign to message many patients at once.')}
            action={canManage ? <Button onClick={() => navigate('/app/communication/campaigns/new')}>{t('New campaign')}</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(c) => c.id}
                rowHref={(c) => `/app/communication/campaigns/${c.id}`}
                onRowClick={(c) => navigate(`/app/communication/campaigns/${c.id}`)}
              />
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
