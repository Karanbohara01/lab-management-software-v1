import type { ReactNode } from 'react';
import { BackLink } from './BackLink';
import { useT } from '@/i18n';
import { usePageTitle } from './layout/PageTitleContext';
import type { BackTarget } from '@/lib/navigation';

/**
 * Every page's title row. It also publishes the title to the shell, which uses it for the last
 * breadcrumb, the browser tab, and the "Back to …" label of links leaving this page — so pages
 * get all of that for free. Pass `back` (usually from useBackTarget) on anything reached from
 * another page; the link then sits above the title in the same place on every screen.
 */
export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  back?: BackTarget | null;
}) {
  const t = useT();
  usePageTitle(title);
  return (
    <div className="mb-6">
      {back && (
        <BackLink to={back.href} className="mb-2">
          {t('Back to {label}', { label: back.label })}
        </BackLink>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted">{description}</p>}
        </div>
        {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
      </div>
    </div>
  );
}
