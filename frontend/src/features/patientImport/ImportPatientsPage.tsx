import { useCallback, useEffect, useRef, useState } from 'react';
import { Download, FileSpreadsheet, RefreshCw, Upload, X } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ErrorState, LoadingState } from '@/components/ui/PageState';
import { useToast } from '@/components/ui/toast';
import { useQuery } from '@/hooks/useQuery';
import { useBackTarget } from '@/lib/navigation';
import { ApiError } from '@/types/api';
import { patientImportApi } from './api';
import { ImportMappingStep, UNMAPPED } from './ImportMappingStep';
import { ImportRowsTable } from './ImportRowsTable';
import { ImportStepper } from './ImportStepper';
import {
  formatFileSize,
  isFinished,
  isRunning,
  JOB_STATUS_LABEL,
  JOB_STATUS_TONE,
  type DuplicatePolicy,
  type ImportJobDetail,
  type ImportRowStatus,
  type UploadResult,
} from './types';

/** How often the progress screen asks the server where it has got to. */
const POLL_MS = 2000;

const DUPLICATE_CHOICES: { value: DuplicatePolicy; label: string; detail: string }[] = [
  {
    value: 'SKIP',
    label: 'Skip them',
    detail: 'Leave the existing patient exactly as it is and import nothing for that row.',
  },
  {
    value: 'FILL_BLANKS',
    label: 'Fill in blanks only',
    detail:
      'Add details the existing patient is missing. Nothing already on the record is changed or replaced.',
  },
  {
    value: 'IMPORT_AS_NEW',
    label: 'Import as new patients',
    detail:
      'Create a second record even though one matches. Use only when the old system really held two different people.',
  },
];

/**
 * Bringing a clinic's existing patient list into the system.
 *
 * <p>Seven steps, and nothing is created until the fifth. The file is uploaded and read, the
 * administrator matches up the columns, every row is checked and shown back with its problems and
 * its matches against patients already here, and only then is the import confirmed. Progress comes
 * from the server's own counters, so leaving this page and coming back loses nothing.
 */
