import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  MatchCandidate,
  MatchQuery,
  MergePreview,
  PatientCategory,
  PatientDetail,
  PatientListItem,
  PatientUpsertPayload,
} from './types';

export interface PatientQuery {
  query?: string;
  category?: PatientCategory;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}

export const patientsApi = {
  list: (params: PatientQuery) =>
    httpClient.get<PageResponse<PatientListItem>>('/patients', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<PatientDetail>(`/patients/${id}`).then((r) => r.data),

  match: (payload: MatchQuery) =>
    httpClient.post<MatchCandidate[]>('/patients/match', payload).then((r) => r.data),

  create: (payload: PatientUpsertPayload) =>
    httpClient.post<PatientDetail>('/patients', payload).then((r) => r.data),

  update: (id: number, payload: PatientUpsertPayload) =>
    httpClient.put<PatientDetail>(`/patients/${id}`, payload).then((r) => r.data),

  setActive: (id: number, value: boolean) =>
    httpClient.patch<PatientDetail>(`/patients/${id}/active`, null, { params: { value } }).then((r) => r.data),

  mergePreview: (survivorId: number, duplicateId: number) =>
    httpClient
      .get<MergePreview>(`/patients/${survivorId}/merge-preview`, { params: { duplicateId } })
      .then((r) => r.data),

  merge: (survivorId: number, payload: { duplicateId: number; reason: string }) =>
    httpClient.post<PatientDetail>(`/patients/${survivorId}/merge`, payload).then((r) => r.data),
};
