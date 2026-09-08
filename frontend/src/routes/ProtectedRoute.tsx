import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { LoadingState } from '@/components/ui/PageState';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status, isAuthenticated } = useAuth();
  const location = useLocation();

  if (status === 'idle' || status === 'bootstrapping') {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingState label="Restoring your session…" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
