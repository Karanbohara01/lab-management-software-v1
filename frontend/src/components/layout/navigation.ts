import {
  FcOrganization,
  FcPlanner,
  FcLibrary,
  FcMoneyTransfer,
  FcLock,
  FcManager,
  FcStatistics,
  FcBusinessman,
  FcBusinesswoman,
  FcCalendar,
  FcTodoList,
  FcBiotech,
  FcTreeStructure,
  FcRules,
  FcBiohazard,
  FcDocument,
  FcViewDetails,
  FcInspection,
  FcSalesPerformance,
  FcFinePrint,
  FcUndo,
  FcShop,
  FcDatabase,
  FcEditImage,
  FcDiploma1,
  FcCurrencyExchange,
  FcComments,
  FcSms,
  FcAdvertising,
  FcTemplate,
  FcAutomatic,
  FcTimeline,
  FcPieChart,
  FcEndCall,
  FcSettings,
  FcGrid,
  FcPackage,
  FcShipped,
  FcInTransit,
  FcBarChart,
  FcFaq,
} from 'react-icons/fc';
import type { IconType } from 'react-icons';
import { PERMISSIONS } from '@/features/auth/permissions';

export interface NavItem {
  label: string;
  to: string;
  icon: IconType;
  /** Visible when the user has at least one of these permissions. Empty = always visible. */
  anyPermission: string[];
  /** Not yet implemented — shown disabled with a "Soon" marker. */
  upcoming?: boolean;
}

export interface NavSection {
  heading: string;
  items: NavItem[];
}

