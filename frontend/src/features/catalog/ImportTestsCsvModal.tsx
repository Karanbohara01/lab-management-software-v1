import { useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Alert } from '@/components/ui/Alert';
import { ApiError } from '@/types/api';
import { useToast } from '@/components/ui/toast';
import { testCatalogApi } from './api';
import type { TestCsvImportResult } from './types';
import { useT } from '@/i18n';

/**
 * Bulk create/update of the lab's own catalog from a CSV — "migrate from our old system" and
 * "edit prices in a spreadsheet, re-upload" both go through here. Synchronous: a test catalog is
 * a few hundred rows, so the whole result comes back from one upload, no job/polling needed (see
 * the backend's TestCatalogImportService class doc for why this is intentionally lighter-weight
 * than the patient import).
 */
export function ImportTestsCsvModal({
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
  const fileInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [result, setResult] = useState<TestCsvImportResult | null>(null);

  useEffect(() => {
    if (open) {
      setResult(null);
      setUploadPercent(0);
    }
  }, [open]);

  const onFile = async (file: File | null | undefined) => {
    if (!file) return;
    setUploading(true);
    setUploadPercent(0);
    try {
      const r = await testCatalogApi.importCsv(file, setUploadPercent);
      setResult(r);
      if (r.created.length > 0 || r.updated.length > 0) {
        onImported();
      }
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : t('Import failed'));
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const close = () => {
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title={t('Import tests from CSV')}
      description={t('Create or update catalog tests in bulk — re-uploading an existing code updates its price and other columns without touching its parameters.')}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => testCatalogApi.downloadImportTemplate()}>
            <Download className="h-4 w-4" aria-hidden />
            {t('Download template')}
          </Button>
          <Button onClick={close}>{t('Done')}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <input
          ref={fileInput}
          type="file"
          accept=".csv,.txt,.tsv"
          className="sr-only"
          onChange={(e) => onFile(e.target.files?.[0])}
        />
        <div
          className="flex flex-col items-center gap-2 rounded-md border-2 border-dashed border-border px-4 py-8 text-center"
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            onFile(e.dataTransfer.files?.[0]);
          }}
        >
          <FileSpreadsheet className="h-8 w-8 text-muted" aria-hidden />
          <p className="text-sm text-muted">{t('Drag a CSV file here, or')}</p>
          <Button variant="secondary" loading={uploading} onClick={() => fileInput.current?.click()}>
            {uploading ? t('Uploading {percent}%', { percent: uploadPercent }) : t('Choose file')}
          </Button>
        </div>

        {result && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border border-border px-3 py-2.5">
                <dt className="text-label uppercase text-muted">{t('Created')}</dt>
                <dd className={`text-heading-4 tabular-nums ${result.created.length > 0 ? 'text-success' : 'text-muted'}`}>
                  {result.created.length}
                </dd>
              </div>
              <div className="rounded-lg border border-border px-3 py-2.5">
                <dt className="text-label uppercase text-muted">{t('Updated')}</dt>
                <dd className={`text-heading-4 tabular-nums ${result.updated.length > 0 ? 'text-success' : 'text-muted'}`}>
                  {result.updated.length}
                </dd>
              </div>
              <div className="rounded-lg border border-border px-3 py-2.5">
                <dt className="text-label uppercase text-muted">{t('Errors')}</dt>
                <dd className={`text-heading-4 tabular-nums ${result.errors.length > 0 ? 'text-danger' : 'text-muted'}`}>
                  {result.errors.length}
                </dd>
              </div>
            </div>

            {result.errors.length > 0 && (
              <div className="max-h-64 overflow-auto rounded-md border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-surface-muted text-left text-label uppercase text-muted">
                    <tr>
                      <th className="px-3 py-2">{t('Row')}</th>
                      <th className="px-3 py-2">{t('Code')}</th>
                      <th className="px-3 py-2">{t('Problem')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {result.errors.map((e, i) => (
                      <tr key={i} className="align-top">
                        <td className="px-3 py-2 font-mono text-caption text-muted">{e.rowNumber}</td>
                        <td className="px-3 py-2 font-mono text-xs">{e.code || '—'}</td>
                        <td className="px-3 py-2 text-xs">{e.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {result.errors.length === 0 && (result.created.length > 0 || result.updated.length > 0) && (
              <Alert tone="success">{t('All rows imported successfully.')}</Alert>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
