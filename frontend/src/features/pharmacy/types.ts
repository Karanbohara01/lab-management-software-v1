export type PharmacyItemCategory =
  | 'ALLOPATHIC'
  | 'SKINCARE'
  | 'AYURVEDIC'
  | 'SURGICAL'
  | 'NUTRACEUTICAL'
  | 'OTHER';

export type PharmacyDosageForm =
  | 'TABLET'
  | 'CAPSULE'
  | 'SYRUP'
  | 'INJECTION'
  | 'CREAM'
  | 'OINTMENT'
  | 'GEL'
  | 'LOTION'
  | 'DROPS'
  | 'POWDER'
  | 'INHALER'
  | 'BANDAGE'
  | 'PIECE'
  | 'OTHER';

export interface PharmacyItem {
  id: number;
  name: string;
  genericName?: string;
  category: PharmacyItemCategory;
  dosageForm: PharmacyDosageForm;
  strength?: string;
  manufacturer?: string;
  packUnit: string;
  dispensingUnit: string;
  packSize: number;
  hsCode?: string;
  isVatApplicable: boolean;
  vatPercentage: number;
  schedule?: string;
  rackLocation?: string;
  minStockLevel: number;
  isActive: boolean;
  barcode?: string;
  totalStockUnits: number;
  totalStockPacks: number;
  latestMrpPerPack: number;
  latestUnitMrp: number;
}

export interface CreatePharmacyItemRequest {
  name: string;
  genericName?: string;
  category: PharmacyItemCategory;
  dosageForm: PharmacyDosageForm;
  strength?: string;
  manufacturer?: string;
  packUnit: string;
  dispensingUnit: string;
  packSize: number;
  hsCode?: string;
  isVatApplicable: boolean;
  vatPercentage: number;
  schedule?: string;
  rackLocation?: string;
  minStockLevel?: number;
  barcode?: string;
}

export interface PharmacyBatch {
  id: number;
  itemId: number;
  itemName: string;
  genericName?: string;
  wholesalerId?: number;
  wholesalerName?: string;
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string;
  packSize: number;
  initialUnits: number;
  remainingUnits: number;
  remainingPacks: number;
  remainingLooseUnits: number;
  purchaseRatePerPack: number;
  effectiveCostPerUnit: number;
  mrpPerPack: number;
  unitMrp: number;
  wholesaleRatePerPack?: number;
  rackLocation?: string;
  isExpired: boolean;
  isExpiringSoon: boolean;
}

export interface PharmacyWholesaler {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  panVatNumber?: string;
  ddaRegistrationNo?: string;
  creditPeriodDays: number;
  isActive: boolean;
}

export interface CreatePharmacyWholesalerRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  panVatNumber?: string;
  ddaRegistrationNo?: string;
  creditPeriodDays?: number;
}

export interface PharmacyReseller {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  panVatNumber?: string;
  discountPercentage: number;
  creditLimit: number;
  currentBalance: number;
  isActive: boolean;
}

export interface CreatePharmacyResellerRequest {
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  panVatNumber?: string;
  discountPercentage?: number;
  creditLimit?: number;
}

export interface PurchaseItemRequest {
  itemId: number;
  batchNumber: string;
  mfgDate?: string;
  expiryDate: string;
  packSize?: number;
  billedPackQty: number;
  freePackQty?: number;
  purchaseRatePerPack: number;
  discountPercentage?: number;
  isVatApplicable?: boolean;
  vatPercentage?: number;
  mrpPerPack: number;
  wholesaleRatePerPack?: number;
}

export interface CreatePurchaseRequest {
  wholesalerId: number;
  wholesalerInvoiceNo: string;
  invoiceDate: string;
  receivedDate?: string;
  carrierCharges?: number;
  otherCharges?: number;
  notes?: string;
  items: PurchaseItemRequest[];
}

export interface PurchaseSummary {
  id: number;
  purchaseNumber: string;
  wholesalerId: number;
  wholesalerName: string;
  wholesalerInvoiceNo: string;
  invoiceDate: string;
  receivedDate: string;
  subtotal: number;
  discountAmount: number;
  carrierCharges: number;
  vatAmount: number;
  netTotal: number;
  paymentStatus: string;
  itemCount: number;
}

export interface DispenseItemRequest {
  itemId: number;
  batchId?: number;
  unitType: 'PACK' | 'UNIT';
  quantity: number;
  dosageInstruction?: string;
}

export interface CreateDispenseRequest {
  saleType: 'RETAIL' | 'RESELLER_WHOLESALE';
  patientId?: number;
  customerName: string;
  customerPhone?: string;
  doctorId?: number;
  doctorName?: string;
  resellerId?: number;
  paymentMethod: 'CASH' | 'QR_FONEPAY' | 'CARD' | 'CREDIT';
  paidAmount?: number;
  refillReminderDays?: number;
  notes?: string;
  items: DispenseItemRequest[];
}

export interface SaleReceiptItem {
  itemId: number;
  itemName: string;
  genericName?: string;
  batchNumber: string;
  expiryDate: string;
  unitType: string;
  quantity: number;
  unitsDeducted: number;
  unitPrice: number;
  isVatApplicable: boolean;
  vatAmount: number;
  totalPrice: number;
  dosageInstruction?: string;
}

export interface SaleReceipt {
  id: number;
  invoiceNumber: string;
  saleType: string;
  patientId?: number;
  customerName: string;
  customerPhone?: string;
  doctorId?: number;
  doctorName?: string;
  resellerId?: number;
  resellerName?: string;
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  nonTaxableAmount: number;
  vatAmount: number;
  netTotal: number;
  paidAmount: number;
  changeAmount: number;
  paymentMethod: string;
  status: string;
  refillReminderDays?: number;
  notes?: string;
  createdAt: string;
  items: SaleReceiptItem[];
}

export interface PharmacyDashboardStats {
  totalMedicines: number;
  lowStockCount: number;
  expiringIn30DaysCount: number;
  expiredCount: number;
  todaySalesCount: number;
  todaySalesAmount: number;
  monthSalesAmount: number;
}
