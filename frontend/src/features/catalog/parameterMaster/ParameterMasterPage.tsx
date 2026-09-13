import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { parameterMasterApi } from './api';
import { ParameterMasterFormModal } from './ParameterMasterFormModal';
import { PARAMETER_DATA_TYPE_LABEL, type ParameterMaster } from './types';

/**
 * This clinic's own reusable analyte dictionary — pick a parameter here once (unit, typical adult
 * reference range, method, LOINC code) and it prefills as a starting point every time that
 * parameter is added to a test's own parameter list. Editing an entry here never changes a test
 * that already used it — each test owns its own copy from the moment it's added.
 */
export function ParameterMasterPage() {
  const toast = useToast();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.TEST_CATALOG_WRITE);
  const [query, setQuery] = useState('');
  const debouncedQuery = useDebouncedValue(query, 300);
  const [editing, setEditing] = useState<ParameterMaster | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(
    () => parameterMasterApi.list({ query: debouncedQuery, activeOnly: false }),
    [debouncedQuery],
  );

  const toggleActive = async (p: ParameterMaster) => {
    try {
      await (p.active ? parameterMasterApi.deactivate(p.id) : parameterMasterApi.activate(p.id));
      toast.success(p.active ? 'Parameter deactivated' : 'Parameter activated');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Unable to update parameter');
    }
  };

  const columns: Column<ParameterMaster>[] = [
    { key: 'name', header: 'Name', cell: (p) => <span className="font-medium">{p.name}</span> },
    { key: 'code', header: 'Code', cell: (p) => <span className="font-mono text-xs">{p.code ?? '—'}</span>, hideOnMobile: true },
    { key: 'unit', header: 'Unit', cell: (p) => p.unit ?? '—', hideOnMobile: true },
    { key: 'type', header: 'Type', cell: (p) => PARAMETER_DATA_TYPE_LABEL[p.dataType] },
    {
      key: 'range',
      header: 'Typical range',
      cell: (p) => (p.lowValue != null || p.highValue != null ? `${p.lowValue ?? '…'} – ${p.highValue ?? '…'}` : '—'),
      hideOnMobile: true,
    },
    {
      key: 'active',
      header: 'Status',
      cell: (p) => (
        <button
          type="button"
          disabled={!canWrite}
          onClick={(e) => {
            e.stopPropagation();
            toggleActive(p);
          }}
          className="disabled:cursor-default"
        >
          <Badge tone={p.active ? 'success' : 'neutral'}>{p.active ? 'Active' : 'Inactive'}</Badge>
        </button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Parameter dictionary"
        description="Reusable analyte defaults offered when adding a parameter to a test."
        actions={
          canWrite && (
            <Button
              onClick={() => {
                setEditing(null);
                setModalOpen(true);
              }}
            >
              <Plus className="h-4 w-4" aria-hidden />
              New parameter
            </Button>
          )
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <SearchInput value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search parameters…" />
        </div>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No parameters yet"
            message="Add your first analyte to start building your reusable parameter dictionary."
          />
        ) : (
          data && (
            <DataTable
              columns={columns}
              rows={data.content}
              rowKey={(p) => p.id}
              onRowClick={(p) => {
                if (!canWrite) return;
                setEditing(p);
                setModalOpen(true);
              }}
            />
          )
        )}
      </Card>

      <ParameterMasterFormModal open={modalOpen} onClose={() => setModalOpen(false)} parameter={editing} onSaved={refetch} />
    </>
  );
}
