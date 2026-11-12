import { afterEach, describe, expect, it } from 'vitest';
import { act, cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import { useRevenueWindow, type RevenueWindowState } from './useRevenueWindow';

let api: RevenueWindowState;

function Probe() {
  api = useRevenueWindow();
  const location = useLocation();
  return (
    <>
      <output data-testid="search">{location.search}</output>
      <output data-testid="query">{JSON.stringify(api.query)}</output>
      <output data-testid="carry">{api.search}</output>
      <output data-testid="preset">{String(api.preset)}</output>
      <output data-testid="range">{JSON.stringify(api.range)}</output>
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
const query = () => JSON.parse(screen.getByTestId('query').textContent ?? '{}');
const carry = () => screen.getByTestId('carry').textContent;

describe('useRevenueWindow', () => {
  afterEach(cleanup);

  it('defaults to today, with nothing in the URL', () => {
    renderAt('/app/revenue');
    expect(screen.getByTestId('preset').textContent).toBe('TODAY');
    expect(query()).toEqual({ preset: 'TODAY', branchId: undefined });
    expect(search()).toBe('');
  });

  it('reads a preset from the URL', () => {
    renderAt('/app/revenue?preset=LAST_MONTH');
    expect(query()).toEqual({ preset: 'LAST_MONTH', branchId: undefined });
    expect(screen.getByTestId('range').textContent).toBe('null');
  });

  it('sends explicit dates instead of a preset when a range is set', () => {
    renderAt('/app/revenue?from=2026-01-01&to=2026-01-31');
    expect(query()).toEqual({ from: '2026-01-01', to: '2026-01-31', branchId: undefined });
    expect(screen.getByTestId('preset').textContent).toBe('null');
  });

  it('never sends a preset and a range together', () => {
    renderAt('/app/revenue?preset=THIS_YEAR&from=2026-01-01&to=2026-01-31');
    // A range in the URL wins; the stale preset is ignored rather than sent alongside it.
    expect(query()).toEqual({ from: '2026-01-01', to: '2026-01-31', branchId: undefined });
    expect(screen.getByTestId('preset').textContent).toBe('null');
  });

  it('choosing a range clears the preset key out of the URL entirely', () => {
    renderAt('/app/revenue?preset=THIS_YEAR');
    act(() => api.setRange({ from: '2026-02-01', to: '2026-02-28' }));
    expect(search()).toBe('?from=2026-02-01&to=2026-02-28');
    expect(search()).not.toContain('preset');
  });

  it('choosing a preset clears an existing range', () => {
    renderAt('/app/revenue?from=2026-02-01&to=2026-02-28');
    act(() => api.setPreset('LAST_WEEK'));
    expect(search()).toBe('?preset=LAST_WEEK');
    expect(query()).toEqual({ preset: 'LAST_WEEK', branchId: undefined });
  });

  it('going back to today leaves a clean URL', () => {
    renderAt('/app/revenue?preset=LAST_WEEK');
    act(() => api.setPreset('TODAY'));
    expect(search()).toBe('');
    expect(query()).toEqual({ preset: 'TODAY', branchId: undefined });
  });

  it('carries the branch through, as a number for the API', () => {
    renderAt('/app/revenue?preset=THIS_MONTH&branchId=3');
    expect(query()).toEqual({ preset: 'THIS_MONTH', branchId: 3 });
    act(() => api.setBranch(''));
    expect(query()).toEqual({ preset: 'THIS_MONTH', branchId: undefined });
    expect(search()).toBe('?preset=THIS_MONTH');
  });

  it('builds a query string that carries the window to the print route', () => {
    renderAt('/app/revenue?preset=LAST_MONTH&branchId=2');
    expect(carry()).toBe('?preset=LAST_MONTH&branchId=2');
  });

  it('carries an explicit range to the print route', () => {
    renderAt('/app/revenue?from=2026-03-01&to=2026-03-31');
    expect(carry()).toBe('?from=2026-03-01&to=2026-03-31');
  });

  it('carries nothing extra for today, so the print route defaults the same way', () => {
    renderAt('/app/revenue');
    expect(carry()).toBe('');
  });
});
