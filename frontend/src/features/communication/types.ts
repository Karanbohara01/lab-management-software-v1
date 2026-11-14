export type SmsCategory =
  | 'APPOINTMENT'
  | 'REGISTRATION'
  | 'LABORATORY'
  | 'PAYMENT'
  | 'REPORT_READY'
  | 'FOLLOW_UP'
  | 'GENERAL_ANNOUNCEMENT'
  | 'PROMOTIONAL'
  | 'CUSTOM';

export const SMS_CATEGORY_LABEL: Record<SmsCategory, string> = {
  APPOINTMENT: 'Appointment',
  REGISTRATION: 'Registration',
  LABORATORY: 'Laboratory',
  PAYMENT: 'Payment',
  REPORT_READY: 'Report ready',
  FOLLOW_UP: 'Follow-up',
  GENERAL_ANNOUNCEMENT: 'General announcement',
  PROMOTIONAL: 'Promotional',
  CUSTOM: 'Custom',
};

export type SmsProvider = 'SAMAYA' | 'SPARROW';

export const SMS_PROVIDER_LABEL: Record<SmsProvider, string> = {
  SAMAYA: 'Samaya SMS',
  SPARROW: 'Sparrow SMS',
};

export type SmsMessageStatus = 'QUEUED' | 'SENT' | 'DELIVERED' | 'FAILED';

export const SMS_MESSAGE_STATUS_LABEL: Record<SmsMessageStatus, string> = {
  QUEUED: 'Queued',
  SENT: 'Sent',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
};

export type SmsCampaignStatus =
  | 'DRAFT'
  | 'SCHEDULED'
  | 'QUEUED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'PARTIALLY_COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export const SMS_CAMPAIGN_STATUS_LABEL: Record<SmsCampaignStatus, string> = {
  DRAFT: 'Draft',
  SCHEDULED: 'Scheduled',
  QUEUED: 'Queued',
  PROCESSING: 'Sending',
  COMPLETED: 'Completed',
  PARTIALLY_COMPLETED: 'Partially completed',
  FAILED: 'Failed',
  CANCELLED: 'Cancelled',
};

export type SmsRecipientStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'SKIPPED_DUPLICATE'
  | 'SKIPPED_INVALID'
  | 'SKIPPED_OPTED_OUT';

export type SmsRecipientFilterType =
  | 'ALL_PATIENTS'
  | 'REGISTERED_IN_RANGE'
  | 'VISITED_IN_RANGE'
  | 'UPCOMING_APPOINTMENTS'
  | 'NOT_VISITED_IN_DAYS'
  | 'DEPARTMENT_OR_CATEGORY'
  | 'MANUAL_SELECTION'
  | 'FILE_IMPORT'
  | 'CUSTOM_PHONE_LIST';

export const RECIPIENT_FILTER_LABEL: Record<SmsRecipientFilterType, string> = {
  ALL_PATIENTS: 'All patients',
  REGISTERED_IN_RANGE: 'Registered in a date range',
  VISITED_IN_RANGE: 'Visited in a date range',
  UPCOMING_APPOINTMENTS: 'Have an upcoming appointment',
  NOT_VISITED_IN_DAYS: 'Not visited in N days',
  DEPARTMENT_OR_CATEGORY: 'Ordered tests in a department',
  MANUAL_SELECTION: 'Manually selected patients',
  FILE_IMPORT: 'Import from CSV / Excel',
  CUSTOM_PHONE_LIST: 'Custom phone number list',
};

export type SmsAutomationEvent =
  | 'PATIENT_REGISTERED'
  | 'APPOINTMENT_BOOKED'
  | 'APPOINTMENT_RESCHEDULED'
  | 'APPOINTMENT_CANCELLED'
  | 'APPOINTMENT_REMINDER'
  | 'LAB_ORDER_CONFIRMED'
  | 'REPORT_READY'
  | 'PAYMENT_COMPLETED'
  | 'FOLLOW_UP_DUE';

export const AUTOMATION_EVENT_LABEL: Record<SmsAutomationEvent, string> = {
  PATIENT_REGISTERED: 'Patient registered',
  APPOINTMENT_BOOKED: 'Appointment booked',
  APPOINTMENT_RESCHEDULED: 'Appointment rescheduled',
  APPOINTMENT_CANCELLED: 'Appointment cancelled',
  APPOINTMENT_REMINDER: 'Appointment reminder',
  LAB_ORDER_CONFIRMED: 'Lab order confirmed',
  REPORT_READY: 'Report ready',
  PAYMENT_COMPLETED: 'Payment completed',
  FOLLOW_UP_DUE: 'Follow-up due',
};

