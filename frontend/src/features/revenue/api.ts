import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { PaymentMethod } from '@/features/billing/types';
import type {
  Granularity,
  OutstandingRow,
  OutstandingScope,
  PaymentRow,
  RefundRow,
  RevenueBreakdown,
  RevenuePreset,
  RevenueReport,
  RevenueSummary,
  RevenueTrend,
} from './types';

/**
 * The window every call is cut by. A preset is resolved on the server against the laboratory's
 * calendar; explicit dates are inclusive. Exactly one of the two is sent.
 */
export interface RevenueWindow {
  preset?: RevenuePreset;
  from?: string;
  to?: string;
  branchId?: number;
}

function windowParams(w: RevenueWindow) {
  return w.preset
    ? { preset: w.preset, branchId: w.branchId }
    : { from: w.from, to: w.to, branchId: w.branchId };
}

export interface RegisterQuery {
  page?: number;
  size?: number;
  sort?: string;
  dir?: 'asc' | 'desc';
}

export const revenueApi = {
  summary: (w: RevenueWindow) =>
    httpClient.get<RevenueSummary>('/revenue/summary', { params: windowParams(w) }).then((r) => r.data),

  breakdown: (w: RevenueWindow) =>
    httpClient.get<RevenueBreakdown>('/revenue/breakdown', { params: windowParams(w) }).then((r) => r.data),

  trend: (w: RevenueWindow, granularity?: Granularity) =>
    httpClient
      .get<RevenueTrend>('/revenue/trend', { params: { ...windowParams(w), granularity } })
      .then((r) => r.data),

  payments: (w: RevenueWindow, q: RegisterQuery & { method?: PaymentMethod | ''; receivedBy?: string }) =>
    httpClient
      .get<PageResponse<PaymentRow>>('/revenue/payments', {
        params: { ...windowParams(w), ...q, method: q.method || undefined, receivedBy: q.receivedBy || undefined },
      })
      .then((r) => r.data),

  refunds: (w: RevenueWindow, q: RegisterQuery) =>
    httpClient
      .get<PageResponse<RefundRow>>('/revenue/refunds', { params: { ...windowParams(w), ...q } })
      .then((r) => r.data),

  outstanding: (w: RevenueWindow, q: RegisterQuery & { scope?: OutstandingScope }) =>
    httpClient
      .get<PageResponse<OutstandingRow>>('/revenue/outstanding', { params: { ...windowParams(w), ...q } })
      .then((r) => r.data),

  /** The whole printable report in one call — the same figures the dashboard shows for the window. */
  report: (w: RevenueWindow) =>
    httpClient.get<RevenueReport>('/revenue/report', { params: windowParams(w) }).then((r) => r.data),
};
