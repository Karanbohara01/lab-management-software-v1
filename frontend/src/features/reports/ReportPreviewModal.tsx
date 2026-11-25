import { useState } from 'react';
import { Printer, ShieldCheck, ExternalLink } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LinkFrom } from '@/lib/navigation';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { reportsApi } from './api';
import { ReportDocument } from './ReportDocument';
import { REPORT_STATUS_TONE, type ReportDetail } from './types';
import { useT } from '@/i18n';

interface ReportPreviewModalProps {
  open: boolean;
  onClose: () => void;
  report: ReportDetail;
  onUpdated?: () => void;
}

export function ReportPreviewModal({
  open,
  onClose,
  report,
  onUpdated,
}: ReportPreviewModalProps) {
  const t = useT();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canGenerate = hasPermission(PERMISSIONS.REPORT_GENERATE);
  const [signing, setSigning] = useState(false);

  const handlePrint = () => {
    window.print();
  };

  const handleSignAndRelease = async () => {
    const cred = window.prompt(
      t('Signing credentials (e.g. MBBS, MD Pathology, NMC 12345) — optional:'),
      ''
    );
    if (cred === null) return;
    setSigning(true);
    try {
      await reportsApi.release(report.id, cred.trim() || undefined);
      toast.success(t('Report signed and released'));
      onUpdated?.();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Unable to sign report'));
    } finally {
      setSigning(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Report Preview · {number}', { number: report.reportNumber })}
      description={t('{patient} · Order {order}', {
        patient: report.patientName,
        order: report.orderNumber,
      })}
      size="xl"
      footer={
        <div className="flex w-full items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge tone={REPORT_STATUS_TONE[report.status]}>{report.status}</Badge>
            {report.reportType === 'PRELIMINARY' && (
              <Badge tone="warning">{t('Preliminary')}</Badge>
            )}
            <LinkFrom
              to={`/app/reports/${report.id}`}
              className="flex items-center gap-1 text-xs text-muted hover:underline"
              onClick={onClose}
            >
              <ExternalLink className="h-3 w-3" aria-hidden />
              {t('Dedicated View')}
            </LinkFrom>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('Close')}
            </Button>
            <Button variant="secondary" onClick={handlePrint}>
              <Printer className="h-4 w-4" aria-hidden />
              {t('Print')}
            </Button>
            {report.status === 'GENERATED' && canGenerate && (
              <Button loading={signing} onClick={handleSignAndRelease}>
                <ShieldCheck className="h-4 w-4" aria-hidden />
                {t('Sign & Release')}
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="max-h-[75vh] overflow-y-auto rounded-lg border border-border bg-neutral-100 p-4 dark:bg-neutral-900">
        <div className="mx-auto max-w-4xl rounded-md bg-white p-6 shadow-md text-neutral-900 print:shadow-none print:p-0">
          <ReportDocument report={report} />
        </div>
      </div>
    </Modal>
  );
}
