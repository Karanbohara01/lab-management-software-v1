import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigationType, useSearchParams } from 'react-router-dom';
import { useDebouncedValue } from './useDebouncedValue';

type Primitive = string | number | boolean;

export interface ListParamsOptions<S> {
  /** The key that holds the page number (1-based in the URL). Defaults to `page` when the schema has one. */
  pageKey?: keyof S & string;
}

export interface SetOptions {
  /** Overwrite the current history entry instead of pushing one (use for typed search text). */
  replace?: boolean;
  /** Set false to keep the current page when changing another key (default: any other change resets to page 1). */
  resetPage?: boolean;
}

/**
 * A list page's search / filters / page / tab, kept in the URL instead of component state — so
 * coming back from a detail page (by the Back link, the browser button or a bookmark) lands on
 * exactly the view the user left. `schema` supplies the defaults; a key at its default is left
 * out of the URL, so an untouched list has a clean URL. Each `set` is one history write: the
 * patch plus (unless told otherwise) a reset to page 1 whenever something other than the page
 * changed, and it never scrolls the page — the shell's ScrollRestoration would otherwise jump to
 * the top on every filter click.
 *
 * Pass the schema as a module-level constant (it's part of the memo keys).
 */
export function useListParams<S extends Record<string, Primitive>>(schema: S, options: ListParamsOptions<S> = {}) {
  const pageKey = options.pageKey ?? ('page' in schema ? ('page' as keyof S & string) : undefined);
  const [searchParams, setSearchParams] = useSearchParams();

  const params = useMemo(() => {
    const out = { ...schema };
    for (const key of Object.keys(schema) as (keyof S & string)[]) {
      const raw = searchParams.get(key);
      if (raw === null) continue;
      const fallback = schema[key];
      if (typeof fallback === 'number') {
        const n = Number(raw);
        (out as Record<string, Primitive>)[key] = Number.isFinite(n) ? n : fallback;
      } else if (typeof fallback === 'boolean') {
        (out as Record<string, Primitive>)[key] = raw === '1' || raw === 'true';
      } else {
        (out as Record<string, Primitive>)[key] = raw;
      }
    }
    return out;
  }, [schema, searchParams]);

  const set = useCallback(
    (patch: Partial<S>, opts: SetOptions = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          let changedOtherThanPage = false;
          for (const key of Object.keys(patch) as (keyof S & string)[]) {
            const value = patch[key];
            const fallback = schema[key];
            if (value === undefined) continue;
            if (key !== pageKey) changedOtherThanPage = true;
            const isDefault = value === fallback || (typeof fallback === 'boolean' && !value) || value === '';
            if (isDefault) next.delete(key);
            else next.set(key, typeof value === 'boolean' ? '1' : String(value));
          }
          if (pageKey && changedOtherThanPage && !(pageKey in patch) && opts.resetPage !== false) {
            next.delete(pageKey);
          }
          return next;
        },
        { replace: opts.replace, preventScrollReset: true },
      );
    },
    [schema, pageKey, setSearchParams],
  );

  /** Clear every key this list owns; anything else in the URL (e.g. an origin hint) stays. */
  const reset = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const key of Object.keys(schema)) next.delete(key);
        return next;
      },
      { preventScrollReset: true },
    );
  }, [schema, setSearchParams]);

  const isDefault = useMemo(
    () => (Object.keys(schema) as (keyof S & string)[]).every((key) => params[key] === schema[key]),
    [params, schema],
  );

  return { params, set, reset, isDefault };
}

/**
 * The search box of a list whose query lives in the URL. The field stays local and responsive
 * while typing, and the settled value is written to the URL (replacing, so a search doesn't bury
 * the user's history under one entry per keystroke). The URL is only read back on Back/Forward —
 * syncing while someone is typing would fight them for the caret.
 */
export function useSearchInput(
  urlValue: string,
  commit: (value: string) => void,
  delayMs = 300,
): [string, (value: string) => void] {
  const [input, setInput] = useState(urlValue);
  const debounced = useDebouncedValue(input, delayMs);
  const navigationType = useNavigationType();
  const location = useLocation();
  const lastCommitted = useRef(urlValue);
  const commitRef = useRef(commit);
  commitRef.current = commit;

  useEffect(() => {
    if (debounced === lastCommitted.current) return;
    lastCommitted.current = debounced;
    commitRef.current(debounced);
  }, [debounced]);

  useEffect(() => {
    if (navigationType !== 'POP') return;
    lastCommitted.current = urlValue;
    setInput(urlValue);
    // Keyed on the history entry: a POP is the only time the field should follow the URL.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);

  return [input, setInput];
}
