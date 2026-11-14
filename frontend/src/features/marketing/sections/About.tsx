import type { ComponentType, SVGProps } from 'react';
import { cn } from '@/lib/cn';
import { initials } from '@/lib/initials';
import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { FacebookGlyph, InstagramGlyph, LinkedInGlyph, ThreadsGlyph } from '../components/SocialIcons';
import { PRODUCT_NAME } from '../data';
import '../components/orbit.css';
import { useLeadership, type Leader } from '../leadership';

interface Network {
  key: 'linkedinUrl' | 'facebookUrl' | 'instagramUrl' | 'threadsUrl';
  label: string;
  Icon: ComponentType<SVGProps<SVGSVGElement>>;
  /** Drawn on every photo, ready for its link. Otherwise it is drawn only once a link has been added. */
  always: boolean;
}

const NETWORKS: Network[] = [
  { key: 'linkedinUrl', label: 'LinkedIn', Icon: LinkedInGlyph, always: true },
  { key: 'facebookUrl', label: 'Facebook', Icon: FacebookGlyph, always: true },
  { key: 'instagramUrl', label: 'Instagram', Icon: InstagramGlyph, always: true },
  { key: 'threadsUrl', label: 'Threads', Icon: ThreadsGlyph, always: false },
];

/** Where the first button starts, in degrees anticlockwise from 3 o'clock (top right); the rest follow evenly. */
const FIRST_ANGLE = 50;

/** A point on the photo's circle, as left/top percentages of its square box. */
function onCircle(degrees: number): { left: string; top: string } {
  const radians = (degrees * Math.PI) / 180;
  return { left: `${50 + 50 * Math.cos(radians)}%`, top: `${50 - 50 * Math.sin(radians)}%` };
}

/**
 * The round buttons, revolving round the photo (see orbit.css). LinkedIn, Facebook and Instagram are
 * always there; each one opens its profile once a link has been added, and until then is just the
 * icon (never a link that goes nowhere). Threads appears only when it has a link. However many
 * there are, they are spaced evenly round the circle. `reverse` sends them the other way round.
 */
