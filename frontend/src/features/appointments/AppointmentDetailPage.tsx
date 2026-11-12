import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Ban, CalendarClock, CheckCircle2, UserX } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { LinkFrom, useBackTarget, useNavigateFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatDateTime } from '@/features/patients/format';
import { appointmentsApi } from './api';
import { AppointmentFormModal } from './AppointmentFormModal';
import { AppointmentEstimate } from './AppointmentEstimate';
import { APPOINTMENT_STATUS_LABEL, APPOINTMENT_STATUS_TONE } from './types';
import { useT } from '@/i18n';

export function AppointmentDetailPage() {
  const t = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigateFrom();
  const { back } = useBackTarget();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.APPOINTMENT_WRITE);

  const [rescheduleOpen, setRescheduleOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: appointment, loading, error, refetch } = useQuery(() => appointmentsApi.get(Number(id)), [id]);

  if (loading && !appointment) return <LoadingState label={t('Loading appointment…')} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!appointment) return null;

  const act = async (label: string, work: Promise<unknown>) => {
    setBusy(true);
    try {
      await work;
      toast.success(label);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Action failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <PageHeader
        back={back}
        title={appointment.appointmentNumber}
        description={formatDateTime(appointment.scheduledAt)}
        actions={<Badge tone={APPOINTMENT_STATUS_TONE[appointment.status]}>{t(APPOINTMENT_STATUS_LABEL[appointment.status])}</Badge>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="min-w-0 space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title={t('Patient')} />
            <CardBody>
              <p className="font-medium text-foreground">
                {appointment.patientName} <span className="font-mono text-xs text-muted">{appointment.patientMrn}</span>
              </p>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-muted">{t('Referring doctor')}</dt>
                  <dd className="text-foreground">{appointment.referringDoctorName ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted">{t('Branch')}</dt>
                  <dd className="text-foreground">{appointment.branchName ?? '—'}</dd>
                </div>
                {appointment.reason && (
                  <div className="col-span-2">
                    <dt className="text-muted">{t('Reason')}</dt>
                    <dd className="text-foreground">{appointment.reason}</dd>
                  </div>
                )}
              </dl>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title={t('Requested tests')} description={t('Indicative only — the lab order sets the final price.')} />
            <CardBody className="space-y-3">
              {appointment.items.length === 0 ? (
                <p className="text-sm text-muted">{t('No tests chosen at booking.')}</p>
              ) : (
                <ul className="divide-y divide-border">
                  {appointment.items.map((it) => (
                    <li key={it.testId} className="flex items-center justify-between py-2 text-sm first:pt-0 last:pb-0">
                      <span>
                        <span className="font-medium text-foreground">{it.testName}</span>
                        <span className="ml-1.5 font-mono text-xs text-muted">{it.testCode}</span>
                      </span>
                      <span className="text-muted">× {it.quantity}</span>
                    </li>
                  ))}
                </ul>
              )}
              <AppointmentEstimate items={appointment.items} />
            </CardBody>
          </Card>

          {appointment.status === 'CANCELLED' && appointment.cancelReason && (
            <Card>
              <CardHeader title={t('Cancellation')} />
              <CardBody>
                <p className="text-sm text-foreground">{appointment.cancelReason}</p>
                <p className="mt-1 text-xs text-muted">{appointment.cancelledAt && formatDateTime(appointment.cancelledAt)}</p>
              </CardBody>
            </Card>
          )}

          {appointment.status === 'CONVERTED' && appointment.convertedOrderId && (
            <Card>
              <CardHeader title={t('Converted order')} />
              <CardBody>
                <LinkFrom to={`/app/orders/${appointment.convertedOrderId}`} className="text-sm text-primary hover:underline">
                  {appointment.convertedOrderNumber}
                </LinkFrom>
                <p className="mt-1 text-xs text-muted">{appointment.convertedAt && formatDateTime(appointment.convertedAt)}</p>
              </CardBody>
            </Card>
          )}
        </div>

        {canWrite && (appointment.status === 'SCHEDULED' || appointment.status === 'CHECKED_IN') && (
          <div className="space-y-4">
            <Card>
              <CardHeader title={t('Actions')} />
              <CardBody className="space-y-2">
                {appointment.status === 'SCHEDULED' && (
                  <Button
                    className="w-full justify-center"
                    disabled={busy}
                    onClick={() => act(t('Checked in'), appointmentsApi.checkIn(appointment.id))}
                  >
                    <CheckCircle2 className="h-4 w-4" aria-hidden />
                    {t('Check in')}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  className="w-full justify-center"
                  disabled={busy}
                  onClick={() => navigate(`/app/orders/new?patientId=${appointment.patientId}&appointmentId=${appointment.id}`)}
                >
                  {t('Convert to order')}
                </Button>
                {appointment.status === 'SCHEDULED' && (
                  <Button variant="secondary" className="w-full justify-center" disabled={busy} onClick={() => setRescheduleOpen(true)}>
                    <CalendarClock className="h-4 w-4" aria-hidden />
                    {t('Reschedule')}
                  </Button>
                )}
                {appointment.status === 'SCHEDULED' && (
                  <Button
                    variant="secondary"
                    className="w-full justify-center"
                    disabled={busy}
                    onClick={() => act(t('Marked as no-show'), appointmentsApi.noShow(appointment.id))}
                  >
                    <UserX className="h-4 w-4" aria-hidden />
                    {t('Mark no-show')}
                  </Button>
                )}
                <Button variant="danger" className="w-full justify-center" disabled={busy} onClick={() => setCancelOpen(true)}>
                  <Ban className="h-4 w-4" aria-hidden />
                  {t('Cancel')}
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
        onConfirm={(reason) => act(t('Appointment cancelled'), appointmentsApi.cancel(appointment.id, reason))}
        title={t('Cancel appointment')}
        message={t('Cancel {no} for {name}?', { no: appointment.appointmentNumber, name: appointment.patientName })}
        confirmLabel={t('Cancel appointment')}
        tone="danger"
        reason="required"
      />
    </>
  );
}
