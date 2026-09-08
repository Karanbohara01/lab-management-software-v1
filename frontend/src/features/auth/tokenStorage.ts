/**
 * Token persistence. Kept in localStorage so a page reload keeps the session;
 * a single module owns the keys so the rest of the app never touches storage directly.
 */
const ACCESS_KEY = 'lims.accessToken';
const REFRESH_KEY = 'lims.refreshToken';

function safeGet(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeSet(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable (private mode, etc.) — session becomes memory-only */
  }
}

export const tokenStorage = {
  getAccess: () => safeGet(ACCESS_KEY),
  getRefresh: () => safeGet(REFRESH_KEY),
  set: (access: string, refresh: string) => {
    safeSet(ACCESS_KEY, access);
    safeSet(REFRESH_KEY, refresh);
  },
  clear: () => {
    safeSet(ACCESS_KEY, null);
    safeSet(REFRESH_KEY, null);
  },
};
