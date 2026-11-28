import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  FaCashRegister,
  FaFileInvoiceDollar,
  FaFilePrescription,
  FaCapsules,
  FaTruckRampBox,
  FaBoxesPacking,
  FaBuilding,
  FaHourglassHalf,
  FaRotateLeft,
  FaBell,
  FaShieldHalved,
  FaTags,
  FaPrescriptionBottleMedical,
  FaRotate,
  FaBoxesStacked,
} from 'react-icons/fa6';
import { useT } from '@/i18n';
import { PharmacyThermalLabelModal } from './PharmacyThermalLabelModal';

interface NavItem {
  to: string;
  label: string;
  icon: typeof FaCashRegister;
  badge?: string;
  badgeTone?: 'primary' | 'danger' | 'warning' | 'neutral';
}

export function PharmacyHeader() {
  const t = useT();
  const location = useLocation();
  const [labelModalOpen, setLabelModalOpen] = useState(false);

  const navItems: NavItem[] = [
    {
      to: '/app/pharmacy/pos',
      label: t('POS Counter'),
      icon: FaCashRegister,
    },
    {
      to: '/app/pharmacy/sales',
      label: t('Sales & Invoices'),
      icon: FaFileInvoiceDollar,
    },
    {
      to: '/app/pharmacy/prescriptions',
      label: t('Doctor Rx (E-Prescriptions)'),
      icon: FaFilePrescription,
    },
    {
      to: '/app/pharmacy/medicines',
      label: t('Medicines & Catalog'),
      icon: FaCapsules,
    },
    {
      to: '/app/pharmacy/purchases',
      label: t('Purchases & Inward (GRN)'),
      icon: FaTruckRampBox,
    },
    {
      to: '/app/pharmacy/reorder',
      label: t('Re-Order Intelligence & PO'),
      icon: FaBoxesPacking,
    },
    {
      to: '/app/pharmacy/wholesalers',
      label: t('Wholesalers & Resellers'),
      icon: FaBuilding,
    },
    {
      to: '/app/pharmacy/expiry',
      label: t('Expiry & FEFO Tracker'),
      icon: FaHourglassHalf,
    },
    {
      to: '/app/pharmacy/returns',
      label: t('Returns & Credit Notes'),
      icon: FaRotateLeft,
    },
    {
      to: '/app/pharmacy/refills',
      label: t('Refill Tracker & SMS'),
      icon: FaBell,
    },
    {
      to: '/app/pharmacy/narcotics',
      label: t('Narcotics & Schedule H'),
      icon: FaShieldHalved,
    },
  ];

  return (
    <div className="space-y-3 pb-1" data-print-hide>
      {/* Top Banner with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-sm ring-2 ring-primary/20">
            <FaPrescriptionBottleMedical className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
              {t('Hospital Pharmacy & Dispensary')}
            </h1>
            <p className="text-xs text-muted">
              {t('Hospital-grade POS dispensing, FEFO batch tracking, IRD VAT compliance & inventory')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/80 bg-emerald-50/80 px-2.5 py-0.5 font-bold text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300 shadow-2xs">
            <FaShieldHalved className="h-3 w-3 text-emerald-600" />
            {t('DDA Nepal Standard')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-200/80 bg-sky-50/80 px-2.5 py-0.5 font-bold text-sky-800 dark:border-sky-800/40 dark:bg-sky-950/40 dark:text-sky-300 shadow-2xs">
            <FaRotate className="h-2.5 w-2.5 text-sky-600" />
            {t('FEFO Auto-Deduction')}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-purple-200/80 bg-purple-50/80 px-2.5 py-0.5 font-bold text-purple-800 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300 shadow-2xs">
            <FaBoxesStacked className="h-2.5 w-2.5 text-purple-600" />
            {t('Dual-Unit (Pack ↔ Tab)')}
          </span>
          <button
            type="button"
            onClick={() => setLabelModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-amber-300 bg-amber-50/90 px-3 py-1 text-[11px] font-extrabold text-amber-900 transition hover:bg-amber-100 hover:border-amber-400 dark:border-amber-700/50 dark:bg-amber-950/50 dark:text-amber-300 shadow-xs cursor-pointer active:scale-95"
          >
            <FaTags className="h-3 w-3 text-amber-600 dark:text-amber-400" />
            {t('Thermal Label Maker')}
          </button>
        </div>
      </div>

      {/* Modern Navigation Tabs with Flaticons */}
      <nav className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border/80 bg-surface/80 p-1.5 shadow-xs backdrop-blur-sm [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.to);
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-sm font-bold'
                  : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                    isActive ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-surface-muted text-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Standalone Bedside & POS Thermal Label Modal */}
      {labelModalOpen && (
        <PharmacyThermalLabelModal
          open={labelModalOpen}
          onClose={() => setLabelModalOpen(false)}
        />
      )}
    </div>
  );
}
