import { useEffect, useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { LoadingState, ErrorState, EmptyState } from '@/components/ui/PageState';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { formatMoney } from '@/lib/money';
import { SPECIMEN_LABELS } from '../types';
import { masterCatalogApi } from './api';

export function ImportMasterTestsModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => (open ? masterCatalogApi.list() : Promise.resolve(null)), [open]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [importing, setImporting] = useState(false);

  useEffect(() => {
    if (open) setSelected(new Set());
  }, [open]);

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const doImport = async () => {
    if (selected.size === 0) return;
    setImporting(true);
    try {
      const result = await masterCatalogApi.import(Array.from(selected));
      if (result.imported.length > 0) {
        toast.success(`Imported ${result.imported.length} test${result.imported.length === 1 ? '' : 's'}`);
      }
      if (result.skippedAlreadyExists.length > 0) {
        toast.error(
          `Skipped ${result.skippedAlreadyExists.length} — already in your catalog: ${result.skippedAlreadyExists.join(', ')}`,
        );
      }
      onImported();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Import from master catalogue"
      description="Pick the tests you want — each becomes your own editable copy (price, ranges, etc.), not a live link."
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={doImport} loading={importing} disabled={selected.size === 0}>
            Import {selected.size > 0 ? `(${selected.size})` : ''}
          </Button>
        </>
      }
    >
      {loading && !data ? (
        <LoadingState />
      ) : error ? (
        <ErrorState message={error} onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <EmptyState
          title="Nothing to import"
          message="The platform admin hasn't added any master tests yet."
        />
      ) : (
        <ul className="divide-y divide-border">
          {data.map((t) => (
            <li key={t.id} className="flex items-start gap-3 py-3">
              <input
                type="checkbox"
                checked={selected.has(t.id)}
                onChange={() => toggle(t.id)}
                aria-label={`Select ${t.name}`}
                className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button type="button" className="flex-1 text-left" onClick={() => toggle(t.id)}>
                <p className="text-sm font-medium text-foreground">
                  {t.name} <span className="font-mono text-xs text-muted">{t.code}</span>
                </p>
                <p className="text-xs text-muted">
                  {t.departmentName} · {SPECIMEN_LABELS[t.specimenType]} · {t.parameterCount} parameter
                  {t.parameterCount === 1 ? '' : 's'}
                </p>
              </button>
              <Badge tone="neutral">{formatMoney(t.suggestedPrice)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
