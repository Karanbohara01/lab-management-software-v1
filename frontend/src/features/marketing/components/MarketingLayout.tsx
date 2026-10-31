import type { ReactNode } from 'react';
import { useForcedLightTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/cn';
import { useScrollToHash } from '../useScrollToHash';
import { MarketingNav } from './MarketingNav';
import { MarketingFooter } from './MarketingFooter';
import { PhotoBackdrop } from './PhotoBackdrop';
import { WhatsAppButton } from './WhatsAppButton';
import './marketingType.css';

/**
 * Shell shared by every public marketing page: always-light theme, the Nunito face, skip link,
 * navbar and footer — plus scroll handling for the navbar's section links. Keep the routes that
 * use it in sync with the light-theme paths in index.html's first-paint script.
 *
 * `photoBackdrop` lays the lab photo behind the page content (between the navbar and the footer,
 * which stay plain). The root is `isolate`d so the photo's negative z-index lands above the page
 * background rather than underneath it.
 */
export function MarketingLayout({ children, photoBackdrop = false }: { children: ReactNode; photoBackdrop?: boolean }) {
  useForcedLightTheme();
  useScrollToHash();

  return (
    <div className={cn('marketing-type min-h-screen bg-background font-nunito', photoBackdrop && 'isolate')}>
      {photoBackdrop && <PhotoBackdrop />}

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <MarketingNav />

      <main id="main" className={photoBackdrop ? 'lp-photo' : undefined}>
        {children}
      </main>

      <MarketingFooter />

      <WhatsAppButton />
    </div>
  );
}
