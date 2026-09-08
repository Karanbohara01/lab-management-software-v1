import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { Doctor, DoctorUpsertPayload } from './types';

export interface DoctorQuery {
  query?: string;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}

export const doctorsApi = {
  list: (params: DoctorQuery) =>
    httpClient.get<PageResponse<Doctor>>('/doctors', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<Doctor>(`/doctors/${id}`).then((r) => r.data),

  create: (payload: DoctorUpsertPayload) =>
    httpClient.post<Doctor>('/doctors', payload).then((r) => r.data),

  update: (id: number, payload: DoctorUpsertPayload) =>
    httpClient.put<Doctor>(`/doctors/${id}`, payload).then((r) => r.data),

  setActive: (id: number, value: boolean) =>
    httpClient.patch<Doctor>(`/doctors/${id}/active`, null, { params: { value } }).then((r) => r.data),
};
