import { CONTACT_WHATSAPP } from '../data';
import { WhatsAppIcon } from './WhatsAppIcon';

/**
 * Floating "chat on WhatsApp" button, fixed to the bottom-right of every marketing page. Opens the
 * chat directly (wa.me) in a new tab. It sits below the navbar and the mobile drawer (z-30 vs
 * z-40/z-50) so it never covers either; the footer pads its last row to stay clear of it.
 */
export function WhatsAppButton() {
  return (
    <a
      href={CONTACT_WHATSAPP.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Chat with us on WhatsApp: ${CONTACT_WHATSAPP.display}`}
      className="fixed bottom-5 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full border border-border bg-surface text-[#25D366] shadow-lg transition-transform duration-150 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 motion-reduce:transition-none motion-reduce:hover:scale-100 sm:bottom-6 sm:right-6"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
