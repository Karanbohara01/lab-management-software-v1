import { useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { resultsApi } from '@/features/results/api';
import { reportsApi } from '@/features/reports/api';
import { REPORT_STATUS_TONE } from '@/features/reports/types';
import { DeliverReportModal } from '@/features/reports/DeliverReportModal';

export function OrderReportCard({ orderId, onChange }: { orderId: number; onChange?: () => void }) {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canGenerate = hasPermission(PERMISSIONS.REPORT_GENERATE);
  const canDeliver = hasPermission(PERMISSIONS.REPORT_DELIVER);
  const [busy, setBusy] = useState(false);
  const [deliverOpen, setDeliverOpen] = useState(false);

  const report = useQuery(
    () =>
      reportsApi
        .getByOrder(orderId)
        .catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))),
    [orderId],
  );
  const approved = useQuery(() => resultsApi.list({ orderId, status: 'APPROVED', size: 1 }), [orderId]);

  const done = () => {
    report.refetch();
    onChange?.();
  };

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      done();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  const release = () => {
    const creds = window.prompt('Signing credentials (e.g. "MD Pathology, NMC-12345"):', '');
    if (creds === null) return;
    run(() => reportsApi.release(report.data!.id, creds.trim() || undefined), 'Report signed & released');
  };

  return (
    <Card>
      <CardHeader title="Report" />
      {report.loading ? (
        <LoadingState />
      ) : report.data ? (
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">{report.data.reportNumber}</span>
            <Badge tone={REPORT_STATUS_TONE[report.data.status]}>{report.data.status}</Badge>
          </div>
          {report.data.status === 'GENERATED' && canGenerate && (
            <Button className="w-full" loading={busy} onClick={release}>
              Sign &amp; release
            </Button>
          )}
          {report.data.status === 'RELEASED' && canDeliver && (
            <Button className="w-full" onClick={() => setDeliverOpen(true)}>
              Deliver report
            </Button>
          )}
          <div className="flex gap-2">
            <Link to={`/app/reports/${report.data.id}`} className="flex-1">
              <Button variant="secondary" className="w-full">
                <FileText className="h-4 w-4" aria-hidden />
                Open report
              </Button>
            </Link>
            {canGenerate && report.data.status === 'GENERATED' && (
              <Button
                variant="ghost"
                loading={busy}
                onClick={() => run(() => reportsApi.generate(orderId, false), 'Report regenerated')}
              >
                Regenerate
              </Button>
            )}
          </div>
        </CardBody>
      ) : (
        <CardBody className="space-y-2">
          {(approved.data?.totalElements ?? 0) === 0 ? (
            <p className="text-sm text-muted">A report can be generated once results are authorized.</p>
          ) : canGenerate ? (
            <>
              <Button
                className="w-full"
                loading={busy}
                onClick={() => run(() => reportsApi.generate(orderId, false), 'Report generated')}
              >
                <FileText className="h-4 w-4" aria-hidden />
                Generate final report
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                loading={busy}
                onClick={() => run(() => reportsApi.generate(orderId, true), 'Preliminary report generated')}
              >
                Generate preliminary report
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">Results are authorized — a pathologist can generate the report.</p>
          )}
        </CardBody>
      )}

      {report.data && (
        <DeliverReportModal
          open={deliverOpen}
          onClose={() => setDeliverOpen(false)}
          reportId={report.data.id}
          onDone={done}
        />
      )}
    </Card>
  );
}
