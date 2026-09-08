import { useMemo } from 'react';
import { useAppSelector } from '@/store/hooks';

/** Read-only view of the current session plus permission/role helpers. */
export function useAuth() {
  const { user, status, loginPending, loginError } = useAppSelector((s) => s.auth);

  return useMemo(() => {
    const permissions = new Set(user?.permissions ?? []);
    const roles = new Set(user?.roles ?? []);
    return {
      user,
      status,
      loginPending,
      loginError,
      isAuthenticated: status === 'authenticated' && !!user,
      hasPermission: (perm: string) => permissions.has(perm),
      hasAnyPermission: (perms: string[]) => perms.some((p) => permissions.has(p)),
      hasRole: (role: string) => roles.has(role),
    };
  }, [user, status, loginPending, loginError]);
}
