import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDebouncedValue } from './useDebouncedValue';

describe('useDebouncedValue', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebouncedValue('a', 200));
    expect(result.current).toBe('a');
  });

  it('updates only after the delay elapses with no further changes', () => {
    const { result, rerender } = renderHook(({ v }) => useDebouncedValue(v, 200), {
      initialProps: { v: 'a' },
    });

    rerender({ v: 'b' });
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBe('a');

    rerender({ v: 'c' }); // restarts the timer
    act(() => vi.advanceTimersByTime(150));
    expect(result.current).toBe('a');

    act(() => vi.advanceTimersByTime(60));
    expect(result.current).toBe('c');
  });
});
