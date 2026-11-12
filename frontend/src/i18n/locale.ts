/**
 * The languages the app can show. Nepali is for the clinic's own staff — reception and the bench —
 * which is why it covers the screens they use all day and not the platform administration.
 */
export type Locale = 'en' | 'ne';

export const LOCALES: { value: Locale; label: string; nativeLabel: string }[] = [
  { value: 'en', label: 'English', nativeLabel: 'English' },
  { value: 'ne', label: 'Nepali', nativeLabel: 'नेपाली' },
];

/**
 * Kept per device, like the theme, rather than per user: in a rural clinic the front-desk terminal
 * is shared, and the language it shows is a property of that desk more than of whoever is logged
 * in. The same key is read by the first-paint script in index.html, so the document language is
 * right before React mounts.
 */
export const LOCALE_STORAGE_KEY = 'lims-locale';

/** The BCP 47 tag for date and number formatting. Latin digits are forced: see formatters. */
export const LOCALE_TAG: Record<Locale, string> = {
  en: 'en-NP',
  ne: 'ne-NP-u-nu-latn',
};

export function isLocale(value: unknown): value is Locale {
  return value === 'en' || value === 'ne';
}

export function readStoredLocale(): Locale {
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    return isLocale(stored) ? stored : 'en';
  } catch {
    return 'en';
  }
}

/**
 * The locale in force, for code that formats outside React — the date helpers every table calls
 * as plain functions. The provider keeps it current; components re-render on a change anyway, so
 * what they format follows.
 */
let current: Locale = readStoredLocale();

export function getLocale(): Locale {
  return current;
}

export function setCurrentLocale(locale: Locale): void {
  current = locale;
}
