import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useNavigateFrom } from '@/lib/navigation';
import { formatDate } from '@/features/patients/format';
import { reportsApi } from './api';
import { REPORT_STATUS_TONE, type ReportListItem, type ReportStatus } from './types';
import { useT, tOpts } from '@/i18n';

const PAGE_SIZE = 20;
/** Lives in the URL, so returning from a report lands on the same filter, search and page. */
const PARAMS = { status: '', q: '', page: 1 };

export function ReportsPage() {
  const t = useT();
  const navigate = useNavigateFrom();
  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  const { data, loading, error, refetch } = useQuery(
    () =>
      reportsApi.list({
        status: (params.status as ReportStatus) || undefined,
        query: params.q || undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.status, params.q, params.page],
    { cacheKey: `reports:${params.status}:${params.q}:${params.page}` },
  );

  const columns: Column<ReportListItem>[] = [
    { key: 'no', header: t('Report'), cell: (r) => <span className="font-mono text-xs">{r.reportNumber}</span> },
    {
      key: 'patient',
      header: t('Patient'),
      cell: (r) => (
        <span className="flex items-center gap-2">
          {r.hasCritical && <AlertTriangle className="h-4 w-4 text-critical" aria-label={t('Critical')} />}
          <span className="font-medium">{r.patientName}</span>
          <span className="font-mono text-xs text-muted">{r.patientMrn}</span>
        </span>
      ),
    },
    { key: 'order', header: t('Order'), cell: (r) => r.orderNumber, hideOnMobile: true },
    { key: 'tests', header: t('Tests'), cell: (r) => r.testCount, hideOnMobile: true },
    { key: 'date', header: t('Generated'), cell: (r) => formatDate(r.generatedAt), hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={REPORT_STATUS_TONE[r.status]}>{r.status}</Badge>
          {r.reportVersion > 1 && <Badge tone="warning">v{r.reportVersion}</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('Reports')}
        description={t('Consolidated laboratory reports generated from approved results.')}
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search report no., patient or MRN')}
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={tOpts([
                { value: '', label: 'All statuses' },
                { value: 'GENERATED', label: 'Generated' },
                { value: 'RELEASED', label: 'Released' },
                { value: 'DELIVERED', label: 'Delivered' },
              ])}
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
          <EmptyState
            title={t('No reports')}
            message={t('Generate a report from a lab order once its results are approved.')}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(r) => r.id}
                rowHref={(r) => `/app/reports/${r.id}`}
                onRowClick={(r) => navigate(`/app/reports/${r.id}`)}
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
