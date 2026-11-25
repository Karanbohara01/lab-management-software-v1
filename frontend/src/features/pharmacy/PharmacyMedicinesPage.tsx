import { useState, useMemo } from 'react';
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
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Pill,
  Sparkles,
  AlertTriangle,
  Package,
  Layers,
  MapPin,
  Tag,
} from 'lucide-react';
import { PharmacyHeader } from './PharmacyHeader';

const CATEGORIES: PharmacyItemCategory[] = [
  'ALLOPATHIC',
  'SKINCARE',
  'AYURVEDIC',
  'SURGICAL',
  'NUTRACEUTICAL',
  'OTHER',
];

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
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PharmacyItem | null>(null);

  const { data: page, loading, refetch } = useQuery(
    () => pharmacyApi.items.list({ query: search, size: 100 }),
    [search]
  );

  const items = page?.content ?? [];

  // Filtered by category
  const filteredItems = useMemo(() => {
    if (selectedCategory === 'ALL') return items;
    return items.filter((item) => item.category === selectedCategory);
  }, [items, selectedCategory]);

  // Statistics KPI
  const stats = useMemo(() => {
    const total = items.length;
    const allopathic = items.filter((i) => i.category === 'ALLOPATHIC').length;
    const skincare = items.filter((i) => i.category === 'SKINCARE' || i.isVatApplicable).length;
    const lowStock = items.filter((i) => i.totalStockUnits <= i.minStockLevel).length;
    return { total, allopathic, skincare, lowStock };
  }, [items]);

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

  const handleCategoryChange = (cat: PharmacyItemCategory) => {
    const isSkincare = cat === 'SKINCARE';
    setFormData((prev) => ({
      ...prev,
      category: cat,
      isVatApplicable: isSkincare,
      vatPercentage: isSkincare ? 13 : 0,
      hsCode: isSkincare ? '3304.99.00' : '3004.90.00',
    }));
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
      {/* Shared Pharmacy Sub-Navigation */}
      <PharmacyHeader />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Catalog Items')}</span>
            <Package className="h-4 w-4 text-primary-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{stats.total}</div>
          <div className="text-[11px] text-muted">{t('Active registered drugs')}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Allopathic / Rx')}</span>
            <Pill className="h-4 w-4 text-blue-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{stats.allopathic}</div>
          <div className="text-[11px] text-muted">{t('0% VAT Tax Exempt')}</div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Skincare & Derm')}</span>
            <Sparkles className="h-4 w-4 text-amber-600" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-foreground">{stats.skincare}</div>
          <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
            {t('13% Taxable VAT Items')}
          </div>
        </div>

        <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-2xs">
          <div className="flex items-center justify-between text-muted">
            <span className="text-xs font-medium">{t('Low Stock Alert')}</span>
            <AlertTriangle className="h-4 w-4 text-danger" />
          </div>
          <div className="mt-1.5 text-xl font-extrabold text-danger">{stats.lowStock}</div>
          <div className="text-[11px] text-muted">{t('Below minimum reorder level')}</div>
        </div>
      </div>

      {/* Main Header & Actions */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <PageHeader
          title={t('Medicines & Products Catalog')}
          description={t(
            'Hospital formulary of drugs, skincare, and medical supplies with HS codes, VAT rates, and shelf locations.'
          )}
        />
        <Button onClick={openCreateModal} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          {t('Add New Medicine / Product')}
        </Button>
      </div>

      {/* Search and Category Filter Tabs */}
      <div className="rounded-xl border border-border/80 bg-surface p-3.5 shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-muted" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('Search by brand name, generic chemical composition, HS code, manufacturer, barcode...')}
            className="pl-10 text-sm h-10 shadow-xs"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-3 text-xs text-muted hover:text-foreground"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'ALL', label: t('All Categories') },
            { id: 'ALLOPATHIC', label: t('Allopathic') },
            { id: 'SKINCARE', label: t('Skincare & Derm (13% VAT)') },
            { id: 'SURGICAL', label: t('Surgical / Devices') },
            { id: 'AYURVEDIC', label: t('Ayurvedic') },
            { id: 'NUTRACEUTICAL', label: t('Nutraceuticals') },
            { id: 'OTHER', label: t('Other') },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                selectedCategory === cat.id
                  ? 'bg-primary-600 text-white shadow-xs'
                  : 'bg-surface-muted text-muted hover:bg-surface-elevated hover:text-foreground'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Catalog Table */}
      <div className="overflow-hidden rounded-xl border border-border/80 bg-surface shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="border-b border-border/80 bg-surface-muted/60 text-xs font-bold uppercase text-muted">
              <tr>
                <th className="px-4 py-3.5">{t('Product & Generic Name')}</th>
                <th className="px-4 py-3.5">{t('Category & Form')}</th>
                <th className="px-4 py-3.5">{t('Packaging Unit')}</th>
                <th className="px-4 py-3.5">{t('Tax & HS Code')}</th>
                <th className="px-4 py-3.5">{t('Rack Location')}</th>
                <th className="px-4 py-3.5">{t('Available Stock')}</th>
                <th className="px-4 py-3.5">{t('Selling MRP')}</th>
                <th className="px-4 py-3.5 text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {loading && !page ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                    <p className="mt-2 text-sm">{t('Loading medicine catalog...')}</p>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-muted">
                    <Package className="mx-auto h-8 w-8 text-muted/50 mb-2" />
                    <p className="font-semibold text-foreground">{t('No medicines found.')}</p>
                    <p className="text-xs">{t('Add a new medicine or change your filter criteria.')}</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const isOutOfStock = item.totalStockUnits <= 0;
                  const isLowStock = !isOutOfStock && item.totalStockUnits <= item.minStockLevel;

                  return (
                    <tr key={item.id} className="hover:bg-surface-muted/40 transition">
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground">{item.name}</div>
                        <div className="text-xs text-muted">
                          {item.genericName || item.manufacturer || '—'}
                        </div>
                        {item.schedule && (
                          <span className="mt-0.5 inline-block text-[10px] font-mono text-purple-600 dark:text-purple-400">
                            {item.schedule}
                          </span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-foreground">{item.category}</div>
                        <div className="text-[11px] text-muted">
                          {item.dosageForm} {item.strength ? `(${item.strength})` : ''}
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <span className="font-semibold text-foreground">{item.packUnit}</span>
                        {item.packSize > 1 ? (
                          <div className="text-[11px] text-muted">
                            1 {item.packUnit} = {item.packSize} {item.dispensingUnit}s
                          </div>
                        ) : (
                          <div className="text-[11px] text-muted">{item.dispensingUnit}</div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-mono text-[11px] text-muted">{item.hsCode || '3004.90.00'}</div>
                        {item.isVatApplicable ? (
                          <Badge tone="warning" variant="subtle">
                            13% VAT
                          </Badge>
                        ) : (
                          <Badge tone="success" variant="subtle">
                            Exempt 0%
                          </Badge>
                        )}
                      </td>

                      <td className="px-4 py-3 text-xs">
                        {item.rackLocation ? (
                          <span className="inline-flex items-center gap-1 rounded bg-surface-muted px-2 py-0.5 text-xs font-medium text-foreground">
                            <MapPin className="h-3 w-3 text-muted" />
                            {item.rackLocation}
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <div
                          className={`text-xs font-bold ${
                            isOutOfStock
                              ? 'text-danger'
                              : isLowStock
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-emerald-600 dark:text-emerald-400'
                          }`}
                        >
                          {item.totalStockPacks} {item.packUnit}s
                        </div>
                        <div className="text-[11px] text-muted">
                          ({item.totalStockUnits} {item.dispensingUnit}s)
                        </div>
                      </td>

                      <td className="px-4 py-3 text-xs">
                        <div className="font-extrabold text-foreground">
                          Rs. {item.latestMrpPerPack.toFixed(2)}
                        </div>
                        {item.packSize > 1 && (
                          <div className="text-[10px] text-muted">
                            (Rs. {item.latestUnitMrp.toFixed(2)} / {item.dispensingUnit})
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(item)}
                            title={t('Edit Item')}
                          >
                            <Edit2 className="h-3.5 w-3.5 text-muted hover:text-foreground" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(item.id)}
                            title={t('Delete Item')}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-danger" />
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
      </div>

      {/* Add / Edit Medicine Modal */}
      {isModalOpen && (
        <Modal
          open={true}
          onClose={() => setIsModalOpen(false)}
          title={editingItem ? t('Edit Medicine / Product') : t('Add New Medicine / Product')}
          description={t('Configure pharmaceutical details, dual packaging conversion, VAT rate and rack location.')}
          size="lg"
        >
          <form onSubmit={handleSubmit} className="space-y-4 p-2 text-xs">
            {/* Section 1: Basic Identity */}
            <div className="rounded-lg border border-border p-3 space-y-3 bg-surface-muted/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-primary-600" />
                {t('1. Product Identity & Classification')}
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Brand / Trade Name')} *
                  </label>
                  <Input
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Azithral 500, Cetaphil Cleanser"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Generic / Chemical Composition')}
                  </label>
                  <Input
                    value={formData.genericName || ''}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="e.g. Azithromycin 500mg"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Category')}
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleCategoryChange(e.target.value as PharmacyItemCategory)}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Dosage Form')}
                  </label>
                  <select
                    value={formData.dosageForm}
                    onChange={(e) =>
                      setFormData({ ...formData, dosageForm: e.target.value as PharmacyDosageForm })
                    }
                    className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                  >
                    {DOSAGE_FORMS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Strength / Concentration')}
                  </label>
                  <Input
                    value={formData.strength || ''}
                    onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                    placeholder="e.g. 500mg, 100ml, 5%"
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Manufacturer / Brand Company')}
                  </label>
                  <Input
                    value={formData.manufacturer || ''}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="e.g. Cipla, Sun Pharma, Galderma"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Schedule / Rx Type')}
                  </label>
                  <select
                    value={formData.schedule || 'SCHEDULE_H'}
                    onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                    className="w-full rounded border border-border bg-surface px-2.5 py-1.5 text-xs text-foreground focus:outline-none"
                  >
                    <option value="SCHEDULE_H">Schedule H (Prescription Required)</option>
                    <option value="SCHEDULE_G">Schedule G (Under Medical Supervision)</option>
                    <option value="SCHEDULE_X">Schedule X (Narcotic / Controlled)</option>
                    <option value="OTC">OTC (Over The Counter / General)</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Section 2: Dual Unit Conversion */}
            <div className="rounded-lg border border-border p-3 space-y-3 bg-surface-muted/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-primary-600" />
                {t('2. Packaging & Loose Unit Conversion')}
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Pack Unit (e.g. Strip / Box / Bottle)')}
                  </label>
                  <Input
                    value={formData.packUnit}
                    onChange={(e) => setFormData({ ...formData, packUnit: e.target.value.toUpperCase() })}
                    placeholder="STRIP, BOTTLE, BOX"
                    className="text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Dispensing Unit (Loose Unit)')}
                  </label>
                  <Input
                    value={formData.dispensingUnit}
                    onChange={(e) =>
                      setFormData({ ...formData, dispensingUnit: e.target.value.toUpperCase() })
                    }
                    placeholder="TAB, CAP, ML, PCS"
                    className="text-xs uppercase"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Pack Size (Conversion Ratio)')}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.packSize}
                    onChange={(e) => setFormData({ ...formData, packSize: parseInt(e.target.value) || 1 })}
                    className="text-xs"
                  />
                </div>
              </div>

              <div className="rounded bg-blue-50/50 p-2 text-[11px] text-blue-800 dark:bg-blue-950/30 dark:text-blue-300">
                💡 <strong>Conversion Preview:</strong> 1 {formData.packUnit || 'PACK'} ={' '}
                {formData.packSize} {formData.dispensingUnit || 'UNITS'}. Pharmacists can dispense either full packs or loose pieces.
              </div>
            </div>

            {/* Section 3: Pricing & Nepal IRD VAT Compliance */}
            <div className="rounded-lg border border-border p-3 space-y-3 bg-surface-muted/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-primary-600" />
                {t('3. Nepal IRD Taxation & HS Code')}
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Harmonized System (HS) Code')}
                  </label>
                  <Input
                    value={formData.hsCode || ''}
                    onChange={(e) => setFormData({ ...formData, hsCode: e.target.value })}
                    placeholder="3004.90.00 (Medicines) or 3304.99.00 (Cosmetics)"
                    className="text-xs font-mono"
                  />
                </div>

                <div className="flex items-center gap-3 pt-5">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-foreground">
                    <input
                      type="checkbox"
                      checked={formData.isVatApplicable}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          isVatApplicable: e.target.checked,
                          vatPercentage: e.target.checked ? 13 : 0,
                          hsCode: e.target.checked ? '3304.99.00' : '3004.90.00',
                        })
                      }
                      className="rounded border-border text-primary-600 focus:ring-primary-500"
                    />
                    <span>{t('Apply 13% VAT (Skincare, Cosmetics, Devices)')}</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Section 4: Inventory & Shelf Rack Location */}
            <div className="rounded-lg border border-border p-3 space-y-3 bg-surface-muted/20">
              <h4 className="font-bold text-xs uppercase tracking-wider text-muted flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 text-primary-600" />
                {t('4. Shelf Location & Stock Alerts')}
              </h4>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Rack / Shelf Location')}
                  </label>
                  <Input
                    value={formData.rackLocation || ''}
                    onChange={(e) => setFormData({ ...formData, rackLocation: e.target.value })}
                    placeholder="e.g. Rack A-1, Drawer 3, Refrigerator"
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Min Reorder Level (Units)')}
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={formData.minStockLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, minStockLevel: parseInt(e.target.value) || 1 })
                    }
                    className="text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-foreground block mb-1">
                    {t('Barcode (Optional)')}
                  </label>
                  <Input
                    value={formData.barcode || ''}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    placeholder="Scan or enter barcode"
                    className="text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-border">
              <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>
                {t('Cancel')}
              </Button>
              <Button type="submit">
                {editingItem ? t('Save Changes') : t('Create Medicine / Product')}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default PharmacyMedicinesPage;
