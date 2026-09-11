import {
  LayoutDashboard,
  Users,
  Stethoscope,
  ClipboardList,
  TestTubes,
  FlaskConical,
  FileText,
  Receipt,
  Boxes,
  Building2,
  MapPin,
  Truck,
  BarChart3,
  ScrollText,
  Activity,
  Settings,
  Database,
  HelpCircle,
  UserCog,
  ShieldCheck,
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
    heading: 'Overview',
    items: [{ label: 'Dashboard', to: '/app', icon: LayoutDashboard, anyPermission: [] }],
  },
  {
    heading: 'Front desk',
    items: [
      { label: 'Patients', to: '/app/patients', icon: Users, anyPermission: [PERMISSIONS.PATIENT_READ] },
      { label: 'Referring doctors', to: '/app/doctors', icon: Stethoscope, anyPermission: [PERMISSIONS.DOCTOR_READ] },
      { label: 'Lab orders', to: '/app/orders', icon: ClipboardList, anyPermission: [PERMISSIONS.LAB_ORDER_READ] },
      { label: 'Test catalog', to: '/app/tests', icon: TestTubes, anyPermission: [PERMISSIONS.TEST_CATALOG_READ] },
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
      { label: 'Refunds', to: '/app/refunds', icon: Receipt, anyPermission: [PERMISSIONS.PAYMENT_READ] },
      { label: 'Sales book', to: '/app/sales-book', icon: Receipt, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Master bill', to: '/app/master-bill', icon: Receipt, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'Corrections', to: '/app/corrections', icon: Receipt, anyPermission: [PERMISSIONS.INVOICE_READ] },
      { label: 'IRD / e-Billing', to: '/app/ird', icon: ScrollText, anyPermission: [PERMISSIONS.IRD_SUBMISSION_READ] },
    ],
  },
  {
    heading: 'Operations',
    items: [
      { label: 'Inventory', to: '/app/inventory', icon: Boxes, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Suppliers', to: '/app/suppliers', icon: Truck, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Purchase orders', to: '/app/purchase-orders', icon: ClipboardList, anyPermission: [PERMISSIONS.INVENTORY_READ] },
      { label: 'Analytics', to: '/app/analytics', icon: BarChart3, anyPermission: [PERMISSIONS.REPORTING_READ] },
      { label: 'Departments', to: '/app/departments', icon: Building2, anyPermission: [PERMISSIONS.DEPARTMENT_READ] },
      { label: 'Branches', to: '/app/branches', icon: MapPin, anyPermission: [PERMISSIONS.BRANCH_READ] },
      { label: 'Users', to: '/app/users', icon: UserCog, anyPermission: [PERMISSIONS.USER_READ] },
      { label: 'Roles', to: '/app/roles', icon: ShieldCheck, anyPermission: [PERMISSIONS.ROLE_READ] },
      { label: 'Audit log', to: '/app/audit', icon: ScrollText, anyPermission: [PERMISSIONS.AUDIT_READ] },
      { label: 'Settings', to: '/app/settings', icon: Settings, anyPermission: [PERMISSIONS.SETTINGS_READ] },
      { label: 'Backups', to: '/app/backups', icon: Database, anyPermission: [PERMISSIONS.BACKUP_READ] },
    ],
  },
  {
    heading: 'Support',
    items: [
      { label: 'Help', to: '/app/help', icon: HelpCircle, anyPermission: [] },
    ],
  },
];
