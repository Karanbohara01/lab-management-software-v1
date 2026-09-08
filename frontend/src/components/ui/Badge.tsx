import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'critical';

const TONES: Record<Tone, string> = {
  neutral: 'bg-surface-muted text-muted-foreground ring-border',
  info: 'bg-primary/10 text-primary ring-primary/20',
  success: 'bg-success/10 text-success ring-success/20',
  warning: 'bg-warning/10 text-warning ring-warning/20',
  danger: 'bg-danger/10 text-danger ring-danger/20',
  critical: 'bg-critical/15 text-critical ring-critical/30',
};

/** Status pill. Always pairs colour with a text label — never colour alone. */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
