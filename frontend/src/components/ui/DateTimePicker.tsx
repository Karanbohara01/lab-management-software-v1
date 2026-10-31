import { useEffect, useId, useRef, useState } from 'react';
import { DayPicker } from 'react-day-picker';
import { Calendar } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface DateTimePickerProps {
  label?: string;
  error?: string;
  /** Local "YYYY-MM-DDTHH:mm" (same shape a native datetime-local input uses) — empty = unset. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Disallow picking a day before this one (e.g. today, for booking forward-dated slots only). */
  minDate?: Date;
  className?: string;
}

function parseValue(value: string): { date: Date | undefined; time: string } {
  if (!value) return { date: undefined, time: '09:00' };
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = (datePart ?? '').split('-').map(Number);
  if (!y || !m || !d) return { date: undefined, time: timePart?.slice(0, 5) || '09:00' };
  return { date: new Date(y, m - 1, d), time: timePart?.slice(0, 5) || '09:00' };
}

function formatValue(date: Date, time: string): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${time}`;
}

function displayLabel(value: string): string | null {
  const { date, time } = parseValue(value);
  if (!date) return null;
  const [h, min] = time.split(':').map(Number);
  const combined = new Date(date.getFullYear(), date.getMonth(), date.getDate(), h, min);
  return combined.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

/**
 * A real calendar-dropdown date + time picker — the bare `<input type="datetime-local">` it
 * replaces renders inconsistently (sometimes with no visible calendar affordance at all, as seen
 * live) and reads as unpolished next to the rest of the UI kit. Internally still just produces the
 * same local "YYYY-MM-DDTHH:mm" string a datetime-local input would, so call sites that already
 * do `new Date(value).toISOString()` at submit time need no other changes.
 */
export function DateTimePicker({
  label,
  error,
  value,
  onChange,
  placeholder = 'Pick a date & time',
  disabled,
  minDate,
  className,
}: DateTimePickerProps) {
  const generatedId = useId();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const { date, time } = parseValue(value);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Escape') return;
      // Capture phase + stopPropagation, not just a plain bubble listener: Modal.tsx has its own
      // document-level Escape handler that closes the whole dialog, registered the moment the
      // modal opens — earlier than this one, which only exists while the popover itself is open.
      // Without outrunning it via capture, Escape would close the popover AND the modal at once.
      e.stopPropagation();
      setOpen(false);
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onKeyDown, { capture: true });
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onKeyDown, { capture: true });
    };
  }, [open]);

  useEffect(() => {
    // The panel is position:absolute inside whatever scrolls (often a Modal body with its own
    // overflow-y-auto) — without this, a trigger near the bottom of that scroll area opens a
    // calendar that's silently clipped by the ancestor's overflow instead of pushing it into
    // view. scrollIntoView bubbles through every scrollable ancestor, not just the window.
    if (open) panelRef.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }, [open]);

  const label_ = displayLabel(value);

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
            'flex h-10 w-full items-center gap-2 rounded-md border bg-surface px-3 text-left text-sm text-foreground',
            'focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-danger' : 'border-input',
          )}
        >
          <Calendar className="h-4 w-4 shrink-0 text-muted" aria-hidden />
          <span className={cn('flex-1 truncate', !label_ && 'text-muted')}>{label_ ?? placeholder}</span>
        </button>

        {open && (
          <div
            ref={panelRef}
            className="absolute z-20 mt-1 w-[19rem] overflow-hidden rounded-md border border-border bg-surface p-3 shadow-card"
          >
            <DayPicker
              mode="single"
              selected={date}
              onSelect={(picked) => {
                if (!picked) return;
                onChange(formatValue(picked, time));
              }}
              disabled={minDate ? { before: minDate } : undefined}
              showOutsideDays
              classNames={{
                months: 'flex flex-col',
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
                day_today: 'font-semibold text-primary',
                day_outside: 'text-muted/50',
                day_disabled: 'text-muted/40 hover:bg-transparent cursor-not-allowed',
                day_hidden: 'invisible',
              }}
            />
            <div className="mt-2 flex items-center gap-2 border-t border-border pt-2.5">
              <label htmlFor={`${generatedId}-time`} className="text-xs font-medium text-muted">
                Time
              </label>
              <input
                id={`${generatedId}-time`}
                type="time"
                value={time}
                onChange={(e) => onChange(formatValue(date ?? new Date(), e.target.value))}
                className="h-8 flex-1 rounded-md border border-input bg-surface px-2 text-sm text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}
      </div>
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
