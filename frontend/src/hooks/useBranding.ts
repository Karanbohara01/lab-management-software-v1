import { useEffect, useSyncExternalStore } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { settingsApi, type Branding } from '@/features/settings/api';

type Entry =
  | { userId: number; status: 'loading'; branding: null }
  | { userId: number; status: 'ready'; branding: Branding }
  | { userId: number; status: 'failed'; branding: null };

/**
 * The signed-in clinic's name and logo, shared by every place that shows them (the desktop sidebar
 * and the mobile drawer both do) so the page asks for them once. Kept per signed-in user, so
 * signing in as someone from another clinic never shows the previous clinic's name.
 */
let entry: Entry | null = null;
const listeners = new Set<() => void>();

function set(next: Entry) {
  entry = next;
  listeners.forEach((listener) => listener());
}

function load(userId: number) {
  if (entry?.userId === userId) return; // already loading or loaded for this user
  set({ userId, status: 'loading', branding: null });
  settingsApi
    .getBranding()
    .then((branding) => entry?.userId === userId && set({ userId, status: 'ready', branding }))
    .catch(() => entry?.userId === userId && set({ userId, status: 'failed', branding: null }));
}

/** Lets the Laboratory Settings page update the header straight after a save, without another request. */
export function publishBranding(userId: number, branding: Branding) {
  set({ userId, status: 'ready', branding });
}

export function useBranding(): { status: Entry['status']; branding: Branding | null } {
  const { user } = useAuth();
  const userId = user?.id;
  const current = useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => entry,
  );

  useEffect(() => {
    if (userId != null) load(userId);
  }, [userId]);

  if (userId == null || current?.userId !== userId) return { status: 'loading', branding: null };
  return { status: current.status, branding: current.branding };
}
