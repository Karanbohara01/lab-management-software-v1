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
  isNarcotic?: boolean;
  requiresPrescription?: boolean;
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
  isNarcotic?: boolean;
  requiresPrescription?: boolean;
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
  id?: number;
  itemId: number;
  itemName: string;
  genericName?: string;
  batchNumber: string;
  expiryDate: string;
  unitType: string;
  quantity: number;
  returnedQuantity?: number;
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
  returnedAmount?: number;
  returnStatus?: 'NONE' | 'PARTIAL' | 'FULL';
  paymentMethod: string;
  status: string;
  refillReminderDays?: number;
  notes?: string;
  createdAt: string;
  items: SaleReceiptItem[];
}

export interface ReturnLineItemRequest {
  saleItemId: number;
  returnQuantity: number;
  reason?: string;
}

export interface CreateSaleReturnRequest {
  saleId: number;
  refundMethod: 'CASH' | 'ORIGINAL_PAYMENT' | 'STORE_CREDIT' | 'IPD_LEDGER';
  returnReason: string;
  notes?: string;
  items: ReturnLineItemRequest[];
}

export interface SaleReturnItem {
  id: number;
  saleItemId: number;
  itemId: number;
  itemName: string;
  batchNumber: string;
  expiryDate: string;
  unitType: string;
  returnQuantity: number;
  unitPrice: number;
  taxableRefund: number;
  vatRefund: number;
  totalRefund: number;
  reason?: string;
}

export interface SaleReturn {
  id: number;
  creditNoteNumber: string;
  saleId: number;
  originalInvoiceNumber: string;
  customerName: string;
  customerPhone?: string;
  subtotalRefund: number;
  taxableAmount: number;
  nonTaxableAmount: number;
  vatAmount: number;
  netRefundAmount: number;
  refundMethod: string;
  returnReason: string;
  notes?: string;
  createdAt: string;
  items: SaleReturnItem[];
}

export interface SupplierReturnItemRequest {
  batchId: number;
  returnPacks: number;
  reason?: string;
}

export interface CreateSupplierReturnRequest {
  wholesalerId: number;
  originalBillNumber?: string;
  returnReason: string;
  notes?: string;
  items: SupplierReturnItemRequest[];
}

export interface SupplierReturnItem {
  id: number;
  batchId: number;
  itemId: number;
  itemName: string;
  batchNumber: string;
  expiryDate: string;
  returnPacks: number;
  unitPurchasePrice: number;
  totalRefund: number;
  reason?: string;
}

