import { useState } from 'react';
import { useQuery } from '@/hooks/useQuery';
import { pharmacyApi } from './api';
import type { PharmacyItem, CreatePharmacyItemRequest, PharmacyItemCategory, PharmacyDosageForm } from './types';
import { PageHeader } from '@/components/PageHeader';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { useToast } from '@/components/ui/toast';
import { useT } from '@/i18n';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';

const CATEGORIES: PharmacyItemCategory[] = ['ALLOPATHIC', 'SKINCARE', 'AYURVEDIC', 'SURGICAL', 'NUTRACEUTICAL', 'OTHER'];
const DOSAGE_FORMS: PharmacyDosageForm[] = [
  'TABLET',
  'CAPSULE',
  'SYRUP',
  'INJECTION',
  'CREAM',
  'OINTMENT',
  'GEL',
  'LOTION',
  'DROPS',
  'POWDER',
  'INHALER',
  'BANDAGE',
  'PIECE',
];

export function PharmacyMedicinesPage() {
  const t = useT();
  const toast = useToast();
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null);

  const { data: page, loading, refetch } = useQuery(
    () => pharmacyApi.items.list({ query: search, size: 100 }),
    [search]
  );

  const [formData, setFormData] = useState<CreatePharmacyItemRequest>({
    name: '',
    genericName: '',
    category: 'ALLOPATHIC',
    dosageForm: 'TABLET',
    strength: '',
    manufacturer: '',
    packUnit: 'STRIP',
    dispensingUnit: 'TAB',
    packSize: 10,
    hsCode: '3004.90.00',
    isVatApplicable: false,
    vatPercentage: 0,
    schedule: 'SCHEDULE_H',
    rackLocation: '',
    minStockLevel: 10,
  });

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      genericName: '',
      category: 'ALLOPATHIC',
      dosageForm: 'TABLET',
      strength: '',
      manufacturer: '',
      packUnit: 'STRIP',
      dispensingUnit: 'TAB',
      packSize: 10,
      hsCode: '3004.90.00',
      isVatApplicable: false,
      vatPercentage: 0,
      schedule: 'SCHEDULE_H',
      rackLocation: '',
      minStockLevel: 10,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (item: PharmacyItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      genericName: item.genericName,
      category: item.category,
      dosageForm: item.dosageForm,
      strength: item.strength,
      manufacturer: item.manufacturer,
      packUnit: item.packUnit,
      dispensingUnit: item.dispensingUnit,
      packSize: item.packSize,
      hsCode: item.hsCode,
      isVatApplicable: item.isVatApplicable,
      vatPercentage: item.vatPercentage,
      schedule: item.schedule,
      rackLocation: item.rackLocation,
      minStockLevel: item.minStockLevel,
      barcode: item.barcode,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error(t('Medicine/Product name is required'));
      return;
    }

    try {
      if (editingItem) {
        await pharmacyApi.items.update(editingItem.id, formData);
        toast.success(t('Product updated successfully'));
      } else {
        await pharmacyApi.items.create(formData);
        toast.success(t('Product added successfully'));
      }
      setIsModalOpen(false);
      refetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to save product'));
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t('Are you sure you want to delete this medicine?'))) return;
    try {
      await pharmacyApi.items.delete(id);
      toast.success(t('Product deleted'));
      refetch();
    } catch (err: any) {
      toast.error(err?.message || t('Failed to delete'));
    }
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title={t('Medicines & Products')}
        description={t('Catalog of pharmaceuticals, skincare, and medical supplies with HS codes, VAT rates, and shelf locations.')}
        actions={
          <Button onClick={openCreateModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t('Add New Medicine / Product')}
          </Button>
        }
      />

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by brand name, generic composition, barcode...')}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
          <thead className="border-b bg-gray-50 text-xs font-bold uppercase text-gray-500 dark:border-gray-700 dark:bg-gray-900">
            <tr>
              <th className="px-4 py-3">Product Name & Generic</th>
              <th className="px-4 py-3">Category & Form</th>
              <th className="px-4 py-3">Pack & Conversion</th>
              <th className="px-4 py-3">HS Code / Tax</th>
              <th className="px-4 py-3">Rack</th>
              <th className="px-4 py-3">Available Stock</th>
              <th className="px-4 py-3">MRP</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
            {loading && !page ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  {t('Loading catalog...')}
                </td>
              </tr>
            ) : page?.content.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">
                  {t('No medicines found.')}
                </td>
              </tr>
            ) : (
              page?.content.map((item) => {
                const lowStock = item.totalStockUnits <= item.minStockLevel;
                return (
                  <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                    <td className="px-4 py-3">
                      <div className="font-bold text-gray-900 dark:text-gray-100">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.genericName || item.manufacturer}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{item.category}</div>
                      <div className="text-[11px] text-gray-400">{item.dosageForm} {item.strength ? `(${item.strength})` : ''}</div>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      <span className="font-semibold text-gray-800 dark:text-gray-200">{item.packUnit}</span>
                      {item.packSize > 1 && (
                        <span className="text-gray-400"> (1 {item.packUnit} = {item.packSize} {item.dispensingUnit}s)</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs text-gray-500 font-mono">{item.hsCode || '—'}</div>
                      {item.isVatApplicable ? (
                        <Badge tone="warning">13% VAT</Badge>
                      ) : (
                        <Badge tone="success">Exempt (0%)</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs font-medium text-gray-600 dark:text-gray-400">
                      {item.rackLocation || '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className={`text-xs font-bold ${lowStock ? 'text-amber-600' : 'text-green-600 dark:text-green-400'}`}>
                        {item.totalStockPacks} {item.packUnit}s
                      </div>
                      <div className="text-[11px] text-gray-400">
                        ({item.totalStockUnits} {item.dispensingUnit}s)
                      </div>
                    </td>
                    <td className="px-4 py-3 font-bold text-primary-600 text-xs dark:text-primary-400">
                      Rs. {item.latestMrpPerPack.toFixed(2)}
                      {item.packSize > 1 && (
                        <div className="text-[10px] font-normal text-gray-400">
                          (Rs. {item.latestUnitMrp.toFixed(2)}/{item.dispensingUnit})
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditModal(item)}>
                          <Edit2 className="h-4 w-4 text-gray-500" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(item.id)}>
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <Modal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? t('Edit Medicine / Product') : t('Add New Medicine / Product')}
        >
          <form onSubmit={handleSubmit} className="space-y-4 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Brand / Trade Name *')}</label>
                <Input
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Azithral 500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Generic / Composition')}</label>
                <Input
                  value={formData.genericName || ''}
                  onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                  placeholder="e.g. Azithromycin"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Category')}</label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const cat = e.target.value as PharmacyItemCategory;
                    const isVat = cat === 'SKINCARE' || cat === 'SURGICAL';
                    setFormData({
                      ...formData,
                      category: cat,
                      isVatApplicable: isVat,
                      vatPercentage: isVat ? 13 : 0,
                      hsCode: cat === 'SKINCARE' ? '3304.99.00' : '3004.90.00',
                    });
                  }}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Dosage Form')}</label>
                <select
                  value={formData.dosageForm}
                  onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value as PharmacyDosageForm })}
                  className="w-full rounded-md border border-gray-300 bg-white p-2 text-xs dark:border-gray-700 dark:bg-gray-800"
                >
                  {DOSAGE_FORMS.map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Strength')}</label>
                <Input
                  value={formData.strength || ''}
                  onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                  placeholder="e.g. 500mg, 100ml"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Pack Unit')}</label>
                <Input
                  value={formData.packUnit}
                  onChange={(e) => setFormData({ ...formData, packUnit: e.target.value.toUpperCase() })}
                  placeholder="STRIP, BOX, BOTTLE"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Dispensing Unit')}</label>
                <Input
                  value={formData.dispensingUnit}
                  onChange={(e) => setFormData({ ...formData, dispensingUnit: e.target.value.toUpperCase() })}
                  placeholder="TAB, CAP, ML, PIECE"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Units per Pack (Pack Size)')}</label>
                <Input
                  type="number"
                  min="1"
                  value={formData.packSize}
                  onChange={(e) => setFormData({ ...formData, packSize: parseInt(e.target.value) || 1 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('HS Code')}</label>
                <Input
                  value={formData.hsCode || ''}
                  onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                  placeholder="e.g. 3004.90.00"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Rack / Shelf Location')}</label>
                <Input
                  value={formData.rackLocation || ''}
                  onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                  placeholder="e.g. Rack A-1, Shelf 2"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t('Min Stock Alert')}</label>
                <Input
                  type="number"
                  min="0"
                  value={formData.minStockLevel || 10}
                  onChange={(e) => setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={formData.isVatApplicable}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      isVatApplicable: e.target.checked,
                      vatPercentage: e.target.checked ? 13 : 0,
                    })
                  }
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span>{t('VAT Applicable (13% on Skincare, Cosmetics, Surgicals)')}</span>
              </label>
              <div className="mt-1 text-[11px] text-gray-500">
                {formData.isVatApplicable
                  ? t('This item will be billed with 13% VAT pursuant to IRD Nepal rules.')
                  : t('Medicines under Schedule 1 Group 5 are VAT-Exempt.')}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">
                {editingItem ? t('Update Product') : t('Save to Catalog')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
export default PharmacyMedicinesPage;
