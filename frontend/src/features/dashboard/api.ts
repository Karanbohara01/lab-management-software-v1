import { httpClient } from '@/api/client';

export interface DashboardSummary {
  todayPatients: number;
  todayOrders: number;
  pendingCollection: number;
  samplesInLab: number;
  resultsPendingEntry: number;
  resultsPendingVerification: number;
  resultsPendingApproval: number;
  unresolvedCriticalResults: number;
  reportsToday: number;
  todayRevenue: number;
  outstandingBalance: number;
  failedIrdSubmissions: number;
  inventoryAlerts: number;
}

export const dashboardApi = {
  summary: () => httpClient.get<DashboardSummary>('/dashboard/summary').then((r) => r.data),
};
