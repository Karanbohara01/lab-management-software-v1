import { Plus, ShieldAlert, Star } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { patientsApi } from './api';
import type { PatientCategory, PatientListItem } from './types';
import { PATIENT_CATEGORIES, categoryLabel } from './constants';
import { formatAge } from './format';

const PAGE_SIZE = 20;
/** Lives in the URL, so returning from a patient lands on the same search, filter and page. */
const PARAMS = { q: '', category: '', page: 1 };

export function PatientsPage() {
  const navigate = useNavigateFrom();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.PATIENT_WRITE);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  const { data, loading, error, refetch } = useQuery(
    () =>
      patientsApi.list({
        query: params.q || undefined,
        category: (params.category as PatientCategory) || undefined,
        activeOnly: false,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.q, params.category, params.page],
    { cacheKey: `patients:${params.q}:${params.category}:${params.page}` },
  );

  const columns: Column<PatientListItem>[] = [
    { key: 'mrn', header: 'MRN', cell: (p) => <span className="font-mono text-xs text-muted">{p.mrn}</span> },
    {
      key: 'name',
      header: 'Name',
      cell: (p) => (
        <span className="flex items-center gap-1.5">
          <span className="font-medium">
            {p.salutation ? `${p.salutation} ` : ''}
            {p.fullName}
          </span>
          {p.vip && <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-label="VIP" />}
          {p.confidential && <ShieldAlert className="h-3.5 w-3.5 text-danger" aria-label="Confidential" />}
        </span>
      ),
    },
    { key: 'demo', header: 'Age / Sex', cell: (p) => `${formatAge(p.ageYears)} · ${p.gender[0]}` },
    { key: 'phone', header: 'Phone', cell: (p) => p.phone ?? '—', hideOnMobile: true },
    {
      key: 'category',
      header: 'Category',
      cell: (p) => <span className="text-sm text-muted">{categoryLabel(p.category)}</span>,
      hideOnMobile: true,
    },
    { key: 'doctor', header: 'Referred by', cell: (p) => p.referringDoctorName ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (p) =>
        p.deceased ? (
          <Badge tone="neutral">Deceased</Badge>
        ) : (
          <Badge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge>
        ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Patients"
        description="Register patients and open a longitudinal view of their orders, invoices and reports."
        actions={
          canWrite ? (
            <Button onClick={() => navigate('/app/patients/new')}>
              <Plus className="h-4 w-4" aria-hidden />
              Register patient
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-sm sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, MRN, phone or email"
            />
          </div>
          <Select
            aria-label="Filter by category"
            className="sm:w-52"
            options={[{ value: '', label: 'All categories' }, ...PATIENT_CATEGORIES]}
            value={params.category}
            onChange={(e) => set({ category: e.target.value })}
          />
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No patients found"
            message={
              params.q || params.category ? 'Try a different search or filter.' : 'Register the first patient to get started.'
            }
            action={
              canWrite && !params.q && !params.category ? (
                <Button onClick={() => navigate('/app/patients/new')}>Register patient</Button>
              ) : undefined
            }
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(p) => p.id}
                rowHref={(p) => `/app/patients/${p.id}`}
                onRowClick={(p) => navigate(`/app/patients/${p.id}`)}
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
