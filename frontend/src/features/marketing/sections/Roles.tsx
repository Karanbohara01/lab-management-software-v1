import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { ROLES } from '../data';

export function Roles() {
  return (
    <Section>
      <Reveal>
        <SectionHeading
          eyebrow="Role-based experience"
          title="Built around the people who run your laboratory."
          lead="Every role sees a focused workspace — the queues, actions and information that role needs, and nothing else."
        />
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ROLES.map((role, i) => (
          <Reveal key={role.title} delay={(i % 3) * 60} as="div">
            <div className="h-full rounded-xl border border-border bg-surface p-5">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <role.icon className="h-5 w-5" aria-hidden />
                </span>
                <h3 className="text-base font-semibold text-foreground">{role.title}</h3>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-1.5">
                {role.flow.map((f, j) => (
                  <Fragment key={f}>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">{f}</span>
                    {j < role.flow.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />}
                  </Fragment>
                ))}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted">{role.blurb}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
