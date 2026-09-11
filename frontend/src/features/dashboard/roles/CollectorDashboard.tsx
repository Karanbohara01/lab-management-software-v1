import { FlaskConical } from 'lucide-react';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatTileRow } from '../components/StatTile';
import { SamplesToCollect } from '../components/queues/SamplesToCollect';
import type { RoleDashboardProps } from './types';

/** Sample-collection staff: one worklist, one job — draw the specimens that are due. */
export function CollectorDashboard({ summary, lastUpdated, refreshing, onRefresh }: RoleDashboardProps) {
  return (
    <>
      <DashboardHeader
        subtitle="Today's specimens to draw from patients."
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
      />

      <StatTileRow
        stats={[
          {
            label: 'Awaiting collection',
            value: summary.pendingCollection,
            icon: FlaskConical,
            tone: summary.pendingCollection > 0 ? 'warning' : 'neutral',
          },
        ]}
      />

      <SamplesToCollect />
    </>
  );
}
