import type { ReactNode } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';
import { Eyebrow } from './primitives';

/** Alternating text / product-mock layout used by every showcase section. */
export function Showcase({
  id,
  eyebrow,
  title,
  lead,
  points,
  media,
  flip = false,
  tinted = false,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  points?: string[];
  media: ReactNode;
  flip?: boolean;
  tinted?: boolean;
}) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-16 sm:py-24', tinted && 'bg-surface')}>
      {/* The picture's column is a little wider than the text's, so the product mock-ups aren't cut off. */}
      <div
        className={cn(
          'mx-auto grid max-w-page items-center gap-10 px-4 sm:px-6 lg:gap-14 lg:px-8',
          flip ? 'lg:grid-cols-[1.12fr_0.88fr]' : 'lg:grid-cols-[0.88fr_1.12fr]',
        )}
      >
        <Reveal className={cn('min-w-0', flip && 'lg:order-2')}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-5 text-balance text-3xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-4xl xl:text-[2.6rem]">
            {title}
          </h2>
          <p className="mt-5 max-w-2xl text-pretty text-[18px] leading-relaxed text-muted sm:text-[20px]">{lead}</p>
          {points && (
            <ul className="mt-7 space-y-3.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-[17px] font-medium leading-snug text-foreground">
                  <span className="mt-px flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
                  </span>
                  {p}
                </li>
              ))}
            </ul>
          )}
        </Reveal>

        <Reveal delay={100} className={cn('min-w-0', flip && 'lg:order-1')}>
          {media}
        </Reveal>
      </div>
    </section>
  );
}
