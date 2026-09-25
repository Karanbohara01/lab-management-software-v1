import { httpClient } from '@/api/client';
import type { CommissionEntryRow, CommissionPayoutRow, DoctorCommissionSummary, PayoutPayload } from './types';

export const commissionApi = {
  summary: () => httpClient.get<DoctorCommissionSummary[]>('/commissions/summary').then((r) => r.data),

  entries: (doctorId: number) =>
    httpClient.get<CommissionEntryRow[]>(`/commissions/doctors/${doctorId}/entries`).then((r) => r.data),

  payouts: (doctorId: number) =>
    httpClient.get<CommissionPayoutRow[]>(`/commissions/doctors/${doctorId}/payouts`).then((r) => r.data),

  recordPayout: (payload: PayoutPayload) =>
    httpClient.post<CommissionPayoutRow>('/commissions/payouts', payload).then((r) => r.data),
};
