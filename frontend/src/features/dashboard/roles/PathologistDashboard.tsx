import { AlertOctagon, FileCheck, ScrollText } from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { resultsApi } from '@/features/results/api';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatTileRow } from '../components/StatTile';
import { TurnaroundPanel } from '../components/TurnaroundPanel';
import { CriticalResultsPanel } from '../components/CriticalResultsPanel';
import { ResultsToAuthorize } from '../components/queues/ResultsToAuthorize';
import { ReportsToRelease } from '../components/queues/ReportsToRelease';
import type { RoleDashboardProps } from './types';

/** Clinical oversight: critical results, authorizations and report sign-off. */
export function PathologistDashboard({ summary, lastUpdated, refreshing, onRefresh }: RoleDashboardProps) {
  const resultsSummaryQ = useQuery(() => resultsApi.summary(), []);
  const resultCounts = resultsSummaryQ.data ?? {};
  const criticalPending = resultCounts.CRITICAL_PENDING ?? summary.unresolvedCriticalResults;

  return (
    <>
      <DashboardHeader
        subtitle="Critical results, pending authorizations and reports to sign."
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <StatTileRow
        stats={[
          {
            label: 'Critical, unacknowledged',
            value: criticalPending,
            icon: AlertOctagon,
            tone: criticalPending > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Awaiting authorization',
            value: summary.resultsPendingApproval,
            icon: FileCheck,
            tone: summary.resultsPendingApproval > 0 ? 'warning' : 'neutral',
          },
          { label: 'Reports today', value: summary.reportsToday, icon: ScrollText },
        ]}
      />

      <CriticalResultsPanel />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ResultsToAuthorize />
        <ReportsToRelease />
      </div>

      <div className="mt-4">
        <TurnaroundPanel resultCounts={resultCounts} />
      </div>
    </>
  );
}
