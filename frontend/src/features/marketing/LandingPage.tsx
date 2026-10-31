import { MarketingLayout } from './components/MarketingLayout';
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
import { About } from './sections/About';
import { Blogs } from './sections/Blogs';
import { Faq } from './sections/Faq';
import { FinalCta } from './sections/FinalCta';

export function LandingPage() {
  useSeo();

  return (
    <MarketingLayout photoBackdrop>
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
      <About />
      <Blogs />
      <Faq />
      <FinalCta />
    </MarketingLayout>
  );
}
