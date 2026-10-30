import { MarketingLayout } from '../components/MarketingLayout';
import { PRODUCT_NAME } from '../data';
import { useSeo } from '../useSeo';
import { PostGrid } from './PostCard';
import { latestPosts } from './posts';

/** /blog — every article, newest first. */
export function BlogIndexPage() {
  useSeo({
    title: `Blog | ${PRODUCT_NAME}`,
    description: 'Guides and updates for laboratory teams — workflow, sample tracking, results, billing and e-Billing.',
    path: '/blog',
  });

  return (
    <MarketingLayout>
      {/* the navbar is fixed, so the page clears it before its own spacing starts */}
      <div className="mx-auto w-full max-w-page px-4 pb-20 pt-32 sm:px-6 lg:px-8 lg:pt-40">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Blog</p>
        <h1 className="mt-3 max-w-2xl text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Guides and updates for laboratory teams.
        </h1>
        <p className="mt-4 max-w-2xl text-pretty text-base leading-relaxed text-muted sm:text-lg">
          Practical writing on running a modern laboratory — workflow, sample tracking, results, billing and e-Billing.
        </p>
        <div className="mt-12">
          <PostGrid posts={latestPosts()} />
        </div>
      </div>
    </MarketingLayout>
  );
}
