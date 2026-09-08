import { useEffect, useRef, useState, type ReactNode } from 'react';
import { cn } from '@/lib/cn';

/**
 * Fades + lifts children into view on scroll. Respects `prefers-reduced-motion`
 * (renders immediately, no transform).
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = 'div',
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  as?: 'div' | 'li' | 'section';
}) {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) {
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
  }, []);

  return (
    <Tag
      ref={ref as never}
      style={shown ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-all duration-700 ease-out motion-reduce:transition-none',
        shown ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        className,
      )}
    >
      {children}
    </Tag>
  );
}
