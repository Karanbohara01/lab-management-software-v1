import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { StatusStepper, type Step } from './StatusStepper';

describe('StatusStepper', () => {
  const steps: Step[] = [
    { id: 'COLLECTION', label: 'Collection' },
    { id: 'IN_LAB', label: 'Received in Lab' },
    { id: 'REPORTED', label: 'Reported' },
  ];

  it('renders all step labels', () => {
    const { getByText } = render(
      <StatusStepper steps={steps} currentStepId="IN_LAB" />
    );
    expect(getByText('Collection')).toBeInTheDocument();
    expect(getByText('Received in Lab')).toBeInTheDocument();
    expect(getByText('Reported')).toBeInTheDocument();
  });

  it('highlights current step and marks completed steps with check', () => {
    const { container } = render(
      <StatusStepper steps={steps} currentStepId="IN_LAB" />
    );
    // 1st step is done (bg-success)
    const successNode = container.querySelector('.bg-success');
    expect(successNode).toBeInTheDocument();

    // 2nd step is current (bg-primary)
    const primaryNode = container.querySelector('.bg-primary');
    expect(primaryNode).toBeInTheDocument();
  });

  it('renders compact mode with dots', () => {
    const { container } = render(
      <StatusStepper steps={steps} currentStepId="COLLECTION" compact={true} />
    );
    const dots = container.querySelectorAll('.rounded-full');
    expect(dots.length).toBe(3);
  });
});
