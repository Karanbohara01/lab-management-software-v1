import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  FieldDefinition,
  ImportJobDetail,
  ImportJobSummary,
  ImportRow,
  ImportRowStatus,
  DuplicatePolicy,
  UploadResult,
} from './types';

/**
 * A spreadsheet upload can be tens of megabytes over a slow clinic connection, so these two calls
 * get their own generous timeout rather than the client's default of none — a stalled upload should
 * fail visibly instead of hanging forever.
 */
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

/**
 * Sends the file as multipart. The shared client sets a JSON content type for every request, which
 * has to be cleared here so the browser can fill in the multipart boundary itself.
 */
function upload(url: string, file: File, onProgress?: (percent: number) => void) {
  const body = new FormData();
  body.append('file', file);
  return httpClient.post<UploadResult>(url, body, {
    headers: { 'Content-Type': undefined },
    timeout: UPLOAD_TIMEOUT_MS,
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
}

/** Hands the browser a file the server generated, without leaving the page. */
async function download(url: string, fallbackName: string): Promise<void> {
  const response = await httpClient.get<Blob>(url, { responseType: 'blob' });
  const header = response.headers['content-disposition'];
  const matched = typeof header === 'string' ? /filename="?([^"]+)"?/.exec(header) : null;
  const objectUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = matched?.[1] ?? fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(objectUrl);
}

export const patientImportApi = {
  fields: () => httpClient.get<FieldDefinition[]>('/patient-imports/fields').then((r) => r.data),

  downloadTemplate: () => download('/patient-imports/template', 'patient-import-template.csv'),

  upload: (file: File, onProgress?: (percent: number) => void) =>
    upload('/patient-imports', file, onProgress).then((r) => r.data),

  retry: (jobId: number, file: File, onProgress?: (percent: number) => void) =>
    upload(`/patient-imports/${jobId}/retry`, file, onProgress).then((r) => r.data),

  /** Confirms the column mapping, which starts the checking pass. */
  confirmMapping: (jobId: number, mapping: Record<string, string>) =>
    httpClient
      .post<ImportJobDetail>(`/patient-imports/${jobId}/mapping`, { mapping })
      .then((r) => r.data),

  /** Confirms the import itself, after the preview, with a policy for each kind of match. */
  start: (jobId: number, duplicatePolicy: DuplicatePolicy, weakMatchPolicy: DuplicatePolicy) =>
    httpClient
      .post<ImportJobDetail>(`/patient-imports/${jobId}/start`, { duplicatePolicy, weakMatchPolicy })
      .then((r) => r.data),

  cancel: (jobId: number) =>
    httpClient.post<ImportJobDetail>(`/patient-imports/${jobId}/cancel`).then((r) => r.data),

  get: (jobId: number) =>
    httpClient.get<ImportJobDetail>(`/patient-imports/${jobId}`).then((r) => r.data),

  history: (page = 0, size = 20) =>
    httpClient
      .get<PageResponse<ImportJobSummary>>('/patient-imports', { params: { page, size } })
      .then((r) => r.data),

  rows: (jobId: number, status: ImportRowStatus[] | undefined, page = 0, size = 25) =>
    httpClient
      .get<PageResponse<ImportRow>>(`/patient-imports/${jobId}/rows`, {
        params: { status: status?.length ? status : undefined, page, size },
        // Repeated query parameters, which is what the server's List<Status> expects.
        paramsSerializer: { indexes: null },
      })
      .then((r) => r.data),

  downloadReport: (jobId: number, status: ImportRowStatus[]) =>
    download(
      `/patient-imports/${jobId}/report?${status.map((s) => `status=${s}`).join('&')}`,
      `patient-import-${jobId}.csv`,
    ),
};
