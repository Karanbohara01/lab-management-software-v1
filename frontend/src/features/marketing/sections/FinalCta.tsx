import { ArrowRight } from 'lucide-react';
import { Reveal } from '../components/Reveal';
import { AnchorButton, DEMO_MAILTO, SALES_MAILTO } from '../components/primitives';
import { SCIENCE_TEXTURE } from '../components/Photo';

export function FinalCta() {
  return (
    <section className="py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <Reveal>
          <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-primary/[0.04] px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 -top-24 h-48 bg-gradient-to-b from-primary/15 to-transparent blur-2xl"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.4] [mask-image:radial-gradient(80%_80%_at_50%_0%,black,transparent_75%)]"
              style={{ backgroundImage: SCIENCE_TEXTURE }}
            />
            <div className="relative">
            <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Ready to modernize your laboratory?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-pretty text-base leading-relaxed text-muted">
              Connect patients, samples, results, reports, billing, payments and daily laboratory
              operations in one platform.
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <AnchorButton href={DEMO_MAILTO} size="lg">
                Request a Demo
                <ArrowRight className="h-4 w-4" aria-hidden />
              </AnchorButton>
              <AnchorButton href={SALES_MAILTO} variant="secondary" size="lg">
                Talk to Sales
              </AnchorButton>
            </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
