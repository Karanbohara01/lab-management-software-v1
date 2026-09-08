import { httpClient } from '@/api/client';

export interface LaboratoryProfile {
  name: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  panNumber: string | null;
  reportFooter: string | null;
  logoDataUri: string | null;
  fiscalYear: string;
  invoicePrefix: string;
  defaultTaxRate: number;
  inventoryExpiryAlertDays: number;
}

export const settingsApi = {
  getLaboratory: () => httpClient.get<LaboratoryProfile>('/settings/laboratory').then((r) => r.data),

  updateLaboratory: (payload: LaboratoryProfile) =>
    httpClient.put<LaboratoryProfile>('/settings/laboratory', payload).then((r) => r.data),
};
