import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { Modal, ModalCancelButton } from './Modal';

function open(props: { confirmClose?: boolean; onClose: () => void }) {
  render(
    <Modal
      open
      onClose={props.onClose}
      confirmClose={props.confirmClose}
      title="Edit referring doctor"
      footer={<ModalCancelButton />}
    >
      <input aria-label="Full name" />
    </Modal>,
  );
}

const escape = () => fireEvent.keyDown(document, { key: 'Escape' });
const askStrip = () => screen.queryByText('Discard your unsaved changes?');

describe('Modal', () => {
  afterEach(cleanup);

  it('closes outright when there is nothing to lose', () => {
    const onClose = vi.fn();
    open({ onClose });

    escape();
    expect(onClose).toHaveBeenCalledOnce();
    expect(askStrip()).toBeNull();
  });

  it('asks before discarding unsaved edits, and keeps the form on "Keep editing"', () => {
    const onClose = vi.fn();
    open({ confirmClose: true, onClose });

    escape();
    expect(onClose).not.toHaveBeenCalled();
    expect(askStrip()).not.toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'Keep editing' }));
    expect(askStrip()).toBeNull();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Full name')).toBeInTheDocument();
  });

  it('closes on "Discard"', () => {
    const onClose = vi.fn();
    open({ confirmClose: true, onClose });

    escape();
    fireEvent.click(screen.getByRole('button', { name: 'Discard' }));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('asks for the footer Cancel button too, with one prompt rather than two', () => {
    const onClose = vi.fn();
    open({ confirmClose: true, onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getAllByText('Discard your unsaved changes?')).toHaveLength(1);
    // The footer is replaced by the prompt, so Cancel can't be pressed again underneath it.
    expect(screen.queryByRole('button', { name: 'Cancel' })).toBeNull();
  });

  it('asks when the backdrop and the close button are used', () => {
    const onClose = vi.fn();
    open({ confirmClose: true, onClose });

    fireEvent.click(screen.getByRole('button', { name: 'Close dialog' }));
    expect(onClose).not.toHaveBeenCalled();
    expect(askStrip()).not.toBeNull();
  });
});
