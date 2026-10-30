import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, CalendarClock, CheckCircle2, UserX } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/features/patients/format';
import { appointmentsApi } from './api';
import { AppointmentFormModal } from './AppointmentFormModal';
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from './types';

export function AppointmentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.APPOINTMENT_WRITE);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: appointment, loading, error, refetch } = useQuery(() => appointmentsApi.get(Number(id)), [id]);

  if (loading && !appointment) return <LoadingState label="Loading appointment…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!appointment) return null;

  const act = async (label: string, work: Promise<unknown>) => {
    setBusy(true);
    try {
      await work;
      toast.success(label);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Link to="/app/appointments" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Appointments
      </Link>
      <PageHeader
        title={appointment.appointmentNumber}
        description={formatDateTime(appointment.scheduledAt)}
        actions={<Badge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>{APPOINTMENT_STATUS_LABEL[appointment.status]}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Patient" />
            <CardBody>
              <p className="font-medium text-foreground">
                {appointment.patientName} <span className="font-mono text-xs text-muted">{appointment.patientMrn}</span>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted">Referring doctor</dt>
                  <dd className="text-foreground">{appointment.referringDoctorName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted">Branch</dt>
                  <dd className="text-foreground">{appointment.branchName ?? '—'}</dd>
                </div>
                {appointment.reason && (
                  <div className="col-span-2">
                    <dt className="text-muted">Reason</dt>
                    <dd className="text-foreground">{appointment.reason}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          {appointment.status === 'CANCELLED' && appointment.cancelReason && (
            <Card>
              <CardHeader title="Cancellation" />
              <CardBody>
                <p className="text-sm text-foreground">{appointment.cancelReason}</p>
                <p className="mt-1 text-xs text-muted">{appointment.cancelledAt && formatDateTime(appointment.cancelledAt)}</p>
              </CardBody>
            </Card>
          )}

          {appointment.status === 'CONVERTED' && appointment.convertedOrderId && (
            <Card>
              <CardHeader title="Converted order" />
              <CardBody>
                <Link to={`/app/orders/${appointment.convertedOrderId}`} className="text-sm text-primary hover:underline">
                  {appointment.convertedOrderNumber}
                </Link>
                <p className="mt-1 text-xs text-muted">{appointment.convertedAt && formatDateTime(appointment.convertedAt)}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {canWrite && (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
          <div className="space-y-4">
            <Card>
              <CardHeader title="Actions" />
              <CardBody className="space-y-2">
                {appointment.status === 'SCHEDULED' && (
                  <Button
                    className="w-full justify-center"
                    disabled={busy}
                    onClick={() => act('Checked in', appointmentsApi.checkIn(appointment.id))}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    Check in
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  disabled={busy}
                  onClick={() => navigate(`/app/orders/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`)}
                >
                  Convert to order
                </Button>
                {appointment.status === 'SCHEDULED' && (
                  <Button variant="secondary" className="w-full justify-center" disabled={busy} onClick={() => setRescheduleOpen(true)}>
                    <CalendarClock className="h-4 w-4" aria-hidden />
                    Reschedule
                  </Button>
                )}
                {appointment.status === 'SCHEDULED' && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    disabled={busy}
                    onClick={() => act('Marked as no-show', appointmentsApi.noShow(appointment.id))}
                  >
                    <UserX className="h-4 w-4" aria-hidden />
                    Mark no-show
                  </Button>
                )}
                <Button variant="danger" className="w-full justify-center" disabled={busy} onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" aria-hidden />
                  Cancel
                </Button>
              </CardBody>
            </Card>
          </div>
        )}
      </div>

      <AppointmentFormModal
        open={rescheduleOpen}
        onClose={() => setRescheduleOpen(false)}
        appointment={appointment}
        onSaved={refetch}
      />

      <ConfirmDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={(reason) => act('Appointment cancelled', appointmentsApi.cancel(appointment.id, reason))}
        title="Cancel appointment"
        message={`Cancel ${appointment.appointmentNumber} for ${appointment.patientName}?`}
        confirmLabel="Cancel appointment"
        tone="danger"
        reason="required"
      />
    </>
  );
}
