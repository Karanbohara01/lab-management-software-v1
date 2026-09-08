import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

function Shell({ code, title, message }: { code: string; title: string; message: string }) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <p className="text-5xl font-semibold text-primary">{code}</p>
      <div>
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted">{message}</p>
      </div>
      <Link to="/app">
        <Button variant="secondary">Back to dashboard</Button>
      </Link>
    </div>
  );
}

export function ForbiddenPage() {
  return (
    <Shell
      code="403"
      title="Access denied"
      message="You do not have permission to view this page. If you believe this is a mistake, contact your administrator."
    />
  );
}

export function NotFoundPage() {
  return <Shell code="404" title="Page not found" message="The page you were looking for does not exist." />;
}
