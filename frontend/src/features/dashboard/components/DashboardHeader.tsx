import type { LucideIcon } from 'lucide-react';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/useAuth';

export type DashboardRange = 1 | 7 | 30;
const RANGES: { value: DashboardRange; label: string }[] = [
  { value: 1, label: 'Today' },
  { value: 7, label: '7 days' },
  { value: 30, label: '30 days' },
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export interface PrimaryAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
}

/** Shared dashboard header — greeting, date, an optional range switcher, refresh, and one primary action. */
export function DashboardHeader({
  subtitle,
  range,
  onRangeChange,
  lastUpdated,
  refreshing,
  onRefresh,
  primaryAction,
}: {
  subtitle: string;
  range?: DashboardRange;
  onRangeChange?: (r: DashboardRange) => void;
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
  primaryAction?: PrimaryAction;
}) {
  const { user } = useAuth();
  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">
          {greeting()}
          {user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}.
        </h1>
        <p className="mt-1 text-sm text-muted">
          {today} · {subtitle}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {range != null && onRangeChange && (
          <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => onRangeChange(r.value)}
                aria-pressed={range === r.value}
                className={cn(
                  'rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                  range === r.value
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted hover:bg-surface-muted hover:text-foreground',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={onRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 rounded-md px-2 py-1.5 text-xs text-muted hover:bg-surface-muted hover:text-foreground disabled:opacity-50"
          title="Refresh dashboard data"
        >
          <RotateCw className={cn('h-3.5 w-3.5', refreshing && 'animate-spin')} aria-hidden />
          {lastUpdated
            ? `Updated ${lastUpdated.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}`
            : 'Refresh'}
        </button>

        {primaryAction && (
          <Button onClick={primaryAction.onClick}>
            <primaryAction.icon className="h-4 w-4" aria-hidden />
            {primaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}
