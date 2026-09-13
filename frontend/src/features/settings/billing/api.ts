import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type { MySubscription, SubscriptionInvoice } from './types';

export interface InitiateCheckoutResponse {
  success: boolean;
  formAction: string | null;
  formFields: Record<string, string> | null;
  errorMessage: string | null;
}

export const subscriptionBillingApi = {
  mySubscription: () => httpClient.get<MySubscription>('/billing/subscription').then((r) => r.data),

  changePlan: (planCode: string) =>
    httpClient.post<MySubscription>('/billing/subscription/change-plan', { planCode }).then((r) => r.data),

  invoices: (page = 0, size = 20) =>
    httpClient
      .get<PageResponse<SubscriptionInvoice>>('/billing/subscription/invoices', { params: { page, size } })
      .then((r) => r.data),

  get: (id: number) => httpClient.get<SubscriptionInvoice>(`/billing/subscription/invoices/${id}`).then((r) => r.data),

  pay: (id: number) =>
    httpClient.post<InitiateCheckoutResponse>(`/billing/subscription/invoices/${id}/pay`).then((r) => r.data),

  verify: (id: number) =>
    httpClient.post<SubscriptionInvoice>(`/billing/subscription/invoices/${id}/verify`).then((r) => r.data),
};

/** Auto-submits a hidden POST form — eSewa requires a real form submission, not a GET redirect. */
export function submitEsewaForm(action: string, fields: Record<string, string>) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = action;
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = name;
    input.value = value;
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
}
