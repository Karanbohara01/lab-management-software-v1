import { useState } from 'react';
import { Phone } from 'lucide-react';
import { TEAM_CONTACTS, type TeamContact } from '../data';
import { useLeadership, type Leader } from '../leadership';
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

/** The leadership profile this contact's uploaded photo comes from, found by first name. */
function leaderFor(contact: TeamContact, leaders: Leader[]): Leader | undefined {
  if (!contact.leader) return undefined;
  const wanted = contact.leader.toLowerCase();
  return leaders.find((l) => l.name.trim().split(/\s+/)[0]?.toLowerCase() === wanted);
}

/**
 * The person's photo in a ringed circle: the photo uploaded on the Leadership page if there is one,
 * else the file named in `contact.avatar`, else their initials. `waiting` shows the initials while
 * the uploaded photo is still being fetched, so the circle doesn't try a file that isn't there and
 * then switch.
 */
export function ContactAvatar({
  contact,
  photo,
  waiting = false,
}: {
  contact: TeamContact;
  photo?: string | null;
  waiting?: boolean;
}) {
  const src = photo ?? contact.avatar;
  const [failedSrc, setFailedSrc] = useState<string | null>(null); // a new photo arriving gets its own chance to load
  return (
    <span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-primary/10 text-sm font-semibold text-primary ring-1 ring-border/80">
      {waiting || failedSrc === src ? (
        <span aria-hidden>{initials(contact.name)}</span>
      ) : (
        <img
          src={src}
          width={96}
          height={96}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-cover"
        />
      )}
    </span>
  );
}

/** One row per person: portrait and name, direct line, WhatsApp and phone call actions. */
export function ContactList() {
  const { status, leaders } = useLeadership();
  return (
    <div>
      <div className="mb-3 flex items-center justify-between border-b border-border/50 pb-2.5">
        <div>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Direct Support &amp; Inquiries
          </h3>
          <p className="text-xs text-foreground/80">Contact our Kathmandu team directly</p>
        </div>
        <span className="text-[11px] text-muted-foreground">Kathmandu, Nepal</span>
      </div>

      <ul className="space-y-2">
        {TEAM_CONTACTS.map((contact) => (
          <li
            key={contact.name}
            className="flex items-center justify-between gap-3 rounded-xl border border-border/40 bg-surface-muted/20 p-2.5 transition-colors hover:border-border/70 hover:bg-surface-muted/50"
          >
            <div className="flex min-w-0 items-center gap-3">
              <ContactAvatar
                contact={contact}
                photo={leaderFor(contact, leaders)?.photoDataUri}
                waiting={status === 'loading' && !!contact.leader}
              />
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-foreground leading-snug">
                  {contact.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="font-mono">{contact.display}</span>
                  {contact.leader ? (
                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                      Direct
                    </span>
                  ) : (
                    <span className="rounded bg-surface-variant px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                      Company
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <a
                href={`https://wa.me/${contact.digits}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`WhatsApp ${contact.name}: ${contact.display}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#25D366]/30 bg-[#25D366]/10 px-3 py-1.5 text-xs font-semibold text-[#128C7E] dark:text-[#25D366] transition-colors hover:bg-[#25D366]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <WhatsAppIcon className="h-4 w-4 shrink-0 text-[#25D366]" />
                <span>WhatsApp</span>
              </a>
              <a
                href={`tel:+${contact.digits}`}
                aria-label={`Call ${contact.name}: ${contact.display}`}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border/80 bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-surface-muted hover:text-primary hover:border-primary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                <span>Call</span>
              </a>
            </div>
          </li>
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between border-t border-border/40 pt-2 text-[11px] text-muted-foreground">
        <span>Office: 9:00 AM – 6:00 PM NPT</span>
        <span>WhatsApp available 24/7</span>
      </div>
    </div>
  );
}
