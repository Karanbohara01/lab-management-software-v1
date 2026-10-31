import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

export type ThemePreference = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'lims-theme';

function systemPrefersDark(): boolean {
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function resolve(preference: ThemePreference): 'light' | 'dark' {
  return preference === 'system' ? (systemPrefersDark() ? 'dark' : 'light') : preference;
}

function apply(preference: ThemePreference) {
  document.documentElement.classList.toggle('dark', resolve(preference) === 'dark');
}

function readStored(): ThemePreference {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
  } catch {
    return 'system';
  }
}

/**
 * Tri-state (light/dark/system) theme preference, persisted to localStorage. The initial class
 * on <html> is set synchronously by an inline script in index.html (before React hydrates) to
 * avoid a flash of the wrong theme on load — this hook just keeps that in sync afterward,
 * including live-following the OS when the preference is "system".
 */
export function useTheme() {
  const [preference, setPreferenceState] = useState<ThemePreference>(readStored);

  useEffect(() => {
    apply(preference);
    try {
      localStorage.setItem(STORAGE_KEY, preference);
    } catch {
      /* private-browsing or storage-disabled — theme still applies for this tab, just isn't remembered. */
    }
  }, [preference]);

  useEffect(() => {
    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply('system');
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const setPreference = useCallback((next: ThemePreference) => setPreferenceState(next), []);

  return { preference, resolved: resolve(preference), setPreference };
}

/**
 * Gives a public page — the landing page, blog and sign-in pages (login, signup, forgot/reset
 * password) — its fixed look: the light palette regardless of the stored preference or the OS
 * setting, in the LIMS logo's colours (the `theme-lims` class; see index.css). Doesn't touch the
 * stored preference: on unmount it takes the brand colours off and re-applies the preference, so
 * the signed-in app (which never calls this) keeps its own colours and honours the user's choice.
 * A layout effect so there's no painted frame of the wrong look between a route change and the
 * swap. Keep the routes that call this in sync with the first-paint script in index.html.
 */
export function useForcedLightTheme() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('dark');
    root.classList.add('theme-lims');
    root.style.colorScheme = 'light'; // native scrollbars/controls, which `.dark` alone doesn't reach
    return () => {
      root.classList.remove('theme-lims');
      root.style.colorScheme = '';
      apply(readStored());
    };
  }, []);
}
