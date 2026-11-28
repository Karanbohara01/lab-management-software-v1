import { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import JsBarcode from 'jsbarcode';

export type ThermalLabelSize = '50x25' | '50x35' | '75x50';
export type LabelCodeType = 'QR' | 'BARCODE';

export interface PharmacyThermalLabelData {
  id?: string | number;
  hospitalName?: string;
  patientName: string;
  patientMrn: string;
  patientAgeGender?: string;
  doctorName?: string;
  drugName: string;
  genericName?: string;
  dosageForm?: string;
  dispensedQty: number | string;
  batchNumber: string;
  expiryDate: string;
  dispenseDate?: string;
  instructionsEn: string;
  instructionsNp?: string;
  advisoryNote?: string;
  size?: ThermalLabelSize;
  codeType?: LabelCodeType;
}

export const THERMAL_LABEL_PRESETS: {
  id: ThermalLabelSize;
  name: string;
  widthMm: number;
  heightMm: number;
  description: string;
}[] = [
  {
    id: '50x25',
    name: '50 × 25 mm',
    widthMm: 50,
    heightMm: 25,
    description: 'Compact Strip / Ampoule / Oral Syringe (Standard Hospital)',
  },
  {
    id: '50x35',
    name: '50 × 35 mm',
    widthMm: 50,
    heightMm: 35,
    description: 'Standard Pill Bottle / Suspension Bottle',
  },
  {
    id: '75x50',
    name: '75 × 50 mm',
    widthMm: 75,
    heightMm: 50,
    description: 'Large IV Infusion / Multi-Dose Pack',
  },
];

export const DOSAGE_INSTRUCTION_PRESETS = [
  {
    label: 'OD (Once Daily)',
    en: '1 Tablet Once Daily in the Morning',
    np: 'बिहान १ चक्की',
  },
  {
    label: 'BD (Twice Daily)',
    en: '1 Tablet Twice Daily After Meals',
    np: 'बिहान-बेलुका १-१ चक्की खानापछि',
  },
  {
    label: 'TDS (3 Times Daily)',
    en: '1 Tablet 3 Times Daily After Meals',
    np: 'दिनको ३ पटक १-१ चक्की खानापछि',
  },
  {
    label: 'QID (4 Times Daily)',
    en: '1 Tablet 4 Times Daily',
    np: 'दिनको ४ पटक १-१ चक्की',
  },
  {
    label: 'HS (Bedtime)',
    en: '1 Tablet Once Daily at Bedtime',
    np: 'राती सुत्ने बेलामा १ चक्की',
  },
  {
    label: 'SOS (As Needed)',
    en: '1 Tablet as Needed for Severe Pain',
    np: 'दुख्दा मात्र १ चक्की',
  },
  {
    label: 'Empty Stomach (AC)',
    en: 'Take on Empty Stomach 30 mins before food',
    np: 'बिहान खाली पेटमा खाना खानुभन्दा अगाडी',
  },
  {
    label: 'Syrup (5ml TDS)',
    en: '5 ml (1 teaspoonful) 3 Times Daily',
    np: '५ मि.लि. (१ चम्चा) दिनको ३ पटक',
  },
  {
    label: 'Eye Drops (1 Drop TDS)',
    en: '1 Drop into Affected Eye 3 Times Daily',
    np: 'आँखामा १ थोपा दिनको ३ पटक',
  },
];

export const ADVISORY_WARNING_PRESETS = [
  'Complete Full Course (औषधि पूरा खानुहोस्)',
  'Take with Plenty of Water (प्रशस्त पानी पिउनुहोस्)',
  'Keep in Refrigerator 2-8°C (फ्रिजमा राख्नुहोस्)',
  'May Cause Drowsiness (झुम्म बनाउन सक्छ)',
  'Shake Well Before Use (हल्लाएर मात्र प्रयोग गर्नुहोस्)',
  'For External Use Only (बाहिरी प्रयोगको लागि मात्र)',
  'Avoid Alcohol (मदिरा सेवन नगर्नुहोस्)',
];

export function PharmacyThermalLabel({
  data,
  scale = 1,
  isPrintDocument = false,
}: {
  data: PharmacyThermalLabelData;
  scale?: number;
  isPrintDocument?: boolean;
}) {
  const [qrUri, setQrUri] = useState<string | null>(null);
  const barcodeRef = useRef<SVGSVGElement>(null);

  const size = data.size || '50x25';
  const codeType = data.codeType || 'QR';
  const hospital = data.hospitalName || 'LIMS HOSPITAL DISPENSARY';
  const today = data.dispenseDate || new Date().toISOString().split('T')[0];

  // Verification Payload for Bedside Scanner
  const qrPayload = `RX|PT:${data.patientMrn || 'WALKIN'}|${data.patientName || 'PATIENT'}|${data.drugName}|QTY:${data.dispensedQty}|B:${data.batchNumber}|EXP:${data.expiryDate}`;

  useEffect(() => {
    let cancelled = false;
    if (codeType === 'QR') {
      QRCode.toDataURL(qrPayload, {
        margin: 0,
        width: 250,
        errorCorrectionLevel: 'M',
      })
        .then((uri) => {
          if (!cancelled) setQrUri(uri);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, [qrPayload, codeType]);

  useEffect(() => {
    if (codeType === 'BARCODE' && barcodeRef.current) {
      try {
        const barcodeVal = data.batchNumber || data.patientMrn || 'MED123';
        JsBarcode(barcodeRef.current, barcodeVal, {
          format: 'CODE128',
          displayValue: false,
          margin: 0,
          height: size === '50x25' ? 20 : 28,
          width: 1.3,
        });
      } catch {
        // Fallback gracefully
      }
    }
  }, [data.batchNumber, data.patientMrn, codeType, size]);

  // Sizing definitions
  if (size === '50x25') {
    return (
      <div
        {...(isPrintDocument ? { id: 'pharmacy-label-print' } : {})}
        style={{
          width: '50mm',
          height: '25mm',
          padding: '1mm 1.2mm',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
        className="box-border flex flex-col justify-between overflow-hidden border border-gray-300 bg-white text-black font-sans select-none print:border-0 print:m-0"
      >
        {/* Row 1: Hospital Name & Date */}
        <div className="flex items-center justify-between border-b border-black/40 pb-[0.4mm] text-[1.8mm] font-bold uppercase tracking-tight">
          <span className="truncate max-w-[34mm]">{hospital}</span>
          <span className="font-mono text-[1.7mm] font-normal">{today}</span>
        </div>

        {/* Middle Main Content Grid: Text on Left (37mm), QR/Barcode on Right (11mm) */}
        <div className="flex items-center justify-between gap-[1mm] my-auto">
          <div className="flex flex-col justify-center max-w-[36.5mm] overflow-hidden leading-tight">
            {/* Patient Name & MRN */}
            <div className="flex items-baseline gap-1 truncate">
              <span className="font-extrabold text-[2.2mm] truncate">{data.patientName || 'Walk-in Patient'}</span>
              <span className="font-mono text-[1.8mm] text-gray-700 shrink-0">#{data.patientMrn || 'NA'}</span>
            </div>

            {/* Drug Name & Quantity */}
            <div className="flex items-baseline justify-between mt-[0.3mm]">
              <span className="font-black text-[2.4mm] tracking-tight truncate max-w-[28mm]">
                {data.drugName}
              </span>
              <span className="font-bold text-[2.0mm] bg-black text-white px-[0.6mm] py-[0.1mm] rounded-[0.3mm] shrink-0">
                Qty: {data.dispensedQty}
              </span>
            </div>

            {/* Directions / Sig (English + Nepali) */}
            <div className="mt-[0.4mm] text-[1.9mm] font-semibold text-gray-900 leading-[1.1] truncate">
              {data.instructionsEn}
              {data.instructionsNp && <span className="block text-[1.8mm] text-gray-800 truncate">{data.instructionsNp}</span>}
            </div>
          </div>

          {/* QR Code / Barcode (11mm x 11mm) */}
          <div className="shrink-0 flex flex-col items-center justify-center">
            {codeType === 'QR' && qrUri ? (
              <img src={qrUri} alt="QR" className="w-[11.5mm] h-[11.5mm] object-contain" />
            ) : codeType === 'BARCODE' ? (
              <svg ref={barcodeRef} className="w-[11.5mm] h-[11.5mm]" />
            ) : (
              <div className="w-[11.5mm] h-[11.5mm] border border-dashed border-gray-400" />
            )}
          </div>
        </div>

        {/* Row 3: Batch, Expiry & Advisory */}
        <div className="flex items-center justify-between border-t border-black/30 pt-[0.3mm] text-[1.7mm] font-mono leading-none">
          <span>B:{data.batchNumber || 'NA'}</span>
          <span>EXP:{data.expiryDate || 'NA'}</span>
          {data.advisoryNote && (
            <span className="font-sans font-bold text-[1.6mm] text-black truncate max-w-[18mm]">
              * {(data.advisoryNote.split('(')[0] || '').trim()}
            </span>
          )}
        </div>
      </div>
    );
  }

  if (size === '50x35') {
    return (
      <div
        {...(isPrintDocument ? { id: 'pharmacy-label-print' } : {})}
        style={{
          width: '50mm',
          height: '35mm',
          padding: '1.4mm 1.6mm',
          transform: scale !== 1 ? `scale(${scale})` : undefined,
          transformOrigin: 'top left',
        }}
        className="box-border flex flex-col justify-between overflow-hidden border border-gray-300 bg-white text-black font-sans select-none print:border-0 print:m-0"
      >
        {/* Header */}
        <div className="border-b border-black/60 pb-[0.6mm]">
          <div className="flex items-center justify-between text-[2.1mm] font-black uppercase tracking-tight">
            <span className="truncate max-w-[35mm]">{hospital}</span>
            <span className="font-mono text-[1.8mm] font-normal">{today}</span>
          </div>
          <div className="flex items-center justify-between text-[1.9mm] text-gray-800 font-bold mt-[0.2mm]">
            <span className="truncate">Pt: {data.patientName}</span>
            <span className="font-mono text-[1.8mm]">MRN: {data.patientMrn}</span>
          </div>
        </div>

        {/* Drug Box */}
        <div className="my-auto py-[0.5mm]">
          <div className="flex items-baseline justify-between">
            <span className="font-black text-[2.7mm] tracking-tight truncate max-w-[32mm]">
              {data.drugName}
            </span>
            <span className="font-bold text-[2.2mm] bg-black text-white px-[0.8mm] py-[0.2mm] rounded-[0.4mm]">
              Qty: {data.dispensedQty} {data.dosageForm || 'Tabs'}
            </span>
          </div>
          {data.genericName && (
            <div className="text-[1.8mm] text-gray-600 truncate italic">{data.genericName}</div>
          )}

          {/* Directions / Sig with Nepali support */}
          <div className="mt-[0.8mm] rounded-[0.5mm] border border-gray-300 p-[0.6mm] bg-gray-50/50">
            <div className="text-[2.1mm] font-bold text-gray-950 leading-tight">
              {data.instructionsEn}
            </div>
            {data.instructionsNp && (
              <div className="text-[2.0mm] font-semibold text-gray-800 leading-tight mt-[0.2mm]">
                {data.instructionsNp}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section: QR + Advisory + Batch/Exp */}
        <div className="border-t border-black/40 pt-[0.5mm] flex items-center justify-between gap-1">
          <div className="flex flex-col text-[1.8mm] font-mono leading-tight">
            <span>B.No: {data.batchNumber}</span>
            <span>Exp: {data.expiryDate}</span>
            {data.advisoryNote && (
              <span className="font-sans font-bold text-[1.7mm] text-black mt-[0.2mm] truncate max-w-[34mm]">
                ⚠️ {data.advisoryNote}
              </span>
            )}
          </div>

          <div className="shrink-0">
            {codeType === 'QR' && qrUri ? (
              <img src={qrUri} alt="QR" className="w-[10mm] h-[10mm] object-contain" />
            ) : (
              <svg ref={barcodeRef} className="w-[10mm] h-[10mm]" />
            )}
          </div>
        </div>
      </div>
    );
  }

  // Large Format: 75x50mm
  return (
    <div
      {...(isPrintDocument ? { id: 'pharmacy-label-print' } : {})}
      style={{
        width: '75mm',
        height: '50mm',
        padding: '2.5mm',
        transform: scale !== 1 ? `scale(${scale})` : undefined,
        transformOrigin: 'top left',
      }}
      className="box-border flex flex-col justify-between overflow-hidden border border-gray-300 bg-white text-black font-sans select-none print:border-0 print:m-0"
    >
      {/* Letterhead Header */}
      <div className="border-b-2 border-black pb-[1mm] flex justify-between items-start">
        <div>
          <h2 className="text-[3mm] font-black uppercase tracking-tight">{hospital}</h2>
          <p className="text-[2.2mm] text-gray-700 font-semibold">Bedside & Inpatient Dispense Unit · Tel: 01-4455660</p>
        </div>
        <div className="text-right text-[2.2mm] font-mono">
          <div>Date: {today}</div>
          <div className="font-bold text-[2.4mm]">MRN: {data.patientMrn}</div>
        </div>
      </div>

      {/* Patient & Doctor */}
      <div className="flex justify-between items-center text-[2.5mm] border-b border-gray-300 py-[0.8mm]">
        <div>
          <span className="font-semibold text-gray-600">Patient: </span>
          <span className="font-black text-[2.8mm]">{data.patientName}</span>
          {data.patientAgeGender && <span className="text-gray-600 font-bold ml-1">({data.patientAgeGender})</span>}
        </div>
        {data.doctorName && (
          <div className="text-right text-[2.3mm]">
            <span className="text-gray-600">Prescriber: </span>
            <span className="font-bold">{data.doctorName}</span>
          </div>
        )}
      </div>

      {/* Main Drug Details */}
      <div className="my-auto py-[1mm] flex items-center justify-between">
        <div className="max-w-[52mm]">
          <div className="text-[3.6mm] font-black tracking-tight">{data.drugName}</div>
          {data.genericName && (
            <div className="text-[2.2mm] italic text-gray-700">{data.genericName}</div>
          )}

          {/* Directions / Sig Box */}
          <div className="mt-[1mm] rounded border-2 border-black p-[1mm] bg-gray-50/70">
            <span className="block text-[1.8mm] font-black uppercase tracking-wider text-gray-700">
              Dosage Instructions (प्रयोग विधि):
            </span>
            <p className="text-[2.7mm] font-black leading-snug">{data.instructionsEn}</p>
            {data.instructionsNp && (
              <p className="text-[2.5mm] font-bold text-gray-900 mt-[0.3mm]">{data.instructionsNp}</p>
            )}
          </div>
        </div>

        {/* Verification QR Code */}
        <div className="shrink-0 flex flex-col items-center justify-center p-1 border border-black/20 rounded">
          {codeType === 'QR' && qrUri ? (
            <img src={qrUri} alt="QR" className="w-[18mm] h-[18mm] object-contain" />
          ) : (
            <svg ref={barcodeRef} className="w-[18mm] h-[14mm]" />
          )}
          <span className="text-[1.8mm] font-bold text-gray-700 uppercase mt-0.5">5-Rights Scan</span>
        </div>
      </div>

      {/* Footer Info */}
      <div className="border-t border-black/60 pt-[1mm] flex justify-between items-center text-[2.2mm]">
        <div className="flex gap-3 font-mono font-bold">
          <span>Dispensed: {data.dispensedQty} {data.dosageForm || 'Units'}</span>
          <span>Batch: {data.batchNumber}</span>
          <span>Exp: {data.expiryDate}</span>
        </div>
        {data.advisoryNote && (
          <div className="font-bold text-black text-[2.1mm]">
            ⚠️ {data.advisoryNote}
          </div>
        )}
      </div>
    </div>
  );
}

export default PharmacyThermalLabel;
