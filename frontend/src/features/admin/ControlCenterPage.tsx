import { useNavigate } from 'react-router-dom';
import {
  Users,
  MapPin,
  Building2,
  TestTubes,
  ScrollText,
  CreditCard,
  MessageSquare,
  Database,
  ShieldCheck,
  UserCog,
  Settings,
  Boxes,
  RefreshCw,
} from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { StatTileRow, type StatTileData } from '@/features/dashboard/components/StatTile';
import { useQuery } from '@/hooks/useQuery';
import { adminApi } from './api';

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' }) : '—';
}

/**
 * Super-admin control center — one screen that surfaces the whole system's operational posture
 * (org counts, every external integration's real configured/not-configured status, last backup)
 * and links straight into every administrative area, instead of making a super admin hop between
 * half a dozen separate nav items to see whether the system is healthy. Read-only: every
 * integration credential (IRD/eSewa/Khalti/SMS/WhatsApp) stays env-var/ops-managed — this page
 * only reports status, it never lets a secret be typed into the browser.
 */
export function ControlCenterPage() {
  const navigate = useNavigate();
  const { data: status, loading, error, refetch } = useQuery(() => adminApi.systemStatus(), []);

  if (loading && !status) return <LoadingState label="Loading system status…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!status) return null;

  const orgStats: StatTileData[] = [
    { label: 'Users', value: `${status.activeUsers}/${status.totalUsers}`, icon: Users, to: '/app/users' },
    { label: 'Branches', value: `${status.activeBranches}/${status.totalBranches}`, icon: MapPin, to: '/app/branches' },
    { label: 'Departments', value: status.totalDepartments, icon: Building2, to: '/app/departments' },
    { label: 'Active tests', value: status.activeTests, icon: TestTubes, to: '/app/tests' },
  ];

  const managementCards = [
    { label: 'Users', description: 'Accounts, roles, enable/disable, reset password', icon: UserCog, to: '/app/users' },
    { label: 'Roles', description: 'Review permissions granted per role', icon: ShieldCheck, to: '/app/roles' },
    { label: 'Branches', description: 'Locations, contact details, active status', icon: MapPin, to: '/app/branches' },
    { label: 'Departments', description: 'Lab departments backing the test catalog', icon: Building2, to: '/app/departments' },
    { label: 'Test catalog', description: 'Analytes, profiles, reference ranges', icon: TestTubes, to: '/app/tests' },
    { label: 'Inventory', description: 'Stock, suppliers, purchase orders', icon: Boxes, to: '/app/inventory' },
    { label: 'Audit log', description: 'Every change, before/after, who and when', icon: ScrollText, to: '/app/audit' },
    { label: 'Laboratory settings', description: 'Letterhead, fiscal year, tax, branding', icon: Settings, to: '/app/settings' },
    { label: 'Backups', description: 'Run and download database backups', icon: Database, to: '/app/backups' },
  ];

  return (
    <>
      <PageHeader
        title="Control center"
        description={`${status.labName} · FY ${status.fiscalYear}`}
        actions={
          <Button variant="secondary" onClick={refetch} loading={loading}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            Refresh
          </Button>
        }
      />

      <StatTileRow stats={orgStats} />

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title="Integrations"
            description="Every external service this system can talk to, and whether it's actually wired in."
          />
          <CardBody className="space-y-3">
            <IntegrationRow
              icon={ScrollText}
              label="IRD / CBMS e-billing"
              configured={status.irdConfigured}
              detail={status.irdEnvironment ?? undefined}
              onClick={() => navigate('/app/ird')}
            />
            {status.paymentProviders.map((p) => (
              <IntegrationRow
                key={p.name}
                icon={CreditCard}
                label={`${p.name} online payment`}
                configured={p.configured}
                onClick={() => navigate('/app/invoices')}
              />
            ))}
            <IntegrationRow
              icon={MessageSquare}
              label="SMS report delivery"
              configured={status.smsConfigured}
              detail={status.smsConfigured ? (status.smsProvider ?? undefined) : undefined}
            />
            <IntegrationRow icon={MessageSquare} label="WhatsApp report delivery" configured={status.whatsappConfigured} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Backups" description="Mandatory retention per the e-invoice procedure." />
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Last backup</span>
              <span className="font-medium text-foreground">{dt(status.lastBackupAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Status</span>
              {status.lastBackupStatus ? (
                <Badge tone={status.lastBackupStatus === 'SUCCEEDED' ? 'success' : status.lastBackupStatus === 'FAILED' ? 'danger' : 'info'}>
                  {status.lastBackupStatus}
                </Badge>
              ) : (
                <span className="text-muted">No backups yet</span>
              )}
            </div>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/app/backups')}>
              <Database className="h-4 w-4" aria-hidden />
              Open backups
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title="Administration" description="Everything a super admin manages, in one place." />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {managementCards.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => navigate(c.to)}
                className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/30 hover:bg-surface-muted"
              >
                <c.icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <span>
                  <span className="block text-sm font-semibold text-foreground">{c.label}</span>
                  <span className="block text-xs text-muted">{c.description}</span>
                </span>
              </button>
            ))}
          </div>
        </CardBody>
      </Card>
    </>
  );
}

function IntegrationRow({
  icon: Icon,
  label,
  configured,
  detail,
  onClick,
}: {
  icon: typeof ScrollText;
  label: string;
  configured: boolean;
  detail?: string;
  onClick?: () => void;
}) {
  const content = (
    <>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4 text-muted" aria-hidden />
        <span className="text-sm text-foreground">{label}</span>
        {detail && <span className="text-xs text-muted">({detail})</span>}
      </div>
      <Badge tone={configured ? 'success' : 'neutral'}>{configured ? 'Configured' : 'Not configured'}</Badge>
    </>
  );
  if (!onClick) {
    return <div className="flex items-center justify-between">{content}</div>;
  }
  return (
    <button type="button" onClick={onClick} className="flex w-full items-center justify-between text-left">
      {content}
    </button>
  );
}
