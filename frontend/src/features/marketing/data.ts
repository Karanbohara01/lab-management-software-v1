import {
  Users,
  ClipboardList,
  ScanBarcode,
  FlaskConical,
  FileText,
  Receipt,
  ScrollText,
  Boxes,
  ShieldCheck,
  Headset,
  Microscope,
  Calculator,
  type LucideIcon,
} from 'lucide-react';

export const PRODUCT_NAME = 'LabOS';

/**
 * Contextual photography. Paths resolve to `frontend/public/marketing/` — the
 * README there lists the expected files. Missing files fall back to an on-brand
 * placeholder via the `<Photo>` component.
 */
export const IMAGES = {
  problem: {
    src: '/marketing/laboratory-sample-processing.webp',
    alt: 'Laboratory technician processing sample tubes beside paper registers',
  },
  samples: {
    src: '/marketing/laboratory-technician-samples.webp',
    alt: 'Laboratory technician handling barcoded specimen tubes at the bench',
  },
  pathologist: {
    src: '/marketing/pathologist-reviewing-results.png',
    alt: 'Pathologist reviewing digital pathology slides at a workstation',
  },
  labEnvironment: {
    src: '/marketing/modern-diagnostic-laboratory.webp',
    alt: 'Clean modern diagnostic laboratory with analytical instruments',
  },
} as const;

export interface NavItem {
  label: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Product', href: '#product' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'FAQ', href: '#faq' },
  { label: 'Contact', href: '#contact' },
];

export const TRUST_POINTS = [
  'Barcode-enabled sample tracking',
  'Role-based access control',
  'Professional report generation',
  'Integrated billing workflows',
  'IRD / e-Billing ready',
  'Multi-department support',
];

export interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const FEATURES: Feature[] = [
  { icon: Users, title: 'Patient management', description: 'Complete digital patient records, history, referrals and previous reports.' },
  { icon: ClipboardList, title: 'Laboratory workflow', description: 'Manage orders, samples, results and verification in one connected flow.' },
  { icon: ScanBarcode, title: 'Barcode tracking', description: 'Track every specimen from collection through to completion.' },
  { icon: FlaskConical, title: 'Result management', description: 'Enter, flag, verify and approve results with reference ranges built in.' },
  { icon: FileText, title: 'Professional reports', description: 'Generate clear, print-ready pathology reports with your letterhead.' },
  { icon: Receipt, title: 'Billing & payments', description: 'Invoices, discounts, tax, partial payments, balances and refunds.' },
  { icon: ScrollText, title: 'IRD / e-Billing', description: 'Track the electronic billing submission workflow, status and retries.' },
  { icon: Boxes, title: 'Inventory', description: 'Reagents, kits and consumables with batches, stock levels and expiry.' },
  { icon: ShieldCheck, title: 'Role-based access', description: 'Give each team member exactly the access their job needs — nothing more.' },
];

export const WORKFLOW_STEPS = [
  'Patient registration',
  'Lab order',
  'Billing',
  'Sample collection',
  'Barcode tracking',
  'Processing',
  'Result entry',
  'Verification',
  'Pathologist approval',
  'Report',
  'Payment / e-Billing',
];

export const TRADITIONAL_WORKFLOW = [
  'Paper records',
  'Manual entry',
  'Disconnected systems',
  'Unclear sample status',
  'Delayed reporting',
  'Fragmented financials',
];

export const CONNECTED_WORKFLOW = [
  'Digital records',
  'Connected orders',
  'Live sample tracking',
  'Centralized results',
  'Professional reports',
  'Integrated billing',
];

export interface Role {
  title: string;
  icon: LucideIcon;
  flow: string[];
  blurb: string;
}

export const ROLES: Role[] = [
  { title: 'Receptionist', icon: Headset, flow: ['Patients', 'Orders', 'Billing'], blurb: 'Register a patient and raise a priced order in under a minute.' },
  { title: 'Lab technician', icon: FlaskConical, flow: ['Samples', 'Processing', 'Results'], blurb: 'Scan a barcode, receive the sample, enter results fast.' },
  { title: 'Pathologist', icon: Microscope, flow: ['Review', 'Verify', 'Approve'], blurb: 'Review flagged values and authorise reports without hunting through screens.' },
  { title: 'Accountant', icon: Calculator, flow: ['Invoices', 'Payments', 'Refunds', 'e-Billing'], blurb: 'Trace every invoice, payment and submission from one place.' },
  { title: 'Administrator', icon: ShieldCheck, flow: ['Users', 'Inventory', 'Reports', 'Audit'], blurb: 'See the whole operation and control who can do what.' },
];

