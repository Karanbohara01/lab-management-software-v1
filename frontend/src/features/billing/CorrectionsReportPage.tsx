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
import type { CorrectionRow } from './types';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const EXPORT_COLUMNS: { key: keyof CorrectionRow; header: string }[] = [
  { key: 'billNo', header: 'BillNo' },
  { key: 'customerName', header: 'CustomerName' },
  { key: 'totalAmount', header: 'TotalAmount' },
  { key: 'cancelledAt', header: 'CancelledAt' },
  { key: 'cancelledBy', header: 'CancelledBy' },
  { key: 'cancelReason', header: 'CancelReason' },
  { key: 'creditNoteStatus', header: 'CreditNoteStatus' },
  { key: 'creditNoteNumber', header: 'CreditNoteNumber' },
];

function dt(iso: string): string {
  return new Date(iso).toLocaleString();
}

export function CorrectionsReportPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);

  const { data, loading, error, refetch } = useQuery(() => invoicesApi.corrections({ year, month }), [year, month]);
  const yearOptions = Array.from({ length: 6 }, (_, i) => now.getFullYear() - 4 + i);
  const filename = `corrections-${year}-${String(month).padStart(2, '0')}`;

  return (
    <>
      <PageHeader
        title="Corrections report"
        description="Every bill cancelled this month — its validity ended and, if it had already been filed with IRD, whether it's been reversed with a credit note (दफा ६(ठ) of the e-invoice procedure). Distinct from the general audit log, which mixes every kind of action together."
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
                  'Corrections',
                  'Correction',
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
          <EmptyState title="No corrections" message="No invoices were cancelled in this period." />
        ) : (
          data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-2">Bill no</th>
                    <th className="px-4 py-2">Customer</th>
                    <th className="px-4 py-2 text-right">Amount</th>
                    <th className="px-4 py-2">Cancelled</th>
                    <th className="px-4 py-2">Reason</th>
                    <th className="px-4 py-2">Credit note</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((r) => (
                    <tr key={r.billNo} className="border-b border-border last:border-0">
                      <td className="px-4 py-2 font-mono text-xs">{r.billNo}</td>
                      <td className="px-4 py-2">{r.customerName}</td>
                      <td className="px-4 py-2 text-right">{formatMoney(r.totalAmount)}</td>
                      <td className="px-4 py-2">
                        {dt(r.cancelledAt)}
                        {r.cancelledBy ? <span className="block text-xs text-muted">by {r.cancelledBy}</span> : null}
                      </td>
                      <td className="px-4 py-2">{r.cancelReason ?? '—'}</td>
                      <td className="px-4 py-2">
                        {!r.creditNoteStatus || r.creditNoteStatus === 'NOT_NEEDED' ? (
                          '—'
                        ) : (
                          <Badge tone={r.creditNoteStatus === 'FILED' ? 'success' : r.creditNoteStatus === 'FAILED' ? 'danger' : 'warning'}>
                            {r.creditNoteStatus === 'FILED' ? r.creditNoteNumber ?? 'Filed' : r.creditNoteStatus}
                          </Badge>
                        )}
                      </td>
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
