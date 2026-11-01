import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check, ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { WORKFLOW_STEPS } from '../data';
import { SectionHeading } from '../components/primitives';
import { SCENES, STEP_COPY } from './scenes';
import './workflow.css';

/** How long each step stays on screen while the slideshow plays. */
const STEP_MS = 5500;
const COUNT = WORKFLOW_STEPS.length;
const BAR_ANIMATION = 'lw-bar';
const pad = (n: number) => String(n).padStart(2, '0');

/**
 * The lab workflow as an animated, self-playing stepper: a pill per step, an illustration for the
 * active one, and a short description. Autoplay is driven by the active pill's progress bar — when
 * its CSS animation ends we advance — so pausing the bar pauses the slideshow, with no timer to
 * drift out of step with it. It only runs while on screen, and with `prefers-reduced-motion` it
 * becomes manual-only (no autoplay, no progress bar).
 */
export function AnimatedWorkflow() {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  /** Bumped the first time the widget scrolls into view, so the opening scene plays where it's seen. */
  const [replay, setReplay] = useState(0);
  const seen = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const stepsRef = useRef<HTMLOListElement>(null);
  const reduced = usePrefersReducedMotion();
  const running = playing && visible && !reduced;

  const go = useCallback((index: number) => setActive(((index % COUNT) + COUNT) % COUNT), []);

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowVisible = !!entry?.isIntersecting;
        setVisible(nowVisible);
        if (nowVisible && !seen.current) {
          seen.current = true;
          setReplay((n) => n + 1);
        }
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // On narrow screens the step list is a single horizontal track; keep the active step centred in
  // it. Scrolling the list itself (not scrollIntoView) means the page never jumps vertically, and
  // on wide screens, where the list wraps instead of scrolling, this is simply a no-op.
  useEffect(() => {
    const list = stepsRef.current;
    const step = list?.querySelector<HTMLElement>('.lw-step.is-active');
    if (!list || !step || typeof list.scrollTo !== 'function') return;
    list.scrollTo({
      left: step.offsetLeft - (list.clientWidth - step.offsetWidth) / 2,
      behavior: reduced ? 'auto' : 'smooth',
    });
  }, [active, reduced]);

  // Where the wrapping list breaks into rows, the connector after a row's last step would trail
  // off into nothing. CSS can't see a flex wrap, so measure it: a step whose successor sits lower
  // ends a row. Re-measured whenever the list's size changes (viewport, fonts loading).
  const [rowEnds, setRowEnds] = useState<ReadonlySet<number>>(() => new Set());
  useEffect(() => {
    const list = stepsRef.current;
    if (!list) return;
    const measure = () => {
      const items = Array.from(list.children) as HTMLElement[];
      const ends = new Set<number>();
      items.forEach((item, i) => {
        const next = items[i + 1];
        if (next && next.offsetTop > item.offsetTop) ends.add(i);
      });
      setRowEnds((prev) => (prev.size === ends.size && [...ends].every((i) => prev.has(i)) ? prev : ends));
    };
    measure();
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    return () => observer.disconnect();
  }, []);

  const Scene = SCENES[active];
  const title = WORKFLOW_STEPS[active];

  return (
    <div ref={rootRef} className="lw" style={{ '--interval': `${STEP_MS}ms` } as CSSProperties}>
      <SectionHeading
        align="center"
        eyebrow="How it works"
        title="How our lab workflow works"
        lead="From registration to e-billing — every sample tracked, every step automated."
        className="lw-head"
      />

      <ol className="lw-steps" ref={stepsRef}>
        {WORKFLOW_STEPS.map((step, i) => (
          <li className={cn('lw-step-wrap', rowEnds.has(i) && 'is-row-end')} key={step}>
            <button
              type="button"
              className={cn('lw-step', i === active && 'is-active', i < active && 'is-done')}
              aria-current={i === active ? 'step' : undefined}
              onClick={() => go(i)}
            >
              {i < active ? (
                <Check className="lw-check-ic" size={14} strokeWidth={3} aria-hidden />
              ) : (
                <span className="lw-num">{pad(i + 1)}</span>
              )}
              {step}
              {i === active && !reduced && (
                <span
                  key={`${active}-${replay}`}
                  className="lw-bar"
                  style={{ animationPlayState: running ? 'running' : 'paused' }}
                  onAnimationEnd={(e) => {
                    if (e.animationName === BAR_ANIMATION) go(active + 1);
                  }}
                  aria-hidden
                />
              )}
            </button>
            {i < COUNT - 1 && <span className={cn('lw-connector', i < active && 'is-lit')} aria-hidden />}
          </li>
        ))}
      </ol>

      <div className="lw-stage">
        <div className="lw-scene" key={`scene-${active}-${replay}`} aria-hidden>
          {Scene?.()}
        </div>

        <div className="lw-info" key={`info-${active}`}>
          <div className="lw-kicker">
            Step {pad(active + 1)} of {COUNT}
          </div>
          <h3 className="lw-title">{title}</h3>
          <p className="lw-desc">{STEP_COPY[active]}</p>
          <div className="lw-overall" aria-hidden>
            <span style={{ width: `${((active + 1) / COUNT) * 100}%` }} />
          </div>
          <div className="lw-controls">
            <button type="button" className="lw-icon-btn" onClick={() => go(active - 1)} aria-label="Previous step">
              <ChevronLeft size={18} aria-hidden />
            </button>
            {!reduced && (
              <button type="button" className="lw-play" onClick={() => setPlaying((p) => !p)}>
                {playing ? <Pause size={15} aria-hidden /> : <Play size={15} aria-hidden />}
                {playing ? 'Pause' : 'Play'}
              </button>
            )}
            <button type="button" className="lw-icon-btn" onClick={() => go(active + 1)} aria-label="Next step">
              <ChevronRight size={18} aria-hidden />
            </button>
          </div>
          <p className="lw-next">Next: {WORKFLOW_STEPS[(active + 1) % COUNT]}</p>
        </div>
      </div>

      <p className="sr-only" role="status">
        Step {active + 1} of {COUNT}: {title}
      </p>
    </div>
  );
}
