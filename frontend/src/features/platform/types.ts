export type OrganizationStatus = 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED';
export type SubscriptionStatus = 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'SUSPENDED' | 'CANCELLED';

export interface Plan {
  id: number;
  code: string;
  name: string;
  priceMonthly: number;
  maxUsers: number;
  maxBranches: number;
  description: string | null;
  active: boolean;
  displayOrder: number;
}

export interface Subscription {
  id: number;
  plan: Plan;
  status: SubscriptionStatus;
  startedAt: string;
  currentPeriodEnd: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  note: string | null;
}

export interface OrganizationListItem {
  id: number;
  slug: string;
  name: string;
  contactEmail: string | null;
  city: string | null;
  status: OrganizationStatus;
  planName: string | null;
  subscriptionStatus: SubscriptionStatus | null;
  createdAt: string;
  patientCount: number;
  userCount: number;
}

export interface OrganizationDetail {
  id: number;
  slug: string;
  name: string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  city: string | null;
  pan: string | null;
  status: OrganizationStatus;
  notes: string | null;
  createdAt: string;
  subscriptionHistory: Subscription[];
}

export interface SignupPoint {
  month: string;
  count: number;
}

export interface PlanDistributionPoint {
  planCode: string;
  planName: string;
  count: number;
}

export interface UpcomingRenewal {
  organizationId: number;
  organizationName: string;
  planName: string;
  status: SubscriptionStatus;
  currentPeriodEnd: string;
}

export interface RecentClinic {
  id: number;
  name: string;
  slug: string;
  status: OrganizationStatus;
  planName: string | null;
  createdAt: string;
}

export interface IntegrationAdoption {
  totalOrganizations: number;
  paymentConfigured: number;
  irdConfigured: number;
  smsConfigured: number;
}

export interface PlatformDashboard {
  signupsByMonth: SignupPoint[];
  planDistribution: PlanDistributionPoint[];
  upcomingRenewals: UpcomingRenewal[];
  recentClinics: RecentClinic[];
  integrationAdoption: IntegrationAdoption;
}

export interface PlatformSummary {
  totalOrganizations: number;
  trialOrganizations: number;
  activeOrganizations: number;
  suspendedOrganizations: number;
  activeSubscriptions: number;
  pastDueSubscriptions: number;
  monthlyRecurringRevenue: number;
}

export const ORG_STATUS_LABEL: Record<OrganizationStatus, string> = {
  TRIAL: 'Trial',
  ACTIVE: 'Active',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
};

export const ORG_STATUS_TONE: Record<OrganizationStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  TRIAL: 'info',
  ACTIVE: 'success',
  SUSPENDED: 'warning',
  CANCELLED: 'danger',
};

export const SUBSCRIPTION_STATUS_LABEL: Record<SubscriptionStatus, string> = {
  TRIALING: 'Trialing',
  ACTIVE: 'Active',
  PAST_DUE: 'Past due',
  SUSPENDED: 'Suspended',
  CANCELLED: 'Cancelled',
};

export const SUBSCRIPTION_STATUS_TONE: Record<SubscriptionStatus, 'neutral' | 'info' | 'success' | 'warning' | 'danger'> = {
  TRIALING: 'info',
  ACTIVE: 'success',
  PAST_DUE: 'warning',
  SUSPENDED: 'warning',
  CANCELLED: 'danger',
};
