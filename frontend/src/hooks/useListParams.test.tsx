import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation, useNavigate } from 'react-router-dom';
import { useListParams } from './useListParams';

const PARAMS = { q: '', status: 'REQUESTED', page: 1, flag: false };

let set: ReturnType<typeof useListParams<typeof PARAMS>>['set'];
let reset: () => void;
let goBack: () => void;

function Probe() {
  const list = useListParams(PARAMS);
  const location = useLocation();
  const navigate = useNavigate();
  set = list.set;
  reset = list.reset;
  goBack = () => navigate(-1);
  return (
    <>
      <output data-testid="search">{location.search}</output>
      <output data-testid="params">{JSON.stringify(list.params)}</output>
      <output data-testid="default">{String(list.isDefault)}</output>
    </>
  );
}

function renderAt(url: string) {
  render(
    <MemoryRouter initialEntries={[url]}>
      <Probe />
    </MemoryRouter>,
  );
}

const search = () => screen.getByTestId('search').textContent;
const params = () => JSON.parse(screen.getByTestId('params').textContent ?? '{}');

describe('useListParams', () => {
  afterEach(cleanup);

  it('falls back to the schema defaults when the URL says nothing', () => {
    renderAt('/app/things');
    expect(params()).toEqual(PARAMS);
    expect(screen.getByTestId('default').textContent).toBe('true');
  });

  it('reads each key back in the type of its default', () => {
    renderAt('/app/things?q=sita&page=3&flag=1');
    expect(params()).toEqual({ q: 'sita', status: 'REQUESTED', page: 3, flag: true });
    expect(screen.getByTestId('default').textContent).toBe('false');
  });

  it('drops a key at its default out of the URL', () => {
    renderAt('/app/things?q=sita');
    act(() => set({ q: '' }));
    expect(search()).toBe('');
  });

  it('lets a list whose default is a real value still say "all"', () => {
    // Refunds opens on REQUESTED, so an empty status has to survive as a deliberate choice.
    renderAt('/app/things');
    act(() => set({ status: '' }));
    expect(search()).toBe('?status=');
    expect(params().status).toBe('');
  });

  it('resets to page 1 when a filter changes, but not when the page itself does', () => {
    renderAt('/app/things?page=4');
    act(() => set({ q: 'sita' }));
    expect(search()).toBe('?q=sita');

    act(() => set({ page: 2 }));
    expect(search()).toBe('?q=sita&page=2');
  });

  it('keeps the page when told to', () => {
    renderAt('/app/things?page=4');
    act(() => set({ flag: true }, { resetPage: false }));
    expect(params()).toEqual({ q: '', status: 'REQUESTED', page: 4, flag: true });
  });

  it('pushes a filter change so Back steps through it', () => {
    renderAt('/app/things');
    act(() => set({ status: 'APPROVED' }));
    expect(search()).toBe('?status=APPROVED');

    act(() => goBack());
    expect(search()).toBe('');
  });

  it('replaces a search change so typing does not bury the history', () => {
    renderAt('/app/things');
    act(() => set({ status: 'APPROVED' }));
    act(() => set({ q: 'si' }, { replace: true }));
    expect(search()).toBe('?status=APPROVED&q=si');

    // The replace overwrote the filter entry, so one Back lands before the filter was applied.
    act(() => goBack());
    expect(search()).toBe('');
  });

  it('writes a multi-key patch as a single history entry', () => {
    renderAt('/app/things');
    act(() => set({ q: 'sita', flag: true }));
    expect(search()).toBe('?q=sita&flag=1');

    act(() => goBack());
    expect(search()).toBe('');
  });

  it('clears only the keys it owns', () => {
    renderAt('/app/things?q=sita&page=2&ref=email');
    act(() => reset());
    expect(search()).toBe('?ref=email');
  });
});
