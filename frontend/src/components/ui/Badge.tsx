import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger' | 'critical';

const TONES: Record<Tone, string> = {
  neutral: 'bg-muted-solid text-white',
  info: 'bg-primary text-primary-foreground',
  success: 'bg-success-muted text-white',
  warning: 'bg-warning-muted text-white',
  danger: 'bg-danger-muted text-white',
  critical: 'bg-critical-muted text-white',
};

/** Status tag. Always pairs colour with a text label — never colour alone. */
export function Badge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-[0.035em] whitespace-nowrap',
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}
