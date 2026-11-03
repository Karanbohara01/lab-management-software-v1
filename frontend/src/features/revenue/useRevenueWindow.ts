import { useMemo } from 'react';
import { useListParams } from '@/hooks/useListParams';
import type { DateRangeValue } from '@/components/ui/DateRangePicker';
import type { RevenueWindow } from './api';
import type { RevenuePreset } from './types';

/**
 * The reporting window, kept in the URL so a period can be bookmarked, shared and reopened — and
 * so the print route can be handed the exact same window the dashboard was showing.
 *
 * `preset` is the normal case and is resolved server-side on the laboratory's calendar (the
 * browser's clock may be in another timezone entirely). Choosing explicit dates clears the preset;
 * the two are never sent together.
 */
/**
 * `preset` defaults to empty rather than to `TODAY` so that both ordinary states leave a clean
 * URL: today's figures are just `/app/revenue`, and choosing a date range removes the key instead
 * of leaving a contradictory `preset=` behind it.
 */
export const REVENUE_WINDOW_PARAMS = { preset: '', from: '', to: '', branchId: '' };

export interface RevenueWindowState {
  /** Set when a preset is in force. */
  preset: RevenuePreset | null;
  /** Set when an explicit range is in force. */
  range: DateRangeValue | null;
  branchId: number | undefined;
  /** What the API client wants — exactly one of preset or from/to. */
  query: RevenueWindow;
  /** The query string to carry this window onto another route. */
  search: string;
  setPreset: (preset: RevenuePreset) => void;
  setRange: (range: DateRangeValue) => void;
  setBranch: (branchId: string) => void;
}

export function useRevenueWindow(): RevenueWindowState {
  const { params, set } = useListParams(REVENUE_WINDOW_PARAMS);

  const hasRange = !!params.from && !!params.to;
  const preset = hasRange ? null : ((params.preset || 'TODAY') as RevenuePreset);
  const branchId = params.branchId ? Number(params.branchId) : undefined;

  const query = useMemo<RevenueWindow>(
    () => (hasRange ? { from: params.from, to: params.to, branchId } : { preset: preset ?? 'TODAY', branchId }),
    [hasRange, params.from, params.to, preset, branchId],
  );

  const search = useMemo(() => {
    const sp = new URLSearchParams();
    if (hasRange) {
      sp.set('from', params.from);
      sp.set('to', params.to);
    } else if (preset && preset !== 'TODAY') {
      sp.set('preset', preset);
    }
    if (params.branchId) sp.set('branchId', params.branchId);
    const s = sp.toString();
    return s ? `?${s}` : '';
  }, [hasRange, params.from, params.to, params.branchId, preset]);

  return {
    preset,
    range: hasRange ? { from: params.from, to: params.to } : null,
    branchId,
    query,
    search,
    // Picking a preset drops any explicit range, and vice versa — one window at a time. Today is
    // the implicit default, so selecting it clears the key rather than spelling it out.
    setPreset: (next) => set({ preset: next === 'TODAY' ? '' : next, from: '', to: '' }),
    setRange: (next) => set({ from: next.from, to: next.to, preset: '' }),
    setBranch: (next) => set({ branchId: next }),
  };
}
