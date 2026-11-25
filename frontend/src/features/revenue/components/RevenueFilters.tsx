import { motion } from 'framer-motion';
import { Select } from '@/components/ui/Select';
import { DateRangePicker } from '@/components/ui/DateRangePicker';
import { SPRING_SNAPPY, isTestEnv } from '@/components/ui/motion';
import { cn } from '@/lib/cn';
import type { Branch } from '@/features/branches/api';
import { useT } from '@/i18n';
import { REVENUE_PRESET_LABEL, type RevenuePreset } from '../types';
import type { RevenueWindowState } from '../useRevenueWindow';

const PRESETS = Object.keys(REVENUE_PRESET_LABEL) as RevenuePreset[];

export function RevenueFilters({
  window,
  branches,
  showBranch,
}: {
  window: RevenueWindowState;
  branches: Branch[];
  showBranch: boolean;
}) {
  const t = useT();
  const skipMotion = isTestEnv();
  return (
    <div className="flex flex-col gap-3 border-b border-border p-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="min-w-0">
        <p className="mb-2 text-label text-muted">{t('Reporting period')}</p>
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
                  'relative shrink-0 rounded-full border px-3 py-1.5 text-sm font-medium transition-colors',
                  active
                    ? 'border-primary text-primary'
                    : 'border-border text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                )}
              >
                {active && (
                  <motion.span
                    layoutId={skipMotion ? undefined : 'revenue-preset-pill'}
                    transition={SPRING_SNAPPY}
                    className="absolute inset-0 rounded-full bg-primary/10"
                    aria-hidden
                  />
                )}
                <span className="relative z-10">{t(REVENUE_PRESET_LABEL[p])}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <DateRangePicker
          label={t('Custom range')}
          className="sm:w-64"
          align="right"
          value={window.range}
          onChange={window.setRange}
          maxDate={new Date()}
          placeholder={t('Pick any two dates')}
        />
        {showBranch && (
          <div className="sm:w-48">
            <Select
              label={t('Branch')}
              value={String(window.branchId ?? '')}
              onChange={(e) => window.setBranch(e.target.value)}
              options={[
                { value: '', label: t('All branches') },
                ...branches.map((b) => ({ value: String(b.id), label: b.name })),
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
