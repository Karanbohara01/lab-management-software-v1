import { MapPin, ShieldCheck, Users } from 'lucide-react';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { PRODUCT_NAME } from '../data';

const PRINCIPLES = [
  {
    icon: MapPin,
    title: 'Made for Nepal',
    body: 'Billing in NPR, Bikram Sambat invoice dates and an e-Billing workflow built around the IRD submission process — not bolted on afterwards.',
  },
  {
    icon: ShieldCheck,
    title: 'Honest by design',
    body: 'A bill is never shown as submitted, or a report as released, unless it really was. Every status, attempt and change stays on the record.',
  },
  {
    icon: Users,
    title: 'Built for the whole team',
    body: 'Receptionists, technicians, pathologists, accountants and administrators each get the screens and permissions their job needs.',
  },
] as const;

export function About() {
  return (
    <Section id="about">
      <Reveal>
        <SectionHeading
          eyebrow="About us"
          title="Software for laboratories, built around how they work."
          lead={`${PRODUCT_NAME} is a laboratory information management system for pathology labs, diagnostic centers and hospital laboratories in Nepal — one connected platform from patient registration to the printed report and the invoice.`}
        />
      </Reveal>

      <div className="mt-12 grid gap-4 md:grid-cols-3">
        {PRINCIPLES.map((p, i) => (
          <Reveal key={p.title} delay={i * 60} as="div">
            <div className="h-full rounded-xl border border-border bg-surface p-5">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <p.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 text-base font-semibold text-foreground">{p.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted">{p.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
