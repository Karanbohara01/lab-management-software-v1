import { Link } from 'react-router-dom';
import { MessageSquareOff } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { useQuery } from '@/hooks/useQuery';
import { communicationApi } from './api';
import { SMS_MESSAGE_STATUS_LABEL, type SmsMessageStatus } from './types';
import { useT } from '@/i18n';
import { SendSmsForm } from './components/SendSmsForm';

const STATUS_TONE: Record<SmsMessageStatus, 'neutral' | 'success' | 'danger' | 'info'> = {
  QUEUED: 'neutral',
  SENT: 'info',
  DELIVERED: 'success',
  FAILED: 'danger',
};

export function SendSmsPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { data: dashboard } = useQuery(() => communicationApi.dashboard(), []);
  const { data: recent, refetch: refetchRecent } = useQuery(
    () => communicationApi.messages.history({ page: 0, size: 6 }),
    [],
  );

  return (
    <>
      <PageHeader
        back={back}
        title={t('Send SMS')}
        description={t('Send a one-off message to any phone number — from a patient record, SMS is sent from that record directly.')}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title={t('Compose message')} />
          <CardBody>
            <SendSmsForm onSent={refetchRecent} />
          </CardBody>
        </Card>

        <div className="space-y-4">
          {dashboard && (
            <Card>
              <CardHeader title={t('SMS gateways')} description={t('Which provider is actually configured for this organization.')} />
              <CardBody className="space-y-2">
                {dashboard.gateways.map((g) => (
                  <div key={g.provider} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
                    <span className="text-sm font-medium text-foreground">{g.label}</span>
                    <Badge tone={g.configured ? 'success' : 'neutral'}>{t(g.configured ? 'Configured' : 'Not configured')}</Badge>
                  </div>
                ))}
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title={t('Recently sent')} description={t('The last few individual sends — campaigns are tracked separately.')} />
            <CardBody>
              {recent && recent.content.length === 0 && (
                <div className="flex flex-col items-center gap-2 py-6 text-center">
                  <MessageSquareOff className="h-6 w-6 text-muted" aria-hidden />
                  <p className="text-sm text-muted">{t('Nothing sent yet.')}</p>
                </div>
              )}
              {recent && recent.content.length > 0 && (
                <ul className="divide-y divide-border">
                  {recent.content.map((m) => (
                    <li key={m.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium text-foreground">
                          {m.recipientName || m.recipientPhone}
                        </span>
                        <Badge tone={STATUS_TONE[m.status]}>{t(SMS_MESSAGE_STATUS_LABEL[m.status])}</Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">{m.messageBody}</p>
                      <p className="mt-0.5 text-xs text-muted">{new Date(m.createdAt).toLocaleString()}</p>
                    </li>
                  ))}
                </ul>
              )}
              {recent && recent.totalElements > recent.content.length && (
                <Link to="/app/communication/history" className="mt-3 block text-center text-sm text-primary hover:underline">
                  {t('View all SMS history')}
                </Link>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </>
  );
}
