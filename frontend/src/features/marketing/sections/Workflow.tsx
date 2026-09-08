import { Fragment } from 'react';
import { ChevronRight } from 'lucide-react';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { WORKFLOW_STEPS } from '../data';

export function Workflow() {
  return (
    <Section id="how-it-works" className="bg-surface">
      <Reveal>
        <SectionHeading
          eyebrow="One connected flow"
          title="One platform. Every laboratory workflow."
          lead="From the front desk to the pathologist's sign-off to the accountant's ledger — each stage hands off to the next without re-keying a thing."
          align="center"
        />
      </Reveal>

      <Reveal delay={80}>
        <ol className="mx-auto mt-12 flex max-w-4xl flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {WORKFLOW_STEPS.map((step, i) => (
            <Fragment key={step}>
              <li className="rounded-full border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground sm:text-sm">
                <span className="mr-1.5 text-primary">{String(i + 1).padStart(2, '0')}</span>
                {step}
              </li>
              {i < WORKFLOW_STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              )}
            </Fragment>
          ))}
        </ol>
      </Reveal>

      <Reveal delay={120}>
        <p className="mx-auto mt-10 max-w-2xl text-center text-sm text-muted">
          Confirm an order and the samples, invoice and result worklist are created automatically.
          Approve the results and the report is one click away.
        </p>
      </Reveal>
    </Section>
  );
}
