import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { handleChain, resolvePattern } from '@/routes/appRoutes';
import { useLeafHandle } from '@/lib/navigation';
import { useCurrentPageTitle } from './PageTitleContext';
import { useT } from '@/i18n';

/**
 * Where the current page sits in the admin area, from the route metadata in appRoutes.ts:
 * Patients › Sita Rai, Control center › Users. Only rendered for pages that have a parent —
 * a top-level list already has the sidebar saying where it is. On phones the trail collapses to
 * the immediate parent with a chevron, which is what you'd tap anyway.
 */
export function Breadcrumbs() {
  const t = useT();
  const leaf = useLeafHandle();
  const title = useCurrentPageTitle();
  if (!leaf?.handle.parent) return null;

  const chain = handleChain(leaf.handle.pattern);
  const ancestors = chain
    .slice(1)
    .reverse()
    .map((h) => ({ href: resolvePattern(h.pattern, leaf.params), label: t(h.title) }));
  const current = title ?? t(leaf.handle.title);
  const parent = ancestors[ancestors.length - 1]!;

  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
      <ol className="hidden items-center gap-1.5 sm:flex">
        {ancestors.map((crumb) => (
          <Fragment key={crumb.href}>
            <li>
              <Link to={crumb.href} className="rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {crumb.label}
              </Link>
            </li>
            <li aria-hidden>
              <ChevronRight className="h-3.5 w-3.5 text-muted/70" />
            </li>
          </Fragment>
        ))}
        <li aria-current="page" className="truncate font-medium text-foreground">
          {current}
        </li>
      </ol>
      <Link
        to={parent.href}
        className="inline-flex items-center gap-1 rounded-sm hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:hidden"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden />
        {parent.label}
      </Link>
    </nav>
  );
}
