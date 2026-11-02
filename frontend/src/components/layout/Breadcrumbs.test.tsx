import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { handleFor } from '@/routes/appRoutes';
import { PageTitleProvider, usePageTitle } from './PageTitleContext';
import { Breadcrumbs } from './Breadcrumbs';

function Page({ title }: { title?: string }) {
  usePageTitle(title);
  return <Breadcrumbs />;
}

function renderRoute(pattern: string, url: string, title?: string) {
  const router = createMemoryRouter([{ path: pattern, element: <Page title={title} />, handle: handleFor(pattern) }], {
    initialEntries: [url],
  });
  render(
    <PageTitleProvider>
      <RouterProvider router={router} />
    </PageTitleProvider>,
  );
}

/** The full trail, which is the wide-screen rendering. */
const fullTrail = () => within(screen.getByRole('list'));

/** The trail as a reader sees it, ancestors first. */
function trail(): string[] {
  const list = screen.queryByRole('list');
  if (!list) return [];
  return Array.from(list.querySelectorAll('li'))
    .map((li) => li.textContent?.trim() ?? '')
    .filter(Boolean);
}

describe('Breadcrumbs', () => {
  afterEach(cleanup);

  it('says nothing on a top-level page — the sidebar already does', () => {
    renderRoute('/app/patients', '/app/patients');
    expect(screen.queryByRole('navigation', { name: 'Breadcrumb' })).toBeNull();
  });

  it('walks the whole chain for a nested page, with resolved links', () => {
    renderRoute('/app/patients/:id/edit', '/app/patients/42/edit', 'Edit Sita Rai');
    expect(trail()).toEqual(['Patients', 'Patient', 'Edit Sita Rai']);
    expect(fullTrail().getByRole('link', { name: 'Patients' })).toHaveAttribute('href', '/app/patients');
    expect(fullTrail().getByRole('link', { name: 'Patient' })).toHaveAttribute('href', '/app/patients/42');
  });

  it('names the current page after the record, not the route', () => {
    renderRoute('/app/patients/:id', '/app/patients/42', 'Sita Rai');
    expect(trail()).toEqual(['Patients', 'Sita Rai']);
    expect(fullTrail().getByText('Sita Rai')).toHaveAttribute('aria-current', 'page');
  });

  it('falls back to the route title before the page has published one', () => {
    renderRoute('/app/patients/:id', '/app/patients/42');
    expect(trail()).toEqual(['Patients', 'Patient']);
  });

  it('places a page under where it belongs, not under its URL', () => {
    renderRoute('/app/users', '/app/users', 'Users');
    expect(trail()).toEqual(['Control center', 'Users']);
    expect(fullTrail().getByRole('link', { name: 'Control center' })).toHaveAttribute('href', '/app/admin');
  });

  it('collapses to the immediate parent for small screens', () => {
    renderRoute('/app/patients/:id/edit', '/app/patients/42/edit');
    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const collapsed = Array.from(nav.querySelectorAll('a')).find((a) => a.className.includes('sm:hidden'));
    expect(collapsed).toHaveAttribute('href', '/app/patients/42');
    expect(collapsed?.textContent?.trim()).toBe('Patient');
  });
});
