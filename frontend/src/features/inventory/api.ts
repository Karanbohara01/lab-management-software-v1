import { httpClient } from '@/api/client';
import type { PageResponse } from '@/types/api';
import type {
  InventoryItemDetail,
  InventoryItemListItem,
  InventorySummary,
  ItemCategory,
  PurchaseOrderDetail,
  PurchaseOrderListItem,
  PurchaseOrderStatus,
  StockTransaction,
  Supplier,
} from './types';

export const suppliersApi = {
  list: (params: { query?: string; activeOnly?: boolean; page?: number; size?: number }) =>
    httpClient.get<PageResponse<Supplier>>('/suppliers', { params }).then((r) => r.data),
  active: () => httpClient.get<Supplier[]>('/suppliers/active').then((r) => r.data),
  create: (payload: Partial<Supplier> & { name: string }) =>
    httpClient.post<Supplier>('/suppliers', payload).then((r) => r.data),
  update: (id: number, payload: Partial<Supplier> & { name: string }) =>
    httpClient.put<Supplier>(`/suppliers/${id}`, payload).then((r) => r.data),
  setActive: (id: number, value: boolean) =>
    httpClient.patch(`/suppliers/${id}/active`, null, { params: { value } }).then(() => undefined),
};

export interface ItemQuery {
  query?: string;
  category?: ItemCategory;
  departmentId?: number;
  activeOnly?: boolean;
  page?: number;
  size?: number;
}

export const inventoryApi = {
  list: (params: ItemQuery) =>
    httpClient.get<PageResponse<InventoryItemListItem>>('/inventory/items', { params }).then((r) => r.data),
  summary: () => httpClient.get<InventorySummary>('/inventory/summary').then((r) => r.data),
  get: (id: number) => httpClient.get<InventoryItemDetail>(`/inventory/items/${id}`).then((r) => r.data),
  transactions: (id: number, page = 0) =>
    httpClient
      .get<PageResponse<StockTransaction>>(`/inventory/items/${id}/transactions`, { params: { page, size: 30 } })
      .then((r) => r.data),
  create: (payload: unknown) => httpClient.post<InventoryItemDetail>('/inventory/items', payload).then((r) => r.data),
  update: (id: number, payload: unknown) =>
    httpClient.put<InventoryItemDetail>(`/inventory/items/${id}`, payload).then((r) => r.data),
  setActive: (id: number, value: boolean) =>
    httpClient.patch<InventoryItemDetail>(`/inventory/items/${id}/active`, null, { params: { value } }).then((r) => r.data),
  receive: (id: number, payload: unknown) =>
    httpClient.post<InventoryItemDetail>(`/inventory/items/${id}/receive`, payload).then((r) => r.data),
  issue: (id: number, payload: { quantity: number; reason: string; reference?: string }) =>
    httpClient.post<InventoryItemDetail>(`/inventory/items/${id}/issue`, payload).then((r) => r.data),
  adjustBatch: (batchId: number, payload: { newQuantity: number; reason: string }) =>
    httpClient.post<InventoryItemDetail>(`/inventory/batches/${batchId}/adjust`, payload).then((r) => r.data),
  discardBatch: (batchId: number, reason: string) =>
    httpClient.post<InventoryItemDetail>(`/inventory/batches/${batchId}/discard`, { reason }).then((r) => r.data),
};

export const purchaseOrdersApi = {
  list: (params: { status?: PurchaseOrderStatus; query?: string; page?: number; size?: number }) =>
    httpClient.get<PageResponse<PurchaseOrderListItem>>('/purchase-orders', { params }).then((r) => r.data),
  get: (id: number) => httpClient.get<PurchaseOrderDetail>(`/purchase-orders/${id}`).then((r) => r.data),
  create: (payload: unknown) => httpClient.post<PurchaseOrderDetail>('/purchase-orders', payload).then((r) => r.data),
  update: (id: number, payload: unknown) =>
    httpClient.put<PurchaseOrderDetail>(`/purchase-orders/${id}`, payload).then((r) => r.data),
  submit: (id: number) => httpClient.post<PurchaseOrderDetail>(`/purchase-orders/${id}/submit`).then((r) => r.data),
  receive: (id: number, payload: unknown) =>
    httpClient.post<PurchaseOrderDetail>(`/purchase-orders/${id}/receive`, payload).then((r) => r.data),
  cancel: (id: number, reason: string) =>
    httpClient.post<PurchaseOrderDetail>(`/purchase-orders/${id}/cancel`, { reason }).then((r) => r.data),
};
