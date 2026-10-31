import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Makes section links work across marketing pages, and before lazy-loaded sections exist: after
 * each navigation, scroll to the element named by the URL hash — or to the top when there isn't
 * one (the router doesn't reset scroll itself, so arriving from a scrolled page would keep its
 * offset). Keyed on `location.key`, not just `hash`, so clicking the same section link twice still
 * scrolls. On the very first load with no hash it does nothing, leaving the browser's own scroll
 * restoration on refresh alone.
 */
export function useScrollToHash() {
  const { hash, key } = useLocation();

  useEffect(() => {
    const id = decodeURIComponent(hash.slice(1));
    const target = id ? document.getElementById(id) : null;
    if (target) target.scrollIntoView();
    else if (key !== 'default') window.scrollTo(0, 0);
  }, [hash, key]);
}
