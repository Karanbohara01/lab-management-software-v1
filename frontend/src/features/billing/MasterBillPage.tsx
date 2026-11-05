import { Download } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Select';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { exportCsv, exportExcel, exportXml } from '@/lib/exportData';
import { invoicesApi } from './api';
import type { MasterBillRow } from './types';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const NOW = new Date();
/** The period lives in the URL, so a report can be bookmarked or shared and opens on its own month. */
const PARAMS = { year: NOW.getFullYear(), month: NOW.getMonth() + 1 };
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => NOW.getFullYear() - 4 + i);

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
  return iso ? new Date(iso).toLocaleString(LOCALE_TAG[getLocale()]) : '—';
}

export function MasterBillPage() {
  const t = useT();
  const { params, set } = useListParams(PARAMS);
  const { year, month } = params;

  const { data, loading, error, refetch } = useQuery(
    () => invoicesApi.masterBill({ year, month }),
    [year, month],
    { cacheKey: `master-bill:${year}:${month}` },
  );

  const filename = `master-bill-${year}-${String(month).padStart(2, '0')}`;

  return (
    <>
      <PageHeader
        title={t('Master bill report')}
        description={t("Every bill issued this month, including later-cancelled ones (Anusuchi-5 of the e-invoice procedure). Customer PAN is blank when the patient didn't supply one; VAT-refund amount is always blank — this system doesn't integrate a payment gateway to compute a refund.")}
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
              {t('Export CSV')}
            </Button>
            <Button
              variant="secondary"
              disabled={!data || data.length === 0}
              onClick={() =>
                data &&
                exportExcel(data as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'MasterBill', `${filename}.xls`)
              }
            >
              <Download className="h-4 w-4" aria-hidden />
              {t('Export Excel')}
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
              {t('Export XML')}
            </Button>
          </div>
        }
      />

      <Card className="mb-4">
        <div className="flex flex-wrap items-center gap-3 p-4">
          <div className="w-40">
            <Select
              label={t('Month')}
              value={String(month)}
              onChange={(e) => set({ month: Number(e.target.value) })}
              options={MONTHS.map((m, i) => ({ value: String(i + 1), label: t(m) }))}
            />
          </div>
          <div className="w-32">
            <Select
              label={t('Year')}
              value={String(year)}
              onChange={(e) => set({ year: Number(e.target.value) })}
              options={YEAR_OPTIONS.map((y) => ({ value: String(y), label: String(y) }))}
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
          <EmptyState title={t('No bills')} message={t('No invoices were issued in this period.')} />
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
