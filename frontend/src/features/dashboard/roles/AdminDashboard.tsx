import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { resultsApi } from '@/features/results/api';
import { samplesApi } from '@/features/samples/api';
import { analyticsApi } from '@/features/analytics/api';
import { DashboardHeader, type DashboardRange } from '../components/DashboardHeader';
import { KpiHero } from '../components/KpiHero';
import { ActionCenter } from '../components/ActionCenter';
import { WorkflowPipeline } from '../components/WorkflowPipeline';
import { DepartmentWorkload } from '../components/DepartmentWorkload';
import { RevenueTrend } from '../components/RevenueTrend';
import { TurnaroundPanel } from '../components/TurnaroundPanel';
import { CriticalResultsPanel } from '../components/CriticalResultsPanel';
import { InventoryHealthPanel } from '../components/InventoryHealthPanel';
import { RecentActivity } from '../components/RecentActivity';
import type { RoleDashboardProps } from './types';

/** Enterprise-wide overview for SUPER_ADMIN / LAB_ADMINISTRATOR — the whole laboratory, end to end. */
export function AdminDashboard({ summary, lastUpdated, refreshing, onRefresh }: RoleDashboardProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [range, setRange] = useState<DashboardRange>(7);

  const resultsSummaryQ = useQuery(
    () => (hasPermission(PERMISSIONS.RESULT_READ) ? resultsApi.summary() : Promise.resolve({})),
    [],
  );
  const samplesSummaryQ = useQuery(
    () => (hasPermission(PERMISSIONS.SAMPLE_READ) ? samplesApi.summary() : Promise.resolve({})),
    [],
  );
  const canSeeAnalytics = hasPermission(PERMISSIONS.REPORTING_READ);
  const analyticsQ = useQuery(
    () => (canSeeAnalytics ? analyticsApi.overview(range) : Promise.resolve(null)),
    [range, canSeeAnalytics],
  );

  const refreshAll = () => {
    onRefresh();
    resultsSummaryQ.refetch();
    samplesSummaryQ.refetch();
    analyticsQ.refetch();
  };

  const resultCounts = resultsSummaryQ.data ?? {};
  const samplesCounts = samplesSummaryQ.data ?? {};

  return (
    <>
      <DashboardHeader
        subtitle="Here's what needs attention across your laboratory today."
        range={range}
        onRangeChange={setRange}
        lastUpdated={lastUpdated}
        refreshing={refreshing || resultsSummaryQ.loading}
        onRefresh={refreshAll}
        primaryAction={
          hasPermission(PERMISSIONS.LAB_ORDER_WRITE)
            ? { label: 'New order', icon: Plus, onClick: () => navigate('/app/orders/new') }
            : undefined
        }
      />

      <KpiHero summary={summary} />

      <ActionCenter summary={summary} resultCounts={resultCounts} />

      <WorkflowPipeline summary={summary} samplesCounts={samplesCounts} resultCounts={resultCounts} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {canSeeAnalytics && analyticsQ.data && (
            <div className="grid gap-4 md:grid-cols-2">
              <RevenueTrend points={analyticsQ.data.revenueByDay} days={range} />
              <DepartmentWorkload points={analyticsQ.data.testsByDepartment} days={range} />
            </div>
          )}
          {hasPermission(PERMISSIONS.RESULT_READ) && <TurnaroundPanel resultCounts={resultCounts} />}
          {hasPermission(PERMISSIONS.RESULT_READ) && <CriticalResultsPanel />}
        </div>

        <div className="space-y-4">
          {hasPermission(PERMISSIONS.INVENTORY_READ) && <InventoryHealthPanel />}
          {hasPermission(PERMISSIONS.AUDIT_READ) && <RecentActivity />}
        </div>
      </div>
    </>
  );
}
