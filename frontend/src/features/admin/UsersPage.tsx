import { useEffect, useState } from 'react';
import { KeyRound, Plus } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { SearchInput } from '@/components/ui/SearchInput';
import { DataTable, type Column } from '@/components/ui/DataTable';
import { Pagination } from '@/components/ui/Pagination';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { formatDate } from '@/features/patients/format';
import { branchesApi, type Branch } from '@/features/branches/api';
import { adminApi, type AppUserListItem } from './api';

const PAGE_SIZE = 20;

export function UsersPage() {
  const { hasPermission } = useAuth();
  const canWrite = hasPermission(PERMISSIONS.USER_WRITE);
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<AppUserListItem | null>(null);
  const [resetFor, setResetFor] = useState<AppUserListItem | null>(null);

  const debouncedSearch = useDebouncedValue(search, 300);
  const roles = useQuery(() => adminApi.roles(), []);
  const branches = useQuery(() => branchesApi.list(true), []);
  const { data, loading, error, refetch } = useQuery(
    () => adminApi.users({ query: debouncedSearch || undefined, page, size: PAGE_SIZE }),
    [debouncedSearch, page],
  );

  const toggleEnabled = async (u: AppUserListItem) => {
    try {
      await adminApi.setEnabled(u.id, !u.enabled);
      toast.success(u.enabled ? 'User disabled' : 'User enabled');
      refetch();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Action failed');
    }
  };

  const columns: Column<AppUserListItem>[] = [
    { key: 'user', header: 'User', cell: (u) => (
        <span>
          <span className="font-medium">{u.fullName}</span>
          <span className="ml-2 font-mono text-xs text-muted">{u.username}</span>
        </span>
      ) },
    { key: 'roles', header: 'Roles', cell: (u) => (
        <span className="flex flex-wrap gap-1">
          {u.roles.map((r) => <Badge key={r} tone="neutral">{r.replace(/_/g, ' ')}</Badge>)}
        </span>
      ), hideOnMobile: true },
    { key: 'branch', header: 'Home branch', cell: (u) => u.homeBranchName ?? <span className="text-muted">All branches</span>, hideOnMobile: true },
    { key: 'login', header: 'Last login', cell: (u) => (u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'), hideOnMobile: true },
    { key: 'status', header: 'Status', cell: (u) => <Badge tone={u.enabled ? 'success' : 'neutral'}>{u.enabled ? 'Active' : 'Disabled'}</Badge> },
    ...(canWrite
      ? [{
          key: 'actions',
          header: '',
          cell: (u: AppUserListItem) => (
            <div className="flex justify-end gap-1">
              <button
                onClick={(e) => { e.stopPropagation(); setResetFor(u); }}
                className="rounded p-1 text-muted hover:bg-surface-muted"
                aria-label={`Reset password for ${u.username}`}
              >
                <KeyRound className="h-4 w-4" aria-hidden />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); toggleEnabled(u); }}
                className="rounded px-2 py-0.5 text-xs text-muted hover:bg-surface-muted"
              >
                {u.enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          ),
        } as Column<AppUserListItem>]
      : []),
  ];

  return (
    <>
      <PageHeader
        title="Users"
        description="Staff accounts and role assignments."
        actions={canWrite ? <Button onClick={() => { setEditing(null); setFormOpen(true); }}><Plus className="h-4 w-4" aria-hidden /> New user</Button> : undefined}
      />

      <Card>
        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <SearchInput value={search} onChange={(e) => { setSearch(e.target.value); setPage(0); }} placeholder="Search name, username or email" />
          </div>
        </div>
        {loading && !data ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} onRetry={refetch} />
        ) : data && data.content.length === 0 ? (
          <EmptyState title="No users" message="Adjust the search." />
        ) : (
          data && (
            <>
              <DataTable
                columns={columns}
                rows={data.content}
                rowKey={(u) => u.id}
                onRowClick={canWrite ? (u) => { setEditing(u); setFormOpen(true); } : undefined}
              />
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </>
          )
        )}
      </Card>

      <UserFormModal
        open={formOpen}
        onClose={() => setFormOpen(false)}
        userId={editing?.id ?? null}
        roles={(roles.data ?? []).map((r) => r.name)}
        branches={branches.data ?? []}
        onSaved={refetch}
      />
      <ResetPasswordModal user={resetFor} onClose={() => setResetFor(null)} />
    </>
  );
}

