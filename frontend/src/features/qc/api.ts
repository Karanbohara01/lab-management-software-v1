import { httpClient } from '@/api/client';
import type { LeveyJennings, QcControlStatus, QcMaterial, QcRun } from './types';

export interface MaterialUpsert {
  name: string;
  manufacturer?: string;
  lotNumber?: string;
  level: string;
  testId: number;
  expiryDate?: string | null;
  note?: string;
  active?: boolean;
  targets: { parameterId: number; targetMean: number; targetSd: number; unit?: string; source?: string }[];
}

export const qcApi = {
  materials: () => httpClient.get<QcMaterial[]>('/qc/materials').then((r) => r.data),
  createMaterial: (body: MaterialUpsert) => httpClient.post<QcMaterial>('/qc/materials', body).then((r) => r.data),
  updateMaterial: (id: number, body: MaterialUpsert) =>
    httpClient.put<QcMaterial>(`/qc/materials/${id}`, body).then((r) => r.data),
  recordRun: (body: {
    materialId: number;
    parameterId: number;
    value: number;
    analyzer?: string;
    shift?: string;
    comment?: string;
  }) => httpClient.post<QcRun>('/qc/runs', body).then((r) => r.data),
  acceptRun: (id: number, comment?: string) =>
    httpClient.post<QcRun>(`/qc/runs/${id}/accept`, null, { params: { comment } }).then((r) => r.data),
  runs: (testId: number, limit = 50) =>
    httpClient.get<QcRun[]>('/qc/runs', { params: { testId, limit } }).then((r) => r.data),
  leveyJennings: (materialId: number, parameterId: number) =>
    httpClient.get<LeveyJennings>('/qc/levey-jennings', { params: { materialId, parameterId } }).then((r) => r.data),
  status: (testId: number) =>
    httpClient.get<QcControlStatus>('/qc/status', { params: { testId } }).then((r) => r.data),
};
