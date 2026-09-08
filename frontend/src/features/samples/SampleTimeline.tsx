import { CheckCircle2, Ban, FlaskConical, PackageCheck, RefreshCw, StickyNote } from 'lucide-react';
import type { SampleEvent, SampleEventType } from './types';

const ICONS: Record<SampleEventType, typeof FlaskConical> = {
  CREATED: FlaskConical,
  COLLECTED: PackageCheck,
  RECEIVED: CheckCircle2,
  REJECTED: Ban,
  RECOLLECTION_REQUESTED: RefreshCw,
  NOTE: StickyNote,
};

function when(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function SampleTimeline({ events }: { events: SampleEvent[] }) {
  return (
    <ol className="space-y-4">
      {events.map((event, index) => {
        const Icon = ICONS[event.eventType];
        const isLast = index === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-3">
            {!isLast && <span className="absolute left-[15px] top-8 h-full w-px bg-border" aria-hidden />}
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-surface text-muted">
              <Icon className="h-4 w-4" aria-hidden />
            </span>
            <div className="pb-1">
              <p className="text-sm font-medium text-foreground">
                {event.eventType.replace(/_/g, ' ').toLowerCase().replace(/^\w/, (c) => c.toUpperCase())}
                {event.toStatus && event.fromStatus && event.toStatus !== event.fromStatus && (
                  <span className="text-muted"> · {event.toStatus.replace(/_/g, ' ').toLowerCase()}</span>
                )}
              </p>
              {event.note && <p className="text-sm text-muted">{event.note}</p>}
              <p className="mt-0.5 text-xs text-muted">
                {when(event.occurredAt)} · {event.actor}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
