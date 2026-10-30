import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { usePrefersReducedMotion } from '@/hooks/usePrefersReducedMotion';
import { WORKFLOW_STEPS } from '../data';
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

  const Scene = SCENES[active];
  const title = WORKFLOW_STEPS[active];

  return (
    <div ref={rootRef} className="lw" style={{ '--interval': `${STEP_MS}ms` } as CSSProperties}>
      <header className="lw-head">
        <h2 className="lw-heading">How our lab workflow works</h2>
        <p className="lw-sub">From registration to e-billing — every sample tracked, every step automated.</p>
      </header>

      <ol className="lw-steps">
        {WORKFLOW_STEPS.map((step, i) => (
          <li className="lw-step-wrap" key={step}>
            <button
              type="button"
              className={cn('lw-step', i === active && 'is-active', i < active && 'is-done')}
              aria-current={i === active ? 'step' : undefined}
              onClick={() => go(i)}
            >
              {i < active ? (
                <Check className="lw-check-ic" size={16} strokeWidth={2.75} aria-hidden />
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
            {i < COUNT - 1 && (
              <span className={cn('lw-chev', i < active && 'is-lit')} aria-hidden>
                ›
              </span>
            )}
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
              <span aria-hidden>‹</span>
            </button>
            {!reduced && (
              <button type="button" className="lw-play" onClick={() => setPlaying((p) => !p)}>
                <span aria-hidden>{playing ? '❚❚' : '▶'}</span>
                {playing ? 'Pause' : 'Play'}
              </button>
            )}
            <button type="button" className="lw-icon-btn" onClick={() => go(active + 1)} aria-label="Next step">
              <span aria-hidden>›</span>
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
