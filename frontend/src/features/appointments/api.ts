import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { AppointmentDetail, AppointmentListItem, AppointmentStatus, SaveAppointmentPayload } from './types';

export interface AppointmentQuery {
  patientId?: number;
  status?: AppointmentStatus;
  branchId?: number;
  scheduledFrom?: string;
  scheduledTo?: string;
  query?: string;
  page?: number;
  size?: number;
}

export const appointmentsApi = {
  list: (params: AppointmentQuery) =>
    httpClient.get<PageResponse<AppointmentListItem>>('/appointments', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<AppointmentDetail>(`/appointments/${id}`).then((r) => r.data),

  create: (payload: SaveAppointmentPayload) =>
    httpClient.post<AppointmentDetail>('/appointments', payload).then((r) => r.data),

  update: (id: number, payload: SaveAppointmentPayload) =>
    httpClient.put<AppointmentDetail>(`/appointments/${id}`, payload).then((r) => r.data),

  checkIn: (id: number) => httpClient.post<AppointmentDetail>(`/appointments/${id}/check-in`).then((r) => r.data),

  cancel: (id: number, reason: string) =>
    httpClient.post<AppointmentDetail>(`/appointments/${id}/cancel`, { reason }).then((r) => r.data),

  noShow: (id: number) => httpClient.post<AppointmentDetail>(`/appointments/${id}/no-show`).then((r) => r.data),

  convert: (id: number, orderId: number) =>
    httpClient.post<AppointmentDetail>(`/appointments/${id}/convert`, { orderId }).then((r) => r.data),
};
