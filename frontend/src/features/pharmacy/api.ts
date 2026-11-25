import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  PharmacyItem,
  CreatePharmacyItemRequest,
  PharmacyBatch,
  PharmacyWholesaler,
  CreatePharmacyWholesalerRequest,
  PharmacyReseller,
  CreatePharmacyResellerRequest,
  PurchaseSummary,
  CreatePurchaseRequest,
  SaleReceipt,
  CreateDispenseRequest,
  PharmacyDashboardStats,
} from './types';

export const pharmacyApi = {
  stats: () => httpClient.get<PharmacyDashboardStats>('/pharmacy/stats').then((r) => r.data),

  items: {
    list: (params?: { query?: string; page?: number; size?: number }) =>
      httpClient.get<PageResponse<PharmacyItem>>('/pharmacy/items', { params }).then((r) => r.data),
    get: (id: number) => httpClient.get<PharmacyItem>(`/pharmacy/items/${id}`).then((r) => r.data),
    create: (payload: CreatePharmacyItemRequest) =>
      httpClient.post<PharmacyItem>('/pharmacy/items', payload).then((r) => r.data),
    update: (id: number, payload: CreatePharmacyItemRequest) =>
      httpClient.put<PharmacyItem>(`/pharmacy/items/${id}`, payload).then((r) => r.data),
    delete: (id: number) => httpClient.delete(`/pharmacy/items/${id}`).then(() => undefined),
  },

  batches: {
    list: () => httpClient.get<PharmacyBatch[]>('/pharmacy/batches').then((r) => r.data),
    byItem: (itemId: number) => httpClient.get<PharmacyBatch[]>(`/pharmacy/batches/item/${itemId}`).then((r) => r.data),
    expiring: (days = 60) => httpClient.get<PharmacyBatch[]>('/pharmacy/batches/expiring', { params: { days } }).then((r) => r.data),
    expired: () => httpClient.get<PharmacyBatch[]>('/pharmacy/batches/expired').then((r) => r.data),
    discard: (id: number) => httpClient.post(`/pharmacy/batches/${id}/discard`).then(() => undefined),
  },

  wholesalers: {
    list: () => httpClient.get<PharmacyWholesaler[]>('/pharmacy/wholesalers').then((r) => r.data),
    create: (payload: CreatePharmacyWholesalerRequest) =>
      httpClient.post<PharmacyWholesaler>('/pharmacy/wholesalers', payload).then((r) => r.data),
    update: (id: number, payload: CreatePharmacyWholesalerRequest) =>
      httpClient.put<PharmacyWholesaler>(`/pharmacy/wholesalers/${id}`, payload).then((r) => r.data),
    delete: (id: number) => httpClient.delete(`/pharmacy/wholesalers/${id}`).then(() => undefined),
  },

  resellers: {
    list: () => httpClient.get<PharmacyReseller[]>('/pharmacy/resellers').then((r) => r.data),
    create: (payload: CreatePharmacyResellerRequest) =>
      httpClient.post<PharmacyReseller>('/pharmacy/resellers', payload).then((r) => r.data),
    update: (id: number, payload: CreatePharmacyResellerRequest) =>
      httpClient.put<PharmacyReseller>(`/pharmacy/resellers/${id}`, payload).then((r) => r.data),
    delete: (id: number) => httpClient.delete(`/pharmacy/resellers/${id}`).then(() => undefined),
  },

  purchases: {
    list: (params?: { page?: number; size?: number }) =>
      httpClient.get<PageResponse<PurchaseSummary>>('/pharmacy/purchases', { params }).then((r) => r.data),
    create: (payload: CreatePurchaseRequest) =>
      httpClient.post<PurchaseSummary>('/pharmacy/purchases', payload).then((r) => r.data),
  },

  dispense: {
    listSales: (params?: { page?: number; size?: number }) =>
      httpClient.get<PageResponse<SaleReceipt>>('/pharmacy/sales', { params }).then((r) => r.data),
    getSale: (id: number) => httpClient.get<SaleReceipt>(`/pharmacy/sales/${id}`).then((r) => r.data),
    checkout: (payload: CreateDispenseRequest) =>
      httpClient.post<SaleReceipt>('/pharmacy/dispense', payload).then((r) => r.data),
  },
};
