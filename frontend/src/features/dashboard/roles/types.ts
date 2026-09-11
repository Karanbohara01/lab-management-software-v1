import type { DashboardSummary } from '@/features/dashboard/api';

/** Common props every role dashboard receives from the DashboardPage router. */
export interface RoleDashboardProps {
  summary: DashboardSummary;
  lastUpdated: Date | null;
  refreshing: boolean;
  onRefresh: () => void;
}
