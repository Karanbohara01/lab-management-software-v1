import { Section, SectionHeading } from '../components/primitives';
import { Showcase } from '../components/Showcase';
import { Reveal } from '../components/Reveal';
import { MockBadge, MockShell, MockStat, MockStatGrid, MockTable, MockWindow } from '../components/MockUI';

/* ------------------------------------------------------------------- Billing */

function BillingMock() {
  return (
    <MockWindow title="LabOS — Invoice INV-2082/83-000124" canvasClassName="min-w-[36rem]">
      <div className="p-4 text-[11px]">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono font-semibold text-foreground">INV-2082/83-000124</p>
            <p className="text-muted">Sita Rai · P000242 · 07 Sep 2026</p>
          </div>
          <span className="flex gap-1.5">
            <MockBadge tone="info">Issued</MockBadge>
            <MockBadge tone="warning">Partial</MockBadge>
          </span>
        </div>
        <MockTable
          columns={[
            { key: 't', header: 'Test' },
            { key: 'q', header: 'Qty', align: 'center' },
            { key: 'r', header: 'Rate', align: 'right' },
            { key: 'a', header: 'Amount', align: 'right' },
          ]}
          rows={[
            ['Complete Blood Count', '1', '600.00', '600.00'],
            ['Lipid Profile', '1', '1,200.00', '1,200.00'],
            ['HbA1c', '1', '900.00', '900.00'],
          ]}
        />
        <div className="ml-auto mt-3 w-44 space-y-1 text-[11px]">
          <div className="flex justify-between text-muted"><span>Subtotal</span><span className="text-foreground">2,700.00</span></div>
          <div className="flex justify-between text-muted"><span>Discount</span><span className="text-foreground">− 200.00</span></div>
          <div className="flex justify-between border-t border-border pt-1 font-semibold text-foreground"><span>Total</span><span>2,500.00</span></div>
          <div className="flex justify-between text-muted"><span>Paid</span><span className="text-foreground">1,500.00</span></div>
          <div className="flex justify-between font-semibold text-foreground"><span>Balance</span><span>1,000.00</span></div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {['Cash', 'Card', 'Bank transfer', 'Digital wallet', 'Credit'].map((m) => (
            <span key={m} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted">{m}</span>
          ))}
        </div>
      </div>
    </MockWindow>
  );
}

export function BillingShowcase() {
  return (
    <Showcase
      eyebrow="Billing & payments"
      title="Billing that follows the laboratory workflow."
      lead="An invoice is raised straight from a confirmed order. Apply discounts and tax, issue it with a fiscal-year number, then record payments and track the balance."
      points={[
        'Test-level and package pricing, discounts and tax',
        'Partial payments, outstanding balances and refunds',
        'Immutable, fiscal-year invoice numbering',
        'Refunds with a separate approver',
      ]}
      media={<BillingMock />}
    />
  );
}

/* ------------------------------------------------------------ IRD / e-Billing */

const IRD_STEPS = ['Invoice created', 'Submission pending', 'Submitted', 'Accepted'];

function EbillingMock() {
  return (
    <MockWindow title="LabOS — e-Billing">
      <div className="p-4">
        <ol className="flex flex-wrap items-center gap-1.5 text-[10px]">
          {IRD_STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              <span className={`whitespace-nowrap rounded-full px-2 py-1 font-medium ${i < 4 ? 'bg-primary/10 text-primary' : 'border border-border text-muted'}`}>{s}</span>
              {i < IRD_STEPS.length - 1 && <span className="text-muted">→</span>}
            </li>
          ))}
        </ol>

        <div className="mt-4 rounded-lg border border-border p-3 text-[11px]">
          <div className="flex items-center justify-between">
            <span className="font-mono font-semibold text-foreground">INV-2082/83-000124</span>
            <MockBadge tone="success">● Accepted</MockBadge>
          </div>
          <p className="mt-1 text-muted">Submitted 07 Sep 2026 — 10:42 AM · reference CBMS-99A2F</p>
        </div>

        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-[11px]">
          <p className="font-semibold text-red-700">INV-2082/83-000121 — Submission failed</p>
          <p className="mt-0.5 text-red-600">Error details available in the attempt log</p>
          <div className="mt-2 flex gap-1.5">
            <span className="rounded-md border border-red-300 px-2 py-0.5 text-[10px] text-red-700">Review</span>
            <span className="rounded-md border border-red-300 px-2 py-0.5 text-[10px] text-red-700">Retry</span>
          </div>
        </div>
      </div>
    </MockWindow>
  );
}

