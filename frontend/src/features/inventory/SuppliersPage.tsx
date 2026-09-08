import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { SearchInput } from '@/components/ui/SearchInput';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { suppliersApi } from './api';
import type { Supplier } from './types';

const PAGE_SIZE = 20;

export function SuppliersPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);

  const debouncedSearch = useDebouncedValue(search, 300);
  const { data, loading, error, refetch } = useQuery(
    () => suppliersApi.list({ query: debouncedSearch || undefined, activeOnly: false, page, size: PAGE_SIZE }),
    [debouncedSearch, page],
  );

  const columns: Column<Supplier>[] = [
    { key: 'name', header: 'Name', cell: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'contact', header: 'Contact', cell: (s) => s.contactPerson ?? '—', hideOnMobile: true },
    { key: 'phone', header: 'Phone', cell: (s) => s.phone ?? '—', hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (s) => <Badge tone={s.active ? 'success' : 'neutral'}>{s.active ? 'Active' : 'Inactive'}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title="Suppliers"
        description="Vendors that supply reagents, kits and consumables."
        actions={
          canWrite ? (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden />
              New supplier
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search suppliers" />
          </div>
        </div>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="No suppliers" message="Add a supplier to record purchases." />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(s) => s.id}
                onRowClick={canWrite ? (s) => { setEditing(s); setOpen(true); } : undefined}
              />
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Card>

      <SupplierFormModal open={open} onClose={() => setOpen(false)} supplier={editing} onSaved={refetch} />
    </>
  );
}

function SupplierFormModal({
  open,
  onClose,
  supplier,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  supplier: Supplier | null;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState({ name: '', contactPerson: '', phone: '', email: '', address: '', panNumber: '' });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setF(
      supplier
        ? {
            name: supplier.name,
            contactPerson: supplier.contactPerson ?? '',
            phone: supplier.phone ?? '',
            email: supplier.email ?? '',
            address: supplier.address ?? '',
            panNumber: supplier.panNumber ?? '',
          }
        : { name: '', contactPerson: '', phone: '', email: '', address: '', panNumber: '' },
    );
  }, [open, supplier]);

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const payload = { ...f, name: f.name.trim() };
      if (supplier) await suppliersApi.update(supplier.id, payload);
      else await suppliersApi.create(payload);
      toast.success(supplier ? 'Supplier updated' : 'Supplier added');
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Unable to save');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? 'Edit supplier' : 'New supplier'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            {supplier ? 'Save' : 'Add supplier'}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <Alert tone="danger">{err}</Alert>}
        <Input label="Name" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Contact person" value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} />
          <Input label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input label="PAN number" value={f.panNumber} onChange={(e) => setF({ ...f, panNumber: e.target.value })} />
        </div>
        <Textarea label="Address" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
      </div>
    </Modal>
  );
}
