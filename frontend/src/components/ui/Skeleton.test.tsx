import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton, SkeletonText, SkeletonCircle } from './Skeleton';

describe('Skeleton', () => {
  it('renders with pulse animation and surface-muted color', () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass('animate-pulse');
    expect(el).toHaveClass('bg-surface-muted');
    expect(el).toHaveClass('h-4');
    expect(el).toHaveClass('w-20');
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('renders multi-line SkeletonText with specified count', () => {
    const { container } = render(<SkeletonText lines={4} />);
    const lines = container.querySelectorAll('.animate-pulse');
    expect(lines.length).toBe(4);
  });

  it('renders SkeletonCircle with rounded-full shape', () => {
    const { container } = render(<SkeletonCircle size="lg" />);
    const circle = container.firstElementChild as HTMLElement;
    expect(circle).toHaveClass('rounded-full');
    expect(circle).toHaveClass('h-10');
    expect(circle).toHaveClass('w-10');
  });
});
