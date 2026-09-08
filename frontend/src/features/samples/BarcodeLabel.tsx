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
 * A print-ready specimen label. The barcode is rendered as inline SVG (Code 128) so it
 * scales crisply and prints without a raster step. Designed to sit on a ~50×25mm label.
 */
export function BarcodeLabel({ value, patientName, patientMrn, specimen, container }: BarcodeLabelProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current) return;
    try {
      JsBarcode(svgRef.current, value, {
        format: 'CODE128',
        displayValue: false,
        margin: 0,
        height: 44,
        width: 1.6,
      });
    } catch {
      /* invalid value — leave the SVG empty */
    }
  }, [value]);

  return (
    <div className="inline-block rounded-md border border-border bg-white p-3 text-black">
      <svg ref={svgRef} className="block h-12 w-full" role="img" aria-label={`Barcode ${value}`} />
      <p className="mt-1 text-center font-mono text-sm font-semibold tracking-wider">{value}</p>
      <div className="mt-1 text-[11px] leading-tight">
        <p className="font-semibold">
          {patientName} <span className="font-normal">· {patientMrn}</span>
        </p>
        <p>
          {specimen}
          {container ? ` · ${container}` : ''}
        </p>
      </div>
    </div>
  );
}
