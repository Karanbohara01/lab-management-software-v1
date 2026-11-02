import { Link, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/Button';
import { useBackTarget } from '@/lib/navigation';
import type { ForbiddenState } from '@/routes/RequirePermission';

function Shell({ code, title, message }: { code: string; title: string; message: string }) {
  const { back } = useBackTarget();
  // Opened directly (or from the dashboard) there is nowhere else to return to, and the
  // dashboard button below already covers it.
  const canGoBack = back.href !== '/app';

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-semibold text-primary">{code}</p>
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-2">
        {canGoBack && (
          <Link to={back.href}>
            <Button variant="secondary">Back to {back.label}</Button>
          </Link>
        )}
        <Link to="/app">
          <Button variant="secondary">Back to dashboard</Button>
        </Link>
      </div>
    </div>
  );
}

export function ForbiddenPage() {
  const attempted = (useLocation().state as ForbiddenState | null)?.attempted;
  return (
    <Shell
      code="403"
      title="Access denied"
      message={
        attempted
          ? `Your account does not have permission to open ${attempted}. If you believe this is a mistake, contact your administrator.`
          : 'You do not have permission to view this page. If you believe this is a mistake, contact your administrator.'
      }
    />
  );
}

export function NotFoundPage() {
  const { pathname } = useLocation();
  return (
    <Shell
      code="404"
      title="Page not found"
      message={`There is nothing at ${pathname}. The link may be out of date, or the record may have been removed.`}
    />
  );
}
