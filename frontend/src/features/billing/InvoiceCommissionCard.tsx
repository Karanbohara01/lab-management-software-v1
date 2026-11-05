import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { formatMoney } from '@/lib/money';
import { LinkFrom } from '@/lib/navigation';
import type { InvoiceDetail } from './types';
import { useT } from '@/i18n';

/**
 * Surfaces the referring doctor + commission outcome directly on the invoice — previously the
 * invoice page showed no referring-doctor information at all, even when an order genuinely had
 * one assigned, which is exactly what made a real "why is there no commission?" case impossible
 * to diagnose from this page. Renders nothing for a walk-in order with no referring doctor at
 * all, so a clinic that never uses referrals never sees an empty card.
 */
export function InvoiceCommissionCard({ invoice }: { invoice: InvoiceDetail }) {
  const t = useT();
  if (!invoice.referringDoctorId) return null;

  const hasRate = invoice.referringDoctorCommissionRate != null && invoice.referringDoctorCommissionRate > 0;
  const earned = invoice.commissionEarned != null;

  return (
    <Card data-print-hide>
      <CardHeader title={t('Referring doctor')} />
      <CardBody className="space-y-2 text-sm">
        <p className="font-medium text-foreground">{invoice.referringDoctorName}</p>
        {hasRate ? (
          earned ? (
            <div className="flex items-center justify-between">
              <span className="text-muted">{t('Commission ({rate}%)', { rate: invoice.referringDoctorCommissionRate! })}</span>
              <Badge tone="success">{formatMoney(invoice.commissionEarned!)}</Badge>
            </div>
          ) : (
            <p className="text-xs text-muted">
              {t("Rate is {rate}%, but no commission was earned on this invoice — it was likely issued before the rate was set (rates aren't applied retroactively).", { rate: invoice.referringDoctorCommissionRate! })}
            </p>
          )
        ) : (
          <p className="text-xs text-muted">{t('No commission rate set for this doctor.')}</p>
        )}
        <LinkFrom to="/app/commission" className="inline-block text-xs text-primary hover:underline">
          {t('View commission ledger')}
        </LinkFrom>
      </CardBody>
    </Card>
  );
}
