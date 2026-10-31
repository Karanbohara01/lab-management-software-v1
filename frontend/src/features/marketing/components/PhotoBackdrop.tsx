import './photoBackdrop.css';

/**
 * Full-viewport photo behind the page content. It's `fixed` (so it stays put while the page
 * scrolls) at z-index -10 inside an `isolate`d layout root: above the page background, below every
 * section. The navbar and footer are opaque and later in the stack, so the photo only shows
 * between them. Styling and the veil strength live in photoBackdrop.css.
 */
export function PhotoBackdrop() {
  return <div aria-hidden className="lp-backdrop" />;
}
