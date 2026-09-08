import { useNavigate } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  Boxes,
  ClipboardCheck,
  FileText,
  FlaskConical,
  Receipt,
  ScrollText,
  Wallet,
  type LucideIcon,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody } from '@/components/ui/Card';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { formatMoney } from '@/lib/money';
import { dashboardApi, type DashboardSummary } from '@/features/dashboard/api';

interface Tile {
  label: string;
  value: string;
  icon: LucideIcon;
  to?: string;
  permission?: string;
  attention?: boolean;
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { data, loading, error, refetch } = useQuery(() => dashboardApi.summary(), []);

  const tiles = (s: DashboardSummary): Tile[] =>
    [
      { label: "Today's patients", value: String(s.todayPatients), icon: Activity, to: '/app/patients', permission: PERMISSIONS.PATIENT_READ },
      { label: "Today's orders", value: String(s.todayOrders), icon: ClipboardCheck, to: '/app/orders', permission: PERMISSIONS.LAB_ORDER_READ },
      { label: 'Awaiting collection', value: String(s.pendingCollection), icon: FlaskConical, to: '/app/samples?status=AWAITING_COLLECTION', permission: PERMISSIONS.SAMPLE_READ, attention: s.pendingCollection > 0 },
      { label: 'Samples in lab', value: String(s.samplesInLab), icon: FlaskConical, to: '/app/samples', permission: PERMISSIONS.SAMPLE_READ },
      { label: 'Results to enter', value: String(s.resultsPendingEntry), icon: FileText, to: '/app/results', permission: PERMISSIONS.RESULT_READ, attention: s.resultsPendingEntry > 0 },
      { label: 'Awaiting verification', value: String(s.resultsPendingVerification), icon: FileText, to: '/app/results', permission: PERMISSIONS.RESULT_READ, attention: s.resultsPendingVerification > 0 },
      { label: 'Awaiting approval', value: String(s.resultsPendingApproval), icon: FileText, to: '/app/results', permission: PERMISSIONS.RESULT_READ, attention: s.resultsPendingApproval > 0 },
      { label: 'Open critical results', value: String(s.unresolvedCriticalResults), icon: AlertTriangle, to: '/app/results', permission: PERMISSIONS.RESULT_READ, attention: s.unresolvedCriticalResults > 0 },
      { label: 'Reports today', value: String(s.reportsToday), icon: FileText, to: '/app/reports', permission: PERMISSIONS.REPORT_READ },
      { label: "Today's revenue", value: formatMoney(s.todayRevenue), icon: Wallet, to: '/app/invoices', permission: PERMISSIONS.PAYMENT_READ },
      { label: 'Outstanding balance', value: formatMoney(s.outstandingBalance), icon: Receipt, to: '/app/invoices?unpaidOnly=true', permission: PERMISSIONS.INVOICE_READ, attention: s.outstandingBalance > 0 },
      { label: 'Failed IRD submissions', value: String(s.failedIrdSubmissions), icon: ScrollText, to: '/app/ird?status=FAILED', permission: PERMISSIONS.IRD_SUBMISSION_READ, attention: s.failedIrdSubmissions > 0 },
      { label: 'Inventory alerts', value: String(s.inventoryAlerts), icon: Boxes, to: '/app/inventory', permission: PERMISSIONS.INVENTORY_READ, attention: s.inventoryAlerts > 0 },
    ].filter((t) => !t.permission || hasPermission(t.permission));

  return (
    <>
      <PageHeader
        title={`Welcome, ${user?.fullName?.split(' ')[0] ?? ''}`}
        description="Operational overview of the laboratory."
      />

      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {tiles(data).map((t) => (
            <Card
              key={t.label}
              className={t.attention ? 'border-warning/50' : undefined}
              role={t.to ? 'button' : undefined}
              tabIndex={t.to ? 0 : undefined}
              onClick={t.to ? () => navigate(t.to!) : undefined}
              onKeyDown={t.to ? (e) => e.key === 'Enter' && navigate(t.to!) : undefined}
            >
              <CardBody className={t.to ? 'cursor-pointer' : ''}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-muted">{t.label}</p>
                    <p className="mt-1 text-2xl font-semibold text-foreground">{t.value}</p>
                  </div>
                  <t.icon className={`h-5 w-5 ${t.attention ? 'text-warning' : 'text-muted'}`} aria-hidden />
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      ) : null}
    </>
  );
}
