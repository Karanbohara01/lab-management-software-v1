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
          size="lg"
          title="Built around the people who run your laboratory."
          lead="Every role sees a focused workspace — the queues, actions and information that role needs, and nothing else."
        />
      </Reveal>

      {/* Flex rather than a grid so the last, shorter row sits in the middle instead of leaving a gap. */}
      <div className="mt-12 flex flex-wrap justify-center gap-5">
        {ROLES.map((role, i) => (
          <Reveal
            key={role.title}
            delay={(i % 3) * 60}
            as="div"
            className="w-full md:w-[calc((100%-1.25rem)/2)] xl:w-[calc((100%-2.5rem)/3)]"
          >
            <div className="group h-full rounded-2xl bg-surface p-5 shadow-[0_6px_20px_-10px_rgb(15_23_42/0.22)]">
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
                  <h3 className="text-xl font-bold text-foreground">{role.title}</h3>
                  <p className="mt-1 text-sm leading-snug text-muted">{role.blurb}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center gap-x-1 gap-y-1.5">
                {role.flow.map((f, j) => (
                  <Fragment key={f}>
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">{f}</span>
                    {j < role.flow.length - 1 && <ChevronRight className="h-3.5 w-3.5 text-muted" aria-hidden />}
                  </Fragment>
                ))}
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </Section>
  );
}
