import { useState } from 'react';
import { Download } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { exportCsv, exportXml } from '@/lib/exportData';
import { invoicesApi } from './api';
import type { MasterBillRow } from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EXPORT_COLUMNS: { key: keyof MasterBillRow; header: string }[] = [
  { key: 'fiscalYear', header: 'FiscalYear' },
  { key: 'billNo', header: 'BillNo' },
  { key: 'customerName', header: 'CustomerName' },
  { key: 'customerPan', header: 'CustomerPan' },
  { key: 'billDate', header: 'BillDate' },
  { key: 'amount', header: 'Amount' },
  { key: 'discount', header: 'Discount' },
  { key: 'taxableAmount', header: 'TaxableAmount' },
  { key: 'taxAmount', header: 'TaxAmount' },
  { key: 'totalAmount', header: 'TotalAmount' },
  { key: 'syncWithIrd', header: 'SyncWithIrd' },
  { key: 'isBillPrinted', header: 'IsBillPrinted' },
  { key: 'isBillActive', header: 'IsBillActive' },
  { key: 'printedTime', header: 'PrintedTime' },
  { key: 'enteredBy', header: 'EnteredBy' },
  { key: 'printedBy', header: 'PrintedBy' },
  { key: 'isRealtime', header: 'IsRealtime' },
  { key: 'paymentMethod', header: 'PaymentMethod' },
  { key: 'vatRefundAmount', header: 'VatRefundAmount' },
  { key: 'transactionId', header: 'TransactionId' },
];

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString() : '—';
}

export function MasterBillPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, loading, error, refetch } = useQuery(() => invoicesApi.masterBill({ year, month }), [year, month]);
  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);

  const filename = `master-bill-${year}-${String(month).padStart(2, '0')}`;

  return (
    <>
      <PageHeader
        title="Master bill report"
        description="Every bill issued this month, including later-cancelled ones (Anusuchi-5 of the e-invoice procedure). Customer PAN and VAT-refund amount are always blank — this system doesn't capture patient PAN or integrate a payment gateway to compute a refund."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              disabled={!data || data.length === 0}
              onClick={() =>
                data && exportCsv(data as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], `${filename}.csv`)
              }
            >
              <Download className="h-4 w-4" aria-hidden />
              Export CSV
            </Button>
            <Button
              variant="secondary"
              disabled={!data || data.length === 0}
              onClick={() =>
                data &&
                exportXml(
                  data as unknown as Record<string, unknown>[],
                  EXPORT_COLUMNS as { key: string; header: string }[],
                  'MasterBill',
                  'Bill',
                  `${filename}.xml`,
                )
              }
            >
              <Download className="h-4 w-4" aria-hidden />
              Export XML
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

      <Card>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title="No bills" message="No invoices were issued in this period." />
        ) : (
          data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-2">Bill no</th>
                    <th className="px-4 py-2">Date</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2 text-right">Total</th>
                    <th className="px-4 py-2">Status</th>
                    <th className="px-4 py-2">IRD sync</th>
                    <th className="px-4 py-2">Printed</th>
                    <th className="px-4 py-2">Entered by</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.billNo} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{r.billNo}</td>
                      <td className="px-4 py-2">{dt(r.billDate)}</td>
                      <td className="px-4 py-2">{r.customerName}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(r.totalAmount)}</td>
                      <td className="px-4 py-2">
                        <Badge tone={r.isBillActive ? 'success' : 'neutral'}>{r.isBillActive ? 'Active' : 'Cancelled'}</Badge>
                      </td>
                      <td className="px-4 py-2">
                        <Badge tone={r.syncWithIrd === 'ACCEPTED' || r.syncWithIrd === 'DUPLICATE' ? 'success' : 'neutral'}>
                          {r.syncWithIrd}
                        </Badge>
                      </td>
                      <td className="px-4 py-2">
                        {r.isBillPrinted ? (
                          <span title={r.printedBy ?? undefined}>Yes{r.printedBy ? ` (${r.printedBy})` : ''}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-2">{r.enteredBy ?? '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </Card>
    </>
  );
}
