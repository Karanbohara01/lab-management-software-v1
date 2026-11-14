import { useEffect, useRef } from 'react';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';

/**
 * A capped, subtle scroll-tied drift for one of the Hero's background layers — a passive `scroll`
 * listener + `requestAnimationFrame`-throttled write straight to `style.transform` (the same idiom
 * `MarketingNav`'s scroll-collapse and `FeatureMarquee`'s drift already use on this page), so it
 * never touches React state and can't cause a layout shift. Returns a ref to attach to the layer;
 * does nothing under `prefers-reduced-motion`.
 */
export function useHeroParallax<T extends HTMLElement>(speed: number, maxPx: number) {
  const ref = useRef<T>(null);
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;

    let ticking = false;
    const apply = () => {
      const offset = Math.min(window.scrollY * speed, maxPx);
      node.style.transform = `translate3d(0, ${offset}px, 0)`;
      ticking = false;
    };
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(apply);
    };

    apply();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [reduced, speed, maxPx]);

  return ref;
}
