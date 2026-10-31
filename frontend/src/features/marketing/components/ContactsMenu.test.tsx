import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { TEAM_CONTACTS } from '../data';
import { ContactList } from './ContactsMenu';
import { MarketingNav } from './MarketingNav';

describe('ContactList', () => {
  afterEach(cleanup);

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

  it('shows initials in the circle when a photo is missing', () => {
    const { container } = render(<ContactList />);
    expect(container.querySelectorAll('img')).toHaveLength(3);

    for (const img of Array.from(container.querySelectorAll('img'))) fireEvent.error(img);

    expect(container.querySelectorAll('img')).toHaveLength(0);
    expect(screen.getByText('K')).toBeInTheDocument(); // Mr. Karan
    expect(screen.getByText('N')).toBeInTheDocument(); // Ms. Namita
    expect(screen.getByText('NS')).toBeInTheDocument(); // Neural Software Solutions Nepal
  });
});

describe('navbar "More" button', () => {
  afterEach(cleanup);

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
