import { ArrowRight, X, Check } from 'lucide-react';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { Photo } from '../components/Photo';
import { CONNECTED_WORKFLOW, IMAGES, TRADITIONAL_WORKFLOW } from '../data';

const PAIN_POINTS = [
  'Paper-heavy workflows and duplicate data entry',
  'Billing disconnected from the laboratory',
  'No clear view of where a sample is',
  'Result verification that slips through the cracks',
  'Reports scattered across machines and folders',
  'Financial records that never quite reconcile',
];

export function Problem() {
  return (
    <Section id="solutions">
      <Reveal>
        <SectionHeading
          eyebrow="The problem"
          title="Laboratory operations shouldn't depend on disconnected systems."
          lead="Most labs run on a patchwork of registers, spreadsheets, a billing package and a reporting tool that don't talk to each other. The cost is time, errors and lost revenue."
        />
      </Reveal>

      <Reveal delay={80}>
        <div className="mt-10 grid items-center gap-8 lg:grid-cols-2">
          <Photo
            src={IMAGES.problem.src}
            alt={IMAGES.problem.alt}
            ratio="4 / 3"
            objectPosition="center"
          />
          <ul className="grid gap-3">
            {PAIN_POINTS.map((p) => (
              <li key={p} className="flex items-start gap-3 rounded-lg border border-border bg-surface p-4 text-sm text-foreground">
                <X className="mt-0.5 h-4 w-4 shrink-0 text-red-500" aria-hidden />
                {p}
              </li>
            ))}
          </ul>
        </div>
      </Reveal>

      <Reveal delay={120}>
        <div className="mt-12 grid gap-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <div className="rounded-xl border border-border bg-surface p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">Traditional workflow</p>
            <ul className="mt-3 space-y-2">
              {TRADITIONAL_WORKFLOW.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-muted">
                  <span className="h-1.5 w-1.5 rounded-full bg-slate-300" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex justify-center">
            <span className="flex h-10 w-10 rotate-90 items-center justify-center rounded-full bg-primary/10 text-primary md:rotate-0">
              <ArrowRight className="h-5 w-5" aria-hidden />
            </span>
          </div>

          <div className="rounded-xl border border-primary/30 bg-primary/[0.04] p-5">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Connected workflow</p>
            <ul className="mt-3 space-y-2">
              {CONNECTED_WORKFLOW.map((s) => (
                <li key={s} className="flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />
                  {s}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </Reveal>
    </Section>
  );
}
