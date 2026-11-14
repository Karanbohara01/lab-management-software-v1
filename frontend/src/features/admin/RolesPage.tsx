import { useState } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { useBackTarget } from '@/lib/navigation';
import { Card } from '@/components/ui/Card';
import { DataTable } from '@/components/ui/DataTable';
import { Modal } from '@/components/ui/Modal';
import { PermissionGroupList } from '@/features/auth/components/PermissionGroupList';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useT } from '@/i18n';
import { groupGrantedPermissions } from '@/features/auth/permissionGroups';
import { adminApi, type AppRole } from './api';

/**
 * A role list, not a wall of per-role permission cards: nine roles' full breakdowns rendered
 * side by side either crammed Lab Administrator's 59 permissions into a corner or left Doctor's
 * 6 floating in mostly empty card space, and neither view showed all nine at a comfortable
 * reading size regardless. One row per role here, permissions on demand in a detail modal — the
 * progressive-disclosure pattern mature permission UIs converge on once a role count exceeds
 * what a side-by-side matrix can hold (industry guidance puts that ceiling around a dozen
 * categories; Lab Administrator alone spans ~20 resource groups).
 */
export function RolesPage() {
  const t = useT();
  const { back } = useBackTarget();
  const { data, loading, error, refetch } = useQuery(() => adminApi.roles(), []);
  const [viewing, setViewing] = useState<AppRole | null>(null);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        back={back}
        title={t('Roles & permissions')}
        description={t('The permission set for each role. Permissions are enforced on the backend for every request.')}
      />
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
          ]}
          rows={data ?? []}
          rowKey={(role) => role.id}
          onRowClick={setViewing}
        />
      </Card>

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
    </>
  );
}
