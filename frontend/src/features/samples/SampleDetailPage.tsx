import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, CheckCircle2, PackageCheck, Printer, RefreshCw } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Alert } from '@/components/ui/Alert';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { SPECIMEN_LABELS } from '@/features/catalog/types';
import { samplesApi } from './api';
import { ReceiveSampleModal } from './ReceiveSampleModal';
import { SAMPLE_STATUS_LABEL, SAMPLE_STATUS_TONE } from './types';
import { BarcodeLabel } from './BarcodeLabel';
import { SampleTimeline } from './SampleTimeline';
import { CollectSampleModal } from './CollectSampleModal';
import { SampleResultsCard } from './SampleResultsCard';

export function SampleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const toast = useToast();
  const { hasPermission } = useAuth();

  const [collectOpen, setCollectOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [recollectOpen, setRecollectOpen] = useState(false);

  const { data: sample, loading, error, refetch } = useQuery(() => samplesApi.get(Number(id)), [id]);

  if (loading && !sample) return <LoadingState label="Loading sample…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!sample) return null;

  const canCollect = hasPermission(PERMISSIONS.SAMPLE_COLLECT);
  const canReceive = hasPermission(PERMISSIONS.SAMPLE_RECEIVE);
  const canReject = hasPermission(PERMISSIONS.SAMPLE_REJECT);


  const doReject = async (reason: string) => {
    try {
      await samplesApi.reject(sample.id, reason);
      toast.success('Sample rejected');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to reject sample');
      throw err;
    }
  };

  const doRecollect = async (note: string) => {
    try {
      await samplesApi.recollect(sample.id, note || undefined);
      toast.success('Recollection requested');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to request recollection');
      throw err;
    }
  };

  const printLabel = () => window.open(`/app/samples/${sample.id}/label`, '_blank', 'noopener');

  return (
    <>
      <Link
        to={`/app/orders/${sample.orderId}`}
        className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden />
        Order {sample.orderNumber}
      </Link>

      <PageHeader
        title={sample.accessionNumber}
        description={`${sample.patientName} · ${sample.patientMrn} · ${SPECIMEN_LABELS[sample.specimenType]}`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={SAMPLE_STATUS_TONE[sample.status]}>{SAMPLE_STATUS_LABEL[sample.status]}</Badge>
            <Button variant="secondary" onClick={printLabel}>
              <Printer className="h-4 w-4" aria-hidden />
              Print label
            </Button>
            {canCollect && sample.status === 'AWAITING_COLLECTION' && (
              <Button onClick={() => setCollectOpen(true)}>
                <PackageCheck className="h-4 w-4" aria-hidden />
                Collect
              </Button>
            )}
            {canReceive && sample.status === 'COLLECTED' && (
              <Button onClick={() => setReceiveOpen(true)}>
                <CheckCircle2 className="h-4 w-4" aria-hidden />
                Receive
              </Button>
            )}
            {canReject && (sample.status === 'COLLECTED' || sample.status === 'RECEIVED') && (
              <Button variant="danger" onClick={() => setRejectOpen(true)}>
                <Ban className="h-4 w-4" aria-hidden />
                Reject
              </Button>
            )}
            {canReject && sample.status === 'REJECTED' && (
              <Button onClick={() => setRecollectOpen(true)}>
                <RefreshCw className="h-4 w-4" aria-hidden />
                Request recollection
              </Button>
            )}
          </div>
        }
      />

      {sample.status === 'REJECTED' && (
        <div className="mb-4">
          <Alert tone="danger" title="Sample rejected">
            {sample.rejectionReason} · by {sample.rejectedBy}
          </Alert>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader title="Tests on this sample" description={`${sample.items.length} test(s)`} />
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-5 py-2">Test</th>
                    <th className="px-5 py-2">Department</th>
                  </tr>
                </thead>
                <tbody>
                  {sample.items.map((item) => (
                    <tr key={item.id} className="border-b border-border last:border-0">
                      <td className="px-5 py-2">
                        <span className="font-medium text-foreground">{item.testName}</span>
                        <span className="ml-2 font-mono text-xs text-muted">{item.testCode}</span>
                      </td>
                      <td className="px-5 py-2 text-muted">{item.departmentName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {(sample.status === 'RECEIVED' || sample.status === 'REJECTED') && (
            <SampleResultsCard sampleId={sample.id} />
          )}

          <Card>
            <CardHeader title="Tracking timeline" />
            <CardBody>
              <SampleTimeline events={sample.events} />
            </CardBody>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader title="Label" />
            <CardBody>
              <BarcodeLabel
                value={sample.barcodeValue}
                patientName={sample.patientName}
                patientMrn={sample.patientMrn}
                specimen={SPECIMEN_LABELS[sample.specimenType]}
                container={sample.container}
              />
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Collection" />
            <CardBody className="space-y-2 text-sm">
              <Row label="Container" value={sample.container} />
              <Row label="Collection site" value={sample.collectionSite} />
              <Row label="Collected" value={fmt(sample.collectedAt, sample.collectedBy)} />
              <Row label="Received" value={fmt(sample.receivedAt, sample.receivedBy)} />
            </CardBody>
          </Card>
        </div>
      </div>

      <CollectSampleModal open={collectOpen} onClose={() => setCollectOpen(false)} sample={sample} onDone={refetch} />
      <ReceiveSampleModal
        open={receiveOpen}
        onClose={() => setReceiveOpen(false)}
        sampleId={sample.id}
        accession={sample.accessionNumber}
        onReceived={refetch}
      />
      <ConfirmDialog
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        onConfirm={doReject}
        title="Reject this sample?"
        message="The sample will be marked rejected. A recollection can be requested afterwards."
        confirmLabel="Reject sample"
        tone="danger"
        reason="required"
      />
      <ConfirmDialog
        open={recollectOpen}
        onClose={() => setRecollectOpen(false)}
        onConfirm={doRecollect}
        title="Request recollection?"
        message="This reopens the sample for collection with the same accession number."
        confirmLabel="Request recollection"
        reason="optional"
      />
    </>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted">{label}</span>
      <span className="text-right text-foreground">{value || '—'}</span>
    </div>
  );
}

function fmt(iso: string | null, by: string | null): string | null {
  if (!iso) return null;
  return `${new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}${by ? ` · ${by}` : ''}`;
}
