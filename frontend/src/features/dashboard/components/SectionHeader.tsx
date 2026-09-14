import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

/** Compact heading used above each dashboard section — title + optional context + a "view all" action. */
export function SectionHeader({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <div className="flex min-w-0 items-center gap-2">
        {Icon && (
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-3.5 w-3.5 text-primary" aria-hidden />
          </span>
        )}
        <div className="min-w-0">
          <h2 className="truncate text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="truncate text-xs text-muted">{description}</p>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
