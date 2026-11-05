import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatDateTime } from '@/features/patients/format';
import { branchesApi, type Branch } from '@/features/branches/api';
import { appointmentsApi } from './api';
import { AppointmentFormModal } from './AppointmentFormModal';
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE, type AppointmentListItem, type AppointmentStatus } from './types';
import { useT } from '@/i18n';

const PAGE_SIZE = 20;
/** Lives in the URL, so returning from an appointment lands on the same search, filters and page. */
const PARAMS = { q: '', status: '', date: '', branchId: '', page: 1 };

export function AppointmentsPage() {
  const t = useT();
  const navigate = useNavigateFrom();
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.APPOINTMENT_WRITE);
  const isHq = !user?.homeBranchId;

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  const { data, loading, error, refetch } = useQuery(
    () =>
      appointmentsApi.list({
        query: params.q || undefined,
        status: (params.status as AppointmentStatus) || undefined,
        branchId: params.branchId ? Number(params.branchId) : undefined,
        scheduledFrom: params.date ? `${params.date}T00:00:00` : undefined,
        scheduledTo: params.date ? `${params.date}T23:59:59` : undefined,
        page: params.page - 1,
        size: PAGE_SIZE,
      }),
    [params.q, params.status, params.date, params.branchId, params.page],
    { cacheKey: `appointments:${params.q}:${params.status}:${params.date}:${params.branchId}:${params.page}` },
  );

  const columns: Column<AppointmentListItem>[] = [
    { key: 'no', header: t('Appointment'), cell: (a) => <span className="font-mono text-xs">{a.appointmentNumber}</span> },
    {
      key: 'patient',
      header: t('Patient'),
      cell: (a) => (
        <span>
          <span className="font-medium">{a.patientName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{a.patientMrn}</span>
        </span>
      ),
    },
    { key: 'when', header: t('Scheduled'), cell: (a) => formatDateTime(a.scheduledAt) },
    { key: 'doctor', header: t('Doctor'), cell: (a) => a.referringDoctorName ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (a) => <Badge tone={APPOINTMENT_STATUS_TONE[a.status]}>{t(APPOINTMENT_STATUS_LABEL[a.status])}</Badge>,
    },
    ...(isHq
      ? [{ key: 'branch', header: t('Branch'), cell: (a: AppointmentListItem) => a.branchName ?? '—', hideOnMobile: true } as Column<AppointmentListItem>]
      : []),
  ];

  return (
    <>
      <PageHeader
        title={t('Appointments')}
        description={t('Booked time slots for a patient visit. Converting one into a lab order happens at arrival.')}
        actions={
          canWrite ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('New appointment')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t('Search by appointment no., patient or MRN')}
            />
          </div>
          <div className="sm:w-44">
            <input
              type="date"
              value={params.date}
              onChange={(e) => set({ date: e.target.value })}
              className="h-full w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: '', label: t('All statuses') },
                { value: 'SCHEDULED', label: t('Scheduled') },
                { value: 'CHECKED_IN', label: t('Checked in') },
                { value: 'CONVERTED', label: t('Converted') },
                { value: 'CANCELLED', label: t('Cancelled') },
                { value: 'NO_SHOW', label: t('No-show') },
              ]}
              value={params.status}
              onChange={(e) => set({ status: e.target.value })}
            />
          </div>
          {isHq && (
            <div className="sm:w-48">
              <Select
                options={[{ value: '', label: t('All branches') }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))]}
                value={params.branchId}
                onChange={(e) => set({ branchId: e.target.value })}
              />
            </div>
          )}
        </div>

        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title={t('No appointments found')}
            message={params.q || params.status || params.date ? t('Adjust the filters.') : t('Book the first appointment.')}
            action={canWrite && !params.q && !params.status && !params.date ? <Button onClick={() => setFormOpen(true)}>{t('New appointment')}</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(a) => a.id}
                rowHref={(a) => `/app/appointments/${a.id}`}
                onRowClick={(a) => navigate(`/app/appointments/${a.id}`)}
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

      <AppointmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        appointment={null}
        onSaved={refetch}
      />
    </>
  );
}
