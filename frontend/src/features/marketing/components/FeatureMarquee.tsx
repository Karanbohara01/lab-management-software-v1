import { useEffect, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { FEATURES } from '../data';
import { FeatureIcon } from './FeatureIcon';
import { TYPE } from './typography';

/** Drift speed while auto-scrolling. */
const SPEED_PX_PER_SEC = 40;
/** After a touch or a wheel/trackpad scroll, wait this long before drifting again. */
const RESUME_DELAY_MS = 1500;
/**
 * Copies of the card row. The scroll position is kept inside the second copy and nudged by exactly
 * one row-width whenever it leaves it — the content is identical, so the jump is invisible and the
 * strip loops forever in either direction. Four copies leave room either side for any screen up
 * to ~6000px wide.
 */
const COPIES = 4;

/**
 * The feature cards as one horizontal strip that drifts on its own, edge to edge.
 *
 * It's a real scroll container, so it can also be swiped, dragged with the mouse, scrolled with a
 * trackpad or shift+wheel, or arrowed through from the keyboard. Auto-drift stops whenever the
 * visitor is engaging with it (hover, touch, drag, wheel, focus), while it's off screen, when they
 * press the Pause button, and entirely for `prefers-reduced-motion` (then it's a plain scrollable
 * row with a visible scrollbar).
 */
export function FeatureMarquee() {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLUListElement>(null);
  const resumeTimer = useRef<number>();
  const drag = useRef<{ x: number; left: number } | null>(null);

  const reduced = usePrefersReducedMotion();
  const [pausedByUser, setPausedByUser] = useState(false);
  const [inView, setInView] = useState(false);
  const [engaged, setEngaged] = useState(false);
  const [dragging, setDragging] = useState(false);
  const running = !pausedByUser && inView && !engaged && !reduced;
  const copies = reduced ? 1 : COPIES;

  const engage = () => {
    window.clearTimeout(resumeTimer.current);
    setEngaged(true);
  };
  const release = (delay = 0) => {
    window.clearTimeout(resumeTimer.current);
    resumeTimer.current = window.setTimeout(() => setEngaged(false), delay);
  };
  useEffect(() => () => window.clearTimeout(resumeTimer.current), []);

  /** One row's width, including the gap that trails it: the distance after which the content repeats. */
  const rowWidth = () => groupRef.current?.offsetWidth ?? 0;

  // start in the second copy so there's room to scroll backwards
  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (el && copies > 1) el.scrollLeft = rowWidth();
  }, [copies]);

  // only drift while the strip is actually on screen
  useEffect(() => {
    const node = scrollerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(([entry]) => setInView(!!entry?.isIntersecting), { threshold: 0.1 });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // the drift itself
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || !running) return;
    let frame = 0;
    let last = performance.now();
    let position = el.scrollLeft;
    let lastWritten = position;

    const tick = (now: number) => {
      const row = rowWidth();
      const dt = Math.min(now - last, 100); // a backgrounded tab mustn't make it leap
      last = now;
      // the visitor moved it since we last wrote (swipe momentum, keys): carry on from there
      if (Math.abs(el.scrollLeft - lastWritten) > 1.5) position = el.scrollLeft;
      position += (SPEED_PX_PER_SEC * dt) / 1000;
      while (row > 0 && position >= row * 2) position -= row;
      el.scrollLeft = position;
      lastWritten = el.scrollLeft; // the browser may round what we wrote; read it back
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);

  /** Keep the position inside the second copy (jumping by a row is invisible — the content repeats). */
  const wrapScroll = () => {
    const el = scrollerRef.current;
    const row = rowWidth();
    if (!el || copies < 2 || row <= 0) return;
    if (el.scrollLeft >= row * 2) el.scrollLeft -= row;
    else if (el.scrollLeft < row) el.scrollLeft += row;
  };

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    engage();
    const el = scrollerRef.current;
    if (!el || e.pointerType !== 'mouse' || e.button !== 0) return;
    drag.current = { x: e.clientX, left: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    const d = drag.current;
    if (!el || !d) return;
    let target = d.left - (e.clientX - d.x);
    const row = rowWidth();
    if (copies > 1 && row > 0) {
      // normalise the target and the drag's baseline together so the jump never shows
      while (target >= row * 2) { target -= row; d.left -= row; }
      while (target < row) { target += row; d.left += row; }
    }
    el.scrollLeft = target;
  };
  const endPointer = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (drag.current) scrollerRef.current?.releasePointerCapture(e.pointerId);
    drag.current = null;
    setDragging(false);
    // A mouse stays engaged while it's still over the strip (pointerleave releases it); a finger
    // lifts away, so the drift picks up again after a beat.
    if (e.pointerType !== 'mouse') release(RESUME_DELAY_MS);
  };

  return (
    <div>
      <div
        ref={scrollerRef}
        role="region"
        aria-label={reduced ? 'Features' : 'Features — scrolls automatically; use the Pause button to stop it'}
        tabIndex={0}
        onScroll={wrapScroll}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endPointer}
        onPointerCancel={endPointer}
        onPointerEnter={(e) => e.pointerType === 'mouse' && engage()}
        onPointerLeave={(e) => e.pointerType === 'mouse' && !drag.current && release()}
        onWheel={() => {
          engage();
          release(RESUME_DELAY_MS);
        }}
        onFocus={engage}
        onBlur={() => release()}
        className={cn(
          'flex overflow-x-auto overscroll-x-contain py-4',
          '[-webkit-mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)] [mask-image:linear-gradient(to_right,transparent,#000_5%,#000_95%,transparent)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          reduced ? 'snap-x' : '[scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
          !reduced && (dragging ? 'cursor-grabbing select-none' : 'cursor-grab'),
        )}
      >
        {Array.from({ length: copies }, (_, copy) => (
          <ul
            key={copy}
            ref={copy === 0 ? groupRef : undefined}
            aria-hidden={copy > 0 || undefined}
            className="flex shrink-0 items-stretch gap-4 pr-4"
          >
            {FEATURES.map((feature) => (
              <li
                key={`${copy}-${feature.title}`}
                className={cn(
                  'group flex w-[280px] shrink-0 flex-col rounded-xl border border-border bg-surface p-5 transition-shadow hover:shadow-card sm:w-[320px]',
                  reduced && 'snap-start',
                )}
              >
                <FeatureIcon src={feature.image} className="h-14 w-14" imgClassName="h-11 w-11" />
                <h3 className={cn('mt-4', TYPE.h4)}>{feature.title}</h3>
                <p className={cn('mt-1.5', TYPE.bodySm)}>{feature.description}</p>
              </li>
            ))}
          </ul>
        ))}
      </div>

      {!reduced && (
        <div className="mx-auto mt-2 flex w-full max-w-page justify-end px-4 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => setPausedByUser((p) => !p)}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-caption font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {pausedByUser ? <Play className="h-3.5 w-3.5" aria-hidden /> : <Pause className="h-3.5 w-3.5" aria-hidden />}
            {pausedByUser ? 'Play auto-scroll' : 'Pause auto-scroll'}
          </button>
        </div>
      )}
    </div>
  );
}
