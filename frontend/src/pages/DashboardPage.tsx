import { useEffect, useState } from 'react';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useAuth } from '@/features/auth/useAuth';
import { ROLES } from '@/features/auth/permissions';
import { dashboardApi } from '@/features/dashboard/api';
import { AdminDashboard } from '@/features/dashboard/roles/AdminDashboard';
import { ReceptionistDashboard } from '@/features/dashboard/roles/ReceptionistDashboard';
import { CollectorDashboard } from '@/features/dashboard/roles/CollectorDashboard';
import { TechnicianDashboard } from '@/features/dashboard/roles/TechnicianDashboard';
import { PathologistDashboard } from '@/features/dashboard/roles/PathologistDashboard';
import { AccountantDashboard } from '@/features/dashboard/roles/AccountantDashboard';
import { DoctorDashboard } from '@/features/dashboard/roles/DoctorDashboard';
import type { RoleDashboardProps } from '@/features/dashboard/roles/types';

/**
 * The dashboard is role-based: each staff role lands on a worklist shaped for their part of the
 * pipeline (collect → receive → enter → verify → authorize → report → bill) instead of one
 * generic screen. SUPER_ADMIN / LAB_ADMINISTRATOR — and anyone whose role isn't recognised — get
 * the full enterprise overview, which already hides any section they lack permission for.
 */
export function DashboardPage() {
  const { hasRole } = useAuth();
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { data, loading, error, refetch } = useQuery(() => dashboardApi.summary(), []);

  useEffect(() => {
    if (data) setLastUpdated(new Date());
  }, [data]);

  if (loading && !data) return <LoadingState label="Loading laboratory overview…" />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;
  if (!data) return null;

  const props: RoleDashboardProps = {
    summary: data,
    lastUpdated,
    refreshing: loading,
    onRefresh: refetch,
  };

  if (hasRole(ROLES.SUPER_ADMIN) || hasRole(ROLES.LAB_ADMINISTRATOR)) return <AdminDashboard {...props} />;
  if (hasRole(ROLES.PATHOLOGIST)) return <PathologistDashboard {...props} />;
  if (hasRole(ROLES.LAB_TECHNICIAN)) return <TechnicianDashboard {...props} />;
  if (hasRole(ROLES.SAMPLE_COLLECTION_STAFF)) return <CollectorDashboard {...props} />;
  if (hasRole(ROLES.RECEPTIONIST)) return <ReceptionistDashboard {...props} />;
  if (hasRole(ROLES.ACCOUNTANT)) return <AccountantDashboard {...props} />;
  if (hasRole(ROLES.DOCTOR)) return <DoctorDashboard {...props} />;

  // Unrecognised or custom role combination — fall back to the permission-gated full overview.
  return <AdminDashboard {...props} />;
}
