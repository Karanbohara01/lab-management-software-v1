import { Link } from 'react-router-dom';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/money';
import type { InvoiceDetail } from './types';

/**
 * Surfaces the referring doctor + commission outcome directly on the invoice — previously the
 * invoice page showed no referring-doctor information at all, even when an order genuinely had
 * one assigned, which is exactly what made a real "why is there no commission?" case impossible
 * to diagnose from this page. Renders nothing for a walk-in order with no referring doctor at
 * all, so a clinic that never uses referrals never sees an empty card.
 */
export function InvoiceCommissionCard({ invoice }: { invoice: InvoiceDetail }) {
  if (!invoice.referringDoctorId) return null;

  const hasRate = invoice.referringDoctorCommissionRate != null && invoice.referringDoctorCommissionRate > 0;
  const earned = invoice.commissionEarned != null;

  return (
    <Card data-print-hide>
      <CardHeader title="Referring doctor" />
      <CardBody className="space-y-2 text-sm">
        <p className="font-medium text-foreground">{invoice.referringDoctorName}</p>
        {hasRate ? (
          earned ? (
            <div className="flex items-center justify-between">
              <span className="text-muted">Commission ({invoice.referringDoctorCommissionRate}%)</span>
              <Badge tone="success">{formatMoney(invoice.commissionEarned!)}</Badge>
            </div>
          ) : (
            <p className="text-xs text-muted">
              Rate is {invoice.referringDoctorCommissionRate}%, but no commission was earned on this invoice — it was
              likely issued before the rate was set (rates aren't applied retroactively).
            </p>
          )
        ) : (
          <p className="text-xs text-muted">No commission rate set for this doctor.</p>
        )}
        <Link to="/app/commission" className="inline-block text-xs text-primary hover:underline">
          View commission ledger
        </Link>
      </CardBody>
    </Card>
  );
}
