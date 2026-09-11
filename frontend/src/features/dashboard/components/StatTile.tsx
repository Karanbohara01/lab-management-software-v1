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
            'flex min-h-[6rem] flex-[1_1_11rem] flex-col justify-between rounded-lg border bg-surface p-4 text-left shadow-card transition-colors',
            s.to && 'hover:border-primary/30',
            s.tone === 'warning' ? 'border-warning/30' : 'border-border',
          )}
        >
          <div className="flex items-start justify-between">
            <span className="text-xs font-medium text-muted">{s.label}</span>
            <s.icon className={cn('h-4 w-4', s.tone === 'warning' ? 'text-warning' : 'text-muted')} aria-hidden />
          </div>
          <p className="mt-2 text-2xl font-semibold text-foreground">{s.value}</p>
        </button>
      ))}
    </div>
  );
}
