import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { PermissionGroupList } from '@/features/auth/components/PermissionGroupList';
import { groupAllPermissions, groupGrantedPermissions } from '@/features/auth/permissionGroups';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { useT } from '@/i18n';
import { platformApi, type PlatformRole } from './api';

/**
 * Role → permission editing, platform-wide. role/permission/role_permission carry no
 * organization_id — every clinic on this deployment shares the same role definitions — so this
 * is deliberately gated behind PERM_PLATFORM_MANAGE (see the route guard) rather than exposed to
 * a clinic's own SUPER_ADMIN: a per-clinic admin can already view this matrix read-only from
 * Admin → Roles, but changing it here would change what an ACCOUNTANT (or any role) can do in
 * every other clinic too.
 *
 * A role list rather than nine permission cards side by side — see RolesPage for why. Viewing a
 * role's breakdown and editing it are kept as two separate modals: viewing is read-heavy
 * (grouped chips, scan the whole thing), editing is write-heavy (every permission as a checkbox,
 * grouped the same way so the two stay recognisable as the same data).
 */
export function PlatformRolesPage() {
  const t = useT();
  const { back } = useBackTarget();
  const toast = useToast();
  const rolesQ = useQuery(() => platformApi.roles(), []);
  const permsQ = useQuery(() => platformApi.permissions(), []);
  const [viewing, setViewing] = useState<PlatformRole | null>(null);
  const [editing, setEditing] = useState<PlatformRole | null>(null);

  return (
    <>
      <PageHeader
        back={back}
        title={t('Roles & permissions')}
        description={t('Global permission set for each role — shared by every clinic on this platform.')}
      />
      {rolesQ.loading && !rolesQ.data ? (
        <LoadingState />
      ) : rolesQ.error ? (
        <ErrorState message={rolesQ.error} onRetry={rolesQ.refetch} />
      ) : (
        <Card>
          <DataTable
            columns={[
              {
                key: 'role',
                header: t('Role'),
                cell: (role) => (
                  <div>
                    <p className="font-medium text-foreground">{role.name.replace(/_/g, ' ')}</p>
                    {role.description && <p className="text-xs text-muted">{role.description}</p>}
                  </div>
                ),
              },
              {
                key: 'resources',
                header: t('Resources'),
                cell: (role) => groupGrantedPermissions(role.permissions).length,
                hideOnMobile: true,
              },
              {
                key: 'permissions',
                header: t('Permissions'),
                cell: (role) => role.permissions.length,
              },
              {
                key: 'edit',
                header: '',
                className: 'w-10',
                cell: (role) => (
                  <button
                    onClick={() => setEditing(role)}
                    className="rounded p-1.5 text-muted hover:bg-surface-muted"
                    aria-label={t('Edit permissions for {role}', { role: role.name })}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                ),
              },
            ]}
            rows={rolesQ.data ?? []}
            rowKey={(role) => role.id}
            onRowClick={setViewing}
          />
        </Card>
      )}

      <Modal
        open={!!viewing}
        onClose={() => setViewing(null)}
        title={viewing ? t('Permissions · {role}', { role: viewing.name.replace(/_/g, ' ') }) : ''}
        size="xl"
      >
        {viewing && (
          <>
            <p className="mb-4 text-sm text-muted">
              {viewing.description && <span>{viewing.description} · </span>}
              {t('{permissions} permissions across {resources} resources', {
                permissions: viewing.permissions.length,
                resources: groupGrantedPermissions(viewing.permissions).length,
              })}
            </p>
            <PermissionGroupList permissions={viewing.permissions} />
          </>
        )}
      </Modal>

      <EditRolePermissionsModal
        role={editing}
        allPermissions={permsQ.data ?? []}
        onClose={() => setEditing(null)}
        onSaved={() => {
          rolesQ.refetch();
          toast.success(t('Permissions updated'));
        }}
      />
    </>
  );
}

function EditRolePermissionsModal({
  role,
  allPermissions,
  onClose,
  onSaved,
}: {
  role: PlatformRole | null;
  allPermissions: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const t = useT();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    setErr(null);
    setSelected(role?.permissions ?? []);
  }, [role]);

  const toggle = (p: string) =>
    setSelected((prev) => (prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]));

  const submit = async () => {
    if (!role) return;
    setBusy(true);
    setErr(null);
    try {
      await platformApi.updateRolePermissions(role.id, selected);
      onSaved();
      onClose();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : t('Unable to update permissions'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!role}
      onClose={onClose}
      title={role ? t('Permissions · {role}', { role: role.name.replace(/_/g, ' ') }) : ''}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            {t('Cancel')}
          </Button>
          <Button onClick={submit} loading={busy}>
            {t('Save')}
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {err && <Alert tone="danger">{err}</Alert>}
        <p className="text-xs text-muted">
          {t('This changes what every user with this role can do, on every clinic on this platform — not just one.')}
        </p>
        <div className="max-h-96 space-y-4 overflow-y-auto pr-1">
          {groupAllPermissions(allPermissions).map((group) => (
            <div key={group.label}>
              <p className="flex items-center gap-1.5 text-label uppercase text-muted">
                <group.icon className="h-4 w-4" aria-hidden />
                {t(group.label)}
              </p>
              <div className="mt-1.5 grid gap-1.5 sm:grid-cols-2">
                {group.entries.map((e) => (
                  <label key={e.permission} className="flex items-center gap-2 text-sm text-foreground">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-input"
                      checked={selected.includes(e.permission)}
                      onChange={() => toggle(e.permission)}
                    />
                    {t(e.action)}
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
