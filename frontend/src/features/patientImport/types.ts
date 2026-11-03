/** Where an import has got to. The administrator drives some of these; the server drives the rest. */
export type ImportJobStatus =
  | 'UPLOADED'
  | 'ANALYSING'
  | 'READY'
  | 'IMPORTING'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'FAILED';

/** What became of one spreadsheet row. Every row of the file gets one. */
export type ImportRowStatus =
  | 'PENDING'
  | 'VALID'
  | 'INVALID'
  | 'DUPLICATE'
  | 'DUPLICATE_IN_FILE'
  | 'IMPORTED'
  | 'UPDATED'
  | 'SKIPPED'
  | 'FAILED';

export type DuplicatePolicy = 'SKIP' | 'IMPORT_AS_NEW' | 'FILL_BLANKS';

export interface FieldDefinition {
  field: string;
  label: string;
  mandatory: boolean;
  instruction: string;
  example: string;
}

export interface ColumnSuggestion {
  index: number;
  header: string;
  suggestedField: string | null;
  examples: string[];
}

export interface ImportJobSummary {
  id: number;
  filename: string;
  fileFormat: string;
  fileSizeBytes: number;
  status: ImportJobStatus;
  totalRows: number;
  processedRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  importedRows: number;
  updatedRows: number;
  skippedRows: number;
  failedRows: number;
  percentComplete: number;
  importedBy: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  retryOfJobId: number | null;
  failureMessage: string | null;
  cancelRequested: boolean;
  fileAvailable: boolean;
}

export interface ImportJobDetail {
  job: ImportJobSummary;
  mapping: Record<string, string>;
  rowCounts: Record<ImportRowStatus, number>;
  duplicatePolicy: DuplicatePolicy | null;
}

export interface ImportRow {
  id: number;
  rowNumber: number;
  status: ImportRowStatus;
  errorField: string | null;
  errorMessage: string | null;
  duplicateOfMrn: string | null;
  duplicateOfPatientId: number | null;
  duplicateOfRow: number | null;
  duplicateReason: string | null;
  patientId: number | null;
  data: Record<string, string>;
}

export interface UploadResult {
  job: ImportJobSummary;
  headers: string[];
  columns: ColumnSuggestion[];
  sampleRows: string[][];
  sameFileAs: ImportJobSummary | null;
}

export const JOB_STATUS_LABEL: Record<ImportJobStatus, string> = {
  UPLOADED: 'Awaiting mapping',
  ANALYSING: 'Checking rows',
  READY: 'Ready to import',
  IMPORTING: 'Importing',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  FAILED: 'Failed',
};

export const JOB_STATUS_TONE: Record<ImportJobStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  UPLOADED: 'neutral',
  ANALYSING: 'info',
  READY: 'info',
  IMPORTING: 'info',
  COMPLETED: 'success',
  CANCELLED: 'neutral',
  FAILED: 'danger',
};

export const ROW_STATUS_LABEL: Record<ImportRowStatus, string> = {
  PENDING: 'Not checked',
  VALID: 'Ready',
  INVALID: 'Has an error',
  DUPLICATE: 'Matches a patient',
  DUPLICATE_IN_FILE: 'Repeats a row',
  IMPORTED: 'Imported',
  UPDATED: 'Patient updated',
  SKIPPED: 'Skipped',
  FAILED: 'Could not save',
};

export const ROW_STATUS_TONE: Record<ImportRowStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  PENDING: 'neutral',
  VALID: 'success',
  INVALID: 'danger',
  DUPLICATE: 'warning',
  DUPLICATE_IN_FILE: 'warning',
  IMPORTED: 'success',
  UPDATED: 'info',
  SKIPPED: 'neutral',
  FAILED: 'danger',
};

/** True while the server still owns the job, so the screen should keep polling. */
export function isRunning(status: ImportJobStatus): boolean {
  return status === 'ANALYSING' || status === 'IMPORTING';
}

export function isFinished(status: ImportJobStatus): boolean {
  return status === 'COMPLETED' || status === 'CANCELLED' || status === 'FAILED';
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
