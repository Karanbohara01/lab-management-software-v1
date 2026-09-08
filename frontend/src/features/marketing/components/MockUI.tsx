import type { ReactNode } from 'react';
import { Microscope } from 'lucide-react';
import { cn } from '@/lib/cn';

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'critical';
const TONE: Record<Tone, string> = {
  neutral: 'bg-slate-100 text-slate-600 ring-slate-200',
  info: 'bg-primary/10 text-primary ring-primary/20',
  success: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  warning: 'bg-amber-50 text-amber-700 ring-amber-200',
  critical: 'bg-red-50 text-red-700 ring-red-200',
};
const DOT: Record<Tone, string> = {
  neutral: 'bg-slate-400',
  info: 'bg-primary',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

export function MockBadge({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset', TONE[tone])}>
      {children}
    </span>
  );
}

/**
 * App-style chrome frame. The frame always fits its container; `canvasClassName`
 * (e.g. `min-w-[44rem]`) sizes the inner product canvas, which scrolls
 * horizontally inside the frame when the screen is narrower than the canvas.
 */
export function MockWindow({
  title,
  children,
  className,
  canvasClassName,
}: {
  title: string;
  children: ReactNode;
  className?: string;
  canvasClassName?: string;
}) {
  return (
    <div
      className={cn(
        'mock-root w-full max-w-full overflow-hidden rounded-xl border border-border bg-surface shadow-[0_24px_60px_-20px_hsl(220_43%_11%/0.25)]',
        canvasClassName && 'is-scrollable',
        className,
      )}
    >
      <div className="flex items-center gap-2 border-b border-border bg-surface-muted/60 px-3 py-2">
        <span className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
        </span>
        <span className="ml-2 truncate text-xs font-medium text-muted">{title}</span>
      </div>

      <div className="mock-scroll">
        <div className={canvasClassName}>{children}</div>
      </div>

      <div className="mock-fade" aria-hidden />
    </div>
  );
}

const RAIL_ITEMS = ['Dashboard', 'Patients', 'Lab orders', 'Samples', 'Results', 'Reports', 'Invoices'];

/** App shell: a persistent side rail (sticky while the canvas scrolls) + content. */
export function MockShell({ active, children }: { active: string; children: ReactNode }) {
  return (
    <div className="flex">
      <aside className="sticky left-0 z-10 w-36 shrink-0 border-r border-border bg-surface p-2">
        <div className="mb-3 flex items-center gap-2 px-1">
          <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Microscope className="h-3 w-3" aria-hidden />
          </span>
          <span className="text-xs font-semibold text-foreground">LabOS</span>
        </div>
        <ul className="space-y-0.5">
          {RAIL_ITEMS.map((item) => (
            <li
              key={item}
              className={cn(
                'rounded-md px-2 py-1.5 text-[11px] font-medium',
                item === active ? 'bg-primary/10 text-primary' : 'text-muted',
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      </aside>
      <div className="min-w-0 flex-1 p-3 sm:p-4">{children}</div>
    </div>
  );
}

export function MockStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <p className="text-[11px] leading-tight text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-semibold text-foreground">{value}</p>
      {hint && <p className="text-[11px] text-emerald-600">{hint}</p>}
    </div>
  );
}

/** KPI row — stays horizontally arranged; scrolls with the canvas on mobile. */
export function MockStatGrid({ children, cols = 3 }: { children: ReactNode; cols?: 3 | 4 }) {
  return <div className={cn('grid gap-2', cols === 4 ? 'grid-cols-4' : 'grid-cols-3')}>{children}</div>;
}

interface Col {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
}

/** Dense data table — keeps its desktop structure and scrolls with the canvas. */
export function MockTable({ columns, rows }: { columns: Col[]; rows: ReactNode[][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full text-left text-xs">
        <thead className="bg-surface-muted/60 text-[10px] uppercase tracking-wide text-muted">
          <tr>
            {columns.map((c) => (
              <th key={c.key} className={cn('whitespace-nowrap px-3 py-2 font-semibold', c.align === 'right' && 'text-right', c.align === 'center' && 'text-center')}>
                {c.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows.map((row, i) => (
            <tr key={i} className="bg-surface">
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    'whitespace-nowrap px-3 py-2 text-foreground',
                    columns[j]?.align === 'right' && 'text-right',
                    columns[j]?.align === 'center' && 'text-center',
                  )}
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Accent card shown as a strip beneath a hero mockup — always inside the viewport. */
export function FloatingCard({
  tone,
  title,
  subtitle,
  className,
}: {
  tone: Tone;
  title: string;
  subtitle: string;
  className?: string;
}) {
  return (
    <div className={cn('rounded-lg border border-border bg-surface/95 p-3 shadow-popover backdrop-blur', className)}>
      <div className="flex items-center gap-2">
        <span className={cn('h-2 w-2 shrink-0 rounded-full', DOT[tone])} />
        <p className="text-xs font-semibold text-foreground">{title}</p>
      </div>
      <p className="mt-0.5 pl-4 text-[11px] text-muted">{subtitle}</p>
    </div>
  );
}
