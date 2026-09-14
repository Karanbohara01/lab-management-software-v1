import { useEffect } from 'react';

/**
 * Scrolls the window to the top whenever `trigger` becomes truthy. Long forms show their
 * validation/API error as a banner near the top of the page — without this, submitting from
 * further down (e.g. near the Save button) silently does nothing visible, since the error
 * renders outside the current viewport.
 */
export function useScrollToTopOnError(trigger: unknown): void {
  useEffect(() => {
    if (trigger) window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [trigger]);
}
