export interface PortalReportLine {
  id: number;
  reportNumber: string;
  reportType: string;
  status: 'GENERATED' | 'RELEASED' | 'DELIVERED';
  releasedAt: string | null;
}

export interface PortalInvoiceLine {
  id: number;
  invoiceNumber: string | null;
  status: 'DRAFT' | 'ISSUED' | 'CANCELLED';
  totalAmount: number;
  balance: number;
  issuedAt: string | null;
}

export interface PortalSummary {
  patientName: string;
  patientMrn: string;
  reports: PortalReportLine[];
  invoices: PortalInvoiceLine[];
}
