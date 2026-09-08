import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { FAQS } from '../data';

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
        <Reveal>
          <SectionHeading eyebrow="FAQ" title="Questions, answered." />
        </Reveal>

        <Reveal delay={80}>
          <ul className="divide-y divide-border rounded-xl border border-border bg-surface">
            {FAQS.map((faq, i) => {
              const isOpen = open === i;
              return (
                <li key={faq.q}>
                  <h3>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={`faq-panel-${i}`}
                      id={`faq-trigger-${i}`}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {faq.q}
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted transition-transform motion-reduce:transition-none ${isOpen ? 'rotate-180' : ''}`}
                        aria-hidden
                      />
                    </button>
                  </h3>
                  <div
                    id={`faq-panel-${i}`}
                    role="region"
                    aria-labelledby={`faq-trigger-${i}`}
                    hidden={!isOpen}
                    className="px-5 pb-4 text-sm leading-relaxed text-muted"
                  >
                    {faq.a}
                  </div>
                </li>
              );
            })}
          </ul>
        </Reveal>
      </div>
    </Section>
  );
}
