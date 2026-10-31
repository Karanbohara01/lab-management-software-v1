import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { CONTACT_WHATSAPP } from '../data';
import { RequestDemoButton } from './RequestDemo';

function renderButton() {
  return render(
    <MemoryRouter>
      <RequestDemoButton />
    </MemoryRouter>,
  );
}

const OPEN = { name: /request a demo/i };
const DIALOG = { name: /how would you like to get started/i };

describe('RequestDemoButton', () => {
  afterEach(cleanup);

  it('shows nothing extra until pressed, then offers WhatsApp or the free-trial form', () => {
    renderButton();
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(screen.getByRole('button', OPEN));

    const dialog = screen.getByRole('dialog', DIALOG);
    expect(dialog).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /message us on whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start your free trial/i })).toBeInTheDocument();
  });

  it('opens a WhatsApp chat with the sales number and the request already written', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', OPEN));

    const link = screen.getByRole('link', { name: /message us on whatsapp/i });
    const href = link.getAttribute('href')!;
    expect(href.startsWith(`${CONTACT_WHATSAPP.href}?text=`)).toBe(true);
    expect(decodeURIComponent(href.split('?text=')[1]!)).toMatch(/demo/i);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'));
  });

  it('sends the other choice to the free-trial signup form', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', OPEN));

    expect(screen.getByRole('link', { name: /start your free trial/i })).toHaveAttribute('href', '/signup');
  });

  it('closes with Escape, the close button or the backdrop, and puts focus back on the button', () => {
    renderButton();
    const trigger = screen.getByRole('button', OPEN);

    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(trigger).toHaveFocus();

    fireEvent.click(trigger);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(screen.queryByRole('dialog')).toBeNull();

    fireEvent.click(trigger);
    const backdrop = screen.getByRole('dialog').previousElementSibling as HTMLElement;
    fireEvent.click(backdrop);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('puts keyboard focus on the first choice and keeps Tab inside the dialog', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', OPEN));

    const whatsapp = screen.getByRole('link', { name: /message us on whatsapp/i });
    expect(whatsapp).toHaveFocus();

    // from the last control, Tab wraps back to the first (the close button comes first in the DOM)
    screen.getByRole('link', { name: /start your free trial/i }).focus();
    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: 'Close' })).toHaveFocus();
  });
});
