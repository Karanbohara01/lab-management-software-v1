import { AlertTriangle, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { formatDate } from './format';
import { resultsApi } from '@/features/results/api';
import {
  RESULT_STATUS_LABEL,
  RESULT_STATUS_TONE,
  type ResultListItem,
} from '@/features/results/types';
import { useT } from '@/i18n';

export function PatientResultsTab({ patientId }: { patientId: number }) {
  const navigate = useNavigateFrom();
  const t = useT();

  const { data, loading, error, refetch } = useQuery(
    () => resultsApi.list({ patientId, size: 50 }),
    [patientId],
  );

  const columns: Column<ResultListItem>[] = [
    {
      key: 'test',
      header: t('Test'),
      cell: (r) => (
        <span className="flex items-center gap-2">
          {r.hasCritical && (
            <AlertTriangle className="h-4 w-4 text-critical" aria-label={t('Critical value')} />
          )}
          <span className="font-medium text-foreground">{r.testName}</span>
          <span className="font-mono text-xs text-muted">{r.testCode}</span>
        </span>
      ),
    },
    {
      key: 'acc',
      header: t('Accession'),
      cell: (r) => <span className="font-mono text-xs">{r.accessionNumber}</span>,
      hideOnMobile: true,
    },
    {
      key: 'dept',
      header: t('Department'),
      cell: (r) => r.departmentName,
      hideOnMobile: true,
    },
    {
      key: 'date',
      header: t('Date'),
      cell: (r) => formatDate(r.createdAt),
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: t('Status'),
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <Badge
            tone={RESULT_STATUS_TONE[r.status]}
            variant="subtle"
            dot={r.status === 'PENDING' || r.hasCritical}
          >
            {t(RESULT_STATUS_LABEL[r.status])}
          </Badge>
          {r.hasAbnormal && !r.hasCritical && (
            <Badge tone="warning" variant="subtle">
              {t('Abn')}
            </Badge>
          )}
          {r.hasCritical && (
            <Badge tone="critical" dot>
              {t('Critical')}
            </Badge>
          )}
        </span>
      ),
    },
    {
      key: 'action',
      header: '',
      cell: () => <ChevronRight className="h-4 w-4 text-muted" aria-hidden="true" />,
      className: 'w-8 text-right',
    },
  ];

  return (
    <Card>
      {error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : (
        <DataTable
          columns={columns}
          rows={data?.content ?? []}
          rowKey={(r) => r.id}
          loading={loading && !data}
          emptyState={
            <EmptyState
              title={t('No test results')}
              message={t('Results for this patient will appear here once specimens are received into the laboratory.')}
            />
          }
          rowHref={(r) => `/app/results/${r.id}`}
          onRowClick={(r) => navigate(`/app/results/${r.id}`)}
        />
      )}
    </Card>
  );
}
