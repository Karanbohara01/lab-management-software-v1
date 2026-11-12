import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { PageTitleProvider, usePageTitle } from '@/components/layout/PageTitleContext';
import { handleFor } from '@/routes/appRoutes';
import { useBackTarget, type BackTarget } from './navigation';

function Probe({ title }: { title?: string }) {
  usePageTitle(title);
  const { back, canonical } = useBackTarget();
  return (
    <>
      <output data-testid="back">{JSON.stringify(back)}</output>
      <output data-testid="canonical">{JSON.stringify(canonical)}</output>
    </>
  );
}

/** Renders one `/app` route at `url` with its real navigation metadata attached. */
function renderRoute(pattern: string, url: string, state?: unknown, title?: string) {
  const router = createMemoryRouter(
    [{ path: pattern, element: <Probe title={title} />, handle: handleFor(pattern) }],
    { initialEntries: [{ pathname: url.split('?')[0]!, search: url.includes('?') ? `?${url.split('?')[1]}` : '', state }] },
  );
  render(
    <PageTitleProvider>
      <RouterProvider router={router} />
    </PageTitleProvider>,
  );
}

const back = (): BackTarget => JSON.parse(screen.getByTestId('back').textContent ?? '{}');
const canonical = (): BackTarget => JSON.parse(screen.getByTestId('canonical').textContent ?? '{}');

describe('useBackTarget', () => {
  afterEach(cleanup);

  it('prefers where the user actually came from, query string and all', () => {
    renderRoute('/app/patients/:id', '/app/patients/42', {
      from: { href: '/app/patients?q=sita&page=2', label: 'Patients' },
    });
    expect(back()).toEqual({ href: '/app/patients?q=sita&page=2', label: 'Patients' });
  });

  it('falls back to the route parent when the page was opened directly', () => {
    renderRoute('/app/patients/:id', '/app/patients/42');
    expect(back()).toEqual({ href: '/app/patients', label: 'Patients' });
  });

  it('fills the parent pattern from the current params', () => {
    renderRoute('/app/patients/:id/edit', '/app/patients/42/edit');
    expect(back()).toEqual({ href: '/app/patients/42', label: 'Patient' });
  });

  it('still honours the legacy ?from=order: hint', () => {
    renderRoute('/app/results/:id', '/app/results/7?from=order:99');
    expect(back()).toEqual({ href: '/app/orders/99', label: 'Order' });
  });

  it('lands on the dashboard for a top-level page with no parent', () => {
    renderRoute('/app/patients', '/app/patients');
    expect(back()).toEqual({ href: '/app', label: 'Dashboard' });
  });

  it('reports the canonical parent separately from where the user came from', () => {
    renderRoute('/app/users', '/app/users', { from: { href: '/app/orders', label: 'Lab orders' } });
    expect(back().label).toBe('Lab orders');
    // Users lives under Control center in the information architecture, not under Lab orders.
    expect(canonical()).toEqual({ href: '/app/admin', label: 'Control center' });
  });
});
