import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Reveal, staggerDelay } from './Reveal';

function stubIntersectionObserver() {
  const constructed = vi.fn();
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(...args: unknown[]) {
        constructed(...args);
      }
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
  return constructed;
}

describe('Reveal', () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it('trigger="mount" shows its content immediately, without ever constructing an IntersectionObserver', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const constructed = stubIntersectionObserver();

    render(<Reveal trigger="mount">content</Reveal>);
    expect(screen.getByText('content')).toHaveClass('opacity-100');
    expect(constructed).not.toHaveBeenCalled();
  });

  it('default trigger="scroll" starts hidden and observes the element', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }));
    const constructed = stubIntersectionObserver();

    render(<Reveal>content</Reveal>);
    expect(screen.getByText('content')).toHaveClass('opacity-0');
    expect(constructed).toHaveBeenCalled();
  });

  it('shows immediately regardless of trigger when prefers-reduced-motion is set', () => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const constructed = stubIntersectionObserver();

    render(<Reveal>content</Reveal>);
    expect(screen.getByText('content')).toHaveClass('opacity-100');
    expect(constructed).not.toHaveBeenCalled();
  });

  describe('staggerDelay', () => {
    it('cycles through 0, step, 2×step then wraps at max', () => {
      expect(staggerDelay(0)).toBe(0);
      expect(staggerDelay(1)).toBe(60);
      expect(staggerDelay(2)).toBe(120);
      expect(staggerDelay(3)).toBe(0);
    });

    it('honors a custom step and max', () => {
      expect(staggerDelay(4, 70, 10)).toBe(280);
    });
  });
});
