import { ChevronRight } from 'lucide-react';
import { Fragment } from 'react';
import { cn } from '@/lib/cn';
import { Section, SectionHeading } from '../components/primitives';
import { TYPE } from '../components/typography';
import { Reveal, staggerDelay } from '../components/Reveal';
import { ROLES } from '../data';

export function Roles() {
  return (
    <Section>
      <Reveal>
        <SectionHeading
          eyebrow="Role-based experience"
          size="lg"
          title="Built around the people who run your laboratory."
          lead="Every role sees a focused workspace — the queues, actions and information that role needs, and nothing else."
        />
      </Reveal>

      {/* 6-column grid system:
          - Row 1 (Clinical): 3 cards spanning 2 columns each (1/3 width)
          - Row 2 (Operations): 2 cards spanning 3 columns each (1/2 width)
          Outer edges align perfectly flush on left and right, with zero awkward gaps. */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-6 gap-5">
        {ROLES.map((role, i) => {
          const colSpan =
            i < 3
              ? 'md:col-span-3 lg:col-span-2'
              : i === 4
              ? 'md:col-span-6 lg:col-span-3'
              : 'md:col-span-3 lg:col-span-3';

          return (
            <Reveal
              key={role.title}
              delay={staggerDelay(i)}
              as="div"
              className={cn('w-full', colSpan)}
            >
              <div
                className={cn(
                  'group flex h-full flex-col justify-between rounded-2xl bg-surface p-5 shadow-[0_6px_20px_-10px_rgb(15_23_42/0.22)]',
                  'transition-[transform,box-shadow] duration-200 ease-premium',
                  'hover:-translate-y-1 hover:shadow-[0_14px_32px_-12px_rgb(15_23_42/0.28)]',
                  'motion-reduce:transition-none motion-reduce:hover:translate-y-0',
                )}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={role.image}
                    width={160}
                    height={160}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    draggable={false}
                    className="h-[5.5rem] w-[5.5rem] shrink-0 select-none object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  <div className="min-w-0">
                    <h3 className={TYPE.h3}>{role.title}</h3>
                    <p className={cn('mt-1.5', TYPE.bodySm)}>{role.blurb}</p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-x-1.5 gap-y-1.5 pt-3 border-t border-border/40">
                  {role.flow.map((f, j) => (
                    <Fragment key={f}>
                      <span className="rounded-md bg-primary/10 px-2 py-0.5 text-caption font-semibold text-primary">{f}</span>
                      {j < role.flow.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />}
                    </Fragment>
                  ))}
                </div>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