export function EbillingShowcase() {
  return (
    <Showcase
      id="ebilling"
      eyebrow="IRD / e-Billing"
      title="Keep your billing organized and integration-ready."
      lead="LabOS tracks the electronic billing submission lifecycle — not submitted, pending, submitted, accepted, failed — with a full attempt log and safe retry handling. The integration sits behind a dedicated service, so billing is never blocked by an external system."
      points={[
        'Honest submission status on every invoice',
        'Per-attempt log with request and response detail',
        'Guarded retries — no duplicate submissions',
        'Record bills filed manually when the service is down',
      ]}
      media={<EbillingMock />}
      flip
      tinted
    />
  );
}

/* ------------------------------------------------------------- Dashboard */

function DashboardMock() {
  return (
    <MockWindow title="LabOS — Dashboard" canvasClassName="min-w-[44rem]">
      <MockShell active="Dashboard">
        <MockStatGrid cols={4}>
          <MockStat label="Today's patients" value="48" />
          <MockStat label="Today's tests" value="126" />
          <MockStat label="Pending samples" value="12" />
          <MockStat label="Pending results" value="18" />
          <MockStat label="Awaiting verification" value="7" />
          <MockStat label="Today's revenue" value="84,200" />
          <MockStat label="Outstanding" value="19,500" />
          <MockStat label="e-Billing issues" value="1" />
        </MockStatGrid>
        <div className="mt-3 rounded-lg border border-border p-3">
          <p className="text-[11px] font-semibold text-foreground">Revenue collected · last 14 days</p>
          <div className="mt-2 flex h-16 items-end gap-1">
            {[40, 55, 48, 70, 62, 80, 58, 72, 90, 65, 78, 88, 60, 95].map((h, i) => (
              <span key={i} className="flex-1 rounded-t bg-primary/70" style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </MockShell>
    </MockWindow>
  );
}

export function DashboardShowcase() {
  return (
    <Showcase
      eyebrow="Dashboard"
      title="See the entire laboratory at a glance."
      lead="Today's patients, pending samples, results awaiting verification, revenue, outstanding payments and e-Billing issues — the whole operation on one screen, with each tile linking to the queue behind it."
      media={<DashboardMock />}
    />
  );
}

/* --------------------------------------------------------------- Analytics */

export function AnalyticsSection() {
  const bars = [
    { label: 'Hematology', v: 92 },
    { label: 'Biochemistry', v: 78 },
    { label: 'Serology', v: 46 },
    { label: 'Clinical pathology', v: 34 },
    { label: 'Microbiology', v: 22 },
  ];
  return (
    <Section className="bg-surface">
      <Reveal>
        <SectionHeading
          eyebrow="Analytics"
          title="Turn laboratory data into operational insight."
          lead="Revenue trends, department workload, most-ordered tests and referral patterns — clean, readable and always current."
          align="center"
        />
      </Reveal>
      <Reveal delay={80}>
        <div className="mx-auto mt-10 grid max-w-4xl gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-border bg-background p-5">
            <p className="text-sm font-semibold text-foreground">Test volume by department</p>
            <ul className="mt-4 space-y-3">
              {bars.map((b) => (
                <li key={b.label} className="text-xs">
                  <div className="flex justify-between text-muted"><span className="text-foreground">{b.label}</span><span>{b.v}</span></div>
                  <div className="mt-1 h-2 rounded-full bg-surface-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${b.v}%` }} /></div>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-border bg-background p-5">
            <p className="text-sm font-semibold text-foreground">Revenue trend · 30 days</p>
            <div className="mt-4 flex h-40 items-end gap-1">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="flex-1 rounded-t bg-primary/60" style={{ height: `${20 + ((i * 53) % 80)}%` }} />
              ))}
            </div>
            <p className="mt-2 text-xs text-muted">Total collected: NPR 1.9M</p>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}

/* --------------------------------------------------------------- Inventory */

function InventoryMock() {
  return (
    <MockWindow title="LabOS — Inventory" canvasClassName="min-w-[40rem]">
      <div className="p-4">
        <MockTable
          columns={[
            { key: 'i', header: 'Item' },
            { key: 'b', header: 'Batch' },
            { key: 's', header: 'Stock', align: 'right' },
            { key: 'e', header: 'Expiry' },
            { key: 'st', header: 'Status', align: 'right' },
          ]}
          rows={[
            ['CBC Diluent', 'BATCH-A', '900 mL', 'Mar 2027', <MockBadge tone="success">In stock</MockBadge>],
            ['HbA1c Kit', 'K-2291', '8 tests', 'Sep 2026', <MockBadge tone="warning">Expiring soon</MockBadge>],
            ['Lipid Reagent', 'LR-88', '120 mL', 'Jan 2026', <MockBadge tone="critical">Expired</MockBadge>],
            ['EDTA tubes', '—', '40 pcs', '—', <MockBadge tone="warning">Low stock</MockBadge>],
          ]}
        />
      </div>
    </MockWindow>
  );
}

export function InventoryShowcase() {
  return (
    <Showcase
      eyebrow="Inventory"
      title="Never lose track of laboratory supplies."
      lead="Reagents, kits and consumables tracked by batch, with stock levels, expiry and first-expiry-first-out issue — plus low-stock and expiry alerts."
      points={['Batch-level stock and expiry', 'Low stock, expiring and expired alerts', 'Purchase orders that receive straight into inventory']}
      media={<InventoryMock />}
      flip
    />
  );
}

/* ------------------------------------------------------------------- Audit */

const AUDIT_EVENTS = [
  { t: '10:42 AM', who: 'Dr. Sharma', what: 'Approved CBC result for Ramesh Thapa' },
  { t: '10:36 AM', who: 'Technician', what: 'Modified Haemoglobin 13.2 → 14.2' },
  { t: '10:20 AM', who: 'Reception', what: 'Created invoice INV-2082/83-000124' },
  { t: '10:18 AM', who: 'Reception', what: 'Registered patient Ramesh Thapa' },
];

export function AuditSection() {
  return (
    <Section id="security" className="bg-surface">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center lg:gap-16">
        <Reveal className="min-w-0">
          <SectionHeading
            eyebrow="Security & audit"
            title="Give every team member the right level of access — and keep every action traceable."
            lead="Sign-in per user, roles that map to real jobs, and permissions enforced on the server for every request. Sensitive actions are written to an append-only audit log with a before-and-after record."
          />
          <ul className="mt-6 grid gap-2.5 text-sm text-foreground sm:grid-cols-2">
            {['Role-based permissions', 'User management', 'Protected report access', 'Audit log with change history', 'Secure authentication', 'Failed-login lockout'].map((x) => (
              <li key={x} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden />
                {x}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={100} className="min-w-0">
          <MockWindow title="LabOS — Audit log">
            <ul className="divide-y divide-border">
              {AUDIT_EVENTS.map((e) => (
                <li key={e.t} className="flex gap-3 p-3 text-[11px]">
                  <span className="w-16 shrink-0 font-mono text-muted">{e.t}</span>
                  <span>
                    <span className="font-medium text-foreground">{e.who}</span>
                    <span className="text-muted"> — {e.what}</span>
                  </span>
                </li>
              ))}
            </ul>
            <p className="border-t border-border px-3 py-2 text-[10px] text-muted">Example data — not a real record.</p>
          </MockWindow>
        </Reveal>
      </div>
    </Section>
  );
}
