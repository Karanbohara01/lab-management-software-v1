import { Select } from '@/components/ui/Select';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { cn } from '@/lib/cn';
import type { Branch } from '@/features/branches/api';
import { REVENUE_PRESET_LABEL, type RevenuePreset } from '../types';
import type { RevenueWindowState } from '../useRevenueWindow';

const PRESETS = Object.keys(REVENUE_PRESET_LABEL) as RevenuePreset[];

/**
 * The period control: the ten named windows as a row of chips (a tap, not a menu — a front office
 * switches between "Today" and "This month" constantly), plus a two-month calendar for anything
 * else. Branch narrowing sits alongside, and is hidden for a user already tied to one branch.
 */
export function RevenueFilters({
  window,
  branches,
  showBranch,
}: {
  window: RevenueWindowState;
  branches: Branch[];
  showBranch: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-label text-muted">Reporting period</p>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {PRESETS.map((p) => {
            const active = window.preset === p;
            return (
              <button
                key={p}
                type="button"
                aria-pressed={active}
                onClick={() => window.setPreset(p)}
                className={cn(
                  'shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                )}
              >
                {REVENUE_PRESET_LABEL[p]}
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <DateRangePicker
          label="Custom range"
          className="sm:w-64"
          align="right"
          value={window.range}
          onChange={window.setRange}
          maxDate={new Date()}
          placeholder="Pick any two dates"
        />
        {showBranch && (
          <div className="sm:w-48">
            <Select
              label="Branch"
              value={String(window.branchId ?? '')}
              onChange={(e) => window.setBranch(e.target.value)}
              options={[
                { value: '', label: 'All branches' },
                ...branches.map((b) => ({ value: String(b.id), label: b.name })),
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
