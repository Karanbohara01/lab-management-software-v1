import { formatMoney } from '@/lib/money';
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
  const discountLabel =
    pricing.discountType === 'PERCENT'
      ? `Discount (${pricing.discountValue}%)`
      : pricing.discountType === 'AMOUNT'
        ? 'Discount'
        : 'Discount';

  return (
    <div className="rounded-md border border-border bg-surface-muted/50 p-4">
      <Row label="Subtotal" value={formatMoney(pricing.subtotal)} />
      {pricing.discountAmount > 0 && (
        <Row label={discountLabel} value={`− ${formatMoney(pricing.discountAmount)}`} />
      )}
      {pricing.taxRate > 0 && (
        <>
          <Row label="Taxable amount" value={formatMoney(pricing.taxableAmount)} />
          <Row label={`Tax (${pricing.taxRate}%)`} value={formatMoney(pricing.taxAmount)} />
        </>
      )}
      <div className="my-1 border-t border-border" />
      <Row label="Total payable" value={formatMoney(pricing.totalAmount)} strong />
    </div>
  );
}
