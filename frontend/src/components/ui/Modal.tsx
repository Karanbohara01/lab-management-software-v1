import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { Button } from './Button';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'md' | 'lg' | 'xl';
  /**
   * Set while the form inside has unsaved edits. Escape, the backdrop and the close button then
   * ask before discarding (an inline strip in the footer — a second dialog would fight this one's
   * focus trap). Call sites that have their own Cancel button should route it through
   * `requestClose` from `useModalClose` so it asks too.
   */
  confirmClose?: boolean;
}

const SIZES: Record<NonNullable<ModalProps['size']>, string> = {
  md: 'sm:max-w-lg',
  lg: 'sm:max-w-2xl',
  xl: 'sm:max-w-4xl',
};

const RequestCloseContext = createContext<(() => void) | null>(null);

/**
 * The modal's own "try to close" action, for a Cancel button the call site renders in `footer` (or
 * anywhere in the body). It asks before discarding when the modal is in `confirmClose` mode, using
 * the same single prompt Escape and the backdrop use — so a modal never ends up with two of them.
 * Outside a `Modal` it falls back to a no-op, so a footer can be rendered standalone in a test.
 */
export function useModalRequestClose(): () => void {
  const requestClose = useContext(RequestCloseContext);
  return requestClose ?? (() => undefined);
}

/**
 * The Cancel button for a modal's footer. It routes through the modal's own close request, so a
 * form with unsaved edits (`confirmClose`) asks before throwing them away — instead of every form
 * modal repeating that logic. Render it inside `footer`, not around the `Modal`.
 */
export function ModalCancelButton({ children = 'Cancel' }: { children?: ReactNode }) {
  const requestClose = useModalRequestClose();
  return (
    <Button variant="secondary" type="button" onClick={requestClose}>
      {children}
    </Button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  confirmClose,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [asking, setAsking] = useState(false);

  const requestClose = useCallback(() => {
    if (confirmClose) setAsking(true);
    else onClose();
  }, [confirmClose, onClose]);

  // A modal that reopens shouldn't still be asking about the last time it closed.
  useEffect(() => {
    if (!open) setAsking(false);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(
        dialog?.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        requestClose();
        return;
      }
      if (e.key === 'Tab') {
        const items = focusable();
        const first = items[0];
        const last = items[items.length - 1];
        if (!first || !last) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', onKey);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    (dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? focusable()[0] ?? dialog)?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      previouslyFocused?.focus();
    };
  }, [open, requestClose]);

  if (!open) return null;

  return createPortal(
    <RequestCloseContext.Provider value={requestClose}>
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
        <div className="absolute inset-0 bg-foreground/40 animate-fade-in" onClick={requestClose} aria-hidden />
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
          tabIndex={-1}
          className={cn(
            'relative z-10 flex max-h-[92vh] w-full flex-col rounded-t-xl bg-surface shadow-popover animate-fade-in sm:rounded-xl',
            SIZES[size],
          )}
        >
          <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
            <div>
              <h2 id="modal-title" className="text-lg font-semibold text-foreground">
                {title}
              </h2>
              {description && <p className="mt-0.5 text-sm text-muted">{description}</p>}
            </div>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-md p-1 text-muted hover:bg-surface-muted hover:text-foreground"
              aria-label="Close dialog"
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>

          {asking ? (
            <div className="flex flex-col gap-3 border-t border-border bg-surface-muted/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-foreground">Discard your unsaved changes?</p>
              <div className="flex shrink-0 justify-end gap-2">
                <Button variant="secondary" type="button" onClick={() => setAsking(false)}>
                  Keep editing
                </Button>
                <Button variant="danger" type="button" onClick={onClose}>
                  Discard
                </Button>
              </div>
            </div>
          ) : (
            footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-4">{footer}</div>
          )}
        </div>
      </div>
    </RequestCloseContext.Provider>,
    document.body,
  );
}
