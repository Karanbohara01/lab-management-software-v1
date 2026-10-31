import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/cn';
import { buttonClasses, type ButtonStyleProps } from './buttonStyles';

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
  size = 'md',
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  lead?: ReactNode;
  align?: 'left' | 'center';
  /** `lg` is the bolder, bigger heading used through the product-tour sections. */
  size?: 'md' | 'lg';
  className?: string;
}) {
  const large = size === 'lg';
  return (
    <div className={cn(large ? 'max-w-3xl' : 'max-w-2xl', align === 'center' && 'mx-auto text-center', className)}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2
        className={cn(
          'text-balance text-3xl tracking-tight text-foreground sm:text-4xl',
          large ? 'font-extrabold leading-[1.1] xl:text-[2.6rem]' : 'font-semibold',
          eyebrow && (large ? 'mt-5' : 'mt-4'),
        )}
      >
        {title}
      </h2>
      {lead && (
        <p
          className={cn(
            'text-pretty leading-relaxed text-muted',
            large ? 'mt-5 text-[18px] sm:text-[20px]' : 'mt-4 text-base sm:text-lg',
          )}
        >
          {lead}
        </p>
      )}
    </div>
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
