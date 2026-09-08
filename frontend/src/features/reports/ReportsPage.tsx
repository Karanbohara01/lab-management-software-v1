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
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDate } from '@/features/patients/format';
import { reportsApi } from './api';
import { REPORT_STATUS_TONE, type ReportListItem, type ReportStatus } from './types';

const PAGE_SIZE = 20;

export function ReportsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'' | ReportStatus>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () => reportsApi.list({ status: status || undefined, query: debouncedSearch || undefined, page, size: PAGE_SIZE }),
    [status, debouncedSearch, page],
  );

  const columns: Column<ReportListItem>[] = [
    { key: 'no', header: 'Report', cell: (r) => <span className="font-mono text-xs">{r.reportNumber}</span> },
    {
      key: 'patient',
      header: 'Patient',
      cell: (r) => (
        <span className="flex items-center gap-2">
          {r.hasCritical && <AlertTriangle className="h-4 w-4 text-critical" aria-label="Critical" />}
          <span className="font-medium">{r.patientName}</span>
          <span className="font-mono text-xs text-muted">{r.patientMrn}</span>
        </span>
      ),
    },
    { key: 'order', header: 'Order', cell: (r) => r.orderNumber, hideOnMobile: true },
    { key: 'tests', header: 'Tests', cell: (r) => r.testCount, hideOnMobile: true },
    { key: 'date', header: 'Generated', cell: (r) => formatDate(r.generatedAt), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
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
      <PageHeader title="Reports" description="Consolidated laboratory reports generated from approved results." />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search report no., patient or MRN"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'GENERATED', label: 'Generated' },
                { value: 'RELEASED', label: 'Released' },
                { value: 'DELIVERED', label: 'Delivered' },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | ReportStatus);
                setPage(0);
              }}
            />
          </div>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No reports"
            message="Generate a report from a lab order once its results are approved."
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(r) => r.id}
                onRowClick={(r) => navigate(`/app/reports/${r.id}`)}
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
