import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { doctorsApi } from './api';
import type { Doctor } from './types';
import { DoctorFormModal } from './DoctorFormModal';

const PAGE_SIZE = 20;

export function DoctorsPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.DOCTOR_WRITE);

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () => doctorsApi.list({ query: debouncedSearch || undefined, activeOnly: false, page, size: PAGE_SIZE }),
    [debouncedSearch, page],
  );

  const columns: Column<Doctor>[] = [
    { key: 'name', header: 'Name', cell: (d) => <span className="font-medium">{d.fullName}</span> },
    { key: 'spec', header: 'Specialization', cell: (d) => d.specialization ?? '—' },
    { key: 'nmc', header: 'NMC no.', cell: (d) => d.nmcNumber ?? '—', hideOnMobile: true },
    { key: 'phone', header: 'Phone', cell: (d) => d.phone ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (d) => <Badge tone={d.active ? 'success' : 'neutral'}>{d.active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (d: Doctor) => {
    setEditing(d);
    setModalOpen(true);
  };

  return (
    <>
      <PageHeader
        title="Referring doctors"
        description="Doctors who refer patients to the laboratory."
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              Add doctor
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or specialization"
            />
          </div>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No doctors found"
            message={debouncedSearch ? 'Try a different search.' : 'Add the first referring doctor.'}
            action={canWrite && !debouncedSearch ? <Button onClick={openCreate}>Add doctor</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(d) => d.id}
                onRowClick={canWrite ? openEdit : undefined}
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

      <DoctorFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        doctor={editing}
        onSaved={refetch}
      />
    </>
  );
}
