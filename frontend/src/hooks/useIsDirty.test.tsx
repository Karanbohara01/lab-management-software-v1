import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { useIsDirty } from './useUnsavedChanges';

function Probe({ current, initial }: { current: unknown; initial: unknown }) {
  return <output data-testid="dirty">{String(useIsDirty(current, initial))}</output>;
}

const dirty = () => screen.getByTestId('dirty').textContent;

describe('useIsDirty', () => {
  afterEach(cleanup);

  it('is clean when the form still matches what it was loaded with', () => {
    render(<Probe current={{ name: 'Sita', tests: [1, 2] }} initial={{ name: 'Sita', tests: [1, 2] }} />);
    expect(dirty()).toBe('false');
  });

  it('notices a changed field', () => {
    render(<Probe current={{ name: 'Sita Rai' }} initial={{ name: 'Sita' }} />);
    expect(dirty()).toBe('true');
  });

  it('notices a changed nested list', () => {
    render(<Probe current={{ tests: [{ id: 1 }, { id: 2 }] }} initial={{ tests: [{ id: 1 }] }} />);
    expect(dirty()).toBe('true');
  });

  it('is clean again once a field is put back', () => {
    const { rerender } = render(<Probe current={{ name: 'Sita Rai' }} initial={{ name: 'Sita' }} />);
    expect(dirty()).toBe('true');
    rerender(<Probe current={{ name: 'Sita' }} initial={{ name: 'Sita' }} />);
    expect(dirty()).toBe('false');
  });

  it('is clean for a blank new-record form', () => {
    render(<Probe current={{ name: '', tests: [] }} initial={{ name: '', tests: [] }} />);
    expect(dirty()).toBe('false');
  });
});
