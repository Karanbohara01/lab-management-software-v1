import { Section } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { AnimatedWorkflow } from '../workflow/AnimatedWorkflow';

/** The heading and subtitle live inside the widget — it's one self-contained design. */
export function Workflow() {
  return (
    <Section id="how-it-works" className="bg-surface">
      <Reveal>
        <AnimatedWorkflow />
      </Reveal>
    </Section>
  );
}
