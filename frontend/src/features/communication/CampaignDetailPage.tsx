import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState, LoadingState, TableSkeleton } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useListParams } from '@/hooks/useListParams';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { communicationApi } from './api';
import { SMS_CAMPAIGN_STATUS_LABEL, type CampaignRecipient, type SmsRecipientStatus } from './types';
import { useT } from '@/i18n';

const PAGE_SIZE = 50;
const PARAMS = { page: 1 };

const RECIPIENT_STATUS_TONE: Record<SmsRecipientStatus, 'neutral' | 'success' | 'danger' | 'warning'> = {
  PENDING: 'neutral',
  SENT: 'success',
  FAILED: 'danger',
  SKIPPED_DUPLICATE: 'warning',
  SKIPPED_INVALID: 'warning',
  SKIPPED_OPTED_OUT: 'warning',
};

const RECIPIENT_STATUS_LABEL: Record<SmsRecipientStatus, string> = {
  PENDING: 'Pending',
  SENT: 'Sent',
  FAILED: 'Failed',
  SKIPPED_DUPLICATE: 'Duplicate',
  SKIPPED_INVALID: 'Invalid number',
  SKIPPED_OPTED_OUT: 'Opted out',
};

export function CampaignDetailPage() {
  const t = useT();
  const { back } = useBackTarget();
  const toast = useToast();
  const { id } = useParams<{ id: string }>();
  const campaignId = Number(id);
  const { params, set } = useListParams(PARAMS);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [retrying, setRetrying] = useState(false);

  const { data: campaign, loading, error, refetch } = useQuery(() => communicationApi.campaigns.get(campaignId), [campaignId]);
  const { data: recipients, refetch: refetchRecipients } = useQuery(
    () => communicationApi.campaigns.recipients(campaignId, params.page - 1, PAGE_SIZE),
    [campaignId, params.page],
  );

  const inFlight = campaign?.status === 'QUEUED' || campaign?.status === 'SCHEDULED' || campaign?.status === 'PROCESSING';

  useEffect(() => {
    if (!inFlight) return;
    const timer = setInterval(() => {
      refetch();
      refetchRecipients();
    }, 5000);
    return () => clearInterval(timer);
  }, [inFlight, refetch, refetchRecipients]);

  const confirmDraft = async () => {
    setConfirming(true);
    try {
      await communicationApi.campaigns.confirm(campaignId, {});
      toast.success(t('Campaign queued'));
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Could not queue this campaign'));
    } finally {
      setConfirming(false);
    }
  };

  const cancelCampaign = async () => {
    await communicationApi.campaigns.cancel(campaignId);
    toast.success(t('Campaign cancellation requested'));
    refetch();
  };

  const retryFailed = async () => {
    setRetrying(true);
    try {
      await communicationApi.campaigns.retryFailed(campaignId);
      toast.success(t('Failed recipients requeued'));
      refetch();
      refetchRecipients();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Could not retry this campaign\'s failures'));
    } finally {
      setRetrying(false);
    }
  };

  const columns: Column<CampaignRecipient>[] = [
    { key: 'seq', header: '#', cell: (r) => r.sequenceNo + 1, className: 'w-12' },
    { key: 'name', header: t('Name'), cell: (r) => r.name ?? '—' },
    { key: 'phone', header: t('Phone'), cell: (r) => <span className="font-mono text-xs">{r.phone}</span> },
    {
      key: 'status',
      header: t('Status'),
      cell: (r) => <Badge tone={RECIPIENT_STATUS_TONE[r.status]}>{t(RECIPIENT_STATUS_LABEL[r.status])}</Badge>,
    },
    { key: 'error', header: t('Detail'), cell: (r) => r.errorMessage ?? '—', hideOnMobile: true },
  ];

  if (loading && !campaign) return <LoadingState />;
  if (error || !campaign) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        back={back}
        title={campaign.name}
        description={t('Campaign {number}', { number: campaign.campaignNumber })}
        actions={
          <>
            {campaign.status === 'DRAFT' && (
              <Button onClick={confirmDraft} loading={confirming}>
                {t('Confirm & send')}
              </Button>
            )}
            {!['COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED'].includes(campaign.status) && !campaign.cancelRequested && (
              <Button variant="secondary" onClick={() => setCancelOpen(true)}>
                {t('Cancel campaign')}
              </Button>
            )}
            {(campaign.status === 'FAILED' || campaign.status === 'PARTIALLY_COMPLETED') && campaign.failedCount > 0 && (
              <Button variant="secondary" onClick={retryFailed} loading={retrying}>
                {t('Retry failed ({count})', { count: campaign.failedCount })}
              </Button>
            )}
          </>
        }
      />

      <Card>
        <CardHeader title={t('Status')} />
        <CardBody className="grid gap-4 sm:grid-cols-4">
          <div>
            <p className="text-xs text-muted">{t('Status')}</p>
            <Badge tone="info">{t(SMS_CAMPAIGN_STATUS_LABEL[campaign.status])}</Badge>
          </div>
          <div>
            <p className="text-xs text-muted">{t('Recipients')}</p>
            <p className="text-heading-4 tabular-nums text-foreground">{campaign.totalRecipients}</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t('Sent')}</p>
            <p className="text-heading-4 tabular-nums text-success">{campaign.sentCount}</p>
          </div>
          <div>
            <p className="text-xs text-muted">{t('Failed')}</p>
            <p className="text-heading-4 tabular-nums text-danger">{campaign.failedCount}</p>
          </div>
        </CardBody>
        {campaign.failureMessage && (
          <CardBody className="border-t border-border">
            <p className="text-sm text-danger">{campaign.failureMessage}</p>
          </CardBody>
        )}
      </Card>

      <Card className="mt-4">
        <CardHeader title={t('Recipients')} />
        {!recipients ? (
          <TableSkeleton columns={columns.length} />
        ) : (
          <>
            <DataTable columns={columns} rows={recipients.content} rowKey={(r) => r.id} />
            <Pagination
              page={recipients.page}
              totalPages={recipients.totalPages}
              totalElements={recipients.totalElements}
              onPageChange={(p) => set({ page: p + 1 })}
            />
          </>
        )}
      </Card>

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={cancelCampaign}
        title={t('Cancel this campaign?')}
        message={t('Recipients not yet messaged will not receive this campaign.')}
        confirmLabel={t('Cancel campaign')}
        tone="danger"
      />
    </>
  );
}
