import { useEffect, useMemo, useState } from 'react';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ordersApi } from '@/features/orders/api';
import type { OrderPricing } from '@/features/orders/types';
import { PricingSummary } from '@/features/orders/PricingSummary';

const ZERO: OrderPricing = {
  subtotal: 0,
  discountType: 'NONE',
  discountValue: 0,
  discountAmount: 0,
  taxableAmount: 0,
  taxRate: 0,
  taxAmount: 0,
  totalAmount: 0,
};

/**
 * Live, indicative total for an appointment's chosen tests. Nothing here is ever stored — it's
 * the existing stateless order-pricing preview, called on demand, so the appointment never
 * becomes a second source of financial truth. Discount/tax are deliberately fixed at none/zero:
 * those are decisions for the lab order, which is where billing actually starts.
 */
export function AppointmentEstimate({ items }: { items: { testId: number; quantity: number }[] }) {
  const { hasPermission } = useAuth();
  // The preview endpoint is gated on LAB_ORDER_READ; a hand-built custom role could hold
  // APPOINTMENT_WRITE without it, and should just see no estimate rather than a 403.
  const canPrice = hasPermission(PERMISSIONS.LAB_ORDER_READ);

  const inputs = useMemo(() => {
    const seen = new Set<number>();
    const deduped = items.filter((i) => !seen.has(i.testId) && (seen.add(i.testId), true));
    return {
      items: deduped.map((i) => ({ testId: i.testId, quantity: i.quantity, lineDiscount: 0 })),
      discountType: 'NONE' as const,
      discountValue: 0,
      taxRate: 0,
    };
  }, [items]);
  const debounced = useDebouncedValue(inputs, 350);
  const [pricing, setPricing] = useState<OrderPricing | null>(ZERO);

  useEffect(() => {
    if (!canPrice) {
      setPricing(null);
      return;
    }
    // The server rejects an empty items list (400) — short-circuit to zeros exactly as the
    // order builder does.
    if (debounced.items.length === 0) {
      setPricing(ZERO);
      return;
    }
    let cancelled = false;
    ordersApi
      .preview(debounced)
      .then((p) => {
        if (!cancelled) setPricing(p);
      })
      .catch(() => {
        if (!cancelled) setPricing(null);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, canPrice]);

  if (!pricing || items.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <PricingSummary pricing={pricing} />
      <p className="text-xs text-muted">
        Indicative estimate from current catalog prices — final pricing, discounts and tax are set on the lab order.
      </p>
    </div>
  );
}
