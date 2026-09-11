import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, FlaskConical, Search, User, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useAuth } from '@/features/auth/useAuth';
import { PERMISSIONS } from '@/features/auth/permissions';
import { patientsApi } from '@/features/patients/api';
import { ordersApi } from '@/features/orders/api';
import { samplesApi } from '@/features/samples/api';
import { ApiError } from '@/types/api';

interface Hit {
  key: string;
  group: 'Patients' | 'Orders' | 'Samples';
  icon: typeof User;
  label: string;
  sub: string;
  to: string;
}

/** Global "jump to" search: patients, orders and samples in one box — the laboratory's command bar. */
export function CommandSearch() {
  const navigate = useNavigate();
  const { hasPermission } = useAuth();
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [loading, setLoading] = useState(false);
  const debounced = useDebouncedValue(query, 250);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = debounced.trim();
    if (term.length < 2) {
      setHits([]);
      return;
    }
    let cancelled = false;
    setLoading(true);
    const tasks: Promise<Hit[]>[] = [];

    if (hasPermission(PERMISSIONS.PATIENT_READ)) {
      tasks.push(
        patientsApi
          .list({ query: term, size: 4 })
          .then((r) =>
            r.content.map((p) => ({
              key: `p${p.id}`,
              group: 'Patients' as const,
              icon: User,
              label: p.fullName,
              sub: `${p.mrn}${p.phone ? ` · ${p.phone}` : ''}`,
              to: `/app/patients/${p.id}`,
            })),
          )
          .catch(() => []),
      );
    }
    if (hasPermission(PERMISSIONS.LAB_ORDER_READ)) {
      tasks.push(
        ordersApi
          .list({ query: term, size: 4 })
          .then((r) =>
            r.content.map((o) => ({
              key: `o${o.id}`,
              group: 'Orders' as const,
              icon: FileText,
              label: o.orderNumber,
              sub: `${o.patientName} · ${o.status}`,
              to: `/app/orders/${o.id}`,
            })),
          )
          .catch(() => []),
      );
    }
    if (hasPermission(PERMISSIONS.SAMPLE_READ) && /^[a-z]{0,2}\d{3,}$/i.test(term)) {
      tasks.push(
        samplesApi
          .lookup(term)
          .then((s) => [
            {
              key: `s${s.id}`,
              group: 'Samples' as const,
              icon: FlaskConical,
              label: s.accessionNumber,
              sub: `${s.patientName} · ${s.status}`,
              to: `/app/samples/${s.id}`,
            },
          ])
          .catch((e) => (e instanceof ApiError ? [] : Promise.reject(e))),
      );
    }

    Promise.all(tasks)
      .then((groups) => {
        if (!cancelled) setHits(groups.flat());
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debounced, hasPermission]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (to: string) => {
    navigate(to);
    setOpen(false);
    setQuery('');
  };

  const groups: Hit['group'][] = ['Patients', 'Orders', 'Samples'];

  return (
    <div ref={rootRef} className="relative w-full max-w-md">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search patients, orders, samples…"
          aria-label="Global search"
          className="h-9 w-full rounded-md border border-input bg-surface-muted/60 pl-9 pr-8 text-sm text-foreground placeholder:text-muted focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-ring"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setHits([]);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-muted hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </div>

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full z-30 mt-1.5 max-h-96 overflow-y-auto rounded-lg border border-border bg-surface shadow-popover">
          {loading && hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">Searching…</p>
          ) : hits.length === 0 ? (
            <p className="px-4 py-3 text-sm text-muted">No matches for "{query}".</p>
          ) : (
            groups.map((g) => {
              const items = hits.filter((h) => h.group === g);
              if (items.length === 0) return null;
              return (
                <div key={g} className="py-1.5">
                  <p className="px-4 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted">{g}</p>
                  {items.map((h) => (
                    <button
                      key={h.key}
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => go(h.to)}
                      className={cn(
                        'flex w-full items-center gap-2.5 px-4 py-2 text-left text-sm hover:bg-surface-muted',
                      )}
                    >
                      <h.icon className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-foreground">{h.label}</span>
                        <span className="block truncate text-xs text-muted">{h.sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
