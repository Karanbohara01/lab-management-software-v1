import { Info } from 'lucide-react';
import { Card, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Tooltip } from '@/components/ui/Tooltip';
import { LinkFrom } from '@/lib/navigation';
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

const TEST_COLUMNS: MoneyColumn<TestRow>[] = [
  {
    key: 'name',
    header: 'Test',
    align: 'left',
    sortValue: (r) => r.name,
    cell: (r) => (
      <span className="flex min-w-0 items-center gap-2">
        <span className="truncate font-medium">{r.name}</span>
        <span className="shrink-0 font-mono text-caption text-muted">{r.code}</span>
        {r.type === 'PROFILE' && <Badge tone="neutral">Package</Badge>}
      </span>
    ),
  },
  { key: 'department', header: 'Department', align: 'left', sortValue: (r) => r.department ?? '', cell: (r) => r.department ?? <span className="text-muted">—</span>, hideOnMobile: true },
  { key: 'timesOrdered', header: 'Times billed', amount: (r) => r.timesOrdered, total: true, format: 'count' },
  { key: 'gross', header: 'Gross', amount: (r) => r.gross, total: true, hideOnMobile: true },
  { key: 'discount', header: 'Discount', amount: (r) => r.discount, total: true, hideOnMobile: true },
  { key: 'netBilled', header: 'Billed', amount: (r) => r.netBilled, total: true },
  { key: 'collected', header: 'Collected', amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: 'Outstanding', amount: (r) => r.outstanding, total: true },
];

const GROUP_COLUMNS = (label: string): MoneyColumn<GroupRow>[] => [
  { key: 'label', header: label, align: 'left', sortValue: (r) => r.label, cell: (r) => r.label },
  { key: 'tests', header: 'Tests', amount: (r) => r.tests, total: true, format: 'count', hideOnMobile: true },
  { key: 'timesOrdered', header: 'Times billed', amount: (r) => r.timesOrdered, total: true, format: 'count' },
  { key: 'netBilled', header: 'Billed', amount: (r) => r.netBilled, total: true },
  { key: 'collected', header: 'Collected', amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: 'Outstanding', amount: (r) => r.outstanding, total: true },
];

const PATIENT_CATEGORY_COLUMNS: MoneyColumn<PatientCategoryRow>[] = [
  { key: 'category', header: 'Patient type', align: 'left', sortValue: (r) => r.category, cell: (r) => PATIENT_CATEGORY_LABEL[r.category] ?? r.category },
  { key: 'invoices', header: 'Invoices', amount: (r) => r.invoices, total: true, format: 'count' },
  { key: 'billed', header: 'Billed', amount: (r) => r.billed, total: true },
  { key: 'collected', header: 'Collected', amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: 'Outstanding', amount: (r) => r.outstanding, total: true },
];

const PAYER_COLUMNS: MoneyColumn<PayerRow>[] = [
  {
    key: 'payer',
    header: 'Payer',
    align: 'left',
    sortValue: (r) => r.payerName ?? r.payerType,
    cell: (r) => (
      <span className="flex min-w-0 flex-col">
        <span className="truncate font-medium">{r.payerName || PAYER_TYPE_LABEL[r.payerType] || r.payerType}</span>
        {r.payerName && <span className="text-caption text-muted">{PAYER_TYPE_LABEL[r.payerType] ?? r.payerType}</span>}
      </span>
    ),
  },
  { key: 'invoices', header: 'Invoices', amount: (r) => r.invoices, total: true, format: 'count' },
  { key: 'billed', header: 'Billed', amount: (r) => r.billed, total: true },
  { key: 'collected', header: 'Collected', amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: 'Outstanding', amount: (r) => r.outstanding, total: true },
];

const REFERRER_COLUMNS: MoneyColumn<ReferrerRow>[] = [
  { key: 'doctor', header: 'Referred by', align: 'left', sortValue: (r) => r.doctorName, cell: (r) => r.doctorName },
  { key: 'invoices', header: 'Invoices', amount: (r) => r.invoices, total: true, format: 'count' },
  { key: 'billed', header: 'Billed', amount: (r) => r.billed, total: true },
  { key: 'collected', header: 'Collected', amount: (r) => r.collected, total: true },
  { key: 'outstanding', header: 'Outstanding', amount: (r) => r.outstanding, total: true },
];

