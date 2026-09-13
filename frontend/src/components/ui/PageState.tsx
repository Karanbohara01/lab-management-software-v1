import type { ReactNode } from 'react';
import { Inbox, ServerCrash } from 'lucide-react';
import { Button } from './Button';
import { Spinner } from './Spinner';

/** Standard full-panel states so every page handles loading / empty / error consistently. */

export function LoadingState({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-48 items-center justify-center py-12">
      <Spinner label={label} />
    </div>
  );
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
}: {
  title?: string;
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-center">
      <ServerCrash className="h-8 w-8 text-danger" aria-hidden />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      </div>
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  );
}

/**
 * Placeholder rows shaped like the table that's about to load, instead of a spinner that
 * disconnects from the content — reduces layout shift and reads as "this is loading" faster than
 * a centered spinner does. Column widths are varied per row so it doesn't look like a static grid.
 */
export function TableSkeleton({ columns = 4, rows = 6 }: { columns?: number; rows?: number }) {
  const widths = [88, 64, 76, 52, 68, 80, 60, 72];
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="hidden sm:block">
        <table className="w-full text-sm">
          <tbody>
            {Array.from({ length: rows }).map((_, r) => (
              <tr key={r} className="border-b border-border last:border-0">
                {Array.from({ length: columns }).map((__, c) => (
                  <td key={c} className="px-4 py-3">
                    <div
                      className="h-4 rounded bg-surface-muted"
                      style={{ width: `${widths[(r + c) % widths.length]}%` }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="divide-y divide-border sm:hidden">
        {Array.from({ length: rows }).map((_, r) => (
          <li key={r} className="space-y-2 px-4 py-3">
            <div className="h-4 rounded bg-surface-muted" style={{ width: `${widths[r % widths.length]}%` }} />
            <div className="h-3 w-1/3 rounded bg-surface-muted" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function EmptyState({
  title,
  message,
  action,
}: {
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center gap-3 py-12 text-center">
      <Inbox className="h-8 w-8 text-muted" aria-hidden />
      <div>
        <p className="font-medium text-foreground">{title}</p>
        {message && <p className="mt-1 text-sm text-muted">{message}</p>}
      </div>
      {action}
    </div>
  );
}
