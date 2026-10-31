import { Link } from 'react-router-dom';
import { formatPostDate, readingMinutes, type Post } from './posts';

/** One post as a card: illustration, category, title, excerpt, date and reading time. The whole card is the link. */
export function PostCard({ post }: { post: Post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-surface transition-shadow hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <div className="flex h-40 items-center justify-center bg-primary/5">
        <img
          src={post.image}
          width={160}
          height={160}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-24 w-24 select-none object-contain transition-transform duration-200 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <span className="text-xs font-semibold uppercase tracking-wider text-primary">{post.category}</span>
        <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
        <p className="mt-4 text-xs text-muted">
          {formatPostDate(post.date)} · {readingMinutes(post)} min read
        </p>
      </div>
    </Link>
  );
}

/** A compact one-line version of a card, for narrow side columns. */
export function PostRow({ post }: { post: Post }) {
  return (
    <Link
      to={`/blog/${post.slug}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-3 transition-shadow hover:shadow-popover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
    >
      <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-primary/5">
        <img
          src={post.image}
          width={160}
          height={160}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          className="h-11 w-11 select-none object-contain"
        />
      </span>
      <span className="min-w-0">
        <span className="block text-xs font-semibold uppercase tracking-wider text-primary">{post.category}</span>
        <span className="mt-0.5 block text-sm font-semibold leading-snug text-foreground transition-colors group-hover:text-primary">
          {post.title}
        </span>
        <span className="mt-1 block text-xs text-muted">
          {formatPostDate(post.date)} · {readingMinutes(post)} min read
        </span>
      </span>
    </Link>
  );
}

export function PostGrid({ posts }: { posts: Post[] }) {
  return (
    <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <li key={post.slug}>
          <PostCard post={post} />
        </li>
      ))}
    </ul>
  );
}
