import { Check, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface Step {
  id: string;
  label: string;
  description?: string;
  timestamp?: string | null;
  actor?: string | null;
}

export interface StatusStepperProps {
  steps: Step[];
  currentStepId: string;
  isFailed?: boolean;
  failedLabel?: string;
  className?: string;
  compact?: boolean;
}

export function StatusStepper({
  steps,
  currentStepId,
  isFailed = false,
  failedLabel,
  className,
  compact = false,
}: StatusStepperProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStepId);

  if (compact) {
    return (
      <div className={cn('inline-flex items-center gap-1.5', className)} aria-label="Status progress">
        {steps.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;
          return (
            <div key={step.id} className="flex items-center gap-1">
              <span
                title={`${step.label}${isCurrent ? ' (Current)' : isDone ? ' (Completed)' : ''}`}
                className={cn(
                  'h-2 rounded-full transition-all',
                  isCurrent
                    ? isFailed
                      ? 'w-5 bg-danger'
                      : 'w-5 bg-primary'
                    : isDone
                      ? 'w-2 bg-success'
                      : 'w-2 bg-border',
                )}
              />
              {idx < steps.length - 1 && <span className="h-0.5 w-1 bg-border/50" />}
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <nav aria-label="Progress" className={cn('w-full', className)}>
      <ol className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-2">
        {steps.map((step, idx) => {
          const isDone = currentIndex > idx;
          const isCurrent = currentIndex === idx;

          return (
            <li
              key={step.id}
              className={cn(
                'relative flex-1 flex sm:flex-col items-center gap-3 sm:gap-1.5 text-left sm:text-center w-full',
              )}
            >
              {/* Connector line on desktop */}
              {idx > 0 && (
                <div
                  aria-hidden="true"
                  className={cn(
                    'hidden sm:block absolute top-3.5 right-1/2 left-[-50%] h-0.5 -translate-y-1/2 transition-colors',
                    isDone || (isCurrent && !isFailed) ? 'bg-primary' : 'bg-border',
                  )}
                />
              )}

              {/* Step indicator node */}
              <div
                className={cn(
                  'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-all shadow-sm',
                  isDone
                    ? 'bg-success text-success-foreground'
                    : isCurrent
                      ? isFailed
                        ? 'bg-danger text-danger-foreground ring-4 ring-danger/20'
                        : 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                      : 'border border-border bg-surface text-muted-foreground',
                )}
              >
                {isDone ? (
                  <Check className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                ) : isCurrent && isFailed ? (
                  <AlertCircle className="h-3.5 w-3.5 stroke-[2.5]" aria-hidden="true" />
                ) : (
                  <span>{idx + 1}</span>
                )}
              </div>

              {/* Step text */}
              <div className="flex-1 sm:w-full">
                <p
                  className={cn(
                    'text-xs font-semibold tracking-tight',
                    isCurrent
                      ? isFailed
                        ? 'text-danger'
                        : 'text-primary'
                      : isDone
                        ? 'text-foreground'
                        : 'text-muted',
                  )}
                >
                  {isCurrent && isFailed && failedLabel ? failedLabel : step.label}
                </p>
                {step.timestamp && (
                  <p className="text-[11px] text-muted font-mono tabular-nums">
                    {step.timestamp}
                  </p>
                )}
                {step.actor && (
                  <p className="text-[10px] text-muted truncate max-w-[120px] mx-auto">
                    {step.actor}
                  </p>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
