import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { SampleDetail, SampleListItem, SampleStatus, SpecimenConditionInput } from './types';

export interface SampleQuery {
  status?: SampleStatus;
  orderId?: number;
  patientId?: number;
  departmentId?: number;
  branchId?: number;
  query?: string;
  page?: number;
  size?: number;
}

export const samplesApi = {
  list: (params: SampleQuery) =>
    httpClient.get<PageResponse<SampleListItem>>('/samples', { params }).then((r) => r.data),

  summary: () =>
    httpClient.get<{ counts: Record<string, number> }>('/samples/summary').then((r) => r.data.counts),

  get: (id: number) => httpClient.get<SampleDetail>(`/samples/${id}`).then((r) => r.data),

  lookup: (code: string) =>
    httpClient.get<SampleDetail>('/samples/lookup', { params: { code } }).then((r) => r.data),

  collect: (
    id: number,
    body: { collectionSite?: string; container?: string; note?: string; paymentOverrideReason?: string },
  ) => httpClient.post<SampleDetail>(`/samples/${id}/collect`, body).then((r) => r.data),

  receive: (id: number, body?: { note?: string; condition?: SpecimenConditionInput }) =>
    httpClient.post<SampleDetail>(`/samples/${id}/receive`, body ?? {}).then((r) => r.data),

  reject: (id: number, reason: string) =>
    httpClient.post<SampleDetail>(`/samples/${id}/reject`, { reason }).then((r) => r.data),

  recollect: (id: number, note?: string) =>
    httpClient.post<SampleDetail>(`/samples/${id}/recollect`, { note }).then((r) => r.data),

  addNote: (id: number, note: string) =>
    httpClient.post<SampleDetail>(`/samples/${id}/notes`, { note }).then((r) => r.data),
};
