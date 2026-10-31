import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Section, SectionHeading } from '../components/primitives';
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
          <Link
            to="/blog"
            className="inline-flex items-center gap-2 rounded-lg border border-input bg-surface px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            View all articles
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </div>
      </Reveal>
    </Section>
  );
}
