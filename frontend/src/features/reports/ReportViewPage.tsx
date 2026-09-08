import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Printer, RefreshCw, Send, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { reportsApi } from './api';
import { REPORT_STATUS_TONE } from './types';
import { ReportDocument } from './ReportDocument';
import { DeliverReportModal } from './DeliverReportModal';

export function ReportViewPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const [deliverOpen, setDeliverOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const { data: report, loading, error, refetch } = useQuery(() => reportsApi.get(Number(id)), [id]);

  if (loading && !report) return <LoadingState label="Loading report…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!report) return null;

  const canGenerate = hasPermission(PERMISSIONS.REPORT_GENERATE);
  const canDeliver = hasPermission(PERMISSIONS.REPORT_DELIVER);

  const act = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div data-print-hide>
        <Link
          to={`/app/orders/${report.orderId}`}
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Order {report.orderNumber}
        </Link>

        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h1 className="mr-2 text-xl font-semibold text-foreground">{report.reportNumber}</h1>
          <Badge tone={REPORT_STATUS_TONE[report.status]}>{report.status}</Badge>
          {report.reportType === 'PRELIMINARY' && <Badge tone="warning">Preliminary</Badge>}
          {report.reportVersion > 1 && <Badge tone="warning">v{report.reportVersion}</Badge>}
          {report.signedBy && <Badge tone="success">Signed</Badge>}
          <div className="flex-1" />
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" aria-hidden />
            Print / PDF
          </Button>
          {canGenerate && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => act(() => reportsApi.generate(report.orderId), 'Report regenerated')}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Regenerate (final)
            </Button>
          )}
          {canGenerate && report.reportType === 'PRELIMINARY' && (
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => act(() => reportsApi.generate(report.orderId, true), 'Preliminary report updated')}
            >
              <RefreshCw className="h-4 w-4" aria-hidden />
              Update preliminary
            </Button>
          )}
          {canGenerate && report.status === 'GENERATED' && (
            <Button
              disabled={busy}
              onClick={() => {
                const cred = window.prompt('Signing credentials (e.g. MBBS, MD Pathology, NMC 12345) — optional:') ?? '';
                act(() => reportsApi.release(report.id, cred || undefined), 'Report signed & released');
              }}
            >
              <ShieldCheck className="h-4 w-4" aria-hidden />
              Sign &amp; release
            </Button>
          )}
          {canDeliver && report.status !== 'GENERATED' && (
            <Button disabled={busy} onClick={() => setDeliverOpen(true)}>
              <Send className="h-4 w-4" aria-hidden />
              Record delivery
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border shadow-card">
        <ReportDocument report={report} />
      </div>

      <DeliverReportModal
        open={deliverOpen}
        onClose={() => setDeliverOpen(false)}
        reportId={report.id}
        onDone={refetch}
      />
    </>
  );
}
