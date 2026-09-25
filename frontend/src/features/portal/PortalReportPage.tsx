import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { ReportDocument } from '@/features/reports/ReportDocument';
import { portalApi } from './api';

/** Public — reuses the same ReportDocument the authenticated staff view renders, fed from the token-scoped portal endpoint instead of a login-gated one. */
export function PortalReportPage() {
  const { token, reportId } = useParams<{ token: string; reportId: string }>();
  const { data: report, loading, error } = useQuery(
    () => portalApi.report(token!, Number(reportId)),
    [token, reportId],
  );

  if (loading && !report) return <LoadingState label="Loading report…" />;
  if (error) return <ErrorState message={error} />;
  if (!report) return null;

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-8">
      <div className="mx-auto w-full max-w-3xl">
        <div data-print-hide className="mb-4 flex items-center gap-2">
          <Link to={`/portal/${token}`} className="inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
            <ArrowLeft className="h-4 w-4" aria-hidden />
            Back
          </Link>
          <div className="flex-1" />
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Print / PDF
          </Button>
        </div>
        <div className="rounded-lg border border-border bg-white shadow-card">
          <ReportDocument report={report} />
        </div>
      </div>
    </div>
  );
}
