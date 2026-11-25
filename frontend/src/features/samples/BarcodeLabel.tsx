import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';
import { useT } from '@/i18n';

export type LabelPreset = '50x25' | '50x30' | '50x70';

export interface BarcodeLabelProps {
  value: string;
  patientName: string;
  patientMrn: string;
  patientGender?: string | null;
  patientAge?: string | number | null;
  specimen: string;
  container?: string | null;
  collectedAt?: string | null;
  size?: LabelPreset;
}

export function formatDemographics(gender?: string | null, age?: string | number | null): string {
  const g = gender
    ? gender.toUpperCase().startsWith('M')
      ? 'M'
      : gender.toUpperCase().startsWith('F')
        ? 'F'
        : gender.slice(0, 1).toUpperCase()
    : '';
  const a = age != null && age !== '' ? `${age}${typeof age === 'number' ? 'y' : ''}` : '';
  if (g && a) return `${g} · ${a}`;
  return g || a;
}

/**
 * A print-ready specimen label sized to physical direct-thermal label stocks.
 * Sizing is in mm (physical unit in CSS) so it prints true-to-size regardless of screen DPI.
 * Supports:
 * - 50x25mm: Compact vacutainer blood collection tube standard
 * - 50x30mm: Standard blood & aliquot tube
 * - 50x70mm: Large bottle / specimen requisition container
 */
export function BarcodeLabel({
  value,
  patientName,
  patientMrn,
  patientGender,
  patientAge,
  specimen,
  container,
  size = '50x70',
}: BarcodeLabelProps) {
  const t = useT();
  const svgRef = useRef<SVGSVGElement>(null);
  const demoTag = formatDemographics(patientGender, patientAge);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      const barcodeHeight = size === '50x25' ? 24 : size === '50x30' ? 34 : 44;
      JsBarcode(svg, value, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: barcodeHeight,
        width: 1.5,
      });

      const w = parseFloat(svg.getAttribute('width') ?? '');
      const h = parseFloat(svg.getAttribute('height') ?? '');
      if (w > 0 && h > 0) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    } catch {
      /* invalid value — leave the SVG empty */
    }
  }, [value, size]);

  if (size === '50x25') {
    return (
      <div
        style={{ width: '50mm', height: '25mm', padding: '1.2mm 1.5mm' }}
        className="box-border flex flex-col items-stretch justify-between overflow-hidden border border-border bg-white text-black print:border-0"
      >
        <svg
          ref={svgRef}
          style={{ height: '9.5mm', width: '100%' }}
          role="img"
          aria-label={t('Barcode {value}', { value })}
        />
        <div className="flex items-center justify-between text-black" style={{ fontSize: '2.5mm', lineHeight: '1.1' }}>
          <span className="font-mono font-bold tracking-tight">{value}</span>
          <span className="font-mono text-[2.2mm]">{patientMrn}</span>
        </div>
        <div className="flex items-center justify-between text-black truncate" style={{ fontSize: '2.4mm', lineHeight: '1.1' }}>
          <span className="font-semibold truncate max-w-[28mm]">{patientName}</span>
          {demoTag && (
            <span className="font-bold text-[2.2mm] shrink-0 border border-black/40 px-[0.6mm] rounded-[0.4mm] bg-black/5">
              {demoTag}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between text-black truncate" style={{ fontSize: '2.1mm', lineHeight: '1' }}>
          <span className="truncate max-w-[32mm]">{specimen}</span>
          {container ? <span className="truncate text-[2mm] text-black/80">{container}</span> : null}
        </div>
      </div>
    );
  }

  if (size === '50x30') {
    return (
      <div
        style={{ width: '50mm', height: '30mm', padding: '1.8mm 2mm' }}
        className="box-border flex flex-col items-stretch justify-between overflow-hidden border border-border bg-white text-black print:border-0"
      >
        <svg
          ref={svgRef}
          style={{ height: '11.5mm', width: '100%' }}
          role="img"
          aria-label={t('Barcode {value}', { value })}
        />
        <p style={{ fontSize: '2.7mm' }} className="text-center font-mono font-semibold tracking-wider">
          {value}
        </p>
        <div style={{ fontSize: '2.6mm' }} className="text-center leading-tight">
          <p className="truncate font-semibold">
            {patientName} {demoTag ? `(${demoTag})` : ''}
          </p>
          <p className="truncate text-[2.3mm]">
            {patientMrn} · {specimen}
            {container ? ` · ${container}` : ''}
          </p>
        </div>
      </div>
    );
  }

  // Default: 50x70mm
  return (
    <div
      style={{ width: '50mm', height: '70mm', padding: '3mm' }}
      className="box-border flex flex-col items-stretch justify-start gap-[2mm] overflow-hidden border border-border bg-white text-black print:border-0"
    >
      <svg
        ref={svgRef}
        style={{ height: '20mm', width: '100%' }}
        role="img"
        aria-label={t('Barcode {value}', { value })}
      />
      <p style={{ fontSize: '3.4mm' }} className="text-center font-mono font-semibold tracking-wider">
        {value}
      </p>
      <div style={{ fontSize: '3mm' }} className="text-center leading-snug">
        <p className="truncate font-semibold">{patientName}</p>
        <p className="truncate">
          {patientMrn} {demoTag ? `· ${demoTag}` : ''}
        </p>
        <p className="mt-[1mm] truncate">
          {specimen}
          {container ? ` · ${container}` : ''}
        </p>
      </div>
    </div>
  );
}
