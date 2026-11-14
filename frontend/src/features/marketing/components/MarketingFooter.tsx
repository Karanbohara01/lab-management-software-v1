import { Link } from 'react-router-dom';
import { FcComments, FcGlobe, FcPhone } from 'react-icons/fc';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { cn } from '@/lib/cn';
import { TYPE } from './typography';
import { FOOTER_COLUMNS, PRODUCT_NAME } from '../data';

export function MarketingFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 bg-surface-muted">
      {/* Echoes the logo's own navy-to-teal, so the footer reads as a deliberate close to the
          page rather than a plain gray band. */}
      <div className="h-[3px] bg-gradient-to-r from-primary to-success" aria-hidden />

      {/* pb-24 (not py-16): keeps the last row clear of the floating WhatsApp button */}
      <div className="mx-auto max-w-page px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label={`${PRODUCT_NAME} home`}>
              <BrandMark className="h-9" />
              <BrandWordmark className="h-6" />
            </Link>
            <p className="mt-4 max-w-xs text-pretty text-body-sm text-muted">
              The connected platform for pathology labs, diagnostic centers and hospital laboratories.
            </p>
            <ul className="mt-4 space-y-2 text-body-sm text-muted">
              <li className="flex items-center gap-2"><FcComments className="h-4 w-4" aria-hidden /> hello@labos.example</li>
              <li className="flex items-center gap-2"><FcPhone className="h-4 w-4" aria-hidden /> +977 1 4000000</li>
              <li className="flex items-center gap-2"><FcGlobe className="h-4 w-4" aria-hidden /> Kathmandu, Nepal</li>
            </ul>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className={cn(TYPE.label, 'text-primary')}>{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-body-sm text-muted transition-colors hover:text-primary">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-caption text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.</p>
          {/* Privacy/Terms/Data Protection already live in the Legal column above — repeating them
              here said nothing new. A short brand line earns the slot instead. */}
          <p className="font-medium text-primary">Built for Nepali laboratories</p>
        </div>
      </div>
    </footer>
  );
}
