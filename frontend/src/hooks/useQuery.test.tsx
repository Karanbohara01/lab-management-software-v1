import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { useQuery } from './useQuery';

function Probe({ fetcher, cacheKey, dep }: { fetcher: () => Promise<string>; cacheKey?: string; dep?: string }) {
  const { data, loading } = useQuery(fetcher, [dep], { cacheKey });
  return (
    <>
      <output data-testid="data">{data ?? '—'}</output>
      <output data-testid="loading">{String(loading)}</output>
    </>
  );
}

const data = () => screen.getByTestId('data').textContent;
const loading = () => screen.getByTestId('loading').textContent;

describe('useQuery', () => {
  afterEach(cleanup);

  it('draws nothing until the first result arrives', async () => {
    const fetcher = vi.fn().mockResolvedValue('first');
    render(<Probe fetcher={fetcher} />);
    expect(data()).toBe('—');
    await waitFor(() => expect(data()).toBe('first'));
    expect(loading()).toBe('false');
  });

  it('shows the last result for a key immediately on the next visit, and still refetches', async () => {
    const key = `test:${Math.random()}`;
    const first = vi.fn().mockResolvedValue('page one');
    const { unmount } = render(<Probe fetcher={first} cacheKey={key} />);
    await waitFor(() => expect(data()).toBe('page one'));
    unmount();

    // Coming back: the cached rows are on screen in the first frame, not a skeleton.
    let resolve: (value: string) => void = () => undefined;
    const second = vi.fn().mockReturnValue(new Promise<string>((r) => (resolve = r)));
    render(<Probe fetcher={second} cacheKey={key} />);
    expect(data()).toBe('page one');
    expect(loading()).toBe('true');

    await act(async () => resolve('page one, fresher'));
    expect(data()).toBe('page one, fresher');
    expect(second).toHaveBeenCalledOnce();
  });

  it('keeps the results of different keys apart', async () => {
    const a = `test:a:${Math.random()}`;
    const b = `test:b:${Math.random()}`;
    const { unmount } = render(<Probe fetcher={vi.fn().mockResolvedValue('from a')} cacheKey={a} />);
    await waitFor(() => expect(data()).toBe('from a'));
    unmount();

    render(<Probe fetcher={vi.fn().mockReturnValue(new Promise(() => undefined))} cacheKey={b} />);
    expect(data()).toBe('—');
  });

  it('does not seed anything without a key', async () => {
    const fetcher = vi.fn().mockResolvedValue('uncached');
    const { unmount } = render(<Probe fetcher={fetcher} />);
    await waitFor(() => expect(data()).toBe('uncached'));
    unmount();

    render(<Probe fetcher={vi.fn().mockReturnValue(new Promise(() => undefined))} />);
    expect(data()).toBe('—');
  });
});
