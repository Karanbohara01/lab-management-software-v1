import { Link } from 'react-router-dom';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import type { MatchCandidate } from './types';
import { formatAge } from './format';

/** Live "possible duplicate" panel shown on the registration screen. */
export function DuplicateCandidates({
  candidates,
  loading,
  onDismiss,
}: {
  candidates: MatchCandidate[];
  loading: boolean;
  onDismiss: (id: number) => void;
}) {
  if (loading && candidates.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted">
        <Spinner className="h-4 w-4" /> Checking for existing records…
      </p>
    );
  }
  if (candidates.length === 0) return null;

  const strong = candidates.some((c) => c.score >= 85);

  return (
    <div
      className={`rounded-lg border p-4 ${strong ? 'border-danger/40 bg-danger/5' : 'border-warning/40 bg-warning/5'}`}
    >
      <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
        <AlertTriangle className={`h-4 w-4 ${strong ? 'text-danger' : 'text-warning'}`} aria-hidden />
        {strong
          ? 'A very similar patient already exists'
          : `${candidates.length} possible existing ${candidates.length === 1 ? 'record' : 'records'}`}
      </p>
      <p className="mt-1 text-xs text-muted">
        Open the existing record if this is the same person — don&apos;t create a duplicate.
      </p>

      <ul className="mt-3 space-y-2">
        {candidates.map((c) => (
          <li
            key={c.id}
            className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-border bg-surface p-3 text-sm"
          >
            <span className="font-mono text-xs text-muted">{c.mrn}</span>
            <span className="font-medium text-foreground">{c.fullName}</span>
            <span className="text-muted">
              {formatAge(c.ageYears)} · {c.gender[0]}
              {c.phone ? ` · ${c.phone}` : ''}
            </span>
            <span className="flex flex-wrap gap-1">
              {c.reasons.map((r) => (
                <Badge key={r} tone={c.score >= 85 ? 'danger' : 'warning'}>
                  {r}
                </Badge>
              ))}
            </span>
            <span className="ml-auto flex items-center gap-3">
              <Link
                to={`/app/patients/${c.id}`}
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Open <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </Link>
              <button
                type="button"
                onClick={() => onDismiss(c.id)}
                className="text-xs text-muted hover:text-foreground"
              >
                Not a match
              </button>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
