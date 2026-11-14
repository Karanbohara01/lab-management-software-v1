import { useEffect, useRef, useState } from 'react';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { LoadingState, ErrorState } from '@/components/ui/PageState';
import { useQuery } from '@/hooks/useQuery';
import { useToast } from '@/components/ui/toast';
import { ApiError } from '@/types/api';
import { settingsApi, type ReportSignatory } from './api';
import { useT } from '@/i18n';

const MAX_SIGNATURE_BYTES = 400_000;

interface Row {
  id: number | null;
  title: string;
  signatureDataUri: string | null;
}

function toRows(signatories: ReportSignatory[]): Row[] {
  return [...signatories]
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((s) => ({ id: s.id, title: s.title, signatureDataUri: s.signatureDataUri }));
}

/**
 * The named signature lines printed in the report footer — "Lab Technician", "Consultant
 * Pathologist", or whatever roles this lab's own report sign-off actually uses. Edited as one
 * ordered list with a single save: creates/updates/deletes the rows that changed, in one go,
 * rather than a save button per row.
 */
export function ReportSignatoriesCard({ canWrite }: { canWrite: boolean }) {
  const t = useT();
  const toast = useToast();
  const { data, loading, error, refetch } = useQuery(() => settingsApi.getReportSignatories(), []);
  const [rows, setRows] = useState<Row[]>([]);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (data) setRows(toRows(data));
  }, [data]);

  if (loading && !data) return <LoadingState />;
  if (error) return <ErrorState message={error} onRetry={refetch} />;

  const isDirty =
    !!data &&
    JSON.stringify(rows) !==
      JSON.stringify(toRows(data));

  const setRow = (index: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));

  const addRow = () => setRows((prev) => [...prev, { id: null, title: '', signatureDataUri: null }]);

  const removeRow = (index: number) => setRows((prev) => prev.filter((_, i) => i !== index));

  const move = (index: number, delta: number) =>
    setRows((prev) => {
      const target = index + delta;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target]!, next[index]!];
      return next;
    });

  const onSignature = (index: number, file: File) => {
    if (file.size > MAX_SIGNATURE_BYTES) {
      setFormError(t('Signature must be under 400 KB.'));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setRow(index, { signatureDataUri: String(reader.result) });
    reader.readAsDataURL(file);
  };

  const save = async () => {
    setFormError(null);
    const blank = rows.find((r) => !r.title.trim());
    if (blank) {
      setFormError(t('Every signature line needs a title.'));
      return;
    }
    setSaving(true);
    try {
      const existingIds = new Set((data ?? []).map((s) => s.id));
      const keptIds = new Set(rows.filter((r) => r.id != null).map((r) => r.id as number));
      const removed = [...existingIds].filter((id) => !keptIds.has(id));

      await Promise.all([
        ...removed.map((id) => settingsApi.deleteReportSignatory(id)),
        ...rows.map((r, i) => {
          const payload = { title: r.title.trim(), signatureDataUri: r.signatureDataUri, displayOrder: i };
          return r.id == null
            ? settingsApi.createReportSignatory(payload)
            : settingsApi.updateReportSignatory(r.id, payload);
        }),
      ]);
      toast.success(t('Signature lines saved'));
      refetch();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : t('Unable to save'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader
        title={t('Report signatories')}
        description={t('The signature lines printed at the bottom of released reports, in this order — not every lab calls its sign-off "Consultant Pathologist", so the title is yours to set.')}
      />
      <CardBody className="space-y-3">
        {formError && <Alert tone="danger">{formError}</Alert>}
        {rows.length === 0 && <p className="text-sm text-muted">{t('No signature lines yet.')}</p>}
        <div className="space-y-3">
          {rows.map((row, i) => (
            <div key={row.id ?? `new-${i}`} className="flex items-start gap-3 rounded-md border border-border p-3">
              <div className="flex h-16 w-28 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-surface-muted">
                {row.signatureDataUri ? (
                  <img src={row.signatureDataUri} alt={t('Current signature')} className="max-h-14 max-w-[90%] object-contain" />
                ) : (
                  <span className="text-xs text-muted">{t('No signature')}</span>
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <Input
                  label={t('Role title')}
                  placeholder={t('e.g. Consultant Pathologist')}
                  value={row.title}
                  disabled={!canWrite}
                  onChange={(e) => setRow(i, { title: e.target.value })}
                />
                {canWrite && (
                  <div className="flex gap-2">
                    <input
                      ref={(el) => {
                        fileRefs.current[i] = el;
                      }}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && onSignature(i, e.target.files[0])}
                    />
                    <Button variant="secondary" size="sm" onClick={() => fileRefs.current[i]?.click()}>
                      {t('Upload')}
                    </Button>
                    {row.signatureDataUri && (
                      <Button variant="ghost" size="sm" onClick={() => setRow(i, { signatureDataUri: null })}>
                        {t('Remove')}
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {canWrite && (
                <div className="flex shrink-0 flex-col gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="rounded p-1 text-muted hover:text-foreground disabled:opacity-30"
                    aria-label={t('Move up')}
                  >
                    <ArrowUp className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === rows.length - 1}
                    className="rounded p-1 text-muted hover:text-foreground disabled:opacity-30"
                    aria-label={t('Move down')}
                  >
                    <ArrowDown className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => removeRow(i)}
                    className="rounded p-1 text-muted hover:text-danger"
                    aria-label={t('Remove signature line')}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        {canWrite && (
          <div className="flex items-center justify-between pt-1">
            <Button variant="secondary" size="sm" onClick={addRow}>
              <Plus className="mr-1.5 h-4 w-4" aria-hidden />
              {t('Add signature line')}
            </Button>
            <Button onClick={save} loading={saving} disabled={!isDirty}>
              {t('Save signature lines')}
            </Button>
          </div>
        )}
      </CardBody>
    </Card>
  );
}
