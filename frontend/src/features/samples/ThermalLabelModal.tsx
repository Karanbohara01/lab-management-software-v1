import { useState } from 'react';
import { Printer, Copy } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { BarcodeLabel, type LabelPreset } from './BarcodeLabel';
import { useT } from '@/i18n';

interface ThermalLabelModalProps {
  open: boolean;
  onClose: () => void;
  barcodeValue: string;
  patientName: string;
  patientMrn: string;
  patientGender?: string | null;
  patientAge?: string | number | null;
  specimen: string;
  container?: string | null;
  collectedAt?: string | null;
}

const PRESETS: { value: LabelPreset; label: string; widthMm: number; heightMm: number }[] = [
  { value: '50x25', label: '50 × 25 mm (Vacutainer Tube)', widthMm: 50, heightMm: 25 },
  { value: '50x30', label: '50 × 30 mm (Standard Blood Tube)', widthMm: 50, heightMm: 30 },
  { value: '50x70', label: '50 × 70 mm (Large Requisition / Bottle)', widthMm: 50, heightMm: 70 },
];

export function ThermalLabelModal({
  open,
  onClose,
  barcodeValue,
  patientName,
  patientMrn,
  patientGender,
  patientAge,
  specimen,
  container,
  collectedAt,
}: ThermalLabelModalProps) {
  const t = useT();
  const [preset, setPreset] = useState<LabelPreset>('50x25');
  const [copies, setCopies] = useState('1');

  const selectedPreset = PRESETS.find((p) => p.value === preset) ?? PRESETS[0]!;

  const handlePrint = () => {
    const numCopies = Math.max(1, parseInt(copies, 10) || 1);
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const labelHtml = `
      <div style="width: ${selectedPreset.widthMm}mm; height: ${selectedPreset.heightMm}mm; page-break-after: always; display: flex; align-items: center; justify-content: center;">
        <div style="width: 100%; height: 100%;">
          ${document.getElementById('thermal-label-preview-target')?.innerHTML || ''}
        </div>
      </div>
    `;

    const labels = Array.from({ length: numCopies }, () => labelHtml).join('\n');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${barcodeValue}</title>
          <style>
            @page {
              size: ${selectedPreset.widthMm}mm ${selectedPreset.heightMm}mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: system-ui, -apple-system, sans-serif;
            }
          </style>
        </head>
        <body>
          ${labels}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('Print Barcode Label')}
      description={t('Print thermal label for accession {acc}', { acc: barcodeValue })}
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('Cancel')}
          </Button>
          <Button onClick={handlePrint}>
            <Printer className="h-4 w-4" aria-hidden />
            {t('Print {count} Label(s)', { count: Math.max(1, parseInt(copies, 10) || 1) })}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Select
            label={t('Label Size')}
            value={preset}
            onChange={(e) => setPreset(e.target.value as LabelPreset)}
            options={PRESETS.map((p) => ({ value: p.value, label: p.label }))}
          />
          <Input
            label={t('Copies')}
            type="number"
            min={1}
            max={10}
            value={copies}
            onChange={(e) => setCopies(e.target.value)}
            leadingIcon={<Copy className="h-4 w-4 text-muted" aria-hidden />}
          />
        </div>

        {/* Live Visual Preview */}
        <div className="rounded-lg border border-border bg-surface-muted/50 p-6 flex flex-col items-center justify-center">
          <span className="text-xs text-muted mb-2 font-mono">
            {selectedPreset.label} · 1:1 {t('Thermal Preview')}
          </span>
          <div
            id="thermal-label-preview-target"
            className="shadow-md rounded-sm border border-neutral-300 overflow-hidden bg-white"
          >
            <BarcodeLabel
              value={barcodeValue}
              patientName={patientName}
              patientMrn={patientMrn}
              patientGender={patientGender}
              patientAge={patientAge}
              specimen={specimen}
              container={container}
              collectedAt={collectedAt}
              size={preset}
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
