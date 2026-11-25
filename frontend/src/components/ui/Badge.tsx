import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

export type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'critical';
export type BadgeVariant = 'solid' | 'subtle' | 'outline';

const SOLID_TONES: Record<Tone, string> = {
  neutral: 'bg-muted-solid text-white',
  info: 'bg-primary text-primary-foreground',
  success: 'bg-success-muted text-white',
  warning: 'bg-warning-muted text-white',
  danger: 'bg-danger-muted text-white',
  critical: 'bg-critical-muted text-white',
};

const SUBTLE_TONES: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-muted-foreground border border-border/80',
  info: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-success/10 text-success border border-success/20',
  warning: 'bg-warning/15 text-warning border border-warning/25',
  danger: 'bg-danger/10 text-danger border border-danger/20',
  critical: 'bg-critical/10 text-critical border border-critical/25',
};

const OUTLINE_TONES: Record<Tone, string> = {
  neutral: 'border border-border text-muted-foreground bg-transparent',
  info: 'border border-primary/50 text-primary bg-transparent',
  success: 'border border-success/50 text-success bg-transparent',
  warning: 'border border-warning/50 text-warning bg-transparent',
  danger: 'border border-danger/50 text-danger bg-transparent',
  critical: 'border border-critical/50 text-critical bg-transparent',
};

const DOT_COLORS: Record<Tone, string> = {
  neutral: 'bg-muted-foreground',
  info: 'bg-primary',
  success: 'bg-success',
  warning: 'bg-warning',
  danger: 'bg-danger',
  critical: 'bg-critical',
};

export interface BadgeProps {
  tone?: Tone;
  variant?: BadgeVariant;
  dot?: boolean;
  size?: 'sm' | 'md';
  icon?: ReactNode;
  className?: string;
  children: ReactNode;
}

/** Status tag. Always pairs colour with a text label — never colour alone. */
export function Badge({
  tone = 'neutral',
  variant = 'solid',
  dot = false,
  size = 'sm',
  icon,
  className,
  children,
}: BadgeProps) {
  const toneClasses =
    variant === 'subtle'
      ? SUBTLE_TONES[tone]
      : variant === 'outline'
        ? OUTLINE_TONES[tone]
        : SOLID_TONES[tone];

  const sizeClasses =
    size === 'md'
      ? 'px-2.5 py-1 text-xs font-semibold'
      : 'px-2 py-0.5 text-[10.5px] font-bold';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded uppercase tracking-[0.035em] whitespace-nowrap transition-colors tabular-nums',
        sizeClasses,
        toneClasses,
        className,
      )}
    >
      {dot && (
        <span
          className={cn(
            'mr-1.5 h-1.5 w-1.5 shrink-0 rounded-full',
            DOT_COLORS[tone],
          )}
          aria-hidden="true"
        />
      )}
      {icon && <span className="mr-1 inline-flex shrink-0">{icon}</span>}
      {children}
    </span>
  );
}
