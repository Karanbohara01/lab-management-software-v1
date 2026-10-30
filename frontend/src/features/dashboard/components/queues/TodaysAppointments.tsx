import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useQuery } from '@/hooks/useQuery';
import { appointmentsApi } from '@/features/appointments/api';
import { formatDateTime } from '@/features/patients/format';
import { QueueShell } from './QueueShell';

function todayBounds(): { from: string; to: string } {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const to = new Date(from);
  to.setDate(to.getDate() + 1);
  return { from: from.toISOString(), to: to.toISOString() };
}

/** Front-desk worklist: today's still-scheduled appointments, waiting on the patient to arrive. */
export function TodaysAppointments() {
  const navigate = useNavigate();
  const { from, to } = todayBounds();
  const { data, loading, error, refetch } = useQuery(
    () => appointmentsApi.list({ status: 'SCHEDULED', scheduledFrom: from, scheduledTo: to, size: 8 }),
    [from, to],
  );

  return (
    <QueueShell
      title="Today's appointments"
      description="Scheduled visits still waiting on check-in."
      count={data?.totalElements}
      viewAllTo="/app/appointments?status=SCHEDULED"
      loading={loading && !data}
      error={error}
      onRetry={refetch}
      isEmpty={!!data && data.content.length === 0}
      emptyMessage="No appointments left to check in today."
    >
      <ul className="divide-y divide-border">
        {data?.content.map((a) => (
          <li key={a.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
            <button
              type="button"
              onClick={() => navigate(`/app/appointments/${a.id}`)}
              className="min-w-0 flex-1 text-left hover:underline"
            >
              <p className="truncate text-sm font-medium text-foreground">
                {a.patientName} <span className="font-mono text-xs text-muted">{a.appointmentNumber}</span>
              </p>
              <p className="truncate text-xs text-muted">{formatDateTime(a.scheduledAt)}</p>
            </button>
            <Button size="sm" variant="secondary" onClick={() => navigate(`/app/appointments/${a.id}`)}>
              Open
            </Button>
          </li>
        ))}
      </ul>
    </QueueShell>
  );
}
