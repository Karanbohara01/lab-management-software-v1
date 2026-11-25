import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, CheckCircle2, AlertCircle, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { isTestEnv, SPRING_SMOOTH } from '@/components/ui/motion';
import { useT } from '@/i18n';
import { reportsApi } from './api';
import type { ReportDetail } from './types';

export interface ReportGenerationModalProps {
  open: boolean;
  orderId: number;
  preliminary?: boolean;
  orderNumber?: string;
  patientName?: string;
  onClose: () => void;
  onSuccess?: (report: ReportDetail) => void;
}

export function ReportGenerationModal({
  open,
  orderId,
  preliminary = false,
  orderNumber,
  patientName,
  onClose,
  onSuccess,
}: ReportGenerationModalProps) {
  const t = useT();
  const toast = useToast();
  const navigate = useNavigate();

  const [report, setReport] = useState<ReportDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'generating' | 'completed' | 'error'>('generating');

  const hasTriggeredRef = useRef(false);
  const inFlightRef = useRef(false);

  const startGeneration = async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;

    setStatus('generating');
    setError(null);
    setReport(null);

    const testMode = isTestEnv();
    const promise = reportsApi.generate(orderId, preliminary);

    if (testMode) {
      try {
        const res = await promise;
        setReport(res);
        setStatus('completed');
        onSuccess?.(res);
      } catch (err) {
        const msg = err instanceof ApiError ? err.message : 'Failed to generate report';
        setError(msg);
        setStatus('error');
      } finally {
        inFlightRef.current = false;
      }
      return;
    }

    try {
      const res = await promise;
      // Brief smooth transition so the state change feels natural
      await new Promise((r) => setTimeout(r, 400));
      setReport(res);
      setStatus('completed');
      toast.success(
        preliminary ? t('Preliminary report generated') : t('Report generated successfully')
      );
      onSuccess?.(res);
    } catch (err) {
      // Graceful check: verify if the report was already generated in the database
      try {
        const existing = await reportsApi.getByOrder(orderId);
        if (existing && existing.id) {
          setReport(existing);
          setStatus('completed');
          toast.success(
            preliminary ? t('Preliminary report generated') : t('Report generated successfully')
          );
          onSuccess?.(existing);
          return;
        }
      } catch {
        // ignore fallback error and display original error
      }

      const msg = err instanceof ApiError ? err.message : t('Failed to generate report');
      setError(msg);
      setStatus('error');
    } finally {
      inFlightRef.current = false;
    }
  };

  useEffect(() => {
    if (open && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      startGeneration();
    }
    if (!open) {
      hasTriggeredRef.current = false;
    }
  }, [open, orderId, preliminary]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
    >
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/70 backdrop-blur-xs transition-opacity"
        onClick={status === 'completed' || status === 'error' ? onClose : undefined}
      />

      {/* Modal Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={SPRING_SMOOTH}
        className="relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-xl"
      >
        {/* Close Button when done or error */}
        {(status === 'completed' || status === 'error') && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="absolute right-4 top-4 rounded-md p-1.5 text-muted-foreground hover:bg-surface-muted hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {/* Generating State */}
        {status === 'generating' && (
          <div className="text-center py-4">
            <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
              <svg className="h-16 w-16 animate-spin text-primary" viewBox="0 0 50 50">
                <circle
                  className="text-border/60"
                  strokeWidth="3.5"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="25"
                  cy="25"
                />
                <circle
                  className="text-primary"
                  strokeWidth="3.5"
                  strokeDasharray="75, 200"
                  strokeDashoffset="0"
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  r="20"
                  cx="25"
                  cy="25"
                />
              </svg>
              <FileText className="absolute h-6 w-6 text-primary" />
            </div>

            <h2 id="report-modal-title" className="text-base font-semibold text-foreground">
              {preliminary ? t('Generating Preliminary Report…') : t('Generating Diagnostic Report…')}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {patientName && orderNumber
                ? `${patientName} · Order ${orderNumber}`
                : orderNumber
                  ? `Order ${orderNumber}`
                  : t('Compiling verified results and clinical reference ranges')}
            </p>
          </div>
        )}

        {/* Completed State */}
        {status === 'completed' && report && (
          <div className="py-2">
            <div className="mb-4 text-center">
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 id="report-modal-title" className="text-lg font-semibold text-foreground">
                {t('Report Ready')}
              </h2>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {patientName && orderNumber
                  ? `${patientName} · Order ${orderNumber}`
                  : orderNumber
                    ? `Order ${orderNumber}`
                    : t('Diagnostic report compiled')}
              </p>
            </div>

            {/* Clean Metadata Summary */}
            <div className="mb-5 rounded-xl border border-border/70 bg-surface-muted/30 p-3.5 text-center">
              <div className="text-xs text-muted-foreground">Report Number</div>
              <div className="mt-0.5 font-mono text-base font-bold text-foreground">
                {report.reportNumber}
              </div>
              <div className="mt-2 flex items-center justify-center gap-2">
                <Badge tone="success">{report.status}</Badge>
                {report.reportType === 'PRELIMINARY' && (
                  <Badge tone="warning">Preliminary</Badge>
                )}
                {report.tests && report.tests.length > 0 && (
                  <span className="text-xs text-muted-foreground">
                    · {report.tests.length} {report.tests.length === 1 ? 'test' : 'tests'}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  onClose();
                  navigate(`/app/reports/${report.id}`);
                }}
              >
                <FileText className="h-4 w-4" />
                <span>{t('View Report')}</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('Done')}
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {status === 'error' && (
          <div className="py-2">
            <div className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-3.5 text-destructive">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-xs sm:text-sm">
                <div className="font-semibold">{t('Could not generate report')}</div>
                <p className="mt-1 opacity-90">{error}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                className="flex-1"
                onClick={() => {
                  inFlightRef.current = false;
                  startGeneration();
                }}
              >
                {t('Try Again')}
              </Button>
              <Button variant="secondary" onClick={onClose}>
                {t('Cancel')}
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
