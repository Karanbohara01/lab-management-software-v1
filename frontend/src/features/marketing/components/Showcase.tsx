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
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal className={cn('min-w-0', flip && 'lg:order-2')}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-4 text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-4 text-pretty leading-relaxed text-muted">{lead}</p>
          {points && (
            <ul className="mt-6 space-y-2.5">
              {points.map((p) => (
                <li key={p} className="flex items-start gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden />
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