function UserFormModal({
  open,
  onClose,
  userId,
  roles,
  branches,
  onSaved,
}: {
  open: boolean;
  onClose: () => void;
  userId: number | null;
  roles: string[];
  branches: Branch[];
  onSaved: () => void;
}) {
  const toast = useToast();
  const [f, setF] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: '',
    roleNames: [] as string[],
    homeBranchId: '' as string,
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setErr(null);
    if (userId) {
      adminApi.user(userId).then((u) =>
        setF({
          username: u.username,
          email: u.email,
          fullName: u.fullName,
          phone: u.phone ?? '',
          password: '',
          roleNames: u.roles,
          homeBranchId: u.homeBranchId ? String(u.homeBranchId) : '',
        }),
      );
    } else {
      setF({ username: '', email: '', fullName: '', phone: '', password: '', roleNames: [], homeBranchId: '' });
    }
  }, [open, userId]);

  const toggleRole = (r: string) =>
    setF((prev) => ({ ...prev, roleNames: prev.roleNames.includes(r) ? prev.roleNames.filter((x) => x !== r) : [...prev.roleNames, r] }));

  const submit = async () => {
    setBusy(true);
    setErr(null);
    try {
      const homeBranchId = f.homeBranchId ? Number(f.homeBranchId) : null;
      if (userId) {
        await adminApi.updateUser(userId, {
          email: f.email.trim(),
          fullName: f.fullName.trim(),
          phone: f.phone || undefined,
          roleNames: f.roleNames,
          homeBranchId,
        });
        toast.success('User updated');
      } else {
        await adminApi.createUser({
          username: f.username.trim(),
          email: f.email.trim(),
          fullName: f.fullName.trim(),
          phone: f.phone || undefined,
          roleNames: f.roleNames,
          homeBranchId,
          password: f.password,
        });
        toast.success('User created');
      }
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Unable to save user');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={userId ? 'Edit user' : 'New user'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={f.roleNames.length === 0}>{userId ? 'Save' : 'Create user'}</Button>
        </>
      }
    >
      <div className="space-y-4">
        {err && <Alert tone="danger">{err}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <Input label="Username" disabled={!!userId} value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} />
          <Input label="Full name" value={f.fullName} onChange={(e) => setF({ ...f, fullName: e.target.value })} />
          <Input label="Email" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
          <Input label="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
          {!userId && (
            <Input
              label="Initial password"
              type="password"
              hint="At least 8 characters"
              value={f.password}
              onChange={(e) => setF({ ...f, password: e.target.value })}
            />
          )}
          <div>
            <Select
              label="Home branch"
              placeholder="All branches"
              value={f.homeBranchId}
              onChange={(e) => setF({ ...f, homeBranchId: e.target.value })}
              options={branches.map((b) => ({ value: String(b.id), label: b.name }))}
            />
            <p className="mt-1 text-xs text-muted">Leave blank for access to every branch (HQ / roaming staff).</p>
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-medium text-foreground">Roles</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {roles.map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm text-foreground">
                <input type="checkbox" className="h-4 w-4 rounded border-input" checked={f.roleNames.includes(r)} onChange={() => toggleRole(r)} />
                {r.replace(/_/g, ' ')}
              </label>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: AppUserListItem | null; onClose: () => void }) {
  const toast = useToast();
  const [pw, setPw] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setPw('');
    setErr(null);
  }, [user]);

  const submit = async () => {
    if (!user) return;
    setBusy(true);
    setErr(null);
    try {
      await adminApi.resetPassword(user.id, pw);
      toast.success(`Password reset for ${user.username}`);
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : 'Unable to reset password');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={`Reset password · ${user?.username ?? ''}`}
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button onClick={submit} loading={busy} disabled={pw.length < 8}>Reset password</Button>
        </>
      }
    >
      <div className="space-y-3">
        {err && <Alert tone="danger">{err}</Alert>}
        <Input label="New password" type="password" hint="At least 8 characters" value={pw} onChange={(e) => setPw(e.target.value)} />
        <p className="text-xs text-muted">Share the new password with the user through a secure channel.</p>
      </div>
    </Modal>
  );
}
