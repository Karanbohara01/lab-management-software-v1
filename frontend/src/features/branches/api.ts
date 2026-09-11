import { httpClient } from '@/api/client';

export interface Branch {
  id: number;
  code: string;
  name: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  active: boolean;
}

export const branchesApi = {
  list: (activeOnly = false) =>
    httpClient.get<Branch[]>('/branches', { params: { activeOnly } }).then((r) => r.data),

  create: (payload: { code: string; name: string; addressLine?: string; city?: string; phone?: string; email?: string }) =>
    httpClient.post<Branch>('/branches', payload).then((r) => r.data),

  update: (id: number, payload: { name: string; addressLine?: string; city?: string; phone?: string; email?: string }) =>
    httpClient.put<Branch>(`/branches/${id}`, payload).then((r) => r.data),

  setActive: (id: number, value: boolean) =>
    httpClient.patch<Branch>(`/branches/${id}/active`, null, { params: { value } }).then((r) => r.data),
};
