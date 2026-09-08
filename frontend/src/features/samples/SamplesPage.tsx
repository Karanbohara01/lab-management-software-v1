import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ScanLine } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { cn } from '@/lib/cn';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { SearchInput } from '@/components/ui/SearchInput';
import { departmentsApi } from '@/features/departments/api';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { formatDate } from '@/features/patients/format';
import { samplesApi } from './api';
import { SAMPLE_STATUS_LABEL, SAMPLE_STATUS_TONE, type SampleListItem, type SampleStatus } from './types';

const PAGE_SIZE = 20;
const TABS: { value: '' | SampleStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'AWAITING_COLLECTION', label: 'Awaiting collection' },
  { value: 'COLLECTED', label: 'Collected' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'REJECTED', label: 'Rejected' },
];

export function SamplesPage() {
  const navigate = useNavigate();
  const toast = useToast();

  const [status, setStatus] = useState<'' | SampleStatus>('');
  const [departmentId, setDepartmentId] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [scan, setScan] = useState('');

  const departments = useQuery(() => departmentsApi.list(true), []);
  const summary = useQuery(() => samplesApi.summary(), []);
  const debouncedSearch = useDebouncedValue(search, 300);

  const { data, loading, error, refetch } = useQuery(
    () =>
      samplesApi.list({
        status: status || undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        query: debouncedSearch || undefined,
        page,
        size: PAGE_SIZE,
      }),
    [status, departmentId, debouncedSearch, page],
  );

  const onScan = async (e: FormEvent) => {
    e.preventDefault();
    const code = scan.trim();
    if (!code) return;
    try {
      const found = await samplesApi.lookup(code);
      setScan('');
      navigate(`/app/samples/${found.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError && err.status === 404 ? `No sample with barcode ${code}` : 'Lookup failed');
    }
  };

  const columns: Column<SampleListItem>[] = [
    { key: 'acc', header: 'Accession', cell: (s) => <span className="font-mono text-xs">{s.accessionNumber}</span> },
    {
      key: 'patient',
      header: 'Patient',
      cell: (s) => (
        <span>
          <span className="font-medium">{s.patientName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{s.patientMrn}</span>
        </span>
      ),
    },
    { key: 'specimen', header: 'Specimen', cell: (s) => SPECIMEN_LABELS[s.specimenType], hideOnMobile: true },
    { key: 'dept', header: 'Departments', cell: (s) => s.departments.join(', '), hideOnMobile: true },
    { key: 'date', header: 'Created', cell: (s) => formatDate(s.createdAt), hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => <Badge tone={SAMPLE_STATUS_TONE[s.status]}>{SAMPLE_STATUS_LABEL[s.status]}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader title="Samples" description="Track specimens from collection through receipt into the laboratory." />

      <Card className="mb-4">
        <form onSubmit={onScan} className="flex items-center gap-2 p-4">
          <div className="flex-1">
            <Input
              leadingIcon={<ScanLine className="h-4 w-4" aria-hidden />}
              placeholder="Scan or type a barcode / accession number"
              value={scan}
              onChange={(e) => setScan(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit">Look up</Button>
        </form>
      </Card>

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

        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search accession, patient or MRN"
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
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No samples"
            message="Samples are generated automatically when a lab order is confirmed."
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(s) => s.id}
                onRowClick={(s) => navigate(`/app/samples/${s.id}`)}
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