export function ImportPatientsPage() {
  const toast = useToast();
  const { back } = useBackTarget();

  const [upload, setUpload] = useState<UploadResult | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [jobId, setJobId] = useState<number | null>(null);
  const [job, setJob] = useState<ImportJobDetail | null>(null);
  const [policy, setPolicy] = useState<DuplicatePolicy>('SKIP');
  // A shared common name is usually a different person, so possible matches default to new.
  const [weakPolicy, setWeakPolicy] = useState<DuplicatePolicy>('IMPORT_AS_NEW');
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [busy, setBusy] = useState(false);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const retryingRef = useRef<number | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const fields = useQuery(() => patientImportApi.fields(), [], { cacheKey: 'import-fields' });
  const history = useQuery(() => patientImportApi.history(0, 10), [], { cacheKey: 'import-history' });
  const refreshHistory = history.refetch;

  // Whether the server currently owns the job. The poll below is keyed on this as well as the job
  // id, so it re-arms each time the job enters a running state — keyed on the id alone it would
  // start for the checking pass and then never come back when the import itself began.
  const serverIsWorking = job != null && isRunning(job.job.status);

  /** Polls only while the server is actually working, and stops the moment it is not. */
  useEffect(() => {
    if (jobId == null || !serverIsWorking) return;
    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const next = await patientImportApi.get(jobId);
        if (cancelled) return;
        setJob(next);
        if (isRunning(next.job.status)) {
          timer = window.setTimeout(tick, POLL_MS);
        } else {
          refreshHistory();
        }
      } catch {
        // A hiccup in polling must not lose the page; try again on the next beat.
        if (!cancelled) timer = window.setTimeout(tick, POLL_MS * 2);
      }
    };
    tick();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [jobId, serverIsWorking, refreshHistory]);

  const reset = () => {
    setUpload(null);
    setMapping({});
    setJobId(null);
    setJob(null);
    setPolicy('SKIP');
    setWeakPolicy('IMPORT_AS_NEW');
    retryingRef.current = null;
    if (fileInput.current) fileInput.current.value = '';
  };

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      const retryOf = retryingRef.current;
      setUploading(true);
      setUploadPercent(0);
      try {
        const result = retryOf
          ? await patientImportApi.retry(retryOf, file, setUploadPercent)
          : await patientImportApi.upload(file, setUploadPercent);
        setUpload(result);
        setJobId(null);
        setJob(null);
        // Start from the server's suggestions; the administrator reviews them next.
        const initial: Record<string, string> = {};
        result.columns.forEach((c) => {
          initial[String(c.index)] = c.suggestedField ?? UNMAPPED;
        });
        setMapping(initial);
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : 'That file could not be uploaded.');
      } finally {
        setUploading(false);
        retryingRef.current = null;
        if (fileInput.current) fileInput.current.value = '';
      }
    },
    [toast],
  );

  const confirmMapping = async () => {
    if (!upload) return;
    setBusy(true);
    try {
      const detail = await patientImportApi.confirmMapping(upload.job.id, mapping);
      setJob(detail);
      setJobId(upload.job.id);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'That mapping could not be used.');
    } finally {
      setBusy(false);
    }
  };

  const startImport = async () => {
    if (jobId == null) return;
    setBusy(true);
    try {
      setJob(await patientImportApi.start(jobId, policy, weakPolicy));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'The import could not be started.');
    } finally {
      setBusy(false);
    }
  };

  const cancelImport = async () => {
    if (jobId == null) return;
    try {
      setJob(await patientImportApi.cancel(jobId));
      toast.success('The import will stop after the batch it is on.');
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'The import could not be cancelled.');
    }
  };

  const openHistoryJob = async (id: number) => {
    setUpload(null);
    setJobId(id);
    setJob(await patientImportApi.get(id).catch(() => null));
  };

  const beginRetry = (id: number) => {
    retryingRef.current = id;
    fileInput.current?.click();
  };

  const step = currentStep(job, upload);

  return (
    <>
      <PageHeader
        back={back}
        title="Import patients"
        description="Bring an existing patient list in from a spreadsheet, without registering each person by hand."
        actions={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => patientImportApi.downloadTemplate()}>
              <Download className="h-4 w-4" aria-hidden />
              Download template
            </Button>
            {(upload || job) && (
              <Button variant="secondary" onClick={reset}>
                Start again
              </Button>
            )}
          </div>
        }
      />

      <ImportStepper current={step} />

      {/* The file input lives outside the drop zone so a retry can reuse it. */}
      <input
        ref={fileInput}
        type="file"
        accept=".xlsx,.xlsm,.csv,.tsv,.txt"
        className="sr-only"
        onChange={(e) => onFile(e.target.files?.[0])}
      />

      {/* Step 1 — choose a file */}
      {!upload && !job && (
        <Card>
          <CardHeader
            title="Upload the patient list"
            description="Excel (.xlsx) or CSV. Your own column layout is fine — you match the columns up next."
          />
          <CardBody className="space-y-4">
            <div
              className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border px-6 py-10 text-center"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                onFile(e.dataTransfer.files?.[0]);
              }}
            >
              <FileSpreadsheet className="h-8 w-8 text-muted" aria-hidden />
              <p className="text-body font-medium text-foreground">
                Choose a file, or drag one here
              </p>
              <p className="max-w-sm text-caption text-muted">
                Nepali text is supported. Phone numbers and existing patient IDs are kept exactly as
                written.
              </p>
              <Button
                type="button"
                variant="secondary"
                loading={uploading}
                onClick={() => fileInput.current?.click()}
              >
                <Upload className="h-4 w-4" aria-hidden />
                {uploading ? `Uploading ${uploadPercent}%` : 'Choose file'}
              </Button>
            </div>

            <Alert tone="info" title="What happens next">
              The file is checked row by row before anything is created. You will see how many rows
              are ready, which have errors and which match patients already in the system — and you
              decide what to do about each before the import starts.
            </Alert>
          </CardBody>
        </Card>
      )}

      {/* Step 2 — map columns */}
      {upload && !job && (
        <Card>
          <CardHeader
            title="Match the columns to patient fields"
            description={`${upload.job.filename} · ${formatFileSize(upload.job.fileSizeBytes)} · ${upload.headers.length} columns`}
            action={
              <Button loading={busy} onClick={confirmMapping}>
                Check the file
              </Button>
            }
          />
          <CardBody className="space-y-4">
            {upload.sameFileAs && (
              <Alert tone="warning" title="This looks like a file imported before">
                The same file was uploaded on{' '}
                {new Date(upload.sameFileAs.createdAt).toLocaleString()} and imported{' '}
                {upload.sameFileAs.importedRows} patients. Carrying on is safe — anything already
                here is flagged as a match rather than duplicated — but check this is what you meant.
              </Alert>
            )}
            {fields.data && (
              <ImportMappingStep
                columns={upload.columns}
                fields={fields.data}
                mapping={mapping}
                onChange={setMapping}
                sampleRows={upload.sampleRows}
              />
            )}
          </CardBody>
        </Card>
      )}

      {/* Steps 3 to 7 all read the same job */}
      {job && (
        <div className="space-y-5">
          <Card>
            <CardHeader
              title={job.job.filename}
              description={
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <Badge tone={JOB_STATUS_TONE[job.job.status]}>
                    {JOB_STATUS_LABEL[job.job.status]}
                  </Badge>
                  <span className="text-muted">
                    Import #{job.job.id} · {formatFileSize(job.job.fileSizeBytes)}
                    {job.job.importedBy ? ` · started by ${job.job.importedBy}` : ''}
                  </span>
                </span>
              }
              action={
                <div className="flex flex-wrap gap-2">
                  {isRunning(job.job.status) && !job.job.cancelRequested && (
                    <Button variant="secondary" onClick={() => setConfirmCancel(true)}>
                      <X className="h-4 w-4" aria-hidden />
                      Stop
                    </Button>
                  )}
                  {job.job.status === 'READY' && (
                    <Button loading={busy} onClick={startImport}>
                      Import {importableCount(job, policy, weakPolicy).toLocaleString()}{' '}
                      {importableCount(job, policy, weakPolicy) === 1 ? 'patient' : 'patients'}
                    </Button>
                  )}
                  {isFinished(job.job.status) && (
                    <Button variant="secondary" onClick={() => beginRetry(job.job.id)}>
                      <RefreshCw className="h-4 w-4" aria-hidden />
                      Import a corrected file
                    </Button>
                  )}
                </div>
              }
            />
            <CardBody className="space-y-4">
              {job.job.failureMessage && (
                <Alert tone="danger" title="This import stopped">
                  {job.job.failureMessage}
                </Alert>
              )}
              {job.job.cancelRequested && isRunning(job.job.status) && (
                <Alert tone="warning" title="Stopping">
                  The import will stop after the batch it is working on. Patients already created are
                  kept.
                </Alert>
              )}
              {job.job.status === 'ANALYSING' && (
                <Alert tone="info" title="Checking every row">
                  Nothing has been created yet. You can leave this page and come back — the check
                  carries on.
                </Alert>
              )}

              {/* Real progress, from the server's counters, never an animation. */}
              {(isRunning(job.job.status) || job.job.totalRows > 0) && (
                <div>
                  <div className="mb-1.5 flex items-baseline justify-between">
                    <span className="text-label uppercase text-muted">
                      {job.job.status === 'ANALYSING' ? 'Checking rows' : 'Progress'}
                    </span>
                    <span className="text-body-sm font-semibold tabular-nums text-foreground">
                      {job.job.percentComplete}%
                    </span>
                  </div>
                  <div
                    className="h-2 overflow-hidden rounded-full bg-surface-muted"
                    role="progressbar"
                    aria-valuenow={job.job.percentComplete}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Import progress"
                  >
                    <div
                      className="h-full rounded-full bg-primary transition-[width] duration-500"
                      style={{ width: `${job.job.percentComplete}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-caption text-muted">
                    {job.job.processedRows.toLocaleString()} of {job.job.totalRows.toLocaleString()}{' '}
                    rows processed
                    {job.job.startedAt
                      ? ` · started ${new Date(job.job.startedAt).toLocaleTimeString()}`
                      : ''}
                    {job.job.completedAt
                      ? ` · finished ${new Date(job.job.completedAt).toLocaleTimeString()}`
                      : ''}
                  </p>
                </div>
              )}

              <CountGrid job={job} />

              {isFinished(job.job.status) && (
                <div className="flex flex-wrap gap-2 border-t border-border pt-4">
                  <Button
                    variant="secondary"
                    onClick={() => patientImportApi.downloadReport(job.job.id, ['INVALID', 'FAILED'])}
                    disabled={!hasRows(job, ['INVALID', 'FAILED'])}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Rows with problems
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() =>
                      patientImportApi.downloadReport(job.job.id, [
                        'DUPLICATE',
                        'DUPLICATE_IN_FILE',
                        'POSSIBLE_DUPLICATE',
                        'SKIPPED',
                      ])
                    }
                    disabled={!hasRows(job, ['DUPLICATE', 'DUPLICATE_IN_FILE', 'POSSIBLE_DUPLICATE', 'SKIPPED'])}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Skipped and matched
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => patientImportApi.downloadReport(job.job.id, ['IMPORTED', 'UPDATED'])}
                    disabled={!hasRows(job, ['IMPORTED', 'UPDATED'])}
                  >
                    <Download className="h-4 w-4" aria-hidden />
                    Imported patients
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Step 4 — decide what happens to matches, before confirming */}
          {job.job.status === 'READY' && (
            <Card>
              <CardHeader
                title="Patients that already exist"
                description={
                  job.job.duplicateRows === 0
                    ? job.job.possibleDuplicateRows > 0
                      ? 'No row firmly matches a patient already here by phone, ID, or name and date of birth.'
                      : 'None of these rows matches a patient already in the system.'
                    : `${job.job.duplicateRows} ${job.job.duplicateRows === 1 ? 'row matches' : 'rows match'} a patient already here by phone, ID, or name and date of birth, or repeats an earlier row of this file. Choose what should happen to them.`
                }
              />
              <CardBody className="space-y-4">
                {job.job.duplicateRows > 0 ? (
                  <>
                    <div className="max-w-md">
                      <Select
                        label="When a row matches an existing patient"
                        options={DUPLICATE_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
                        value={policy}
                        onChange={(e) => setPolicy(e.target.value as DuplicatePolicy)}
                      />
                      <p className="mt-1.5 text-caption text-muted">
                        {DUPLICATE_CHOICES.find((c) => c.value === policy)?.detail}
                      </p>
                    </div>
                    <Alert tone="info" title="Records are never merged automatically">
                      No existing patient is overwritten or merged by an import. To combine two
                      records, use the merge tool on the patient itself.
                    </Alert>
                    <ImportRowsTable
                      jobId={job.job.id}
                      statuses={['DUPLICATE', 'DUPLICATE_IN_FILE']}
                      emptyTitle="No matches"
                      emptyMessage="Nothing in this file matches a patient already in the system."
                    />
                  </>
                ) : (
                  <p className="text-body-sm text-muted">
                    {job.job.possibleDuplicateRows > 0
                      ? 'The possible matches below are the only resemblances found.'
                      : 'Every row in this file looks like someone new.'}
                  </p>
                )}
              </CardBody>
            </Card>
          )}

          {/* Step 4b — rows that only share a name, gender and age with someone */}
          {job.job.status === 'READY' && job.job.possibleDuplicateRows > 0 && (
            <Card>
              <CardHeader
                title="Possible matches"
                description={`${job.job.possibleDuplicateRows} ${job.job.possibleDuplicateRows === 1 ? 'row shares' : 'rows share'} a name, gender and age with an existing patient but ${job.job.possibleDuplicateRows === 1 ? 'has' : 'have'} no phone number or patient ID to confirm it.`}
              />
              <CardBody className="space-y-4">
                <div className="max-w-md">
                  <Select
                    label="When a row only shares a name, gender and age"
                    options={DUPLICATE_CHOICES.map((c) => ({ value: c.value, label: c.label }))}
                    value={weakPolicy}
                    onChange={(e) => setWeakPolicy(e.target.value as DuplicatePolicy)}
                  />
                  <p className="mt-1.5 text-caption text-muted">
                    {DUPLICATE_CHOICES.find((c) => c.value === weakPolicy)?.detail}
                  </p>
                </div>
                <Alert tone="info" title="Treated as new unless you say otherwise">
                  Two people with the same common name and age are ordinary, so these are imported
                  as new patients by default. Open the matched record if you want to be sure.
                </Alert>
                <ImportRowsTable
                  jobId={job.job.id}
                  statuses={['POSSIBLE_DUPLICATE']}
                  emptyTitle="No possible matches"
                  emptyMessage="Nothing in this file resembles an existing patient."
                />
              </CardBody>
            </Card>
          )}

          {/* Rows that cannot be imported, shown before and after the import */}
          {job.job.invalidRows + job.job.failedRows > 0 && (
            <Card>
              <CardHeader
                title="Rows that could not be imported"
                description="Each one names the problem and the column it came from, so the file can be corrected and imported again."
              />
              <CardBody className="p-0">
                <ImportRowsTable
                  jobId={job.job.id}
                  statuses={['INVALID', 'FAILED']}
                  emptyTitle="Nothing wrong"
                  emptyMessage="Every row in this file could be read."
                />
              </CardBody>
            </Card>
          )}

          {/* Step 7 — what went in */}
          {isFinished(job.job.status) && job.job.importedRows + job.job.updatedRows > 0 && (
            <Card>
              <CardHeader
                title="Patients imported"
                description={`${job.job.importedRows.toLocaleString()} created${
                  job.job.updatedRows > 0
                    ? `, ${job.job.updatedRows.toLocaleString()} existing records completed`
                    : ''
                }.`}
              />
              <CardBody className="p-0">
                <ImportRowsTable
                  jobId={job.job.id}
                  statuses={['IMPORTED', 'UPDATED']}
                  emptyTitle="Nothing imported"
                  emptyMessage="No patients were created by this import."
                  showProblem={false}
                />
              </CardBody>
            </Card>
          )}
        </div>
      )}

      {/* Previous imports, always available */}
      <Card className="mt-5">
        <CardHeader
          title="Previous imports"
          description="Every import this clinic has run, and what came of it."
        />
        <CardBody className="p-0">
          {history.loading && !history.data ? (
            <LoadingState label="Loading history…" />
          ) : history.error ? (
            <ErrorState message={history.error} onRetry={history.refetch} />
          ) : history.data && history.data.content.length === 0 ? (
            <p className="px-4 py-6 text-center text-body-sm text-muted">
              No patient list has been imported yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[42rem] text-body-sm">
                <thead className="border-b border-border text-left text-label uppercase text-muted">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold">File</th>
                    <th className="px-4 py-2.5 font-semibold">Started</th>
                    <th className="px-4 py-2.5 font-semibold">By</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Rows</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Imported</th>
                    <th className="px-4 py-2.5 text-right font-semibold">Problems</th>
                    <th className="px-4 py-2.5 font-semibold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.data?.content.map((h) => (
                    <tr
                      key={h.id}
                      className="cursor-pointer hover:bg-surface-muted/50"
                      onClick={() => openHistoryJob(h.id)}
                    >
                      <td className="px-4 py-2.5">
                        <span className="block font-medium text-foreground">{h.filename}</span>
                        {h.retryOfJobId && (
                          <span className="block text-caption text-muted">
                            retry of import #{h.retryOfJobId}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-2.5 text-muted">
                        {new Date(h.createdAt).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-muted">{h.importedBy ?? '—'}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                        {h.totalRows.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums font-medium text-foreground">
                        {h.importedRows.toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted">
                        {(h.invalidRows + h.failedRows).toLocaleString()}
                      </td>
                      <td className="px-4 py-2.5">
                        <Badge tone={JOB_STATUS_TONE[h.status]}>{JOB_STATUS_LABEL[h.status]}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>

      <ConfirmDialog
        open={confirmCancel}
        onClose={() => setConfirmCancel(false)}
        onConfirm={cancelImport}
        title="Stop this import?"
        message="It will stop after the batch it is working on. Patients already created are kept — they are real records now — and the rest of the file is left untouched."
        confirmLabel="Stop the import"
        tone="danger"
      />
    </>
  );
}

/**
 * How many patients pressing the button will actually create. Read from the per-status counts:
 * the job's duplicate total also includes repeats within the file, which are never created.
 */
function importableCount(job: ImportJobDetail, policy: DuplicatePolicy, weakPolicy: DuplicatePolicy): number {
  let count = job.rowCounts.VALID ?? 0;
  if (policy === 'IMPORT_AS_NEW') count += job.rowCounts.DUPLICATE ?? 0;
  if (weakPolicy === 'IMPORT_AS_NEW') count += job.rowCounts.POSSIBLE_DUPLICATE ?? 0;
  return count;
}

/** Whether a report of these outcomes would have any rows in it. */
function hasRows(job: ImportJobDetail, statuses: ImportRowStatus[]): boolean {
  return statuses.some((s) => (job.rowCounts[s] ?? 0) > 0);
}

/** The counters, as the requirements name them. */
function CountGrid({ job }: { job: ImportJobDetail }) {
  const tiles: { label: string; value: number; tone?: string }[] = [
    { label: 'Total rows', value: job.job.totalRows },
    { label: 'Ready', value: job.job.validRows, tone: 'text-success' },
    { label: 'With errors', value: job.job.invalidRows, tone: 'text-danger' },
    { label: 'Already exist', value: job.job.duplicateRows, tone: 'text-warning' },
    { label: 'Possible match', value: job.job.possibleDuplicateRows, tone: 'text-warning' },
    { label: 'Imported', value: job.job.importedRows, tone: 'text-success' },
    { label: 'Updated', value: job.job.updatedRows },
    { label: 'Skipped', value: job.job.skippedRows },
    { label: 'Failed', value: job.job.failedRows, tone: 'text-danger' },
  ];
  return (
    <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-lg border border-border px-3 py-2.5">
          <dt className="text-label uppercase text-muted">{t.label}</dt>
          <dd
            className={`mt-0.5 text-heading-4 tabular-nums ${
              t.value > 0 ? (t.tone ?? 'text-foreground') : 'text-muted'
            }`}
          >
            {t.value.toLocaleString()}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/** Which step of the wizard the current state corresponds to. */
function currentStep(job: ImportJobDetail | null, upload: UploadResult | null): number {
  if (!job) return upload ? 1 : 0;
  switch (job.job.status) {
    case 'UPLOADED':
      return 1;
    case 'ANALYSING':
      return 2;
    case 'READY':
      return 3;
    case 'IMPORTING':
      return 4;
    default:
      return 5;
  }
}
