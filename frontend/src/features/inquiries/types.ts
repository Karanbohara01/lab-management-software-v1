import type { Tone } from '@/components/ui/Badge';

export type TicketCategory =
  | 'TECHNICAL_ISSUE'
  | 'BILLING_AND_SUBSCRIPTION'
  | 'FEATURE_REQUEST'
  | 'DEVICE_INTEGRATION'
  | 'GENERAL_INQUIRY';

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING_ON_CLINIC' | 'RESOLVED' | 'CLOSED';

export type TicketSenderType = 'CLINIC' | 'SUPERADMIN';

export const CATEGORY_LABELS: Record<TicketCategory, string> = {
  TECHNICAL_ISSUE: 'Technical issue / Bug',
  BILLING_AND_SUBSCRIPTION: 'Billing & Subscription',
  FEATURE_REQUEST: 'Feature request',
  DEVICE_INTEGRATION: 'Device & Analyzer integration',
  GENERAL_INQUIRY: 'General inquiry',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  OPEN: 'Open',
  IN_PROGRESS: 'In Progress',
  WAITING_ON_CLINIC: 'Waiting on Clinic',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
};

export const STATUS_TONES: Record<TicketStatus, Tone> = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  WAITING_ON_CLINIC: 'neutral',
  RESOLVED: 'success',
  CLOSED: 'neutral',
};

export const PRIORITY_LABELS: Record<TicketPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const PRIORITY_TONES: Record<TicketPriority, Tone> = {
  LOW: 'neutral',
  MEDIUM: 'info',
  HIGH: 'warning',
  URGENT: 'critical',
};

export interface TicketMessage {
  id: number;
  senderUserId: number;
  senderName: string;
  senderType: TicketSenderType;
  message: string;
  internalNote: boolean;
  createdAt: string;
  hasAttachment?: boolean;
  fileName?: string | null;
  fileType?: string | null;
  fileSizeBytes?: number | null;
}

export interface TicketSummary {
  id: number;
  ticketNumber: string;
  organizationId: number;
  organizationName?: string | null;
  createdByName: string;
  assignedToName?: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  lastReplyAt: string;
  createdAt: string;
  messageCount: number;
  clinicHasUnread?: boolean;
}

export interface TicketDetail {
  id: number;
  ticketNumber: string;
  organizationId: number;
  organizationName?: string | null;
  organizationPhone?: string | null;
  organizationEmail?: string | null;
  createdByUserId?: number | null;
  createdByName: string;
  assignedToUserId?: number | null;
  assignedToName?: string | null;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  lastReplyAt: string;
  resolvedAt?: string | null;
  closedAt?: string | null;
  createdAt: string;
  clinicHasUnread?: boolean;
  messages: TicketMessage[];
}

export interface CreateTicketRequest {
  subject: string;
  category: TicketCategory;
  priority?: TicketPriority;
  message: string;
  file?: File | null;
}

export interface AddMessageRequest {
  message: string;
  internalNote?: boolean;
  file?: File | null;
}

export interface UnreadCountResponse {
  count: number;
}

export interface UpdateTicketStatusRequest {
  status: TicketStatus;
  priority?: TicketPriority;
  assignedToUserId?: number;
}

export interface PlatformTicketStats {
  openTickets: number;
  inProgressTickets: number;
  urgentTickets: number;
  resolvedTickets: number;
  totalTickets: number;
}
