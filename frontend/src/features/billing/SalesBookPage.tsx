import { useState } from 'react';
import { Download, Printer } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { exportCsv } from '@/lib/exportData';
import { invoicesApi } from './api';
import type { SalesBookRow } from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function dt(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

const CSV_COLUMNS: { key: keyof SalesBookRow; header: string }[] = [
  { key: 'date', header: 'Date' },
  { key: 'billNo', header: 'Bill No' },
  { key: 'buyerName', header: "Buyer's Name" },
  { key: 'buyerPan', header: "Buyer's PAN" },
  { key: 'totalSales', header: 'Total Sales' },
  { key: 'nonTaxableSales', header: 'Non-Taxable Sales' },
  { key: 'exportSales', header: 'Export Sales' },
  { key: 'discount', header: 'Discount' },
  { key: 'taxableSales', header: 'Taxable Sales' },
  { key: 'tax', header: 'Tax' },
];

export function SalesBookPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, loading, error, refetch } = useQuery(() => invoicesApi.salesBook({ year, month }), [year, month]);

  const totals = (data ?? []).reduce(
    (acc, r) => ({
      totalSales: acc.totalSales + r.totalSales,
      discount: acc.discount + r.discount,
      taxableSales: acc.taxableSales + r.taxableSales,
      tax: acc.tax + r.tax,
    }),
    { totalSales: 0, discount: 0, taxableSales: 0, tax: 0 },
  );

  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  return (
    <>
      <div data-print-hide>
        <PageHeader
          title="Sales book"
          description="Monthly sales register (Anusuchi-7 of the e-invoice procedure) — every issued invoice, taxable/non-taxable/export split, discount and tax."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                disabled={!data || data.length === 0}
                onClick={() =>
                  data &&
                  exportCsv(
                    data as unknown as Record<string, unknown>[],
                    CSV_COLUMNS as { key: string; header: string }[],
                    `sales-book-${year}-${String(month).padStart(2, '0')}.csv`,
                  )
                }
              >
                <Download className="h-4 w-4" aria-hidden />
                Export CSV
              </Button>
              <Button onClick={() => window.print()} disabled={!data || data.length === 0}>
                <Printer className="h-4 w-4" aria-hidden />
                Print
              </Button>
            </div>
          }
        />

        <Card className="mb-4">
          <div className="flex flex-wrap items-center gap-3 p-4">
            <div className="w-40">
              <Select
                label="Month"
                value={String(month)}
                onChange={(e) => setMonth(Number(e.target.value))}
                options={MONTHS.map((m, i) => ({ value: String(i + 1), label: m }))}
              />
            </div>
            <div className="w-32">
              <Select
                label="Year"
                value={String(year)}
                onChange={(e) => setYear(Number(e.target.value))}
                options={yearOptions.map((y) => ({ value: String(y), label: String(y) }))}
              />
            </div>
          </div>
        </Card>
      </div>

      <Card id="report-print">
        <div className="hidden p-4 print:block">
          <p className="text-lg font-bold">
            Sales Book — {MONTHS[month - 1]} {year}
          </p>
        </div>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title="No sales" message="No invoices were issued in this period." />
        ) : (
          data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Bill No</th>
                    <th className="px-4 py-2">Buyer</th>
                    <th className="px-4 py-2 text-right">Total sales</th>
                    <th className="px-4 py-2 text-right">Discount</th>
                    <th className="px-4 py-2 text-right">Taxable sales</th>
                    <th className="px-4 py-2 text-right">Tax</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.billNo} className="border-b border-border last:border-0">
                      <td className="px-4 py-2">{dt(r.date)}</td>
                      <td className="px-4 py-2 font-mono text-xs">{r.billNo}</td>
                      <td className="px-4 py-2">{r.buyerName}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(r.totalSales)}</td>
                      <td className="px-4 py-2 text-right">{r.discount > 0 ? formatMoney(r.discount) : '—'}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(r.taxableSales)}</td>
                      <td className="px-4 py-2 text-right">{r.tax > 0 ? formatMoney(r.tax) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-border font-semibold">
                    <td className="px-4 py-2" colSpan={3}>
                      Total ({data.length} bills)
                    </td>
                    <td className="px-4 py-2 text-right">{formatMoney(totals.totalSales)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(totals.discount)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(totals.taxableSales)}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(totals.tax)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )
        )}
      </Card>
    </>
  );
}
