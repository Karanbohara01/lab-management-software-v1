import { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

interface BarcodeLabelProps {
  value: string;
  patientName: string;
  patientMrn: string;
  specimen: string;
  container?: string | null;
}

/**
 * A print-ready specimen label sized to a real 50×25mm direct-thermal label — see
 * SampleLabelPage's scoped `@page` override for the paper-size half of this; sizing here is in mm
 * (an absolute physical unit in CSS) rather than px specifically so it prints true-to-size
 * regardless of screen DPI/zoom. `overflow-hidden` so a long patient name can never push content
 * off the label instead of just truncating.
 */
export function BarcodeLabel({ value, patientName, patientMrn, specimen, container }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    try {
      JsBarcode(svg, value, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: 44,
        width: 1.6,
      });
      // JsBarcode sets width/height attributes to the barcode's native pixel size but no viewBox —
      // without one, the fixed width/height set via CSS below (a bounding box, not the barcode's
      // own aspect ratio) stretches the two axes independently instead of scaling proportionally,
      // visibly distorting the bars. Copying the native size into a viewBox lets the SVG's default
      // preserveAspectRatio ("meet") scale it to fit the box without distortion.
      const w = svg.getAttribute('width');
      const h = svg.getAttribute('height');
      if (w && h) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    } catch {
      /* invalid value — leave the SVG empty */
    }
  }, [value]);

  return (
    <div
      style={{ width: '50mm', height: '25mm', padding: '1.5mm' }}
      className="box-border flex flex-col justify-center overflow-hidden border border-border bg-white text-black print:border-0"
    >
      <svg ref={svgRef} style={{ height: '9mm', width: '100%' }} role="img" aria-label={`Barcode ${value}`} />
      <p style={{ fontSize: '2.6mm', marginTop: '0.5mm' }} className="text-center font-mono font-semibold tracking-wider">
        {value}
      </p>
      <div style={{ fontSize: '2.2mm', marginTop: '0.5mm' }} className="leading-tight">
        <p className="truncate font-semibold">
          {patientName} <span className="font-normal">· {patientMrn}</span>
        </p>
        <p className="truncate">
          {specimen}
          {container ? ` · ${container}` : ''}
        </p>
      </div>
    </div>
  );
}
