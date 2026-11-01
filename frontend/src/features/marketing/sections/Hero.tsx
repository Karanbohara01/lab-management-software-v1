import { Reveal } from '../components/Reveal';
import { AnchorButton, Eyebrow } from '../components/primitives';
import { RequestDemoButton } from '../components/RequestDemo';
import { SCIENCE_TEXTURE } from '../components/Photo';
import { HeroCollage } from '../components/HeroCollage';

export function Hero() {
  return (
    <section className="relative overflow-hidden pb-10 pt-28 sm:pb-12 sm:pt-32">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-40 h-[500px] bg-gradient-to-b from-primary/10 via-primary/5 to-transparent blur-2xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.35] [mask-image:radial-gradient(60%_50%_at_70%_25%,black,transparent)]"
        style={{ backgroundImage: SCIENCE_TEXTURE }}
      />
      <div className="mx-auto grid max-w-page items-center gap-12 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
        <Reveal className="min-w-0">
          <Eyebrow>Laboratory information management</Eyebrow>
          <h1 className="mt-5 max-w-[18ch] text-balance text-display-1 font-bold text-foreground">
            The operating system for modern laboratories.
          </h1>
          <p className="mt-5 max-w-xl text-pretty text-lead text-muted">
            Manage patients, laboratory orders, samples, results, reports, billing, payments and
            e-Billing workflows from one connected platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <RequestDemoButton />
            <AnchorButton href="#product" variant="secondary" size="lg">
              Explore Platform
            </AnchorButton>
          </div>
          <p className="mt-6 text-caption text-muted">
            Built for pathology labs, diagnostic centers and hospital laboratories.
          </p>
        </Reveal>

        <Reveal delay={120} className="min-w-0 lg:pl-4">
          <HeroCollage />
        </Reveal>
      </div>
    </section>
  );
}
