const npr = new Intl.NumberFormat('en-NP', {
  style: 'currency',
  currency: 'NPR',
  minimumFractionDigits: 2,
});

/** Formats a number as Nepalese Rupees, e.g. 1800 -> "NPR 1,800.00". */
export function formatMoney(value: number | string): string {
  return npr.format(typeof value === 'string' ? Number(value) : value);
}
