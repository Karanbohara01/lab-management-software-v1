import {
  LayoutDashboard,
  Users,
  Stethoscope,
  CalendarClock,
  ClipboardList,
  TestTubes,
  ListTree,
  GitBranch,
  Percent,
  FlaskConical,
  FileText,
  Receipt,
  Undo2,
  BookOpen,
  FileStack,
  FileEdit,
  Boxes,
  Truck,
  BarChart3,
  ScrollText,
  Activity,
  HelpCircle,
  ShieldCheck,
  LayoutGrid,
  Rocket,
  CreditCard,
  Library,
  type LucideIcon,
} from 'lucide-react';
import { PERMISSIONS } from '@/features/auth/permissions';

export interface NavItem {
  label: string;
  to: string;
  icon: LucideIcon;
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
      { label: 'Clinics', to: '/app/platform', icon: Rocket, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Plans', to: '/app/platform/plans', icon: CreditCard, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Master catalogue', to: '/app/platform/master-tests', icon: Library, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Billing', to: '/app/platform/billing', icon: Receipt, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
      { label: 'Roles & permissions', to: '/app/platform/roles', icon: ShieldCheck, anyPermission: [PERMISSIONS.PLATFORM_MANAGE] },
    ],
  },
  {
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: '/app', icon: LayoutDashboard, anyPermission: [] }],
  },
  {
    heading: 'Front desk',
    items: [
      { label: 'Patients', to: '/app/patients', icon: Users, anyPermission: [PERMISSIONS.PATIENT_READ] },
      { label: 'Referring doctors', to: '/app/doctors', icon: Stethoscope, anyPermission: [PERMISSIONS.DOCTOR_READ] },
      { label: 'Appointments', to: '/app/appointments', icon: CalendarClock, anyPermission: [PERMISSIONS.APPOINTMENT_READ] },
      { label: 'Lab orders', to: '/app/orders', icon: ClipboardList, anyPermission: [PERMISSIONS.LAB_ORDER_READ] },
      { label: 'Test catalog', to: '/app/tests', icon: TestTubes, anyPermission: [PERMISSIONS.TEST_CATALOG_READ] },
      { label: 'Parameter dictionary', to: '/app/parameters', icon: ListTree, anyPermission: [PERMISSIONS.TEST_CATALOG_READ] },
      { label: 'Reflex rules', to: '/app/reflex-rules', icon: GitBranch, anyPermission: [PERMISSIONS.TEST_CATALOG_READ] },
    ],
  },
  {
    heading: 'Laboratory',
    items: [
      { label: 'Samples', to: '/app/samples', icon: FlaskConical, anyPermission: [PERMISSIONS.SAMPLE_READ] },
      { label: 'Results', to: '/app/results', icon: FileText, anyPermission: [PERMISSIONS.RESULT_READ] },
      { label: 'Reports', to: '/app/reports', icon: FileText, anyPermission: [PERMISSIONS.REPORT_READ] },
      { label: 'Quality control', to: '/app/qc', icon: Activity, anyPermission: [PERMISSIONS.RESULT_READ] },
    ],
  },
  {
    heading: 'Finance',
    items: [
      { label: 'Invoices', to: '/app/invoices', icon: Receipt, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Refunds', to: '/app/refunds', icon: Undo2, anyPermission: [PERMISSIONS.PAYMENT_READ] },
      { label: 'Sales book', to: '/app/sales-book', icon: BookOpen, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Master bill', to: '/app/master-bill', icon: FileStack, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Corrections', to: '/app/corrections', icon: FileEdit, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'IRD / e-Billing', to: '/app/ird', icon: ScrollText, anyPermission: [PERMISSIONS.IRD_SUBMISSION_READ] },
      { label: 'Doctor commission', to: '/app/commission', icon: Percent, anyPermission: [PERMISSIONS.COMMISSION_READ] },
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
      { label: 'Control center', to: '/app/admin', icon: LayoutGrid, anyPermission: [PERMISSIONS.SETTINGS_READ] },
      { label: 'Inventory', to: '/app/inventory', icon: Boxes, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Suppliers', to: '/app/suppliers', icon: Truck, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Purchase orders', to: '/app/purchase-orders', icon: ClipboardList, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Analytics', to: '/app/analytics', icon: BarChart3, anyPermission: [PERMISSIONS.REPORTING_READ] },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help', to: '/app/help', icon: HelpCircle, anyPermission: [] },
    ],
  },
];
