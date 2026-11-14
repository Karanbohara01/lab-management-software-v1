import { useState } from 'react';
import { Plus, Building2, CreditCard, AlertTriangle, TrendingUp, Users2 } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { StatTileRow, type StatTileData } from '@/features/dashboard/components/StatTile';
import { useQuery } from '@/hooks/useQuery';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useT } from '@/i18n';
import { platformApi } from './api';
import { OrganizationFormModal } from './OrganizationFormModal';
import { OrganizationDetailModal } from './OrganizationDetailModal';
import { SignupsTrend } from './SignupsTrend';
import { PlanDistributionCard } from './PlanDistributionCard';
import { UpcomingRenewalsCard, RecentClinicsCard, IntegrationAdoptionCard } from './PlatformActivityCards';
import { ORG_STATUS_LABEL, ORG_STATUS_TONE, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, type OrganizationListItem } from './types';

const PARAMS = { q: '' };

/**
 * Platform-level super admin: onboard clinics, watch signups/plan mix/renewals/usage/integration
 * adoption at a glance, and manage each clinic's subscription. Every clinic is fully isolated —
 * patients/orders/results/billing/inventory/audit/test-catalog data, sequence numbering
 * (P000001/ORD000001/…), and IRD/eSewa/Khalti/SMS/WhatsApp credentials (each clinic can set its
 * own from Settings → Laboratory profile, falling back to this deployment's shared config
 * otherwise) — onboarding here creates a real, immediately usable clinic with its own login, not
 * just a registry row.
 */
export function PlatformPage() {
  const t = useT();
  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const summaryQ = useQuery(() => platformApi.summary(), []);
  const dashboardQ = useQuery(() => platformApi.dashboard(), []);
  const plansQ = useQuery(() => platformApi.plans(), []);
  const orgsQ = useQuery(
    () => platformApi.organizations({ query: params.q || undefined, size: 50 }),
    [params.q],
    { cacheKey: `platform-orgs:${params.q}` },
  );

  const refreshAll = () => {
    summaryQ.refetch();
    dashboardQ.refetch();
    orgsQ.refetch();
  };

  const summary = summaryQ.data;
  const stats: StatTileData[] = summary
    ? [
        { label: t('Clinics'), value: summary.totalOrganizations, icon: Building2 },
        { label: t('Active'), value: summary.activeOrganizations, icon: TrendingUp },
        { label: t('Trial'), value: summary.trialOrganizations, icon: Building2 },
        {
          label: t('Past due'),
          value: summary.pastDueSubscriptions,
          icon: AlertTriangle,
          tone: summary.pastDueSubscriptions > 0 ? 'warning' : 'neutral',
        },
        { label: t('MRR (NPR)'), value: summary.monthlyRecurringRevenue.toLocaleString(), icon: CreditCard },
      ]
    : [];

  const columns: Column<OrganizationListItem>[] = [
    { key: 'name', header: t('Clinic'), cell: (o) => <span className="font-medium">{o.name}</span> },
    { key: 'slug', header: t('Slug'), cell: (o) => <span className="font-mono text-xs">{o.slug}</span>, hideOnMobile: true },
    { key: 'city', header: t('City'), cell: (o) => o.city ?? '—', hideOnMobile: true },
    { key: 'plan', header: t('Plan'), cell: (o) => o.planName ?? '—' },
    {
      key: 'usage',
      header: t('Usage'),
      cell: (o) => (
        <span className="text-xs text-muted">
          {t('{count} patients · {users} users', { count: o.patientCount.toLocaleString(), users: o.userCount.toLocaleString() })}
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'subStatus',
      header: t('Subscription'),
      cell: (o) =>
        o.subscriptionStatus ? (
          <Badge tone={SUBSCRIPTION_STATUS_TONE[o.subscriptionStatus]}>{t(SUBSCRIPTION_STATUS_LABEL[o.subscriptionStatus])}</Badge>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: t('Clinic status'),
      cell: (o) => <Badge tone={ORG_STATUS_TONE[o.status]}>{t(ORG_STATUS_LABEL[o.status])}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title={t('Platform')}
        description={t('Onboard clinics and manage their subscriptions.')}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            {t('Onboard clinic')}
          </Button>
        }
      />

      <div className="mt-4">
        <StatTileRow stats={stats} />
      </div>

      {dashboardQ.data && (
        <div className="mb-5 grid gap-4 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <SignupsTrend points={dashboardQ.data.signupsByMonth} />
          </div>
          <PlanDistributionCard points={dashboardQ.data.planDistribution} />
          <UpcomingRenewalsCard renewals={dashboardQ.data.upcomingRenewals} />
          <RecentClinicsCard clinics={dashboardQ.data.recentClinics} />
          <IntegrationAdoptionCard adoption={dashboardQ.data.integrationAdoption} />
        </div>
      )}

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Users2 className="h-3.5 w-3.5 text-primary" aria-hidden />
            </span>
            <div>
              <h2 className="text-sm font-semibold text-foreground">{t('All clinics')}</h2>
              {orgsQ.data && <p className="text-xs text-muted">{t('{total} total', { total: orgsQ.data.totalElements.toLocaleString() })}</p>}
            </div>
          </div>
          <div className="sm:w-72">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search clinics…')} />
          </div>
        </div>
        {orgsQ.loading && !orgsQ.data ? (
          <TableSkeleton columns={columns.length} />
        ) : orgsQ.error ? (
          <ErrorState message={orgsQ.error} onRetry={orgsQ.refetch} />
        ) : orgsQ.data && orgsQ.data.content.length === 0 ? (
          <EmptyState title={t('No clinics yet')} message={t('Onboard the first clinic to start tracking their subscription.')} />
        ) : (
          orgsQ.data && (
            <DataTable
              columns={columns}
              rows={orgsQ.data.content}
              rowKey={(o) => o.id}
              onRowClick={(o) => setDetailId(o.id)}
            />
          )
        )}
      </Card>

      <OrganizationFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        plans={plansQ.data ?? []}
        onSaved={refreshAll}
      />
      <OrganizationDetailModal
        open={detailId !== null}
        onClose={() => setDetailId(null)}
        organizationId={detailId}
        plans={plansQ.data ?? []}
        onChanged={refreshAll}
      />
    </>
  );
}
