import { useCallback, useMemo } from 'react';
import {
  Link,
  useLocation,
  useMatches,
  useNavigate,
  useSearchParams,
  type LinkProps,
  type NavigateOptions,
  type To,
} from 'react-router-dom';
import { useCurrentPageTitle } from '@/components/layout/PageTitleContext';
import { handleChain, resolvePattern, type MatchedHandle } from '@/routes/appRoutes';

/** Where a "Back to …" link goes and what it's called. */
export interface BackTarget {
  href: string;
  label: string;
}

/** Router state carried on every in-app navigation that should know where it came from. */
export interface FromState {
  from?: BackTarget;
}

/** The current page's route metadata (pattern + title + parent), from the data router's matches. */
export function useLeafHandle(): { handle: MatchedHandle; params: Record<string, string | undefined> } | null {
  const matches = useMatches();
  const leaf = matches[matches.length - 1];
  const handle = leaf?.handle as MatchedHandle | undefined;
  return handle?.pattern ? { handle, params: leaf!.params } : null;
}

/** What a link leaving the current page should record as its origin. */
export function useOrigin(): BackTarget {
  const location = useLocation();
  const title = useCurrentPageTitle();
  const leaf = useLeafHandle();
  const label = title ?? leaf?.handle.title ?? 'previous page';
  const href = location.pathname + location.search;
  return useMemo(() => ({ href, label }), [href, label]);
}

function withFrom(state: unknown, from: BackTarget): FromState & Record<string, unknown> {
  return { ...((state as Record<string, unknown> | null | undefined) ?? {}), from };
}

/** `navigate` that stamps the origin, so the destination's "Back to …" returns here — filters, page and all. */
export function useNavigateFrom() {
  const navigate = useNavigate();
  const origin = useOrigin();
  return useCallback(
    (to: To, opts?: NavigateOptions) => navigate(to, { ...opts, state: withFrom(opts?.state, origin) }),
    [navigate, origin],
  );
}

/** A `Link` that stamps the origin (see useNavigateFrom). */
export function LinkFrom(props: LinkProps) {
  const origin = useOrigin();
  return <Link {...props} state={withFrom(props.state, origin)} />;
}

/**
 * The page's back target, in order of preference: where the user actually came from (router state,
 * which survives refresh and Back/Forward), the legacy `?from=order:<id>` hint some older links
 * carry, the page's static parent, and finally the dashboard. `canonical` is always the static
 * parent — the breadcrumb's notion of "up", which can differ from "back".
 */
export function useBackTarget(): { back: BackTarget; canonical: BackTarget } {
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const leaf = useLeafHandle();

  return useMemo(() => {
    const chain = leaf ? handleChain(leaf.handle.pattern) : [];
    const parent = chain[1];
    const canonical: BackTarget = parent
      ? { href: resolvePattern(parent.pattern, leaf!.params), label: parent.title }
      : { href: '/app', label: 'Dashboard' };

    const from = (location.state as FromState | null)?.from;
    if (from?.href && from.label) return { back: from, canonical };

    const legacy = searchParams.get('from');
    if (legacy?.startsWith('order:')) {
      return { back: { href: `/app/orders/${legacy.slice('order:'.length)}`, label: 'Order' }, canonical };
    }
    return { back: canonical, canonical };
  }, [leaf, location.state, searchParams]);
}
