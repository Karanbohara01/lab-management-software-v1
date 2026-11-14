import { CheckCircle2, Clock, MessageSquare, Megaphone, XCircle, Gauge } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { StatTileRow } from '@/features/dashboard/components/StatTile';
import { ErrorState, LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { communicationApi } from './api';
import { useT } from '@/i18n';

export function CommunicationDashboardPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { data, loading, error, refetch } = useQuery(() => communicationApi.dashboard(), []);

  return (
    <>
      <PageHeader
        back={back}
        title={t('Communication')}
        description={t('Real delivery activity, credit usage, and gateway status — nothing on this page is estimated.')}
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <>
          <StatTileRow
            stats={[
              { label: 'Total messages', value: data.totalMessages, icon: MessageSquare },
              { label: 'Delivered', value: data.delivered, icon: CheckCircle2 },
              { label: 'Failed', value: data.failed, icon: XCircle },
              { label: 'Pending', value: data.pending, icon: Clock, tone: data.pending > 0 ? 'warning' : 'neutral' },
            ]}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader title={t('Credits used')} description={t('Segments sent, not fabricated balances.')} />
              <CardBody className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">{t('Today')}</span>
                  <span className="text-heading-4 tabular-nums text-foreground">{data.segmentsToday}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted">{t('This month')}</span>
                  <span className="text-heading-4 tabular-nums text-foreground">{data.segmentsThisMonth}</span>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-3">
                  <span className="text-sm text-muted">{t('Campaigns conducted')}</span>
                  <span className="flex items-center gap-2 text-heading-4 tabular-nums text-foreground">
                    <Megaphone className="h-4 w-4 text-muted" aria-hidden />
                    {data.campaignsConducted}
                  </span>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader
                title={t('Delivery success rate')}
                description={t('Share of attempted sends that were sent or delivered.')}
              />
              <CardBody>
                <div className="flex items-center gap-3">
                  <Gauge className="h-8 w-8 text-primary" aria-hidden />
                  <span className="text-display-3 tabular-nums text-foreground">
                    {data.deliverySuccessRatePercent.toFixed(1)}%
                  </span>
                </div>
              </CardBody>
            </Card>
          </div>

          <Card className="mt-4">
            <CardHeader title={t('SMS gateways')} description={t('Which provider is actually configured for this organization.')} />
            <CardBody className="space-y-2">
              {data.gateways.map((g) => (
                <div key={g.provider} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                  <span className="text-sm font-medium text-foreground">{g.label}</span>
                  <Badge tone={g.configured ? 'success' : 'neutral'}>
                    {t(g.configured ? 'Configured' : 'Not configured')}
                  </Badge>
                </div>
              ))}
            </CardBody>
          </Card>
        </>
      ) : null}
    </>
  );
}
