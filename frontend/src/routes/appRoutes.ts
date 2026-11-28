/**
 * Navigation metadata for every `/app` route, keyed by its full pattern. The route tree itself is
 * flat (router.tsx), so the hierarchy an administrator *thinks* in — Patients › Sita Rai › Edit,
 * Control center › Users — lives here as `parent` links and drives the breadcrumbs, the fallback
 * "Back to …" target when a page is opened directly, and which sidebar item lights up.
 *
 * `router.tsx` attaches each entry to its route as `handle` (with the pattern added), which is
 * how the app shell finds the current page's entry via useMatches().
 */
export interface RouteHandle {
  title: string;
  /** The pattern of the page this one sits under, e.g. '/app/patients/:id'. */
  parent?: string;
}

export interface MatchedHandle extends RouteHandle {
  pattern: string;
}

export const APP_ROUTE_HANDLES: Record<string, RouteHandle> = {
  '/app': { title: 'Dashboard' },
  '/app/help': { title: 'Help' },
  '/app/support': { title: 'Support & Inquiries' },
  '/app/support/:id': { title: 'Inquiry', parent: '/app/support' },
  '/app/notifications': { title: 'Notifications' },

  '/app/patients': { title: 'Patients' },
  '/app/patients/new': { title: 'Register patient', parent: '/app/patients' },
  '/app/patients/import': { title: 'Import patients', parent: '/app/patients' },
  '/app/patients/:id': { title: 'Patient', parent: '/app/patients' },
  '/app/patients/:id/edit': { title: 'Edit patient', parent: '/app/patients/:id' },
  '/app/doctors': { title: 'Referring doctors' },
  '/app/appointments': { title: 'Appointments' },
  '/app/appointments/:id': { title: 'Appointment', parent: '/app/appointments' },
  '/app/orders': { title: 'Lab orders' },
  '/app/orders/new': { title: 'New lab order', parent: '/app/orders' },
  '/app/orders/:id': { title: 'Order', parent: '/app/orders' },
  '/app/orders/:id/edit': { title: 'Edit order', parent: '/app/orders/:id' },
  '/app/tests': { title: 'Test catalog' },
  '/app/parameters': { title: 'Parameter dictionary' },
  '/app/reflex-rules': { title: 'Reflex rules' },

  '/app/samples': { title: 'Samples' },
  '/app/samples/:id': { title: 'Sample', parent: '/app/samples' },
  '/app/samples/:id/label': { title: 'Sample label', parent: '/app/samples/:id' },
  '/app/results': { title: 'Results' },
  '/app/results/:id': { title: 'Result', parent: '/app/results' },
  '/app/reports': { title: 'Reports' },
  '/app/reports/:id': { title: 'Report', parent: '/app/reports' },
  '/app/qc': { title: 'Quality control' },

  '/app/invoices': { title: 'Invoices' },
  '/app/invoices/:id': { title: 'Invoice', parent: '/app/invoices' },
  '/app/refunds': { title: 'Refunds' },
  '/app/sales-book': { title: 'Sales book' },
  '/app/master-bill': { title: 'Master bill' },
  '/app/corrections': { title: 'Corrections' },
  '/app/ird': { title: 'IRD submissions' },
  '/app/ird/:id': { title: 'IRD submission', parent: '/app/ird' },
  '/app/commission': { title: 'Commission' },
  '/app/revenue': { title: 'Revenue' },
  '/app/revenue/report': { title: 'Revenue report', parent: '/app/revenue' },

  '/app/inventory': { title: 'Inventory' },
  '/app/inventory/:id': { title: 'Inventory item', parent: '/app/inventory' },
  '/app/pharmacy/pos': { title: 'Pharmacy counter (POS)' },
  '/app/pharmacy/sales': { title: 'Pharmacy sales & invoices' },
  '/app/pharmacy/medicines': { title: 'Medicines & products' },
  '/app/pharmacy/purchases': { title: 'Wholesale purchases (GRN)' },
  '/app/pharmacy/wholesalers': { title: 'Wholesalers & resellers' },
  '/app/pharmacy/expiry': { title: 'Expiry tracker' },
  '/app/pharmacy/returns': { title: 'Returns & Credit Notes' },
  '/app/pharmacy/narcotics': { title: 'Narcotics & Schedule H Register' },
  '/app/suppliers': { title: 'Suppliers' },
  '/app/purchase-orders': { title: 'Purchase orders' },
  '/app/purchase-orders/:id': { title: 'Purchase order', parent: '/app/purchase-orders' },
  '/app/analytics': { title: 'Analytics' },

  '/app/communication': { title: 'Communication' },
  '/app/communication/send': { title: 'Send SMS', parent: '/app/communication' },
  '/app/communication/campaigns': { title: 'SMS campaigns', parent: '/app/communication' },
  '/app/communication/campaigns/new': { title: 'New SMS campaign', parent: '/app/communication/campaigns' },
  '/app/communication/campaigns/:id': { title: 'SMS campaign', parent: '/app/communication/campaigns' },
  '/app/communication/templates': { title: 'SMS templates', parent: '/app/communication' },
  '/app/communication/automation': { title: 'Automated notifications', parent: '/app/communication' },
  '/app/communication/history': { title: 'SMS history', parent: '/app/communication' },
  '/app/communication/delivery-reports': { title: 'Delivery reports', parent: '/app/communication' },
  '/app/communication/opt-outs': { title: 'Opted-out numbers', parent: '/app/communication' },
  '/app/communication/config': { title: 'SMS configuration', parent: '/app/communication' },

  '/app/admin': { title: 'Control center' },
  '/app/users': { title: 'Users', parent: '/app/admin' },
  '/app/roles': { title: 'Roles', parent: '/app/admin' },
  '/app/departments': { title: 'Departments', parent: '/app/admin' },
  '/app/branches': { title: 'Branches', parent: '/app/admin' },
  '/app/audit': { title: 'Audit log', parent: '/app/admin' },
  '/app/settings': { title: 'Laboratory settings', parent: '/app/admin' },
  '/app/settings/billing': { title: 'Subscription billing', parent: '/app/settings' },
  '/app/settings/billing/:invoiceId': { title: 'Subscription invoice', parent: '/app/settings/billing' },
  '/app/backups': { title: 'Backups', parent: '/app/admin' },

  '/app/platform': { title: 'Clinics' },
  '/app/platform/plans': { title: 'Plans', parent: '/app/platform' },
  '/app/platform/master-tests': { title: 'Master catalogue', parent: '/app/platform' },
  '/app/platform/billing': { title: 'Platform billing', parent: '/app/platform' },
  '/app/platform/roles': { title: 'Roles & permissions', parent: '/app/platform' },
  '/app/platform/leadership': { title: 'Leadership', parent: '/app/platform' },
  '/app/platform/inquiries': { title: 'Clinic Inquiries', parent: '/app/platform' },
};

/** The handle router.tsx attaches to the route for `pattern` (undefined for unlisted routes like the 404). */
export function handleFor(pattern: string): MatchedHandle | undefined {
  const entry = APP_ROUTE_HANDLES[pattern];
  return entry ? { ...entry, pattern } : undefined;
}

/** '/app/patients/:id/edit' + { id: '42' } → '/app/patients/42/edit'. */
export function resolvePattern(pattern: string, params: Record<string, string | undefined>): string {
  return pattern.replace(/:([A-Za-z0-9_]+)/g, (_, key: string) => params[key] ?? '');
}

/** The page and every ancestor above it, leaf first: [leaf, parent, grandparent, …]. */
export function handleChain(pattern: string): MatchedHandle[] {
  const chain: MatchedHandle[] = [];
  let current: string | undefined = pattern;
  const seen = new Set<string>();
  while (current && !seen.has(current)) {
    seen.add(current);
    const handle = handleFor(current);
    if (!handle) break;
    chain.push(handle);
    current = handle.parent;
  }
  return chain;
}
