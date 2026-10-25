import { useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

export interface TabItem<T extends string> {
  id: T;
  label: ReactNode;
}

export interface TabsProps<T extends string> {
  tabs: TabItem<T>[];
  value: T;
  onChange: (id: T) => void;
  className?: string;
}

/**
 * Was hand-rolled per page (PatientDetailPage had the only copy) — factored out so a second page
 * reaching for tabs doesn't recopy the markup. Adds Left/Right (and Home/End) arrow-key navigation
 * between tabs per the WAI-ARIA tabs pattern, which the original didn't have — cheap to add, a
 * real gap for keyboard users navigating a tablist with Tab alone otherwise.
 */
export function Tabs<T extends string>({ tabs, value, onChange, className }: TabsProps<T>) {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    let nextIndex: number | null = null;
    if (e.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
    else if (e.key === 'Home') nextIndex = 0;
    else if (e.key === 'End') nextIndex = tabs.length - 1;
    if (nextIndex === null) return;
    e.preventDefault();
    const next = tabs[nextIndex]!;
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div className={cn('flex gap-1 overflow-x-auto border-b border-border', className)} role="tablist">
      {tabs.map((t, i) => (
        <button
          key={t.id}
          ref={(el) => {
            refs.current[t.id] = el;
          }}
          type="button"
          role="tab"
          aria-selected={value === t.id}
          tabIndex={value === t.id ? 0 : -1}
          onClick={() => onChange(t.id)}
          onKeyDown={(e) => onKeyDown(e, i)}
          className={cn(
            'whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium',
            value === t.id ? 'border-primary text-primary' : 'border-transparent text-muted hover:text-foreground',
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
