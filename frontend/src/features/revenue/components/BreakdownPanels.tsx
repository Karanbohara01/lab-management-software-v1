import { Info } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { LinkFrom } from '@/lib/navigation';
import { useT, type Translate } from '@/i18n';
import { MoneyTable, type MoneyColumn } from './MoneyTable';
import {
  PATIENT_CATEGORY_LABEL,
  PAYER_TYPE_LABEL,
  type GroupRow,
  type PatientCategoryRow,
  type PatientOutstandingRow,
  type PayerRow,
  type ReferrerRow,
  type RevenueBreakdown,
  type TestRow,
} from '../types';

/** Shared explanation: a per-line cash figure can only ever be an allocation. */
const ALLOCATED =
  'An invoice is paid as a whole, so cash is split across its lines in proportion to each line’s share of the invoice. Billed figures are exact; collected and outstanding are allocations.';

const testColumns = (t: Translate): MoneyColumn<TestRow>[] => [
  {
    key: 'name',
    header: t('Test'),
    align: 'left',
    sortValue: (r) => r.name,
    cell: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{r.name}</span>
        <span className="shrink-0 font-mono text-caption text-muted">{r.code}</span>
        {r.type === 'PROFILE' && <Badge tone="neutral">{t('Package')}</Badge>}
      </span>
    ),
  },
  { key: 'department', header: t('Department'), align: 'left', sortValue: (r) => r.department ?? '', cell: (r) => r.department ?? <span className="text-muted">—</span>, hideOnMobile: true },
  { key: 'timesOrdered', header: t('Times billed'), amount: (r) => r.timesOrdered, total: true, format: 'count' },
  { key: 'gross', header: t('Gross'), amount: (r) => r.gross, total: true, hideOnMobile: true },
  { key: 'discount', header: t('Discount'), amount: (r) => r.discount, total: true, hideOnMobile: true },
  { key: 'netBilled', header: t('Billed'), amount: (r) => r.netBilled, total: true },
  { key: 'collected', header: t('Collected'), amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: t('Outstanding'), amount: (r) => r.outstanding, total: true },
];

const groupColumns = (t: Translate, label: string): MoneyColumn<GroupRow>[] => [
  { key: 'label', header: label, align: 'left', sortValue: (r) => r.label, cell: (r) => r.label },
  { key: 'tests', header: t('Tests'), amount: (r) => r.tests, total: true, format: 'count', hideOnMobile: true },
  { key: 'timesOrdered', header: t('Times billed'), amount: (r) => r.timesOrdered, total: true, format: 'count' },
  { key: 'netBilled', header: t('Billed'), amount: (r) => r.netBilled, total: true },
  { key: 'collected', header: t('Collected'), amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: t('Outstanding'), amount: (r) => r.outstanding, total: true },
];

const patientCategoryColumns = (t: Translate): MoneyColumn<PatientCategoryRow>[] => [
  { key: 'category', header: t('Patient type'), align: 'left', sortValue: (r) => r.category, cell: (r) => t(PATIENT_CATEGORY_LABEL[r.category] ?? r.category) },
  { key: 'invoices', header: t('Invoices'), amount: (r) => r.invoices, total: true, format: 'count' },
  { key: 'billed', header: t('Billed'), amount: (r) => r.billed, total: true },
  { key: 'collected', header: t('Collected'), amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: t('Outstanding'), amount: (r) => r.outstanding, total: true },
];

const payerColumns = (t: Translate): MoneyColumn<PayerRow>[] => [
  {
    key: 'payer',
    header: t('Payer'),
    align: 'left',
    sortValue: (r) => r.payerName ?? r.payerType,
    cell: (r) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{r.payerName || t(PAYER_TYPE_LABEL[r.payerType] ?? r.payerType)}</span>
        {r.payerName && <span className="text-caption text-muted">{t(PAYER_TYPE_LABEL[r.payerType] ?? r.payerType)}</span>}
      </span>
    ),
  },
  { key: 'invoices', header: t('Invoices'), amount: (r) => r.invoices, total: true, format: 'count' },
  { key: 'billed', header: t('Billed'), amount: (r) => r.billed, total: true },
  { key: 'collected', header: t('Collected'), amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: t('Outstanding'), amount: (r) => r.outstanding, total: true },
];

const referrerColumns = (t: Translate): MoneyColumn<ReferrerRow>[] => [
  { key: 'doctor', header: t('Referred by'), align: 'left', sortValue: (r) => r.doctorName, cell: (r) => r.doctorName },
  { key: 'invoices', header: t('Invoices'), amount: (r) => r.invoices, total: true, format: 'count' },
  { key: 'billed', header: t('Billed'), amount: (r) => r.billed, total: true },
  { key: 'collected', header: t('Collected'), amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: t('Outstanding'), amount: (r) => r.outstanding, total: true },
];

function patientColumns(t: Translate, linkPatients: boolean): MoneyColumn<PatientOutstandingRow>[] {
  return [
    {
      key: 'patient',
      header: t('Patient'),
      align: 'left',
      sortValue: (r) => r.patientName,
      cell: (r) => (
        <span className="flex min-w-0 items-center gap-2">
          {linkPatients ? (
            <LinkFrom to={`/app/patients/${r.patientId}`} className="truncate font-medium text-primary hover:underline">
              {r.patientName}
            </LinkFrom>
          ) : (
            <span className="truncate font-medium">{r.patientName}</span>
          )}
          <span className="shrink-0 font-mono text-caption text-muted">{r.mrn}</span>
        </span>
      ),
    },
    { key: 'invoices', header: t('Unpaid invoices'), amount: (r) => r.invoices, total: true, format: 'count' },
    { key: 'outstanding', header: t('Outstanding'), amount: (r) => r.outstanding, total: true },
  ];
}

