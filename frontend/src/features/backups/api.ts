import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { BackupRun } from './types';

export const backupsApi = {
  list: (params: { page?: number; size?: number }) =>
    httpClient.get<PageResponse<BackupRun>>('/backups', { params }).then((r) => r.data),

  /** Runs synchronously — a full database dump can take a while; this call waits for it. */
  run: () => httpClient.post<BackupRun>('/backups/run').then((r) => r.data),

  download: async (id: number, suggestedName: string) => {
    const res = await httpClient.get<Blob>(`/backups/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data);
    const link = document.createElement('a');
    link.href = url;
    link.download = suggestedName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};
