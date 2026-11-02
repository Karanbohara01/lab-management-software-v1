import { useCallback, useEffect, useRef, type ReactNode } from 'react';
import { useBlocker } from 'react-router-dom';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';

/**
 * Keeps a dirty form from being lost: blocks in-app navigation (route change only — URL-param
 * writes on the same page pass) with a Stay / Discard dialog, and arms the browser's own
 * leave-page prompt for refresh and tab close. react-router allows one blocker per router, so
 * only route-level forms use this; form modals use Modal's `confirmClose` instead.
 *
 * Call `allowNextNavigation()` right before the navigation that follows a successful save —
 * react-hook-form's `isDirty` stays true until the form is reset, and the saved data is no longer
 * at risk.
 */
export function useUnsavedChanges(isDirty: boolean): { allowNextNavigation: () => void; dialog: ReactNode } {
  const bypass = useRef(false);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      !bypass.current && isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (!isDirty) {
      bypass.current = false;
      return;
    }
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      if (bypass.current) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    return () => window.removeEventListener('beforeunload', onBeforeUnload);
  }, [isDirty]);

  // If the form stops being dirty while a navigation is held (e.g. a reset), let it through.
  useEffect(() => {
    if (blocker.state === 'blocked' && !isDirty) blocker.proceed();
  }, [blocker, isDirty]);

  const allowNextNavigation = useCallback(() => {
    bypass.current = true;
  }, []);

  const dialog = (
    <UnsavedChangesDialog
      open={blocker.state === 'blocked'}
      onStay={() => blocker.state === 'blocked' && blocker.reset()}
      onDiscard={() => blocker.state === 'blocked' && blocker.proceed()}
    />
  );

  return { allowNextNavigation, dialog };
}
