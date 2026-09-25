import { Link, useParams } from 'react-router-dom';
import { Microscope, FileText, Receipt } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { portalApi } from './api';

const REPORT_STATUS_TONE: Record<string, 'neutral' | 'info' | 'success'> = {
  GENERATED: 'neutral',
  RELEASED: 'info',
  DELIVERED: 'success',
};

const INVOICE_STATUS_TONE: Record<string, 'neutral' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  ISSUED: 'success',
  CANCELLED: 'danger',
};

/**
 * Public, unauthenticated landing page for a patient's self-service portal link — a real patient
 * has no LabOS login, so this is a standalone top-level route (not nested under `/app`), the same
 * reasoning as VerifyReportPage. Only ever shows what the backend already filtered to be
 * patient-safe (released reports, non-draft invoices) — nothing here re-filters or trusts client
 * state for that; the token itself scopes everything.
 */
export function PatientPortalPage() {
  const { token } = useParams<{ token: string }>();
  const { data, loading, error } = useQuery(() => portalApi.summary(token!), [token]);

  return (
    <div className="min-h-screen bg-surface-muted px-4 py-12">
      <div className="mx-auto w-full max-w-2xl">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label="LabOS home"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Microscope className="h-6 w-6" aria-hidden />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Your lab records</h1>
            {data && (
              <p className="mt-1 text-sm text-muted">
                {data.patientName} · <span className="font-mono">{data.patientMrn}</span>
              </p>
            )}
          </div>
        </div>

        {loading && !data ? (
          <LoadingState label="Loading…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data ? null : (
          <div className="space-y-4">
            <Card>
              <CardBody>
                <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <FileText className="h-4 w-4" aria-hidden />
                  Reports
                </h2>
                {data.reports.length === 0 ? (
                  <p className="text-sm text-muted">No reports available yet.</p>
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
                              {r.releasedAt ? new Date(r.releasedAt).toLocaleDateString() : ''}
                            </span>
                          </span>
                          <Badge tone={REPORT_STATUS_TONE[r.status] ?? 'neutral'}>{r.status}</Badge>
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
                  Invoices
                </h2>
                {data.invoices.length === 0 ? (
                  <p className="text-sm text-muted">No invoices yet.</p>
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
                            {i.status === 'ISSUED' && i.balance > 0 ? `Due ${formatMoney(i.balance)}` : i.status}
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
