import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FeatureMarquee } from './FeatureMarquee';
import { FEATURES } from '../data';

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
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
}

describe('FeatureMarquee', () => {
  beforeEach(() => stubBrowser());
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('shows every feature once to assistive tech; the looping copies are hidden from it', () => {
    const { container } = render(<FeatureMarquee />);
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(FEATURES.length);
    expect(screen.getAllByRole('list')).toHaveLength(1);

    const lists = container.querySelectorAll('ul');
    expect(lists.length).toBeGreaterThan(1);
    expect(lists[0]!.getAttribute('aria-hidden')).toBeNull();
    for (const copy of [...lists].slice(1)) expect(copy.getAttribute('aria-hidden')).toBe('true');
    for (const copy of lists) expect(copy.querySelectorAll('li')).toHaveLength(FEATURES.length);
  });

  it('is a named, keyboard-focusable scroll region', () => {
    render(<FeatureMarquee />);
    const region = screen.getByRole('region', { name: /features/i });
    expect(region).toHaveAttribute('tabindex', '0');
    expect(region.className).toContain('overflow-x-auto');
  });

  it('has a visible Pause / Play control for the auto-scroll', () => {
    render(<FeatureMarquee />);
    fireEvent.click(screen.getByRole('button', { name: 'Pause auto-scroll' }));
    expect(screen.getByRole('button', { name: 'Play auto-scroll' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Play auto-scroll' }));
    expect(screen.getByRole('button', { name: 'Pause auto-scroll' })).toBeInTheDocument();
  });

  it('with reduced motion: one plain scrollable row, no looping copies, no auto-scroll control', () => {
    cleanup();
    stubBrowser({ reducedMotion: true });
    const { container } = render(<FeatureMarquee />);
    expect(container.querySelectorAll('ul')).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /auto-scroll/i })).toBeNull();
    const region = screen.getByRole('region', { name: 'Features' });
    expect(region.className).not.toContain('scrollbar-width:none'); // the scrollbar stays visible
  });

  it('gives every card the same fixed width so the strip has a steady rhythm', () => {
    const { container } = render(<FeatureMarquee />);
    for (const li of container.querySelectorAll('li')) {
      expect(li.className).toContain('w-[280px]');
      expect(li.className).toContain('sm:w-[320px]');
      expect(li.className).toContain('shrink-0');
    }
  });
});
