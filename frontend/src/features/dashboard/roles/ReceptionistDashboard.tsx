import { useNavigate } from 'react-router-dom';
import { Activity, ClipboardCheck, UserPlus, Wallet } from 'lucide-react';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatMoney } from '@/lib/money';
import { DashboardHeader } from '../components/DashboardHeader';
import { StatTileRow } from '../components/StatTile';
import { DraftOrders } from '../components/queues/DraftOrders';
import { OutstandingInvoices } from '../components/queues/OutstandingInvoices';
import type { RoleDashboardProps } from './types';

/** Front desk: registration, order intake and billing — where every visit begins. */
export function ReceptionistDashboard({ summary, lastUpdated, refreshing, onRefresh }: RoleDashboardProps) {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();

  return (
    <>
      <DashboardHeader
        subtitle="Registrations, draft orders and billing waiting on the front desk."
        lastUpdated={lastUpdated}
        refreshing={refreshing}
        onRefresh={onRefresh}
        primaryAction={
          hasPermission(PERMISSIONS.PATIENT_WRITE)
            ? { label: 'Register patient', icon: UserPlus, onClick: () => navigate('/app/patients/new') }
            : undefined
        }
      />

      <StatTileRow
        stats={[
          { label: "Today's patients", value: summary.todayPatients, icon: Activity },
          { label: "Today's orders", value: summary.todayOrders, icon: ClipboardCheck },
          {
            label: 'Outstanding balance',
            value: formatMoney(summary.outstandingBalance),
            icon: Wallet,
            tone: summary.outstandingBalance > 0 ? 'warning' : 'neutral',
          },
        ]}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <DraftOrders />
        <OutstandingInvoices />
      </div>
    </>
  );
}
