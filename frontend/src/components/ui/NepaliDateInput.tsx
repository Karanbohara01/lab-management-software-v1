import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { Calendar, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useT } from '@/i18n';
import {
  BS_YEAR_MAX,
  BS_YEAR_MIN,
  NEPALI_MONTHS,
  getDaysInBsMonth,
  parseBsDate,
  formatBsDate,
  adToBs,
} from '@/lib/nepaliDate';

export interface NepaliDateInputProps {
  label?: string;
  value: string; // YYYY-MM-DD in BS
  onChange: (value: string) => void;
  error?: string;
  hint?: ReactNode;
  placeholder?: string;
  disabled?: boolean;
  minYear?: number;
  maxYear?: number;
  className?: string;
  id?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function NepaliDateInput({
  label,
  value,
  onChange,
  error,
  hint,
  placeholder = 'YYYY-MM-DD',
  disabled = false,
  minYear = BS_YEAR_MIN,
  maxYear = BS_YEAR_MAX,
  className,
  id,
}: NepaliDateInputProps) {
  const t = useT();
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const containerRef = useRef<HTMLDivElement>(null);

  const [openPicker, setOpenPicker] = useState(false);
  const [internalText, setInternalText] = useState(value ?? '');

  // Synchronize internal text if external value changes
  useEffect(() => {
    setInternalText(value ?? '');
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    if (!openPicker) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpenPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openPicker]);

  const parsed = useMemo(() => parseBsDate(internalText), [internalText]);

  // Current BS year for defaults
  const currentBsYear = useMemo(() => {
    const todayBs = adToBs(new Date());
    return todayBs?.year ?? 2083;
  }, []);

  const selectedYear = parsed?.year ?? currentBsYear;
  const selectedMonth = parsed?.month ?? 1;
  const selectedDay = parsed?.day ?? 1;

  const maxDays = useMemo(
    () => getDaysInBsMonth(selectedYear, selectedMonth),
    [selectedYear, selectedMonth],
  );

  const years = useMemo(() => {
    const list: number[] = [];
    for (let y = maxYear; y >= minYear; y--) {
      list.push(y);
    }
    return list;
  }, [minYear, maxYear]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    setInternalText(text);
    onChange(text);
  };

  const handleDropdownChange = (newYear: number, newMonth: number, newDay: number) => {
    const daysInMonth = getDaysInBsMonth(newYear, newMonth);
    const clampedDay = Math.min(newDay, daysInMonth);
    const formatted = `${newYear}-${pad(newMonth)}-${pad(clampedDay)}`;
    setInternalText(formatted);
    onChange(formatted);
  };

  const handleClear = () => {
    setInternalText('');
    onChange('');
    setOpenPicker(false);
  };

  // Determine helper message: formatted date if valid, or error, or hint
  const formattedHelper = useMemo(() => {
    if (!parsed) return null;
    const enLabel = formatBsDate(parsed, 'en');
    const neLabel = formatBsDate(parsed, 'ne');
    return `${enLabel} (${neLabel.split(' BS')[0]})`;
  }, [parsed]);

  return (
    <div ref={containerRef} className="flex flex-col gap-1.5 relative">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}

      <div className="relative flex items-center">
        <input
          id={inputId}
          type="text"
          value={internalText}
          onChange={handleTextChange}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          aria-invalid={!!error || undefined}
          className={cn(
            'h-10 w-full rounded-md border bg-surface pl-3 pr-16 text-base text-foreground font-mono',
            'placeholder:text-muted placeholder:font-sans focus-visible:ring-2 focus-visible:ring-ring',
            'disabled:cursor-not-allowed disabled:opacity-60',
            error ? 'border-danger' : 'border-input',
            className,
          )}
        />

        <div className="absolute right-1 flex items-center gap-0.5">
          {internalText && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-muted hover:text-foreground rounded transition-colors"
              title={t('Clear date')}
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => !disabled && setOpenPicker((o) => !o)}
            disabled={disabled}
            className={cn(
              'p-1.5 rounded transition-colors text-muted hover:text-foreground hover:bg-muted/10',
              openPicker && 'text-primary bg-primary/10',
            )}
            title={t('Pick Bikram Sambat date')}
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Popover for selecting Year / Month / Day */}
      {openPicker && (
        <div
          role="dialog"
          aria-label={t('Select Bikram Sambat date')}
          className="absolute z-50 top-full left-0 mt-1 w-full min-w-[280px] p-3 rounded-lg border border-border bg-surface shadow-lg text-sm space-y-3"
        >
          <div className="flex items-center justify-between pb-2 border-b border-border/50 text-xs font-semibold text-muted uppercase tracking-wider">
            <span>{t('Bikram Sambat (B.S.) Date')}</span>
            <button
              type="button"
              onClick={() => setOpenPicker(false)}
              className="text-muted hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div>
              <label className="text-xs text-muted mb-1 block">{t('Year')}</label>
              <div className="relative">
                <select
                  value={selectedYear}
                  onChange={(e) =>
                    handleDropdownChange(Number(e.target.value), selectedMonth, selectedDay)
                  }
                  className="w-full h-8 pl-2 pr-6 rounded border border-input bg-surface text-xs font-mono focus:ring-1 focus:ring-ring appearance-none"
                >
                  {years.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-2.5 h-3 w-3 text-muted" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">{t('Month')}</label>
              <div className="relative">
                <select
                  value={selectedMonth}
                  onChange={(e) =>
                    handleDropdownChange(selectedYear, Number(e.target.value), selectedDay)
                  }
                  className="w-full h-8 pl-2 pr-6 rounded border border-input bg-surface text-xs focus:ring-1 focus:ring-ring appearance-none"
                >
                  {NEPALI_MONTHS.map((m) => (
                    <option key={m.bsMonth} value={m.bsMonth}>
                      {pad(m.bsMonth)} - {m.en}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-2.5 h-3 w-3 text-muted" />
              </div>
            </div>

            <div>
              <label className="text-xs text-muted mb-1 block">{t('Day')}</label>
              <div className="relative">
                <select
                  value={Math.min(selectedDay, maxDays)}
                  onChange={(e) =>
                    handleDropdownChange(selectedYear, selectedMonth, Number(e.target.value))
                  }
                  className="w-full h-8 pl-2 pr-6 rounded border border-input bg-surface text-xs font-mono focus:ring-1 focus:ring-ring appearance-none"
                >
                  {Array.from({ length: maxDays }, (_, i) => i + 1).map((d) => (
                    <option key={d} value={d}>
                      {pad(d)}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-1.5 top-2.5 h-3 w-3 text-muted" />
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border/50 flex items-center justify-between">
            <span className="text-xs text-primary font-medium truncate">
              {formattedHelper ?? t('Select year, month & day')}
            </span>
            <button
              type="button"
              onClick={() => setOpenPicker(false)}
              className="text-xs px-2.5 py-1 rounded bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
            >
              {t('Apply')}
            </button>
          </div>
        </div>
      )}

      {error ? (
        <p className="text-xs text-danger">{error}</p>
      ) : formattedHelper ? (
        <p className="text-xs text-primary font-medium truncate" title={formattedHelper}>
          {formattedHelper}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
