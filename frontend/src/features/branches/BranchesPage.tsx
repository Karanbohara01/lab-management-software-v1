import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { branchesApi, type Branch } from './api';
import { BranchFormModal } from './BranchFormModal';

export function BranchesPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.BRANCH_WRITE);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(() => branchesApi.list(false), []);

  const columns: Column<Branch>[] = [
    { key: 'code', header: 'Code', cell: (b) => <span className="font-mono text-xs">{b.code}</span> },
    { key: 'name', header: 'Name', cell: (b) => <span className="font-medium">{b.name}</span> },
    { key: 'city', header: 'City', cell: (b) => b.city ?? '—', hideOnMobile: true },
    { key: 'phone', header: 'Phone', cell: (b) => b.phone ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: 'Status',
      cell: (b) => <Badge tone={b.active ? 'success' : 'neutral'}>{b.active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Branches"
        description="Locations and collection centers. Staff with a home branch see only that branch's orders, samples and invoices."
        actions={
          canWrite ? (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New branch
            </Button>
          ) : undefined
        }
      />

      <Card>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title="No branches yet" message="Create the first branch to enable branch-scoped operations." />
        ) : (
          data && (
            <DataTable
              columns={columns}
              rows={data}
              rowKey={(b) => b.id}
              onRowClick={
                canWrite
                  ? (b) => {
                      setEditing(b);
                      setModalOpen(true);
                    }
                  : undefined
              }
            />
          )
        )}
      </Card>

      <BranchFormModal open={modalOpen} onClose={() => setModalOpen(false)} branch={editing} onSaved={refetch} />
    </>
  );
}
