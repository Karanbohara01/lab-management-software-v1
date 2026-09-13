import { useParams, Link } from 'react-router-dom';
import { Microscope } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { reportsApi } from './api';

interface Verification {
  found: boolean;
  reportNumber: string | null;
  reportVersion: number;
  reportType: string | null;
  status: string | null;
  patientMrn: string | null;
  generatedAt: string | null;
  releasedAt: string | null;
  signedBy: string | null;
  signerCredentials: string | null;
  signedAt: string | null;
  contentHash: string | null;
}

/**
 * Public, unauthenticated — the page a patient lands on from the verification link printed on
 * their report or sent by SMS/WhatsApp. Deliberately a standalone top-level route (not nested
 * under the authenticated `/app` shell, which it was mistakenly nested under before): a real
 * patient has no LabOS login, so nesting it behind `ProtectedRoute` meant every such link actually
 * sent to a patient redirected straight to the login page — confirmed as a real, live bug (the
 * matching backend endpoint was already correctly public) and fixed by moving this route out.
 */
export function VerifyReportPage() {
  const { token } = useParams<{ token: string }>();
  const { data, loading, error } = useQuery(() => reportsApi.verify(token!) as Promise<Verification>, [token]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-muted px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <Link
            to="/"
            aria-label="LabOS home"
            className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <Microscope className="h-6 w-6" aria-hidden />
          </Link>
          <div>
            <h1 className="text-xl font-semibold text-foreground">Report verification</h1>
            <p className="mt-1 text-sm text-muted">Confirm this report's authenticity.</p>
          </div>
        </div>

        {loading && !data ? (
          <LoadingState label="Checking…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : !data ? null : !data.found ? (
          <Card>
            <CardBody>
              <Badge tone="danger">Not found</Badge>
              <p className="mt-2 text-sm text-muted">
                No report matches this verification code. Treat the document as unverified.
              </p>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="space-y-2 text-sm">
              <Badge tone="success">Genuine LabOS report</Badge>
              <dl className="mt-2 grid grid-cols-2 gap-2">
                <dt className="text-muted">Report</dt>
                <dd className="font-mono">
                  {data.reportNumber} · v{data.reportVersion} · {data.reportType}
                </dd>
                <dt className="text-muted">Status</dt>
                <dd>{data.status}</dd>
                <dt className="text-muted">Patient MRN</dt>
                <dd className="font-mono">{data.patientMrn}</dd>
                <dt className="text-muted">Released</dt>
                <dd>{data.releasedAt ? new Date(data.releasedAt).toLocaleString() : '—'}</dd>
                <dt className="text-muted">Signed by</dt>
                <dd>
                  {data.signedBy ?? '—'}
                  {data.signerCredentials ? `, ${data.signerCredentials}` : ''}
                </dd>
                <dt className="text-muted">Content hash</dt>
                <dd className="break-all font-mono text-xs">{data.contentHash}</dd>
              </dl>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}
