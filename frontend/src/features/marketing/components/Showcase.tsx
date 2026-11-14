import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { Reveal } from './Reveal';
import { CheckBullet, SectionHeading } from './primitives';

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
  wideText = false,
}: {
  id?: string;
  eyebrow: string;
  title: ReactNode;
  lead: ReactNode;
  points?: string[];
  media: ReactNode;
  flip?: boolean;
  tinted?: boolean;
  /**
   * From 1280px up, give the text everything the picture does not need: the picture's column
   * shrinks to the mock-up's own minimum width (38rem) at most, and the text takes the rest — so
   * the section fills the page width instead of leaving the text column narrow beside a wide gap.
   */
  wideText?: boolean;
}) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-16 sm:py-24', tinted && 'bg-surface')}>
      {/* The picture's column is a little wider than the text's, so the product mock-ups aren't cut off. */}
      <div
        className={cn(
          'mx-auto grid max-w-page items-center gap-10 px-4 sm:px-6 lg:gap-14 lg:px-8',
          flip ? 'lg:grid-cols-[1.12fr_0.88fr]' : 'lg:grid-cols-[0.88fr_1.12fr]',
          wideText && 'xl:gap-10',
          wideText && (flip ? 'xl:grid-cols-[minmax(38.25rem,1fr)_minmax(0,1fr)]' : 'xl:grid-cols-[minmax(0,1fr)_minmax(38.25rem,1fr)]'),
        )}
      >
        <Reveal className={cn('min-w-0', flip && 'lg:order-2')}>
          <SectionHeading eyebrow={eyebrow} title={title} lead={lead} size="lg" />
          {points && (
            <ul className="mt-8 space-y-3.5">
              {points.map((p) => (
                <CheckBullet key={p}>{p}</CheckBullet>
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
