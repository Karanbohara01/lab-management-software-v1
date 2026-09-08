import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, Microscope, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { NAV_ITEMS, PRODUCT_NAME } from '../data';
import { AnchorButton, DEMO_MAILTO, LinkButton } from './primitives';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2" aria-label={`${PRODUCT_NAME} home`}>
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Microscope className="h-5 w-5" aria-hidden />
      </span>
      <span className="text-lg font-semibold tracking-tight text-foreground">{PRODUCT_NAME}</span>
    </Link>
  );
}

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

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
        'fixed inset-x-0 top-0 z-40 transition-colors duration-200',
        scrolled ? 'border-b border-border bg-surface/85 backdrop-blur' : 'bg-transparent',
      )}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8" aria-label="Main">
        <Logo />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_ITEMS.map((item) => (
            <li key={item.href}>
              <a
                href={item.href}
                className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {item.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 lg:flex">
          <LinkButton to="/login" variant="ghost" size="md">
            Sign in
          </LinkButton>
          <AnchorButton href={DEMO_MAILTO} variant="primary" size="md">
            Request Demo
          </AnchorButton>
        </div>

        <button
          type="button"
          className="rounded-md p-2 text-foreground hover:bg-surface-muted lg:hidden"
          aria-label="Open menu"
          aria-expanded={open}
          onClick={() => setOpen(true)}
        >
          <Menu className="h-6 w-6" aria-hidden />
        </button>
      </nav>

      {/* Mobile drawer */}
      <div className={cn('fixed inset-0 z-50 lg:hidden', open ? 'pointer-events-auto' : 'pointer-events-none')}>
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
                  <a
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-surface-muted"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
          <div className="space-y-2 border-t border-border p-4">
            <LinkButton to="/login" variant="secondary" size="lg" className="w-full">
              Sign in
            </LinkButton>
            <AnchorButton href={DEMO_MAILTO} variant="primary" size="lg" className="w-full">
              Request Demo
            </AnchorButton>
          </div>
        </div>
      </div>
    </header>
  );
}
