import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, renderHook } from '@testing-library/react';
import { useForcedLightTheme } from './useTheme';

function mockOsPrefersDark(dark: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: dark && query.includes('dark'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

describe('useForcedLightTheme', () => {
  const root = document.documentElement;

  beforeEach(() => {
    localStorage.clear();
    root.classList.remove('dark', 'theme-lims');
    root.style.colorScheme = '';
  });
  afterEach(() => {
    // Unmount first: the hook's cleanup reads matchMedia, so it must still be stubbed then.
    cleanup();
    vi.unstubAllGlobals();
  });

  it('removes the dark class and pins the native color scheme to light while mounted', () => {
    mockOsPrefersDark(true);
    root.classList.add('dark');

    renderHook(() => useForcedLightTheme());

    expect(root.classList.contains('dark')).toBe(false);
    expect(root.style.colorScheme).toBe('light');
  });

  it('puts the page in the logo’s colours while mounted, and takes them off on leaving (the dashboard never has them)', () => {
    mockOsPrefersDark(false);
    expect(root.classList.contains('theme-lims')).toBe(false);

    const { unmount } = renderHook(() => useForcedLightTheme());
    expect(root.classList.contains('theme-lims')).toBe(true);

    unmount();
    expect(root.classList.contains('theme-lims')).toBe(false);
  });

  it('hands the brand colours from one public page to the next without a gap, then drops them', () => {
    mockOsPrefersDark(false);
    const first = renderHook(() => useForcedLightTheme());
    const second = renderHook(() => useForcedLightTheme());
    first.unmount(); // e.g. landing -> login: the old page unmounts as the new one is already mounted
    // a real route change unmounts first then mounts; both orders must end with the class gone after the last page leaves
    second.unmount();
    expect(root.classList.contains('theme-lims')).toBe(false);
  });

  it('restores a stored dark preference on unmount', () => {
    mockOsPrefersDark(false);
    localStorage.setItem('lims-theme', 'dark');
    root.classList.add('dark');

    const { unmount } = renderHook(() => useForcedLightTheme());
    expect(root.classList.contains('dark')).toBe(false);

    unmount();
    expect(root.classList.contains('dark')).toBe(true);
    expect(root.style.colorScheme).toBe('');
  });

  it('restores dark on unmount when the preference is system and the OS is dark', () => {
    mockOsPrefersDark(true);

    const { unmount } = renderHook(() => useForcedLightTheme());
    unmount();

    expect(root.classList.contains('dark')).toBe(true);
  });

  it('leaves the app light on unmount when the stored preference is light, even if the OS is dark', () => {
    mockOsPrefersDark(true);
    localStorage.setItem('lims-theme', 'light');

    const { unmount } = renderHook(() => useForcedLightTheme());
    unmount();

    expect(root.classList.contains('dark')).toBe(false);
  });
});
