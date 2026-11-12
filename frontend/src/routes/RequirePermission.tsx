import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import type { FromState } from '@/lib/navigation';

/** What the 403 screen is told about the navigation that was turned away. */
export interface ForbiddenState extends FromState {
  attempted?: string;
}

/**
 * Client-side gate. This only hides UI — the backend independently enforces the same
 * permission on every endpoint, which is the real authorization boundary.
 *
 * The redirect carries the path that was refused (so the 403 can name it) and forwards the
 * origin of the blocked navigation, so "Back to …" there returns where the user actually was
 * instead of dumping them on the dashboard.
 */
export function RequirePermission({
  anyOf,
  children,
}: {
  anyOf: string[];
  children: ReactNode;
}) {
  const { hasAnyPermission } = useAuth();
  const location = useLocation();
  if (anyOf.length > 0 && !hasAnyPermission(anyOf)) {
    const state: ForbiddenState = {
      attempted: location.pathname + location.search,
      from: (location.state as FromState | null)?.from,
    };
    return <Navigate to="/app/forbidden" replace state={state} />;
  }
  return <>{children}</>;
}
