import type { ReactNode } from 'react';
import { ScanBarcode } from 'lucide-react';
import { Showcase } from '../components/Showcase';
import { MockBadge, MockShell, MockTable, MockWindow } from '../components/MockUI';
import { Photo } from '../components/Photo';
import { IMAGES } from '../data';

/* ------------------------------------------------------------------ Patients */

function PatientsMock() {
  return (
    <MockWindow title="LabOS — Patients" canvasClassName="min-w-[44rem]">
      <MockShell active="Patients">
        <div className="mb-3 flex items-center justify-between gap-2">
          <input
            readOnly
            value="Search name, MRN or phone"
            className="h-8 w-44 rounded-md border border-input bg-surface-muted px-2 text-[11px] text-muted"
          />
          <span className="rounded-md bg-primary px-2 py-1.5 text-[11px] font-medium text-primary-foreground">
            Register patient
          </span>
        </div>
        <MockTable
            columns={[
              { key: 'mrn', header: 'MRN' },
              { key: 'name', header: 'Name' },
              { key: 'age', header: 'Age/Sex' },
              { key: 'ref', header: 'Referred by' },
              { key: 's', header: 'Status', align: 'right' },
            ]}
            rows={[
              ['P000241', 'Anil Sharma', '54 / M', 'Dr. A. Sharma', <MockBadge tone="success">Active</MockBadge>],
              ['P000242', 'Sita Rai', '32 / F', 'Dr. B. Thapa', <MockBadge tone="success">Active</MockBadge>],
              ['P000243', 'Ramesh Thapa', '67 / M', '—', <MockBadge tone="success">Active</MockBadge>],
              ['P000244', 'Gita Gurung', '28 / F', 'Dr. A. Sharma', <MockBadge tone="success">Active</MockBadge>],
            ]}
        />
        <div className="mt-3 rounded-lg border border-border p-3">
          <p className="text-[11px] font-semibold text-foreground">Anil Sharma · P000241</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <MockBadge tone="info">3 orders</MockBadge>
            <MockBadge tone="neutral">2 reports</MockBadge>
            <MockBadge tone="neutral">Last visit 12 Aug</MockBadge>
          </div>
        </div>
      </MockShell>
    </MockWindow>
  );
}

export function PatientsShowcase() {
  return (
    <Showcase
      id="product"
      eyebrow="Patients"
      title="Start every investigation with a complete patient record."
      lead="Register in seconds and open a longitudinal view of the patient — every order, invoice and report in one place."
      points={[
        'Auto-generated MRN and fast registration',
        'Referring doctor and referral history',
        'Previous tests, reports and billing history',
        'Search by name, MRN or phone',
      ]}
      media={<PatientsMock />}
    />
  );
}

/* ------------------------------------------------------------------- Samples */