function patientColumns(linkPatients: boolean): MoneyColumn<PatientOutstandingRow>[] {
  return [
    {
      key: 'patient',
      header: 'Patient',
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
    { key: 'invoices', header: 'Unpaid invoices', amount: (r) => r.invoices, total: true, format: 'count' },
    { key: 'outstanding', header: 'Outstanding', amount: (r) => r.outstanding, total: true },
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
  return (
    <div className="grid min-w-0 gap-4">
      <Panel
        title="Revenue by test"
        description="Every test and package billed in this period, highest first."
        hint={ALLOCATED}
      >
        <MoneyTable
          columns={TEST_COLUMNS}
          rows={breakdown.byTest}
          rowKey={(r) => r.code}
          initialSort={{ key: 'netBilled' }}
          maxRows={25}
          emptyMessage="No tests were billed in this period."
          footerLabel="All tests"
        />
      </Panel>

      <div className="grid min-w-0 gap-4 xl:grid-cols-2">
        <Panel
          title="Revenue by category"
          description="Using each test's current catalogue category."
          hint="Categories come from the test catalogue as it stands now, not as it stood when the invoice was raised — recategorising a test changes how past periods group, though never the totals."
        >
          <MoneyTable
            columns={GROUP_COLUMNS('Category')}
            rows={breakdown.byCategory}
            rowKey={(r) => r.label}
            initialSort={{ key: 'netBilled' }}
            emptyMessage="No categorised revenue in this period."
            footerLabel="All categories"
          />
        </Panel>

        <Panel title="Revenue by department" description="The laboratory section each test belongs to.">
          <MoneyTable
            columns={GROUP_COLUMNS('Department')}
            rows={breakdown.byDepartment}
            rowKey={(r) => r.label}
            initialSort={{ key: 'netBilled' }}
            emptyMessage="No departmental revenue in this period."
            footerLabel="All departments"
          />
        </Panel>

        <Panel
          title="Revenue by package"
          description="Profiles and health-checkup panels sold as a single billed item."
          hint="A package is billed once at its own price; the member tests it contains are performed but never billed separately, so nothing here is double-counted against the test table."
        >
          <MoneyTable
            columns={GROUP_COLUMNS('Package')}
            rows={breakdown.byPackage}
            rowKey={(r) => r.label}
            initialSort={{ key: 'netBilled' }}
            emptyMessage="No packages were sold in this period."
            footerLabel="All packages"
          />
        </Panel>

        <Panel title="Revenue by patient type" description="How the patient reached the laboratory.">
          <MoneyTable
            columns={PATIENT_CATEGORY_COLUMNS}
            rows={breakdown.byPatientCategory}
            rowKey={(r) => r.category}
            initialSort={{ key: 'billed' }}
            emptyMessage="No revenue in this period."
            footerLabel="All patient types"
          />
        </Panel>

        <Panel
          title="Revenue by payer"
          description="Who settles the bill — corporate accounts, insurers and schemes."
          hint="Grouped by the payer recorded on each patient's registration. The payer name is free text, so two spellings of the same company appear as two rows."
        >
          <MoneyTable
            columns={PAYER_COLUMNS}
            rows={breakdown.byPayer}
            rowKey={(r) => `${r.payerType}:${r.payerName ?? ''}`}
            initialSort={{ key: 'billed' }}
            emptyMessage="No revenue in this period."
            footerLabel="All payers"
          />
        </Panel>

        <Panel title="Revenue by referrer" description="Which referring doctors brought in the work.">
          <MoneyTable
            columns={REFERRER_COLUMNS}
            rows={breakdown.byReferrer}
            rowKey={(r) => String(r.doctorId ?? 'direct')}
            initialSort={{ key: 'billed' }}
            emptyMessage="No referrals in this period."
            footerLabel="All referrers"
          />
        </Panel>
      </div>

      <Panel
        title="Patients with the largest outstanding balances"
        description="From the invoices issued in this period."
      >
        <MoneyTable
          columns={patientColumns(canReadPatients)}
          rows={breakdown.topOutstandingPatients}
          rowKey={(r) => r.patientId}
          initialSort={{ key: 'outstanding' }}
          emptyMessage="Every invoice issued in this period is settled."
          footerLabel="These patients"
        />
      </Panel>
    </div>
  );
}
