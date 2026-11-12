const npr = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  minimumFractionDigits: 2,
});

/**
 * Formats a number as Nepalese Rupees, e.g. 1800 -> "NPR 1,800.00". Anything that isn't a real
 * number renders as an em dash rather than the literal "NPRNaN" a bare format call produces — a
 * missing amount is a gap in the data, and a financial table has to say so instead of printing
 * nonsense.
 */
export function formatMoney(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || !Number.isFinite(n)) return '—';
  return npr.format(n);
}

/**
 * The same amount without the currency code, for dense financial tables that name the currency
 * once in the column header. Negatives keep a leading minus; a missing amount is an em dash.
 */
const plain = new Intl.NumberFormat('en-NP', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export function formatAmount(value: number | string | null | undefined): string {
  const n = typeof value === 'string' ? Number(value) : value;
  if (n == null || !Number.isFinite(n)) return '—';
  return plain.format(n);
}
