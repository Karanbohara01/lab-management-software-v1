import { useEffect, useState } from 'react';
import { Pencil } from 'lucide-react';
import { BackLink } from '@/components/BackLink';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { platformApi, type PlatformRole } from './api';

/**
 * Role → permission editing, platform-wide. role/permission/role_permission carry no
 * organization_id — every clinic on this deployment shares the same role definitions — so this
 * is deliberately gated behind PERM_PLATFORM_MANAGE (see the route guard) rather than exposed to
 * a clinic's own SUPER_ADMIN: a per-clinic admin can already view this matrix read-only from
 * Admin → Roles, but changing it here would change what an ACCOUNTANT (or any role) can do in
 * every other clinic too.
 */
export function PlatformRolesPage() {
  const toast = useToast();
  const rolesQ = useQuery(() => platformApi.roles(), []);
  const permsQ = useQuery(() => platformApi.permissions(), []);
  const [editing, setEditing] = useState<PlatformRole | null>(null);

  return (
    <>
      <BackLink to="/app/platform">Back to platform</BackLink>
      <PageHeader
        title="Roles & permissions"
        description="Global permission set for each role — shared by every clinic on this platform."
      />
      {rolesQ.loading && !rolesQ.data ? (
        <LoadingState />
      ) : rolesQ.error ? (
        <ErrorState message={rolesQ.error} onRetry={rolesQ.refetch} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {(rolesQ.data ?? []).map((role) => (
            <Card key={role.id}>
              <CardHeader
                title={role.name.replace(/_/g, ' ')}
                description={role.description ?? undefined}
                action={
                  <button
                    onClick={() => setEditing(role)}
                    className="rounded p-1.5 text-muted hover:bg-surface-muted"
                    aria-label={`Edit permissions for ${role.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                }
              />
              <CardBody>
                <p className="mb-2 text-xs text-muted">{role.permissions.length} permissions</p>
                <div className="flex flex-wrap gap-1.5">
                  {role.permissions.length === 0 ? (
                    <span className="text-xs text-muted">No permissions granted.</span>
                  ) : (
                    role.permissions.map((p) => (
                      <Badge key={p} tone="neutral">
                        {p}
                      </Badge>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      <EditRolePermissionsModal
        role={editing}
        allPermissions={permsQ.data ?? []}
        onClose={() => setEditing(null)}
        onSaved={() => {
          rolesQ.refetch();
          toast.success('Permissions updated');
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
      setErr(e instanceof ApiError ? e.message : 'Unable to update permissions');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={!!role}
      onClose={onClose}
      title={role ? `Permissions · ${role.name.replace(/_/g, ' ')}` : ''}
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} loading={busy}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-3">
        {err && <Alert tone="danger">{err}</Alert>}
        <p className="text-xs text-muted">
          This changes what every user with this role can do, on every clinic on this platform — not just one.
        </p>
        <div className="grid max-h-96 gap-2 overflow-y-auto sm:grid-cols-2">
          {allPermissions.map((p) => (
            <label key={p} className="flex items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-input"
                checked={selected.includes(p)}
                onChange={() => toggle(p)}
              />
              <span className="font-mono text-xs">{p}</span>
            </label>
          ))}
        </div>
      </div>
    </Modal>
  );
}
