import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TEAM_CONTACTS } from '../data';
import { leadershipApi, type Leader } from '../leadership';
import { ContactList } from './ContactsMenu';
import { MarketingNav } from './MarketingNav';

const KARAN_PHOTO = 'data:image/jpeg;base64,/9j/KARAN';
const NAMITA_PHOTO = 'data:image/jpeg;base64,/9j/NAMITA';
const leader = (id: number, name: string, photoDataUri: string | null): Leader => ({
  id,
  name,
  title: 'Founder',
  description: null,
  photoDataUri,
  linkedinUrl: null,
  facebookUrl: null,
  instagramUrl: null,
  threadsUrl: null,
});
const srcs = (container: HTMLElement) => Array.from(container.querySelectorAll('img')).map((i) => i.getAttribute('src'));

describe('ContactList', () => {
  beforeEach(() => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([]);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('lists each person with a WhatsApp link and a phone link to the same number', () => {
    render(<ContactList />);

    for (const c of TEAM_CONTACTS) {
      const whatsapp = screen.getByRole('link', { name: `WhatsApp ${c.name}: ${c.display}` });
      expect(whatsapp).toHaveAttribute('href', `https://wa.me/${c.digits}`);
      expect(whatsapp).toHaveAttribute('target', '_blank');
      expect(screen.getByRole('link', { name: `Call ${c.name}: ${c.display}` })).toHaveAttribute('href', `tel:+${c.digits}`);
    }
  });

  it('has the three people, with their numbers', () => {
    expect(TEAM_CONTACTS.map((c) => [c.name, c.digits])).toEqual([
      ['Mr. Karan', '9779706127862'],
      ['Ms. Namita', '9779817253042'],
      ['Neural Software Solutions Nepal', '9779747214634'],
    ]);
  });

  it('shows initials in the circle when a photo is missing', async () => {
    const { container } = render(<ContactList />);
    await waitFor(() => expect(container.querySelectorAll('img')).toHaveLength(3)); // the files named in the data

    for (const img of Array.from(container.querySelectorAll('img'))) fireEvent.error(img);

    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getByText('K')).toBeInTheDocument(); // Mr. Karan
    expect(screen.getByText('N')).toBeInTheDocument(); // Ms. Namita
    expect(screen.getByText('NS')).toBeInTheDocument(); // Neural Software Solutions Nepal
  });

  it('uses the photos uploaded for Karan and Namita on the Leadership page', async () => {
    vi.mocked(leadershipApi.list).mockResolvedValue([
      leader(1, 'Karan Bohara', KARAN_PHOTO),
      leader(2, 'namita giri', NAMITA_PHOTO), // matched by first name, whatever the capitals
    ]);
    const { container } = render(<ContactList />);

    await waitFor(() => expect(srcs(container)[0]).toBe(KARAN_PHOTO));
    expect(srcs(container)).toEqual([KARAN_PHOTO, NAMITA_PHOTO, '/marketing/team/neural-software.webp']);
  });

  it('shows initials, not a missing file, while the uploaded photos are loading', () => {
    vi.mocked(leadershipApi.list).mockReturnValue(new Promise(() => {}));
    const { container } = render(<ContactList />);

    expect(screen.getByText('K')).toBeInTheDocument();
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(srcs(container)).toEqual(['/marketing/team/neural-software.webp']); // only the company, which has no leader
  });

  it('falls back to the avatar file when that leader has no photo, and to initials when it will not load', async () => {
    vi.mocked(leadershipApi.list).mockResolvedValue([leader(1, 'Karan Bohara', null), leader(2, 'Namita Giri', NAMITA_PHOTO)]);
    const { container } = render(<ContactList />);

    await waitFor(() => expect(srcs(container)).toEqual(['/marketing/team/karan.webp', NAMITA_PHOTO, '/marketing/team/neural-software.webp']));

    fireEvent.error(container.querySelectorAll('img')[1]!); // the uploaded photo is unreadable
    expect(screen.getByText('N')).toBeInTheDocument();
    expect(srcs(container)).toEqual(['/marketing/team/karan.webp', '/marketing/team/neural-software.webp']);
  });

  it('ignores a leader whose first name matches nobody, so no one gets the wrong photo', async () => {
    vi.mocked(leadershipApi.list).mockResolvedValue([leader(1, 'Sita Rai', 'data:image/jpeg;base64,/9j/SITA')]);
    const { container } = render(<ContactList />);

    await waitFor(() => expect(leadershipApi.list).toHaveBeenCalled());
    await waitFor(() => expect(srcs(container)).toEqual(['/marketing/team/karan.webp', '/marketing/team/namita.webp', '/marketing/team/neural-software.webp']));
  });

  it('shares one request when several parts of the page ask for the leaders at once', async () => {
    render(
      <>
        <ContactList />
        <ContactList />
      </>,
    );

    await waitFor(() => expect(screen.getAllByRole('link', { name: /WhatsApp Mr. Karan/ })).toHaveLength(2));
    expect(leadershipApi.list).toHaveBeenCalledTimes(1);
  });
});

describe('navbar "More" button', () => {
  beforeEach(() => {
    vi.spyOn(leadershipApi, 'list').mockResolvedValue([]);
  });
  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  function renderNav() {
    return render(
      <MemoryRouter>
        <MarketingNav />
      </MemoryRouter>,
    );
  }

  it('opens and closes the contact panel', () => {
    renderNav();
    const more = screen.getByRole('button', { name: /^more$/i });
    expect(more).toHaveAttribute('aria-expanded', 'false');

    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'true');
    const panel = screen.getByRole('region', { name: 'Contact the team' });
    expect(within(panel).getAllByRole('listitem')).toHaveLength(3);

    fireEvent.click(more);
    expect(more).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes on Escape (focus back on More) and on a click elsewhere', () => {
    renderNav();
    const more = screen.getByRole('button', { name: /^more$/i });

    fireEvent.click(more);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(more).toHaveAttribute('aria-expanded', 'false');
    expect(more).toHaveFocus();

    fireEvent.click(more);
    fireEvent.pointerDown(document.body);
    expect(more).toHaveAttribute('aria-expanded', 'false');
  });
});
