import { httpClient } from '@/api/client';

export interface Antibiotic {
  id: number;
  code: string;
  name: string;
  drugClass: string | null;
  active: boolean;
}

export interface AntibioticUpsert {
  code: string;
  name: string;
  drugClass?: string;
  active?: boolean;
}

export const antibioticsApi = {
  list: (activeOnly = true) =>
    httpClient
      .get<Antibiotic[]>('/microbiology/antibiotics', { params: { activeOnly } })
      .then((r) => r.data),

  create: (body: AntibioticUpsert) =>
    httpClient.post<Antibiotic>('/microbiology/antibiotics', body).then((r) => r.data),

  update: (id: number, body: AntibioticUpsert) =>
    httpClient.put<Antibiotic>(`/microbiology/antibiotics/${id}`, body).then((r) => r.data),
};
