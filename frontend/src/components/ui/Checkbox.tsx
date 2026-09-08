import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode;
  hint?: ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, label, hint, id, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;
    return (
      <div className="flex gap-2.5">
        <input
          ref={ref}
          id={inputId}
          type="checkbox"
          className={cn(
            'mt-0.5 h-4 w-4 shrink-0 rounded border-input text-primary',
            'focus-visible:ring-2 focus-visible:ring-ring',
            className,
          )}
          {...props}
        />
        <label htmlFor={inputId} className="text-sm text-foreground">
          {label}
          {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
        </label>
      </div>
    );
  },
);
Checkbox.displayName = 'Checkbox';
