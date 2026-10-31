import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronDown, Menu, Phone, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { CONTACT_PHONE, CONTACT_WHATSAPP, NAV_ITEMS, PRODUCT_NAME } from '../data';
import { LinkButton } from './primitives';
import { FeaturesMenu } from './FeaturesMenu';
import { WhatsAppIcon } from './WhatsAppIcon';

const NAV_LINK =
  'whitespace-nowrap rounded-md px-3 py-2 text-[15px] font-bold leading-5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

const TOP_LINK =
  'inline-flex items-center gap-2 rounded-md px-2 py-1 text-base font-bold leading-5 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * Contact strip above the main bar (desktop only — the mobile drawer carries the same links).
 * Collapses once the page scrolls so the fixed header doesn't permanently eat vertical space;
 * `invisible` while collapsed keeps its links out of the tab order.
 */
function TopBar({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        'hidden overflow-hidden bg-surface-muted transition-[max-height] duration-200 lg:block',
        visible ? 'max-h-10' : 'invisible max-h-0',
      )}
    >
      <div className="border-t-[3px] border-primary/30">
        <div className="mx-auto flex h-9 max-w-page items-center justify-end gap-6 px-4 sm:px-6 lg:px-8">
          <a
            href={CONTACT_WHATSAPP.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Chat on WhatsApp: ${CONTACT_WHATSAPP.display}`}
            className={TOP_LINK}
          >
            <WhatsAppIcon className="h-4 w-4 text-[#25D366]" />
            {CONTACT_WHATSAPP.display}
          </a>
          <a href={CONTACT_PHONE.href} aria-label={`Call ${CONTACT_PHONE.display}`} className={TOP_LINK}>
            <Phone className="h-4 w-4" aria-hidden />
            {CONTACT_PHONE.display}
          </a>
          {/* Placeholder — what goes under "More" is still to be designed. */}
          <button type="button" className={cn(TOP_LINK, '-mr-2')}>
            More
            <ChevronDown className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>
    </div>
  );
}

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2.5" aria-label={`${PRODUCT_NAME} home`}>
      <BrandMark className="h-9" />
      <BrandWordmark className="h-6" />
    </Link>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

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
        'fixed inset-x-0 top-0 z-40 border-b border-border bg-surface transition-shadow duration-200',
        scrolled && 'shadow-sm',
      )}
    >
      <TopBar visible={!scrolled} />
      <nav className="relative mx-auto flex h-16 max-w-page items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-1 self-stretch xl:flex">
          {NAV_ITEMS.map((item) =>
            item.hasFeatureMenu ? (
              <FeaturesMenu key={item.href} item={item} linkClassName={NAV_LINK} />
            ) : (
              <li key={item.href}>
                <Link
                  to={item.href}
                  aria-current={pathname === item.href ? 'page' : undefined}
                  className={cn(NAV_LINK, pathname === item.href && 'text-foreground')}
                >
                  {item.label}
                </Link>
              </li>
            ),
          )}
        </ul>

        <div className="hidden items-center gap-2 xl:flex">
          <LinkButton to="/login" variant="secondary" size="md">
            Sign in
          </LinkButton>
          <LinkButton to="/signup" variant="primary" size="md">
            Start free trial
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
                      'block rounded-md px-3 py-3 text-lg font-bold text-foreground hover:bg-surface-muted',
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
                className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-surface-muted"
              >
                <WhatsAppIcon className="h-5 w-5 text-[#25D366]" />
                {CONTACT_WHATSAPP.display}
              </a>
              <a
                href={CONTACT_PHONE.href}
                className="flex items-center gap-3 rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-surface-muted"
              >
                <Phone className="h-5 w-5" aria-hidden />
                {CONTACT_PHONE.display}
              </a>
            </div>
            <LinkButton to="/login" variant="secondary" size="lg" className="w-full">
              Sign in
            </LinkButton>
            <LinkButton to="/signup" variant="primary" size="lg" className="w-full">
              Start free trial
            </LinkButton>
          </div>
        </div>
      </div>
    </header>
  );
}
