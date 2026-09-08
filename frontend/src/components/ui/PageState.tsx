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
