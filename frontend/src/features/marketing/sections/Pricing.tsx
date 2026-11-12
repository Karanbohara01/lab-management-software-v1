import { ArrowRight, Building2, FlaskConical, Microscope, Star, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';
import { CheckBullet, Section, SectionHeading, LinkButton } from '../components/primitives';
import { TYPE } from '../components/typography';
import { Reveal } from '../components/Reveal';
import { PLANS } from '../data';

interface PlanLook {
  icon: LucideIcon;
  /** the icon tile — also the tint of the check tiles in the feature list */
  tile: string;
  /** the button, for plans that aren't the highlighted one (that one is a solid primary button) */
  outline: string;
  /** the illustration in the card's top-right corner (`public/marketing/pricing/`) and its size */
  art: { src: string; width: number; height: number };
}

/** Each plan has its own accent: the logo's teal and navy, and violet for the top tier. */
const LOOKS: Record<string, PlanLook> = {
  Starter: {
    icon: FlaskConical,
    tile: 'bg-success/10 text-success',
    outline: 'border-2 border-success/50 text-success hover:bg-success/5',
    art: { src: '/marketing/pricing/starter.webp', width: 124, height: 114 },
  },
  Professional: {
    icon: Microscope,
    tile: 'bg-primary/10 text-primary',
    outline: 'border-2 border-primary/50 text-primary hover:bg-primary/5',
    art: { src: '/marketing/pricing/professional.webp', width: 118, height: 118 },
  },
  Enterprise: {
    icon: Building2,
    tile: 'bg-violet-100 text-violet-600',
    outline: 'border-2 border-violet-300 text-violet-700 hover:bg-violet-50',
    art: { src: '/marketing/pricing/enterprise.webp', width: 98, height: 114 },
  },
};
const FALLBACK_LOOK = LOOKS.Professional!;

export function Pricing() {
  return (
    <Section id="pricing" className="bg-surface">
      <Reveal>
        <SectionHeading
          eyebrow="Pricing"
          title="A plan for every size of laboratory."
          lead="Transparent tiers, no per-report fees. We'll scope the right plan with you during the demo."
          align="center"
        />
      </Reveal>

      <div className="mt-12 grid gap-6 lg:grid-cols-3">
        {PLANS.map((plan, i) => {
          const look = LOOKS[plan.name] ?? FALLBACK_LOOK;
          const Icon = look.icon;
          return (
            // The highlighted card is lifted: its negative top margin makes it grow upward, so all three end on the same line.
            <Reveal key={plan.name} delay={i * 70} as="div" className={cn(plan.highlighted && 'lg:-mt-4')}>
              <div
                className={cn(
                  'relative flex h-full flex-col rounded-3xl border bg-surface p-6 sm:p-7',
                  plan.highlighted
                    ? 'border-2 border-primary bg-gradient-to-b from-primary/[0.06] to-surface shadow-[0_0_0_4px_hsl(var(--primary)/0.08),0_24px_48px_-24px_hsl(var(--primary)/0.5)]'
                    : 'border-border shadow-[0_10px_30px_-18px_rgb(15_23_42/0.28)]',
                )}
              >
                {/* The corner picture is hidden where a card is too narrow to share its top row (phones, and the
                    three-across layout just above tablet size). Its edges fade out so it blends into any card colour. */}
                <img
                  src={look.art.src}
                  width={look.art.width}
                  height={look.art.height}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  draggable={false}
                  className="pointer-events-none absolute right-4 top-4 hidden h-24 w-auto select-none [-webkit-mask-image:radial-gradient(closest-side,#000_86%,transparent)] [mask-image:radial-gradient(closest-side,#000_86%,transparent)] sm:block lg:hidden xl:block 2xl:h-28"
                />

                {plan.highlighted && (
                  <span
                    className={cn(
                      'mb-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-primary px-3 py-1 text-primary-foreground',
                      TYPE.label,
                    )}
                  >
                    <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                    Most Popular
                  </span>
                )}

                <div className="flex items-center gap-4 xl:min-h-[4.25rem] xl:pr-24 2xl:min-h-0 2xl:pr-28">
                  <span className={cn('flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl', look.tile)}>
                    <Icon className="h-7 w-7" aria-hidden />
                  </span>
                  <div className="min-w-0">
                    <h3 className={TYPE.h3}>{plan.name}</h3>
                    <p className={cn('mt-1.5', TYPE.bodySm)}>{plan.audience}</p>
                  </div>
                </div>

                <p className="mt-7 text-price tabular-nums text-foreground">Request pricing</p>

                <ul className="mt-5 flex-1 space-y-3">
                  {plan.features.map((f) => (
                    <CheckBullet key={f} tileClassName={look.tile}>
                      {f}
                    </CheckBullet>
                  ))}
                </ul>

                <LinkButton
                  to={`/signup?plan=${plan.name.toUpperCase()}`}
                  variant={plan.highlighted ? 'primary' : 'secondary'}
                  size="lg"
                  className={cn('mt-8 w-full', !plan.highlighted && look.outline)}
                >
                  Start free trial
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </LinkButton>
              </div>
            </Reveal>
          );
        })}
      </div>
    </Section>
  );
}
