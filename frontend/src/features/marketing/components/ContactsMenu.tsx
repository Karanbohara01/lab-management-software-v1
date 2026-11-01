import { useState } from 'react';
import { Phone } from 'lucide-react';
import { TEAM_CONTACTS, type TeamContact } from '../data';
import { WhatsAppIcon } from './WhatsAppIcon';

/** "Mr. Karan" -> "K", "Neural Software Solutions Nepal" -> "NS". */
function initials(name: string): string {
  return name
    .replace(/^(mr|ms|mrs|dr)\.?\s+/i, '')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

/** The person's photo in a ringed circle, or their initials until the photo file exists. */
export function ContactAvatar({ contact }: { contact: TeamContact }) {
  const [failed, setFailed] = useState(false);
  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-base font-bold text-primary ring-2 ring-primary/25">
      {failed ? (
        <span aria-hidden>{initials(contact.name)}</span>
      ) : (
        <img
          src={contact.avatar}
          width={96}
          height={96}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}

const NUMBER_LINK =
  'inline-flex items-center gap-2.5 whitespace-nowrap rounded-md py-1 text-[16px] font-semibold text-foreground transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/** One row per person: portrait and name, a WhatsApp number and a phone number. */
export function ContactList() {
  return (
    <ul className="space-y-3">
      {TEAM_CONTACTS.map((contact) => (
        <li
          key={contact.name}
          className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-4"
        >
          <div className="flex min-w-0 items-center gap-4">
            <ContactAvatar contact={contact} />
            <span className="text-[16px] font-medium leading-snug text-foreground/80">{contact.name}</span>
          </div>
          <a
            href={`https://wa.me/${contact.digits}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp ${contact.name}: ${contact.display}`}
            className={NUMBER_LINK}
          >
            <WhatsAppIcon className="h-6 w-6 shrink-0 text-[#25D366]" />
            {contact.display}
          </a>
          <a href={`tel:+${contact.digits}`} aria-label={`Call ${contact.name}: ${contact.display}`} className={NUMBER_LINK}>
            <Phone className="h-5 w-5 shrink-0 text-muted" aria-hidden />
            {contact.display}
          </a>
        </li>
      ))}
    </ul>
  );
}
