import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { buttonClasses, type ButtonStyleProps } from './buttonStyles';
import { TYPE } from './typography';

/** Section shell with consistent vertical rhythm and a centered max-width container. */
export function Section({
  id,
  children,
  className,
  container = true,
}: {
  id?: string;
  children: ReactNode;
  className?: string;
  container?: boolean;
}) {
  return (
    <section id={id} className={cn('scroll-mt-20 py-16 sm:py-24', className)}>
      {container ? <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">{children}</div> : children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-primary',
        TYPE.label,
      )}
    >
      {children}
    </span>
  );
}

/**
 * The one section-heading recipe. `lg` is the product-tour voice (the showcases, the problem
 * statement); `md` is for the quieter sections (pricing, about, blog, FAQ). Both share weight,
 * tracking and the spacing to the eyebrow and lead — only the size step and the measure differ.
 */
export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  size = 'md',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  size?: 'md' | 'lg';
  className?: string;
}) {
  const large = size === 'lg';
  return (
    <div className={cn(large ? 'max-w-3xl' : 'max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className={cn('text-balance text-foreground', large ? 'text-display-2' : 'text-display-3', eyebrow && 'mt-4')}>
        {title}
      </h2>
      {lead && <p className="mt-5 text-pretty text-lead text-muted">{lead}</p>}
    </div>
  );
}

/** A checklist item with the tinted check tile — the one bullet recipe for every feature list. */
export function CheckBullet({
  children,
  className,
  tileClassName,
}: {
  children: ReactNode;
  className?: string;
  /** Override the tile's tint (default: the brand navy). */
  tileClassName?: string;
}) {
  return (
    <li className={cn('flex items-start gap-3', TYPE.bullet, className)}>
      <span
        className={cn(
          'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary',
          tileClassName,
        )}
      >
        <Check className="h-3.5 w-3.5" strokeWidth={3} aria-hidden />
      </span>
      {children}
    </li>
  );
}

type ButtonProps = ButtonStyleProps & { children: ReactNode };

/** Router link styled as a button (for /login and future in-app routes). */
export function LinkButton({ to, ...props }: ButtonProps & { to: string }) {
  return (
    <Link to={to} className={buttonClasses(props)}>
      {props.children}
    </Link>
  );
}

/** Anchor styled as a button (for on-page CTAs and mailto). */
export function AnchorButton({ href, ...props }: ButtonProps & { href: string }) {
  return (
    <a href={href} className={buttonClasses(props)}>
      {props.children}
    </a>
  );
}

export const SALES_MAILTO = 'mailto:sales@labos.example?subject=Talk%20to%20Sales%20—%20LIMS';
