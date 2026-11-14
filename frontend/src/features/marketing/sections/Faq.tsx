import { useRef, useState } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Section, SectionHeading } from '../components/primitives';
import { buttonClasses } from '../components/buttonStyles';
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
                        className="flex w-full items-center justify-between gap-4 rounded-2xl px-6 py-5 text-left text-body-lg font-semibold text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        {faq.q}
                        <span
                          aria-hidden
                          className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary"
                        >
                          {/* Both icons stay mounted and crossfade — a rotate+opacity swap reads as one
                              continuous motion instead of Plus/Minus hard-swapping on toggle. */}
                          <Plus
                            className={cn(
                              'absolute h-4 w-4 transition-[opacity,transform] duration-200 ease-premium motion-reduce:transition-none',
                              isOpen ? 'rotate-45 opacity-0' : 'rotate-0 opacity-100',
                            )}
                          />
                          <Minus
                            className={cn(
                              'absolute h-4 w-4 transition-[opacity,transform] duration-200 ease-premium motion-reduce:transition-none',
                              isOpen ? 'rotate-0 opacity-100' : '-rotate-45 opacity-0',
                            )}
                          />
                        </span>
                      </button>
                    </h3>
                    {/* `grid-template-rows: 0fr → 1fr` is the dependency-free way to animate to the
                        content's natural height. `aria-hidden` stands in for the `hidden` attribute
                        this replaced, since a zero-height row alone doesn't pull collapsed content
                        out of the accessibility tree. */}
                    <div
                      style={{ gridTemplateRows: isOpen ? '1fr' : '0fr' }}
                      className="grid transition-[grid-template-rows] duration-300 ease-premium motion-reduce:transition-none"
                    >
                      <div
                        id={`faq-panel-${i}`}
                        role="region"
                        aria-labelledby={`faq-trigger-${i}`}
                        aria-hidden={!isOpen}
                        className={cn(
                          'overflow-hidden px-6 pb-5 text-pretty text-body-sm text-muted transition-opacity duration-200 ease-premium motion-reduce:transition-none',
                          isOpen ? 'opacity-100' : 'opacity-0',
                        )}
                      >
                        {faq.a}
                      </div>
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
                className={buttonClasses({ variant: 'secondary', size: 'lg', className: 'mt-6' })}
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
