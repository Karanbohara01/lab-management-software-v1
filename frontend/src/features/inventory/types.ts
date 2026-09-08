export type ItemCategory =
  | 'REAGENT'
  | 'TEST_KIT'
  | 'CHEMICAL'
  | 'CONTROL'
  | 'CALIBRATOR'
  | 'CONSUMABLE'
  | 'GLASSWARE'
  | 'OTHER';

export type StockStatus = 'EXPIRED' | 'OUT_OF_STOCK' | 'LOW_STOCK' | 'EXPIRING_SOON' | 'IN_STOCK';

export type PurchaseOrderStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'PARTIALLY_RECEIVED'
  | 'RECEIVED'
  | 'CANCELLED';

export interface Supplier {
  id: number;
  name: string;
  contactPerson: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  panNumber: string | null;
  active: boolean;
}

export interface InventoryBatch {
  id: number;
  batchNumber: string;
  supplierName: string | null;
  receivedDate: string;
  expiryDate: string | null;
  initialQuantity: number;
  remainingQuantity: number;
  unitCost: number | null;
  expired: boolean;
  expiringSoon: boolean;
}

export interface StockTransaction {
  id: number;
  type: string;
  quantity: number;
  balanceAfter: number;
  batchNumber: string | null;
  reason: string | null;
  reference: string | null;
  performedBy: string;
  occurredAt: string;
}

export interface InventoryItemListItem {
  id: number;
  code: string;
  name: string;
  category: ItemCategory;
  unit: string;
  quantityOnHand: number;
  minimumStock: number;
  departmentName: string | null;
  status: StockStatus;
  active: boolean;
}

export interface InventoryItemDetail {
  id: number;
  code: string;
  name: string;
  category: ItemCategory;
  unit: string;
  quantityOnHand: number;
  minimumStock: number;
  departmentId: number | null;
  departmentName: string | null;
  notes: string | null;
  status: StockStatus;
  active: boolean;
  batches: InventoryBatch[];
}

export interface InventorySummary {
  statusCounts: Record<string, number>;
  alerts: InventoryItemListItem[];
}

export interface PoLine {
  id: number;
  itemId: number;
  itemCode: string;
  itemName: string;
  unit: string;
  quantityOrdered: number;
  quantityReceived: number;
  estimatedUnitCost: number | null;
}

export interface PurchaseOrderListItem {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  lineCount: number;
  expectedDate: string | null;
  createdAt: string;
}

export interface PurchaseOrderDetail {
  id: number;
  poNumber: string;
  supplierId: number;
  supplierName: string;
  status: PurchaseOrderStatus;
  expectedDate: string | null;
  notes: string | null;
  cancelReason: string | null;
  submittedAt: string | null;
  receivedAt: string | null;
  lines: PoLine[];
}

export const CATEGORY_LABEL: Record<ItemCategory, string> = {
  REAGENT: 'Reagent',
  TEST_KIT: 'Test kit',
  CHEMICAL: 'Chemical',
  CONTROL: 'Control',
  CALIBRATOR: 'Calibrator',
  CONSUMABLE: 'Consumable',
  GLASSWARE: 'Glassware',
  OTHER: 'Other',
};

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  EXPIRED: 'Expired stock',
  OUT_OF_STOCK: 'Out of stock',
  LOW_STOCK: 'Low stock',
  EXPIRING_SOON: 'Expiring soon',
  IN_STOCK: 'In stock',
};

export const STOCK_STATUS_TONE: Record<StockStatus, 'neutral' | 'success' | 'warning' | 'danger' | 'critical'> = {
  EXPIRED: 'critical',
  OUT_OF_STOCK: 'danger',
  LOW_STOCK: 'warning',
  EXPIRING_SOON: 'warning',
  IN_STOCK: 'success',
};

export const PO_STATUS_TONE: Record<PurchaseOrderStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  DRAFT: 'neutral',
  SUBMITTED: 'info',
  PARTIALLY_RECEIVED: 'warning',
  RECEIVED: 'success',
  CANCELLED: 'danger',
};
