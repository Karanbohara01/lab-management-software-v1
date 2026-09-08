import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { cn } from '@/lib/cn';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { departmentsApi } from '@/features/departments/api';
import { formatDate } from '@/features/patients/format';
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

export function ResultsQueuePage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'' | ResultStatus>('');
  const [departmentId, setDepartmentId] = useState('');
  const [criticalOnly, setCriticalOnly] = useState(false);
  const [overdueOnly, setOverdueOnly] = useState(false);
  const [callbackPendingOnly, setCallbackPendingOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const departments = useQuery(() => departmentsApi.list(true), []);
  const summary = useQuery(
    () => resultsApi.summary(departmentId ? Number(departmentId) : undefined),
    [departmentId],
  );
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, loading, error, refetch } = useQuery(
    () =>
      resultsApi.list({
        status: status || undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        criticalOnly: criticalOnly || undefined,
        overdueOnly: overdueOnly || undefined,
        criticalPendingOnly: callbackPendingOnly || undefined,
        query: debouncedSearch || undefined,
        page,
        size: PAGE_SIZE,
      }),
    [status, departmentId, criticalOnly, overdueOnly, callbackPendingOnly, debouncedSearch, page],
  );

  const columns: Column<ResultListItem>[] = [
    {
      key: 'test',
      header: 'Test',
      cell: (r) => (
        <span className="flex items-center gap-2">
          {r.hasCritical && <AlertTriangle className="h-4 w-4 text-critical" aria-label="Critical value" />}
          {r.priority !== 'ROUTINE' && <Badge tone={r.priority === 'STAT' ? 'critical' : 'warning'}>{r.priority}</Badge>}
          <span className="font-medium">{r.testName}</span>
          <span className="font-mono text-xs text-muted">{r.testCode}</span>
        </span>
      ),
    },
    {
      key: 'patient',
      header: 'Patient',
      cell: (r) => (
        <span>
          {r.patientName} <span className="font-mono text-xs text-muted">{r.patientMrn}</span>
        </span>
      ),
    },
    { key: 'acc', header: 'Accession', cell: (r) => <span className="font-mono text-xs">{r.accessionNumber}</span>, hideOnMobile: true },
    { key: 'dept', header: 'Department', cell: (r) => r.departmentName, hideOnMobile: true },
    { key: 'date', header: 'Received', cell: (r) => formatDate(r.createdAt), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (r) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={RESULT_STATUS_TONE[r.status]}>{RESULT_STATUS_LABEL[r.status]}</Badge>
          {r.hasAbnormal && !r.hasCritical && <Badge tone="warning">Abn</Badge>}
          {r.overdue && <Badge tone="danger">Overdue</Badge>}
          {r.criticalAckRequired && <Badge tone="critical">Callback due</Badge>}
          {r.autoVerified && <Badge tone="neutral">Auto</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Results"
        description="Department worklist — enter, verify and approve test results."
      />

      <Card>
        <div className="flex flex-wrap gap-1 border-b border-border p-2">
          {TABS.map((tab) => {
            const count = tab.value ? summary.data?.[tab.value] : undefined;
            return (
              <button
                key={tab.value || 'all'}
                onClick={() => {
                  setStatus(tab.value);
                  setPage(0);
                }}
                className={cn(
                  'rounded-md px-3 py-1.5 text-sm font-medium',
                  status === tab.value ? 'bg-primary/10 text-primary' : 'text-muted hover:bg-surface-muted',
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search test, patient or MRN"
            />
          </div>
          <div className="sm:w-56">
            <Select
              options={[
                { value: '', label: 'All departments' },
                ...(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
              ]}
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(0);
              }}
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={criticalOnly}
              onChange={(e) => {
                setCriticalOnly(e.target.checked);
                setPage(0);
              }}
              className="h-4 w-4 rounded border-input"
            />
            Critical only
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={overdueOnly}
              onChange={(e) => {
                setOverdueOnly(e.target.checked);
                setPage(0);
              }}
              className="h-4 w-4 rounded border-input"
            />
            Overdue only
            {summary.data?.OVERDUE ? (
              <span className="rounded-full bg-danger/15 px-1.5 text-xs font-semibold text-danger">
                {summary.data.OVERDUE}
              </span>
            ) : null}
          </label>
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={callbackPendingOnly}
              onChange={(e) => {
                setCallbackPendingOnly(e.target.checked);
                setPage(0);
              }}
              className="h-4 w-4 rounded border-input"
            />
            Callback pending
            {summary.data?.CRITICAL_PENDING ? (
              <span className="rounded-full bg-critical/15 px-1.5 text-xs font-semibold text-critical">
                {summary.data.CRITICAL_PENDING}
              </span>
            ) : null}
          </label>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="Nothing in this queue"
            message="Results appear here once a sample is received into the lab."
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/app/results/${r.id}`)}
              />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={setPage}
              />
            </>
          )
        )}
      </Card>
    </>
  );
}
