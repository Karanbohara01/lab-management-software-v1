import { MarketingNav } from './components/MarketingNav';
import { MarketingFooter } from './components/MarketingFooter';
import { useSeo } from './useSeo';
import { Hero } from './sections/Hero';
import { TrustBar } from './sections/TrustBar';
import { Problem } from './sections/Problem';
import { Workflow } from './sections/Workflow';
import { Features } from './sections/Features';
import {
  PatientsShowcase,
  SamplesShowcase,
  ResultsShowcase,
  ReportShowcase,
} from './sections/ProductShowcases';
import {
  BillingShowcase,
  EbillingShowcase,
  DashboardShowcase,
  AnalyticsSection,
  InventoryShowcase,
  AuditSection,
} from './sections/BusinessShowcases';
import { Roles } from './sections/Roles';
import { MobileShowcase, HowItWorks } from './sections/MobileAndSteps';
import { Pricing } from './sections/Pricing';
import { Faq } from './sections/Faq';
import { FinalCta } from './sections/FinalCta';

export function LandingPage() {
  useSeo();

  return (
    <div className="min-h-screen bg-background">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
      >
        Skip to content
      </a>

      <MarketingNav />

      <main id="main">
        <Hero />
        <TrustBar />
        <Problem />
        <Workflow />
        <Features />

        <PatientsShowcase />
        <SamplesShowcase />
        <ResultsShowcase />
        <ReportShowcase />
        <BillingShowcase />
        <EbillingShowcase />
        <Roles />
        <DashboardShowcase />
        <AnalyticsSection />
        <InventoryShowcase />
        <AuditSection />
        <MobileShowcase />
        <HowItWorks />
        <Pricing />
        <Faq />
        <FinalCta />
      </main>

      <MarketingFooter />
    </div>
  );
}
