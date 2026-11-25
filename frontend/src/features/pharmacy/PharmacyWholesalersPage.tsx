import { useState, useMemo } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { CreatePharmacyWholesalerRequest, CreatePharmacyResellerRequest } from './types';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import {
  Plus,
  Building2,
  Truck,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  Search,
  CreditCard,
} from 'lucide-react';
import { PharmacyHeader } from './PharmacyHeader';

export function PharmacyWholesalersPage() {
  const t = useT();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'WHOLESALERS' | 'RESELLERS'>('WHOLESALERS');
  const [search, setSearch] = useState('');

  const { data: wholesalers, loading: wLoading, refetch: wRefetch } = useQuery(() => pharmacyApi.wholesalers.list(), []);
  const { data: resellers, loading: rLoading, refetch: rRefetch } = useQuery(() => pharmacyApi.resellers.list(), []);

  // Wholesaler modal state
  const [isWModalOpen, setIsWModalOpen] = useState(false);
  const [wForm, setWForm] = useState<CreatePharmacyWholesalerRequest>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    panVatNumber: '',
    ddaRegistrationNo: '',
    creditPeriodDays: 30,
  });

  // Reseller modal state
  const [isRModalOpen, setIsRModalOpen] = useState(false);
  const [rForm, setRForm] = useState<CreatePharmacyResellerRequest>({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    panVatNumber: '',
    discountPercentage: 0,
    creditLimit: 100000,
  });

  const filteredWholesalers = useMemo(() => {
    if (!wholesalers) return [];
    if (!search.trim()) return wholesalers;
    const q = search.toLowerCase();
    return wholesalers.filter(
      (w) =>
        w.name.toLowerCase().includes(q) ||
        (w.contactPerson && w.contactPerson.toLowerCase().includes(q)) ||
        (w.panVatNumber && w.panVatNumber.includes(q)) ||
        (w.ddaRegistrationNo && w.ddaRegistrationNo.toLowerCase().includes(q))
    );
  }, [wholesalers, search]);

  const filteredResellers = useMemo(() => {
    if (!resellers) return [];
    if (!search.trim()) return resellers;
    const q = search.toLowerCase();
    return resellers.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        (r.contactPerson && r.contactPerson.toLowerCase().includes(q)) ||
        (r.phone && r.phone.includes(q))
    );
  }, [resellers, search]);

  const handleWSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pharmacyApi.wholesalers.create(wForm);
      toast.success(t('Wholesaler / Distributor created successfully'));
      setIsWModalOpen(false);
      wRefetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to create wholesaler'));
    }
  };

  const handleRSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pharmacyApi.resellers.create(rForm);
      toast.success(t('Reseller account created successfully'));
      setIsRModalOpen(false);
      rRefetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to create reseller'));
    }
  };

  return (
    <div className="space-y-4">
      {/* Shared Pharmacy Sub-Navigation */}
      <PharmacyHeader />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Wholesale Suppliers')}</span>
            <Truck className="h-4 w-4 text-primary-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{wholesalers?.length || 0}</div>
          <div className="text-[11px] text-muted">{t('Registered pharma distributors')}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('DDA Certified')}</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {wholesalers?.filter((w) => !!w.ddaRegistrationNo).length || 0}
          </div>
          <div className="text-[11px] text-muted">{t('With verified DDA licenses')}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Institutional Resellers')}</span>
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{resellers?.length || 0}</div>
          <div className="text-[11px] text-muted">{t('Bulk clinics & pharmacies')}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Total Credit Outstanding')}</span>
            <CreditCard className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">
            Rs. {(resellers?.reduce((acc, r) => acc + (r.currentBalance || 0), 0) || 0).toLocaleString()}
          </div>
          <div className="text-[11px] text-muted">{t('Receivables from resellers')}</div>
        </div>
      </div>

      {/* Main Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('Wholesalers & Resellers Directory')}
          description={t(
            'Procurement distributors (Wholesalers with DDA license & credit terms) and institutional wholesale buyers (Resellers/Sub-clinics).'
          )}
        />
        {activeTab === 'WHOLESALERS' ? (
          <Button onClick={() => setIsWModalOpen(true)} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t('Add Wholesaler / Distributor')}
          </Button>
        ) : (
          <Button onClick={() => setIsRModalOpen(true)} className="shrink-0">
            <Plus className="mr-2 h-4 w-4" />
            {t('Add Reseller Account')}
          </Button>
        )}
      </div>

      {/* Segmented Tab Switcher & Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border/80 bg-surface p-3 shadow-xs">
        <div className="inline-flex rounded-lg border border-border bg-surface-muted/50 p-1">
          <button
            onClick={() => setActiveTab('WHOLESALERS')}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'WHOLESALERS'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Truck className="h-3.5 w-3.5" />
            <span>{t('Procurement Wholesalers (Suppliers)')}</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
              {wholesalers?.length || 0}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RESELLERS')}
            className={`flex items-center gap-2 rounded-md px-4 py-1.5 text-xs font-bold transition ${
              activeTab === 'RESELLERS'
                ? 'bg-primary-600 text-white shadow-xs'
                : 'text-muted hover:text-foreground'
            }`}
          >
            <Building2 className="h-3.5 w-3.5" />
            <span>{t('Institutional Resellers (Wholesale Buyers)')}</span>
            <span className="rounded-full bg-white/20 px-1.5 py-0.2 text-[10px]">
              {resellers?.length || 0}
            </span>
          </button>
        </div>

        <div className="relative sm:w-72">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={
              activeTab === 'WHOLESALERS'
                ? t('Search supplier, PAN, DDA...')
                : t('Search reseller clinic...')
            }
            className="pl-9 text-xs h-8"
          />
        </div>
      </div>

      {/* Wholesalers Tab Grid */}
      {activeTab === 'WHOLESALERS' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wLoading && !wholesalers ? (
            <div className="col-span-full py-12 text-center text-muted">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="mt-2 text-sm">{t('Loading wholesalers...')}</p>
            </div>
          ) : filteredWholesalers.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted space-y-2">
              <Truck className="mx-auto h-8 w-8 text-muted/50 mb-1" />
              <p className="font-semibold text-foreground">{t('No wholesalers found')}</p>
              <p className="text-xs">{t('Add your first medical distributor to manage stock procurements.')}</p>
            </div>
          ) : (
            filteredWholesalers.map((w) => (
              <div
                key={w.id}
                className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-surface p-4 shadow-2xs hover:border-primary-500 hover:shadow-md transition space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary-600 transition">
                        {w.name}
                      </h3>
                      <div className="text-xs text-muted">
                        {w.contactPerson ? `${t('Contact:')} ${w.contactPerson}` : t('Primary Supplier')}
                      </div>
                    </div>

                    <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[10px] font-bold text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/40 dark:text-blue-300">
                      {w.creditPeriodDays} {t('Days Credit')}
                    </span>
                  </div>

                  {/* Badges: DDA & PAN */}
                  <div className="mt-2.5 flex flex-wrap gap-1.5 text-[11px]">
                    {w.ddaRegistrationNo ? (
                      <span className="inline-flex items-center gap-1 rounded bg-emerald-50 px-2 py-0.5 font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                        <ShieldCheck className="h-3 w-3" />
                        DDA: {w.ddaRegistrationNo}
                      </span>
                    ) : (
                      <span className="rounded bg-surface-muted px-2 py-0.5 text-muted">
                        No DDA Listed
                      </span>
                    )}

                    {w.panVatNumber && (
                      <span className="rounded border border-border bg-surface-muted px-2 py-0.5 font-mono text-muted">
                        PAN: {w.panVatNumber}
                      </span>
                    )}
                  </div>

                  {/* Address */}
                  {w.address && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs text-muted">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted/70" />
                      <span className="truncate">{w.address}</span>
                    </div>
                  )}
                </div>

                {/* Contact Quick Actions Footer */}
                <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                  {w.phone ? (
                    <a
                      href={`tel:${w.phone}`}
                      className="flex items-center gap-1 font-semibold text-primary-600 hover:underline"
                    >
                      <Phone className="h-3.5 w-3.5" />
                      <span>{w.phone}</span>
                    </a>
                  ) : (
                    <span className="text-muted text-[11px]">{t('No phone registered')}</span>
                  )}

                  {w.email && (
                    <a
                      href={`mailto:${w.email}`}
                      className="text-muted hover:text-foreground transition p-1"
                      title={w.email}
                    >
                      <Mail className="h-3.5 w-3.5" />
                    </a>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resellers Tab Grid */}
      {activeTab === 'RESELLERS' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rLoading && !resellers ? (
            <div className="col-span-full py-12 text-center text-muted">
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
              <p className="mt-2 text-sm">{t('Loading resellers...')}</p>
            </div>
          ) : filteredResellers.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted space-y-2">
              <Building2 className="mx-auto h-8 w-8 text-muted/50 mb-1" />
              <p className="font-semibold text-foreground">{t('No reseller accounts found')}</p>
              <p className="text-xs">{t('Add sub-clinics, external pharmacies or health posts for bulk pricing.')}</p>
            </div>
          ) : (
            filteredResellers.map((r) => {
              const creditPct = r.creditLimit > 0 ? Math.min(100, Math.round(((r.currentBalance || 0) / r.creditLimit) * 100)) : 0;
              const isHighCredit = creditPct >= 80;

              return (
                <div
                  key={r.id}
                  className="group relative flex flex-col justify-between rounded-xl border border-border/80 bg-surface p-4 shadow-2xs hover:border-primary-500 hover:shadow-md transition space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold text-sm text-foreground group-hover:text-primary-600 transition">
                          {r.name}
                        </h3>
                        <div className="text-xs text-muted">
                          {r.contactPerson ? `${t('Attn:')} ${r.contactPerson}` : t('Institutional Client')}
                        </div>
                      </div>

                      {r.discountPercentage > 0 && (
                        <span className="shrink-0 rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-[10px] font-bold text-purple-800 dark:border-purple-900/50 dark:bg-purple-950/40 dark:text-purple-300">
                          {r.discountPercentage}% {t('Off MRP')}
                        </span>
                      )}
                    </div>

                    {/* Credit Limit & Utilization Bar */}
                    <div className="mt-3 rounded-lg border border-border bg-surface-muted/30 p-2 text-xs space-y-1.5">
                      <div className="flex justify-between items-center text-[11px]">
                        <span className="text-muted">{t('Credit Outstanding:')}</span>
                        <span className={`font-bold ${isHighCredit ? 'text-danger' : 'text-foreground'}`}>
                          Rs. {(r.currentBalance || 0).toLocaleString()} / Rs. {r.creditLimit.toLocaleString()}
                        </span>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
                        <div
                          className={`h-full rounded-full transition-all ${
                            isHighCredit ? 'bg-danger' : 'bg-primary-600'
                          }`}
                          style={{ width: `${creditPct}%` }}
                        />
                      </div>
                    </div>

                    {r.address && (
                      <div className="mt-2.5 flex items-center gap-1.5 text-xs text-muted">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted/70" />
                        <span className="truncate">{r.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Contact footer */}
                  <div className="flex items-center justify-between border-t border-border/60 pt-2.5 text-xs">
                    {r.phone ? (
                      <a
                        href={`tel:${r.phone}`}
                        className="flex items-center gap-1 font-semibold text-primary-600 hover:underline"
                      >
                        <Phone className="h-3.5 w-3.5" />
                        <span>{r.phone}</span>
                      </a>
                    ) : (
                      <span className="text-muted text-[11px]">{t('No phone')}</span>
                    )}

                    {r.panVatNumber && (
                      <span className="font-mono text-[10px] text-muted">
                        PAN: {r.panVatNumber}
                      </span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Wholesaler Modal */}
      {isWModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsWModalOpen(false)}
          title={t('Add Wholesaler / Distributor')}
          description={t('Register a pharmaceutical distributor with DDA certification and payment credit terms.')}
          size="md"
        >
          <form onSubmit={handleWSubmit} className="space-y-3 p-2 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                {t('Wholesaler / Company Name *')}
              </label>
              <Input
                required
                value={wForm.name}
                onChange={(e) => setWForm({ ...wForm, name: e.target.value })}
                placeholder="e.g. Nepal Medicos Wholesalers Pvt. Ltd."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Contact Person')}
                </label>
                <Input
                  value={wForm.contactPerson || ''}
                  onChange={(e) => setWForm({ ...wForm, contactPerson: e.target.value })}
                  placeholder="Manager / Sales Rep"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Phone Number')}
                </label>
                <Input
                  value={wForm.phone || ''}
                  onChange={(e) => setWForm({ ...wForm, phone: e.target.value })}
                  placeholder="01-4433221 / 9801234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('DDA Registration No.')}
                </label>
                <Input
                  value={wForm.ddaRegistrationNo || ''}
                  onChange={(e) => setWForm({ ...wForm, ddaRegistrationNo: e.target.value })}
                  placeholder="e.g. DDA-2081/KTM-44"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('PAN / VAT Number')}
                </label>
                <Input
                  value={wForm.panVatNumber || ''}
                  onChange={(e) => setWForm({ ...wForm, panVatNumber: e.target.value })}
                  placeholder="9-digit PAN"
                  className="font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Credit Period (Days)')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={wForm.creditPeriodDays}
                  onChange={(e) => setWForm({ ...wForm, creditPeriodDays: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Email Address')}
                </label>
                <Input
                  type="email"
                  value={wForm.email || ''}
                  onChange={(e) => setWForm({ ...wForm, email: e.target.value })}
                  placeholder="orders@distributor.com"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                {t('Warehouse / Office Address')}
              </label>
              <Input
                value={wForm.address || ''}
                onChange={(e) => setWForm({ ...wForm, address: e.target.value })}
                placeholder="e.g. Tripureshwor, Kathmandu"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsWModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">
                {t('Save Wholesaler')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reseller Modal */}
      {isRModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsRModalOpen(false)}
          title={t('Add Reseller Account')}
          description={t('Register a sub-clinic or institutional customer with custom discount and credit limits.')}
          size="md"
        >
          <form onSubmit={handleRSubmit} className="space-y-3 p-2 text-xs">
            <div>
              <label className="font-semibold text-foreground block mb-1">
                {t('Reseller / Clinic Name *')}
              </label>
              <Input
                required
                value={rForm.name}
                onChange={(e) => setRForm({ ...rForm, name: e.target.value })}
                placeholder="e.g. City Health Post, LifeCare Polyclinic"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Contact Person')}
                </label>
                <Input
                  value={rForm.contactPerson || ''}
                  onChange={(e) => setRForm({ ...rForm, contactPerson: e.target.value })}
                  placeholder="In-charge / Doctor"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Phone Number')}
                </label>
                <Input
                  value={rForm.phone || ''}
                  onChange={(e) => setRForm({ ...rForm, phone: e.target.value })}
                  placeholder="9801234567"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Discount on MRP (%)')}
                </label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={rForm.discountPercentage}
                  onChange={(e) => setRForm({ ...rForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                  placeholder="e.g. 10"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Credit Limit (Rs.)')}
                </label>
                <Input
                  type="number"
                  min="0"
                  value={rForm.creditLimit}
                  onChange={(e) => setRForm({ ...rForm, creditLimit: parseFloat(e.target.value) || 0 })}
                  placeholder="100000"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('PAN / VAT Number')}
                </label>
                <Input
                  value={rForm.panVatNumber || ''}
                  onChange={(e) => setRForm({ ...rForm, panVatNumber: e.target.value })}
                  placeholder="9-digit PAN"
                />
              </div>

              <div>
                <label className="font-semibold text-foreground block mb-1">
                  {t('Email Address')}
                </label>
                <Input
                  type="email"
                  value={rForm.email || ''}
                  onChange={(e) => setRForm({ ...rForm, email: e.target.value })}
                  placeholder="clinic@polyclinic.com"
                />
              </div>
            </div>

            <div>
              <label className="font-semibold text-foreground block mb-1">
                {t('Address')}
              </label>
              <Input
                value={rForm.address || ''}
                onChange={(e) => setRForm({ ...rForm, address: e.target.value })}
                placeholder="e.g. Pulchowk, Lalitpur"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsRModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">
                {t('Save Reseller Account')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PharmacyWholesalersPage;
