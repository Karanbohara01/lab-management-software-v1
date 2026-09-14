import type { ReactNode } from 'react';

/** Compact heading used above each dashboard section — title + optional context + a "view all" action. */
export function SectionHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="min-w-0">
        <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
        {description && <p className="truncate text-xs text-muted">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
