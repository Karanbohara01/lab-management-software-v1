import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: ReactNode;
  leadingIcon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leadingIcon, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {leadingIcon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {leadingIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-invalid={!!error || undefined}
            aria-describedby={describedBy}
            className={cn(
              'h-10 w-full rounded-md border bg-surface px-3 text-base text-foreground',
              'placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring',
              'disabled:cursor-not-allowed disabled:opacity-60',
              leadingIcon && 'pl-9',
              error ? 'border-danger' : 'border-input',
              className,
            )}
            {...props}
          />
        </div>
        {error ? (
          <p id={`${inputId}-error`} className="text-sm text-danger">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';
