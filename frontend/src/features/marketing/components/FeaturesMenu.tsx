import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { FEATURES, type NavItem } from '../data';
import { FeatureIcon } from './FeatureIcon';

/** Grace period so the pointer can cross from the link to the panel without it closing. */
const CLOSE_DELAY_MS = 120;

/**
 * The "Features" nav item: still a plain link to its section, but hovering or focusing it also
 * opens a panel listing every tool in the product (the same `FEATURES` the Features section
 * renders), each jumping to the section that covers it.
 *
 * The `<li>` is stretched to the full nav height and the panel hangs off the bottom of the nav, so
 * there's no dead gap between link and panel; the panel is positioned against the (relative) nav
 * element rather than this item so it can be centred and wide. Closed, it's `invisible`, which
 * also takes its links out of the tab order.
 */
export function FeaturesMenu({ item, linkClassName }: { item: NavItem; linkClassName: string }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLLIElement>(null);
  const closeTimer = useRef<number>();

  const show = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
  };
  const hideSoon = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };
  const hideNow = () => {
    window.clearTimeout(closeTimer.current);
    setOpen(false);
  };

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <li
      ref={rootRef}
      className="flex items-center self-stretch"
      onMouseEnter={show}
      onMouseLeave={hideSoon}
      onFocus={show}
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) hideNow();
      }}
    >
      <Link
        to={item.href}
        aria-haspopup="true"
        aria-expanded={open}
        onClick={hideNow}
        className={cn(linkClassName, 'inline-flex items-center gap-1', open && 'text-primary hover:text-primary')}
      >
        {item.label}
        <ChevronDown
          className={cn('h-4 w-4 transition-transform duration-150 motion-reduce:transition-none', open && 'rotate-180')}
          aria-hidden
        />
      </Link>

      <div
        className={cn(
          'absolute left-1/2 top-full z-50 w-[min(40rem,calc(100vw-2rem))] -translate-x-1/2 pt-2',
          'transition-[opacity,transform,visibility] duration-150 motion-reduce:transition-none',
          open ? 'visible translate-y-0 opacity-100' : 'pointer-events-none invisible translate-y-1 opacity-0',
        )}
      >
        <div className="rounded-xl border border-border bg-surface p-3 shadow-popover">
          <ul aria-label={item.label} className="grid grid-flow-col grid-rows-5 gap-x-4 gap-y-1">
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <Link
                  to={feature.href}
                  onClick={hideNow}
                  className="group flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <FeatureIcon src={feature.image} className="h-10 w-10" imgClassName="h-8 w-8" />
                  {feature.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </li>
  );
}