function SocialButtons({ leader, reverse }: { leader: Leader; reverse: boolean }) {
  const shown = NETWORKS.filter((n) => n.always || leader[n.key]);
  const direction = reverse ? ({ animationDirection: 'reverse' } as const) : undefined;

  return (
    <div className="orbit-ring pointer-events-none absolute inset-0" style={direction}>
      {shown.map(({ key, label, Icon }, i) => {
        const href = leader[key];
        const classes = cn(
          'pointer-events-auto absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-white shadow-md ring-2 ring-white',
          key === 'linkedinUrl' ? 'bg-success' : 'bg-slate-400',
        );
        const icon = <Icon className="h-[0.95rem] w-[0.95rem]" />;
        return (
          <div
            key={key}
            data-orbit-anchor
            className="absolute z-10 h-0 w-0"
            style={onCircle(FIRST_ANGLE + (360 / shown.length) * i)}
          >
            <div className="orbit-counter" style={direction}>
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`${leader.name} on ${label}`}
                  title={label}
                  data-network={label}
                  className={cn(
                    classes,
                    'transition duration-200 hover:scale-110 hover:bg-primary focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring motion-reduce:transition-none motion-reduce:hover:scale-100',
                  )}
                >
                  {icon}
                </a>
              ) : (
                <span aria-hidden data-network={label} className={cn(classes, 'cursor-default')}>
                  {icon}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/** The photo in a circle with the social buttons around its edge — or the initials until there is a photo. */
function Portrait({ leader, reverse }: { leader: Leader; reverse: boolean }) {
  return (
    <div className="orbit-group relative mx-auto my-4 aspect-square w-full max-w-[9.5rem] md:my-0 md:max-w-[11rem]">
      <span aria-hidden className="absolute -inset-2.5 rounded-full bg-primary/10" />
      <div className="absolute inset-0 overflow-hidden rounded-full bg-surface-muted shadow-[0_12px_28px_-12px_rgb(15_23_42/0.45)] ring-[5px] ring-white">
        {leader.photoDataUri ? (
          <img
            src={leader.photoDataUri}
            alt={`${leader.name}, ${leader.title}`}
            width={176}
            height={176}
            loading="lazy"
            decoding="async"
            draggable={false}
            className="h-full w-full select-none object-cover"
          />
        ) : (
          <span
            aria-hidden
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary to-primary/70 text-4xl font-bold text-primary-foreground"
          >
            {initials(leader.name)}
          </span>
        )}
      </div>
      <SocialButtons leader={leader} reverse={reverse} />
    </div>
  );
}

/** One leader: photo on one side, name / role / description on the other. `flip` swaps the sides on wide screens. */
function LeaderRow({ leader, flip }: { leader: Leader; flip: boolean }) {
  return (
    <article
      className={cn(
        'grid items-center gap-6 py-8 md:gap-14 lg:py-10',
        // The photo's column is 11rem of photo + 1.125rem each side for the buttons that revolve past its
        // edge (16px button + 2px ring), so nothing visible ever goes beyond the navbar's left/right edges.
        flip ? 'md:grid-cols-[13.25rem_minmax(0,1fr)]' : 'md:grid-cols-[minmax(0,1fr)_13.25rem]',
      )}
    >
      <Reveal delay={80} className={cn('min-w-0 md:px-[1.125rem]', flip ? 'md:order-1' : 'md:order-2')}>
        <Portrait leader={leader} reverse={flip} />
      </Reveal>
      <Reveal className={cn('min-w-0', flip ? 'md:order-2' : 'md:order-1')}>
        <h3 className="text-display-3 text-foreground">{leader.name}</h3>
        <p className="mt-2 text-label uppercase text-primary">{leader.title}</p>
        <span aria-hidden className="mt-4 block h-1 w-12 rounded-full bg-success" />
        {leader.description && (
          <p className="mt-4 whitespace-pre-line text-pretty text-body text-muted">{leader.description}</p>
        )}
      </Reveal>
    </article>
  );
}

function LeaderSkeleton() {
  return (
    <div aria-hidden className="grid animate-pulse items-center gap-6 py-8 md:grid-cols-[13.25rem_minmax(0,1fr)] md:gap-14">
      <div className="md:px-[1.125rem]">
        <div className="mx-auto aspect-square w-full max-w-[9.5rem] rounded-full bg-surface-muted md:max-w-[11rem]" />
      </div>
      <div className="space-y-4">
        <div className="h-8 w-2/3 rounded bg-surface-muted" />
        <div className="h-4 w-1/4 rounded bg-surface-muted" />
        <div className="h-3 w-full rounded bg-surface-muted" />
        <div className="h-3 w-5/6 rounded bg-surface-muted" />
      </div>
    </div>
  );
}

export function About() {
  const { status, leaders } = useLeadership();

  return (
    <Section id="about">
      <Reveal>
        <SectionHeading
          className="max-w-none" // run the full page width, like the navbar and the profiles below
          eyebrow="About us"
          title="Software for laboratories, built around how they work."
          lead={`${PRODUCT_NAME} is a laboratory information management system for pathology labs, diagnostic centers and hospital laboratories in Nepal — one connected platform from patient registration to the printed report and the invoice.`}
        />
      </Reveal>

      {/* The people behind it — managed from the platform admin's Leadership page. They run the full
          width of the page, so the text starts where the navbar's logo starts and the photos end where
          its buttons end. If none can be loaded (or none have been named yet) this just doesn't render,
          rather than showing an error. */}
      {status === 'loading' && (
        <div className="mt-6 divide-y divide-border">
          <LeaderSkeleton />
          <LeaderSkeleton />
        </div>
      )}
      {status === 'ready' && leaders.length > 0 && (
        <ul aria-label="Leadership" className="mt-6 divide-y divide-border">
          {leaders.map((leader, i) => (
            <li key={leader.id}>
              <LeaderRow leader={leader} flip={i % 2 === 1} />
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
