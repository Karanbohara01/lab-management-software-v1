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
import { TableSkeleton, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useListParams, useSearchInput } from '@/hooks/useListParams';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { suppliersApi } from './api';
import type { Supplier } from './types';

const PAGE_SIZE = 20;
/** Lives in the URL, so the search and page survive leaving the page and coming back. */
const PARAMS = { q: '', page: 1 };

export function SuppliersPage() {
  const t = useT();
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.INVENTORY_WRITE);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [open, setOpen] = useState(false);

  const { params, set } = useListParams(PARAMS);
  const [search, setSearch] = useSearchInput(params.q, (q) => set({ q }, { replace: true }));

  const { data, loading, error, refetch } = useQuery(
    () => suppliersApi.list({ query: params.q || undefined, activeOnly: false, page: params.page - 1, size: PAGE_SIZE }),
    [params.q, params.page],
    { cacheKey: `suppliers:${params.q}:${params.page}` },
  );

  const columns: Column<Supplier>[] = [
    { key: 'name', header: t('Name'), cell: (s) => <span className="font-medium">{s.name}</span> },
    { key: 'contact', header: t('Contact'), cell: (s) => s.contactPerson ?? '—', hideOnMobile: true },
    { key: 'phone', header: t('Phone'), cell: (s) => s.phone ?? '—', hideOnMobile: true },
    { key: 'status', header: t('Status'), cell: (s) => <Badge tone={s.active ? 'success' : 'neutral'}>{t(s.active ? 'Active' : 'Inactive')}</Badge> },
  ];

  return (
    <>
      <PageHeader
        title={t('Suppliers')}
        description={t('Vendors that supply reagents, kits and consumables.')}
        actions={
          canWrite ? (
            <Button onClick={() => { setEditing(null); setOpen(true); }}>
              <Plus className="h-4 w-4" aria-hidden />
              {t('New supplier')}
            </Button>
          ) : undefined
        }
      />

      <Card>
        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} placeholder={t('Search suppliers')} />
          </div>
        </div>
        {loading && !data ? (
          <TableSkeleton columns={columns.length} />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title={t('No suppliers')} message={t('Add a supplier to record purchases.')} />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(s) => s.id}
                onRowClick={canWrite ? (s) => { setEditing(s); setOpen(true); } : undefined}
              />
              <Pagination
                page={data.page}
                totalPages={data.totalPages}
                totalElements={data.totalElements}
                onPageChange={(p) => set({ page: p + 1 })}
              />
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
  const t = useT();
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
      toast.success(supplier ? t('Supplier updated') : t('Supplier added'));
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('Unable to save'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={supplier ? t('Edit supplier') : t('New supplier')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button onClick={submit} loading={busy}>
            {supplier ? t('Save') : t('Add supplier')}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <Alert tone="danger">{err}</Alert>}
        <Input label={t('Name')} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label={t('Contact person')} value={f.contactPerson} onChange={(e) => setF({ ...f, contactPerson: e.target.value })} />
          <Input label={t('Phone')} value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          <Input label={t('Email')} type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input label={t('PAN number')} value={f.panNumber} onChange={(e) => setF({ ...f, panNumber: e.target.value })} />
        </div>
        <Textarea label={t('Address')} value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
      </div>
    </Modal>
  );
}
