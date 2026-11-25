import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { CreatePharmacyWholesalerRequest, CreatePharmacyResellerRequest } from './types';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { Plus, Building2, Truck, Phone, FileText, CheckCircle2 } from 'lucide-react';

export function PharmacyWholesalersPage() {
  const t = useT();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'WHOLESALERS' | 'RESELLERS'>('WHOLESALERS');

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

  const handleWSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await pharmacyApi.wholesalers.create(wForm);
      toast.success(t('Wholesaler / Distributor created'));
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
      toast.success(t('Reseller account created'));
      setIsRModalOpen(false);
      rRefetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to create reseller'));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Wholesalers & Resellers')}
        description={t('Manage procurement distributors (Wholesalers with DDA registration) and institutional bulk buyers (Resellers/Sub-clinics).')}
        actions={
          activeTab === 'WHOLESALERS' ? (
            <Button onClick={() => setIsWModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('Add Wholesaler / Distributor')}
            </Button>
          ) : (
            <Button onClick={() => setIsRModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {t('Add Reseller Account')}
            </Button>
          )
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('WHOLESALERS')}
          className={`flex items-center gap-2 border-b-2 px-6 py-2.5 text-sm font-bold transition ${
            activeTab === 'WHOLESALERS'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Truck className="h-4 w-4" />
          {t('Procurement Wholesalers (Suppliers)')} ({wholesalers?.length || 0})
        </button>
        <button
          onClick={() => setActiveTab('RESELLERS')}
          className={`flex items-center gap-2 border-b-2 px-6 py-2.5 text-sm font-bold transition ${
            activeTab === 'RESELLERS'
              ? 'border-primary-600 text-primary-600 dark:text-primary-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
          }`}
        >
          <Building2 className="h-4 w-4" />
          {t('Institutional Resellers (Wholesale Buyers)')} ({resellers?.length || 0})
        </button>
      </div>

      {/* Wholesalers Tab */}
      {activeTab === 'WHOLESALERS' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {wLoading && !wholesalers ? (
            <div className="col-span-full py-8 text-center text-gray-400">{t('Loading wholesalers...')}</div>
          ) : wholesalers?.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-gray-400">
              {t('No wholesalers added yet.')}
            </div>
          ) : (
            wholesalers?.map((w) => (
              <div
                key={w.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{w.name}</h3>
                    <div className="text-xs text-gray-500">Contact: {w.contactPerson || '—'}</div>
                  </div>
                  <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/50 dark:text-blue-300">
                    {w.creditPeriodDays} {t('Days Credit')}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 border-t pt-2 dark:border-gray-700">
                  {w.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{w.phone}</span>
                    </div>
                  )}
                  {w.panVatNumber && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>PAN/VAT: <strong>{w.panVatNumber}</strong></span>
                    </div>
                  )}
                  {w.ddaRegistrationNo && (
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                      <span>DDA Reg: <strong>{w.ddaRegistrationNo}</strong></span>
                    </div>
                  )}
                  {w.address && <div className="text-gray-400 line-clamp-1">📍 {w.address}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Resellers Tab */}
      {activeTab === 'RESELLERS' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rLoading && !resellers ? (
            <div className="col-span-full py-8 text-center text-gray-400">{t('Loading resellers...')}</div>
          ) : resellers?.length === 0 ? (
            <div className="col-span-full rounded-xl border border-dashed p-8 text-center text-gray-400">
              {t('No resellers registered yet.')}
            </div>
          ) : (
            resellers?.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-gray-100">{r.name}</h3>
                    <div className="text-xs text-gray-500">Contact: {r.contactPerson || '—'}</div>
                  </div>
                  <span className="rounded bg-purple-50 px-2 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                    {r.discountPercentage}% {t('Wholesale Disc')}
                  </span>
                </div>

                <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400 border-t pt-2 dark:border-gray-700">
                  {r.phone && (
                    <div className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      <span>{r.phone}</span>
                    </div>
                  )}
                  {r.panVatNumber && (
                    <div className="flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-gray-400" />
                      <span>PAN/VAT: <strong>{r.panVatNumber}</strong></span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium">
                    <span>Credit Limit: Rs. {r.creditLimit.toFixed(2)}</span>
                    <span className="text-amber-600">Balance: Rs. {r.currentBalance.toFixed(2)}</span>
                  </div>
                  {r.address && <div className="text-gray-400 line-clamp-1">📍 {r.address}</div>}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Wholesaler Modal */}
      {isWModalOpen && (
        <Modal
          open={isWModalOpen}
          onClose={() => setIsWModalOpen(false)}
          title={t('Add Wholesaler / Distributor')}
        >
          <form onSubmit={handleWSubmit} className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('Company / Distributor Name *')}
              </label>
              <Input
                required
                value={wForm.name}
                onChange={(e) => setWForm({ ...wForm, name: e.target.value })}
                placeholder="e.g. Himalayan Pharma Distributors"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Contact Person')}</label>
                <Input
                  value={wForm.contactPerson || ''}
                  onChange={(e) => setWForm({ ...wForm, contactPerson: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Phone Number')}</label>
                <Input
                  value={wForm.phone || ''}
                  onChange={(e) => setWForm({ ...wForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('PAN / VAT Number')}</label>
                <Input
                  value={wForm.panVatNumber || ''}
                  onChange={(e) => setWForm({ ...wForm, panVatNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('DDA License Number')}</label>
                <Input
                  value={wForm.ddaRegistrationNo || ''}
                  onChange={(e) => setWForm({ ...wForm, ddaRegistrationNo: e.target.value })}
                  placeholder="e.g. DDA-D-1029"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Office Address')}</label>
              <Input
                value={wForm.address || ''}
                onChange={(e) => setWForm({ ...wForm, address: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" onClick={() => setIsWModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Save Wholesaler')}</Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Reseller Modal */}
      {isRModalOpen && (
        <Modal
          open={isRModalOpen}
          onClose={() => setIsRModalOpen(false)}
          title={t('Add Reseller Account')}
        >
          <form onSubmit={handleRSubmit} className="space-y-3 text-sm">
            <div>
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {t('Clinic / Pharmacy Name *')}
              </label>
              <Input
                required
                value={rForm.name}
                onChange={(e) => setRForm({ ...rForm, name: e.target.value })}
                placeholder="e.g. Lalitpur Health Post Dispensary"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Contact Person')}</label>
                <Input
                  value={rForm.contactPerson || ''}
                  onChange={(e) => setRForm({ ...rForm, contactPerson: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Phone Number')}</label>
                <Input
                  value={rForm.phone || ''}
                  onChange={(e) => setRForm({ ...rForm, phone: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('PAN Number')}</label>
                <Input
                  value={rForm.panVatNumber || ''}
                  onChange={(e) => setRForm({ ...rForm, panVatNumber: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Discount %')}</label>
                <Input
                  type="number"
                  min="0"
                  step="0.1"
                  value={rForm.discountPercentage || 0}
                  onChange={(e) => setRForm({ ...rForm, discountPercentage: parseFloat(e.target.value) || 0 })}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Credit Limit (Rs)')}</label>
                <Input
                  type="number"
                  min="0"
                  value={rForm.creditLimit || 0}
                  onChange={(e) => setRForm({ ...rForm, creditLimit: parseFloat(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t">
              <Button type="button" variant="secondary" onClick={() => setIsRModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">{t('Save Reseller')}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
export default PharmacyWholesalersPage;
