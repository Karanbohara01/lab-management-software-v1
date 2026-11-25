import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { ErrorState, EmptyState } from '@/components/ui/PageState';
import { cn } from '@/lib/cn';
import { useQuery } from '@/hooks/useQuery';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useNavigateFrom } from '@/lib/navigation';
import { departmentsApi } from '@/features/departments/api';
import { formatDate } from '@/features/patients/format';
import { useT, tOpts } from '@/i18n';
import { resultsApi } from './api';
import { RESULT_STATUS_LABEL, RESULT_STATUS_TONE, type ResultListItem, type ResultStatus } from './types';

const PAGE_SIZE = 20;
const TABS: { value: '' | ResultStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'PENDING', label: 'Pending entry' },
  { value: 'ENTERED', label: 'For verification' },
  { value: 'VERIFIED', label: 'For approval' },
  { value: 'APPROVED', label: 'Approved' },
];
/**
 * Lives in the URL, so returning from a result lands on the same tab, filters, search and page.
 * The flag keys match what the dashboard's shortcuts already link with.
 */
const PARAMS = {
  status: '',
  departmentId: '',
  critical: false,
  overdueOnly: false,
  criticalPendingOnly: false,
  q: '',
  page: 1,
};

export function ResultsQueuePage() {
  const navigate = useNavigateFrom();
  const t = useT();
  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  const departments = useQuery(() => departmentsApi.list(true), []);
  const summary = useQuery(
    () => resultsApi.summary(params.departmentId ? Number(params.departmentId) : undefined),
    [params.departmentId],
  );

  const { data, loading, error, refetch } = useQuery(
    () =>
      resultsApi.list({
        status: (params.status as ResultStatus) || undefined,
        departmentId: params.departmentId ? Number(params.departmentId) : undefined,
        criticalOnly: params.critical || undefined,
        overdueOnly: params.overdueOnly || undefined,
        criticalPendingOnly: params.criticalPendingOnly || undefined,
        query: params.q || undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [
      params.status,
      params.departmentId,
      params.critical,
      params.overdueOnly,
      params.criticalPendingOnly,
      params.q,
      params.page,
    ],
    {
      cacheKey: `results:${params.status}:${params.departmentId}:${params.critical}:${params.overdueOnly}:${params.criticalPendingOnly}:${params.q}:${params.page}`,
    },
  );

  // r.priority and r.testName/testCode/departmentName are clinical catalog/order data — left untranslated.
  const columns: Column<ResultListItem>[] = [
    {
      key: 'test',
      header: t('Test'),
      cell: (r) => (
        <span className="flex items-center gap-2">
          {r.hasCritical && <AlertTriangle className="h-4 w-4 text-critical" aria-label={t('Critical value')} />}
          {r.priority !== 'ROUTINE' && <Badge tone={r.priority === 'STAT' ? 'critical' : 'warning'}>{r.priority}</Badge>}
          {r.resultMode === 'CULTURE' && <Badge tone="info">{t('Culture')}</Badge>}
          <span className="font-medium">{r.testName}</span>
          <span className="font-mono text-xs text-muted">{r.testCode}</span>
        </span>
      ),
    },
    {
      key: 'patient',
      header: t('Patient'),
      cell: (r) => (
        <span>
          {r.patientName} <span className="font-mono text-xs text-muted">{r.patientMrn}</span>
        </span>
      ),
    },
    { key: 'acc', header: t('Accession'), cell: (r) => <span className="font-mono text-xs">{r.accessionNumber}</span>, hideOnMobile: true },
    { key: 'dept', header: t('Department'), cell: (r) => r.departmentName, hideOnMobile: true },
    { key: 'date', header: t('Received'), cell: (r) => formatDate(r.createdAt), hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-1.5">
          <Badge
            tone={RESULT_STATUS_TONE[r.status]}
            variant="subtle"
            dot={r.status === 'PENDING' || r.hasCritical}
          >
            {t(RESULT_STATUS_LABEL[r.status])}
          </Badge>
          {r.hasAbnormal && !r.hasCritical && <Badge tone="warning" variant="subtle">{t('Abn')}</Badge>}
          {!r.complete && r.status !== 'PENDING' && r.resultMode !== 'CULTURE' && (
            <Badge tone="warning" variant="subtle">{t('Incomplete')}</Badge>
          )}
          {r.overdue && <Badge tone="danger" variant="subtle">{t('Overdue')}</Badge>}
          {r.criticalAckRequired && <Badge tone="critical" dot>{t('Callback due')}</Badge>}
          {r.autoVerified && <Badge tone="neutral" variant="subtle">{t('Auto')}</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t('Results')}
        description={t('Department worklist — enter, verify and approve test results.')}
      />

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {tOpts(TABS).map((tab) => {
            const count = tab.value ? summary.data?.[tab.value] : undefined;
            return (
              <button
                key={tab.value || 'all'}
                onClick={() => set({ status: tab.value })}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  params.status === tab.value ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-muted',
                )}
              >
                {tab.label}
                {count != null && count > 0 && (
                  <span className="ml-1.5 rounded-full bg-surface-muted px-1.5 text-xs">{count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search test, patient or MRN')}
            />
          </div>
          <div className="sm:w-56">
            {/* Department names are lab-configured catalog data; tOpts leaves them untouched since
                they won't match a dictionary key — only "All departments" actually translates. */}
            <Select
              options={tOpts([
                { value: '', label: 'All departments' },
                ...(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
              ])}
              value={params.departmentId}
              onChange={(e) => set({ departmentId: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={params.critical}
              onChange={(e) => set({ critical: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            {t('Critical only')}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={params.overdueOnly}
              onChange={(e) => set({ overdueOnly: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            {t('Overdue only')}
            {summary.data?.OVERDUE ? (
              <span className="rounded-full bg-danger/15 px-1.5 text-xs font-semibold text-danger">
                {summary.data.OVERDUE}
              </span>
            ) : null}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={params.criticalPendingOnly}
              onChange={(e) => set({ criticalPendingOnly: e.target.checked })}
              className="h-4 w-4 rounded border-input"
            />
            {t('Callback pending')}
            {summary.data?.CRITICAL_PENDING ? (
              <span className="rounded-full bg-critical/15 px-1.5 text-xs font-semibold text-critical">
                {summary.data.CRITICAL_PENDING}
              </span>
            ) : null}
          </label>
        </div>

        {error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.content ?? []}
              rowKey={(r) => r.id}
              loading={loading && !data}
              emptyState={
                <EmptyState
                  title={t('Nothing in this queue')}
                  message={t('Results appear here once a sample is received into the lab.')}
                />
              }
              rowHref={(r) => `/app/results/${r.id}`}
              onRowClick={(r) => navigate(`/app/results/${r.id}`)}
            />
            {data && data.totalPages > 1 && (
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => set({ page: p + 1 })}
              />
            )}
          </>
        )}
      </Card>
    </>
  );
}
