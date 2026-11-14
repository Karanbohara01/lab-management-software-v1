import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/** `(i % max) * step` — the stagger delay shared by every card/list grid that fakes orchestration
 *  via per-item `<Reveal delay>` (Pricing's plans, About's principles, Roles' cards). */
export function staggerDelay(index: number, step = 60, max = 3) {
  return (index % max) * step;
}

/**
 * Fades + lifts children into view. Respects `prefers-reduced-motion` (renders immediately, no
 * transform). `trigger="scroll"` (default) waits for the element to enter the viewport; use
 * `trigger="mount"` for anything already in the initial viewport (e.g. the Hero) — it skips
 * constructing an `IntersectionObserver` altogether and shows immediately on mount.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
  trigger = 'scroll',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'section';
  trigger?: 'scroll' | 'mount';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || trigger === 'mount') {
      setShown(true);
      return;
    }
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -10% 0px', threshold: 0.05 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [trigger]);

  return (
    <Tag
      ref={ref as never}
      style={shown ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-all duration-700 ease-premium motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
