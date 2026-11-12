import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { departmentsApi, type Department } from './api';
import { DepartmentFormModal } from './DepartmentFormModal';
import { useT } from '@/i18n';

export function DepartmentsPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.DEPARTMENT_WRITE);
  const [editing, setEditing] = useState<Department | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(() => departmentsApi.list(false), []);

  const columns: Column<Department>[] = [
    { key: 'code', header: t('Code'), cell: (d) => <span className="font-mono text-xs">{d.code}</span> },
    { key: 'name', header: t('Name'), cell: (d) => <span className="font-medium">{d.name}</span> },
    { key: 'desc', header: t('Description'), cell: (d) => d.description ?? '—', hideOnMobile: true },
    {
      key: 'status',
      header: t('Status'),
      cell: (d) => <Badge tone={d.active ? 'success' : 'neutral'}>{t(d.active ? 'Active' : 'Inactive')}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        back={back}
        title={t('Departments')}
        description={t('Laboratory departments group tests, staff and work queues.')}
        actions={
          canWrite ? (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              {t('New department')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title={t('No departments yet')} message={t('Create the first department to organise the catalog.')} />
        ) : (
          data && (
            <DataTable
              columns={columns}
              rows={data}
              rowKey={(d) => d.id}
              onRowClick={
                canWrite
                  ? (d) => {
                      setEditing(d);
                      setModalOpen(true);
                    }
                  : undefined
              }
            />
          )
        )}
      </Card>

      <DepartmentFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        department={editing}
        onSaved={refetch}
      />
    </>
  );
}
