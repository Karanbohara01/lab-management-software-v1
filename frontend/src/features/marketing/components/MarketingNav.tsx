import { useEffect, useRef, useState, type RefObject } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, ChevronRight, Menu, Phone, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { CONTACT_PHONE, CONTACT_WHATSAPP, NAV_ITEMS, PRODUCT_NAME } from '../data';
import { LinkButton } from './primitives';
import { FeaturesMenu } from './FeaturesMenu';
import { ContactList } from './ContactsMenu';
import { WhatsAppIcon } from './WhatsAppIcon';

const CONTACTS_PANEL_ID = 'team-contacts';

// Nav links share the buttons' type (`text-button`: 15px / 500) so the bar reads as one voice;
// they sit in the muted ink and step up to the foreground on hover / when current.
const NAV_LINK =
  'whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const TOP_LINK =
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-muted-foreground transition-all duration-150 hover:text-foreground hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Contact strip above the main bar (desktop only — the mobile drawer carries the same links).
 * Collapses once the page scrolls so the fixed header doesn't permanently eat vertical space;
 * `invisible` while collapsed keeps its links out of the tab order.
 */
function TopBar({
  visible,
  contactsOpen,
  onToggleContacts,
  moreRef,
}: {
  visible: boolean;
  contactsOpen: boolean;
  onToggleContacts: () => void;
  moreRef: RefObject<HTMLButtonElement>;
}) {
  return (
    <div
      className={cn(
        'hidden overflow-hidden border-b border-border/40 bg-surface-muted/60 transition-[max-height] duration-200 lg:block',
        visible ? 'max-h-10' : 'invisible max-h-0',
      )}
    >
      <div className="mx-auto flex h-9 max-w-page items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground/85">Diagnostic Laboratory Management System</span>
          <span className="hidden text-border/80 xl:inline" aria-hidden>
            ·
          </span>
          <span className="hidden text-muted-foreground/75 xl:inline">
            Complete diagnostic workflow, instrument interfacing &amp; IRD compliance
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href={CONTACT_WHATSAPP.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat on WhatsApp: ${CONTACT_WHATSAPP.display}`}
            className={cn(TOP_LINK, 'hover:text-[#25D366]')}
          >
            <WhatsAppIcon className="h-3.5 w-3.5 text-[#25D366]" />
            <span>{CONTACT_WHATSAPP.display}</span>
          </a>
          <span className="h-3 w-px bg-border/80" aria-hidden />
          <a href={CONTACT_PHONE.href} aria-label={`Call ${CONTACT_PHONE.display}`} className={TOP_LINK}>
            <Phone className="h-3.5 w-3.5 text-primary" aria-hidden />
            <span>{CONTACT_PHONE.display}</span>
          </a>
          <span className="h-3 w-px bg-border/80" aria-hidden />
          {/* The panel it opens is rendered by MarketingNav — this strip clips anything that overflows it. */}
          <button
            ref={moreRef}
            type="button"
            aria-expanded={contactsOpen}
            aria-controls={CONTACTS_PANEL_ID}
            onClick={onToggleContacts}
            className={cn(TOP_LINK, contactsOpen && 'bg-surface text-foreground font-semibold shadow-xs')}
          >
            More
            <ChevronDown
              className={cn('h-3.5 w-3.5 transition-transform duration-150 motion-reduce:transition-none', contactsOpen && 'rotate-180')}
              aria-hidden
            />
          </button>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link
      to="/"
      className="group flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label={`${PRODUCT_NAME} home`}
    >
      <div className="transition-transform duration-200 group-hover:scale-105">
        <BrandMark className="h-9" />
      </div>
      <BrandWordmark className="h-6" />
    </Link>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [contactsOpen, setContactsOpen] = useState(false);
  const moreRef = useRef<HTMLButtonElement>(null);
  const contactsRef = useRef<HTMLDivElement>(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // The contacts panel hangs off the top strip, so it goes when the strip collapses or the page changes.
  useEffect(() => {
    if (scrolled) setContactsOpen(false);
  }, [scrolled]);
  useEffect(() => setContactsOpen(false), [pathname]);

  useEffect(() => {
    if (!contactsOpen) return;
    const outside = (target: EventTarget | null) =>
      !contactsRef.current?.contains(target as Node) && !moreRef.current?.contains(target as Node);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      setContactsOpen(false);
      moreRef.current?.focus();
    };
    const onPointer = (e: PointerEvent) => outside(e.target) && setContactsOpen(false);
    const onFocus = (e: FocusEvent) => outside(e.target) && setContactsOpen(false);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    document.addEventListener('focusin', onFocus);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('pointerdown', onPointer);
      document.removeEventListener('focusin', onFocus);
    };
  }, [contactsOpen]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) {
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
      document.addEventListener('keydown', onKey);
      return () => document.removeEventListener('keydown', onKey);
    }
  }, [open]);

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-40 border-b transition-all duration-200',
        scrolled
          ? 'border-border/80 bg-surface/90 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(0,0,0,0.07)]'
          : 'border-border/40 bg-surface/95 backdrop-blur-xs',
      )}
    >
      <TopBar
        visible={!scrolled}
        contactsOpen={contactsOpen}
        onToggleContacts={() => setContactsOpen((o) => !o)}
        moreRef={moreRef}
      />

      {/* Who to contact. Lives here, not in the strip, because the strip clips its overflow. */}
      <div className="pointer-events-none absolute inset-x-0 top-11 z-20 hidden lg:block">
        <div className="mx-auto flex max-w-page justify-end px-4 sm:px-6 lg:px-8">
          <div
            ref={contactsRef}
            id={CONTACTS_PANEL_ID}
            role="region"
            aria-label="Contact the team"
            className={cn(
              'w-[36rem] max-w-full rounded-2xl border border-border/80 bg-surface p-4 shadow-xl',
              'transition-[opacity,transform,visibility] duration-150 motion-reduce:transition-none',
              contactsOpen ? 'pointer-events-auto visible translate-y-0 opacity-100' : 'invisible -translate-y-1 opacity-0',
            )}
          >
            <ContactList />
          </div>
        </div>
      </div>

      <nav className="relative mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-1 self-stretch xl:flex">
          {NAV_ITEMS.map((item) =>
            item.hasFeatureMenu ? (
              <FeaturesMenu key={item.href} item={item} linkClassName={NAV_LINK} />
            ) : (
              <li key={item.href} className="flex items-center">
                <Link
                  to={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(
                    NAV_LINK,
                    pathname === item.href && 'bg-primary/10 text-primary font-semibold',
                  )}
                >
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        <div className="hidden items-center gap-2.5 xl:flex">
          <LinkButton to="/login" variant="secondary" size="md" className="rounded-full px-4 text-sm font-medium">
            Sign in
          </LinkButton>
          <LinkButton
            to="/signup"
            variant="primary"
            size="md"
            className="group rounded-full px-5 text-sm font-semibold shadow-sm hover:shadow-md hover:shadow-primary/20"
          >
            <span>Start free trial</span>
            <ChevronRight className="h-4 w-4 transition-transform duration-150 group-hover:translate-x-0.5" aria-hidden />
          </LinkButton>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-foreground hover:bg-surface-muted xl:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-50 xl:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
        <div
          className={cn('absolute inset-0 bg-foreground/40 transition-opacity', open ? 'opacity-100' : 'opacity-0')}
          onClick={() => setOpen(false)}
          aria-hidden
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className={cn(
            'absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-surface shadow-popover transition-transform duration-200',
            open ? 'translate-x-0' : 'translate-x-full',
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-border px-4">
            <Logo />
            <button
              type="button"
              className="rounded-md p-2 text-foreground hover:bg-surface-muted"
              aria-label="Close menu"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" aria-hidden />
            </button>
          </div>
          <nav className="flex-1 overflow-y-auto p-4" aria-label="Mobile">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    to={item.href}
                    onClick={() => setOpen(false)}
                    aria-current={pathname === item.href ? 'page' : undefined}
                    className={cn(
                      'block rounded-md px-3 py-3 text-body-lg font-medium text-foreground hover:bg-surface-muted',
                      pathname === item.href && 'bg-surface-muted',
                    )}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t border-border p-4">
            <div className="pb-2">
              <a
                href={CONTACT_WHATSAPP.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-md px-3 py-3 text-body font-medium text-foreground hover:bg-surface-muted"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                {CONTACT_WHATSAPP.display}
              </a>
              <a
                href={CONTACT_PHONE.href}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-body font-medium text-foreground hover:bg-surface-muted"
              >
                <Phone className="h-5 w-5" aria-hidden />
                {CONTACT_PHONE.display}
              </a>
            </div>
            <LinkButton to="/login" variant="secondary" size="lg" className="w-full rounded-full font-medium">
              Sign in
            </LinkButton>
            <LinkButton to="/signup" variant="primary" size="lg" className="w-full rounded-full font-semibold shadow-sm">
              Start free trial
            </LinkButton>
          </div>
        </div>
      </div>
    </header>
  );
}
