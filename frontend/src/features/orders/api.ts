import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  OrderDetail,
  OrderListItem,
  OrderPricing,
  OrderStatus,
  PreviewPayload,
  SaveOrderPayload,
} from './types';

export interface OrderQuery {
  patientId?: number;
  status?: OrderStatus;
  query?: string;
  page?: number;
  size?: number;
}

export const ordersApi = {
  list: (params: OrderQuery) =>
    httpClient.get<PageResponse<OrderListItem>>('/orders', { params }).then((r) => r.data),

  get: (id: number) => httpClient.get<OrderDetail>(`/orders/${id}`).then((r) => r.data),

  preview: (payload: PreviewPayload) =>
    httpClient.post<OrderPricing>('/orders/preview', payload).then((r) => r.data),

  create: (payload: SaveOrderPayload) =>
    httpClient.post<OrderDetail>('/orders', payload).then((r) => r.data),

  update: (id: number, payload: SaveOrderPayload) =>
    httpClient.put<OrderDetail>(`/orders/${id}`, payload).then((r) => r.data),

  confirm: (id: number) => httpClient.post<OrderDetail>(`/orders/${id}/confirm`).then((r) => r.data),

  cancel: (id: number, reason: string) =>
    httpClient.post<OrderDetail>(`/orders/${id}/cancel`, { reason }).then((r) => r.data),
};
