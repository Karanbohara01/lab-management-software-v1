import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { useT } from '@/i18n';
import { groupGrantedPermissions } from '../permissionGroups';

/** Below this many resources, a filter box is more friction than it saves. */
const FILTER_THRESHOLD = 10;

/**
 * A role's granted permissions clustered by resource (Patients, Billing, …) instead of one long
 * flat run of chips — unreadable past ~15 permissions (Lab Administrator alone has 59). One row
 * per resource (icon, label, then its granted actions) rather than a header-plus-block per
 * group: a group with a single action doesn't dwarf its one chip under its own heading, and
 * every row has the same compact height. Deliberately quieter than the status `Badge`: these
 * describe a capability, not a state, so a bordered tag rather than a solid fill keeps the two
 * visually distinct. Meant to be the sole content of a role's detail view (a modal, one role at
 * a time) — a filter box appears once there's enough resources that finding one by scrolling
 * stops being the fastest way (research on permission-UI density consistently names search as
 * the fix once a grouped list itself gets long: see PlatformRolesPage's comment).
 */
export function PermissionGroupList({ permissions }: { permissions: readonly string[] }) {
  const t = useT();
  const [query, setQuery] = useState('');
  const groups = groupGrantedPermissions(permissions);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        entries: t(group.label).toLowerCase().includes(q)
          ? group.entries
          : group.entries.filter((e) => t(e.action).toLowerCase().includes(q)),
      }))
      .filter((group) => group.entries.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, query]);

  if (groups.length === 0) {
    return <p className="text-sm text-muted">{t('No permissions granted.')}</p>;
  }

  return (
    <div>
      {groups.length > FILTER_THRESHOLD && (
        <div className="relative mb-3">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('Filter by resource or action…')}
            className="h-9 w-full rounded-md border border-input bg-surface pl-8 pr-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      )}
      {visible.length === 0 ? (
        <p className="py-2 text-sm text-muted">{t('No matching permissions.')}</p>
      ) : (
        <div className="divide-y divide-border">
          {visible.map((group) => (
            <div key={group.label} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
              <group.icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <p className="w-36 shrink-0 text-xs font-medium text-muted">{t(group.label)}</p>
              <div className="flex flex-1 flex-wrap gap-1">
                {group.entries.map((e) => (
                  <span
                    key={e.permission}
                    className="inline-flex items-center rounded border border-border px-1.5 py-0.5 text-[11px] font-medium text-foreground"
                  >
                    {t(e.action)}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
