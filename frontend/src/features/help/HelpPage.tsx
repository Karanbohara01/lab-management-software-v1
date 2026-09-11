import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

interface Section {
  id: string;
  title: string;
  body: React.ReactNode;
}

const SECTIONS: Section[] = [
  {
    id: 'getting-started',
    title: 'Getting started',
    body: (
      <>
        <p>
          LabOS organizes work around the lab's real pipeline: a patient is registered, a doctor or the patient
          orders tests, a sample is collected and received, results are entered and verified, a report is generated
          and released, and the visit is billed. Each stage has its own screen, and an order's detail page ties every
          stage together with a single status stepper and a "Next step" button that advances it.
        </p>
        <p>
          What you can see and do is controlled by your <b>role</b> (Receptionist, Sample Collection Staff, Lab
          Technician, Pathologist, Accountant, Doctor, Lab Administrator, or Super Admin). Your dashboard after
          signing in is tailored to your role — a receptionist sees draft orders and outstanding invoices; a
          pathologist sees results awaiting authorization and critical results. If a button or page you expect isn't
          visible, you likely need a different permission — ask your lab administrator.
        </p>
      </>
    ),
  },
  {
    id: 'patients',
    title: 'Patient registration',
    body: (
      <>
        <p>
          <b>Patients → New patient</b> registers a patient with demographics, address, and an optional referring
          doctor. Each patient gets a sequential MRN (e.g. P000123). Marking a patient <b>Confidential</b> restricts
          who can view their record; marking a patient <b>VIP</b> is a visual flag only.
        </p>
        <p>Patients are shared across branches — a patient registered at one branch is visible at all of them.</p>
      </>
    ),
  },
  {
    id: 'orders',
    title: 'Lab orders',
    body: (
      <>
        <p>
          <b>Orders → New order</b> lets you search for the patient, add tests from the catalog, and set a
          discount/tax if applicable. Saving as a <b>Draft</b> lets you keep editing; <b>Save &amp; confirm</b> locks
          in pricing and generates the samples the order needs for collection.
        </p>
        <p>
          If your account belongs to a specific branch, new orders are created there automatically. Administrators
          and other HQ-level staff (no home branch assigned) get a branch selector and can see every branch's orders;
          branch-scoped staff only ever see their own branch's data, enforced by the server — not just hidden in the
          screen.
        </p>
        <p>
          The order detail page is the hub for everything that happens to that order: a status stepper across the
          top shows where it is, and the highlighted "Next step" button does the next action for you (collect →
          receive → enter results → verify → authorize → generate report → release → deliver) without you needing to
          jump between separate screens.
        </p>
      </>
    ),
  },
  {
    id: 'samples',
    title: 'Sample collection & receiving',
    body: (
      <>
        <p>
          <b>Samples</b> lists every specimen by status: awaiting collection, collected, received, or rejected. Scan
          or type a barcode/accession number in the lookup bar to jump straight to a sample.
        </p>
        <p>
          If your lab requires payment before collection (Settings → Operations), a self-pay patient's sample can't
          be collected until the invoice is paid — third-party-billed patients (insurance, corporate, government,
          etc.) are always exempt. A supervisor can override the block with a documented reason if genuinely needed;
          every override is recorded in the audit log.
        </p>
        <p>
          A sample can be <b>rejected</b> at collection or receiving with a reason (hemolyzed, insufficient volume,
          wrong container, etc.) — this stops it moving forward and flags the order for a redraw.
        </p>
      </>
    ),
  },
  {
    id: 'results',
    title: 'Results — entry, verification, authorization',
    body: (
      <>
        <p>
          <b>Results queue</b> shows tests waiting for entry. Reference ranges (age/sex-adjusted where configured)
          are shown alongside the entry field, and out-of-range or critical values are flagged automatically.
        </p>
        <p>
          Culture &amp; sensitivity tests use a dedicated entry form: growth outcome, isolated organisms, and an
          antibiotic susceptibility panel (S/I/R) per isolate, which becomes a structured narrative in the report.
        </p>
        <p>
          <b>Maker-checker verification</b>: the person who entered a result cannot verify their own entry — that
          attempt is blocked with a 409 unless a documented override reason is supplied, and the override is
          audited separately from a normal verification. A different person verifying someone else's entry needs no
          special step. After verification, a pathologist authorizes the result before it can appear on a released
          report.
        </p>
        <p>
          If internal quality control (QC) is configured for a test and a control run is out of range (Westgard
          rules), the corresponding patient result is locked from approval until the QC issue is resolved or a
          documented override is given.
        </p>
      </>
    ),
  },
  {
    id: 'reports',
    title: 'Reports',
    body: (
      <>
        <p>
          Once every test on an order is authorized, generate the report from the order's detail page. A pathologist
          signs and releases it; a released report becomes a real PDF-style document with the lab's letterhead, and
          gets a verification link/QR the patient (or anyone with the link) can use to confirm authenticity without
          logging in.
        </p>
        <p>
          <b>Delivery</b>: Print, or send via SMS/WhatsApp if your lab has a messaging gateway configured (Settings).
          If no gateway is configured, choosing SMS or WhatsApp fails with a clear error rather than silently doing
          nothing — the report stays "released" and can be retried or delivered manually instead.
        </p>
      </>
    ),
  },
  {
    id: 'billing',
    title: 'Billing & invoices',
    body: (
      <>
        <p>
          A <b>Draft</b> invoice is raised from a confirmed order; <b>Issue</b> locks in the invoice number and
          makes it payable. Payments can be recorded manually (cash, card, bank transfer, cheque, digital wallet) or
          collected online — see Online payment below. <b>Refunds</b> go through a request-then-approve workflow;
          a fully-refunded invoice can then be cancelled.
        </p>
        <p>
          <b>Printing</b>: the printed invoice follows the IRD-mandated Tax Invoice layout (or a plain Invoice if the
          lab has no PAN on file), with an amount-in-words line and a signature line. A bill prints as the original
          once; any further print of the same invoice is watermarked "Copy of Original" and the reprint is logged
          (who, when, how many times).
        </p>
        <p>
          <b>Online payment (eSewa / Khalti)</b>: on an issued invoice with a balance, click "Pay online" and choose
          a configured gateway. Only gateways your administrator has actually configured with real credentials are
          offered. After the patient completes checkout on the gateway's own page, the app always re-confirms the
          payment with the gateway itself before recording it — a payment is never accepted just because the browser
          redirected back looking successful.
        </p>
        <p>
          <b>Sales Book</b> and <b>Master bill report</b> (under Finance/Operations) give monthly and lifetime views
          of every bill for accounting and IRD compliance, exportable as CSV/XML and printable.
        </p>
      </>
    ),
  },
  {
    id: 'ird',
    title: 'IRD e-billing (CBMS)',
    body: (
      <>
        <p>
          If your lab is registered with IRD for electronic billing and a CBMS gateway is configured, an issued
          invoice can be submitted from its <b>IRD submission</b> card (or the IRD screen). Submission is always a
          deliberate action, never automatic — a slow or unavailable IRD service can never hold up billing.
        </p>
        <p>
          If an invoice that was already successfully filed with IRD is later cancelled, the submission is flagged
          "Credit note needed" — filing that credit note (reversing the original bill with IRD) is, again, a
          separate explicit action from the submission's detail page.
        </p>
        <p>
          Being able to submit to IRD from this software does <b>not</b> by itself mean your lab is officially
          registered with IRD for e-billing — that registration is a separate administrative process with IRD.
        </p>
      </>
    ),
  },
  {
    id: 'inventory',
    title: 'Inventory & purchasing',
    body: (
      <>
        <p>
          <b>Inventory</b> tracks reagents, kits, consumables and controls with stock levels, expiry tracking, and
          low-stock/expiring/expired alerts. <b>Suppliers</b> and <b>Purchase orders</b> manage restocking; receiving
          a purchase order's items increases stock on hand automatically.
        </p>
      </>
    ),
  },
  {
    id: 'branches',
    title: 'Multi-branch',
    body: (
      <>
        <p>
          If your lab operates more than one location, each branch is set up under <b>Branches</b>. Staff assigned a
          home branch only ever see that branch's orders, samples, and invoices — this is enforced by the server on
          every request, not just hidden in the screen. Staff with no home branch (typically administrators) see and
          can filter across every branch.
        </p>
      </>
    ),
  },
  {
    id: 'backups',
    title: 'Backups',
    body: (
      <>
        <p>
          The database is backed up automatically every night, and any Backup-permitted user can trigger one on
          demand from <b>Backups</b>. Each backup file holds the data only — restoring it means letting the software
          recreate its schema on a fresh database first, then loading the backup file into it. Old backup files are
          kept until someone removes them from the server's disk; the software does not delete them on its own.
        </p>
      </>
    ),
  },
  {
    id: 'roles',
    title: 'Roles, permissions & audit',
    body: (
      <>
        <p>
          <b>Users</b> and <b>Roles</b> (under Operations) manage who can do what — every screen and button in this
          software is gated by a specific permission, visible under Roles for each role.
        </p>
        <p>
          <b>Audit log</b> records every sensitive action across the system — who did what, when, and (for most
          actions) a before/after snapshot of what changed. Nothing in this software is ever silently deleted;
          cancelling, reversing, or correcting something always leaves the original record and the correction both
          visible in the audit trail. The audit log is exportable as CSV/XML for external review.
        </p>
      </>
    ),
  },
];

export function HelpPage() {
  const [activeId, setActiveId] = useState(SECTIONS[0]!.id);
  const active = SECTIONS.find((s) => s.id === activeId) ?? SECTIONS[0]!;

  return (
    <>
      <PageHeader title="Help" description="A guide to how LabOS's workflow fits together, screen by screen." />
      <div className="grid gap-4 lg:grid-cols-4">
        <Card className="lg:col-span-1">
          <nav className="p-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveId(s.id)}
                className={cn(
                  'block w-full rounded-md px-3 py-2 text-left text-sm',
                  activeId === s.id ? 'bg-primary/10 font-medium text-primary' : 'text-muted hover:bg-surface-muted',
                )}
              >
                {s.title}
              </button>
            ))}
          </nav>
        </Card>
        <Card className="lg:col-span-3">
          <CardHeader title={active.title} />
          <CardBody>
            <div className="max-w-3xl space-y-3 text-sm leading-relaxed text-foreground [&_p]:mb-3">{active.body}</div>
          </CardBody>
        </Card>
      </div>
    </>
  );
}
