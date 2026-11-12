import { ArrowRight } from 'lucide-react';
import { LinkButton, Section, SectionHeading } from '../components/primitives';
import { Reveal } from '../components/Reveal';
import { PostGrid } from '../blog/PostCard';
import { latestPosts } from '../blog/posts';

/** The three newest posts, with a way into the full list. */
export function Blogs() {
  return (
    <Section id="blogs" className="bg-surface">
      <Reveal>
        <SectionHeading
          eyebrow="Blog"
          title="Guides and updates for laboratory teams."
          lead="Practical writing on running a modern laboratory — workflow, sample tracking, results, billing and e-Billing."
        />
      </Reveal>

      <Reveal delay={60}>
        <div className="mt-10">
          <PostGrid posts={latestPosts(3)} />
        </div>
        <div className="mt-8 flex justify-center">
          <LinkButton to="/blog" variant="secondary" size="lg">
            View all articles
            <ArrowRight className="h-4 w-4" aria-hidden />
          </LinkButton>
        </div>
      </Reveal>
    </Section>
  );
}
