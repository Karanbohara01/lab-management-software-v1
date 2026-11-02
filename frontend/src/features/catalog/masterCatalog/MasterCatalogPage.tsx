import { useMemo, useState } from 'react';
import { Plus, Library, CheckCircle2, Building2, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { StatTileRow, type StatTileData } from '@/features/dashboard/components/StatTile';
import { useToast } from '@/components/ui/toast';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { SPECIMEN_LABELS } from '../types';
import { masterCatalogAdminApi } from './api';
import { MasterTestFormModal } from './MasterTestFormModal';
import type { MasterTestDetail, MasterTestListItem } from './types';

/** Lives in the URL, so the view survives a refresh and can be shared, even though it filters client-side. */
const PARAMS = { q: '', department: '', status: '' };

export function MasterCatalogPage() {
  const { back } = useBackTarget();
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => masterCatalogAdminApi.list(), []);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MasterTestDetail | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);

  const { params, set, reset } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }), 250);

  const departments = useMemo(() => {
    const names = new Set((data ?? []).map((t) => t.departmentName));
    return Array.from(names).sort((a, b) => a.localeCompare(b));
  }, [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const q = params.q.trim().toLowerCase();
    return data.filter((t) => {
      if (params.department && t.departmentName !== params.department) return false;
      if (params.status === 'active' && !t.active) return false;
      if (params.status === 'hidden' && t.active) return false;
      if (q && !t.name.toLowerCase().includes(q) && !t.code.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [data, params.q, params.department, params.status]);

  const hasFilters = !!(search || params.department || params.status);
  const clearFilters = () => {
    // The search box holds its own text while typing, so clearing the URL alone would leave it filled.
    setSearch('');
    reset();
  };

  const stats: StatTileData[] = data
    ? [
        { label: 'Total tests', value: data.length, icon: Library },
        { label: 'Active (visible to clinics)', value: data.filter((t) => t.active).length, icon: CheckCircle2 },
        { label: 'Departments', value: departments.length, icon: Building2 },
      ]
    : [];

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
    { key: 'name', header: 'Name', cell: (t) => <span className="font-medium">{t.name}</span> },
    {
      key: 'dept',
      header: 'Department',
      cell: (t) => <Badge tone="info">{t.departmentName}</Badge>,
      hideOnMobile: true,
    },
    { key: 'specimen', header: 'Specimen', cell: (t) => SPECIMEN_LABELS[t.specimenType], hideOnMobile: true },
    { key: 'params', header: 'Params', cell: (t) => t.parameterCount, className: 'text-right', hideOnMobile: true },
    {
      key: 'price',
      header: 'Suggested price',
      cell: (t) => formatMoney(t.suggestedPrice),
      className: 'text-right',
    },
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
        back={back}
        title="Master lab catalogue"
        description="Curate a shared library of common tests every clinic can import instead of building from scratch."
        actions={
          <Button onClick={openNew}>
            <Plus className="h-4 w-4" aria-hidden />
            New master test
          </Button>
        }
      />

      {data && data.length > 0 && <StatTileRow stats={stats} />}

      <Card>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.length === 0 ? (
          <EmptyState title="No master tests yet" message="Add the first one for clinics to import." />
        ) : (
          data && (
            <>
              <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center">
                <div className="sm:max-w-xs sm:flex-1">
                  <SearchInput
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search by name or code"
                  />
                </div>
                <div className="sm:w-56">
                  <Select
                    options={[
                      { value: '', label: 'All departments' },
                      ...departments.map((d) => ({ value: d, label: d })),
                    ]}
                    value={params.department}
                    onChange={(e) => set({ department: e.target.value })}
                  />
                </div>
                <div className="sm:w-40">
                  <Select
                    options={[
                      { value: '', label: 'All statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'hidden', label: 'Hidden' },
                    ]}
                    value={params.status}
                    onChange={(e) => set({ status: e.target.value })}
                  />
                </div>
                {hasFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="sm:ml-auto">
                    <X className="h-3.5 w-3.5" aria-hidden />
                    Clear filters
                  </Button>
                )}
              </div>

              <div className="border-b border-border px-4 py-2 text-xs text-muted">
                Showing <span className="font-medium text-foreground">{filtered.length}</span> of{' '}
                <span className="font-medium text-foreground">{data.length}</span> tests
              </div>

              {filtered.length === 0 ? (
                <EmptyState
                  title="No tests match your filters"
                  message="Try a different search term or department."
                  action={
                    <Button variant="secondary" onClick={clearFilters}>
                      Clear filters
                    </Button>
                  }
                />
              ) : (
                <DataTable columns={columns} rows={filtered} rowKey={(t) => t.id} onRowClick={openEdit} />
              )}
            </>
          )
        )}
      </Card>

      <MasterTestFormModal open={formOpen} onClose={() => setFormOpen(false)} test={editing} onSaved={refetch} />
    </>
  );
}