export const AUTOMATION_EVENT_DESCRIPTION: Record<SmsAutomationEvent, string> = {
  PATIENT_REGISTERED: 'Sent once, right after a new patient is registered.',
  APPOINTMENT_BOOKED: 'Sent when an appointment is booked.',
  APPOINTMENT_RESCHEDULED: 'Sent when an appointment is rescheduled.',
  APPOINTMENT_CANCELLED: 'Sent when an appointment is cancelled.',
  APPOINTMENT_REMINDER: 'Sent a configurable number of hours before a scheduled appointment.',
  LAB_ORDER_CONFIRMED: 'Sent once a lab order is confirmed.',
  REPORT_READY: 'Sent once a report is signed and released.',
  PAYMENT_COMPLETED: "Sent once an invoice's balance reaches zero — not on a partial payment.",
  FOLLOW_UP_DUE: "Sent when a patient's scheduled follow-up date arrives.",
};

export type FollowUpStatus = 'PENDING' | 'DONE' | 'CANCELLED';

export interface SmsTemplate {
  id: number;
  name: string;
  category: SmsCategory;
  body: string;
  active: boolean;
  characterCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationRule {
  id: number | null;
  eventType: SmsAutomationEvent;
  eventLabel: string;
  enabled: boolean;
  templateId: number | null;
  templateName: string | null;
  reminderOffsetHours: number | null;
  firedCount: number;
  failedCount: number;
}

export interface RawRecipient {
  phone: string;
  name?: string;
}

export interface RecipientFilter {
  type: SmsRecipientFilterType;
  from?: string;
  to?: string;
  notVisitedDays?: number;
  departmentName?: string;
  patientIds?: number[];
  rawRecipients?: RawRecipient[];
}

export interface RecipientPreview {
  recipientCount: number;
  invalidPhoneCount: number;
  optedOutCount: number;
  capped: boolean;
  estimatedSegments: number;
  encoding: string;
  estimatedCreditsPerRecipient: number;
}

export interface Campaign {
  id: number;
  campaignNumber: string;
  name: string;
  category: SmsCategory;
  status: SmsCampaignStatus;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  estimatedSegments: number;
  scheduledAt: string | null;
  timeZone: string;
  cancelRequested: boolean;
  failureMessage: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  createdBy: string | null;
}

export interface CampaignRecipient {
  id: number;
  patientId: number | null;
  phone: string;
  name: string | null;
  sequenceNo: number;
  status: SmsRecipientStatus;
  errorMessage: string | null;
  processedAt: string | null;
}

export interface SmsMessage {
  id: number;
  patientId: number | null;
  recipientPhone: string;
  recipientName: string | null;
  category: SmsCategory;
  messageBody: string;
  segmentCount: number;
  encoding: string;
  provider: SmsProvider;
  status: SmsMessageStatus;
  providerReference: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  sentBy: string | null;
  sentAt: string | null;
  createdAt: string;
  campaignId: number | null;
  campaignNumber: string | null;
}

export interface SendSmsResult {
  sent: boolean;
  message: SmsMessage;
  errorMessage: string | null;
}

export interface GatewayStatus {
  provider: SmsProvider;
  label: string;
  configured: boolean;
}

export interface Dashboard {
  totalMessages: number;
  delivered: number;
  sent: number;
  failed: number;
  pending: number;
  segmentsToday: number;
  segmentsThisMonth: number;
  campaignsConducted: number;
  deliverySuccessRatePercent: number;
  gateways: GatewayStatus[];
}

export interface FollowUp {
  id: number;
  patientId: number;
  patientName: string;
  dueDate: string;
  reason: string | null;
  status: FollowUpStatus;
  reminderSentAt: string | null;
  createdAt: string;
}

export interface SamayaConfig {
  enabled: boolean;
  baseUrl: string | null;
  senderId: string | null;
  hasApiKey: boolean;
}

export interface SmsBalance {
  available: boolean;
  balance: number | null;
  rawResponse: string | null;
  errorMessage: string | null;
}

export interface OptOut {
  id: number;
  phone: string;
  patientId: number | null;
  patientName: string | null;
  reason: string | null;
  note: string | null;
  createdAt: string;
  createdBy: string | null;
}
