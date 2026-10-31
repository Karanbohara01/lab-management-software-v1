import { useCallback, useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { ArrowRight, ClipboardList, X } from 'lucide-react';
import { DEMO_WHATSAPP_HREF } from '../data';
import { buttonClasses } from './buttonStyles';
import { WhatsAppIcon } from './WhatsAppIcon';

const OPTION =
  'group flex items-center gap-4 rounded-2xl border border-border bg-surface p-4 text-left transition hover:border-primary/40 hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Lets the visitor choose how to take the next step: message the team on WhatsApp (the chat opens
 * with the request already written) or fill in the free-trial form. Esc, the backdrop and the
 * close button dismiss it; focus stays inside while open and returns to the trigger afterwards.
 */
function DemoDialog({ onClose }: { onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusable = () =>
      Array.from(dialog?.querySelectorAll<HTMLElement>('a[href], button:not([disabled])') ?? []);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;
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
    };

    document.addEventListener('keydown', onKey);
    const trigger = document.activeElement as HTMLElement | null;
    (dialog?.querySelector<HTMLElement>('[data-autofocus]') ?? dialog)?.focus();
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      trigger?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 font-nunito sm:items-center">
      <div className="absolute inset-0 animate-fade-in bg-foreground/40" onClick={onClose} aria-hidden />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative z-10 w-full max-w-lg animate-fade-in rounded-3xl bg-surface p-6 shadow-popover focus:outline-none sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-2 text-muted transition-colors hover:bg-surface-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <X className="h-5 w-5" aria-hidden />
        </button>

        <h2 id={titleId} className="pr-10 text-2xl font-bold tracking-tight text-foreground">
          How would you like to get started?
        </h2>
        <p className="mt-2 text-[15px] text-muted">Choose whichever suits you — either one gets you to our team.</p>

        <div className="mt-6 grid gap-3">
          <a
            href={DEMO_WHATSAPP_HREF}
            target="_blank"
            rel="noopener noreferrer"
            data-autofocus
            // Close after the browser has followed the link, not while it is being followed.
            onClick={() => window.setTimeout(onClose, 0)}
            className={OPTION}
          >
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#25D366]/10">
              <WhatsAppIcon className="h-6 w-6 text-[#25D366]" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-bold text-foreground">Message us on WhatsApp</span>
              <span className="mt-0.5 block text-[15px] leading-snug text-muted">
                Opens a chat with our team, with your request already written.
              </span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </a>

          <Link to="/signup" className={OPTION}>
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" aria-hidden />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[17px] font-bold text-foreground">Start your free trial</span>
              <span className="mt-0.5 block text-[15px] leading-snug text-muted">
                Fill in a short form and set up your laboratory.
              </span>
            </span>
            <ArrowRight
              className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
              aria-hidden
            />
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/** "Request a Demo" — opens the choice between WhatsApp and the free-trial form. */
export function RequestDemoButton({ size = 'lg', className }: { size?: 'md' | 'lg'; className?: string }) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []); // stable, so the dialog's effect doesn't re-run

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className={buttonClasses({ size, className })}
      >
        Request a Demo
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
      {open && <DemoDialog onClose={close} />}
    </>
  );
}
