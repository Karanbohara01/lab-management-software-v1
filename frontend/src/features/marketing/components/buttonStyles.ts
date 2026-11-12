import { cn } from '@/lib/cn';

export type ButtonStyleProps = {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'md' | 'lg';
  className?: string;
};

const VARIANTS: Record<NonNullable<ButtonStyleProps['variant']>, string> = {
  primary: 'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
  secondary: 'border border-input bg-surface text-foreground hover:bg-surface-muted',
  ghost: 'text-foreground hover:bg-surface-muted',
};
// The `button` tokens carry the label's size, weight and tracking (see tailwind.config.js).
const SIZES: Record<NonNullable<ButtonStyleProps['size']>, string> = {
  md: 'h-10 px-4 text-button',
  lg: 'h-12 px-6 text-button-lg',
};

/** The shared look of every marketing button — also usable on elements that aren't links (e.g. a dialog trigger). */
export function buttonClasses({ variant = 'primary', size = 'md', className }: ButtonStyleProps) {
  return cn(
    'inline-flex items-center justify-center gap-2 rounded-lg transition-colors',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    VARIANTS[variant],
    SIZES[size],
    className,
  );
}
