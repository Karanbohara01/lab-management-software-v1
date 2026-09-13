import { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { ChevronDown, ChevronsLeft, ChevronsRight, Microscope, Search, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useAuth } from '@/features/auth/useAuth';
import { NAV_SECTIONS } from './navigation';

const SECTION_COLLAPSE_KEY = 'lims.sidebar.collapsedSections';

function readCollapsedSections(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(SECTION_COLLAPSE_KEY) ?? '{}');
  } catch {
    return {};
  }
}

/** Splits a label around the first case-insensitive match of `query` so the caller can highlight it. */
function splitMatch(label: string, query: string): [string, string, string] | null {
  if (!query) return null;
  const idx = label.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return null;
  return [label.slice(0, idx), label.slice(idx, idx + query.length), label.slice(idx + query.length)];
}

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
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(readCollapsedSections);
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);
  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length > 0;

  const toggleSection = (heading: string) => {
    setCollapsedSections((prev) => {
      const next = { ...prev, [heading]: !prev[heading] };
      try {
        localStorage.setItem(SECTION_COLLAPSE_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const visibleSections = useMemo(
    () =>
      NAV_SECTIONS.map((section) => ({
        ...section,
        items: section.items.filter(
          (item) =>
            (item.anyPermission.length === 0 || hasAnyPermission(item.anyPermission)) &&
            (!isSearching || item.label.toLowerCase().includes(trimmedQuery.toLowerCase())),
        ),
      })).filter((section) => section.items.length > 0),
    [hasAnyPermission, isSearching, trimmedQuery],
  );

  // "/" focuses the sidebar search, unless the user is already typing somewhere else.
  useEffect(() => {
    if (collapsed) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== '/' || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return;
      if (target?.isContentEditable) return;
      e.preventDefault();
      searchRef.current?.focus();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [collapsed]);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div
        className={cn(
          'flex h-16 shrink-0 items-center gap-2.5 border-b border-border',
          collapsed ? 'justify-center px-2' : 'px-5',
        )}
      >
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-sm">
          <Microscope className="h-[18px] w-[18px]" aria-hidden />
        </span>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold text-foreground">LIMS</p>
            <p className="truncate text-xs text-muted">Pathology Management</p>
          </div>
        )}
      </div>

      {!collapsed && (
        <div className="shrink-0 px-3 pb-2 pt-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" aria-hidden />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search menu…"
              aria-label="Search navigation menu"
              className="h-8 w-full rounded-md border border-input bg-surface-muted/60 pl-8 pr-7 text-xs text-foreground placeholder:text-muted focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-foreground"
                aria-label="Clear menu search"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
              </button>
            ) : (
              <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-surface px-1 text-[10px] font-medium text-muted">
                /
              </kbd>
            )}
          </div>
        </div>
      )}

      <nav
        className="flex-1 overflow-y-auto px-3 py-2 [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-track]:bg-transparent"
        aria-label="Primary"
      >
        {isSearching && visibleSections.length === 0 && (
          <p className="px-3 py-4 text-center text-sm text-muted">No menu items match "{trimmedQuery}".</p>
        )}
        {visibleSections.map((section) => {
          const items = section.items;
          const isSectionCollapsed = !collapsed && !isSearching && collapsedSections[section.heading];
          return (
            <div key={section.heading} className="mb-4">
              {!collapsed && (
                <button
                  type="button"
                  onClick={() => toggleSection(section.heading)}
                  className="group flex w-full items-center justify-between rounded-md px-3 pb-1.5 pt-1 text-xs font-semibold uppercase tracking-wider text-muted hover:text-muted-foreground"
                >
                  <span>{section.heading}</span>
                  {!isSearching && (
                    <ChevronDown
                      className={cn(
                        'h-3.5 w-3.5 shrink-0 opacity-0 transition-transform duration-150 group-hover:opacity-100',
                        isSectionCollapsed && '-rotate-90 opacity-100',
                      )}
                      aria-hidden
                    />
                  )}
                </button>
              )}
              {!isSectionCollapsed && (
                <ul className="space-y-0.5">
                  {items.map((item) => {
                    const match = !collapsed ? splitMatch(item.label, trimmedQuery) : null;
                    return (
                      <li key={item.to}>
                        <NavLink
                          to={item.to}
                          end={item.to === '/app' || item.to === '/app/platform'}
                          onClick={() => {
                            setQuery('');
                            onNavigate?.();
                          }}
                          title={collapsed ? item.label : undefined}
                          aria-disabled={item.upcoming || undefined}
                          className={({ isActive }) =>
                            cn(
                              'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors duration-100',
                              collapsed && 'justify-center px-0',
                              isActive
                                ? 'bg-primary/10 text-primary'
                                : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground',
                              item.upcoming && 'pointer-events-none opacity-50',
                            )
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span
                                className={cn(
                                  'absolute left-0 h-[18px] w-[3px] rounded-full bg-primary transition-opacity duration-100',
                                  isActive ? 'opacity-100' : 'opacity-0',
                                )}
                                aria-hidden
                              />
                              <item.icon className="h-4 w-4 shrink-0" aria-hidden />
                              {!collapsed && (
                                <>
                                  <span className="flex-1 truncate">
                                    {match ? (
                                      <>
                                        {match[0]}
                                        <span className="rounded-sm bg-primary/20 text-foreground">{match[1]}</span>
                                        {match[2]}
                                      </>
                                    ) : (
                                      item.label
                                    )}
                                  </span>
                                  {item.upcoming && (
                                    <span className="rounded bg-surface-muted px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">
                                      Soon
                                    </span>
                                  )}
                                </>
                              )}
                            </>
                          )}
                        </NavLink>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {onToggleCollapse && (
        <button
          type="button"
          onClick={onToggleCollapse}
          className={cn(
            'flex shrink-0 items-center gap-2 border-t border-border px-3 py-3 text-xs font-medium text-muted transition-colors hover:bg-surface-muted hover:text-foreground',
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
