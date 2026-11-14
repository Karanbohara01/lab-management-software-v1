import {
  Users,
  MapPin,
  Building2,
  TestTubes,
  Database,
  RefreshCw,
} from 'lucide-react';
import {
  FcManager,
  FcLock,
  FcGlobe,
  FcFactory,
  FcBiotech,
  FcPackage,
  FcSurvey,
  FcSettings,
  FcDatabase,
  FcDiploma1,
  FcMoneyTransfer,
  FcSms,
  FcCellPhone,
} from 'react-icons/fc';
import type { IconType } from 'react-icons';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { StatTileRow, type StatTileData } from '@/features/dashboard/components/StatTile';
import { useQuery } from '@/hooks/useQuery';
import { useNavigateFrom } from '@/lib/navigation';
import { adminApi } from './api';
import { useT, getLocale, LOCALE_TAG } from '@/i18n';

function dt(iso: string | null): string {
  return iso ? new Date(iso).toLocaleString(LOCALE_TAG[getLocale()], { dateStyle: 'medium', timeStyle: 'short' }) : '—';
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
  const t = useT();
  const navigate = useNavigateFrom();
  const { data: status, loading, error, refetch } = useQuery(() => adminApi.systemStatus(), []);

  if (loading && !status) return <LoadingState label={t('Loading system status…')} />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!status) return null;

  const orgStats: StatTileData[] = [
    { label: t('Users'), value: `${status.activeUsers}/${status.totalUsers}`, icon: Users, to: '/app/users' },
    { label: t('Branches'), value: `${status.activeBranches}/${status.totalBranches}`, icon: MapPin, to: '/app/branches' },
    { label: t('Departments'), value: status.totalDepartments, icon: Building2, to: '/app/departments' },
    { label: t('Active tests'), value: status.activeTests, icon: TestTubes, to: '/app/tests' },
  ];

  const managementCards: { label: string; description: string; icon: IconType; to: string }[] = [
    { label: t('Users'), description: t('Accounts, roles, enable/disable, reset password'), icon: FcManager, to: '/app/users' },
    { label: t('Roles'), description: t('Review permissions granted per role'), icon: FcLock, to: '/app/roles' },
    { label: t('Branches'), description: t('Locations, contact details, active status'), icon: FcGlobe, to: '/app/branches' },
    { label: t('Departments'), description: t('Lab departments backing the test catalog'), icon: FcFactory, to: '/app/departments' },
    { label: t('Test catalog'), description: t('Analytes, profiles, reference ranges'), icon: FcBiotech, to: '/app/tests' },
    { label: t('Inventory'), description: t('Stock, suppliers, purchase orders'), icon: FcPackage, to: '/app/inventory' },
    { label: t('Audit log'), description: t('Every change, before/after, who and when'), icon: FcSurvey, to: '/app/audit' },
    { label: t('Laboratory settings'), description: t('Letterhead, fiscal year, tax, branding'), icon: FcSettings, to: '/app/settings' },
    { label: t('Backups'), description: t('Run and download database backups'), icon: FcDatabase, to: '/app/backups' },
  ];

  return (
    <>
      <PageHeader
        title={t('Control center')}
        description={t('{labName} · FY {fiscalYear}', { labName: status.labName, fiscalYear: status.fiscalYear })}
        actions={
          <Button variant="secondary" onClick={refetch} loading={loading}>
            <RefreshCw className="h-4 w-4" aria-hidden />
            {t('Refresh')}
          </Button>
        }
      />

      <StatTileRow stats={orgStats} />

      <div className="mb-5 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader
            title={t('Integrations')}
            description={t("Every external service this system can talk to, and whether it's actually wired in.")}
          />
          <CardBody className="space-y-3">
            <IntegrationRow
              icon={FcDiploma1}
              label={t('IRD / CBMS e-billing')}
              configured={status.irdConfigured}
              detail={status.irdEnvironment ?? undefined}
              onClick={() => navigate('/app/ird')}
            />
            {status.paymentProviders.map((p) => (
              <IntegrationRow
                key={p.name}
                icon={FcMoneyTransfer}
                label={t('{name} online payment', { name: p.name })}
                configured={p.configured}
                onClick={() => navigate('/app/invoices')}
              />
            ))}
            <IntegrationRow
              icon={FcSms}
              label={t('SMS report delivery')}
              configured={status.smsConfigured}
              detail={status.smsConfigured ? (status.smsProvider ?? undefined) : undefined}
            />
            <IntegrationRow icon={FcCellPhone} label={t('WhatsApp report delivery')} configured={status.whatsappConfigured} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title={t('Backups')} description={t('Mandatory retention per the e-invoice procedure.')} />
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t('Last backup')}</span>
              <span className="font-medium text-foreground">{dt(status.lastBackupAt)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">{t('Status')}</span>
              {status.lastBackupStatus ? (
                <Badge tone={status.lastBackupStatus === 'SUCCEEDED' ? 'success' : status.lastBackupStatus === 'FAILED' ? 'danger' : 'info'}>
                  {status.lastBackupStatus}
                </Badge>
              ) : (
                <span className="text-muted">{t('No backups yet')}</span>
              )}
            </div>
            <Button variant="secondary" className="w-full" onClick={() => navigate('/app/backups')}>
              <Database className="h-4 w-4" aria-hidden />
              {t('Open backups')}
            </Button>
          </CardBody>
        </Card>
      </div>

      <Card>
        <CardHeader title={t('Administration')} description={t('Everything a super admin manages, in one place.')} />
        <CardBody>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {managementCards.map((c) => (
              <button
                key={c.label}
                type="button"
                onClick={() => navigate(c.to)}
                className="flex items-start gap-3 rounded-lg border border-border p-4 text-left transition-colors hover:border-primary/30 hover:bg-surface-muted"
              >
                <c.icon className="mt-0.5 h-6 w-6 shrink-0" aria-hidden />
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
  icon: IconType;
  label: string;
  configured: boolean;
  detail?: string;
  onClick?: () => void;
}) {
  const t = useT();
  const content = (
    <>
      <div className="flex items-center gap-2">
        <Icon className="h-4 w-4" aria-hidden />
        <span className="text-sm text-foreground">{label}</span>
        {detail && <span className="text-xs text-muted">({detail})</span>}
      </div>
      <Badge tone={configured ? 'success' : 'neutral'}>{configured ? t('Configured') : t('Not configured')}</Badge>
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
