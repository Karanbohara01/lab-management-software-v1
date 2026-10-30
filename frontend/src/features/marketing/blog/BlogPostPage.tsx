import { ArrowLeft } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { MarketingLayout } from '../components/MarketingLayout';
import { PRODUCT_NAME } from '../data';
import { FinalCta } from '../sections/FinalCta';
import { useSeo } from '../useSeo';
import { ArticleBody } from './ArticleBody';
import { PostRow } from './PostCard';
import { formatPostDate, getPost, latestPosts, readingMinutes } from './posts';

const BACK_LINK =
  'inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring';

/**
 * /blog/:slug — one article. It uses the same wide container as the navbar and footer (so its edges
 * line up with them, instead of floating in a narrow column with huge side margins). The text keeps
 * a comfortable reading width, and the other articles sit in a side column that follows you down
 * the page — beneath the article on a phone.
 */
export function BlogPostPage() {
  const { slug } = useParams();
  const post = getPost(slug);

  useSeo(
    post
      ? { title: `${post.title} | ${PRODUCT_NAME}`, description: post.excerpt, path: `/blog/${post.slug}` }
      : { title: `Article not found | ${PRODUCT_NAME}`, path: `/blog/${slug ?? ''}` },
  );

  if (!post) {
    return (
      <MarketingLayout>
        <div className="mx-auto w-full max-w-3xl px-4 pb-24 pt-32 sm:px-6 lg:pt-40">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground">We couldn’t find that article.</h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            It may have been moved or renamed. The full list is on the blog page.
          </p>
          <Link to="/blog" className={`${BACK_LINK} mt-6`}>
            <ArrowLeft className="h-4 w-4" aria-hidden />
            All articles
          </Link>
        </div>
      </MarketingLayout>
    );
  }

  const more = latestPosts()
    .filter((p) => p.slug !== post.slug)
    .slice(0, 3);

  return (
    <MarketingLayout>
      <div className="mx-auto w-full max-w-page px-4 pb-16 pt-32 sm:px-6 lg:px-8 lg:pt-40">
        <Link to="/blog" className={BACK_LINK}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          All articles
        </Link>

        <header>
          <p className="mt-8 text-xs font-semibold uppercase tracking-wider text-primary">{post.category}</p>
          <h1 className="mt-3 max-w-4xl text-balance text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          <p className="mt-4 text-sm text-muted">
            {formatPostDate(post.date)} · {readingMinutes(post)} min read
          </p>
        </header>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem] xl:gap-16">
          <article className="min-w-0 max-w-[56rem]">
            <div className="flex h-48 items-center justify-center rounded-2xl bg-primary/5 sm:h-56">
              <img
                src={post.image}
                width={160}
                height={160}
                alt=""
                draggable={false}
                className="h-32 w-32 select-none object-contain sm:h-36 sm:w-36"
              />
            </div>

            <div className="mt-10">
              <ArticleBody blocks={post.body} />
            </div>
          </article>

          {more.length > 0 && (
            <aside aria-labelledby="more-articles" className="lg:sticky lg:top-28 lg:self-start">
              <h2 id="more-articles" className="text-xl font-semibold tracking-tight text-foreground">
                More articles
              </h2>
              <ul className="mt-4 space-y-3">
                {more.map((p) => (
                  <li key={p.slug}>
                    <PostRow post={p} />
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </div>

      <FinalCta />
    </MarketingLayout>
  );
}
