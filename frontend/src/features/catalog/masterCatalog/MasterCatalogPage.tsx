import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { SPECIMEN_LABELS } from '../types';
import { masterCatalogAdminApi } from './api';
import { MasterTestFormModal } from './MasterTestFormModal';
import type { MasterTestDetail, MasterTestListItem } from './types';

export function MasterCatalogPage() {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => masterCatalogAdminApi.list(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MasterTestDetail | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const openNew = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = async (row: MasterTestListItem) => {
    const detail = await masterCatalogAdminApi.get(row.id);
    setEditing(detail);
    setFormOpen(true);
  };

  const toggleActive = async (row: MasterTestListItem) => {
    setBusyId(row.id);
    try {
      await masterCatalogAdminApi.setActive(row.id, !row.active);
      toast.success(row.active ? 'Hidden from clinics' : 'Visible to clinics');
      refetch();
    } catch {
      toast.error('Unable to update');
    } finally {
      setBusyId(null);
    }
  };

  const columns: Column<MasterTestListItem>[] = [
    { key: 'code', header: 'Code', cell: (t) => <span className="font-mono text-xs">{t.code}</span> },
    { key: 'name', header: 'Name', cell: (t) => t.name },
    { key: 'dept', header: 'Department', cell: (t) => t.departmentName, hideOnMobile: true },
    { key: 'specimen', header: 'Specimen', cell: (t) => SPECIMEN_LABELS[t.specimenType], hideOnMobile: true },
    { key: 'params', header: 'Params', cell: (t) => t.parameterCount, hideOnMobile: true },
    { key: 'price', header: 'Suggested price', cell: (t) => formatMoney(t.suggestedPrice), className: 'text-right' },
    {
      key: 'active',
      header: 'Status',
      cell: (t) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleActive(t);
          }}
          disabled={busyId === t.id}
        >
          <Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'Active' : 'Hidden'}</Badge>
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Master lab catalogue"
        description="Curate a shared library of common tests every clinic can import instead of building from scratch."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden />
            New master test
          </Button>
        }
      />

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title="No master tests yet" message="Add the first one for clinics to import." />
        ) : (
          data && <DataTable columns={columns} rows={data} rowKey={(t) => t.id} onRowClick={openEdit} />
        )}
      </Card>

      <MasterTestFormModal open={formOpen} onClose={() => setFormOpen(false)} test={editing} onSaved={refetch} />
    </>
  );
}
