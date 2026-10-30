import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatDateTime } from '@/features/patients/format';
import { branchesApi, type Branch } from '@/features/branches/api';
import { appointmentsApi } from './api';
import { AppointmentFormModal } from './AppointmentFormModal';
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE, type AppointmentListItem, type AppointmentStatus } from './types';

const PAGE_SIZE = 20;

export function AppointmentsPage() {
  const navigate = useNavigate();
  const { hasPermission, user } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.APPOINTMENT_WRITE);
  const isHq = !user?.homeBranchId;

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'' | AppointmentStatus>('');
  const [date, setDate] = useState('');
  const [branchId, setBranchId] = useState('');
  const [page, setPage] = useState(0);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    if (isHq) branchesApi.list(true).then(setBranches);
  }, [isHq]);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () =>
      appointmentsApi.list({
        query: debouncedSearch || undefined,
        status: status || undefined,
        branchId: branchId ? Number(branchId) : undefined,
        scheduledFrom: date ? `${date}T00:00:00` : undefined,
        scheduledTo: date ? `${date}T23:59:59` : undefined,
        page,
        size: PAGE_SIZE,
      }),
    [debouncedSearch, status, date, branchId, page],
  );

  const columns: Column<AppointmentListItem>[] = [
    { key: 'no', header: 'Appointment', cell: (a) => <span className="font-mono text-xs">{a.appointmentNumber}</span> },
    {
      key: 'patient',
      header: 'Patient',
      cell: (a) => (
        <span>
          <span className="font-medium">{a.patientName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{a.patientMrn}</span>
        </span>
      ),
    },
    { key: 'when', header: 'Scheduled', cell: (a) => formatDateTime(a.scheduledAt) },
    { key: 'doctor', header: 'Doctor', cell: (a) => a.referringDoctorName ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (a) => <Badge tone={APPOINTMENT_STATUS_TONE[a.status]}>{APPOINTMENT_STATUS_LABEL[a.status]}</Badge>,
    },
    ...(isHq
      ? [{ key: 'branch', header: 'Branch', cell: (a: AppointmentListItem) => a.branchName ?? '—', hideOnMobile: true } as Column<AppointmentListItem>]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Appointments"
        description="Booked time slots for a patient visit. Converting one into a lab order happens at arrival."
        actions={
          canWrite ? (
            <Button onClick={() => setFormOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />
              New appointment
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:flex-wrap">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by appointment no., patient or MRN"
            />
          </div>
          <div className="sm:w-44">
            <input
              type="date"
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setPage(0);
              }}
              className="h-full w-full rounded-md border border-input bg-surface px-3 py-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="sm:w-48">
            <Select
              options={[
                { value: '', label: 'All statuses' },
                { value: 'SCHEDULED', label: 'Scheduled' },
                { value: 'CHECKED_IN', label: 'Checked in' },
                { value: 'CONVERTED', label: 'Converted' },
                { value: 'CANCELLED', label: 'Cancelled' },
                { value: 'NO_SHOW', label: 'No-show' },
              ]}
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as '' | AppointmentStatus);
                setPage(0);
              }}
            />
          </div>
          {isHq && (
            <div className="sm:w-48">
              <Select
                options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: String(b.id), label: b.name }))]}
                value={branchId}
                onChange={(e) => {
                  setBranchId(e.target.value);
                  setPage(0);
                }}
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
            title="No appointments found"
            message={debouncedSearch || status || date ? 'Adjust the filters.' : 'Book the first appointment.'}
            action={canWrite && !debouncedSearch && !status && !date ? <Button onClick={() => setFormOpen(true)}>New appointment</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(a) => a.id}
                onRowClick={(a) => navigate(`/app/appointments/${a.id}`)}
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

      <AppointmentFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        appointment={null}
        onSaved={refetch}
      />
    </>
  );
}
