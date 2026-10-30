import { Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { FeatureMarquee } from '../components/FeatureMarquee';

/** The heading keeps the page's content width; the cards run edge to edge beneath it. */
export function Features() {
  return (
    <Section id="features" container={false}>
      <div className="mx-auto w-full max-w-page px-4 sm:px-6 lg:px-8">
        <Reveal>
          <SectionHeading
            eyebrow="Capabilities"
            title="Everything a laboratory runs on, in one place."
            lead="Each module is built for the way labs actually work — and every module connects to the next."
          />
        </Reveal>
      </div>

      <Reveal delay={80}>
        <div className="mt-8">
          <FeatureMarquee />
        </div>
      </Reveal>
    </Section>
  );
}
