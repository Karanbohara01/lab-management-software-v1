import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Receipt } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatMoney } from '@/lib/money';
import { invoicesApi } from '@/features/billing/api';
import { INVOICE_STATUS_TONE, PAYMENT_STATUS_TONE } from '@/features/billing/types';

export function OrderInvoiceCard({ orderId }: { orderId: number }) {
  const navigate = useNavigate();
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVOICE_WRITE);
  const [busy, setBusy] = useState(false);

  const invoice = useQuery(
    () =>
      invoicesApi
        .getByOrder(orderId)
        .catch((e) => (e instanceof ApiError && e.status === 404 ? null : Promise.reject(e))),
    [orderId],
  );

  const create = async () => {
    setBusy(true);
    try {
      const created = await invoicesApi.create(orderId);
      toast.success('Draft invoice created');
      navigate(`/app/invoices/${created.id}`);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to create invoice');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Card>
      <CardHeader title="Invoice" />
      {invoice.loading ? (
        <LoadingState />
      ) : invoice.data ? (
        <CardBody className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-sm">{invoice.data.invoiceNumber ?? 'Draft'}</span>
            <span className="flex gap-1.5">
              <Badge tone={INVOICE_STATUS_TONE[invoice.data.status]}>{invoice.data.status}</Badge>
              {invoice.data.status === 'ISSUED' && (
                <Badge tone={PAYMENT_STATUS_TONE[invoice.data.paymentStatus]}>{invoice.data.paymentStatus}</Badge>
              )}
            </span>
          </div>
          <p className="text-sm text-muted">
            Total {formatMoney(invoice.data.totalAmount)} · Balance{' '}
            <span className="font-medium text-foreground">{formatMoney(invoice.data.balance)}</span>
          </p>
          <Link to={`/app/invoices/${invoice.data.id}`}>
            <Button variant="secondary" className="w-full">
              <Receipt className="h-4 w-4" aria-hidden />
              Open invoice
            </Button>
          </Link>
        </CardBody>
      ) : (
        <CardBody>
          {canWrite ? (
            <Button onClick={create} loading={busy} className="w-full">
              <Receipt className="h-4 w-4" aria-hidden />
              Create invoice
            </Button>
          ) : (
            <p className="text-sm text-muted">No invoice raised yet.</p>
          )}
        </CardBody>
      )}
    </Card>
  );
}
