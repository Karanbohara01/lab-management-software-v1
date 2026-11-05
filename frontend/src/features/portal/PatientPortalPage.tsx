import { Link, useParams } from 'react-router-dom';
import { FileText, Receipt } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';
import { portalApi } from './api';
import { BrandMark } from '@/components/brand/BrandMark';

const REPORT_STATUS_TONE: Record<string, 'neutral' | 'info' | 'success'> = {
  GENERATED: 'neutral',
  RELEASED: 'info',
  DELIVERED: 'success',
};

const REPORT_STATUS_LABEL: Record<string, string> = {
  GENERATED: 'Generated',
  RELEASED: 'Released',
  DELIVERED: 'Delivered',
};

const INVOICE_STATUS_TONE: Record<string, 'neutral' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  ISSUED: 'success',
  CANCELLED: 'danger',
};

const INVOICE_STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft',
  ISSUED: 'Issued',
  CANCELLED: 'Cancelled',
};

/**
 * Public, unauthenticated landing page for a patient's self-service portal link — a real patient
 * has no LIMS login, so this is a standalone top-level route (not nested under `/app`), the same
 * reasoning as VerifyReportPage. Only ever shows what the backend already filtered to be
 * patient-safe (released reports, non-draft invoices) — nothing here re-filters or trusts client
 * state for that; the token itself scopes everything.
 */
export function PatientPortalPage() {
  const t = useT();
  const { token } = useParams<{ token: string }>();
  const { data, loading, error } = useQuery(() => portalApi.summary(token!), [token]);

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label={t('LIMS home')}
            className="rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <BrandMark className="h-14" />
          </Link>
          <div>
            <h1 className="text-heading-3 text-foreground">{t('Your lab records')}</h1>
            {data && (
              <p className="mt-1 text-caption text-muted">
                {data.patientName} · <span className="font-mono">{data.patientMrn}</span>
              </p>
            )}
          </div>
        </div>

        {loading && !data ? (
          <LoadingState label={t('Loading…')} />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data ? null : (
          <div className="space-y-4">
            <Card>
              <CardBody>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4" aria-hidden />
                  {t('Reports')}
                </h2>
                {data.reports.length === 0 ? (
                  <p className="text-sm text-muted">{t('No reports available yet.')}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.reports.map((r) => (
                      <li key={r.id}>
                        <Link
                          to={`/portal/${token}/reports/${r.id}`}
                          className="flex items-center justify-between gap-3 py-2.5 text-sm hover:underline"
                        >
                          <span>
                            <span className="font-medium text-foreground">{r.reportNumber}</span>{' '}
                            <span className="text-muted">
                              {r.releasedAt ? new Date(r.releasedAt).toLocaleDateString(LOCALE_TAG[getLocale()]) : ''}
                            </span>
                          </span>
                          <Badge tone={REPORT_STATUS_TONE[r.status] ?? 'neutral'}>{t(REPORT_STATUS_LABEL[r.status] ?? r.status)}</Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardBody>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Receipt className="h-4 w-4" aria-hidden />
                  {t('Invoices')}
                </h2>
                {data.invoices.length === 0 ? (
                  <p className="text-sm text-muted">{t('No invoices yet.')}</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {data.invoices.map((i) => (
                      <li key={i.id}>
                        <Link
                          to={`/portal/${token}/invoices/${i.id}`}
                          className="flex items-center justify-between gap-3 py-2.5 text-sm hover:underline"
                        >
                          <span>
                            <span className="font-medium text-foreground">{i.invoiceNumber ?? '—'}</span>{' '}
                            <span className="text-muted">{formatMoney(i.totalAmount)}</span>
                          </span>
                          <Badge tone={INVOICE_STATUS_TONE[i.status] ?? 'neutral'}>
                            {i.status === 'ISSUED' && i.balance > 0
                              ? t('Due {amount}', { amount: formatMoney(i.balance) })
                              : t(INVOICE_STATUS_LABEL[i.status] ?? i.status)}
                          </Badge>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
