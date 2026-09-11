import { httpClient } from '@/api/client';
import type { InitiateResponse, OnlinePayment, PaymentProvider, ProviderStatus } from './types';

export const paymentGatewaysApi = {
  providers: () => httpClient.get<ProviderStatus[]>('/payment-gateways').then((r) => r.data),

  initiate: (invoiceId: number, provider: PaymentProvider) =>
    httpClient.post<InitiateResponse>(`/invoices/${invoiceId}/online-payments/initiate`, { provider }).then((r) => r.data),

  verify: (onlinePaymentId: number) =>
    httpClient.post<OnlinePayment>(`/online-payments/${onlinePaymentId}/verify`).then((r) => r.data),

  listForInvoice: (invoiceId: number) =>
    httpClient.get<OnlinePayment[]>(`/invoices/${invoiceId}/online-payments`).then((r) => r.data),
};

/** eSewa requires an actual browser form POST, not a redirect — build and submit a hidden form to it. */
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
