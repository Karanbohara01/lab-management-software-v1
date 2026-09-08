import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { adminApi } from './api';

export function RolesPage() {
  const { data, loading, error, refetch } = useQuery(() => adminApi.roles(), []);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  return (
    <>
      <PageHeader
        title="Roles & permissions"
        description="The permission set for each role. Permissions are enforced on the backend for every request."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {(data ?? []).map((role) => (
          <Card key={role.id}>
            <CardHeader title={role.name.replace(/_/g, ' ')} description={role.description ?? undefined} />
            <CardBody>
              <p className="mb-2 text-xs text-muted">{role.permissions.length} permissions</p>
              <div className="flex flex-wrap gap-1.5">
                {role.permissions.map((p) => (
                  <Badge key={p} tone="neutral">
                    {p}
                  </Badge>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </>
  );
}
