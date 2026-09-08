import { useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Select } from '@/components/ui/Select';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { departmentsApi } from '@/features/departments/api';
import { testCatalogApi } from './api';
import { SPECIMEN_LABELS, type TestDetail, type TestListItem } from './types';
import { TestFormModal } from './TestFormModal';

const PAGE_SIZE = 20;
const npr = new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 });

export function TestCatalogPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.TEST_CATALOG_WRITE);

  const [search, setSearch] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<TestDetail | null>(null);
  const [loadingEdit, setLoadingEdit] = useState(false);

  const departments = useQuery(() => departmentsApi.list(false), []);
  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () =>
      testCatalogApi.list({
        query: debouncedSearch || undefined,
        departmentId: departmentId ? Number(departmentId) : undefined,
        activeOnly: false,
        page,
        size: PAGE_SIZE,
      }),
    [debouncedSearch, departmentId, page],
  );

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const openEdit = async (row: TestListItem) => {
    setLoadingEdit(true);
    try {
      const detail = await testCatalogApi.get(row.id);
      setEditing(detail);
      setModalOpen(true);
    } finally {
      setLoadingEdit(false);
    }
  };

  const columns: Column<TestListItem>[] = [
    { key: 'code', header: 'Code', cell: (t) => <span className="font-mono text-xs">{t.code}</span> },
    { key: 'name', header: 'Test', cell: (t) => <span className="font-medium">{t.name}</span> },
    { key: 'dept', header: 'Department', cell: (t) => t.departmentName, hideOnMobile: true },
    { key: 'specimen', header: 'Specimen', cell: (t) => SPECIMEN_LABELS[t.specimenType], hideOnMobile: true },
    { key: 'params', header: 'Params', cell: (t) => t.parameterCount, hideOnMobile: true },
    { key: 'price', header: 'Price', cell: (t) => npr.format(t.price), className: 'text-right' },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => <Badge tone={t.active ? 'success' : 'neutral'}>{t.active ? 'Active' : 'Inactive'}</Badge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Test catalog"
        description="Configure tests, their specimen requirements, pricing and result parameters."
        actions={
          canWrite ? (
            <Button onClick={openCreate} loading={loadingEdit}>
              <Plus className="h-4 w-4" aria-hidden />
              New test
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row">
          <div className="sm:max-w-xs sm:flex-1">
            <SearchInput
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(0);
              }}
              placeholder="Search by name or code"
            />
          </div>
          <div className="sm:w-56">
            <Select
              options={[
                { value: '', label: 'All departments' },
                ...(departments.data ?? []).map((d) => ({ value: String(d.id), label: d.name })),
              ]}
              value={departmentId}
              onChange={(e) => {
                setDepartmentId(e.target.value);
                setPage(0);
              }}
            />
          </div>
        </div>

        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState
            title="No tests found"
            message={debouncedSearch || departmentId ? 'Adjust the filters.' : 'Add the first test to the catalog.'}
            action={canWrite && !debouncedSearch && !departmentId ? <Button onClick={openCreate}>New test</Button> : undefined}
          />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(t) => t.id}
                onRowClick={canWrite ? openEdit : undefined}
              />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={setPage}
              />
            </>
          )
        )}
      </Card>

      <TestFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        test={editing}
        departments={departments.data ?? []}
        onSaved={refetch}
      />
    </>
  );
}
