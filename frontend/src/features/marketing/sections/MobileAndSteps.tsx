import type { ReactNode } from 'react';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { MockBadge } from '../components/MockUI';

/* --------------------------------------------------------- Mobile experience */

function Phone({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-[190px] rounded-[1.75rem] border-[6px] border-slate-800 bg-surface shadow-popover">
      <div className="rounded-[1.25rem] overflow-hidden">
        <div className="flex items-center justify-between bg-surface-muted/60 px-3 py-2 text-[10px] font-medium text-muted">
          <span>{title}</span>
          <span>9:41</span>
        </div>
        <div className="p-3">{children}</div>
      </div>
    </div>
  );
}

export function MobileShowcase() {
  return (
    <Section className="bg-surface">
      <Reveal>
        <SectionHeading
          eyebrow="Anywhere"
          title="Your laboratory doesn't stop at the desktop."
          lead="Collection staff at the draw station, technicians at the bench, a pathologist reviewing between cases — every screen is designed for the device in hand."
          align="center"
        />
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          <Phone title="Samples">
            <ul className="space-y-2 text-[10px]">
              {[['S000241', 'success', 'Received'], ['S000242', 'warning', 'Processing'], ['S000243', 'info', 'Collected']].map(([id, tone, s]) => (
                <li key={id} className="flex items-center justify-between rounded-md border border-border p-2">
                  <span className="font-mono text-foreground">{id}</span>
                  <MockBadge tone={tone as 'success'}>{s}</MockBadge>
                </li>
              ))}
            </ul>
          </Phone>
          <Phone title="Result entry">
            <div className="rounded-md border border-primary/30 bg-primary/5 p-2 text-[10px]">
              <p className="font-semibold text-foreground">Ramesh Thapa · 67y M</p>
              <p className="text-muted">CBC · S000243</p>
            </div>
            <div className="mt-2 space-y-1.5 text-[10px]">
              <div className="flex items-center justify-between rounded border border-border p-1.5"><span>Haemoglobin</span><span className="font-semibold">14.2</span></div>
              <div className="flex items-center justify-between rounded border border-border p-1.5"><span>Potassium</span><span className="font-semibold text-red-600">6.6 ⚠</span></div>
            </div>
          </Phone>
          <Phone title="Dashboard">
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {[['Patients', '48'], ['Samples', '12'], ['To verify', '7'], ['Revenue', '84.2k']].map(([l, v]) => (
                <div key={l} className="rounded border border-border p-1.5">
                  <p className="text-muted">{l}</p>
                  <p className="font-semibold text-foreground">{v}</p>
                </div>
              ))}
            </div>
          </Phone>
        </div>
      </Reveal>
    </Section>
  );
}

/* --------------------------------------------------------------- How it works */

const STEPS = [
  { n: '01', title: 'Register your patients', text: 'Add patients with referring doctor and history in seconds.' },
  { n: '02', title: 'Manage tests and samples', text: 'Raise orders, generate samples and track them by barcode.' },
  { n: '03', title: 'Verify results and generate reports', text: 'Enter results, verify, approve and produce professional reports.' },
  { n: '04', title: 'Manage billing and operations', text: 'Invoice, collect payments, run inventory and see the whole lab.' },
];

export function HowItWorks() {
  return (
    <Section>
      <Reveal>
        <SectionHeading eyebrow="Getting started" title="Up and running in four steps." align="center" />
      </Reveal>
      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {STEPS.map((s, i) => (
          <Reveal key={s.n} delay={i * 60} as="div">
            <div className="h-full rounded-xl border border-border bg-surface p-5">
              <span className="text-2xl font-semibold text-primary/30">{s.n}</span>
              <h3 className="mt-2 text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{s.text}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
