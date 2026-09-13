import { useState } from 'react';
import { Plus, Building2, CreditCard, AlertTriangle, TrendingUp } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { StatTileRow, type StatTileData } from '@/features/dashboard/components/StatTile';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { platformApi } from './api';
import { OrganizationFormModal } from './OrganizationFormModal';
import { OrganizationDetailModal } from './OrganizationDetailModal';
import { SignupsTrend } from './SignupsTrend';
import { PlanDistributionCard } from './PlanDistributionCard';
import { UpcomingRenewalsCard, RecentClinicsCard, IntegrationAdoptionCard } from './PlatformActivityCards';
import { ORG_STATUS_LABEL, ORG_STATUS_TONE, SUBSCRIPTION_STATUS_LABEL, SUBSCRIPTION_STATUS_TONE, type OrganizationListItem } from './types';

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
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<number | null>(null);

  const summaryQ = useQuery(() => platformApi.summary(), []);
  const dashboardQ = useQuery(() => platformApi.dashboard(), []);
  const plansQ = useQuery(() => platformApi.plans(), []);
  const orgsQ = useQuery(() => platformApi.organizations({ query: debouncedQuery, size: 50 }), [debouncedQuery]);

  const refreshAll = () => {
    summaryQ.refetch();
    dashboardQ.refetch();
    orgsQ.refetch();
  };

  const summary = summaryQ.data;
  const stats: StatTileData[] = summary
    ? [
        { label: 'Clinics', value: summary.totalOrganizations, icon: Building2 },
        { label: 'Active', value: summary.activeOrganizations, icon: TrendingUp },
        { label: 'Trial', value: summary.trialOrganizations, icon: Building2 },
        {
          label: 'Past due',
          value: summary.pastDueSubscriptions,
          icon: AlertTriangle,
          tone: summary.pastDueSubscriptions > 0 ? 'warning' : 'neutral',
        },
        { label: 'MRR (NPR)', value: summary.monthlyRecurringRevenue.toLocaleString(), icon: CreditCard },
      ]
    : [];

  const columns: Column<OrganizationListItem>[] = [
    { key: 'name', header: 'Clinic', cell: (o) => <span className="font-medium">{o.name}</span> },
    { key: 'slug', header: 'Slug', cell: (o) => <span className="font-mono text-xs">{o.slug}</span>, hideOnMobile: true },
    { key: 'city', header: 'City', cell: (o) => o.city ?? '—', hideOnMobile: true },
    { key: 'plan', header: 'Plan', cell: (o) => o.planName ?? '—' },
    {
      key: 'usage',
      header: 'Usage',
      cell: (o) => (
        <span className="text-xs text-muted">
          {o.patientCount.toLocaleString()} patients · {o.userCount.toLocaleString()} users
        </span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'subStatus',
      header: 'Subscription',
      cell: (o) =>
        o.subscriptionStatus ? (
          <Badge tone={SUBSCRIPTION_STATUS_TONE[o.subscriptionStatus]}>{SUBSCRIPTION_STATUS_LABEL[o.subscriptionStatus]}</Badge>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Clinic status',
      cell: (o) => <Badge tone={ORG_STATUS_TONE[o.status]}>{ORG_STATUS_LABEL[o.status]}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Platform"
        description="Onboard clinics and manage their subscriptions."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Onboard clinic
          </Button>
        }
      />

      <div className="mt-4">
        <StatTileRow stats={stats} />
      </div>

      {dashboardQ.data && (
        <div className="mb-5 grid gap-4 lg:grid-cols-2">
          <SignupsTrend points={dashboardQ.data.signupsByMonth} />
          <PlanDistributionCard points={dashboardQ.data.planDistribution} />
          <UpcomingRenewalsCard renewals={dashboardQ.data.upcomingRenewals} />
          <RecentClinicsCard clinics={dashboardQ.data.recentClinics} />
          <IntegrationAdoptionCard adoption={dashboardQ.data.integrationAdoption} />
        </div>
      )}

      <Card>
        <div className="flex items-center justify-between gap-3 border-b border-border p-4">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search clinics…" />
        </div>
        {orgsQ.loading && !orgsQ.data ? (
          <LoadingState />
        ) : orgsQ.error ? (
          <ErrorState message={orgsQ.error} onRetry={orgsQ.refetch} />
        ) : orgsQ.data && orgsQ.data.content.length === 0 ? (
          <EmptyState title="No clinics yet" message="Onboard the first clinic to start tracking their subscription." />
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
