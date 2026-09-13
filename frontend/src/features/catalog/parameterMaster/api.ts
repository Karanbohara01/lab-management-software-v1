import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { ParameterMaster, ParameterMasterUpsert } from './types';

export const parameterMasterApi = {
  list: (params: { query?: string; activeOnly?: boolean; size?: number } = {}) =>
    httpClient
      .get<PageResponse<ParameterMaster>>('/parameter-master', {
        params: { query: params.query || undefined, activeOnly: params.activeOnly ?? true, size: params.size ?? 200 },
      })
      .then((r) => r.data),

  create: (payload: ParameterMasterUpsert) =>
    httpClient.post<ParameterMaster>('/parameter-master', payload).then((r) => r.data),

  update: (id: number, payload: ParameterMasterUpsert) =>
    httpClient.put<ParameterMaster>(`/parameter-master/${id}`, payload).then((r) => r.data),

  activate: (id: number) => httpClient.post<void>(`/parameter-master/${id}/activate`).then((r) => r.data),

  deactivate: (id: number) => httpClient.post<void>(`/parameter-master/${id}/deactivate`).then((r) => r.data),
};
