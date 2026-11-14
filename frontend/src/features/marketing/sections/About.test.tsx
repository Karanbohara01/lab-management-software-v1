import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import { About } from './About';
import { leadershipApi, type Leader } from '../leadership';

const CEO: Leader = {
  id: 1,
  name: 'Karan Bohara',
  title: 'CEO & Founder',
  description: 'Sets the vision and direction of the company.',
  photoDataUri: 'data:image/jpeg;base64,/9j/4AAQ',
  linkedinUrl: 'https://linkedin.com/in/karan',
  facebookUrl: null,
  instagramUrl: 'https://instagram.com/karan',
  threadsUrl: null,
};
const COO: Leader = {
  id: 2,
  name: 'Namita Giri',
  title: 'COO & Co-Founder',
  description: 'Runs day-to-day operations.',
  photoDataUri: null,
  linkedinUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  threadsUrl: null,
};

function stubBrowser() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('reduce'), // reveal animations show at once; no observer needed
    media: query,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      disconnect() {}
      unobserve() {}
    },
  );
}

describe('About us — leadership', () => {
  beforeEach(stubBrowser);
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  it('shows the two leaders, each with name, title and description', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([CEO, COO]);
    render(<About />);

    const list = await screen.findByRole('list', { name: 'Leadership' });
    const cards = within(list).getAllByRole('article');
    expect(cards).toHaveLength(2);
    expect(within(cards[0]!).getByRole('heading', { name: 'Karan Bohara' })).toBeInTheDocument();
    expect(within(cards[0]!).getByText('CEO & Founder')).toBeInTheDocument();
    expect(within(cards[0]!).getByText('Sets the vision and direction of the company.')).toBeInTheDocument();
    expect(within(cards[1]!).getByRole('heading', { name: 'Namita Giri' })).toBeInTheDocument();
    expect(within(cards[1]!).getByText('COO & Co-Founder')).toBeInTheDocument();
  });

  it('no longer shows the three principle cards', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([CEO, COO]);
    render(<About />);
    await screen.findByRole('list', { name: 'Leadership' });

    for (const gone of ['Made for Nepal', 'Honest by design', 'Built for the whole team']) {
      expect(screen.queryByText(gone)).toBeNull();
    }
  });

  it('uses the photo when there is one and the initials when there is not', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([CEO, COO]);
    render(<About />);

    const photo = await screen.findByRole('img', { name: 'Karan Bohara, CEO & Founder' });
    expect(photo).toHaveAttribute('src', CEO.photoDataUri);
    expect(screen.getByText('NG')).toBeInTheDocument(); // Namita Giri has no photo
    expect(screen.queryByText('KB')).toBeNull();
  });

  it('always puts LinkedIn, Facebook and Instagram on the photo, each a link only once it has an address', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([CEO, COO]);
    render(<About />);

    const list = await screen.findByRole('list', { name: 'Leadership' });
    const [first, second] = within(list).getAllByRole('article');
    const networks = (row: HTMLElement) => [...row.querySelectorAll('[data-network]')].map((e) => e.getAttribute('data-network'));

    // both leaders get the three buttons, whether or not they have links yet — and no Threads without a link
    expect(networks(first!)).toEqual(['LinkedIn', 'Facebook', 'Instagram']);
    expect(networks(second!)).toEqual(['LinkedIn', 'Facebook', 'Instagram']);

    // the ones with an address are real links that open in a new tab
    const linkedin = within(first!).getByRole('link', { name: 'Karan Bohara on LinkedIn' });
    expect(linkedin).toHaveAttribute('href', 'https://linkedin.com/in/karan');
    expect(linkedin).toHaveAttribute('target', '_blank');
    expect(linkedin.getAttribute('rel')).toContain('noopener');
    expect(within(first!).getByRole('link', { name: 'Karan Bohara on Instagram' })).toHaveAttribute(
      'href',
      'https://instagram.com/karan',
    );

    // the one without is only a picture — never a link that goes nowhere
    expect(within(first!).queryByRole('link', { name: /Facebook/ })).toBeNull();
    expect(first!.querySelector('[data-network="Facebook"]')!.tagName).toBe('SPAN');
    expect(within(second!).queryAllByRole('link')).toHaveLength(0);
  });

  it('shows Threads only when it has a link', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([{ ...CEO, threadsUrl: 'https://threads.net/@karan' }]);
    render(<About />);

    expect(await screen.findByRole('link', { name: 'Karan Bohara on Threads' })).toHaveAttribute(
      'href',
      'https://threads.net/@karan',
    );
  });

  it('spreads the buttons round the photo rather than stacking them', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([
      { ...CEO, facebookUrl: 'https://facebook.com/karan', threadsUrl: 'https://threads.net/@karan' },
    ]);
    render(<About />);

    const links = await screen.findAllByRole('link');
    expect(links).toHaveLength(4);
    const anchors = links.map((a) => a.closest<HTMLElement>('[data-orbit-anchor]')!);
    expect(new Set(anchors.map((a) => `${a.style.left}/${a.style.top}`)).size).toBe(4);
  });

  it('spaces the buttons evenly round the circle, however many there are', async () => {
    const angleOf = (el: HTMLElement) => {
      const x = parseFloat(el.style.left) - 50; // percentages of the photo's box, centre at 50/50
      const y = 50 - parseFloat(el.style.top);
      return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
    };
    const gaps = (angles: number[]) =>
      angles.map((a, i) => (angles[(i + 1) % angles.length]! - a + 360) % 360).map((g) => Math.round(g));

    // three buttons (the two leaders without Threads) -> 120 degrees apart
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([COO]);
    const { container, unmount } = render(<About />);
    await screen.findByRole('list', { name: 'Leadership' });
    const three = [...container.querySelectorAll<HTMLElement>('[data-orbit-anchor]')].map(angleOf);
    expect(three).toHaveLength(3);
    expect(gaps(three)).toEqual([120, 120, 120]);
    unmount();

    // four buttons (Threads has a link too) -> 90 degrees apart
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([{ ...COO, threadsUrl: 'https://threads.net/@namita' }]);
    const again = render(<About />);
    await screen.findByRole('list', { name: 'Leadership' });
    const four = [...again.container.querySelectorAll<HTMLElement>('[data-orbit-anchor]')].map(angleOf);
    expect(four).toHaveLength(4);
    expect(gaps(four)).toEqual([90, 90, 90, 90]);
  });

  it('hangs every button off the revolving ring, inside a counter-turn that keeps its icon upright', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([CEO, COO]);
    const { container } = render(<About />);
    await screen.findByRole('list', { name: 'Leadership' });

    const buttons = container.querySelectorAll('[data-network]');
    expect(buttons).toHaveLength(6);
    for (const b of buttons) {
      expect(b.closest('.orbit-counter')).not.toBeNull();
      expect(b.closest('.orbit-ring')).not.toBeNull();
      expect(b.closest('.orbit-group')).not.toBeNull(); // so hovering the photo pauses it
    }
  });

  it('sends the two leaders round in opposite directions', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([CEO, COO]);
    const { container } = render(<About />);
    await screen.findByRole('list', { name: 'Leadership' });

    const rings = container.querySelectorAll<HTMLElement>('.orbit-ring');
    expect(rings).toHaveLength(2);
    expect(rings[0]!.style.animationDirection).toBe('');
    expect(rings[1]!.style.animationDirection).toBe('reverse');
  });

  it('puts the photo on the right of the first leader and on the left of the second', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([CEO, COO]);
    render(<About />);

    const list = await screen.findByRole('list', { name: 'Leadership' });
    const [first, second] = within(list).getAllByRole('article');
    const photoSide = (row: HTMLElement) =>
      (row.querySelector('img, span[aria-hidden].flex')!.closest('[class*="md:order-"]') as HTMLElement).className;

    expect(photoSide(first!)).toContain('md:order-2');
    expect(photoSide(second!)).toContain('md:order-1');
  });

  it('shows just the one when only one has been named', async () => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([COO]);
    render(<About />);

    const list = await screen.findByRole('list', { name: 'Leadership' });
    expect(within(list).getAllByRole('article')).toHaveLength(1);
  });

  it('leaves the heading and intro and shows nothing — no error — when none have been named', async () => {
    const spy = vi.spyOn(leadershipApi, 'list').mockResolvedValue([]);
    render(<About />);
    await waitFor(() => expect(spy).toHaveBeenCalled());

    expect(screen.getByRole('heading', { name: /software for laboratories/i })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Leadership' })).toBeNull();
    expect(screen.queryByText(/error|unable|failed/i)).toBeNull();
  });

  it('does the same if the profiles cannot be loaded', async () => {
    const spy = vi.spyOn(leadershipApi, 'list').mockRejectedValue(new Error('offline'));
    render(<About />);
    await waitFor(() => expect(spy).toHaveBeenCalled());
    await waitFor(() => expect(document.querySelector('[aria-hidden].animate-pulse')).toBeNull());

    expect(screen.getByRole('heading', { name: /software for laboratories/i })).toBeInTheDocument();
    expect(screen.queryByRole('list', { name: 'Leadership' })).toBeNull();
    expect(screen.queryByText(/error|unable|failed/i)).toBeNull();
  });

  it('shows placeholders, not the wrong content, while loading', () => {
    vi.spyOn(leadershipApi, 'list').mockReturnValue(new Promise(() => {}));
    render(<About />);

    expect(document.querySelectorAll('.animate-pulse')).toHaveLength(2);
    expect(screen.queryByRole('list', { name: 'Leadership' })).toBeNull();
  });
});
