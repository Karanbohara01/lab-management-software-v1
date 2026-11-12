import { formatMoney } from '@/lib/money';
import { useT } from '@/i18n';
import type { OrderPricing } from './types';

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between py-1 text-sm ${strong ? 'font-semibold text-foreground' : 'text-muted'}`}>
      <span>{label}</span>
      <span className={strong ? '' : 'text-foreground'}>{value}</span>
    </div>
  );
}

export function PricingSummary({ pricing }: { pricing: OrderPricing }) {
  const t = useT();
  const discountLabel =
    pricing.discountType === 'PERCENT'
      ? t('Discount ({percent}%)', { percent: pricing.discountValue })
      : t('Discount');

  return (
    <div className="rounded-md border border-border bg-surface-muted/50 p-4">
      <Row label={t('Subtotal')} value={formatMoney(pricing.subtotal)} />
      {pricing.discountAmount > 0 && (
        <Row label={discountLabel} value={`− ${formatMoney(pricing.discountAmount)}`} />
      )}
      {pricing.taxRate > 0 && (
        <>
          <Row label={t('Taxable amount')} value={formatMoney(pricing.taxableAmount)} />
          <Row label={t('Tax ({rate}%)', { rate: pricing.taxRate })} value={formatMoney(pricing.taxAmount)} />
        </>
      )}
      <div className="my-1 border-t border-border" />
      <Row label={t('Total payable')} value={formatMoney(pricing.totalAmount)} strong />
    </div>
  );
}
