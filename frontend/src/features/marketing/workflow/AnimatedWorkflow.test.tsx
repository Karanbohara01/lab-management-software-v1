import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { AnimatedWorkflow } from './AnimatedWorkflow';
import { SCENES, STEP_COPY } from './scenes';
import { WORKFLOW_STEPS } from '../data';

let observerCallback: IntersectionObserverCallback | null = null;

function stubBrowser({ reducedMotion = false } = {}) {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: reducedMotion && query.includes('reduce'),
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb: IntersectionObserverCallback) {
        observerCallback = cb;
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
}

/** jsdom has no AnimationEvent, so fireEvent.animationEnd would drop `animationName` — build it by hand. */
function endAnimation(el: Element, animationName: string) {
  const event = new Event('animationend', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  act(() => {
    el.dispatchEvent(event);
  });
}

const pills = () => within(screen.getByRole('list')).getAllByRole('button');
const scrollIntoView = () =>
  act(() => observerCallback?.([{ isIntersecting: true } as IntersectionObserverEntry], {} as IntersectionObserver));

describe('AnimatedWorkflow', () => {
  beforeEach(() => stubBrowser());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
    observerCallback = null;
  });

  it('keeps one illustration and one sentence per workflow step', () => {
    expect(SCENES).toHaveLength(WORKFLOW_STEPS.length);
    expect(STEP_COPY).toHaveLength(WORKFLOW_STEPS.length);
  });

  it('renders every step as a pill and starts on the first', () => {
    render(<AnimatedWorkflow />);
    expect(pills()).toHaveLength(WORKFLOW_STEPS.length);
    expect(pills()[0]).toHaveAttribute('aria-current', 'step');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(WORKFLOW_STEPS[0]!);
    expect(screen.getByText(`Step 01 of ${WORKFLOW_STEPS.length}`)).toBeInTheDocument();
  });

  it('carries the original design’s heading and subtitle', () => {
    render(<AnimatedWorkflow />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('How our lab workflow works');
    expect(
      screen.getByText('From registration to e-billing — every sample tracked, every step automated.'),
    ).toBeInTheDocument();
  });

  it('shows a number on pending and active pills, and a check mark instead on completed ones', () => {
    render(<AnimatedWorkflow />);
    fireEvent.click(pills()[2]!); // step 03
    expect(pills()[0]!.querySelector('svg')).not.toBeNull();
    expect(pills()[0]!.textContent).not.toMatch(/^\d/);
    expect(pills()[1]!.querySelector('svg')).not.toBeNull();
    expect(pills()[2]!.textContent).toMatch(/^03/);
    expect(pills()[3]!.textContent).toMatch(/^04/);
    expect(pills()[3]!.querySelector('svg')).toBeNull();
  });

  it('billing matches the original: six tests, Rs., VAT, total Rs. 4,520', () => {
    render(<AnimatedWorkflow />);
    fireEvent.click(pills()[2]!);
    expect(screen.getByText('Charges are calculated automatically from the test price list, with discounts and VAT applied.')).toBeInTheDocument();
    const scene = document.querySelector('.lw-scene')!;
    for (const test of ['CBC', 'LFT', 'RFT', 'Lipid profile', 'TSH', 'HbA1c']) expect(scene.textContent).toContain(test);
    expect(scene.textContent).toContain('Rs. 4,520');
    const amounts = [...scene.querySelectorAll('.lw-line span:last-child')].map((s) => Number(s.textContent!.replace(/\D/g, '')));
    expect(amounts.reduce((a, b) => a + b, 0)).toBe(4520);
  });

  it('jumps to a step when its pill is clicked, marking earlier ones done', () => {
    render(<AnimatedWorkflow />);
    fireEvent.click(pills()[6]!);
    expect(pills()[6]).toHaveAttribute('aria-current', 'step');
    expect(pills()[0]).not.toHaveAttribute('aria-current');
    expect(pills()[0]!.className).toContain('is-done');
    expect(pills()[6]!.className).not.toContain('is-done');
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(WORKFLOW_STEPS[6]!);
    expect(screen.getByText(STEP_COPY[6]!)).toBeInTheDocument();
  });

  it('Next and Previous wrap around the ends', () => {
    render(<AnimatedWorkflow />);
    fireEvent.click(screen.getByRole('button', { name: 'Previous step' }));
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(WORKFLOW_STEPS.at(-1)!);
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent(WORKFLOW_STEPS[0]!);
  });

  it('advances when the active pill’s progress bar finishes (that is the autoplay clock)', () => {
    const { container } = render(<AnimatedWorkflow />);
    endAnimation(container.querySelector('.lw-bar')!, 'lw-bar');
    expect(pills()[1]).toHaveAttribute('aria-current', 'step');
  });

  it('ignores other animations ending inside the pill', () => {
    const { container } = render(<AnimatedWorkflow />);
    endAnimation(container.querySelector('.lw-bar')!, 'something-else');
    expect(pills()[0]).toHaveAttribute('aria-current', 'step');
  });

  it('only runs the progress bar while the widget is on screen and not paused', () => {
    const { container } = render(<AnimatedWorkflow />);
    const state = () => (container.querySelector('.lw-bar') as HTMLElement).style.animationPlayState;
    expect(state()).toBe('paused'); // not scrolled into view yet

    scrollIntoView();
    expect(state()).toBe('running');

    fireEvent.click(screen.getByRole('button', { name: /pause/i }));
    expect(state()).toBe('paused');
    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /play/i }));
    expect(state()).toBe('running');
  });

  it('with reduced motion there is no autoplay: no progress bar, no play button, manual only', () => {
    cleanup();
    stubBrowser({ reducedMotion: true });
    const { container } = render(<AnimatedWorkflow />);
    expect(container.querySelector('.lw-bar')).toBeNull();
    expect(screen.queryByRole('button', { name: /pause|play/i })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(pills()[1]).toHaveAttribute('aria-current', 'step');
  });

  it('announces the current step to assistive tech', () => {
    render(<AnimatedWorkflow />);
    fireEvent.click(pills()[2]!);
    expect(screen.getByRole('status')).toHaveTextContent(`Step 3 of ${WORKFLOW_STEPS.length}: ${WORKFLOW_STEPS[2]}`);
  });
});
