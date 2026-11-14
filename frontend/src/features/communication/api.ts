import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  AutomationRule,
  Campaign,
  CampaignRecipient,
  Dashboard,
  FollowUp,
  GatewayStatus,
  OptOut,
  RecipientFilter,
  RecipientPreview,
  SamayaConfig,
  SendSmsResult,
  SmsAutomationEvent,
  SmsBalance,
  SmsCategory,
  SmsMessage,
  SmsMessageStatus,
  SmsProvider,
  SmsTemplate,
} from './types';

export interface HistoryQuery {
  from?: string;
  to?: string;
  patientId?: number;
  phone?: string;
  category?: SmsCategory;
  status?: SmsMessageStatus;
  campaignId?: number;
  sentBy?: string;
  page?: number;
  size?: number;
}

export const communicationApi = {
  dashboard: () => httpClient.get<Dashboard>('/communication/dashboard').then((r) => r.data),

  // ----- Templates --------------------------------------------------------------------
  templates: {
    list: () => httpClient.get<SmsTemplate[]>('/communication/templates').then((r) => r.data),
    create: (payload: { name: string; category: SmsCategory; body: string }) =>
      httpClient.post<SmsTemplate>('/communication/templates', payload).then((r) => r.data),
    update: (id: number, payload: { name: string; category: SmsCategory; body: string }) =>
      httpClient.put<SmsTemplate>(`/communication/templates/${id}`, payload).then((r) => r.data),
    setActive: (id: number, active: boolean) =>
      httpClient.put<SmsTemplate>(`/communication/templates/${id}/active`, { active }).then((r) => r.data),
  },

  // ----- Automation rules --------------------------------------------------------------
  automationRules: {
    list: () => httpClient.get<AutomationRule[]>('/communication/automation-rules').then((r) => r.data),
    update: (
      eventType: SmsAutomationEvent,
      payload: { enabled: boolean; templateId: number | null; reminderOffsetHours: number | null },
    ) => httpClient.put<AutomationRule>(`/communication/automation-rules/${eventType}`, payload).then((r) => r.data),
  },

  // ----- Individual send / history -----------------------------------------------------
  messages: {
    send: (payload: {
      patientId?: number;
      phone: string;
      recipientName?: string;
      category: SmsCategory;
      templateId?: number;
      messageBody?: string;
    }) => httpClient.post<SendSmsResult>('/communication/messages/send', payload).then((r) => r.data),

    history: (q: HistoryQuery) =>
      httpClient.get<PageResponse<SmsMessage>>('/communication/messages', { params: q }).then((r) => r.data),

    forPatient: (patientId: number) =>
      httpClient.get<SmsMessage[]>(`/communication/messages/by-patient/${patientId}`).then((r) => r.data),

    resend: (id: number) => httpClient.post<SendSmsResult>(`/communication/messages/${id}/resend`).then((r) => r.data),
  },

  // ----- Campaigns -----------------------------------------------------------------------
  campaigns: {
    list: (page = 0, size = 20) =>
      httpClient.get<PageResponse<Campaign>>('/communication/campaigns', { params: { page, size } }).then((r) => r.data),
    get: (id: number) => httpClient.get<Campaign>(`/communication/campaigns/${id}`).then((r) => r.data),
    recipients: (id: number, page = 0, size = 50) =>
      httpClient
        .get<PageResponse<CampaignRecipient>>(`/communication/campaigns/${id}/recipients`, { params: { page, size } })
        .then((r) => r.data),
    preview: (payload: { recipientFilter: RecipientFilter; messageBody: string }) =>
      httpClient.post<RecipientPreview>('/communication/campaigns/preview', payload).then((r) => r.data),
    create: (payload: {
      name: string;
      templateId?: number;
      messageBody: string;
      category: SmsCategory;
      recipientFilter: RecipientFilter;
    }) => httpClient.post<Campaign>('/communication/campaigns', payload).then((r) => r.data),
    confirm: (id: number, payload: { scheduledAt?: string; timeZone?: string }) =>
      httpClient.post<Campaign>(`/communication/campaigns/${id}/confirm`, payload).then((r) => r.data),
    cancel: (id: number) => httpClient.post<Campaign>(`/communication/campaigns/${id}/cancel`).then((r) => r.data),
    retryFailed: (id: number) => httpClient.post<Campaign>(`/communication/campaigns/${id}/retry-failed`).then((r) => r.data),
  },

  // ----- Follow-ups -----------------------------------------------------------------------
  followUps: {
    forPatient: (patientId: number) =>
      httpClient.get<FollowUp[]>(`/communication/follow-ups/by-patient/${patientId}`).then((r) => r.data),
    create: (payload: { patientId: number; dueDate: string; reason?: string }) =>
      httpClient.post<FollowUp>('/communication/follow-ups', payload).then((r) => r.data),
    markDone: (id: number) => httpClient.post(`/communication/follow-ups/${id}/done`).then((r) => r.data),
    cancel: (id: number) => httpClient.post(`/communication/follow-ups/${id}/cancel`).then((r) => r.data),
  },

  // ----- Gateway configuration -----------------------------------------------------------
  config: {
    gatewayStatuses: () => httpClient.get<GatewayStatus[]>('/communication/config/gateways').then((r) => r.data),
    getSamaya: () => httpClient.get<SamayaConfig>('/communication/config/samaya').then((r) => r.data),
    updateSamaya: (payload: { enabled: boolean; baseUrl?: string; senderId?: string; apiKey?: string }) =>
      httpClient.put<SamayaConfig>('/communication/config/samaya', payload).then((r) => r.data),
    balance: (provider: SmsProvider) =>
      httpClient.get<SmsBalance>(`/communication/config/${provider}/balance`).then((r) => r.data),
    sendTest: (provider: SmsProvider, phone: string) =>
      httpClient.post<SendSmsResult>(`/communication/config/${provider}/test-sms`, { phone }).then((r) => r.data),
    getLowBalanceThreshold: () =>
      httpClient.get<number | null>('/communication/config/low-balance-threshold').then((r) => r.data),
    updateLowBalanceThreshold: (threshold: number | null) =>
      httpClient.put<number | null>('/communication/config/low-balance-threshold', { threshold }).then((r) => r.data),
  },

  // ----- Opt-outs (do-not-contact list) ---------------------------------------------------
  optOuts: {
    list: (page = 0, size = 25) =>
      httpClient.get<PageResponse<OptOut>>('/communication/opt-outs', { params: { page, size } }).then((r) => r.data),
    add: (payload: { phone: string; patientId?: number; reason?: string; note?: string }) =>
      httpClient.post<OptOut>('/communication/opt-outs', payload).then((r) => r.data),
    remove: (id: number) => httpClient.delete(`/communication/opt-outs/${id}`).then((r) => r.data),
  },
};
