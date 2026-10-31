import { useEffect, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { formatMoney } from '@/lib/money';
import { testCatalogApi } from './api';
import type { TestListItem } from './types';

/**
 * Debounced catalog search-and-add, shared by anything that builds a list of tests inline (the
 * order builder, appointment booking). Extracted from OrderBuilderPage's original inline
 * component — same behavior, just reusable.
 */
export function TestPicker({
  existingIds,
  onAdd,
}: {
  existingIds: number[];
  onAdd: (t: TestListItem) => void;
}) {
  const [term, setTerm] = useState('');
  const debounced = useDebouncedValue(term, 300);
  const [results, setResults] = useState<TestListItem[]>([]);

  useEffect(() => {
    if (debounced.trim().length < 1) {
      setResults([]);
      return;
    }
    testCatalogApi.list({ query: debounced, activeOnly: true, size: 8 }).then((r) => setResults(r.content));
  }, [debounced]);

  return (
    <div>
      <Input
        leadingIcon={<Search className="h-4 w-4" aria-hidden />}
        placeholder="Search tests by name or code"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      {results.length > 0 && (
        <ul className="mt-2 divide-y divide-border rounded-md border border-border">
          {results.map((t) => {
            const added = existingIds.includes(t.id);
            return (
              <li key={t.id}>
                <button
                  type="button"
                  disabled={added}
                  onClick={() => {
                    onAdd(t);
                    setTerm('');
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-surface-muted disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span>
                    <span className="font-medium text-foreground">{t.name}</span>
                    <span className="ml-2 font-mono text-xs text-muted">{t.code}</span>
                    <span className="ml-2 text-muted">{formatMoney(t.price)}</span>
                  </span>
                  <span className="flex items-center gap-1 text-xs font-medium text-muted">
                    {added ? 'Added' : <><Plus className="h-4 w-4" aria-hidden /> Add</>}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
