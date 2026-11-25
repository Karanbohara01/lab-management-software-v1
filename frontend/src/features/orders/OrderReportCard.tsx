import { useState } from 'react';
import { FileText, Eye } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/PageState';
import { LinkFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { reportsApi } from '@/features/reports/api';
import { REPORT_STATUS_TONE, type ReportDetail, type ReportStatus } from '@/features/reports/types';
import { ReportPreviewModal } from '@/features/reports/ReportPreviewModal';
import { ReportGenerationModal } from '@/features/reports/ReportGenerationModal';
import { useT } from '@/i18n';

/** ReportStatus has no shared label map (just a tone map) — the raw value doubles as the label. */
const REPORT_STATUS_LABEL: Record<ReportStatus, string> = {
  GENERATED: 'Generated',
  RELEASED: 'Released',
  DELIVERED: 'Delivered',
};

export function OrderReportCard({
  orderId,
  report,
  loading,
  hasApprovedResults,
  onChange,
  onDeliver,
}: {
  orderId: number;
  /** Already fetched by the parent (OrderDetailPage) — this card never re-fetches it itself, to avoid a duplicate GET /reports/by-order/{id} (and a 404 in the console) on every order-detail page load. */
  report: ReportDetail | null;
  loading: boolean;
  hasApprovedResults: boolean;
  onChange: () => void;
  /** Opens the one DeliverReportModal the parent owns — the workflow bar's own "Deliver report"
   * action triggers the exact same modal, so there's only one delivery path, not two. */
  onDeliver: () => void;
}) {
  const t = useT();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canGenerate = hasPermission(PERMISSIONS.REPORT_GENERATE);
  const canDeliver = hasPermission(PERMISSIONS.REPORT_DELIVER);
  const [busy, setBusy] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [generateConfig, setGenerateConfig] = useState<{ preliminary: boolean } | null>(null);

  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(ok);
      onChange();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Action failed'));
    } finally {
      setBusy(false);
    }
  };

  const release = () => {
    const creds = window.prompt(t('Signing credentials (e.g. "MD Pathology, NMC-12345"):'), '');
    if (creds === null) return;
    run(() => reportsApi.release(report!.id, creds.trim() || undefined), t('Report signed & released'));
  };

  return (
    <Card>
      <CardHeader title={t('Report')} />
      {loading ? (
        <LoadingState />
      ) : report ? (
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">{report.reportNumber}</span>
            <Badge tone={REPORT_STATUS_TONE[report.status]}>{t(REPORT_STATUS_LABEL[report.status])}</Badge>
          </div>
          {report.status === 'GENERATED' && canGenerate && (
            <Button className="w-full" loading={busy} onClick={release}>
              {t('Sign & release')}
            </Button>
          )}
          {report.status === 'RELEASED' && canDeliver && (
            <Button className="w-full" onClick={onDeliver}>
              {t('Deliver report')}
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="secondary" className="flex-1" onClick={() => setPreviewOpen(true)}>
              <Eye className="h-4 w-4" aria-hidden />
              {t('Preview')}
            </Button>
            <LinkFrom to={`/app/reports/${report.id}`} className="flex-1">
              <Button variant="ghost" className="w-full">
                <FileText className="h-4 w-4" aria-hidden />
                {t('Open')}
              </Button>
            </LinkFrom>
            {canGenerate && report.status === 'GENERATED' && (
              <Button
                variant="ghost"
                disabled={busy}
                onClick={() => setGenerateConfig({ preliminary: false })}
              >
                {t('Regenerate')}
              </Button>
            )}
          </div>
          {previewOpen && (
            <ReportPreviewModal
              open={previewOpen}
              onClose={() => setPreviewOpen(false)}
              report={report}
              onUpdated={onChange}
            />
          )}
        </CardBody>
      ) : (
        <CardBody className="space-y-2">
          {!hasApprovedResults ? (
            <p className="text-sm text-muted">{t('A report can be generated once results are approved.')}</p>
          ) : canGenerate ? (
            <>
              <Button
                className="w-full"
                disabled={busy}
                onClick={() => setGenerateConfig({ preliminary: false })}
              >
                <FileText className="h-4 w-4" aria-hidden />
                {t('Generate final report')}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                disabled={busy}
                onClick={() => setGenerateConfig({ preliminary: true })}
              >
                {t('Generate preliminary report')}
              </Button>
            </>
          ) : (
            <p className="text-sm text-muted">{t('Results are approved — a pathologist can generate the report.')}</p>
          )}
        </CardBody>
      )}

      {generateConfig && (
        <ReportGenerationModal
          open={!!generateConfig}
          orderId={orderId}
          preliminary={generateConfig.preliminary}
          onClose={() => setGenerateConfig(null)}
          onSuccess={() => {
            setGenerateConfig(null);
            onChange();
          }}
        />
      )}
    </Card>
  );
}
