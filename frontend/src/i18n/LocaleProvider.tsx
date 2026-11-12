import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  LOCALE_STORAGE_KEY,
  readStoredLocale,
  setCurrentLocale,
  type Locale,
} from './locale';
import { translate, translateRich, type Vars } from './translate';

export type Translate = (key: string, vars?: Vars) => string;
export type TranslateRich = (key: string, vars: Record<string, ReactNode>) => ReactNode[];

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Translate;
  tRich: TranslateRich;
}

const LocaleContext = createContext<LocaleContextValue | null>(null);

/**
 * Holds the language the app is showing and hands every component its `t`.
 *
 * <p>Mounted above the router, so the sign-in page is covered as well as the shell. Changing the
 * language re-renders everything beneath it, which is the whole of the app; the cost is paid once
 * per switch, which is to say almost never.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(readStoredLocale);

  useEffect(() => {
    setCurrentLocale(locale);
    // Screen readers, spell-checkers and the browser's own font fallback all read this.
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, locale);
    } catch {
      /* Private browsing or storage disabled: the language still applies for this tab. */
    }
  }, [locale]);

  const setLocale = useCallback((next: Locale) => setLocaleState(next), []);
  const t = useCallback<Translate>((key, vars) => translate(locale, key, vars), [locale]);
  const tRich = useCallback<TranslateRich>((key, vars) => translateRich(locale, key, vars), [locale]);

  const value = useMemo(() => ({ locale, setLocale, t, tRich }), [locale, setLocale, t, tRich]);
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

/**
 * The translation function. Outside a provider — a unit test rendering one component — it
 * returns English, so a component never needs the provider just to show its own text.
 */
export function useT(): Translate {
  const ctx = useContext(LocaleContext);
  return ctx ? ctx.t : (key, vars) => translate('en', key, vars);
}

export function useTRich(): TranslateRich {
  const ctx = useContext(LocaleContext);
  return ctx ? ctx.tRich : (key, vars) => translateRich('en', key, vars);
}

export function useLocale(): { locale: Locale; setLocale: (locale: Locale) => void } {
  const ctx = useContext(LocaleContext);
  if (!ctx) {
    return { locale: 'en', setLocale: () => undefined };
  }
  return { locale: ctx.locale, setLocale: ctx.setLocale };
}
