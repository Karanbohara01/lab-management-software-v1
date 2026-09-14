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
 * A print-ready specimen label sized to a real 50×70mm direct-thermal label (the physical stock
 * loaded in the lab's printer — see SampleLabelPage's scoped `@page` override for the paper-size
 * half of this) — sizing here is in mm (an absolute physical unit in CSS) rather than px
 * specifically so it prints true-to-size regardless of screen DPI/zoom. `overflow-hidden` so a
 * long patient name can never push content off the label instead of just truncating.
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
      // JsBarcode sets width/height attributes to the barcode's native pixel size (as "144px", NOT
      // a bare number — parseFloat strips that) but no viewBox. Without one, the fixed width/height
      // set via CSS below (a bounding box, not the barcode's own aspect ratio) either stretches the
      // two axes independently (distorting the bars) or, if viewBox is malformed (e.g. keeping the
      // "px" suffix — confirmed live: the browser silently ignores an invalid viewBox rather than
      // erroring), renders at native pixel size anchored top-left instead of scaling to fill the
      // box at all. Copying the native size into a *valid* viewBox lets the SVG's default
      // preserveAspectRatio ("meet") scale and center it into the box correctly.
      const w = parseFloat(svg.getAttribute('width') ?? '');
      const h = parseFloat(svg.getAttribute('height') ?? '');
      if (w > 0 && h > 0) svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    } catch {
      /* invalid value — leave the SVG empty */
    }
  }, [value]);

  return (
    <div
      style={{ width: '50mm', height: '70mm', padding: '3mm' }}
      className="box-border flex flex-col items-stretch justify-center gap-[2mm] overflow-hidden border border-border bg-white text-black print:border-0"
    >
      <svg ref={svgRef} style={{ height: '20mm', width: '100%' }} role="img" aria-label={`Barcode ${value}`} />
      <p style={{ fontSize: '3.4mm' }} className="text-center font-mono font-semibold tracking-wider">
        {value}
      </p>
      <div style={{ fontSize: '3mm' }} className="text-center leading-snug">
        <p className="truncate font-semibold">{patientName}</p>
        <p className="truncate">{patientMrn}</p>
        <p className="mt-[1mm] truncate">
          {specimen}
          {container ? ` · ${container}` : ''}
        </p>
      </div>
    </div>
  );
}
