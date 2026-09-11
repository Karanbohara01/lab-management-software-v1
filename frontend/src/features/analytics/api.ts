import { httpClient } from '@/api/client';

export interface AnalyticsPoint {
  label: string;
  value: number;
}

export interface AnalyticsOverview {
  days: number;
  revenueByDay: AnalyticsPoint[];
  testsByDepartment: AnalyticsPoint[];
  topTests: AnalyticsPoint[];
  topReferrers: AnalyticsPoint[];
}

export const analyticsApi = {
  overview: (days: number) =>
    httpClient.get<AnalyticsOverview>('/analytics/overview', { params: { days } }).then((r) => r.data),
};
