import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { FEATURES } from '../data';

export function Features() {
  return (
    <Section id="features">
      <Reveal>
        <SectionHeading
          eyebrow="Capabilities"
          title="Everything a laboratory runs on, in one place."
          lead="Each module is built for the way labs actually work — and every module connects to the next."
        />
      </Reveal>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature, i) => (
          <Reveal key={feature.title} delay={(i % 3) * 60} as="div">
            <div className="group h-full rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-card">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <feature.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{feature.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{feature.description}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
