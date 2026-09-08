import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';

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
      {container ? <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">{children}</div> : children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-primary">
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  lead,
  align = 'left',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  className?: string;
}) {
  return (
    <div className={cn('max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className={cn('text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl', eyebrow && 'mt-4')}>
        {title}
      </h2>
      {lead && <p className="mt-4 text-pretty text-base leading-relaxed text-muted sm:text-lg">{lead}</p>}
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  className?: string;
};

const VARIANTS: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
  secondary: 'border border-input bg-surface text-foreground hover:bg-surface-muted',
  ghost: 'text-foreground hover:bg-surface-muted',
};
const SIZES: Record<NonNullable<ButtonProps['size']>, string> = {
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

function baseClasses({ variant = 'primary', size = 'md', className }: ButtonProps) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}

/** Router link styled as a button (for /login and future in-app routes). */
export function LinkButton({ to, ...props }: ButtonProps & { to: string }) {
  return (
    <Link to={to} className={baseClasses(props)}>
      {props.children}
    </Link>
  );
}

/** Anchor styled as a button (for on-page CTAs and mailto). */
export function AnchorButton({ href, ...props }: ButtonProps & { href: string }) {
  return (
    <a href={href} className={baseClasses(props)}>
      {props.children}
    </a>
  );
}

export const DEMO_MAILTO =
  'mailto:sales@labos.example?subject=Demo%20request%20—%20LabOS%20Pathology%20Management';
export const SALES_MAILTO = 'mailto:sales@labos.example?subject=Talk%20to%20Sales%20—%20LabOS';
