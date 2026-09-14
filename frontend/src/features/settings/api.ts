import { httpClient } from '@/api/client';

export interface LaboratoryProfile {
  name: string;
  addressLine: string | null;
  city: string | null;
  phone: string | null;
  email: string | null;
  panNumber: string | null;
  accreditationNumber: string | null;
  reportFooter: string | null;
  logoDataUri: string | null;
  fiscalYear: string;
  invoicePrefix: string;
  defaultTaxRate: number;
  inventoryExpiryAlertDays: number;
  requirePaymentBeforeCollection: boolean;
  printReportLetterhead: boolean;
  printInvoiceLetterhead: boolean;
}

export interface PaymentCredentials {
  esewaEnabled: boolean;
  esewaMerchantCode: string | null;
  esewaSecretConfigured: boolean;
  khaltiEnabled: boolean;
  khaltiSecretConfigured: boolean;
}

export interface IrdCredentials {
  enabled: boolean;
  username: string | null;
  sellerPan: string | null;
  passwordConfigured: boolean;
}

export interface SmsCredentials {
  enabled: boolean;
  from: string | null;
  tokenConfigured: boolean;
}

export interface WhatsAppCredentials {
  enabled: boolean;
  phoneNumberId: string | null;
  accessTokenConfigured: boolean;
}

export const settingsApi = {
  getLaboratory: () => httpClient.get<LaboratoryProfile>('/settings/laboratory').then((r) => r.data),

  updateLaboratory: (payload: LaboratoryProfile) =>
    httpClient.put<LaboratoryProfile>('/settings/laboratory', payload).then((r) => r.data),

  getPaymentCredentials: () =>
    httpClient.get<PaymentCredentials>('/settings/payment-credentials').then((r) => r.data),

  updatePaymentCredentials: (payload: {
    esewaEnabled: boolean;
    esewaMerchantCode?: string;
    esewaSecretKey?: string;
    khaltiEnabled: boolean;
    khaltiSecretKey?: string;
  }) => httpClient.put<PaymentCredentials>('/settings/payment-credentials', payload).then((r) => r.data),

  getIrdCredentials: () => httpClient.get<IrdCredentials>('/settings/ird-credentials').then((r) => r.data),

  updateIrdCredentials: (payload: { enabled: boolean; username?: string; sellerPan?: string; password?: string }) =>
    httpClient.put<IrdCredentials>('/settings/ird-credentials', payload).then((r) => r.data),

  getSmsCredentials: () => httpClient.get<SmsCredentials>('/settings/sms-credentials').then((r) => r.data),

  updateSmsCredentials: (payload: { enabled: boolean; from?: string; token?: string }) =>
    httpClient.put<SmsCredentials>('/settings/sms-credentials', payload).then((r) => r.data),

  getWhatsAppCredentials: () =>
    httpClient.get<WhatsAppCredentials>('/settings/whatsapp-credentials').then((r) => r.data),

  updateWhatsAppCredentials: (payload: { enabled: boolean; phoneNumberId?: string; accessToken?: string }) =>
    httpClient.put<WhatsAppCredentials>('/settings/whatsapp-credentials', payload).then((r) => r.data),
};
