import { ArrowRight } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { AnchorButton, DEMO_MAILTO } from '../components/primitives';
import { SCIENCE_TEXTURE } from '../components/Photo';
import { FloatingCard, MockBadge, MockShell, MockStat, MockStatGrid, MockTable, MockWindow } from '../components/MockUI';

const ALERTS = [
  { tone: 'success', title: 'Sample collected', subtitle: 'S000244 · EDTA · 10:41 AM' },
  { tone: 'critical', title: 'Critical result', subtitle: 'Potassium 6.6 mmol/L — flagged' },
  { tone: 'info', title: 'Invoice accepted', subtitle: 'INV-2082/83-000124 · e-Billing' },
] as const;

function HeroMock() {
  return (
    <div className="relative">
      <MockWindow title="LabOS — Dashboard" canvasClassName="min-w-[44rem]">
        <MockShell active="Dashboard">
          <p className="text-xs font-semibold text-foreground">Today at the laboratory</p>
          <div className="mt-3">
            <MockStatGrid>
              <MockStat label="Today's patients" value="48" />
              <MockStat label="Pending samples" value="12" />
              <MockStat label="Awaiting verification" value="7" />
              <MockStat label="Reports today" value="31" />
              <MockStat label="Today's revenue" value="NPR 84,200" hint="▲ 12%" />
              <MockStat label="e-Billing" value="All accepted" />
            </MockStatGrid>
          </div>
          <div className="mt-3">
            <MockTable
              columns={[
                { key: 'a', header: 'Accession' },
                { key: 'b', header: 'Patient' },
                { key: 'c', header: 'Dept.' },
                { key: 'd', header: 'Status', align: 'right' },
              ]}
              rows={[
                ['S000241', 'Anil Sharma', 'Hematology', <MockBadge tone="success">Verified</MockBadge>],
                ['S000242', 'Sita Rai', 'Biochemistry', <MockBadge tone="warning">Processing</MockBadge>],
                ['S000243', 'Ramesh Thapa', 'Serology', <MockBadge tone="info">Received</MockBadge>],
              ]}
            />
          </div>
        </MockShell>
      </MockWindow>

      {/* Live activity — a compact strip below the mock at every size, so it
          never overlaps or clips the interface. */}
      <ul className="mt-4 grid gap-2 sm:grid-cols-3">
        {ALERTS.map((a) => (
          <li key={a.title}>
            <FloatingCard {...a} className="h-full" />
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-28 sm:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(60%_50%_at_70%_25%,black,transparent)]"
        style={{ backgroundImage: SCIENCE_TEXTURE }}
      />
      <div className="mx-auto grid max-w-6xl items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal className="min-w-0">
          <p className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
            Laboratory information management
          </p>
          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.1] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            The operating system for modern laboratories.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
            Manage patients, laboratory orders, samples, results, reports, billing, payments and
            e-Billing workflows from one connected platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <AnchorButton href={DEMO_MAILTO} size="lg">
              Request a Demo
              <ArrowRight className="h-4 w-4" aria-hidden />
            </AnchorButton>
            <AnchorButton href="#product" variant="secondary" size="lg">
              Explore Platform
            </AnchorButton>
          </div>
          <p className="mt-6 text-sm text-muted">
            Built for pathology labs, diagnostic centers and hospital laboratories.
          </p>
        </Reveal>

        <Reveal delay={120} className="min-w-0 lg:pl-4">
          <HeroMock />
        </Reveal>
      </div>
    </section>
  );
}