function Panel({
  title,
  description,
  hint,
  children,
}: {
  title: string;
  description?: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="min-w-0">
      <CardHeader
        title={
          hint ? (
            <span className="inline-flex items-center gap-1.5">
              {title}
              <Tooltip content={hint}>
                <Info className="h-3.5 w-3.5 cursor-help text-muted" aria-hidden />
              </Tooltip>
            </span>
          ) : (
            title
          )
        }
        description={description}
      />
      {children}
    </Card>
  );
}

/**
 * Where the money came from, over the invoices issued in the period. Every panel is a roll-up of
 * the same test rows, so the columns foot to the same billed total whichever way they are sliced.
 */
export function BreakdownPanels({
  breakdown,
  canReadPatients,
}: {
  breakdown: RevenueBreakdown;
  canReadPatients: boolean;
}) {
  const t = useT();
  return (
    <div className="grid min-w-0 gap-4">
      <Panel
        title={t('Revenue by test')}
        description={t('Every test and package billed in this period, highest first.')}
        hint={t(ALLOCATED)}
      >
        <MoneyTable
          columns={testColumns(t)}
          rows={breakdown.byTest}
          rowKey={(r) => r.code}
          initialSort={{ key: 'netBilled' }}
          maxRows={25}
          emptyMessage={t('No tests were billed in this period.')}
          footerLabel={t('All tests')}
        />
      </Panel>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Panel
          title={t('Revenue by category')}
          description={t("Using each test's current catalogue category.")}
          hint={t(
            'Categories come from the test catalogue as it stands now, not as it stood when the invoice was raised — recategorising a test changes how past periods group, though never the totals.',
          )}
        >
          <MoneyTable
            columns={groupColumns(t, t('Category'))}
            rows={breakdown.byCategory}
            rowKey={(r) => r.label}
            initialSort={{ key: 'netBilled' }}
            emptyMessage={t('No categorised revenue in this period.')}
            footerLabel={t('All categories')}
          />
        </Panel>

        <Panel title={t('Revenue by department')} description={t('The laboratory section each test belongs to.')}>
          <MoneyTable
            columns={groupColumns(t, t('Department'))}
            rows={breakdown.byDepartment}
            rowKey={(r) => r.label}
            initialSort={{ key: 'netBilled' }}
            emptyMessage={t('No departmental revenue in this period.')}
            footerLabel={t('All departments')}
          />
        </Panel>

        <Panel
          title={t('Revenue by package')}
          description={t('Profiles and health-checkup panels sold as a single billed item.')}
          hint={t(
            'A package is billed once at its own price; the member tests it contains are performed but never billed separately, so nothing here is double-counted against the test table.',
          )}
        >
          <MoneyTable
            columns={groupColumns(t, t('Package'))}
            rows={breakdown.byPackage}
            rowKey={(r) => r.label}
            initialSort={{ key: 'netBilled' }}
            emptyMessage={t('No packages were sold in this period.')}
            footerLabel={t('All packages')}
          />
        </Panel>

        <Panel title={t('Revenue by patient type')} description={t('How the patient reached the laboratory.')}>
          <MoneyTable
            columns={patientCategoryColumns(t)}
            rows={breakdown.byPatientCategory}
            rowKey={(r) => r.category}
            initialSort={{ key: 'billed' }}
            emptyMessage={t('No revenue in this period.')}
            footerLabel={t('All patient types')}
          />
        </Panel>

        <Panel
          title={t('Revenue by payer')}
          description={t('Who settles the bill — corporate accounts, insurers and schemes.')}
          hint={t(
            "Grouped by the payer recorded on each patient's registration. The payer name is free text, so two spellings of the same company appear as two rows.",
          )}
        >
          <MoneyTable
            columns={payerColumns(t)}
            rows={breakdown.byPayer}
            rowKey={(r) => `${r.payerType}:${r.payerName ?? ''}`}
            initialSort={{ key: 'billed' }}
            emptyMessage={t('No revenue in this period.')}
            footerLabel={t('All payers')}
          />
        </Panel>

        <Panel title={t('Revenue by referrer')} description={t('Which referring doctors brought in the work.')}>
          <MoneyTable
            columns={referrerColumns(t)}
            rows={breakdown.byReferrer}
            rowKey={(r) => String(r.doctorId ?? 'direct')}
            initialSort={{ key: 'billed' }}
            emptyMessage={t('No referrals in this period.')}
            footerLabel={t('All referrers')}
          />
        </Panel>
      </div>

      <Panel
        title={t('Patients with the largest outstanding balances')}
        description={t('From the invoices issued in this period.')}
      >
        <MoneyTable
          columns={patientColumns(t, canReadPatients)}
          rows={breakdown.topOutstandingPatients}
          rowKey={(r) => r.patientId}
          initialSort={{ key: 'outstanding' }}
          emptyMessage={t('Every invoice issued in this period is settled.')}
          footerLabel={t('These patients')}
        />
      </Panel>
    </div>
  );
}
