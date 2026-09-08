import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/PageHeader';
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

export function VerifyReportPage() {
  const { token } = useParams<{ token: string }>();
  const { data, loading, error } = useQuery(() => reportsApi.verify(token!) as Promise<Verification>, [token]);

  if (loading && !data) return <LoadingState label="Checking…" />;
  if (error) return <ErrorState message={error} />;
  if (!data) return null;

  return (
    <div className="mx-auto max-w-lg">
      <PageHeader title="Report verification" />
      {!data.found ? (
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
  );
}
