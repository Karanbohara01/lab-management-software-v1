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
import type { CorrectionRow } from './types';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const NOW = new Date();
/** The period lives in the URL, so a report can be bookmarked or shared and opens on its own month. */
const PARAMS = { year: NOW.getFullYear(), month: NOW.getMonth() + 1 };
const YEAR_OPTIONS = Array.from({ length: 6 }, (_, i) => NOW.getFullYear() - 4 + i);

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
  return new Date(iso).toLocaleString(LOCALE_TAG[getLocale()]);
}

export function CorrectionsReportPage() {
  const t = useT();
  const { params, set } = useListParams(PARAMS);
  const { year, month } = params;

  const { data, loading, error, refetch } = useQuery(
    () => invoicesApi.corrections({ year, month }),
    [year, month],
    { cacheKey: `corrections:${year}:${month}` },
  );
  const filename = `corrections-${year}-${String(month).padStart(2, '0')}`;

  return (
    <>
      <PageHeader
        title={t('Corrections report')}
        description={t("Every bill cancelled this month — its validity ended and, if it had already been filed with IRD, whether it's been reversed with a credit note (दफा ६(ठ) of the e-invoice procedure). Distinct from the general audit log, which mixes every kind of action together.")}
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
                exportExcel(data as unknown as Record<string, unknown>[], EXPORT_COLUMNS as { key: string; header: string }[], 'Corrections', `${filename}.xls`)
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
                  'Corrections',
                  'Correction',
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
          <EmptyState title={t('No corrections')} message={t('No invoices were cancelled in this period.')} />
        ) : (
          data && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                    <th className="px-4 py-2">{t('Bill No')}</th>
                    <th className="px-4 py-2">{t('Customer')}</th>
                    <th className="px-4 py-2 text-right">{t('Amount')}</th>
                    <th className="px-4 py-2">{t('Cancelled')}</th>
                    <th className="px-4 py-2">{t('Reason')}</th>
                    <th className="px-4 py-2">{t('Credit note')}</th>
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
                        {r.cancelledBy ? (
                          <span className="block text-xs text-muted">{t('by {name}', { name: r.cancelledBy })}</span>
                        ) : null}
                      </td>
                      <td className="px-4 py-2">{r.cancelReason ?? '—'}</td>
                      <td className="px-4 py-2">
                        {!r.creditNoteStatus || r.creditNoteStatus === 'NOT_NEEDED' ? (
                          '—'
                        ) : (
                          <Badge tone={r.creditNoteStatus === 'FILED' ? 'success' : r.creditNoteStatus === 'FAILED' ? 'danger' : 'warning'}>
                            {r.creditNoteStatus === 'FILED' ? r.creditNoteNumber ?? t('Filed') : r.creditNoteStatus}
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
