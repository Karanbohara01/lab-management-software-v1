import { httpClient } from '@/api/client';

export interface Department {
  id: number;
  code: string;
  name: string;
  description: string | null;
  active: boolean;
}

export const departmentsApi = {
  list: (activeOnly = false) =>
    httpClient.get<Department[]>('/departments', { params: { activeOnly } }).then((r) => r.data),

  create: (payload: { code: string; name: string; description?: string }) =>
    httpClient.post<Department>('/departments', payload).then((r) => r.data),

  update: (id: number, payload: { name: string; description?: string }) =>
    httpClient.put<Department>(`/departments/${id}`, payload).then((r) => r.data),

  setActive: (id: number, value: boolean) =>
    httpClient.patch<Department>(`/departments/${id}/active`, null, { params: { value } }).then((r) => r.data),
};
