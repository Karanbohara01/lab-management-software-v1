import { CheckCircle2, Clock, HelpCircle, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState, LoadingState, TableSkeleton } from '@/components/ui/PageState';
import { useListParams } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { communicationApi } from './api';
import { SMS_MESSAGE_STATUS_LABEL, type SmsMessage, type SmsMessageStatus } from './types';
import { useT } from '@/i18n';

const PAGE_SIZE = 25;
const PARAMS = { status: 'FAILED' as string, page: 1 };

export function DeliveryReportsPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { data: dashboard } = useQuery(() => communicationApi.dashboard(), []);
  const { params, set } = useListParams(PARAMS);

  const { data, loading, error, refetch } = useQuery(
    () => communicationApi.messages.history({ status: params.status as SmsMessageStatus, page: params.page - 1, size: PAGE_SIZE }),
    [params.status, params.page],
  );

  const columns: Column<SmsMessage>[] = [
    { key: 'date', header: t('Sent'), cell: (m) => new Date(m.createdAt).toLocaleString() },
    { key: 'phone', header: t('Phone'), cell: (m) => <span className="font-mono text-xs">{m.recipientPhone}</span> },
    { key: 'error', header: t('Detail'), cell: (m) => m.errorMessage ?? m.providerReference ?? '—' },
  ];

  return (
    <>
      <PageHeader
        back={back}
        title={t('Delivery reports')}
        description={t('What "sent" actually means for each provider — this system never marks a message delivered just because the gateway accepted it.')}
      />

      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium">{t('Delivered')}</span>
            </div>
            <p className="mt-1 text-heading-3 tabular-nums text-foreground">{dashboard?.delivered ?? '—'}</p>
            <p className="mt-1 text-xs text-muted">{t('A real delivery-confirmation signal was received from the provider.')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-primary">
              <HelpCircle className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium">{t('Sent (unconfirmed)')}</span>
            </div>
            <p className="mt-1 text-heading-3 tabular-nums text-foreground">{dashboard?.sent ?? '—'}</p>
            <p className="mt-1 text-xs text-muted">{t('The gateway accepted the request — no delivery report is available to confirm the handset received it.')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-danger">
              <XCircle className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium">{t('Failed')}</span>
            </div>
            <p className="mt-1 text-heading-3 tabular-nums text-foreground">{dashboard?.failed ?? '—'}</p>
            <p className="mt-1 text-xs text-muted">{t('The gateway rejected the request, or the call failed.')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-muted">
              <Clock className="h-4 w-4" aria-hidden />
              <span className="text-xs font-medium">{t('Pending')}</span>
            </div>
            <p className="mt-1 text-heading-3 tabular-nums text-foreground">{dashboard?.pending ?? '—'}</p>
            <p className="mt-1 text-xs text-muted">{t('Staged but not yet attempted — e.g. a campaign batch still in progress.')}</p>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader
          title={t('Messages by status')}
          action={
            <div className="w-48">
              <select
                className="h-9 w-full rounded-md border border-input bg-surface px-2 text-sm text-foreground"
                value={params.status}
                onChange={(e) => set({ status: e.target.value })}
              >
                {Object.entries(SMS_MESSAGE_STATUS_LABEL).map(([v, l]) => (
                  <option key={v} value={v}>
                    {t(l)}
                  </option>
                ))}
              </select>
            </div>
          }
        />
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data ? (
          <>
            <DataTable columns={columns} rows={data.content} rowKey={(m) => m.id} />
            <Pagination
              page={data.page}
              totalPages={data.totalPages}
              totalElements={data.totalElements}
              onPageChange={(p) => set({ page: p + 1 })}
            />
          </>
        ) : (
          <LoadingState />
        )}
      </Card>
    </>
  );
}
