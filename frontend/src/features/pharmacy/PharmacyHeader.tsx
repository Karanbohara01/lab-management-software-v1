import { Link, useLocation } from 'react-router-dom';
import { ShoppingCart, Pill, Truck, Building2, AlertTriangle, ShieldCheck, RotateCcw } from 'lucide-react';
import { useT } from '@/i18n';

interface NavItem {
  to: string;
  label: string;
  icon: typeof ShoppingCart;
  badge?: string;
  badgeTone?: 'primary' | 'danger' | 'warning' | 'neutral';
}

export function PharmacyHeader() {
  const t = useT();
  const location = useLocation();

  const navItems: NavItem[] = [
    {
      to: '/app/pharmacy/pos',
      label: t('POS Counter'),
      icon: ShoppingCart,
    },
    {
      to: '/app/pharmacy/medicines',
      label: t('Medicines & Catalog'),
      icon: Pill,
    },
    {
      to: '/app/pharmacy/purchases',
      label: t('Purchases & Inward (GRN)'),
      icon: Truck,
    },
    {
      to: '/app/pharmacy/wholesalers',
      label: t('Wholesalers & Resellers'),
      icon: Building2,
    },
    {
      to: '/app/pharmacy/expiry',
      label: t('Expiry & FEFO Tracker'),
      icon: AlertTriangle,
    },
    {
      to: '/app/pharmacy/returns',
      label: t('Returns & Credit Notes'),
      icon: RotateCcw,
    },
  ];

  return (
    <div className="space-y-3 pb-1" data-print-hide>
      {/* Top Banner with Badges */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600 text-white shadow-sm">
            <Pill className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {t('Hospital Pharmacy & Dispensary')}
            </h1>
            <p className="text-xs text-muted">
              {t('Hospital-grade POS dispensing, FEFO batch tracking, IRD VAT compliance & inventory')}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 font-medium text-emerald-800 dark:border-emerald-800/40 dark:bg-emerald-950/40 dark:text-emerald-300">
            <ShieldCheck className="h-3 w-3" />
            {t('DDA Nepal Standard')}
          </span>
          <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 font-medium text-blue-800 dark:border-blue-800/40 dark:bg-blue-950/40 dark:text-blue-300">
            {t('FEFO Auto-Deduction')}
          </span>
          <span className="inline-flex items-center rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 font-medium text-purple-800 dark:border-purple-800/40 dark:bg-purple-950/40 dark:text-purple-300">
            {t('Dual-Unit (Pack ↔ Tab)')}
          </span>
        </div>
      </div>

      {/* Modern Navigation Tabs */}
      <nav className="flex space-x-1 overflow-x-auto rounded-xl border border-border/80 bg-surface/80 p-1 shadow-sm backdrop-blur-sm">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to;
          const Icon = item.icon;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={`flex shrink-0 items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-semibold transition-all duration-150 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-muted-foreground'}`} />
              <span>{item.label}</span>
              {item.badge && (
                <span
                  className={`ml-1 rounded-full px-1.5 py-0.2 text-[10px] font-bold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-surface-muted text-foreground'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
