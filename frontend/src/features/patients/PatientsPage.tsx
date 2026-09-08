import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ShieldAlert, Star } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { patientsApi } from './api';
import type { PatientCategory, PatientListItem } from './types';
import { PATIENT_CATEGORIES, categoryLabel } from './constants';
import { formatAge } from './format';

const PAGE_SIZE = 20;

export function PatientsPage() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.PATIENT_WRITE);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<PatientCategory | ''>('');
  const [page, setPage] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () =>
      patientsApi.list({
        query: debouncedSearch || undefined,
        category: category || undefined,
        activeOnly: false,
        page,
        size: PAGE_SIZE,
      }),
    [debouncedSearch, category, page],
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
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name, MRN, phone or email"
            />
          </div>
          <Select
            aria-label="Filter by category"
            className="sm:w-52"
            options={[{ value: '', label: 'All categories' }, ...PATIENT_CATEGORIES]}
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as PatientCategory | '');
              setPage(0);
            }}
          />
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No patients found"
            message={
              debouncedSearch || category ? 'Try a different search or filter.' : 'Register the first patient to get started.'
            }
            action={
              canWrite && !debouncedSearch && !category ? (
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
                onRowClick={(p) => navigate(`/app/patients/${p.id}`)}
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
