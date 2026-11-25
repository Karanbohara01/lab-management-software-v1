import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  Printer,
  Copy,
  Check,
  Building2,
  User,
  Calendar,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { reportsApi } from './api';
import { ReportDocument } from './ReportDocument';
import { BrandMark } from '@/components/brand/BrandMark';
import { useT, LOCALE_TAG, getLocale } from '@/i18n';
import type { ReportDetail, VerificationResult } from './types';

export function VerifyReportPage() {
  const t = useT();
  const { token } = useParams<{ token: string }>();

  const [copiedHash, setCopiedHash] = useState(false);
  const [showDocument, setShowDocument] = useState(false);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [fullReport, setFullReport] = useState<ReportDetail | null>(null);
  const [documentError, setDocumentError] = useState<string | null>(null);

  const { data, loading, error } = useQuery(
    () => (token ? reportsApi.verify(token) : Promise.resolve(null as unknown as VerificationResult)),
    [token]
  );

  const copyHashToClipboard = async (hash: string) => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopiedHash(true);
      setTimeout(() => setCopiedHash(false), 2000);
    } catch {
      // ignore clipboard error
    }
  };

  const handleToggleDocument = async () => {
    if (showDocument) {
      setShowDocument(false);
      return;
    }

    if (fullReport) {
      setShowDocument(true);
      return;
    }

    if (!token) return;

    setDocumentLoading(true);
    setDocumentError(null);
    try {
      const doc = await reportsApi.getDocumentByToken(token);
      setFullReport(doc);
      setShowDocument(true);
    } catch {
      setDocumentError(t('Unable to load full document details.'));
    } finally {
      setDocumentLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const locale = getLocale();
  const localeTag = LOCALE_TAG[locale] || 'en-US';

  return (
    <div className="min-h-screen bg-surface-muted/60 px-4 py-8 sm:py-12 print:bg-white print:p-0">
      <div className="mx-auto w-full max-w-3xl">
        {/* Header / Brand */}
        <header className="mb-6 flex flex-col items-center gap-3 text-center print:hidden">
          <Link
            to="/"
            aria-label={t('LIMS home')}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BrandMark className="h-12 w-auto" />
          </Link>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">
              {t('Diagnostic Report Verification')}
            </h1>
            <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">
              {t('Official authentication & cryptographic integrity verification')}
            </p>
          </div>
        </header>

        {/* States */}
        {loading && !data ? (
          <div className="rounded-xl border border-border bg-surface p-12 text-center shadow-xs">
            <LoadingState label={t('Verifying report authenticity…')} />
          </div>
        ) : error ? (
          <div className="rounded-xl border border-border bg-surface p-6 shadow-xs">
            <ErrorState message={error} />
          </div>
        ) : !data || !(data.found ?? data.valid) ? (
          <div className="overflow-hidden rounded-2xl border border-destructive/30 bg-surface shadow-md">
            <div className="flex items-center gap-3 border-b border-destructive/20 bg-destructive/10 px-6 py-4 text-destructive">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <div>
                <h2 className="text-base font-semibold">{t('Report Not Verified')}</h2>
                <p className="text-xs opacity-90">{t('No genuine record matches this verification code')}</p>
              </div>
            </div>
            <div className="p-6 text-sm text-muted-foreground">
              <p>
                {t(
                  'The requested document could not be authenticated against the clinical database. This may occur if the QR code is incomplete, expired, or represents an unauthorized copy.'
                )}
              </p>
              <div className="mt-4 rounded-lg bg-surface-muted p-4 text-xs">
                <span className="font-semibold text-foreground">{t('Next steps:')}</span>
                <ul className="mt-1.5 list-disc space-y-1 pl-4 text-muted-foreground">
                  <li>{t('Scan the QR code again ensuring good lighting and focus.')}</li>
                  <li>{t('Contact the issuing laboratory or healthcare facility to confirm result delivery.')}</li>
                  <li>{t('Treat any printed paper claiming this code as unverified.')}</li>
                </ul>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Authenticity Certificate Banner */}
            <div className="overflow-hidden rounded-2xl border border-emerald-500/30 bg-surface shadow-md print:border-none print:shadow-none">
              <div className="flex items-center justify-between border-b border-emerald-500/20 bg-emerald-500/10 px-6 py-4 text-emerald-800 dark:text-emerald-300">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                    <ShieldCheck className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold leading-tight">{t('Verified Genuine Diagnostic Report')}</h2>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-400/80">
                      {t('Officially released by accredited clinical laboratory')}
                    </p>
                  </div>
                </div>
                <Badge tone="success" className="font-semibold tracking-wide">
                  {data.status}
                </Badge>
              </div>

              {/* Lab Identity & Details */}
              <div className="border-b border-border bg-surface-muted/30 p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                      <Building2 className="h-4 w-4 text-primary" />
                      <span>{data.labName || data.laboratoryName || t('Clinical Diagnostic Laboratory')}</span>
                    </div>
                    {(data.labAddress || data.laboratoryAddress) && (
                      <p className="text-xs text-muted-foreground">{data.labAddress || data.laboratoryAddress}</p>
                    )}
                    {(data.labPhone || data.laboratoryPhone || data.labEmail || data.laboratoryEmail) && (
                      <p className="text-xs text-muted-foreground">
                        {[data.labPhone || data.laboratoryPhone, data.labEmail || data.laboratoryEmail].filter(Boolean).join(' · ')}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1 text-left sm:text-right">
                    {data.accreditationNumber && (
                      <div className="text-xs text-muted-foreground">
                        <span>{t('Accreditation Lic. #')}: </span>
                        <span className="font-mono font-medium text-foreground">{data.accreditationNumber}</span>
                      </div>
                    )}
                    {data.panNumber && (
                      <div className="text-xs text-muted-foreground">
                        <span>{t('PAN #')}: </span>
                        <span className="font-mono font-medium text-foreground">{data.panNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Diagnostic Record Metadata */}
              <div className="p-5 sm:p-6">
                <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
                  <div className="rounded-xl border border-border/70 bg-surface-muted/20 p-3.5">
                    <dt className="text-xs font-medium text-muted-foreground">{t('Report Number')}</dt>
                    <dd className="mt-1 flex items-center gap-2 font-mono text-base font-bold text-foreground">
                      <FileText className="h-4 w-4 text-primary" />
                      <span>{data.reportNumber}</span>
                      <span className="text-xs font-normal text-muted-foreground">v{data.reportVersion}</span>
                    </dd>
                    <dd className="mt-1 text-xs text-muted-foreground">
                      {t('Type')}: <span className="font-medium text-foreground">{data.reportType}</span>
                      {data.orderNumber && (
                        <span> · {t('Order')}: <span className="font-mono font-medium text-foreground">{data.orderNumber}</span></span>
                      )}
                    </dd>
                  </div>

                  <div className="rounded-xl border border-border/70 bg-surface-muted/20 p-3.5">
                    <dt className="text-xs font-medium text-muted-foreground">{t('Patient Verification (Masked)')}</dt>
                    <dd className="mt-1 flex items-center gap-2 text-base font-semibold text-foreground">
                      <User className="h-4 w-4 text-primary" />
                      <span>{data.patientNameMasked || data.maskedPatientName || '—'}</span>
                    </dd>
                    <dd className="mt-1 text-xs text-muted-foreground">
                      <span>{t('MRN')}: </span>
                      <span className="font-mono font-medium text-foreground">{data.patientMrn || '—'}</span>
                      {(data.patientGender || data.patientAgeYears != null) && (
                        <span> · {[data.patientGender, data.patientAgeYears != null ? `${data.patientAgeYears} Yrs` : null].filter(Boolean).join(', ')}</span>
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{t('Official Release Date')}</dt>
                    <dd className="mt-1 flex items-center gap-1.5 text-xs text-foreground sm:text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {data.releasedAt
                          ? new Date(data.releasedAt).toLocaleString(localeTag, {
                              dateStyle: 'medium',
                              timeStyle: 'short',
                            })
                          : '—'}
                      </span>
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium text-muted-foreground">{t('Authorized Signatory')}</dt>
                    <dd className="mt-1 text-xs text-foreground sm:text-sm font-medium">
                      {data.signedBy || '—'}
                      {data.signerCredentials && (
                        <div className="text-xs font-normal text-muted-foreground">{data.signerCredentials}</div>
                      )}
                    </dd>
                  </div>
                </dl>

                {/* Tests List */}
                {data.testNames && data.testNames.length > 0 && (
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="mb-2 text-xs font-medium text-muted-foreground">{t('Tests Included')}</div>
                    <div className="flex flex-wrap gap-1.5">
                      {data.testNames.map((testName, i) => (
                        <span
                          key={i}
                          className="inline-flex items-center rounded-md border border-border bg-surface-muted/60 px-2.5 py-1 text-xs font-medium text-foreground"
                        >
                          {testName}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tamper-Evident SHA-256 Hash */}
                {data.contentHash && (
                  <div className="mt-5 border-t border-border pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-muted-foreground">{t('Cryptographic Seal (SHA-256)')}</span>
                      <button
                        type="button"
                        onClick={() => copyHashToClipboard(data.contentHash!)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        title={t('Copy cryptographic hash')}
                      >
                        {copiedHash ? (
                          <>
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                            <span className="text-emerald-600">{t('Copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3.5 w-3.5" />
                            <span>{t('Copy seal')}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="mt-1.5 break-all rounded-lg border border-border bg-surface-muted/40 p-2.5 font-mono text-xs text-muted-foreground">
                      {data.contentHash}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-col gap-2.5 border-t border-border bg-surface-muted/20 p-4 sm:flex-row sm:items-center sm:justify-end print:hidden">
                <Button
                  variant="secondary"
                  onClick={handleToggleDocument}
                  loading={documentLoading}
                >
                  {showDocument ? (
                    <>
                      <EyeOff className="h-4 w-4" />
                      <span>{t('Hide Full Document')}</span>
                    </>
                  ) : (
                    <>
                      <Eye className="h-4 w-4" />
                      <span>{t('View Diagnostic Document')}</span>
                    </>
                  )}
                </Button>

                <Button onClick={handlePrint}>
                  <Printer className="h-4 w-4" />
                  <span>{t('Print / Save PDF')}</span>
                </Button>
              </div>
            </div>

            {/* Error loading full document */}
            {documentError && (
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 text-xs text-destructive">
                {documentError}
              </div>
            )}

            {/* Full Diagnostic Document Preview */}
            {showDocument && fullReport && (
              <div className="overflow-hidden rounded-2xl border border-border bg-surface shadow-xl">
                <div className="flex items-center justify-between border-b border-border bg-surface-muted/40 px-6 py-3 print:hidden">
                  <div className="text-xs font-medium text-muted-foreground">
                    {t('Official Diagnostic Report Preview')}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => setShowDocument(false)}>
                    {t('Close')}
                  </Button>
                </div>
                <div className="p-4 sm:p-8">
                  <ReportDocument report={fullReport} />
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
