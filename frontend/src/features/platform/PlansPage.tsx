import { useMemo, useState } from 'react';
import { Plus, Users, GitBranch, CreditCard, CheckCircle2 } from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ErrorState, EmptyState } from '@/components/ui/PageState';
import { StatTileRow, type StatTileData } from '@/features/dashboard/components/StatTile';
import { cn } from '@/lib/cn';
import { useQuery } from '@/hooks/useQuery';
import { platformApi } from './api';
import { PlanFormModal } from './PlanFormModal';
import type { Plan } from './types';

/** Subscription plans offered to clinics — previously fixed at three seeded rows with no way to
 * change a price or add a tier without a migration. Real CRUD now, same as everything else. */
export function PlansPage() {
  const [editing, setEditing] = useState<Plan | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(() => platformApi.plans(), []);

  const sorted = useMemo(
    () => (data ? [...data].sort((a, b) => a.displayOrder - b.displayOrder) : []),
    [data],
  );

  const stats: StatTileData[] = data
    ? [
        { label: 'Total plans', value: data.length, icon: CreditCard },
        { label: 'Active (offered to new clinics)', value: data.filter((p) => p.active).length, icon: CheckCircle2 },
        {
          label: 'Price range',
          value:
            data.length === 0
              ? '—'
              : `NPR ${Math.min(...data.map((p) => p.priceMonthly)).toLocaleString()} – ${Math.max(...data.map((p) => p.priceMonthly)).toLocaleString()}`,
          icon: Users,
        },
      ]
    : [];

  const openNew = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = (p: Plan) => {
    setEditing(p);
    setModalOpen(true);
  };

  return (
    <>
      <BackLink to="/app/platform">Back to platform</BackLink>
      <PageHeader
        title="Subscription plans"
        description="Pricing tiers offered when onboarding a clinic. Only active plans are offered for new clinics."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden />
            New plan
          </Button>
        }
      />

      {data && data.length > 0 && <StatTileRow stats={stats} />}

      {loading && !data ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-52 animate-pulse rounded-lg border border-border bg-surface-muted" />
          ))}
        </div>
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : data && data.length === 0 ? (
        <EmptyState
          title="No plans yet"
          message="Create the first plan to start onboarding clinics."
          action={<Button onClick={openNew}>New plan</Button>}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sorted.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => openEdit(p)}
              className={cn(
                'flex flex-col rounded-lg border bg-surface p-5 text-left shadow-card transition-colors hover:border-primary/30 hover:shadow-md',
                p.active ? 'border-border' : 'border-border opacity-70',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-mono text-xs text-muted">{p.code}</p>
                  <h3 className="mt-0.5 text-lg font-semibold text-foreground">{p.name}</h3>
                </div>
                <Badge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge>
              </div>

              <p className="mt-4 flex items-baseline gap-1">
                <span className="text-3xl font-bold text-foreground">NPR {p.priceMonthly.toLocaleString()}</span>
                <span className="text-sm text-muted">/ mo</span>
              </p>

              {p.description ? (
                <p className="mt-2 line-clamp-2 text-sm text-muted">{p.description}</p>
              ) : (
                <p className="mt-2 text-sm italic text-muted">No description</p>
              )}

              <ul className="mt-4 flex-1 space-y-2 border-t border-border pt-4 text-sm text-foreground">
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted" aria-hidden />
                  Up to {p.maxUsers.toLocaleString()} user{p.maxUsers === 1 ? '' : 's'}
                </li>
                <li className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4 text-muted" aria-hidden />
                  Up to {p.maxBranches.toLocaleString()} branch{p.maxBranches === 1 ? '' : 'es'}
                </li>
              </ul>
            </button>
          ))}
        </div>
      )}

      <PlanFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        plan={editing}
        nextDisplayOrder={(data?.length ?? 0) + 1}
        onSaved={refetch}
      />
    </>
  );
}
