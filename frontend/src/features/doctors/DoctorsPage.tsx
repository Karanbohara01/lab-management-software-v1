import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { doctorsApi } from './api';
import type { Doctor } from './types';
import { DoctorFormModal } from './DoctorFormModal';
import { useT } from '@/i18n';

const PAGE_SIZE = 20;
/** Lives in the URL, so returning to the list lands on the same search and page. */
const PARAMS = { q: '', page: 1 };

export function DoctorsPage() {
  const t = useT();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.DOCTOR_WRITE);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));
  const [editing, setEditing] = useState<Doctor | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(
    () => doctorsApi.list({ query: params.q || undefined, activeOnly: false, page: params.page - 1, size: PAGE_SIZE }),
    [params.q, params.page],
    { cacheKey: `doctors:${params.q}:${params.page}` },
  );

  const columns: Column<Doctor>[] = [
    { key: 'name', header: t('Name'), cell: (d) => <span className="font-medium">{d.fullName}</span> },
    { key: 'spec', header: t('Specialization'), cell: (d) => d.specialization ?? '—' },
    { key: 'nmc', header: t('NMC no.'), cell: (d) => d.nmcNumber ?? '—', hideOnMobile: true },
    { key: 'phone', header: t('Phone'), cell: (d) => d.phone ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (d) => <Badge tone={d.active ? 'success' : 'neutral'}>{t(d.active ? 'Active' : 'Inactive')}</Badge>,
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
        title={t('Referring doctors')}
        description={t('Doctors who refer patients to the laboratory.')}
        actions={
          canWrite ? (
            <Button onClick={openCreate}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('Add doctor')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search by name or specialization')}
            />
          </div>
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title={t('No doctors found')}
            message={params.q ? t('Try a different search.') : t('Add the first referring doctor.')}
            action={canWrite && !params.q ? <Button onClick={openCreate}>{t('Add doctor')}</Button> : undefined}
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
                onPageChange={(p) => set({ page: p + 1 })}
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
