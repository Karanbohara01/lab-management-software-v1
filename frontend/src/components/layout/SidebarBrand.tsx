import { Microscope } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useBranding } from '@/hooks/useBranding';

/** "Nami Healthcare Center" -> "NH". */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word.charAt(0).toUpperCase())
    .join('');
}

const TILE =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm';

/**
 * The block at the top of the sidebar: the signed-in clinic's logo and name. A clinic without an
 * uploaded logo gets its initials; while the name is loading there is a quiet placeholder (not a
 * flash of the wrong name), and if it can't be loaded at all the app's own LIMS mark is shown.
 */
export function SidebarBrand({ collapsed }: { collapsed: boolean }) {
  const { status, branding } = useBranding();
  const name = branding?.name.trim() ?? '';

  if (status === 'loading') {
    return (
      <div className="flex min-w-0 items-center gap-2.5" aria-hidden>
        <span className="h-9 w-9 shrink-0 animate-pulse rounded-md bg-surface-muted" />
        {!collapsed && (
          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="h-3 w-28 animate-pulse rounded bg-surface-muted" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-surface-muted" />
          </div>
        )}
      </div>
    );
  }

  if (status === 'failed' || !name) {
    return (
      <div className="flex min-w-0 items-center gap-2.5">
        <span className={TILE}>
          <Microscope className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">LIMS</p>
            <p className="truncate text-xs text-muted">Pathology Management</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex min-w-0 items-center gap-2.5" title={name}>
      {branding?.logoDataUri ? (
        <img
          src={branding.logoDataUri}
          alt={collapsed ? name : ''}
          className="h-9 w-9 shrink-0 rounded-md object-contain"
          draggable={false}
        />
      ) : (
        <span className={cn(TILE, 'text-xs font-bold tracking-wide')} aria-hidden={!collapsed}>
          {initials(name)}
        </span>
      )}
      {!collapsed && (
        <div className="min-w-0 leading-tight">
          <p className="truncate text-sm font-semibold text-foreground">{name}</p>
          <p className="truncate text-xs text-muted">Pathology Management</p>
        </div>
      )}
    </div>
  );
}
