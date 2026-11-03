import { useEffect, useId, useRef, useState } from 'react';
import { DayPicker, type DateRange } from 'react-day-picker';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DateRangeValue {
  /** YYYY-MM-DD, inclusive. */
  from: string;
  /** YYYY-MM-DD, inclusive. */
  to: string;
}

export interface DateRangePickerProps {
  value: DateRangeValue | null;
  onChange: (value: DateRangeValue) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  /** Days after this one cannot be picked (a revenue report has no future). */
  maxDate?: Date;
  className?: string;
  /** Where the popover opens relative to the trigger. */
  align?: 'left' | 'right';
}

function parse(iso: string | undefined): Date | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return undefined;
  return new Date(y, m - 1, d);
}

function format(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

const DAY_PICKER_CLASSES = {
  months: 'flex flex-col gap-4 sm:flex-row',
  month: 'space-y-2',
  caption: 'flex items-center justify-between px-1 pb-1',
  caption_label: 'text-sm font-medium text-foreground',
  nav: 'flex items-center gap-1',
  nav_button:
    'flex h-7 w-7 items-center justify-center rounded-md text-muted hover:bg-surface-muted hover:text-foreground',
  nav_button_previous: '',
  nav_button_next: '',
  table: 'w-full border-collapse',
  head_row: 'flex',
  head_cell: 'w-9 text-center text-[11px] font-medium uppercase text-muted',
  row: 'flex w-full',
  cell: 'p-0 text-center',
  day: 'h-9 w-9 rounded-md text-sm text-foreground hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-ring',
  day_selected: 'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground',
  day_range_start: 'rounded-r-none',
  day_range_end: 'rounded-l-none',
  day_range_middle: 'rounded-none bg-primary/15 text-foreground hover:bg-primary/25',
  day_today: 'font-semibold text-primary',
  day_outside: 'text-muted/50',
  day_disabled: 'text-muted/40 hover:bg-transparent cursor-not-allowed',
  day_hidden: 'invisible',
};

/** "4 Nov – 20 Nov 2026", or a single day when both ends match. */
export function formatDateRange(value: DateRangeValue | null): string | null {
  if (!value) return null;
  const from = parse(value.from);
  const to = parse(value.to);
  if (!from || !to) return null;
  const long: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' };
  if (value.from === value.to) return from.toLocaleDateString(undefined, long);
  const sameYear = from.getFullYear() === to.getFullYear();
  const start = from.toLocaleDateString(undefined, sameYear ? { day: 'numeric', month: 'short' } : long);
  return `${start} – ${to.toLocaleDateString(undefined, long)}`;
}

/**
 * A two-month calendar for picking an inclusive date range — the same react-day-picker the
 * appointment picker uses, in range mode, so the two calendars look and behave alike. The value
 * is a pair of plain ISO dates: the server, not the browser, decides what instants a day spans.
 */
export function DateRangePicker({
  value,
  onChange,
  label,
  placeholder = 'Pick a date range',
  disabled,
  maxDate,
  className,
  align = 'left',
}: DateRangePickerProps) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<DateRange | undefined>(undefined);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setDraft({ from: parse(value?.from), to: parse(value?.to) });
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      e.stopPropagation();
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown, { capture: true });
    };
    // Only when the popover opens: the draft starts from the committed value each time.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const text = formatDateRange(value);
  const complete = !!draft?.from && !!draft?.to;

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
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn(
            'flex h-9 w-full items-center gap-2 rounded-md border border-input bg-surface px-3 text-left text-sm text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <span className={cn('flex-1 truncate', !text && 'text-muted')}>{text ?? placeholder}</span>
        </button>

        {open && (
          <div
            role="dialog"
            aria-label="Choose a date range"
            className={cn(
              'absolute z-30 mt-1 rounded-md border border-border bg-surface p-3 shadow-card',
              align === 'right' ? 'right-0' : 'left-0',
            )}
          >
            <DayPicker
              mode="range"
              numberOfMonths={2}
              selected={draft}
              onSelect={setDraft}
              defaultMonth={parse(value?.from) ?? new Date()}
              disabled={maxDate ? { after: maxDate } : undefined}
              showOutsideDays
              classNames={DAY_PICKER_CLASSES}
            />
            <div className="mt-2 flex items-center justify-between gap-2 border-t border-border pt-2.5">
              <p className="text-xs text-muted">
                {draft?.from && !draft.to
                  ? 'Now pick the last day'
                  : complete
                    ? formatDateRange({ from: format(draft!.from!), to: format(draft!.to!) })
                    : 'Pick the first day'}
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-md px-2.5 py-1.5 text-xs font-medium text-muted hover:bg-surface-muted hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!complete}
                  onClick={() => {
                    if (!complete) return;
                    onChange({ from: format(draft!.from!), to: format(draft!.to!) });
                    setOpen(false);
                  }}
                  className="rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
