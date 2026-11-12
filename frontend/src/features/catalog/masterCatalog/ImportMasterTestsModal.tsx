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
import { useT } from '@/i18n';

export function ImportMasterTestsModal({
  open,
  onClose,
  onImported,
}: {
  open: boolean;
  onClose: () => void;
  onImported: () => void;
}) {
  const t = useT();
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
        toast.success(
          t(result.imported.length === 1 ? 'Imported {count} test' : 'Imported {count} tests', {
            count: result.imported.length,
          }),
        );
      }
      if (result.skippedAlreadyExists.length > 0) {
        toast.error(
          t('Skipped {count} — already in your catalog: {names}', {
            count: result.skippedAlreadyExists.length,
            names: result.skippedAlreadyExists.join(', '),
          }),
        );
      }
      onImported();
      onClose();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Import failed'));
    } finally {
      setImporting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Import from master catalogue')}
      description={t('Pick the tests you want — each becomes your own editable copy (price, ranges, etc.), not a live link.')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button onClick={doImport} loading={importing} disabled={selected.size === 0}>
            {t('Import')}{selected.size > 0 ? ` (${selected.size})` : ''}
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
          title={t('Nothing to import')}
          message={t("The platform admin hasn't added any master tests yet.")}
        />
      ) : (
        <ul className="divide-y divide-border">
          {data.map((row) => (
            <li key={row.id} className="flex items-start gap-3 py-3">
              <input
                type="checkbox"
                checked={selected.has(row.id)}
                onChange={() => toggle(row.id)}
                aria-label={t('Select {name}', { name: row.name })}
                className="mt-1 h-4 w-4 shrink-0 rounded border-input text-primary focus-visible:ring-2 focus-visible:ring-ring"
              />
              <button type="button" className="flex-1 text-left" onClick={() => toggle(row.id)}>
                <p className="text-sm font-medium text-foreground">
                  {row.name} <span className="font-mono text-xs text-muted">{row.code}</span>
                </p>
                <p className="text-xs text-muted">
                  {row.departmentName} · {t(SPECIMEN_LABELS[row.specimenType])} ·{' '}
                  {t(row.parameterCount === 1 ? '{count} parameter' : '{count} parameters', {
                    count: row.parameterCount,
                  })}
                </p>
              </button>
              <Badge tone="neutral">{formatMoney(row.suggestedPrice)}</Badge>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}
