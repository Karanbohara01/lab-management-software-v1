import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Section, SectionHeading, AnchorButton, DEMO_MAILTO } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { PLANS } from '../data';

export function Pricing() {
  return (
    <Section id="pricing" className="bg-surface">
      <Reveal>
        <SectionHeading
          eyebrow="Pricing"
          title="A plan for every size of laboratory."
          lead="Transparent tiers, no per-report fees. We'll scope the right plan with you during the demo."
          align="center"
        />
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-3 lg:items-start">
        {PLANS.map((plan, i) => (
          <Reveal key={plan.name} delay={i * 70} as="div">
            <div
              className={cn(
                'flex h-full flex-col rounded-2xl border bg-background p-6',
                plan.highlighted ? 'border-primary shadow-card lg:-mt-4 lg:pb-10' : 'border-border',
              )}
            >
              {plan.highlighted && (
                <span className="mb-4 inline-flex w-fit rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Most popular
                </span>
              )}
              <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
              <p className="mt-1 text-sm text-muted">{plan.audience}</p>
              <p className="mt-4 text-2xl font-semibold text-foreground">Request pricing</p>
              <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm text-foreground">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <AnchorButton
                href={DEMO_MAILTO}
                variant={plan.highlighted ? 'primary' : 'secondary'}
                className="mt-6 w-full"
              >
                Request a Demo
              </AnchorButton>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
