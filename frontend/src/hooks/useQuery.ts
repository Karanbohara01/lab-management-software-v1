import { useCallback, useEffect, useRef, useState } from 'react';
import { ApiError } from '@/types/api';

interface QueryState<T> {
  data: T | undefined;
  loading: boolean;
  error: string | undefined;
}

/**
 * Minimal data-fetching hook: runs `fetcher` on mount and whenever a value in `deps` changes,
 * ignores stale responses, and exposes `refetch`. Not a cache — sufficient for list/detail screens.
 */
export function useQuery<T>(fetcher: () => Promise<T>, deps: unknown[]): QueryState<T> & { refetch: () => void } {
  const [state, setState] = useState<QueryState<T>>({ data: undefined, loading: true, error: undefined });
  const requestIdRef = useRef(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableFetcher = useCallback(fetcher, deps);

  const run = useCallback(() => {
    const requestId = ++requestIdRef.current;
    setState((prev) => ({ ...prev, loading: true, error: undefined }));
    stableFetcher()
      .then((data) => {
        if (requestId === requestIdRef.current) setState({ data, loading: false, error: undefined });
      })
      .catch((err: unknown) => {
        if (requestId !== requestIdRef.current) return;
        const message = err instanceof ApiError ? err.message : 'Something went wrong';
        setState((prev) => ({ ...prev, loading: false, error: message }));
      });
  }, [stableFetcher]);

  useEffect(() => {
    run();
    return () => {
      requestIdRef.current++;
    };
  }, [run]);

  return { ...state, refetch: run };
}
