import { NavLink } from 'react-router-dom';
import { ChevronsLeft, ChevronsRight, Microscope } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/useAuth';
import { NAV_SECTIONS } from './navigation';

export function SidebarContent({
  onNavigate,
  collapsed = false,
  onToggleCollapse,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const { hasAnyPermission } = useAuth();

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className={cn('flex h-16 shrink-0 items-center gap-2.5 border-b border-border', collapsed ? 'justify-center px-2' : 'px-5')}>
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <Microscope className="h-5 w-5" aria-hidden />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">LIMS</p>
            <p className="truncate text-xs text-muted">Pathology Management</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Primary">
        {NAV_SECTIONS.map((section) => {
          const items = section.items.filter(
            (item) => item.anyPermission.length === 0 || hasAnyPermission(item.anyPermission),
          );
          if (items.length === 0) return null;
          return (
            <div key={section.heading} className="mb-5">
              {!collapsed && (
                <p className="px-3 pb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">
                  {section.heading}
                </p>
              )}
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/app'}
                      onClick={onNavigate}
                      title={collapsed ? item.label : undefined}
                      aria-disabled={item.upcoming || undefined}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                          collapsed && 'justify-center px-0',
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                          item.upcoming && 'pointer-events-none opacity-50',
                        )
                      }
                    >
                      <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                      {!collapsed && (
                        <>
                          <span className="flex-1">{item.label}</span>
                          {item.upcoming && (
                            <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">
                              Soon
                            </span>
                          )}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex shrink-0 items-center gap-2 border-t border-border px-3 py-3 text-xs font-medium text-muted hover:bg-surface-muted hover:text-foreground',
            collapsed && 'justify-center',
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronsRight className="h-4 w-4" aria-hidden /> : <ChevronsLeft className="h-4 w-4" aria-hidden />}
          {!collapsed && 'Collapse'}
        </button>
      )}
    </div>
  );
}
