import { useState, useEffect } from 'react';
import {
  Printer,
  Tag,
  QrCode,
  Barcode,
  Layers,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import {
  PharmacyThermalLabel,
  type PharmacyThermalLabelData,
  type ThermalLabelSize,
  type LabelCodeType,
  THERMAL_LABEL_PRESETS,
  DOSAGE_INSTRUCTION_PRESETS,
  ADVISORY_WARNING_PRESETS,
} from './PharmacyThermalLabel';
import { useT } from '@/i18n';

interface PharmacyThermalLabelModalProps {
  open: boolean;
  onClose: () => void;
  initialItems?: PharmacyThermalLabelData[];
  defaultSize?: ThermalLabelSize;
}

export function PharmacyThermalLabelModal({
  open,
  onClose,
  initialItems = [],
  defaultSize = '50x25',
}: PharmacyThermalLabelModalProps) {
  const t = useT();

  // Normalized list of items
  const [items, setItems] = useState<PharmacyThermalLabelData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ThermalLabelSize>(defaultSize);
  const [selectedCodeType, setSelectedCodeType] = useState<LabelCodeType>('QR');
  const [copies, setCopies] = useState('1');
  const [previewScale, setPreviewScale] = useState(2); // 2x preview for on-screen legibility

  useEffect(() => {
    if (initialItems && initialItems.length > 0) {
      setItems(
        initialItems.map((item) => ({
          ...item,
          size: item.size || defaultSize,
          codeType: item.codeType || 'QR',
          instructionsEn: item.instructionsEn || '1 Tablet Twice Daily After Meals',
          instructionsNp: item.instructionsNp || 'बिहान-बेलुका १-१ चक्की खानापछि',
          dispensedQty: item.dispensedQty || 1,
        }))
      );
      setCurrentIndex(0);
    } else {
      // Standalone sample item
      setItems([
        {
          id: 1,
          hospitalName: 'LIMS HOSPITAL DISPENSARY',
          patientName: 'Ram Bahadur Thapa',
          patientMrn: 'MRN-2026-089',
          patientAgeGender: '42M',
          drugName: 'Amoxicillin + Clav 625mg',
          genericName: 'Augmentin 625mg Tab',
          dosageForm: 'Tablet',
          dispensedQty: 10,
          batchNumber: 'AX2910',
          expiryDate: '10/2026',
          instructionsEn: '1 Tablet Twice Daily After Meals',
          instructionsNp: 'बिहान-बेलुका १-१ चक्की खानापछि',
          advisoryNote: 'Complete Full Course (औषधि पूरा खानुहोस्)',
          size: defaultSize,
          codeType: 'QR',
        },
      ]);
      setCurrentIndex(0);
    }
  }, [initialItems, defaultSize, open]);

  const currentItem: PharmacyThermalLabelData | undefined = items[currentIndex];

  const updateCurrentItem = (updates: Partial<PharmacyThermalLabelData>) => {
    setItems((prev) =>
      prev.map((item, idx) => (idx === currentIndex ? { ...item, ...updates } : item))
    );
  };

  const handleApplyPreset = (preset: { en: string; np: string }) => {
    updateCurrentItem({
      instructionsEn: preset.en,
      instructionsNp: preset.np,
    });
  };

  // Direct-to-thermal roll print engine
  const handlePrint = (printAll: boolean = false) => {
    const numCopies = Math.max(1, parseInt(copies, 10) || 1);
    const targetItems = printAll ? items : [currentItem].filter(Boolean) as PharmacyThermalLabelData[];
    if (targetItems.length === 0) return;

    const preset = THERMAL_LABEL_PRESETS.find((p) => p.id === selectedSize) ?? THERMAL_LABEL_PRESETS[0]!;

    const printWindow = window.open('', '_blank', 'width=600,height=600');
    if (!printWindow) {
      // If popup blocked, notify user
      alert('Popup blocker prevented thermal print. Please allow popups for this site.');
      return;
    }

    // Generate HTML for each item x numCopies
    let labelsHtml = '';
    for (const item of targetItems) {
      const itemWithCurrentSettings: PharmacyThermalLabelData = {
        ...item,
        size: selectedSize,
        codeType: selectedCodeType,
      };

      for (let c = 0; c < numCopies; c++) {
        labelsHtml += `
          <div class="label-page">
            <div class="label-container" style="width: ${preset.widthMm}mm; height: ${preset.heightMm}mm;">
              <div style="font-size: 1.8mm; font-weight: 800; border-bottom: 0.3mm solid #000; padding-bottom: 0.3mm; display: flex; justify-content: space-between;">
                <span>${itemWithCurrentSettings.hospitalName || 'LIMS HOSPITAL DISPENSARY'}</span>
                <span style="font-family: monospace;">${itemWithCurrentSettings.dispenseDate || new Date().toISOString().split('T')[0]}</span>
              </div>
              <div style="font-size: 2.2mm; font-weight: 800; margin-top: 0.5mm; display: flex; justify-content: space-between;">
                <span>Pt: ${itemWithCurrentSettings.patientName}</span>
                <span style="font-family: monospace;">#${itemWithCurrentSettings.patientMrn}</span>
              </div>
              <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.5mm;">
                <span style="font-size: 2.5mm; font-weight: 900;">${itemWithCurrentSettings.drugName}</span>
                <span style="font-size: 2.0mm; font-weight: 800; background: #000; color: #fff; padding: 0.2mm 0.8mm; border-radius: 0.4mm;">Qty: ${itemWithCurrentSettings.dispensedQty}</span>
              </div>
              <div style="font-size: 1.9mm; font-weight: 700; margin-top: 0.6mm; line-height: 1.15; border-left: 0.5mm solid #000; padding-left: 0.8mm;">
                <div>${itemWithCurrentSettings.instructionsEn}</div>
                ${itemWithCurrentSettings.instructionsNp ? `<div style="font-size: 1.8mm; color: #222;">${itemWithCurrentSettings.instructionsNp}</div>` : ''}
              </div>
              <div style="font-size: 1.7mm; font-family: monospace; border-top: 0.3mm solid #000; margin-top: auto; padding-top: 0.3mm; display: flex; justify-content: space-between;">
                <span>B:${itemWithCurrentSettings.batchNumber || 'NA'}</span>
                <span>EXP:${itemWithCurrentSettings.expiryDate || 'NA'}</span>
                ${itemWithCurrentSettings.advisoryNote ? `<span style="font-family: sans-serif; font-weight: 800;">* ${itemWithCurrentSettings.advisoryNote.split('(')[0]}</span>` : ''}
              </div>
            </div>
          </div>
        `;
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medication Label - ${currentItem?.patientMrn || 'Pharmacy'}</title>
          <style>
            @page {
              size: ${preset.widthMm}mm ${preset.heightMm}mm;
              margin: 0;
            }
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }
            body {
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              color: #000;
              background: #fff;
            }
            .label-page {
              width: ${preset.widthMm}mm;
              height: ${preset.heightMm}mm;
              page-break-after: always;
              overflow: hidden;
              display: flex;
              align-items: stretch;
            }
            .label-container {
              width: 100%;
              height: 100%;
              padding: 1.2mm 1.5mm;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              overflow: hidden;
            }
            @media screen {
              body { background: #eee; padding: 10px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
              .label-page { border: 1px solid #ccc; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 600);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (!open || !currentItem) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Bedside & POS Thermal Medication Label Maker')}
      size="xl"
    >
      <div className="space-y-4">
        {/* Top Control Bar: Multi-item navigation + Sizing */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/70 bg-surface-muted/50 p-3">
          {/* Multiple Item Stepper */}
          {items.length > 1 && (
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-muted">
                {t('Medicine')} {currentIndex + 1} of {items.length}:
              </span>
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="max-w-[140px] truncate text-xs font-bold text-foreground">
                  {currentItem.drugName}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  className="h-7 w-7 p-0"
                  disabled={currentIndex === items.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* Size Preset Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted">{t('Label Stock')}:</span>
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
              {THERMAL_LABEL_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setSelectedSize(preset.id)}
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                    selectedSize === preset.id
                      ? 'bg-primary text-primary-foreground shadow-xs'
                      : 'text-muted hover:text-foreground'
                  }`}
                >
                  {preset.name}
                </button>
              ))}
            </div>
          </div>

          {/* Code Type Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-semibold text-muted">{t('Code')}:</span>
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5">
              <button
                type="button"
                onClick={() => setSelectedCodeType('QR')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  selectedCodeType === 'QR'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                QR 5-Rights
              </button>
              <button
                type="button"
                onClick={() => setSelectedCodeType('BARCODE')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${
                  selectedCodeType === 'BARCODE'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted hover:text-foreground'
                }`}
              >
                <Barcode className="h-3.5 w-3.5" />
                Code128
              </button>
            </div>
          </div>
        </div>

        {/* Main Grid: Live Preview (Left) vs Controls & Presets (Right) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Left Column: Live Visual Thermal Preview */}
          <div className="flex flex-col items-center justify-center rounded-2xl border border-border/80 bg-gray-100/80 p-6 dark:bg-gray-950/40 lg:col-span-5">
            <div className="flex items-center justify-between w-full mb-3 text-xs text-muted">
              <span className="font-semibold flex items-center gap-1">
                <Tag className="h-3.5 w-3.5" />
                {t('Thermal Sticker Preview')} ({selectedSize}mm)
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setPreviewScale((prev) => (prev === 2 ? 1.4 : 2))}
                  className="rounded p-1 hover:bg-surface text-foreground"
                  title="Toggle Zoom"
                >
                  {previewScale === 2 ? <ZoomOut className="h-3.5 w-3.5" /> : <ZoomIn className="h-3.5 w-3.5" />}
                </button>
                <span className="text-[11px] font-mono">{previewScale}x view</span>
              </div>
            </div>

            {/* Rendered Label Component */}
            <div className="shadow-lg rounded-sm overflow-hidden bg-white">
              <PharmacyThermalLabel
                data={{
                  ...currentItem,
                  size: selectedSize,
                  codeType: selectedCodeType,
                }}
                scale={previewScale}
              />
            </div>

            <p className="mt-4 text-[11px] text-center text-muted">
              {t('Prints true physical dimensions on direct-thermal label rolls without margin clipping.')}
            </p>
          </div>

          {/* Right Column: Prescription Details & Bilingual Preset Pills */}
          <div className="space-y-4 lg:col-span-7">
            {/* Quick Presets for Dosage (English + Nepali) */}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 flex items-center gap-1">
                <span>{t('Quick Dosage Instructions (द्रुत प्रयोग विधि)')}:</span>
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto pr-1">
                {DOSAGE_INSTRUCTION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-foreground hover:border-primary hover:bg-primary/5 transition text-left"
                  >
                    <span className="font-bold text-primary mr-1">{preset.label}:</span>
                    <span>{preset.np}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Editable Fields Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-muted block mb-1">{t('Patient Name')}</label>
                <Input
                  value={currentItem.patientName || ''}
                  onChange={(e) => updateCurrentItem({ patientName: e.target.value })}
                  placeholder="Patient Name"
                />
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1">{t('MRN / Hospital ID')}</label>
                <Input
                  value={currentItem.patientMrn || ''}
                  onChange={(e) => updateCurrentItem({ patientMrn: e.target.value })}
                  placeholder="MRN-001"
                />
              </div>

              <div>
                <label className="font-semibold text-muted block mb-1">{t('Medicine Name')}</label>
                <Input
                  value={currentItem.drugName || ''}
                  onChange={(e) => updateCurrentItem({ drugName: e.target.value })}
                  placeholder="Drug Name & Strength"
                />
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1">{t('Dispensed Quantity')}</label>
                <Input
                  type="number"
                  min="1"
                  value={currentItem.dispensedQty}
                  onChange={(e) => updateCurrentItem({ dispensedQty: e.target.value })}
                  placeholder="10"
                />
              </div>

              <div>
                <label className="font-semibold text-muted block mb-1">{t('Batch Number')}</label>
                <Input
                  value={currentItem.batchNumber || ''}
                  onChange={(e) => updateCurrentItem({ batchNumber: e.target.value })}
                  placeholder="Batch No"
                />
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1">{t('Expiry Date')}</label>
                <Input
                  value={currentItem.expiryDate || ''}
                  onChange={(e) => updateCurrentItem({ expiryDate: e.target.value })}
                  placeholder="MM/YYYY"
                />
              </div>
            </div>

            {/* Custom Instruction Inputs */}
            <div className="space-y-2">
              <div>
                <label className="font-semibold text-muted block mb-1 text-xs">
                  {t('Directions (English)')}
                </label>
                <Input
                  value={currentItem.instructionsEn || ''}
                  onChange={(e) => updateCurrentItem({ instructionsEn: e.target.value })}
                  placeholder="e.g. 1 Tablet Twice Daily After Meals"
                />
              </div>
              <div>
                <label className="font-semibold text-muted block mb-1 text-xs">
                  {t('Directions (Nepali / नेपाली)')}
                </label>
                <Input
                  value={currentItem.instructionsNp || ''}
                  onChange={(e) => updateCurrentItem({ instructionsNp: e.target.value })}
                  placeholder="e.g. बिहान-बेलुका १-१ चक्की खानापछि"
                />
              </div>
            </div>

            {/* Advisory Warnings Dropdown */}
            <div>
              <label className="font-semibold text-muted block mb-1 text-xs">
                {t('Clinical Caution & Advisory Warning')}
              </label>
              <Select
                value={currentItem.advisoryNote || ''}
                onChange={(e) => updateCurrentItem({ advisoryNote: e.target.value })}
                options={[
                  { value: '', label: '-- No specific warning note --' },
                  ...ADVISORY_WARNING_PRESETS.map((warning) => ({
                    value: warning,
                    label: warning,
                  })),
                ]}
              />
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted">{t('Copies')}:</span>
            <Input
              type="number"
              min="1"
              max="50"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              className="w-16 h-8 text-xs text-center"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose}>
              {t('Close')}
            </Button>

            {items.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => handlePrint(true)}
                className="gap-1.5 font-semibold text-xs"
              >
                <Layers className="h-4 w-4" />
                {t('Print All {count} Labels', { count: items.length })}
              </Button>
            )}

            <Button
              onClick={() => handlePrint(false)}
              className="gap-1.5 font-bold shadow-md"
            >
              <Printer className="h-4 w-4" />
              {t('Print Sticker (Thermal Roll)')}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default PharmacyThermalLabelModal;
