import { useNavigate } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/cn';

export interface StatTileData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  to?: string;
  tone?: 'neutral' | 'warning';
}

/** A row of compact, click-through stat tiles — the lightweight KPI strip used on role dashboards. */
export function StatTileRow({ stats }: { stats: StatTileData[] }) {
  const navigate = useNavigate();
  if (stats.length === 0) return null;
  return (
    <div className="mb-5 flex flex-wrap gap-3">
      {stats.map((s) => (
        <button
          key={s.label}
          type="button"
          onClick={s.to ? () => navigate(s.to!) : undefined}
          className={cn(
            'flex min-h-[6rem] flex-[1_1_11rem] flex-col justify-between rounded-lg border bg-surface p-4 text-left shadow-card transition-all',
            s.to && 'hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
            s.tone === 'warning' ? 'border-warning/30' : 'border-border',
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted">{s.label}</span>
            <span
              className={cn(
                'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                s.tone === 'warning' ? 'bg-warning/10' : 'bg-primary/10',
              )}
            >
              <s.icon className={cn('h-4 w-4', s.tone === 'warning' ? 'text-warning' : 'text-primary')} aria-hidden />
            </span>
          </div>
          <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{s.value}</p>
        </button>
      ))}
    </div>
  );
}