function SamplesMock() {
  const steps = ['Order', 'Collected', 'Received', 'Processing', 'Result', 'Verified'];
  return (
    <MockWindow title="LabOS — Sample S000242">
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-xs font-semibold text-foreground">S000242</p>
            <p className="text-[11px] text-muted">Sita Rai · P000242 · Serum</p>
          </div>
          <MockBadge tone="success">Received</MockBadge>
        </div>

        <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-surface-muted/50 p-3">
          <ScanBarcode className="h-8 w-8 text-foreground" aria-hidden />
          <div className="flex h-9 flex-1 items-end gap-[2px]">
            {Array.from({ length: 34 }).map((_, i) => (
              <span key={i} className="w-[2px] bg-foreground" style={{ height: `${(i * 37) % 100}%` }} />
            ))}
          </div>
          <span className="font-mono text-[11px] tracking-wider text-foreground">S000242</span>
        </div>

        <ol className="mt-4 space-y-3">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-3">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-semibold ${
                  i <= 2 ? 'bg-primary text-primary-foreground' : 'border border-border text-muted'
                }`}
              >
                {i + 1}
              </span>
              <span className={`text-xs ${i <= 2 ? 'font-medium text-foreground' : 'text-muted'}`}>{s}</span>
              {i <= 2 && <span className="ml-auto text-[10px] text-muted">10:{38 + i} AM</span>}
            </li>
          ))}
        </ol>
      </div>
    </MockWindow>
  );
}

function SamplesMedia() {
  return (
    <div className="space-y-4">
      <SamplesMock />
      <div className="flex items-center gap-3">
        <Photo
          src={IMAGES.samples.src}
          alt={IMAGES.samples.alt}
          ratio="1 / 1"
          className="w-24 shrink-0 rounded-xl sm:w-28"
        />
        <p className="text-sm leading-relaxed text-muted">
          Bench work stays hands-on — LabOS keeps the digital trail for every specimen behind it.
        </p>
      </div>
    </div>
  );
}

export function SamplesShowcase() {
  return (
    <Showcase
      eyebrow="Sample tracking"
      title="Know where every specimen is."
      lead="Samples are generated the moment an order is confirmed, each with a unique accession number and barcode. Scan or look one up at any point."
      points={[
        'One sample per specimen type, grouped automatically',
        'Code 128 barcode labels, print-ready',
        'Collection → receipt → rejection → recollection',
        'A full tracking timeline with who and when',
      ]}
      media={<SamplesMedia />}
      flip
      tinted
    />
  );
}

/* ------------------------------------------------------------------- Results */

function ResultsMock() {
  const rows: [string, string, string, string, ReactNode][] = [
    ['Haemoglobin', '14.2', 'g/dL', '13 – 17', <MockBadge tone="success">Normal</MockBadge>],
    ['WBC', '7,800', '/µL', '4,000 – 11,000', <MockBadge tone="success">Normal</MockBadge>],
    ['Platelets', '112,000', '/µL', '150,000 – 450,000', <MockBadge tone="warning">Low</MockBadge>],
    ['Potassium', '6.6', 'mmol/L', '3.5 – 5.1', <MockBadge tone="critical">Critical high</MockBadge>],
  ];
  return (
    <MockWindow title="LabOS — Result entry · CBC" canvasClassName="min-w-[38rem]">
      <div className="p-4">
        <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-[11px]">
          <span className="font-semibold text-foreground">Ramesh Thapa</span>
          <span className="mx-2 font-mono text-muted">P000243</span>
          <span className="text-muted">67y · M · S000243</span>
        </div>
        <MockTable
          columns={[
            { key: 'p', header: 'Parameter' },
            { key: 'r', header: 'Result' },
            { key: 'u', header: 'Unit' },
            { key: 'ref', header: 'Reference' },
            { key: 'f', header: 'Flag', align: 'right' },
          ]}
          rows={rows.map((r) => [r[0], <span className="font-semibold">{r[1]}</span>, r[2], r[3], r[4]])}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="rounded-md border border-input px-2 py-1 text-[11px] text-muted">Save</span>
          <span className="flex gap-1.5">
            <span className="rounded-md border border-input px-2 py-1 text-[11px] text-muted">Verify</span>
            <span className="rounded-md bg-primary px-2 py-1 text-[11px] font-medium text-primary-foreground">Approve</span>
          </span>
        </div>
      </div>
    </MockWindow>
  );
}

function ResultsMedia() {
  return (
    <div className="space-y-4">
      <ResultsMock />
      <div>
        <Photo
          src={IMAGES.pathologist.src}
          alt={IMAGES.pathologist.alt}
          ratio="16 / 9"
          objectPosition="72% 42%"
          imgClassName="[filter:saturate(0.9)_contrast(1.02)]"
        />
        <p className="mt-2.5 text-sm leading-relaxed text-muted">
          Every value is reviewed by a person — a technician verifies, a pathologist approves — before it leaves the lab.
        </p>
      </div>
    </div>
  );
}

export function ResultsShowcase() {
  return (
    <Showcase
      eyebrow="Result management"
      title="Results designed for laboratory professionals."
      lead="Enter numeric, text or categorical values against each parameter. Reference ranges resolve automatically for the patient's age and sex, with abnormal and critical flagging built in."
      points={[
        'Automatic reference-range resolution',
        'Abnormal and critical value flagging',
        'Technician verification, then pathologist approval',
        'Every change kept in the result history',
      ]}
      media={<ResultsMedia />}
    />
  );
}

/* ------------------------------------------------------------------- Reports */

function ReportMock() {
  return (
    <MockWindow title="LabOS — Report RPT000124" canvasClassName="min-w-[24rem]">
      <div className="bg-white p-5 text-[11px] text-slate-800">
        <div className="flex items-start justify-between border-b-2 border-slate-800 pb-2">
          <div>
            <p className="text-sm font-bold uppercase">Your Laboratory Name</p>
            <p className="text-[10px]">New Baneshwor, Kathmandu · PAN 301234567</p>
          </div>
          <p className="text-[10px] font-semibold">LABORATORY REPORT</p>
        </div>
        <div className="grid grid-cols-2 gap-x-6 gap-y-0.5 border-b border-slate-800 py-2 text-[10px]">
          <p><span className="inline-block w-16 font-semibold">Patient</span> Ramesh Thapa</p>
          <p><span className="inline-block w-20 font-semibold">Referred by</span> Dr. A. Sharma</p>
          <p><span className="inline-block w-16 font-semibold">MRN</span> P000243</p>
          <p><span className="inline-block w-20 font-semibold">Report date</span> 07 Sep 2026</p>
        </div>
        <p className="mt-2 text-[11px] font-bold uppercase">Complete Blood Count</p>
        <table className="mt-1 w-full">
          <thead>
            <tr className="border-b border-slate-300 text-left text-[10px]">
              <th className="py-1">Investigation</th><th>Result</th><th>Unit</th><th>Reference</th>
            </tr>
          </thead>
          <tbody className="text-[10px]">
            <tr className="border-b border-slate-100"><td className="py-1">Haemoglobin</td><td className="font-semibold">14.2</td><td>g/dL</td><td>13 – 17</td></tr>
            <tr className="border-b border-slate-100"><td className="py-1">Platelets</td><td className="font-semibold">112,000 <span className="text-amber-600">L</span></td><td>/µL</td><td>150,000 – 450,000</td></tr>
          </tbody>
        </table>
        <div className="mt-6 flex justify-end gap-10 text-[9px]">
          <div className="text-center"><div className="h-6 w-24 border-b border-slate-400" />Lab Technician</div>
          <div className="text-center"><div className="h-6 w-24 border-b border-slate-400" />Consultant Pathologist</div>
        </div>
      </div>
      <div className="flex gap-2 border-t border-border bg-surface p-3">
        {['Print', 'Download', 'Share', 'Send'].map((a) => (
          <span key={a} className="rounded-md border border-input px-2 py-1 text-[11px] text-muted">{a}</span>
        ))}
      </div>
    </MockWindow>
  );
}

export function ReportShowcase() {
  return (
    <Showcase
      eyebrow="Reports"
      title="Turn verified results into professional reports."
      lead="A consolidated report is generated from approved results with your laboratory identity, patient and sample details, reference ranges, flags and signatures — in a print- and PDF-ready layout."
      points={[
        'Your letterhead, logo and PAN/VAT details',
        'Technician and pathologist attribution',
        'Release and delivery tracking',
        'Regenerate as more results are approved',
      ]}
      media={<ReportMock />}
      flip
      tinted
    />
  );
}