export const NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Platform',
    items: [
      { label: 'Clinics', to: '/app/platform', icon: FcOrganization, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Plans', to: '/app/platform/plans', icon: FcPlanner, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Master catalogue', to: '/app/platform/master-tests', icon: FcLibrary, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Billing', to: '/app/platform/billing', icon: FcMoneyTransfer, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Roles & permissions', to: '/app/platform/roles', icon: FcLock, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Leadership', to: '/app/platform/leadership', icon: FcManager, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Clinic Inquiries', to: '/app/platform/inquiries', icon: FcComments, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
    ],
  },
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: '/app', icon: FcStatistics, anyPermission: [] }],
  },
  {
    heading: 'Front desk',
    items: [
      { label: 'Patients', to: '/app/patients', icon: FcBusinessman, anyPermission: [PERMISSIONS.PATIENT_READ] },
      { label: 'Referring doctors', to: '/app/doctors', icon: FcBusinesswoman, anyPermission: [PERMISSIONS.DOCTOR_READ] },
      { label: 'Appointments', to: '/app/appointments', icon: FcCalendar, anyPermission: [PERMISSIONS.APPOINTMENT_READ] },
      { label: 'Lab orders', to: '/app/orders', icon: FcTodoList, anyPermission: [PERMISSIONS.LAB_ORDER_READ] },
      { label: 'Test catalog', to: '/app/tests', icon: FcBiotech, anyPermission: [PERMISSIONS.TEST_CATALOG_READ] },
      { label: 'Parameter dictionary', to: '/app/parameters', icon: FcTreeStructure, anyPermission: [PERMISSIONS.TEST_CATALOG_READ] },
      { label: 'Reflex rules', to: '/app/reflex-rules', icon: FcRules, anyPermission: [PERMISSIONS.TEST_CATALOG_READ] },
    ],
  },
  {
    heading: 'Laboratory',
    items: [
      { label: 'Samples', to: '/app/samples', icon: FcBiohazard, anyPermission: [PERMISSIONS.SAMPLE_READ] },
      { label: 'Results', to: '/app/results', icon: FcDocument, anyPermission: [PERMISSIONS.RESULT_READ] },
      { label: 'Reports', to: '/app/reports', icon: FcViewDetails, anyPermission: [PERMISSIONS.REPORT_READ] },
      { label: 'Quality control', to: '/app/qc', icon: FcInspection, anyPermission: [PERMISSIONS.RESULT_READ] },
    ],
  },
  {
    heading: 'Pharmacy',
    items: [
      { label: 'Counter POS', to: '/app/pharmacy/pos', icon: FcShop, anyPermission: [] },
      { label: 'Medicines & products', to: '/app/pharmacy/medicines', icon: FcPackage, anyPermission: [] },
      { label: 'Stock inward (GRN)', to: '/app/pharmacy/purchases', icon: FcInTransit, anyPermission: [] },
      { label: 'Wholesalers & resellers', to: '/app/pharmacy/wholesalers', icon: FcShipped, anyPermission: [] },
      { label: 'Expiry tracker', to: '/app/pharmacy/expiry', icon: FcTimeline, anyPermission: [] },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { label: 'Revenue', to: '/app/revenue', icon: FcSalesPerformance, anyPermission: [PERMISSIONS.REPORTING_READ] },
      { label: 'Invoices', to: '/app/invoices', icon: FcFinePrint, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Refunds', to: '/app/refunds', icon: FcUndo, anyPermission: [PERMISSIONS.PAYMENT_READ] },
      { label: 'Sales book', to: '/app/sales-book', icon: FcShop, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Master bill', to: '/app/master-bill', icon: FcDatabase, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Corrections', to: '/app/corrections', icon: FcEditImage, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'IRD / e-Billing', to: '/app/ird', icon: FcDiploma1, anyPermission: [PERMISSIONS.IRD_SUBMISSION_READ] },
      { label: 'Doctor commission', to: '/app/commission', icon: FcCurrencyExchange, anyPermission: [PERMISSIONS.COMMISSION_READ] },
    ],
  },
  {
    heading: 'Communication',
    items: [
      { label: 'Overview', to: '/app/communication', icon: FcComments, anyPermission: [PERMISSIONS.COMMUNICATION_READ] },
      { label: 'Send SMS', to: '/app/communication/send', icon: FcSms, anyPermission: [PERMISSIONS.COMMUNICATION_SEND] },
      { label: 'Bulk SMS campaigns', to: '/app/communication/campaigns', icon: FcAdvertising, anyPermission: [PERMISSIONS.COMMUNICATION_CAMPAIGN_MANAGE] },
      { label: 'SMS templates', to: '/app/communication/templates', icon: FcTemplate, anyPermission: [PERMISSIONS.COMMUNICATION_TEMPLATE_MANAGE] },
      { label: 'Automated notifications', to: '/app/communication/automation', icon: FcAutomatic, anyPermission: [PERMISSIONS.COMMUNICATION_AUTOMATION_MANAGE] },
      { label: 'SMS history', to: '/app/communication/history', icon: FcTimeline, anyPermission: [PERMISSIONS.COMMUNICATION_READ] },
      { label: 'Delivery reports', to: '/app/communication/delivery-reports', icon: FcPieChart, anyPermission: [PERMISSIONS.COMMUNICATION_READ] },
      { label: 'Opted-out numbers', to: '/app/communication/opt-outs', icon: FcEndCall, anyPermission: [PERMISSIONS.COMMUNICATION_SEND] },
      { label: 'SMS configuration', to: '/app/communication/config', icon: FcSettings, anyPermission: [PERMISSIONS.COMMUNICATION_CONFIG_MANAGE] },
    ],
  },
  {
    heading: 'Operations',
    items: [
      // Users/Roles/Departments/Branches/Audit log/Settings/Backups are deliberately NOT also
      // listed here — Control center already links to every one of them (with a description),
      // and every role that can reach any of those pages (only SUPER_ADMIN/LAB_ADMINISTRATOR)
      // also holds SETTINGS_READ, so nothing becomes unreachable. Listing the same destinations
      // twice, in two different shapes, was most of why this section felt bloated.
      { label: 'Control center', to: '/app/admin', icon: FcGrid, anyPermission: [PERMISSIONS.SETTINGS_READ] },
      { label: 'Inventory', to: '/app/inventory', icon: FcPackage, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Suppliers', to: '/app/suppliers', icon: FcShipped, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Purchase orders', to: '/app/purchase-orders', icon: FcInTransit, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Analytics', to: '/app/analytics', icon: FcBarChart, anyPermission: [PERMISSIONS.REPORTING_READ] },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help', to: '/app/help', icon: FcFaq, anyPermission: [] },
      { label: 'Support & Inquiries', to: '/app/support', icon: FcComments, anyPermission: [] },
    ],
  },
];
