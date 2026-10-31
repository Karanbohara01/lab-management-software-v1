import { useEffect, useState } from 'react';
import { Search, UserPlus } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { patientsApi } from './api';
import { QuickRegisterPatientModal } from './QuickRegisterPatientModal';
import type { PatientListItem } from './types';

/**
 * Debounced patient search-and-select, shared by anything that needs to pick a patient inline
 * (the order builder, appointment booking). Extracted from OrderBuilderPage's original inline
 * component — same behavior, just reusable. Also owns the "no such patient yet" dead end: it used
 * to just link to /app/patients, which threw away everything already filled in on whatever form
 * was using this picker — now it can register one inline (QuickRegisterPatientModal) and select
 * them immediately, fixing that for every caller at once.
 */
export function PatientPicker({ onSelect }: { onSelect: (p: PatientListItem) => void }) {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 300);
  const [results, setResults] = useState<PatientListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [quickRegisterOpen, setQuickRegisterOpen] = useState(false);

  useEffect(() => {
    if (debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    patientsApi
      .list({ query: debounced, activeOnly: true, size: 8 })
      .then((r) => setResults(r.content))
      .finally(() => setLoading(false));
  }, [debounced]);

  return (
    <div>
      <Input
        leadingIcon={<Search className="h-4 w-4" aria-hidden />}
        placeholder="Search patient by name, MRN or phone"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {loading && <p className="mt-2 text-sm text-muted">Searching…</p>}
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border">
          {results.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onSelect(p)}
                className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-muted"
              >
                <span>
                  <span className="font-medium text-foreground">{p.fullName}</span>
                  <span className="ml-2 text-muted">{p.gender[0]}{p.ageYears != null ? ` · ${p.ageYears}y` : ''}</span>
                </span>
                <span className="font-mono text-xs text-muted">{p.mrn}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {debounced.trim().length >= 2 && !loading && (
        <div className="mt-2 flex items-center justify-between gap-2">
          {results.length === 0 && <p className="text-sm text-muted">No patients found.</p>}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className={results.length === 0 ? '' : 'ml-auto'}
            onClick={() => setQuickRegisterOpen(true)}
          >
            <UserPlus className="h-3.5 w-3.5" aria-hidden />
            Register new patient
          </Button>
        </div>
      )}

      <QuickRegisterPatientModal
        open={quickRegisterOpen}
        onClose={() => setQuickRegisterOpen(false)}
        initialName={term}
        onCreated={(patient) => {
          setQuickRegisterOpen(false);
          onSelect(patient);
        }}
      />
    </div>
  );
}
