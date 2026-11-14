import {
  FcBusinessman,
  FcBusinesswoman,
  FcFactory,
  FcGlobe,
  FcBiotech,
  FcCalendar,
  FcTodoList,
  FcBiohazard,
  FcApproval,
  FcViewDetails,
  FcFinePrint,
  FcMoneyTransfer,
  FcUndo,
  FcDiploma1,
  FcCurrencyExchange,
  FcPackage,
  FcComments,
  FcAlarmClock,
  FcSurvey,
  FcBarChart,
  FcManager,
  FcLock,
  FcSettings,
  FcDatabase,
  FcOrganization,
  FcFaq,
} from 'react-icons/fc';
import type { IconType } from 'react-icons';
import { PERMISSIONS } from './permissions';

export interface PermissionGroup {
  label: string;
  /** Same icon this resource uses in the sidebar / Control Center, for one visual language. */
  icon: IconType;
  // `string`, not `Permission`: `groupAllPermissions` below also has to carry codes the backend
  // returns that this table doesn't recognise yet, which can't be narrowed to the known union.
  entries: Array<{ permission: string; action: string }>;
}

/**
 * Resource groupings for the Roles & permissions screens — purely a display concern. The
 * backend enum (`PermissionName`) is `MODULE_ACTION`, but a couple of modules are two words
 * (e.g. `TEST_CATALOG`, `COMMUNICATION_TEMPLATE`) so splitting on the last underscore isn't
 * reliable; this list is hand-kept in sync with it instead. Order here is the display order.
 */
