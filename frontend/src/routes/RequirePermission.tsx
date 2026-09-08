import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';

/**
 * Client-side gate. This only hides UI — the backend independently enforces the same
 * permission on every endpoint, which is the real authorization boundary.
 */
export function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: string[];
  children: ReactNode;
}) {
  const { hasAnyPermission } = useAuth();
  if (anyOf.length > 0 && !hasAnyPermission(anyOf)) {
    return <Navigate to="/app/forbidden" replace />;
  }
  return <>{children}</>;
}