export interface Plan {
  name: string;
  audience: string;
  features: string[];
  highlighted?: boolean;
}

export const PLANS: Plan[] = [
  {
    name: 'Starter',
    audience: 'For small laboratories',
    features: [
      'Patients, orders & results',
      'Sample tracking with barcodes',
      'Professional reports',
      'Basic billing',
      'Up to 5 users',
    ],
  },
  {
    name: 'Professional',
    audience: 'For growing diagnostic centers',
    highlighted: true,
    features: [
      'Everything in Starter',
      'Full billing, payments & refunds',
      'IRD / e-Billing workflow',
      'Inventory & purchasing',
      'Analytics & audit log',
      'Up to 25 users',
    ],
  },
  {
    name: 'Enterprise',
    audience: 'For hospitals & multi-branch labs',
    features: [
      'Everything in Professional',
      'Multi-branch support',
      'Advanced role configuration',
      'Priority onboarding & support',
      'Custom report templates',
      'Unlimited users',
    ],
  },
];

export interface Faq {
  q: string;
  a: string;
}

export const FAQS: Faq[] = [
  {
    q: `What is ${PRODUCT_NAME}?`,
    a: `${PRODUCT_NAME} is a laboratory information management system (LIMS) that connects patients, lab orders, billing, samples, results, reports and daily operations in one platform built for pathology labs, diagnostic centers and hospital laboratories.`,
  },
  {
    q: 'Can it manage multiple laboratory departments?',
    a: 'Yes. Tests, samples, results and work queues are organised by department — hematology, biochemistry, microbiology, serology, clinical pathology and more.',
  },
  {
    q: 'Does it support barcode-based sample tracking?',
    a: 'Every sample gets a unique accession number and a Code 128 barcode. Samples are generated automatically when an order is confirmed, and staff can scan or look them up at any point in the workflow.',
  },
  {
    q: 'Can technicians and pathologists have different permissions?',
    a: 'Yes. Access is controlled by 8 roles and 40+ fine-grained permissions. A technician can enter and verify results; only a pathologist can approve them and authorise the report.',
  },
  {
    q: 'Can reports be customized?',
    a: 'Reports use a configurable laboratory profile — name, address, PAN/VAT, logo and footer disclaimer — and are generated from approved results in a print- and PDF-ready layout.',
  },
  {
    q: 'How does billing work?',
    a: 'An invoice is raised from a confirmed order. Discounts and tax are applied, the invoice is issued with a fiscal-year number, and payments (cash, card, bank transfer, digital wallet, cheque or credit) are recorded against it. Refunds follow a request-and-approve flow.',
  },
  {
    q: 'How does e-Billing / IRD integration work?',
    a: `${PRODUCT_NAME} tracks the electronic billing submission lifecycle — not submitted, pending, submitted, accepted, failed — with a full attempt log and retry handling. The integration sits behind a dedicated service so billing is never blocked by an external system. ${PRODUCT_NAME} is designed to support Nepal's digital billing workflows; it is not itself an IRD registration.`,
  },
  {
    q: 'Can the system support multiple branches?',
    a: 'The Enterprise plan is built for hospitals and multi-branch organisations with centralised administration.',
  },
  {
    q: 'Is the application responsive?',
    a: 'Yes. Every screen is designed for phone, tablet and desktop — collection staff and technicians can work from a mobile device at the bench or the draw station.',
  },
  {
    q: 'How is access controlled?',
    a: 'Users sign in with their own account, every account is assigned roles, and the backend enforces permissions on every request. Every sensitive action is written to an append-only audit log.',
  },
];

export const FOOTER_COLUMNS: { heading: string; links: string[] }[] = [
  { heading: 'Product', links: ['Features', 'Workflow', 'Billing', 'Reports', 'Inventory', 'e-Billing'] },
  { heading: 'Solutions', links: ['Pathology Labs', 'Diagnostic Centers', 'Hospital Laboratories', 'Multi-Branch Labs'] },
  { heading: 'Resources', links: ['Documentation', 'FAQ', 'Help Center'] },
  { heading: 'Company', links: ['About', 'Contact', 'Careers'] },
  { heading: 'Legal', links: ['Privacy', 'Terms', 'Data Protection'] },
];
