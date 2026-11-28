import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
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
  ShieldCheck,
  Pill,
  Clock,
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

  const [items, setItems] = useState<PharmacyThermalLabelData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<ThermalLabelSize>(defaultSize);
  const [selectedCodeType, setSelectedCodeType] = useState<LabelCodeType>('QR');
  const [copies, setCopies] = useState('1');

  // Auto-calculated zoom scale to fit the preview card perfectly without clipping
  const [zoomLevel, setZoomLevel] = useState<number>(() => {
    return defaultSize === '75x50' ? 1.15 : defaultSize === '50x35' ? 1.4 : 1.65;
  });

  // Adjust default zoom when size changes to avoid clipping
  useEffect(() => {
    if (selectedSize === '75x50') {
      setZoomLevel(1.15);
    } else if (selectedSize === '50x35') {
      setZoomLevel(1.4);
    } else {
      setZoomLevel(1.65);
    }
  }, [selectedSize]);

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

  // Dimensions of selected physical stock
  const currentPreset =
    THERMAL_LABEL_PRESETS.find((p) => p.id === selectedSize) ?? THERMAL_LABEL_PRESETS[0]!;
  const widthMm = currentPreset.widthMm;
  const heightMm = currentPreset.heightMm;

  // Direct thermal roll printing via dedicated window with strict @page geometry
  const handlePrint = async (printAll: boolean = false) => {
    const numCopies = Math.max(1, parseInt(copies, 10) || 1);
    const targetItems = printAll ? items : [currentItem].filter(Boolean) as PharmacyThermalLabelData[];
    if (targetItems.length === 0) return;

    const printWindow = window.open('', '_blank', 'width=700,height=700');
    if (!printWindow) {
      alert('Popup blocker prevented thermal print. Please allow popups for this site.');
      return;
    }

    let labelsHtml = '';
    for (const item of targetItems) {
      const qrPayload = `RX|PT:${item.patientMrn || 'WALKIN'}|${item.patientName || 'PATIENT'}|${item.drugName}|QTY:${item.dispensedQty}|B:${item.batchNumber}|EXP:${item.expiryDate}`;
      const qrDataUri = await QRCode.toDataURL(qrPayload, {
        margin: 0,
        width: 300,
        errorCorrectionLevel: 'M',
      });

      const hospital = item.hospitalName || 'LIMS HOSPITAL DISPENSARY';
      const today = item.dispenseDate || new Date().toISOString().split('T')[0];

      let singleLabelInnerHtml = '';
      if (widthMm >= 75) {
        // 100x50mm or 75x50mm Wide Format (EML-400L 4-Inch / Zebra 3"-4")
        singleLabelInnerHtml = `
          <div style="width: 100%; height: 100%; box-sizing: border-box; padding: 2.5mm 3.5mm; display: flex; flex-direction: column; justify-content: space-between; font-family: system-ui, -apple-system, sans-serif; color: #000; background: #fff;">
            <!-- Header -->
            <div style="border-bottom: 0.4mm solid #000; padding-bottom: 0.8mm; display: flex; justify-content: space-between; align-items: flex-start;">
              <div>
                <div style="font-size: 3.2mm; font-weight: 900; text-transform: uppercase; letter-spacing: -0.2px;">${hospital}</div>
                <div style="font-size: 2.1mm; font-weight: 600; color: #333;">Bedside Dispense Unit · Tel: 01-4455660</div>
              </div>
              <div style="text-align: right; font-family: monospace; font-size: 2.2mm;">
                <div>Date: ${today}</div>
                <div style="font-weight: 900; font-size: 2.5mm;">MRN: ${item.patientMrn || 'NA'}</div>
              </div>
            </div>

            <!-- Patient Row -->
            <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 0.25mm solid #666; padding: 0.6mm 0; font-size: 2.5mm;">
              <div>
                <span style="color: #444; font-weight: 600;">Patient: </span>
                <strong style="font-size: 2.9mm; font-weight: 900;">${item.patientName || 'Walk-in Patient'}</strong>
                ${item.patientAgeGender ? `<span style="font-weight: bold; margin-left: 1mm;">(${item.patientAgeGender})</span>` : ''}
              </div>
              ${item.doctorName ? `<div style="font-size: 2.3mm;"><span style="color: #444;">Prescriber: </span><strong>${item.doctorName}</strong></div>` : ''}
            </div>

            <!-- Middle: Drug & Directions + QR Code -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 3mm; margin: auto 0; padding: 0.8mm 0;">
              <div style="flex: 1; min-width: 0;">
                <div style="display: flex; justify-content: space-between; align-items: baseline;">
                  <span style="font-size: 3.8mm; font-weight: 900; letter-spacing: -0.2px;">${item.drugName}</span>
                  <span style="font-size: 2.5mm; font-weight: 900; background: #000; color: #fff; padding: 0.3mm 1mm; border-radius: 0.4mm; margin-left: 2mm;">
                    Qty: ${item.dispensedQty} ${item.dosageForm || 'Units'}
                  </span>
                </div>
                ${item.genericName ? `<div style="font-size: 2.2mm; font-style: italic; color: #444;">${item.genericName}</div>` : ''}

                <div style="margin-top: 1mm; border: 0.35mm solid #000; border-radius: 0.6mm; padding: 0.8mm 1.2mm; background: #f9f9f9;">
                  <div style="font-size: 1.8mm; font-weight: 900; text-transform: uppercase; color: #444;">Dosage Directions (प्रयोग विधि):</div>
                  <div style="font-size: 2.8mm; font-weight: 900; line-height: 1.15;">${item.instructionsEn}</div>
                  ${item.instructionsNp ? `<div style="font-size: 2.6mm; font-weight: 800; color: #111; margin-top: 0.3mm;">${item.instructionsNp}</div>` : ''}
                </div>
              </div>

              <!-- 5-Rights QR Code -->
              <div style="flex-shrink: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; border: 0.3mm solid #000; border-radius: 0.6mm; padding: 1mm; background: #fff;">
                <img src="${qrDataUri}" style="width: 19mm; height: 19mm; object-fit: contain; display: block;" alt="QR" />
                <span style="font-size: 1.7mm; font-weight: 900; text-transform: uppercase; margin-top: 0.4mm; letter-spacing: 0.2px;">5-Rights Scan</span>
              </div>
            </div>

            <!-- Footer -->
            <div style="border-top: 0.35mm solid #000; padding-top: 0.6mm; display: flex; justify-content: space-between; align-items: center; font-size: 2.3mm;">
              <div style="font-family: monospace; font-weight: bold; display: flex; gap: 4mm;">
                <span>Batch: ${item.batchNumber || 'NA'}</span>
                <span>Exp: ${item.expiryDate || 'NA'}</span>
              </div>
              ${item.advisoryNote ? `<div style="font-weight: 900; font-size: 2.2mm;">⚠️ ${item.advisoryNote}</div>` : ''}
            </div>
          </div>
        `;
      } else {
        // 50x25mm and 50x35mm Compact Standard Layout
        singleLabelInnerHtml = `
          <div style="width: 100%; height: 100%; box-sizing: border-box; padding: 1mm 1.3mm; display: flex; flex-direction: column; justify-content: space-between; font-family: system-ui, -apple-system, sans-serif; color: #000; background: #fff;">
            <!-- Header -->
            <div style="font-size: 1.9mm; font-weight: 900; border-bottom: 0.25mm solid #000; padding-bottom: 0.3mm; display: flex; justify-content: space-between; text-transform: uppercase;">
              <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 34mm;">${hospital}</span>
              <span style="font-family: monospace; font-size: 1.7mm; font-weight: normal;">${today}</span>
            </div>

            <!-- Middle: Content + QR Code side by side -->
            <div style="display: flex; justify-content: space-between; align-items: center; gap: 1mm; margin: auto 0;">
              <div style="flex: 1; max-width: ${widthMm - 14}mm; overflow: hidden; line-height: 1.1;">
                <div style="display: flex; align-items: baseline; gap: 1mm; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                  <strong style="font-size: 2.3mm; font-weight: 900;">${item.patientName || 'Walk-in'}</strong>
                  <span style="font-family: monospace; font-size: 1.8mm; color: #333;">#${item.patientMrn || 'NA'}</span>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: baseline; margin-top: 0.3mm;">
                  <strong style="font-size: 2.5mm; font-weight: 900; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 25mm;">
                    ${item.drugName}
                  </strong>
                  <span style="font-size: 2.0mm; font-weight: 900; background: #000; color: #fff; padding: 0.1mm 0.6mm; border-radius: 0.3mm;">
                    Qty: ${item.dispensedQty}
                  </span>
                </div>

                <div style="margin-top: 0.4mm; font-size: 1.9mm; font-weight: 700; color: #111; line-height: 1.1;">
                  <div>${item.instructionsEn}</div>
                  ${item.instructionsNp ? `<div style="font-size: 1.8mm; color: #222;">${item.instructionsNp}</div>` : ''}
                </div>
              </div>

              <!-- QR Code (11.5mm x 11.5mm) -->
              <div style="flex-shrink: 0; display: flex; align-items: center; justify-content: center;">
                <img src="${qrDataUri}" style="width: 11.5mm; height: 11.5mm; object-fit: contain; display: block;" alt="QR" />
              </div>
            </div>

            <!-- Footer -->
            <div style="font-size: 1.7mm; font-family: monospace; border-top: 0.25mm solid #000; padding-top: 0.3mm; display: flex; justify-content: space-between; align-items: center;">
              <span>B:${item.batchNumber || 'NA'}</span>
              <span>EXP:${item.expiryDate || 'NA'}</span>
              ${item.advisoryNote ? `<span style="font-family: sans-serif; font-weight: 900; font-size: 1.6mm;">* ${(item.advisoryNote.split('(')[0] || '').trim()}</span>` : ''}
            </div>
          </div>
        `;
      }

      for (let c = 0; c < numCopies; c++) {
        labelsHtml += `
          <div class="label-page" style="width: ${widthMm}mm; height: ${heightMm}mm;">
            ${singleLabelInnerHtml}
          </div>
        `;
      }
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Thermal Label - ${currentItem?.patientMrn || 'Pharmacy'}</title>
          <style>
            @page {
              size: ${widthMm}mm ${heightMm}mm;
              margin: 0mm;
            }
            * {
              box-sizing: border-box;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            html, body {
              margin: 0;
              padding: 0;
              width: ${widthMm}mm;
              height: ${heightMm}mm;
              background: #fff;
              font-family: system-ui, -apple-system, sans-serif;
            }
            .label-page {
              width: ${widthMm}mm;
              height: ${heightMm}mm;
              page-break-after: always;
              page-break-inside: avoid;
              overflow: hidden;
              display: block;
            }
            @media screen {
              body { background: #eee; padding: 10px; display: flex; flex-direction: column; gap: 10px; align-items: center; }
              .label-page { border: 1px solid #ccc; background: #fff; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 10px; }
            }
          </style>
        </head>
        <body>
          ${labelsHtml}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 700);
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
      <div className="flex flex-col gap-4">
        {/* Top Sticky Ribbon: Stock Size + Barcode Engine + Multi-Item Stepper */}
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface-muted/40 p-2.5 backdrop-blur-xs">
          {/* Label Stock Selector */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted">
              {t('Label Roll')}:
            </span>
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-2xs">
              {THERMAL_LABEL_PRESETS.map((preset) => {
                const isSelected = selectedSize === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedSize(preset.id)}
                    className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-semibold transition ${
                      isSelected
                        ? 'bg-primary text-primary-foreground shadow-xs'
                        : 'text-muted-foreground hover:bg-surface-muted hover:text-foreground'
                    }`}
                  >
                    <span className="font-mono">{preset.name}</span>
                    <span className="hidden sm:inline text-[10px] opacity-75">
                      ({preset.id === '50x25' ? 'Vial/Strip' : preset.id === '50x35' ? 'Bottle' : 'IV/Bag'})
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Toolbar: Multi-item navigation + Code Type */}
          <div className="flex items-center gap-2">
            {/* Multiple Items Navigator */}
            {items.length > 1 && (
              <div className="flex items-center gap-1 rounded-lg border border-border bg-surface px-2 py-0.5 shadow-2xs">
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </Button>
                <span className="text-[11px] font-bold text-foreground">
                  {currentIndex + 1} / {items.length}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0"
                  disabled={currentIndex === items.length - 1}
                  onClick={() => setCurrentIndex((prev) => Math.min(items.length - 1, prev + 1))}
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}

            {/* Code Selector */}
            <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-2xs">
              <button
                type="button"
                onClick={() => setSelectedCodeType('QR')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                  selectedCodeType === 'QR'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <QrCode className="h-3.5 w-3.5" />
                QR 5-Rights
              </button>
              <button
                type="button"
                onClick={() => setSelectedCodeType('BARCODE')}
                className={`flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold transition ${
                  selectedCodeType === 'BARCODE'
                    ? 'bg-primary text-primary-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Barcode className="h-3.5 w-3.5" />
                Code128
              </button>
            </div>
          </div>
        </div>

        {/* Main Workstation: 2-Column Split */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-12 items-start">
          {/* Left Column: Clean Medical Thermal Sticker Canvas */}
          <div className="flex flex-col rounded-2xl border border-border/80 bg-surface-muted/30 p-4 shadow-2xs lg:col-span-5">
            {/* Canvas Header & Zoom Controls */}
            <div className="flex items-center justify-between border-b border-border/70 pb-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-foreground">
                <Tag className="h-3.5 w-3.5 text-primary" />
                <span>{t('Physical Sticker')}</span>
                <span className="font-mono text-[11px] text-muted font-normal">
                  ({widthMm} × {heightMm} mm)
                </span>
              </div>

              {/* Interactive Zoom Bar */}
              <div className="flex items-center gap-1 bg-surface border border-border/80 rounded-md p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.9, +(z - 0.2).toFixed(2)))}
                  className="rounded p-1 hover:bg-surface-muted text-muted hover:text-foreground transition"
                  title="Zoom Out"
                >
                  <ZoomOut className="h-3.5 w-3.5" />
                </button>
                <span className="font-mono text-[10px] px-1 text-foreground font-semibold">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.0, +(z + 0.2).toFixed(2)))}
                  className="rounded p-1 hover:bg-surface-muted text-muted hover:text-foreground transition"
                  title="Zoom In"
                >
                  <ZoomIn className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Sticker Preview Mount - Clean textured workbench, perfectly bounded */}
            <div className="flex min-h-[220px] max-h-[300px] items-center justify-center overflow-auto p-4 py-6 rounded-xl border border-dashed border-border/80 bg-surface/70 mt-3">
              <div
                style={{
                  width: `${widthMm * zoomLevel}mm`,
                  height: `${heightMm * zoomLevel}mm`,
                  maxWidth: '100%',
                }}
                className="relative shrink-0 rounded-xs bg-white text-black shadow-md border border-gray-300 transition-all duration-200"
              >
                <div
                  style={{
                    width: `${widthMm}mm`,
                    height: `${heightMm}mm`,
                    transform: `scale(${zoomLevel})`,
                    transformOrigin: 'top left',
                  }}
                  className="overflow-hidden"
                >
                  <PharmacyThermalLabel
                    data={{
                      ...currentItem,
                      size: selectedSize,
                      codeType: selectedCodeType,
                    }}
                    scale={1}
                  />
                </div>
              </div>
            </div>

            {/* 5-Rights Bedside Verification Indicator */}
            <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/80 dark:border-emerald-800/40 dark:bg-emerald-950/30 p-2.5 text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-800 dark:text-emerald-300 text-[11px]">
                <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>{t('Clinical 5-Rights QR Verification Ready')}</span>
              </div>
              <p className="mt-1 text-[10px] leading-relaxed text-emerald-900/80 dark:text-emerald-200/80">
                Encodes structured patient MRN, drug lot, dose instruction, and expiry for bedside nurse barcode verification.
              </p>
            </div>
          </div>

          {/* Right Column: Clean Structured Form without nested scrollbars */}
          <div className="flex flex-col gap-3.5 lg:col-span-7">
            {/* Group 1: Bilingual Quick Dosage Presets (En/Nepali) */}
            <div className="rounded-xl border border-border/80 bg-surface p-3 shadow-2xs">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-primary" />
                  {t('Quick Dosage Directions (प्रयोग विधि)')}
                </span>
                <span className="text-[10px] text-muted">1-Click Apply</span>
              </div>

              {/* 3-Column Preset Chips Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {DOSAGE_INSTRUCTION_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => handleApplyPreset(preset)}
                    className="flex flex-col rounded-lg border border-border/80 bg-surface-muted/40 p-1.5 text-left transition hover:border-primary hover:bg-primary/5 active:scale-98"
                  >
                    <span className="font-extrabold text-[10px] text-primary truncate">
                      {preset.label}
                    </span>
                    <span className="text-[10px] text-foreground/80 truncate">
                      {preset.np}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Group 2: Patient & Medication Input Grid */}
            <div className="rounded-xl border border-border/80 bg-surface p-3 shadow-2xs space-y-2.5">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Pill className="h-3.5 w-3.5 text-primary" />
                {t('Medicine & Patient Identifiers')}
              </span>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('Patient Name')}
                  </label>
                  <Input
                    value={currentItem.patientName || ''}
                    onChange={(e) => updateCurrentItem({ patientName: e.target.value })}
                    placeholder="Patient Full Name"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('MRN / Hospital ID')}
                  </label>
                  <Input
                    value={currentItem.patientMrn || ''}
                    onChange={(e) => updateCurrentItem({ patientMrn: e.target.value })}
                    placeholder="MRN-001"
                    className="h-8 text-xs"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('Medicine Name')}
                  </label>
                  <Input
                    value={currentItem.drugName || ''}
                    onChange={(e) => updateCurrentItem({ drugName: e.target.value })}
                    placeholder="Drug & Strength"
                    className="h-8 text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('Dispensed Quantity')}
                  </label>
                  <Input
                    value={currentItem.dispensedQty}
                    onChange={(e) => updateCurrentItem({ dispensedQty: e.target.value })}
                    placeholder="10 Tabs"
                    className="h-8 text-xs font-semibold"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('Batch Number')}
                  </label>
                  <Input
                    value={currentItem.batchNumber || ''}
                    onChange={(e) => updateCurrentItem({ batchNumber: e.target.value })}
                    placeholder="Lot / Batch"
                    className="h-8 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('Expiry Date')}
                  </label>
                  <Input
                    value={currentItem.expiryDate || ''}
                    onChange={(e) => updateCurrentItem({ expiryDate: e.target.value })}
                    placeholder="MM/YYYY"
                    className="h-8 text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Group 3: Direction Fields & Advisory */}
            <div className="rounded-xl border border-border/80 bg-surface p-3 shadow-2xs space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('Directions (English)')}
                  </label>
                  <Input
                    value={currentItem.instructionsEn || ''}
                    onChange={(e) => updateCurrentItem({ instructionsEn: e.target.value })}
                    placeholder="e.g. 1 Tablet Twice Daily After Meals"
                    className="h-8 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-muted block mb-0.5">
                    {t('Directions (नेपाली / Nepali)')}
                  </label>
                  <Input
                    value={currentItem.instructionsNp || ''}
                    onChange={(e) => updateCurrentItem({ instructionsNp: e.target.value })}
                    placeholder="e.g. बिहान-बेलुका १-१ चक्की खानापछि"
                    className="h-8 text-xs font-medium"
                  />
                </div>
              </div>

              {/* Advisory Caution Dropdown */}
              <div className="pt-1">
                <label className="text-[11px] font-semibold text-muted block mb-0.5">
                  {t('Clinical Advisory & Caution Note')}
                </label>
                <Select
                  value={currentItem.advisoryNote || ''}
                  onChange={(e) => updateCurrentItem({ advisoryNote: e.target.value })}
                  className="h-8 text-xs"
                  options={[
                    { value: '', label: '-- No warning note --' },
                    ...ADVISORY_WARNING_PRESETS.map((w) => ({ value: w, label: w })),
                  ]}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-muted">{t('Copies')}:</span>
            <Input
              type="number"
              min="1"
              max="50"
              value={copies}
              onChange={(e) => setCopies(e.target.value)}
              className="w-16 h-8 text-xs text-center font-bold"
            />
            <div className="hidden sm:flex items-center gap-1">
              {['1', '2', '3'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => setCopies(num)}
                  className={`rounded px-2 py-0.5 text-xs font-semibold border ${
                    copies === num
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-border text-muted hover:bg-surface-muted'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="secondary" onClick={onClose} className="text-xs h-9">
              {t('Close')}
            </Button>

            {items.length > 1 && (
              <Button
                variant="secondary"
                onClick={() => handlePrint(true)}
                className="gap-1.5 font-bold text-xs h-9"
              >
                <Layers className="h-4 w-4" />
                {t('Print All {count} Labels', { count: items.length })}
              </Button>
            )}

            <Button
              onClick={() => handlePrint(false)}
              className="gap-2 font-bold shadow-md text-xs h-9 px-4"
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
