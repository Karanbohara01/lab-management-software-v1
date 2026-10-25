import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Check, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface ComboboxOption {
  value: string;
  label: string;
}

export interface ComboboxProps {
  label?: string;
  error?: string;
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Shown when no option is selected and the list is closed — defaults to placeholder. */
  disabled?: boolean;
  /** Allows clearing back to no selection via a trailing × button. */
  clearable?: boolean;
  className?: string;
}

/**
 * A searchable single-select, for option lists too long to scan as plain <option> rows (e.g. a
 * 100-doctor referring-physician picker) — Select.tsx stays the right choice for short, fixed
 * lists (status filters, categories) where a native <select> is simpler and perfectly usable;
 * swapping those would be pure churn. Controlled value/onChange like every other form control
 * here, not wired to react-hook-form's register() directly (it isn't a native form element) — use
 * react-hook-form's Controller to bind this one where that matters.
 */
export function Combobox({
  label,
  error,
  options,
  value,
  onChange,
  placeholder = 'Search…',
  disabled,
  clearable = true,
  className,
}: ComboboxProps) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((o) => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery('');
      }
    }
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [open]);

  useEffect(() => {
    if (open) {
      setActiveIndex(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    listRef.current?.children[activeIndex]?.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  const choose = (opt: ComboboxOption) => {
    onChange(opt.value);
    setOpen(false);
    setQuery('');
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[activeIndex]) choose(filtered[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
    }
  };

  const listboxId = `${generatedId}-listbox`;

  return (
    <div className={cn('flex flex-col gap-1.5', className)} ref={rootRef}>
      {label && (
        <label htmlFor={generatedId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <div className="relative">
        <button
          type="button"
          id={generatedId}
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-10 w-full items-center justify-between gap-2 rounded-md border bg-surface px-3 text-base text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-danger' : 'border-input',
          )}
        >
          <span className={cn('truncate text-left', !selected && 'text-muted')}>
            {selected ? selected.label : placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {clearable && selected && !disabled && (
              <X
                className="h-3.5 w-3.5 text-muted hover:text-foreground"
                aria-label="Clear selection"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange('');
                }}
              />
            )}
            <ChevronDown className="h-4 w-4 text-muted" aria-hidden />
          </span>
        </button>

        {open && (
          <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-surface shadow-card">
            <input
              ref={inputRef}
              role="combobox"
              aria-expanded={open}
              aria-controls={listboxId}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={placeholder}
              className="h-9 w-full border-b border-border bg-transparent px-3 text-sm text-foreground placeholder:text-muted focus:outline-none"
            />
            <ul id={listboxId} role="listbox" ref={listRef} className="max-h-60 overflow-y-auto py-1">
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-muted">No matches</li>
              ) : (
                filtered.map((opt, i) => (
                  <li
                    key={opt.value}
                    role="option"
                    aria-selected={opt.value === value}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      choose(opt);
                    }}
                    onMouseEnter={() => setActiveIndex(i)}
                    className={cn(
                      'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-sm',
                      i === activeIndex ? 'bg-primary/10 text-foreground' : 'text-foreground',
                    )}
                  >
                    <span className="truncate">{opt.label}</span>
                    {opt.value === value && <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden />}
                  </li>
                ))
              )}
            </ul>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
