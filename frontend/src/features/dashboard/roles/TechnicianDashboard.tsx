import { FileText, FlaskConical, ScrollText } from 'lucide-react';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { resultsApi } from '@/features/results/api';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatTileRow } from '../components/StatTile';
import { TurnaroundPanel } from '../components/TurnaroundPanel';
import { InventoryHealthPanel } from '../components/InventoryHealthPanel';
import { SamplesToReceive } from '../components/queues/SamplesToReceive';
import { ResultsToEnter } from '../components/queues/ResultsToEnter';
import { ResultsToVerify } from '../components/queues/ResultsToVerify';
import type { RoleDashboardProps } from './types';

/** Lab bench worklist: receive samples, enter results, verify them — the technician's whole day. */
export function TechnicianDashboard({ summary, lastUpdated, refreshing, onRefresh }: RoleDashboardProps) {
  const { hasPermission } = useAuth();
  const resultsSummaryQ = useQuery(() => resultsApi.summary(), []);

  return (
    <>
      <DashboardHeader
        subtitle="Samples to receive and results to enter or verify."
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <StatTileRow
        stats={[
          { label: 'Samples in lab', value: summary.samplesInLab, icon: FlaskConical },
          {
            label: 'Results to enter',
            value: summary.resultsPendingEntry,
            icon: FileText,
            tone: summary.resultsPendingEntry > 0 ? 'warning' : 'neutral',
          },
          {
            label: 'Awaiting verification',
            value: summary.resultsPendingVerification,
            icon: ScrollText,
            tone: summary.resultsPendingVerification > 0 ? 'warning' : 'neutral',
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <SamplesToReceive />
        <ResultsToEnter />
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ResultsToVerify />
        <TurnaroundPanel resultCounts={resultsSummaryQ.data ?? {}} />
      </div>
      {hasPermission(PERMISSIONS.INVENTORY_READ) && (
        <div className="mt-4">
          <InventoryHealthPanel />
        </div>
      )}
    </>
  );
}
