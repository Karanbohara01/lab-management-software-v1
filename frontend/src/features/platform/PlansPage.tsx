import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
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

  const columns: Column<Plan>[] = [
    { key: 'name', header: 'Plan', cell: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'code', header: 'Code', cell: (p) => <span className="font-mono text-xs">{p.code}</span>, hideOnMobile: true },
    { key: 'price', header: 'Price / mo', cell: (p) => `NPR ${p.priceMonthly.toLocaleString()}` },
    { key: 'users', header: 'Max users', cell: (p) => p.maxUsers, hideOnMobile: true },
    { key: 'branches', header: 'Max branches', cell: (p) => p.maxBranches, hideOnMobile: true },
    {
      key: 'active',
      header: 'Status',
      cell: (p) => <Badge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscription plans"
        description="Pricing tiers offered when onboarding a clinic. Only active plans are offered for new clinics."
        actions={
          <Button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" aria-hidden />
            New plan
          </Button>
        }
      />

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title="No plans yet" message="Create the first plan to start onboarding clinics." />
        ) : (
          data && (
            <DataTable
              columns={columns}
              rows={data}
              rowKey={(p) => p.id}
              onRowClick={(p) => {
                setEditing(p);
                setModalOpen(true);
              }}
            />
          )
        )}
      </Card>

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
