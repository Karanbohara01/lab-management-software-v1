import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';

export const IMPORT_STEPS = [
  'Upload',
  'Map columns',
  'Review',
  'Confirm',
  'Progress',
  'Summary',
] as const;

export type ImportStep = (typeof IMPORT_STEPS)[number];

/**
 * Where the administrator is in the import, and how much is left.
 *
 * <p>Steps already passed are shown with a tick rather than a number, which is the one cue that
 * reads at a glance on a long screen. On a phone the labels collapse to the current step's name
 * alone — six labels across 390 pixels would be unreadable, and the only one that matters is the
 * one you are on.
 */
export function ImportStepper({ current }: { current: number }) {
  const t = useT();
  return (
    <nav aria-label={t('Import progress')} className="mb-6">
      <ol className="hidden items-center gap-1 sm:flex">
        {IMPORT_STEPS.map((label, index) => {
          const done = index < current;
          const active = index === current;
          return (
            <li key={label} className="flex flex-1 items-center gap-2 last:flex-none">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-caption font-semibold',
                  done && 'border-primary bg-primary text-primary-foreground',
                  active && 'border-primary bg-primary/10 text-primary',
                  !done && !active && 'border-border bg-surface text-muted',
                )}
                aria-hidden
              >
                {done ? <Check className="h-4 w-4" /> : index + 1}
              </span>
              <span
                className={cn(
                  'whitespace-nowrap text-caption',
                  active ? 'font-semibold text-foreground' : 'text-muted',
                )}
              >
                {t(label)}
                {active && <span className="sr-only"> {t('(current step)')}</span>}
              </span>
              {index < IMPORT_STEPS.length - 1 && (
                <span className={cn('mx-1 h-px flex-1', done ? 'bg-primary' : 'bg-border')} aria-hidden />
              )}
            </li>
          );
        })}
      </ol>

      <p className="text-caption text-muted sm:hidden">
        {t('Step {current} of {total}', { current: current + 1, total: IMPORT_STEPS.length })}
        <span className="mx-1.5">·</span>
        <span className="font-semibold text-foreground">{t(IMPORT_STEPS[current] ?? '')}</span>
      </p>
    </nav>
  );
}
