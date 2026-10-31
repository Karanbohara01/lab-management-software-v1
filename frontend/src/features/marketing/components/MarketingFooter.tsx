import { Link } from 'react-router-dom';
import { Mail, MapPin, Phone } from 'lucide-react';
import { BrandMark } from '@/components/brand/BrandMark';
import { BrandWordmark } from '@/components/brand/BrandWordmark';
import { FOOTER_COLUMNS, PRODUCT_NAME } from '../data';

export function MarketingFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 border-t border-border bg-surface">
      {/* pb-24 (not py-16): keeps the last row clear of the floating WhatsApp button */}
      <div className="mx-auto max-w-page px-4 pb-24 pt-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div>
            <Link to="/" className="flex items-center gap-2.5" aria-label={`${PRODUCT_NAME} home`}>
              <BrandMark className="h-9" />
              <BrandWordmark className="h-6" />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              The connected platform for pathology labs, diagnostic centers and hospital laboratories.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" aria-hidden /> hello@labos.example</li>
              <li className="flex items-center gap-2"><Phone className="h-4 w-4" aria-hidden /> +977 1 4000000</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" aria-hidden /> Kathmandu, Nepal</li>
            </ul>
          </div>

          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-sm font-semibold text-foreground">{col.heading}</h3>
              <ul className="mt-3 space-y-2">
                {col.links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-sm text-muted transition-colors hover:text-foreground">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-border pt-6 text-xs text-muted sm:flex-row">
          <p>© {new Date().getFullYear()} {PRODUCT_NAME}. All rights reserved.</p>
          <p className="flex gap-4">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Data Protection</a>
          </p>
        </div>
      </div>
    </footer>
  );
}
