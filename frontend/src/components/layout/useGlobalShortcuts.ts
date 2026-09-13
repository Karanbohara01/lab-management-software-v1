import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/features/auth/useAuth';
import { NAV_SECTIONS } from './navigation';
import { GO_TO_SHORTCUTS, GO_TO_TIMEOUT_MS } from './shortcuts';

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el) return false;
  if (el.isContentEditable) return true;
  return ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName);
}

/**
 * Global keyboard shortcuts, mounted once at the app shell:
 *  - Mod+K focuses the topbar's global search input (id="topbar-search-input").
 *  - `?` opens the keyboard shortcuts help modal.
 *  - `g` then a mapped letter (within GO_TO_TIMEOUT_MS) navigates to a nav section,
 *    skipping destinations the user lacks permission for.
 * All bindings are suppressed while focus is in a text input, except the leader key
 * reset, so shortcuts never hijack normal typing.
 */
export function useGlobalShortcuts(onOpenHelp: () => void) {
  const navigate = useNavigate();
  const { hasAnyPermission } = useAuth();
  const leaderActive = useRef(false);
  const leaderTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearLeader = () => {
      leaderActive.current = false;
      if (leaderTimer.current) clearTimeout(leaderTimer.current);
      leaderTimer.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const typing = isTypingTarget(e.target);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        clearLeader();
        document.getElementById('topbar-search-input')?.focus();
        return;
      }

      if (typing) return;

      if (leaderActive.current) {
        clearLeader();
        const match = GO_TO_SHORTCUTS.find((s) => s.key === e.key.toLowerCase());
        if (!match) return;
        const item = NAV_SECTIONS.flatMap((s) => s.items).find((i) => i.to === match.to);
        if (!item) return;
        if (item.anyPermission.length > 0 && !hasAnyPermission(item.anyPermission)) return;
        e.preventDefault();
        navigate(item.to);
        return;
      }

      if (e.key === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        leaderActive.current = true;
        leaderTimer.current = setTimeout(clearLeader, GO_TO_TIMEOUT_MS);
        return;
      }

      if (e.key === '?') {
        e.preventDefault();
        onOpenHelp();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      clearLeader();
    };
  }, [navigate, hasAnyPermission, onOpenHelp]);
}
