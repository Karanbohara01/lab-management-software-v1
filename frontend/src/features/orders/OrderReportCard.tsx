import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export function OrderReportCard({ orderId }: { orderId: number }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canGenerate = hasPermission(PERMISSIONS.REPORT_GENERATE);
  const [busy, setBusy] = useState(false);

  const report = useQuery(
    () => reportsApi.getByOrder(orderId).catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))),
    [orderId],
  );
  const approved = useQuery(
    () => resultsApi.list({ orderId, status: 'APPROVED', size: 1 }),
    [orderId],
  );

  const generate = async (preliminary = false) => {
    setBusy(true);
    try {
      const created = await reportsApi.generate(orderId, preliminary);
      toast.success(`${preliminary ? 'Preliminary report' : 'Report'} ${created.reportNumber} generated`);
      navigate(`/app/reports/${created.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to generate report');
    } finally {
      setBusy(false);
    }
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
          <div className="flex gap-2">
            <Link to={`/app/reports/${report.data.id}`} className="flex-1">
              <Button variant="secondary" className="w-full">
                <FileText className="h-4 w-4" aria-hidden />
                Open report
              </Button>
            </Link>
            {canGenerate && (
              <Button variant="ghost" onClick={() => generate(false)} loading={busy}>
                Regenerate
              </Button>
            )}
          </div>
        </CardBody>
      ) : (
        <CardBody className="space-y-2">
          {(approved.data?.totalElements ?? 0) === 0 ? (
            <p className="text-sm text-muted">A report can be generated once results are approved.</p>
          ) : canGenerate ? (
            <>
              <Button onClick={() => generate(false)} loading={busy} className="w-full">
                <FileText className="h-4 w-4" aria-hidden />
                Generate final report
              </Button>
              <Button variant="secondary" onClick={() => generate(true)} loading={busy} className="w-full">
                Generate preliminary report
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">Results are approved — a pathologist can generate the report.</p>
          )}
        </CardBody>
      )}
    </Card>
  );
}
