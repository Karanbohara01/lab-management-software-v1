import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { TestCsvImportResult, TestDetail, TestListItem, TestUpsertPayload } from './types';

export interface TestQuery {
  query?: string;
  departmentId?: number;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}

const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000;

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

export const testCatalogApi = {
  list: (params: TestQuery) =>
    httpClient.get<PageResponse<TestListItem>>('/tests', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<TestDetail>(`/tests/${id}`).then((r) => r.data),

  create: (payload: TestUpsertPayload) =>
    httpClient.post<TestDetail>('/tests', payload).then((r) => r.data),

  update: (id: number, payload: Omit<TestUpsertPayload, 'code'>) =>
    httpClient.put<TestDetail>(`/tests/${id}`, payload).then((r) => r.data),

  setActive: (id: number, value: boolean) =>
    httpClient.patch<TestDetail>(`/tests/${id}/active`, null, { params: { value } }).then((r) => r.data),

  exportCsv: () => download('/tests/export', 'test-catalog.csv'),

  downloadImportTemplate: () => download('/tests/import/template', 'test-catalog-template.csv'),

  importCsv: (file: File, onProgress?: (percent: number) => void) => {
    const body = new FormData();
    body.append('file', file);
    return httpClient
      .post<TestCsvImportResult>('/tests/import', body, {
        headers: { 'Content-Type': undefined },
        timeout: UPLOAD_TIMEOUT_MS,
        onUploadProgress: (event) => {
          if (onProgress && event.total) {
            onProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      })
      .then((r) => r.data);
  },
};
