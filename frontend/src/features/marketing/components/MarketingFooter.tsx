import { Link } from 'react-router-dom';
import { Mail, MapPin, Microscope, Phone } from 'lucide-react';
import { FOOTER_COLUMNS, PRODUCT_NAME } from '../data';

export function MarketingFooter() {
  return (
    <footer id="contact" className="scroll-mt-20 border-t border-border bg-surface">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(5,1fr)]">
          <div>
            <Link to="/" className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Microscope className="h-5 w-5" aria-hidden />
              </span>
              <span className="text-lg font-semibold text-foreground">{PRODUCT_NAME}</span>
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
