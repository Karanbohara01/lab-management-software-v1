import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardPlus, LogOut, Menu, Plus, UserPlus, UserRound } from 'lucide-react';
import { useAppDispatch } from '@/store/hooks';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { logout } from '@/features/auth/authSlice';
import { Button } from '@/components/ui/Button';
import { NotificationBell } from '@/features/notifications/NotificationBell';
import { CommandSearch } from './CommandSearch';

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const canCreateOrder = hasPermission(PERMISSIONS.LAB_ORDER_WRITE);
  const canCreatePatient = hasPermission(PERMISSIONS.PATIENT_WRITE);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-surface/95 px-4 backdrop-blur lg:px-6">
      <button
        type="button"
        onClick={onOpenMenu}
        className="rounded-md p-2 text-muted-foreground hover:bg-surface-muted lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden />
      </button>

      <div className="hidden flex-1 sm:block">
        <CommandSearch />
      </div>
      <div className="flex-1 sm:hidden" />

      {(canCreateOrder || canCreatePatient) && (
        <div className="relative">
          <Button size="sm" onClick={() => setCreateOpen((v) => !v)} aria-haspopup="menu" aria-expanded={createOpen}>
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">New</span>
          </Button>
          {createOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setCreateOpen(false)} aria-hidden />
              <div
                role="menu"
                className="absolute right-0 z-20 mt-2 w-52 rounded-md border border-border bg-surface p-1 shadow-popover"
              >
                {canCreateOrder && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/app/orders/new');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                  >
                    <ClipboardPlus className="h-4 w-4 text-muted" aria-hidden />
                    New lab order
                  </button>
                )}
                {canCreatePatient && (
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setCreateOpen(false);
                      navigate('/app/patients/new');
                    }}
                    className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-foreground hover:bg-surface-muted"
                  >
                    <UserPlus className="h-4 w-4 text-muted" aria-hidden />
                    Register patient
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      )}

      <NotificationBell />

      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <UserRound className="h-4 w-4" aria-hidden />
          </span>
          <span className="hidden text-left sm:block">
            <span className="block font-medium text-foreground">{user?.fullName}</span>
            <span className="block text-xs text-muted">{user?.roles.join(', ')}</span>
          </span>
        </button>

        {menuOpen && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} aria-hidden />
            <div
              role="menu"
              className="absolute right-0 z-20 mt-2 w-56 rounded-md border border-border bg-surface p-1 shadow-popover"
            >
              <div className="px-3 py-2 text-sm">
                <p className="font-medium text-foreground">{user?.fullName}</p>
                <p className="text-xs text-muted">{user?.email}</p>
              </div>
              <div className="my-1 h-px bg-border" />
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start"
                onClick={() => dispatch(logout())}
                role="menuitem"
              >
                <LogOut className="h-4 w-4" aria-hidden />
                Sign out
              </Button>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
