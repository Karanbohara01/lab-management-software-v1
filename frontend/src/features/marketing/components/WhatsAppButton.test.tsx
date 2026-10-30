import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { WhatsAppButton } from './WhatsAppButton';
import { CONTACT_WHATSAPP } from '../data';

describe('WhatsAppButton', () => {
  afterEach(cleanup);

  it('is a link that opens the WhatsApp chat directly, in a new tab', () => {
    render(<WhatsAppButton />);
    const link = screen.getByRole('link', { name: /chat with us on whatsapp/i });
    expect(link).toHaveAttribute('href', CONTACT_WHATSAPP.href);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link.getAttribute('rel')).toContain('noopener');
  });

  it("goes to the lab's WhatsApp number, in wa.me's digits-only form", () => {
    expect(CONTACT_WHATSAPP.href).toBe('https://wa.me/9779747214634');
    expect(CONTACT_WHATSAPP.display).toBe('+977 974-7214634');
  });

  it('names the number it opens, so a screen reader user knows where it goes', () => {
    render(<WhatsAppButton />);
    expect(screen.getByRole('link', { name: new RegExp(CONTACT_WHATSAPP.display.replace('+', '\\+')) })).toBeInTheDocument();
  });
});
