import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Badge } from './Badge';

describe('Badge', () => {
  it('renders default solid tone correctly', () => {
    const { container, getByText } = render(<Badge tone="success">Active</Badge>);
    expect(getByText('Active')).toBeInTheDocument();
    const badge = container.firstElementChild as HTMLElement;
    expect(badge).toHaveClass('bg-success-muted');
    expect(badge).toHaveClass('text-white');
  });

  it('renders subtle variant correctly', () => {
    const { container } = render(<Badge tone="warning" variant="subtle">Pending</Badge>);
    const badge = container.firstElementChild as HTMLElement;
    expect(badge).toHaveClass('bg-warning/15');
    expect(badge).toHaveClass('text-warning');
  });

  it('renders dot indicator when dot is true', () => {
    const { container } = render(<Badge tone="info" dot>Live</Badge>);
    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
    expect(dot).toHaveClass('rounded-full');
    expect(dot).toHaveClass('bg-primary');
  });

  it('renders icon when provided', () => {
    const { getByTestId } = render(
      <Badge icon={<span data-testid="test-icon">★</span>}>Starred</Badge>
    );
    expect(getByTestId('test-icon')).toBeInTheDocument();
  });
});
