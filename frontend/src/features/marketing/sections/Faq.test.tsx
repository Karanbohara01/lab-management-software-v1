import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Faq } from './Faq';
import { FAQS } from '../data';

const INITIAL = 4;

describe('Faq', () => {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'), // reveal immediately, no observer needed
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => { cb(0); return 0; });
    Element.prototype.scrollIntoView = vi.fn();
  });
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  const questions = () => screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent);
  const toggle = () => screen.getByRole('button', { name: /^(Load More|Show Less)/ });

  it('has the long heading with a one-line subtitle, and no small tag above it', () => {
    render(<Faq />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent('Frequently Asked Questions');
    expect(screen.queryByText(/^FAQ$/)).toBeNull();
    expect(screen.getByText('Quick answers about how LIMS works in your laboratory.')).toBeInTheDocument();
  });

  it('starts with only the first four questions', () => {
    render(<Faq />);
    expect(questions()).toEqual(FAQS.slice(0, INITIAL).map((f) => f.q));
  });

  it('“Load More (6)” reveals the rest, in order, and the count is right on the button', () => {
    render(<Faq />);
    expect(toggle()).toHaveTextContent(`Load More (${FAQS.length - INITIAL})`);
    expect(toggle()).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(toggle());
    expect(questions()).toEqual(FAQS.map((f) => f.q));
    expect(toggle()).toHaveTextContent('Show Less');
    expect(toggle()).toHaveAttribute('aria-expanded', 'true');
  });

  it('“Show Less” folds it back to four and keeps the button in view', () => {
    render(<Faq />);
    fireEvent.click(toggle());
    fireEvent.click(toggle());
    expect(questions()).toHaveLength(INITIAL);
    expect(toggle()).toHaveTextContent('Load More');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('a question that gets hidden again does not stay open behind the scenes', () => {
    render(<Faq />);
    fireEvent.click(toggle()); // expand
    fireEvent.click(screen.getByRole('button', { name: FAQS[6]!.q })); // open question 7
    expect(screen.getByRole('button', { name: FAQS[6]!.q })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(toggle()); // collapse
    fireEvent.click(toggle()); // expand again
    expect(screen.getByRole('button', { name: FAQS[6]!.q })).toHaveAttribute('aria-expanded', 'false');
  });

  it('keeps the accordion working: first answer open, clicking another switches', () => {
    render(<Faq />);
    expect(screen.getByRole('button', { name: FAQS[0]!.q })).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(screen.getByRole('button', { name: FAQS[2]!.q }));
    expect(screen.getByRole('button', { name: FAQS[2]!.q })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: FAQS[0]!.q })).toHaveAttribute('aria-expanded', 'false');
  });
});
