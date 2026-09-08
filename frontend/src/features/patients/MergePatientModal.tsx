import { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Search } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { useToast } from '@/components/ui/toast';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { ApiError } from '@/types/api';
import { patientsApi } from './api';
import type { MergePreview, PatientDetail, PatientListItem } from './types';
import { formatAge } from './format';

export function MergePatientModal({
  open,
  onClose,
  survivor,
  onMerged,
}: {
  open: boolean;
  onClose: () => void;
  survivor: PatientDetail;
  onMerged: (updated: PatientDetail) => void;
}) {
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<PatientListItem[]>([]);
  const [duplicate, setDuplicate] = useState<PatientListItem | null>(null);
  const [preview, setPreview] = useState<MergePreview | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounced = useDebouncedValue(search, 300);

  useEffect(() => {
    if (!open) {
      setSearch('');
      setResults([]);
      setDuplicate(null);
      setPreview(null);
      setReason('');
      setError(null);
    }
  }, [open]);

  useEffect(() => {
    if (!open || duplicate || debounced.trim().length < 2) {
      setResults([]);
      return;
    }
    let cancelled = false;
    patientsApi
      .list({ query: debounced, activeOnly: false, size: 8 })
      .then((r) => {
        if (!cancelled) setResults(r.content.filter((p) => p.id !== survivor.id));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [debounced, open, duplicate, survivor.id]);

  useEffect(() => {
    if (!duplicate) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setError(null);
    patientsApi
      .mergePreview(survivor.id, duplicate.id)
      .then((p) => {
        if (!cancelled) setPreview(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof ApiError ? e.message : 'Unable to load merge preview');
      });
    return () => {
      cancelled = true;
    };
  }, [duplicate, survivor.id]);

  const confirm = async () => {
    if (!duplicate || reason.trim().length < 4) return;
    setBusy(true);
    setError(null);
    try {
      const updated = await patientsApi.merge(survivor.id, { duplicateId: duplicate.id, reason: reason.trim() });
      toast.success(`Merged ${duplicate.mrn} into ${survivor.mrn}`);
      onMerged(updated);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Merge failed');
    } finally {
      setBusy(false);
    }
  };

  const counts = preview
    ? [
        ['Lab orders', preview.labOrders],
        ['Samples', preview.samples],
        ['Results', preview.results],
        ['Reports', preview.reports],
        ['Invoices', preview.invoices],
      ]
    : [];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Merge duplicate patient"
      size="lg"
      footer={
        <>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="button"
            loading={busy}
            disabled={!duplicate || !preview || reason.trim().length < 4}
            onClick={confirm}
          >
            Merge into {survivor.mrn}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Alert tone="warning">
          Everything belonging to the duplicate — orders, samples, results, reports and invoices — moves to{' '}
          <strong>
            {survivor.fullName} ({survivor.mrn})
          </strong>
          . The duplicate is retired and kept only as an MRN alias. This cannot be undone.
        </Alert>

        {!duplicate ? (
          <div>
            <Input
              label="Find the duplicate record"
              leadingIcon={<Search className="h-4 w-4" aria-hidden />}
              placeholder="Search by name, MRN or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <ul className="mt-2 divide-y divide-border rounded-md border border-border">
              {results.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setDuplicate(p)}
                    className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-muted"
                  >
                    <span className="font-mono text-xs text-muted">{p.mrn}</span>
                    <span className="font-medium">{p.fullName}</span>
                    <span className="text-muted">
                      {formatAge(p.ageYears)} · {p.gender[0]}
                      {p.phone ? ` · ${p.phone}` : ''}
                    </span>
                    {!p.active && <Badge tone="neutral">Inactive</Badge>}
                  </button>
                </li>
              ))}
              {debounced.trim().length >= 2 && results.length === 0 && (
                <li className="px-3 py-2 text-sm text-muted">No other patients match.</li>
              )}
            </ul>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Duplicate (retired)</p>
                <p className="font-medium">
                  {duplicate.fullName} <span className="font-mono text-xs text-muted">{duplicate.mrn}</span>
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted" aria-hidden />
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-muted">Survivor</p>
                <p className="font-medium">
                  {survivor.fullName} <span className="font-mono text-xs text-muted">{survivor.mrn}</span>
                </p>
              </div>
            </div>
            <button type="button" className="text-xs text-primary hover:underline" onClick={() => setDuplicate(null)}>
              Choose a different record
            </button>

            {!preview && !error && (
              <p className="flex items-center gap-2 text-sm text-muted">
                <Spinner className="h-4 w-4" /> Loading preview…
              </p>
            )}

            {preview && (
              <>
                {preview.warnings.length > 0 && (
                  <div className="rounded-md border border-warning/40 bg-warning/5 p-3">
                    {preview.warnings.map((w) => (
                      <p key={w} className="flex items-start gap-2 text-sm text-foreground">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" aria-hidden />
                        {w}
                      </p>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-5 gap-2 text-center">
                  {counts.map(([label, n]) => (
                    <div key={label} className="rounded-md border border-border p-2">
                      <p className="text-lg font-semibold text-foreground">{n}</p>
                      <p className="text-[11px] text-muted">{label}</p>
                    </div>
                  ))}
                </div>

                <p className="text-sm text-muted">
                  {preview.fieldsAdopted.length > 0
                    ? `Missing details filled from the duplicate: ${preview.fieldsAdopted.join(', ')}.`
                    : 'No missing details to fill — the surviving record already has everything.'}
                </p>

                <Textarea
                  label="Reason for merge (recorded in the audit log)"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                />
              </>
            )}
          </>
        )}

        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    </Modal>
  );
}
