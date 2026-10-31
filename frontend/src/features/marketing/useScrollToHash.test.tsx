import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { useScrollToHash } from './useScrollToHash';
import { NAV_ITEMS, FEATURES } from './data';

function Page() {
  useScrollToHash();
  const navigate = useNavigate();
  return (
    <div>
      <section id="pricing">Pricing</section>
      <button onClick={() => navigate('/#pricing')}>to pricing</button>
      <button onClick={() => navigate('/')}>to top</button>
    </div>
  );
}

function renderAt(entry: string) {
  return render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="*" element={<Page />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('useScrollToHash', () => {
  const scrollIntoView = vi.fn();
  const scrollTo = vi.fn();

  beforeEach(() => {
    scrollIntoView.mockReset();
    scrollTo.mockReset();
    Element.prototype.scrollIntoView = scrollIntoView;
    vi.spyOn(window, 'scrollTo').mockImplementation(scrollTo);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('scrolls to the section named by the hash', () => {
    renderAt('/#pricing');
    expect(scrollIntoView).toHaveBeenCalledTimes(1);
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById('pricing'));
  });

  it('leaves the browser alone on a first load with nothing to scroll to (keeps refresh-restore)', () => {
    renderAt('/');
    renderAt('/#nope');
    expect(scrollIntoView).not.toHaveBeenCalled();
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('on a client-side navigation without a hash, scrolls to the top', async () => {
    const { getByText } = renderAt('/');
    scrollTo.mockClear();
    fireEvent.click(getByText('to top'));
    await vi.waitFor(() => expect(scrollTo).toHaveBeenCalledWith(0, 0));
  });

  it('scrolls again when the same section link is used twice', async () => {
    const { getByText } = renderAt('/#pricing');
    scrollIntoView.mockClear();
    fireEvent.click(getByText('to pricing'));
    await vi.waitFor(() => expect(scrollIntoView).toHaveBeenCalledTimes(1));
  });
});

describe('navigation data', () => {
  it('sends every navbar item — Solutions included — to a section of the home page', () => {
    for (const item of NAV_ITEMS) expect(item.href).toMatch(/^\/#[a-z-]+$/);
    expect(NAV_ITEMS.find((i) => i.label === 'Solutions')?.href).toBe('/#solutions');
  });

  it('keeps every features-menu link a home-page section link', () => {
    for (const f of FEATURES) expect(f.href).toMatch(/^\/#[a-z-]+$/);
  });
});