export const PERMISSION_GROUPS: PermissionGroup[] = [
  {
    label: 'Patients',
    icon: FcBusinessman,
    entries: [
      { permission: PERMISSIONS.PATIENT_READ, action: 'Read' },
      { permission: PERMISSIONS.PATIENT_WRITE, action: 'Write' },
      { permission: PERMISSIONS.PATIENT_CONFIDENTIAL, action: 'Confidential notes' },
      { permission: PERMISSIONS.PATIENT_MERGE, action: 'Merge duplicates' },
      { permission: PERMISSIONS.PATIENT_IMPORT, action: 'Bulk import' },
    ],
  },
  {
    label: 'Referring doctors',
    icon: FcBusinesswoman,
    entries: [
      { permission: PERMISSIONS.DOCTOR_READ, action: 'Read' },
      { permission: PERMISSIONS.DOCTOR_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Departments',
    icon: FcFactory,
    entries: [
      { permission: PERMISSIONS.DEPARTMENT_READ, action: 'Read' },
      { permission: PERMISSIONS.DEPARTMENT_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Branches',
    icon: FcGlobe,
    entries: [
      { permission: PERMISSIONS.BRANCH_READ, action: 'Read' },
      { permission: PERMISSIONS.BRANCH_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Test catalog',
    icon: FcBiotech,
    entries: [
      { permission: PERMISSIONS.TEST_CATALOG_READ, action: 'Read' },
      { permission: PERMISSIONS.TEST_CATALOG_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Appointments',
    icon: FcCalendar,
    entries: [
      { permission: PERMISSIONS.APPOINTMENT_READ, action: 'Read' },
      { permission: PERMISSIONS.APPOINTMENT_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Lab orders',
    icon: FcTodoList,
    entries: [
      { permission: PERMISSIONS.LAB_ORDER_READ, action: 'Read' },
      { permission: PERMISSIONS.LAB_ORDER_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Samples',
    icon: FcBiohazard,
    entries: [
      { permission: PERMISSIONS.SAMPLE_READ, action: 'Read' },
      { permission: PERMISSIONS.SAMPLE_COLLECT, action: 'Collect' },
      { permission: PERMISSIONS.SAMPLE_RECEIVE, action: 'Receive' },
      { permission: PERMISSIONS.SAMPLE_REJECT, action: 'Reject' },
    ],
  },
  {
    label: 'Results',
    icon: FcApproval,
    entries: [
      { permission: PERMISSIONS.RESULT_READ, action: 'Read' },
      { permission: PERMISSIONS.RESULT_ENTER, action: 'Enter' },
      { permission: PERMISSIONS.RESULT_VERIFY, action: 'Verify' },
      { permission: PERMISSIONS.RESULT_APPROVE, action: 'Approve' },
      { permission: PERMISSIONS.RESULT_AMEND, action: 'Amend' },
    ],
  },
  {
    label: 'Reports',
    icon: FcViewDetails,
    entries: [
      { permission: PERMISSIONS.REPORT_READ, action: 'Read' },
      { permission: PERMISSIONS.REPORT_GENERATE, action: 'Generate' },
      { permission: PERMISSIONS.REPORT_DELIVER, action: 'Deliver' },
      { permission: PERMISSIONS.REPORT_TEMPLATE_MANAGE, action: 'Templates' },
    ],
  },
  {
    label: 'Invoices',
    icon: FcFinePrint,
    entries: [
      { permission: PERMISSIONS.INVOICE_READ, action: 'Read' },
      { permission: PERMISSIONS.INVOICE_WRITE, action: 'Write' },
      { permission: PERMISSIONS.INVOICE_CANCEL, action: 'Cancel' },
    ],
  },
  {
    label: 'Payments',
    icon: FcMoneyTransfer,
    entries: [
      { permission: PERMISSIONS.PAYMENT_READ, action: 'Read' },
      { permission: PERMISSIONS.PAYMENT_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Refunds',
    icon: FcUndo,
    entries: [
      { permission: PERMISSIONS.REFUND_REQUEST, action: 'Request' },
      { permission: PERMISSIONS.REFUND_APPROVE, action: 'Approve' },
    ],
  },
  {
    label: 'IRD e-billing',
    icon: FcDiploma1,
    entries: [
      { permission: PERMISSIONS.IRD_SUBMISSION_READ, action: 'Read' },
      { permission: PERMISSIONS.IRD_SUBMISSION_MANAGE, action: 'Manage' },
    ],
  },
  {
    label: 'Commission',
    icon: FcCurrencyExchange,
    entries: [
      { permission: PERMISSIONS.COMMISSION_READ, action: 'Read' },
      { permission: PERMISSIONS.COMMISSION_MANAGE, action: 'Manage' },
    ],
  },
  {
    label: 'Inventory',
    icon: FcPackage,
    entries: [
      { permission: PERMISSIONS.INVENTORY_READ, action: 'Read' },
      { permission: PERMISSIONS.INVENTORY_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Communication',
    icon: FcComments,
    entries: [
      { permission: PERMISSIONS.COMMUNICATION_READ, action: 'Read' },
      { permission: PERMISSIONS.COMMUNICATION_SEND, action: 'Send' },
      { permission: PERMISSIONS.COMMUNICATION_CAMPAIGN_MANAGE, action: 'Campaigns' },
      { permission: PERMISSIONS.COMMUNICATION_TEMPLATE_MANAGE, action: 'Templates' },
      { permission: PERMISSIONS.COMMUNICATION_AUTOMATION_MANAGE, action: 'Automation' },
      { permission: PERMISSIONS.COMMUNICATION_CONFIG_MANAGE, action: 'Configuration' },
    ],
  },
  {
    label: 'Notifications',
    icon: FcAlarmClock,
    entries: [{ permission: PERMISSIONS.NOTIFICATION_READ, action: 'Read' }],
  },
  {
    label: 'Audit log',
    icon: FcSurvey,
    entries: [{ permission: PERMISSIONS.AUDIT_READ, action: 'Read' }],
  },
  {
    label: 'Analytics',
    icon: FcBarChart,
    entries: [{ permission: PERMISSIONS.REPORTING_READ, action: 'Read' }],
  },
  {
    label: 'Users',
    icon: FcManager,
    entries: [
      { permission: PERMISSIONS.USER_READ, action: 'Read' },
      { permission: PERMISSIONS.USER_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Roles',
    icon: FcLock,
    entries: [
      { permission: PERMISSIONS.ROLE_READ, action: 'Read' },
      { permission: PERMISSIONS.ROLE_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Settings',
    icon: FcSettings,
    entries: [
      { permission: PERMISSIONS.SETTINGS_READ, action: 'Read' },
      { permission: PERMISSIONS.SETTINGS_WRITE, action: 'Write' },
    ],
  },
  {
    label: 'Backups',
    icon: FcDatabase,
    entries: [
      { permission: PERMISSIONS.BACKUP_READ, action: 'Read' },
      { permission: PERMISSIONS.BACKUP_MANAGE, action: 'Manage' },
    ],
  },
  {
    label: 'Platform',
    icon: FcOrganization,
    entries: [{ permission: PERMISSIONS.PLATFORM_MANAGE, action: 'Manage' }],
  },
];

/** Fallback for a permission code none of the groups above claim (see `groupAllPermissions`). */
const OTHER_GROUP_ICON = FcFaq;

/** Every group that has at least one of `granted`, each filtered down to only those entries. */
export function groupGrantedPermissions(granted: readonly string[]): PermissionGroup[] {
  const grantedSet = new Set(granted);
  return PERMISSION_GROUPS.map((group) => ({
    label: group.label,
    icon: group.icon,
    entries: group.entries.filter((e) => grantedSet.has(e.permission)),
  })).filter((group) => group.entries.length > 0);
}

const GROUP_BY_PERMISSION = new Map(
  PERMISSION_GROUPS.flatMap((group) => group.entries.map((e) => [e.permission, group.label] as const)),
);
const ACTION_BY_PERMISSION = new Map(
  PERMISSION_GROUPS.flatMap((group) => group.entries.map((e) => [e.permission, e.action] as const)),
);
const ICON_BY_GROUP = new Map(PERMISSION_GROUPS.map((group) => [group.label, group.icon] as const));

/**
 * Groups an arbitrary set of permission codes the same way, but for codes this table doesn't
 * know about yet (the backend enum is authoritative — see `permissions.ts`) falls back to an
 * "Other" group showing the raw code, rather than silently dropping it. Used for the editor,
 * which must stay able to grant a brand-new backend permission before this table catches up.
 */
export function groupAllPermissions(allPermissions: readonly string[]): PermissionGroup[] {
  const byGroup = new Map<string, PermissionGroup['entries']>();
  for (const permission of allPermissions) {
    const label = GROUP_BY_PERMISSION.get(permission) ?? 'Other';
    const action = ACTION_BY_PERMISSION.get(permission) ?? permission;
    const entries = byGroup.get(label) ?? [];
    entries.push({ permission, action });
    byGroup.set(label, entries);
  }
  const ordered: PermissionGroup[] = [];
  for (const group of PERMISSION_GROUPS) {
    const entries = byGroup.get(group.label);
    if (entries) {
      ordered.push({ label: group.label, icon: group.icon, entries });
      byGroup.delete(group.label);
    }
  }
  for (const [label, entries] of byGroup) {
    ordered.push({ label, icon: ICON_BY_GROUP.get(label) ?? OTHER_GROUP_ICON, entries });
  }
  return ordered;
}
