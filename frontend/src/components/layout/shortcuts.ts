/**
 * "Go to" leader-key navigation: press `g` then the mapped key within GO_TO_TIMEOUT_MS.
 * The `to` values must match an entry in NAV_SECTIONS (navigation.ts) — the label and
 * permission check are looked up from there so this list can't drift out of sync with
 * what's actually in the sidebar.
 */
export const GO_TO_SHORTCUTS: { key: string; to: string }[] = [
  { key: 'd', to: '/app' },
  { key: 'p', to: '/app/patients' },
  { key: 'o', to: '/app/orders' },
  { key: 's', to: '/app/samples' },
  { key: 'r', to: '/app/results' },
  { key: 'e', to: '/app/reports' },
  { key: 'i', to: '/app/invoices' },
  { key: 'n', to: '/app/inventory' },
  { key: 't', to: '/app/tests' },
  { key: 'q', to: '/app/qc' },
];

export const GO_TO_TIMEOUT_MS = 1200;

export interface ShortcutEntry {
  keys: string[];
  description: string;
}

export const GENERAL_SHORTCUTS: ShortcutEntry[] = [
  { keys: ['Mod', 'K'], description: 'Jump to search (patients, orders, samples)' },
  { keys: ['/'], description: 'Filter the sidebar menu' },
  { keys: ['?'], description: 'Show this shortcuts list' },
  { keys: ['Esc'], description: 'Close a dialog, dropdown, or menu' },
];
