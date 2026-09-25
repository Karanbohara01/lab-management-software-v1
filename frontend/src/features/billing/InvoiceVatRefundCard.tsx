import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { paymentGatewaysApi } from '@/features/payments/api';
import { PROVIDER_LABEL, type VatRefundReportStatus } from '@/features/payments/types';

const STATUS_LABEL: Record<VatRefundReportStatus, string> = {
  SENT: 'Reported',
  FAILED: 'Report failed',
  NOT_SUPPORTED: 'Not supported by provider',
  NOT_APPLICABLE: 'Not applicable',
};

const STATUS_TONE: Record<VatRefundReportStatus, 'success' | 'danger' | 'warning' | 'neutral'> = {
  SENT: 'success',
  FAILED: 'danger',
  NOT_SUPPORTED: 'warning',
  NOT_APPLICABLE: 'neutral',
};

/**
 * दफा ६(त) / Anusuchi-8: shows whether the 10%-of-VAT refund report was sent to the payment
 * provider for each digital-wallet payment on this invoice — the one place in the app this status
 * is visible outside the audit trail. Renders nothing for an invoice with no online payments, so a
 * cash-only clinic never sees an empty card.
 */
export function InvoiceVatRefundCard({ invoiceId }: { invoiceId: number }) {
  const { data, loading } = useQuery(() => paymentGatewaysApi.listForInvoice(invoiceId), [invoiceId]);
  const verified = (data ?? []).filter((p) => p.status === 'VERIFIED');

  if (loading && !data) return <LoadingState />;
  if (verified.length === 0) return null;

  return (
    <Card data-print-hide>
      <CardHeader
        title="VAT refund reporting"
        description="10% of VAT on digital-wallet payments, reported to the provider per Anusuchi-8 of the e-invoice procedure."
      />
      <CardBody className="space-y-3">
        {verified.map((p) => (
          <div key={p.id} className="flex items-start justify-between gap-3 text-sm">
            <div>
              <p className="font-medium text-foreground">
                {PROVIDER_LABEL[p.provider]} · {formatMoney(p.amount)}
              </p>
              {p.vatRefundAmount != null && (
                <p className="text-xs text-muted">Refund amount: {formatMoney(p.vatRefundAmount)}</p>
              )}
              {p.vatRefundError && <p className="text-xs text-muted">{p.vatRefundError}</p>}
            </div>
            <Badge tone={STATUS_TONE[p.vatRefundReportStatus]}>{STATUS_LABEL[p.vatRefundReportStatus]}</Badge>
          </div>
        ))}
      </CardBody>
    </Card>
  );
}
