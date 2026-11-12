import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/types/api';

interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
}

export interface QueryOptions {
  /**
   * Remembers the last result under this key and shows it immediately when the same view is
   * mounted again, while a fresh request runs. Give a key that identifies the exact query
   * (path + params), e.g. `patients:${search}:${page}` — it's what lets coming back from a detail
   * page land on the list you left, already drawn, instead of an empty skeleton.
   */
  cacheKey?: string;
}

/** Survives unmount, not reload: enough to make back-navigation feel instant without going stale. */
const resultCache = new Map<string, unknown>();

/**
 * Minimal data-fetching hook: runs `fetcher` on mount and whenever a value in `deps` changes,
 * ignores stale responses, and exposes `refetch`. Not a real cache — `cacheKey` only seeds the
 * first render of a repeat visit, and the data is always refetched behind it.
 */
export function useQuery<T>(
  fetcher: () => Promise<T>,
  deps: unknown[],
  options: QueryOptions = {},
): QueryState<T> & { refetch: () => void } {
  const { cacheKey } = options;
  const [state, setState] = useState<QueryState<T>>(() => ({
    data: cacheKey ? (resultCache.get(cacheKey) as T | undefined) : undefined,
    loading: true,
    error: undefined,
  }));
  const requestIdRef = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  const run = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setState((prev) => ({
      ...prev,
      // A different query under a shared hook instance: show that query's last result, not this one's.
      data: cacheKey && resultCache.has(cacheKey) ? (resultCache.get(cacheKey) as T) : prev.data,
      loading: true,
      error: undefined,
    }));
    stableFetcher()
      .then((data) => {
        if (cacheKey) resultCache.set(cacheKey, data);
        if (requestId === requestIdRef.current) setState({ data, loading: false, error: undefined });
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        const message = err instanceof ApiError ? err.message : 'Something went wrong';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      });
  }, [stableFetcher, cacheKey]);

  useEffect(() => {
    run();
    return () => {
      requestIdRef.current++;
    };
  }, [run]);

  return { ...state, refetch: run };
}