export interface SupplierReturn {
  id: number;
  debitNoteNumber: string;
  wholesalerId: number;
  wholesalerName: string;
  originalBillNumber?: string;
  subtotalRefund: number;
  taxableAmount: number;
  nonTaxableAmount: number;
  vatAmount: number;
  netRefundAmount: number;
  returnReason: string;
  notes?: string;
  createdAt: string;
  items: SupplierReturnItem[];
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

export interface NarcoticLog {
  id: number;
  itemId: number;
  itemName: string;
  genericName?: string;
  batchId: number;
  batchNumber: string;
  expiryDate?: string;
  saleId?: number;
  logDate: string;
  patientId?: number;
  patientName: string;
  patientAgeGender?: string;
  patientAddress?: string;
  buyerName: string;
  buyerRelation?: string;
  buyerContact?: string;
  buyerIdType?: string;
  buyerIdNumber?: string;
  doctorId?: number;
  doctorName: string;
  doctorNmcNumber: string;
  prescriptionNumber?: string;
  prescriptionDate?: string;
  dispensedQuantity: number;
  unitType: string;
  balanceStockUnits: number;
  pharmacistName: string;
  pharmacistNpcNumber?: string;
  remarks?: string;
}

export interface PrescriptionItem {
  id: number;
  itemId: number;
  itemName: string;
  genericName?: string;
  dosage: string;
  frequency?: string;
  durationDays: number;
  quantityPrescribed: number;
  quantityDispensed: number;
  unitType: 'PACK' | 'UNIT';
  instructions?: string;
  currentUnitPrice: number;
  stockAvailable: number;
}

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  patientId?: number;
  patientName: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId?: number;
  doctorName: string;
  doctorNmc?: string;
  department?: string;
  diagnosis?: string;
  status: 'PENDING' | 'PARTIALLY_DISPENSED' | 'COMPLETED' | 'CANCELLED';
  validUntil?: string;
  notes?: string;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface CreatePrescriptionRequest {
  patientId?: number;
  patientName: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId?: number;
  doctorName: string;
  doctorNmc?: string;
  department?: string;
  diagnosis?: string;
  validUntil?: string;
  notes?: string;
  items: {
    itemId: number;
    dosage: string;
    frequency?: string;
    durationDays?: number;
    quantityPrescribed: number;
    unitType?: 'PACK' | 'UNIT';
    instructions?: string;
  }[];
}

export interface DrugInteractionAlert {
  drugAGeneric: string;
  drugBGeneric: string;
  drugAName: string;
  drugBName: string;
  severity: 'SEVERE_CONTRAINDICATED' | 'MODERATE_MONITOR' | 'MINOR_INFORMATIONAL';
  interactionTitle: string;
  clinicalEffect: string;
  recommendation: string;
}

export interface PatientAllergyAlert {
  patientId: number;
  allergenGeneric: string;
  itemName: string;
  severity: string;
  reactionDetails?: string;
}

export interface DrugSafetyCheckResponse {
  hasSevereContraindication: boolean;
  hasAllergyWarning: boolean;
  interactions: DrugInteractionAlert[];
  allergies: PatientAllergyAlert[];
  patientCounselingTips: string[];
}

export interface RefillSchedule {
  id: number;
  patientId?: number;
  patientName: string;
  patientPhone: string;
  saleId?: number;
  invoiceNumber?: string;
  itemId: number;
  itemName: string;
  dispensedQuantity: number;
  unitType: string;
  dosageInstruction?: string;
  dispensedDate: string;
  courseDays: number;
  refillDueDate: string;
  status: 'SCHEDULED' | 'REMINDER_SENT' | 'REFILLED' | 'LAPSED';
  lastReminderSentAt?: string;
  reminderCount: number;
  notes?: string;
  isOverdue: boolean;
}

export interface RefillStats {
  totalScheduled: number;
  overdue: number;
  dueThisWeek: number;
  remindersSent: number;
  completedRefills: number;
}

export interface CreateRefillScheduleRequest {
  patientId?: number;
  patientName: string;
  patientPhone: string;
  saleId?: number;
  invoiceNumber?: string;
  itemId: number;
  itemName: string;
  dispensedQuantity?: number;
  unitType?: string;
  dosageInstruction?: string;
  courseDays?: number;
  notes?: string;
}

export interface ReorderRecommendation {
  itemId: number;
  itemName: string;
  genericName?: string;
  category: string;
  packUnit: string;
  dispensingUnit: string;
  packSize: number;
  currentUnits: number;
  currentPacks: number;
  minStockLevel: number;
  last30DaysDispensedUnits: number;
  averageDailyConsumption: number;
  reorderPointUnits: number;
  daysOfStockRemaining: number;
  urgency: 'OUT_OF_STOCK' | 'CRITICAL_URGENT' | 'REORDER_RECOMMENDED' | 'OPTIMAL';
  recommendedReorderPacks: number;
  preferredWholesalerId?: number;
  preferredWholesalerName: string;
  estimatedRatePerPack: number;
  estimatedTotalAmount: number;
  rackLocation?: string;
}

export interface ReorderIntelligenceSummary {
  totalMonitoredItems: number;
  outOfStockCount: number;
  criticalUrgentCount: number;
  reorderRecommendedCount: number;
  optimalCount: number;
  estimatedTotalProcurementCost: number;
}

export interface CreatePurchaseOrderItemRequest {
  itemId: number;
  packUnit?: string;
  packSize?: number;
  recommendedPackQty?: number;
  orderedPackQty: number;
  estimatedRatePerPack: number;
  remarks?: string;
}

export interface CreatePurchaseOrderRequest {
  wholesalerId: number;
  expectedDeliveryDate?: string;
  notes?: string;
  items: CreatePurchaseOrderItemRequest[];
}

export interface PurchaseOrderItem {
  id: number;
  itemId: number;
  itemName: string;
  genericName?: string;
  packUnit: string;
  packSize: number;
  recommendedPackQty: number;
  orderedPackQty: number;
  receivedPackQty: number;
  estimatedRatePerPack: number;
  estimatedTotalAmount: number;
  remarks?: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  wholesalerId: number;
  wholesalerName: string;
  wholesalerPhone?: string;
  wholesalerPan?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  totalEstimatedAmount: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  items: PurchaseOrderItem[];
}






export interface RecordNarcoticLogRequest {
  itemId: number;
  batchId: number;
  saleId?: number;
  saleItemId?: number;
  patientId?: number;
  patientName: string;
  patientAgeGender?: string;
  patientAddress?: string;
  buyerName: string;
  buyerRelation?: string;
  buyerContact?: string;
  buyerIdType?: string;
  buyerIdNumber?: string;
  doctorId?: number;
  doctorName: string;
  doctorNmcNumber: string;
  prescriptionNumber?: string;
  prescriptionDate?: string;
  dispensedQuantity: number;
  unitType?: string;
  pharmacistName: string;
  pharmacistNpcNumber?: string;
  remarks?: string;
}

export interface PrescriptionItem {
  id: number;
  itemId: number;
  itemName: string;
  genericName?: string;
  dosage: string;
  frequency?: string;
  durationDays: number;
  quantityPrescribed: number;
  quantityDispensed: number;
  unitType: 'PACK' | 'UNIT';
  instructions?: string;
  currentUnitPrice: number;
  stockAvailable: number;
}

export interface Prescription {
  id: number;
  prescriptionNumber: string;
  patientId?: number;
  patientName: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId?: number;
  doctorName: string;
  doctorNmc?: string;
  department?: string;
  diagnosis?: string;
  status: 'PENDING' | 'PARTIALLY_DISPENSED' | 'COMPLETED' | 'CANCELLED';
  validUntil?: string;
  notes?: string;
  createdAt: string;
  items: PrescriptionItem[];
}

export interface CreatePrescriptionRequest {
  patientId?: number;
  patientName: string;
  patientMrn?: string;
  patientPhone?: string;
  doctorId?: number;
  doctorName: string;
  doctorNmc?: string;
  department?: string;
  diagnosis?: string;
  validUntil?: string;
  notes?: string;
  items: {
    itemId: number;
    dosage: string;
    frequency?: string;
    durationDays?: number;
    quantityPrescribed: number;
    unitType?: 'PACK' | 'UNIT';
    instructions?: string;
  }[];
}

export interface DrugInteractionAlert {
  drugAGeneric: string;
  drugBGeneric: string;
  drugAName: string;
  drugBName: string;
  severity: 'SEVERE_CONTRAINDICATED' | 'MODERATE_MONITOR' | 'MINOR_INFORMATIONAL';
  interactionTitle: string;
  clinicalEffect: string;
  recommendation: string;
}

export interface PatientAllergyAlert {
  patientId: number;
  allergenGeneric: string;
  itemName: string;
  severity: string;
  reactionDetails?: string;
}

export interface DrugSafetyCheckResponse {
  hasSevereContraindication: boolean;
  hasAllergyWarning: boolean;
  interactions: DrugInteractionAlert[];
  allergies: PatientAllergyAlert[];
  patientCounselingTips: string[];
}

export interface RefillSchedule {
  id: number;
  patientId?: number;
  patientName: string;
  patientPhone: string;
  saleId?: number;
  invoiceNumber?: string;
  itemId: number;
  itemName: string;
  dispensedQuantity: number;
  unitType: string;
  dosageInstruction?: string;
  dispensedDate: string;
  courseDays: number;
  refillDueDate: string;
  status: 'SCHEDULED' | 'REMINDER_SENT' | 'REFILLED' | 'LAPSED';
  lastReminderSentAt?: string;
  reminderCount: number;
  notes?: string;
  isOverdue: boolean;
}

export interface RefillStats {
  totalScheduled: number;
  overdue: number;
  dueThisWeek: number;
  remindersSent: number;
  completedRefills: number;
}

export interface CreateRefillScheduleRequest {
  patientId?: number;
  patientName: string;
  patientPhone: string;
  saleId?: number;
  invoiceNumber?: string;
  itemId: number;
  itemName: string;
  dispensedQuantity?: number;
  unitType?: string;
  dosageInstruction?: string;
  courseDays?: number;
  notes?: string;
}

export interface ReorderRecommendation {
  itemId: number;
  itemName: string;
  genericName?: string;
  category: string;
  packUnit: string;
  dispensingUnit: string;
  packSize: number;
  currentUnits: number;
  currentPacks: number;
  minStockLevel: number;
  last30DaysDispensedUnits: number;
  averageDailyConsumption: number;
  reorderPointUnits: number;
  daysOfStockRemaining: number;
  urgency: 'OUT_OF_STOCK' | 'CRITICAL_URGENT' | 'REORDER_RECOMMENDED' | 'OPTIMAL';
  recommendedReorderPacks: number;
  preferredWholesalerId?: number;
  preferredWholesalerName: string;
  estimatedRatePerPack: number;
  estimatedTotalAmount: number;
  rackLocation?: string;
}

export interface ReorderIntelligenceSummary {
  totalMonitoredItems: number;
  outOfStockCount: number;
  criticalUrgentCount: number;
  reorderRecommendedCount: number;
  optimalCount: number;
  estimatedTotalProcurementCost: number;
}

export interface CreatePurchaseOrderItemRequest {
  itemId: number;
  packUnit?: string;
  packSize?: number;
  recommendedPackQty?: number;
  orderedPackQty: number;
  estimatedRatePerPack: number;
  remarks?: string;
}

export interface CreatePurchaseOrderRequest {
  wholesalerId: number;
  expectedDeliveryDate?: string;
  notes?: string;
  items: CreatePurchaseOrderItemRequest[];
}

export interface PurchaseOrderItem {
  id: number;
  itemId: number;
  itemName: string;
  genericName?: string;
  packUnit: string;
  packSize: number;
  recommendedPackQty: number;
  orderedPackQty: number;
  receivedPackQty: number;
  estimatedRatePerPack: number;
  estimatedTotalAmount: number;
  remarks?: string;
}

export interface PurchaseOrder {
  id: number;
  poNumber: string;
  wholesalerId: number;
  wholesalerName: string;
  wholesalerPhone?: string;
  wholesalerPan?: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  status: 'DRAFT' | 'ISSUED' | 'PARTIALLY_RECEIVED' | 'COMPLETED' | 'CANCELLED';
  totalEstimatedAmount: number;
  notes?: string;
  createdBy?: string;
  createdAt: string;
  items: PurchaseOrderItem[];
}





