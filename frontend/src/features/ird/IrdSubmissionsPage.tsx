import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { cn } from '@/lib/cn';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatDate } from '@/features/patients/format';
import { irdApi } from './api';
import { IrdConfigBanner } from './IrdConfigBanner';
import { IRD_STATUS_LABEL, IRD_STATUS_TONE, type IrdStatus, type IrdSubmissionListItem } from './types';

const PAGE_SIZE = 20;
const TABS: { value: '' | IrdStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'NOT_SUBMITTED', label: 'Not submitted' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'SUBMITTED', label: 'Submitted' },
  { value: 'ACCEPTED', label: 'Accepted' },
];

export function IrdSubmissionsPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<'' | IrdStatus>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const summary = useQuery(() => irdApi.summary(), []);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () => irdApi.list({ status: status || undefined, query: debouncedSearch || undefined, page, size: PAGE_SIZE }),
    [status, debouncedSearch, page],
  );

  const columns: Column<IrdSubmissionListItem>[] = [
    { key: 'inv', header: 'Invoice', cell: (s) => <span className="font-mono text-xs">{s.invoiceNumber ?? '—'}</span> },
    { key: 'patient', header: 'Patient', cell: (s) => s.patientName },
    { key: 'attempts', header: 'Attempts', cell: (s) => s.attemptCount, hideOnMobile: true },
    { key: 'updated', header: 'Updated', cell: (s) => formatDate(s.updatedAt), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <span className="flex items-center gap-1.5">
          <Badge tone={IRD_STATUS_TONE[s.status]}>{IRD_STATUS_LABEL[s.status]}</Badge>
          {s.manual && <Badge tone="neutral">Manual</Badge>}
        </span>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="IRD / e-Billing" description="Track electronic submission of issued invoices to IRD / CBMS." />
      <IrdConfigBanner />

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

        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search invoice no. or patient"
            />
          </div>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="Nothing here" message="A tracking record is created when an invoice is issued." />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(s) => s.id}
                onRowClick={(s) => navigate(`/app/ird/${s.id}`)}
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
