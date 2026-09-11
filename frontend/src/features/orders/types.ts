export type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'CANCELLED';
export type DiscountType = 'NONE' | 'PERCENT' | 'AMOUNT';
export type OrderItemStatus = 'PENDING' | 'CANCELLED';

export interface OrderPricing {
  subtotal: number;
  discountType: DiscountType;
  discountValue: number;
  discountAmount: number;
  taxableAmount: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
}

export interface OrderItem {
  id: number;
  testId: number;
  testCode: string;
  testName: string;
  departmentName: string;
  unitPrice: number;
  quantity: number;
  lineDiscount: number;
  lineTotal: number;
  status: OrderItemStatus;
}

export type OrderPriority = 'ROUTINE' | 'URGENT' | 'STAT';

export interface OrderListItem {
  id: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  branchId: number;
  branchName: string;
  status: OrderStatus;
  priority: OrderPriority;
  itemCount: number;
  totalAmount: number;
  orderedAt: string;
}

export interface OrderDetail {
  id: number;
  orderNumber: string;
  patientId: number;
  patientName: string;
  patientMrn: string;
  branchId: number;
  branchName: string;
  referringDoctorId: number | null;
  referringDoctorName: string | null;
  status: OrderStatus;
  priority: OrderPriority;
  clinicalNotes: string | null;
  orderedAt: string;
  confirmedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  items: OrderItem[];
  pricing: OrderPricing;
}

export interface OrderItemPayload {
  testId: number;
  quantity: number;
  lineDiscount: number;
}

export interface SaveOrderPayload {
  patientId: number;
  /** Omit for HQ default resolution: explicit request > actor's home branch > first active branch. */
  branchId?: number | null;
  referringDoctorId?: number | null;
  clinicalNotes?: string;
  priority?: OrderPriority;
  items: OrderItemPayload[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
  confirm: boolean;
}

export interface PreviewPayload {
  items: OrderItemPayload[];
  discountType: DiscountType;
  discountValue: number;
  taxRate: number;
}

export const ORDER_STATUS_TONE: Record<OrderStatus, 'neutral' | 'info' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  CONFIRMED: 'success',
  CANCELLED: 'danger',
};
