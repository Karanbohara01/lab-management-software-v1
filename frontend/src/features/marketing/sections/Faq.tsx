import { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { FAQS } from '../data';

/** How many questions show before "Load More" — the section stays short until someone wants the rest. */
const INITIAL_COUNT = 4;

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const visible = expanded ? FAQS : FAQS.slice(0, INITIAL_COUNT);
  const hiddenCount = FAQS.length - INITIAL_COUNT;

  const toggleExpanded = () => {
    if (!expanded) {
      setExpanded(true);
      return;
    }
    setExpanded(false);
    // a question that's about to be hidden can't stay open
    setOpen((current) => (current !== null && current >= INITIAL_COUNT ? null : current));
    // the list just got shorter: keep the button where the visitor can still see it
    requestAnimationFrame(() => toggleRef.current?.scrollIntoView({ block: 'nearest' }));
  };

  return (
    <Section id="faq">
      <div className="grid gap-10 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:gap-16">
        <div>
          <Reveal>
            <SectionHeading
              title="Frequently Asked Questions"
              lead="Quick answers about how LIMS works in your laboratory."
            />
          </Reveal>

          <Reveal delay={80}>
            <ul className="mt-8 space-y-4">
              {visible.map((faq, i) => {
                const isOpen = open === i;
                return (
                  <li
                    key={faq.q}
                    className="rounded-2xl bg-surface shadow-[0_4px_18px_-6px_rgb(15_23_42/0.18)]"
                  >
                    <h3>
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-controls={`faq-panel-${i}`}
                        id={`faq-trigger-${i}`}
                        onClick={() => setOpen(isOpen ? null : i)}
                        className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left text-lg font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {faq.q}
                        <span
                          aria-hidden
                          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        >
                          {isOpen ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </span>
                      </button>
                    </h3>
                    <div
                      id={`faq-panel-${i}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${i}`}
                      hidden={!isOpen}
                      className="px-6 pb-5 text-sm leading-relaxed text-muted"
                    >
                      {faq.a}
                    </div>
                  </li>
                );
              })}
            </ul>

            {hiddenCount > 0 && (
              <button
                ref={toggleRef}
                type="button"
                aria-expanded={expanded}
                onClick={toggleExpanded}
                className="mt-6 inline-flex items-center rounded-full border border-foreground bg-surface/60 px-6 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {expanded ? 'Show Less' : `Load More (${hiddenCount})`}
              </button>
            )}
          </Reveal>
        </div>

        {/*
          Decorative, large screens only (it would just push the questions down on a phone). The
          illustration has a white backdrop and a soft floor shadow; `mix-blend-multiply` lets the
          white disappear into whatever is behind it so it floats on the page. That needs no
          ancestor to make its own stacking layer — which rules out <Reveal> (it's transformed) and
          `position: sticky` on a wrapper — so the image itself is the sticky element, following
          the list down when it's expanded. It fills its column up to max-w-xl, and on a short window
          it's held to the visible height (object-contain keeps its proportions) so it never gets
          cut off while it follows the list.
        */}
        <div className="hidden lg:block">
          <img
            src="/marketing/faq-question.webp"
            width={750}
            height={799}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            className="sticky top-28 ml-auto block h-auto w-full max-w-xl select-none object-contain object-right mix-blend-multiply lg:max-h-[calc(100vh-8rem)]"
          />
        </div>
      </div>
    </Section>
  );
}
