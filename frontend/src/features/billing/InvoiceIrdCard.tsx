import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ScrollText } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { irdApi } from '@/features/ird/api';
import { IRD_STATUS_LABEL, IRD_STATUS_TONE } from '@/features/ird/types';

export function InvoiceIrdCard({ invoiceId }: { invoiceId: number }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canManage = hasPermission(PERMISSIONS.IRD_SUBMISSION_MANAGE);
  const [busy, setBusy] = useState(false);

  const config = useQuery(() => irdApi.config(), []);
  const sub = useQuery(
    () =>
      irdApi
        .getByInvoice(invoiceId)
        .catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))),
    [invoiceId],
  );

  const submit = async () => {
    setBusy(true);
    try {
      const updated = await irdApi.submit(invoiceId);
      toast.success('Submission attempted');
      navigate(`/app/ird/${updated.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to submit');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader title="IRD / e-Billing" />
      {sub.loading ? (
        <LoadingState />
      ) : !sub.data ? (
        <CardBody>
          <p className="text-sm text-muted">Available once the invoice is issued.</p>
        </CardBody>
      ) : (
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="flex gap-1.5">
              <Badge tone={IRD_STATUS_TONE[sub.data.status]}>{IRD_STATUS_LABEL[sub.data.status]}</Badge>
              {sub.data.manual && <Badge tone="neutral">Manual</Badge>}
            </span>
            <Link to={`/app/ird/${sub.data.id}`} className="text-sm text-primary">
              Details
            </Link>
          </div>
          {config.data && !config.data.enabled && (
            <p className="text-xs text-muted">
              Electronic submission is not configured — no data is transmitted. Bills can be recorded
              as filed manually.
            </p>
          )}
          {canManage && (sub.data.status === 'NOT_SUBMITTED' || sub.data.status === 'FAILED') && (
            <Button variant="secondary" className="w-full" loading={busy} onClick={submit}>
              <ScrollText className="h-4 w-4" aria-hidden />
              {sub.data.status === 'FAILED' ? 'Retry submission' : 'Submit to IRD'}
            </Button>
          )}
        </CardBody>
      )}
    </Card>
  );
}
