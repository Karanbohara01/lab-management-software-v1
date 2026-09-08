import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, id, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const areaId = id ?? generatedId;
    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label htmlFor={areaId} className="text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={areaId}
          rows={rows}
          aria-invalid={!!error || undefined}
          className={cn(
            'w-full rounded-md border bg-surface px-3 py-2 text-base text-foreground',
            'placeholder:text-muted focus-visible:ring-2 focus-visible:ring-ring',
            error ? 'border-danger' : 'border-input',
            className,
          )}
          {...props}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
