import { httpClient } from '@/api/client';
import type { InvoiceDetail } from '@/features/billing/types';
import type { ReportDetail } from '@/features/reports/types';
import type { PortalSummary } from './types';

/**
 * Public, unauthenticated — the token in the path is the credential (see
 * PatientPortalController's javadoc). Same call shape as reportsApi.verify, which already proves
 * an unauthenticated GET through this httpClient works fine without a forced login redirect.
 */
export const portalApi = {
  summary: (token: string) => httpClient.get<PortalSummary>(`/patient-portal/${token}`).then((r) => r.data),

  report: (token: string, reportId: number) =>
    httpClient.get<ReportDetail>(`/patient-portal/${token}/reports/${reportId}`).then((r) => r.data),

  invoice: (token: string, invoiceId: number) =>
    httpClient.get<InvoiceDetail>(`/patient-portal/${token}/invoices/${invoiceId}`).then((r) => r.data),
};
